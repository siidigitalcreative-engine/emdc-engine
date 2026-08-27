import { NextRequest, NextResponse } from "next/server";
import { get, put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STORE_PATH = "campaign-planner/campaigns.json";

type CampaignRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  brief?: any;
  products?: any[];
  plan?: any;
  lockedSections?: string[];
};

async function streamToText(stream: any) {
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

async function readCampaigns(): Promise<CampaignRecord[]> {
  try {
    const result: any = await get(STORE_PATH, { access: "private" } as any);
    const text = await streamToText(result?.stream);
    if (!text) return [];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCampaigns(campaigns: CampaignRecord[]) {
  await put(STORE_PATH, JSON.stringify(campaigns), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
    allowOverwrite: true,
  } as any);
}

function safeId(value: any) {
  const source = String(value || "").trim();
  if (source && /^[a-zA-Z0-9_-]{4,100}$/.test(source)) return source;
  return `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    const campaigns = await readCampaigns();

    if (id) {
      const campaign = campaigns.find((item) => item.id === id);
      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
      }
      return NextResponse.json({ campaign }, { headers: { "Cache-Control": "no-store" } });
    }

    const list = campaigns
      .map((item) => ({
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        theme: item?.brief?.theme || "",
        startDate: item?.brief?.startDate || "",
        endDate: item?.brief?.endDate || "",
        productCount: Array.isArray(item.products) ? item.products.length : 0,
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return NextResponse.json({ campaigns: list }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to load campaigns." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = body?.campaign || body || {};
    const now = new Date().toISOString();
    const id = safeId(incoming?.id);
    const name = String(incoming?.name || incoming?.brief?.campaignName || "Untitled Campaign").trim();

    const campaigns = await readCampaigns();
    const existingIndex = campaigns.findIndex((item) => item.id === id);
    const existing = existingIndex >= 0 ? campaigns[existingIndex] : null;

    const record: CampaignRecord = {
      id,
      name,
      createdAt: existing?.createdAt || incoming?.createdAt || now,
      updatedAt: now,
      brief: incoming?.brief || {},
      products: Array.isArray(incoming?.products) ? incoming.products : [],
      plan: incoming?.plan || null,
      lockedSections: Array.isArray(incoming?.lockedSections) ? incoming.lockedSections : [],
    };

    if (existingIndex >= 0) campaigns[existingIndex] = record;
    else campaigns.push(record);

    await writeCampaigns(campaigns);

    return NextResponse.json({ ok: true, campaign: record });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to save campaign." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "").trim();
    if (!id) return NextResponse.json({ error: "Campaign id is required." }, { status: 400 });

    const campaigns = await readCampaigns();
    const next = campaigns.filter((item) => item.id !== id);
    if (next.length === campaigns.length) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    await writeCampaigns(next);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to delete campaign." },
      { status: 500 }
    );
  }
}

/*
LOCATION PATH: app/api/campaign-planner/route.ts
ACTION: Create this as a NEW file.
*/
