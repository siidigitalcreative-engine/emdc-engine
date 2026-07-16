import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_GROUPS_PATH =
  "emdc-state/checklist-groups/all.json";

const cleanText = (value: unknown, maxLength: number) =>
  String(value || "").trim().slice(0, maxLength);

const normalizeGroups = (value: unknown) => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as any)?.checklistGroups)
      ? (value as any).checklistGroups
      : [];

  return source
    .map((group: any) => ({
      id: cleanText(
        group?.id ||
          group?.groupId ||
          group?.checklistGroupId ||
          group?.key,
        180
      ),
      name: cleanText(
        group?.groupName ||
          group?.name ||
          group?.title ||
          group?.projectName,
        240
      ),
    }))
    .filter(
      (group: { id: string; name: string }) =>
        group.id && group.name
    )
    .sort(
      (
        left: { name: string },
        right: { name: string }
      ) => left.name.localeCompare(right.name)
    );
};

export async function GET() {
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
      return NextResponse.json({
        ok: true,
        groups: [],
        count: 0,
      });
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw || "[]");
    const groups = normalizeGroups(parsed);

    return NextResponse.json(
      {
        ok: true,
        groups,
        count: groups.length,
      },
      {
        headers: {
          "Cache-Control":
            "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to load checklist groups.",
      },
      { status: 500 }
    );
  }
}

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
