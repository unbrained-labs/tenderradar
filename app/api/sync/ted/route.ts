import { NextRequest, NextResponse } from "next/server";
import { fetchAllOpenTedNotices } from "@/lib/ted";
import { runSyncRoute, SOURCE_IDS } from "@/lib/sync-utils";

export const maxDuration = 60;

async function run(req: NextRequest) {
  return runSyncRoute(req, SOURCE_IDS.ted, () =>
    fetchAllOpenTedNotices({ maxPages: 10, pageSize: 50, delayMs: 200 })
  );
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
