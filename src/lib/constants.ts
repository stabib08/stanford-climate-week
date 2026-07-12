import type { Enums } from "./database.types";

/** Human-readable labels for every enum + tag vocabulary used in the UI. */

export const INVOLVEMENT_OPTIONS: {
  value: Enums<"involvement_role">;
  label: string;
}[] = [
  { value: "organizer", label: "SCW Organizer" },
  { value: "event_lead", label: "SCW Event Lead" },
  { value: "attendee", label: "SCW Attendee" },
  { value: "speaker", label: "SCW Speaker" },
];

export const DEGREE_OPTIONS: { value: Enums<"degree_type">; label: string }[] = [
  { value: "undergrad", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
];

export const STANFORD_YEARS = [2027, 2028, 2029, 2030] as const;

export const EXTERNAL_SECTOR_OPTIONS: {
  value: Enums<"external_sector">;
  label: string;
}[] = [
  { value: "academia", label: "Academia" },
  { value: "govt_policy", label: "Government & Policy" },
  { value: "nonprofit_public", label: "Nonprofit & Public" },
  { value: "private_company", label: "Private Company" },
  { value: "vc_investment", label: "VC & Investment" },
  { value: "independent", label: "Independent" },
];

export const CLIMATE_IDENTITY_OPTIONS: {
  value: Enums<"climate_identity">;
  label: string;
}[] = [
  { value: "inspire_indifferent", label: "Inspire the indifferent" },
  { value: "empower_engaged", label: "Empower the engaged" },
  { value: "mobilize_motivated", label: "Mobilize the motivated" },
];

export const PAIN_POINT_OPTIONS: {
  value: Enums<"climate_pain_point">;
  label: string;
}[] = [
  { value: "lack_knowledge", label: "Lack of knowledge" },
  { value: "lack_connections", label: "Lack of industry / peer connections" },
  { value: "lack_skillset", label: "Lack of a directed skillset" },
  { value: "other", label: "Other (pessimism, lack of motivation, etc.)" },
];

export const SURVEY_CATEGORY_OPTIONS: {
  value: Enums<"survey_category">;
  label: string;
}[] = [
  { value: "industry_knowledge", label: "Industry knowledge / insights" },
  { value: "peer_connections", label: "Industry / peer connections" },
  { value: "directed_skillset", label: "Developing a directed skillset" },
];

/** Event format tags (session type). */
export const FORMAT_TAGS = [
  "symposium",
  "fireside_chat",
  "lecture",
  "workshop",
  "panel",
  "keynote",
  "networking",
] as const;

/** Energy / climate sector tags. */
export const SECTOR_TAGS = [
  "deep_tech",
  "nature_based",
  "ai",
  "vc",
  "policy",
  "energy",
  "mobility",
] as const;

export const TAG_LABELS: Record<string, string> = {
  symposium: "Symposium",
  fireside_chat: "Fireside Chat",
  lecture: "Lecture",
  workshop: "Workshop",
  panel: "Panel",
  keynote: "Keynote",
  networking: "Networking",
  deep_tech: "Deep Tech",
  nature_based: "Nature-Based",
  ai: "AI",
  vc: "VC",
  policy: "Policy",
  energy: "Energy",
  mobility: "Mobility",
};

export const labelFor = (value: string): string => TAG_LABELS[value] ?? value;

/** SCW runs Oct 19–25, 2026. */
export const SCW_DATES = [
  "2026-10-19",
  "2026-10-20",
  "2026-10-21",
  "2026-10-22",
  "2026-10-23",
  "2026-10-24",
  "2026-10-25",
] as const;
