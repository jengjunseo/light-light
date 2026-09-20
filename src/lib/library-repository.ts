import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEMO_LIBRARY } from "./demo-data";
import type { LibrarySnapshot, Memo, Series, Work } from "./types";

export type RepositoryMode = "browser" | "supabase";

export interface LibraryRepository {
  mode: RepositoryMode;
  load(): Promise<LibrarySnapshot>;
  saveSeries(series: Series): Promise<void>;
  deleteSeries(id: string): Promise<void>;
  saveWork(work: Work): Promise<void>;
  deleteWork(id: string): Promise<void>;
  saveMemo(memo: Memo): Promise<void>;
  deleteMemo(id: string): Promise<void>;
}

const STORAGE_KEY = "light-novel-collection:v1";

function copyDemo(): LibrarySnapshot {
  return JSON.parse(JSON.stringify(DEMO_LIBRARY)) as LibrarySnapshot;
}

class BrowserRepository implements LibraryRepository {
  mode = "browser" as const;

  async load() {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = copyDemo();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    try {
      return JSON.parse(raw) as LibrarySnapshot;
    } catch {
      const demo = copyDemo();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
  }

  private async update(change: (snapshot: LibrarySnapshot) => void) {
    const snapshot = await this.load();
    change(snapshot);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  saveSeries(series: Series) {
    return this.update((snapshot) => {
      const index = snapshot.series.findIndex((item) => item.id === series.id);
      if (index === -1) snapshot.series.push(series);
      else snapshot.series[index] = series;
    });
  }

  deleteSeries(id: string) {
    return this.update((snapshot) => {
      snapshot.series = snapshot.series.filter((item) => item.id !== id);
      snapshot.works = snapshot.works.map((work) =>
        work.series_id === id ? { ...work, series_id: null, volume_number: null } : work,
      );
    });
  }

  saveWork(work: Work) {
    return this.update((snapshot) => {
      const index = snapshot.works.findIndex((item) => item.id === work.id);
      if (index === -1) snapshot.works.push(work);
      else snapshot.works[index] = work;
    });
  }

  deleteWork(id: string) {
    return this.update((snapshot) => {
      snapshot.works = snapshot.works.filter((item) => item.id !== id);
      snapshot.memos = snapshot.memos.filter((memo) => memo.work_id !== id);
    });
  }

  saveMemo(memo: Memo) {
    return this.update((snapshot) => {
      const index = snapshot.memos.findIndex((item) => item.id === memo.id);
      if (index === -1) snapshot.memos.push(memo);
      else snapshot.memos[index] = memo;
    });
  }

  deleteMemo(id: string) {
    return this.update((snapshot) => {
      snapshot.memos = snapshot.memos.filter((item) => item.id !== id);
    });
  }
}

class SupabaseRepository implements LibraryRepository {
  mode = "supabase" as const;
  constructor(private client: SupabaseClient) {}

  async load(): Promise<LibrarySnapshot> {
    const [seriesResult, worksResult, memosResult] = await Promise.all([
      this.client.from("series").select("*").order("created_at", { ascending: true }),
      this.client.from("works").select("*").order("updated_at", { ascending: false }),
      this.client.from("memos").select("*").order("updated_at", { ascending: false }),
    ]);
    const error = seriesResult.error ?? worksResult.error ?? memosResult.error;
    if (error) throw error;
    return {
      series: (seriesResult.data ?? []) as Series[],
      works: (worksResult.data ?? []) as Work[],
      memos: (memosResult.data ?? []) as Memo[],
    };
  }

  async saveSeries(series: Series) {
    const { error } = await this.client.from("series").upsert(series);
    if (error) throw error;
  }

  async deleteSeries(id: string) {
    const { error } = await this.client.from("series").delete().eq("id", id);
    if (error) throw error;
  }

  async saveWork(work: Work) {
    const { error } = await this.client.from("works").upsert(work);
    if (error) throw error;
  }

  async deleteWork(id: string) {
    const { error } = await this.client.from("works").delete().eq("id", id);
    if (error) throw error;
  }

  async saveMemo(memo: Memo) {
    const { error } = await this.client.from("memos").upsert(memo);
    if (error) throw error;
  }

  async deleteMemo(id: string) {
    const { error } = await this.client.from("memos").delete().eq("id", id);
    if (error) throw error;
  }
}

export function createLibraryRepository(): LibraryRepository {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key) return new SupabaseRepository(createClient(url, key));
  return new BrowserRepository();
}
