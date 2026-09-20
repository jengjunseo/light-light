export type WorkStatus = "unread" | "reading" | "completed" | "paused";

export const STATUS_LABELS: Record<WorkStatus, string> = {
  unread: "읽고 싶음",
  reading: "읽는 중",
  completed: "완독",
  paused: "보류",
};

export type CustomLink = {
  id: string;
  label: string;
  url: string;
};

export type Series = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export type Work = {
  id: string;
  series_id: string | null;
  volume_number: number | null;
  title: string;
  status: WorkStatus;
  cover_image_url: string;
  synopsis_source: string;
  synopsis_generated: string;
  namuwiki_url: string;
  google_search_url: string;
  custom_links: CustomLink[];
  created_at: string;
  updated_at: string;
};

export type Memo = {
  id: string;
  work_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type LibrarySnapshot = {
  series: Series[];
  works: Work[];
  memos: Memo[];
};
