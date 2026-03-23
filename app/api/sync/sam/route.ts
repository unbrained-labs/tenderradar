import { NextRequest, NextResponse } from "next/server";
import { fetchAllActiveSamOpportunities } from "@/lib/sam";
import { runSyncRoute, SOURCE_IDS } from "@/lib/sync-utils";

export const maxDuration = 60;

async function run(req: NextRequest) {
  if (!process.env.SAM_GOV_API_KEY) {
    return NextResponse.json(
      { error: "SAM_GOV_API_KEY not configured. Register at sam.gov (takes 1-4 days)." },
      { status: 503 }
    );
  }
  return runSyncRoute(req, SOURCE_IDS.sam, () =>
    fetchAllActiveSamOpportunities({ maxPages: 10, pageSize: 100, delayMs: 100 })
  );
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
