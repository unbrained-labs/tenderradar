import { NextRequest, NextResponse } from "next/server";
import { fetchAllOpenTenders } from "@/lib/simap";
import { runSyncRoute, SOURCE_IDS } from "@/lib/sync-utils";

export const maxDuration = 60;

async function run(req: NextRequest) {
  return runSyncRoute(req, SOURCE_IDS.simap, () =>
    fetchAllOpenTenders({ maxPages: 10, pageSize: 20, delayMs: 200 })
  );
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
