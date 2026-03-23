import { NextRequest, NextResponse } from "next/server";
import { fetchAllActiveFtsTenders } from "@/lib/fts";
import { runSyncRoute, SOURCE_IDS } from "@/lib/sync-utils";

export const maxDuration = 60;

async function run(req: NextRequest) {
  return runSyncRoute(req, SOURCE_IDS.fts, () =>
    fetchAllActiveFtsTenders({ maxPages: 10, pageSize: 100, delayMs: 200 })
  );
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
