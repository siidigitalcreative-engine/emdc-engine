import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

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
      : Array.isArray((value as any)?.data?.checklistGroups)
        ? (value as any).data.checklistGroups
        : Array.isArray(
              (value as any)?.data?.appState?.checklistGroups
            )
          ? (value as any).data.appState.checklistGroups
          : [];

  const seen = new Set<string>();

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
      (group: { id: string; name: string }) => {
        if (!group.id || !group.name || seen.has(group.id)) {
          return false;
        }

        seen.add(group.id);
        return true;
      }
    )
    .sort(
      (
        left: { name: string },
        right: { name: string }
      ) => left.name.localeCompare(right.name)
    );
};

const readDirectBlob = async () => {
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
    return normalizeGroups(JSON.parse(raw || "[]"));
  } catch {
    return [];
  }
};

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;

    // Primary source: the same Sync v2 index used by the Checklists page.
    const indexResponse = await fetch(
      `${origin}/api/checklist-groups-fast?mode=index`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const indexJson = await indexResponse
      .json()
      .catch(() => null);

    let groups =
      indexResponse.ok && indexJson?.ok
        ? normalizeGroups(indexJson)
        : [];

    // Fallback 1: authoritative checklist-group Blob.
    if (!groups.length) {
      groups = await readDirectBlob();
    }

    // Fallback 2: lite bootstrap app state.
    if (!groups.length) {
      const bootstrapResponse = await fetch(
        `${origin}/api/emdc-bootstrap-lite`,
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

      if (bootstrapResponse.ok && bootstrapJson?.ok) {
        groups = normalizeGroups(bootstrapJson);
      }
    }

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
