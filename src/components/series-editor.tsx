"use client";

import { useState } from "react";
import { Dialog } from "./dialog";
import type { Series } from "@/lib/types";

export function SeriesEditor({
  series,
  onSave,
  onClose,
}: {
  series?: Series;
  onSave: (series: Series) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(series?.title ?? "");
  const [description, setDescription] = useState(series?.description ?? "");

  return (
    <Dialog title={series ? "시리즈 편집" : "새 시리즈"} onClose={onClose}>
      <form
        className="editor-form compact-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSave({
            id: series?.id ?? crypto.randomUUID(),
            title: title.trim(),
            description: description.trim(),
            created_at: series?.created_at ?? new Date().toISOString(),
          });
          onClose();
        }}
      >
        <header className="dialog-heading">
          <span className="eyebrow">SERIES SHELF</span>
          <h2>{series ? "시리즈 정보 편집" : "새 시리즈 만들기"}</h2>
          <p>같은 이야기의 여러 권을 하나의 선반에 정리합니다.</p>
        </header>
        <label className="field">
          <span>시리즈명 <b>*</b></span>
          <input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="시리즈명" />
        </label>
        <label className="field">
          <span>짧은 설명</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="이 시리즈를 기억할 한 문장" />
        </label>
        <footer className="dialog-actions">
          <button className="button secondary" type="button" onClick={onClose}>취소</button>
          <button className="button primary" type="submit">시리즈 저장</button>
        </footer>
      </form>
    </Dialog>
  );
}
