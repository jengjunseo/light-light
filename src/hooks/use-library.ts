"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createLibraryRepository, type RepositoryMode } from "@/lib/library-repository";
import type { LibrarySnapshot, Memo, Series, Work } from "@/lib/types";

const EMPTY: LibrarySnapshot = { series: [], works: [], memos: [] };

export function useLibrary() {
  const repository = useMemo(() => createLibraryRepository(), []);
  const [library, setLibrary] = useState<LibrarySnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setError("");
      setLibrary(await repository.load());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "컬렉션을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  const saveSeries = useCallback(
    async (series: Series) => {
      setLibrary((current) => ({
        ...current,
        series: current.series.some((item) => item.id === series.id)
          ? current.series.map((item) => (item.id === series.id ? series : item))
          : [...current.series, series],
      }));
      try {
        await repository.saveSeries(series);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "시리즈를 저장하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  const deleteSeries = useCallback(
    async (id: string) => {
      setLibrary((current) => ({
        ...current,
        series: current.series.filter((item) => item.id !== id),
        works: current.works.map((work) =>
          work.series_id === id ? { ...work, series_id: null, volume_number: null } : work,
        ),
      }));
      try {
        await repository.deleteSeries(id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "시리즈를 삭제하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  const saveWork = useCallback(
    async (work: Work) => {
      setLibrary((current) => ({
        ...current,
        works: current.works.some((item) => item.id === work.id)
          ? current.works.map((item) => (item.id === work.id ? work : item))
          : [work, ...current.works],
      }));
      try {
        await repository.saveWork(work);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "작품을 저장하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  const deleteWork = useCallback(
    async (id: string) => {
      setLibrary((current) => ({
        ...current,
        works: current.works.filter((item) => item.id !== id),
        memos: current.memos.filter((memo) => memo.work_id !== id),
      }));
      try {
        await repository.deleteWork(id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "작품을 삭제하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  const saveMemo = useCallback(
    async (memo: Memo) => {
      setLibrary((current) => ({
        ...current,
        memos: current.memos.some((item) => item.id === memo.id)
          ? current.memos.map((item) => (item.id === memo.id ? memo : item))
          : [memo, ...current.memos],
      }));
      try {
        await repository.saveMemo(memo);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "메모를 저장하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  const deleteMemo = useCallback(
    async (id: string) => {
      setLibrary((current) => ({
        ...current,
        memos: current.memos.filter((item) => item.id !== id),
      }));
      try {
        await repository.deleteMemo(id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "메모를 삭제하지 못했습니다.");
        await refresh();
      }
    },
    [refresh, repository],
  );

  return {
    library,
    loading,
    error,
    clearError: () => setError(""),
    mode: repository.mode as RepositoryMode,
    saveSeries,
    deleteSeries,
    saveWork,
    deleteWork,
    saveMemo,
    deleteMemo,
  };
}
