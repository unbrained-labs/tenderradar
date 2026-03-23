import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Profile } from "@/lib/types";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, company_name, cpv_codes, cantons, keywords, value_min, value_max, created_at, updated_at
      FROM profile
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const row = rows[0];
    const profile: Profile = {
      id:           String(row.id),
      company_name: String(row.company_name ?? ""),
      cpv_codes:    Array.isArray(row.cpv_codes) ? row.cpv_codes as string[] : [],
      cantons:      Array.isArray(row.cantons) ? row.cantons as string[] : [],
      keywords:     Array.isArray(row.keywords) ? row.keywords as string[] : [],
      value_min:    row.value_min != null ? Number(row.value_min) : null,
      value_max:    row.value_max != null ? Number(row.value_max) : null,
      created_at:   String(row.created_at ?? ""),
      updated_at:   String(row.updated_at ?? ""),
    };

    return NextResponse.json(profile);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_name,
      cpv_codes = [],
      cantons = [],
      keywords = [],
      value_min = null,
      value_max = null,
    } = body;

    const rows = await sql`
      UPDATE profile
      SET
        company_name = ${company_name ?? ""},
        cpv_codes    = ${JSON.stringify(cpv_codes)},
        cantons      = ${JSON.stringify(cantons)},
        keywords     = ${JSON.stringify(keywords)},
        value_min    = ${value_min},
        value_max    = ${value_max},
        updated_at   = NOW()
      RETURNING id, company_name, cpv_codes, cantons, keywords, value_min, value_max, created_at, updated_at
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
