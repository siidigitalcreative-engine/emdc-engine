import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

export const runtime = "nodejs";

const STATE_PATH = "emdc-state/app-state.json";

const emptyState = {
  version: 1,
  updatedAt: "",
  appState: {},
  localStorage: {},
};

async function readState() {
  const result = await list({
    prefix: STATE_PATH,
    limit: 1,
  });

  const blob = result.blobs.find((item) => item.pathname === STATE_PATH) || result.blobs[0];

  if (!blob) return emptyState;

  const url = (blob as any).downloadUrl || blob.url;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) return emptyState;

  return await response.json();
}

export async function GET() {
  try {
    const data = await readState();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to read EMDC state.",
        data: emptyState,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      version: 1,
      ...body,
      updatedAt: body?.updatedAt || new Date().toISOString(),
    };

    await put(STATE_PATH, JSON.stringify(payload, null, 2), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      allowOverwrite: true,
    } as any);

    return NextResponse.json({
      ok: true,
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to save EMDC state.",
      },
      { status: 500 }
    );
  }
}
