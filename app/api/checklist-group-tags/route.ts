import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKLIST_GROUPS_PATH =
  "emdc-state/checklist-groups/all.json";

const cleanText = (value: unknown, maxLength: number) =>
  String(value || "").trim().slice(0, maxLength);

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
      });
    }

    const raw = await new Response(result.stream).text();
    const parsed = JSON.parse(raw || "[]");

    const source = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.checklistGroups)
        ? parsed.checklistGroups
        : [];

    const groups = source
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

    return NextResponse.json(
      {
        ok: true,
        groups,
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
