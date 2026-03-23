export interface Canton {
  code: string;
  name: string;
  nameFr?: string;
  nameIt?: string;
  region: "german" | "french" | "italian" | "bilingual";
}

export const CANTONS: Canton[] = [
  { code: "ZH", name: "Zürich", region: "german" },
  { code: "BE", name: "Bern / Berne", nameFr: "Berne", region: "bilingual" },
  { code: "LU", name: "Luzern", region: "german" },
  { code: "UR", name: "Uri", region: "german" },
  { code: "SZ", name: "Schwyz", region: "german" },
  { code: "OW", name: "Obwalden", region: "german" },
  { code: "NW", name: "Nidwalden", region: "german" },
  { code: "GL", name: "Glarus", region: "german" },
  { code: "ZG", name: "Zug", region: "german" },
  { code: "FR", name: "Fribourg / Freiburg", nameFr: "Fribourg", region: "bilingual" },
  { code: "SO", name: "Solothurn", region: "german" },
  { code: "BS", name: "Basel-Stadt", region: "german" },
  { code: "BL", name: "Basel-Landschaft", region: "german" },
  { code: "SH", name: "Schaffhausen", region: "german" },
  { code: "AR", name: "Appenzell Ausserrhoden", region: "german" },
  { code: "AI", name: "Appenzell Innerrhoden", region: "german" },
  { code: "SG", name: "St. Gallen", region: "german" },
  { code: "GR", name: "Graubünden / Grischun", nameIt: "Grigioni", region: "bilingual" },
  { code: "AG", name: "Aargau", region: "german" },
  { code: "TG", name: "Thurgau", region: "german" },
  { code: "TI", name: "Ticino", nameIt: "Ticino", region: "italian" },
  { code: "VD", name: "Vaud", nameFr: "Vaud", region: "french" },
  { code: "VS", name: "Valais / Wallis", nameFr: "Valais", region: "bilingual" },
  { code: "NE", name: "Neuchâtel", nameFr: "Neuchâtel", region: "french" },
  { code: "GE", name: "Genève", nameFr: "Genève", region: "french" },
  { code: "JU", name: "Jura", nameFr: "Jura", region: "french" },
];

export const CANTON_MAP = Object.fromEntries(
  CANTONS.map((c) => [c.code, c])
);

// Alpine cantons — useful default for construction use case
export const ALPINE_CANTONS = ["GR", "VS", "TI", "UR", "SZ", "GL", "OW", "NW", "BE"];

export function getCantonName(code: string): string {
  return CANTON_MAP[code]?.name ?? code;
}

export function getCantonLanguage(code: string): Canton["region"] | null {
  return CANTON_MAP[code]?.region ?? null;
}
