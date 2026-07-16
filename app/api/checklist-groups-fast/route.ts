import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_GROUPS_PATH =
  "emdc-state/checklist-groups/all.json";

const readExistingGroups = async (): Promise<any[]> => {
  try {
    const result = await get(CHECKLIST_GROUPS_PATH, {
      access: "private",
      useCache: false,
    });

    if (
      !result ||
      result.statusCode === 304 ||
      !result.stream
    ) {
      return [];
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw || "[]");

    return Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.checklistGroups)
        ? parsed.checklistGroups
        : [];
  } catch {
    return [];
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const checklistGroups = Array.isArray(
      body?.checklistGroups
    )
      ? body.checklistGroups
      : [];

    const updatedAt =
      typeof body?.updatedAt === "string" &&
      body.updatedAt
        ? body.updatedAt
        : new Date().toISOString();

    const allowEmptyOverwrite =
      body?.allowEmptyOverwrite === true;

    // Safety guard:
    // only perform a Blob read when an empty array is about to be saved.
    // This prevents a temporary empty client state from deleting every
    // checklist group, while keeping normal non-empty saves fast.
    if (
      checklistGroups.length === 0 &&
      !allowEmptyOverwrite
    ) {
      const existingGroups = await readExistingGroups();

      if (existingGroups.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            protected: true,
            error:
              "Blocked an accidental empty checklist-group overwrite.",
            existingCount: existingGroups.length,
          },
          { status: 409 }
        );
      }
    }

    await put(
      CHECKLIST_GROUPS_PATH,
      JSON.stringify(checklistGroups),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      }
    );

    return NextResponse.json({
      ok: true,
      mode: "checklist-groups-fast",
      updatedAt,
      count: checklistGroups.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to save checklist groups.",
      },
      { status: 500 }
    );
  }
}
