export interface Attachment {
  name: string;
  url: string;
  size_bytes?: number;
  type?: string;
}

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export type TenderStatus = "active" | "cancelled" | "awarded" | "expired";
export type TrackerStatus = "new" | "reviewing" | "bid" | "no_bid" | "submitted" | "won" | "lost";

export interface Tender {
  id: string;
  source_id: string;
  title: string;
  description: string | null;
  issuer_name: string;
  issuer_country: string | null;
  issuer_region: string | null;
  cpv_codes: string[];
  posted_date: string;
  response_deadline: string | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  currency: string;
  status: TenderStatus;
  source_url: string;
  attachments: Attachment[];
  contacts: Contact[];
  created_at: string;
  updated_at: string;
}

export interface TrackedTender {
  id: string;
  tender_id: string;
  tender?: Tender;
  status: TrackerStatus;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  company_name: string;
  cpv_codes: string[];
  cantons: string[];
  keywords: string[];
  value_min: number | null;
  value_max: number | null;
  created_at: string;
  updated_at: string;
}

/** Shape returned by all four source normalizers — maps directly to the tenders table */
export interface NormalizedTender {
  source_id: string;
  title: string;
  description: string | null;
  issuer_name: string;
  issuer_country: string | null;
  issuer_region: string | null;
  cpv_codes: string[];
  posted_date: string | null;
  response_deadline: string | null;
  estimated_value_min: number | null;
  estimated_value_max: number | null;
  currency: string;
  status: TenderStatus;
  source_url: string;
  attachments: Attachment[];
  contacts: Contact[];
  raw: unknown;
}

export interface TenderMatch extends Tender {
  match_score: number;
  match_reasons: string[];
}

export interface FilterParams {
  keyword?: string;
  cantons?: string[];
  cpv_prefix?: string;
  deadline_from?: string;
  deadline_to?: string;
  value_min?: number;
  value_max?: number;
  status?: TenderStatus;
  page?: number;
  page_size?: number;
}
