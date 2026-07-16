import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_GROUPS_PATH =
  "emdc-state/checklist-groups/all.json";

const readJsonBlob = async () => {
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
      return null;
    }

    const raw = await new Response(result.stream).text();
    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
};

const extractChecklistGroups = (value: any): any[] => {
  const candidates = [
    value,
    value?.checklistGroups,
    value?.data?.checklistGroups,
    value?.data?.appState?.checklistGroups,
    value?.appState?.checklistGroups,
    value?.state?.checklistGroups,
    value?.payload?.checklistGroups,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const saveChecklistGroups = async (groups: any[]) => {
  await put(
    CHECKLIST_GROUPS_PATH,
    JSON.stringify(groups),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
    }
  );
};

export async function GET(request: NextRequest) {
  try {
    const direct = await readJsonBlob();
    let checklistGroups = extractChecklistGroups(direct);
    let recovered = false;

    // Auto-recover only when the authoritative file is empty.
    if (!checklistGroups.length) {
      const bootstrapResponse = await fetch(
        `${request.nextUrl.origin}/api/emdc-bootstrap-lite?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        }
      );

      const bootstrapJson = await bootstrapResponse
        .json()
        .catch(() => null);

      const recoveredGroups = bootstrapResponse.ok
        ? extractChecklistGroups(bootstrapJson)
        : [];

      if (recoveredGroups.length) {
        checklistGroups = recoveredGroups;
        await saveChecklistGroups(checklistGroups);
        recovered = true;
      }
    }

    return NextResponse.json(
      {
        ok: true,
        mode: "checklist-groups-fast",
        checklistGroups,
        groups: checklistGroups,
        count: checklistGroups.length,
        recovered,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const checklistGroups = Array.isArray(
      body?.checklistGroups
    )
      ? body.checklistGroups
      : [];

    const allowEmptyOverwrite =
      body?.allowEmptyOverwrite === true;

    // Prevent temporary empty UI state from deleting cloud groups.
    if (
      checklistGroups.length === 0 &&
      !allowEmptyOverwrite
    ) {
      const current = extractChecklistGroups(
        await readJsonBlob()
      );

      if (current.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            protected: true,
            existingCount: current.length,
            error:
              "Blocked an accidental empty checklist-group overwrite.",
          },
          { status: 409 }
        );
      }
    }

    await saveChecklistGroups(checklistGroups);

    return NextResponse.json({
      ok: true,
      mode: "checklist-groups-fast",
      count: checklistGroups.length,
      updatedAt:
        typeof body?.updatedAt === "string"
          ? body.updatedAt
          : new Date().toISOString(),
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
