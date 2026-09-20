"use client";

import { Link2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog } from "./dialog";
import { STATUS_LABELS, type CustomLink, type Series, type Work, type WorkStatus } from "@/lib/types";

function emptyWork(): Work {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    series_id: null,
    volume_number: null,
    title: "",
    status: "unread",
    cover_image_url: "",
    synopsis_source: "",
    synopsis_generated: "",
    namuwiki_url: "",
    google_search_url: "",
    custom_links: [],
    created_at: now,
    updated_at: now,
  };
}

export function WorkEditor({
  work,
  series,
  onSave,
  onClose,
}: {
  work?: Work;
  series: Series[];
  onSave: (work: Work) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Work>(() => (work ? structuredClone(work) : emptyWork()));

  const updateLink = (id: string, patch: Partial<CustomLink>) => {
    setDraft((current) => ({
      ...current,
      custom_links: current.custom_links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    }));
  };

  return (
    <Dialog title={work ? "작품 편집" : "새 작품"} onClose={onClose} size="wide">
      <form
        className="editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          const title = draft.title.trim();
          if (!title) return;
          onSave({
            ...draft,
            title,
            volume_number: draft.series_id ? draft.volume_number : null,
            custom_links: draft.custom_links.filter((link) => link.url.trim()),
            updated_at: new Date().toISOString(),
          });
          onClose();
        }}
      >
        <header className="dialog-heading">
          <span className="eyebrow">COLLECTION ENTRY</span>
          <h2>{work ? "작품 정보 편집" : "새 작품 기록"}</h2>
          <p>필요한 것부터 가볍게 채우세요. 제목만으로도 저장할 수 있습니다.</p>
        </header>

        <div className="form-grid two-columns">
          <label className="field field-wide">
            <span>작품 제목 <b>*</b></span>
            <input
              autoFocus
              required
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="예: 약사의 혼잣말 3"
            />
          </label>
          <label className="field">
            <span>시리즈</span>
            <select
              value={draft.series_id ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  series_id: event.target.value || null,
                  volume_number: event.target.value ? draft.volume_number : null,
                })
              }
            >
              <option value="">단권 / 미분류</option>
              {series.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>권 번호</span>
            <input
              type="number"
              min="0"
              step="1"
              disabled={!draft.series_id}
              value={draft.volume_number ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, volume_number: event.target.value ? Number(event.target.value) : null })
              }
              placeholder="1"
            />
          </label>
          <label className="field">
            <span>읽기 상태</span>
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value as WorkStatus })}
            >
              {(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>표지 이미지 URL</span>
            <input
              type="url"
              value={draft.cover_image_url}
              onChange={(event) => setDraft({ ...draft, cover_image_url: event.target.value })}
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="field custom-links-editor">
          <div className="field-row-heading">
            <span><Link2 size={15} /> 참고 링크</span>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  custom_links: [...draft.custom_links, { id: crypto.randomUUID(), label: "", url: "" }],
                })
              }
            >
              <Plus size={15} /> 링크 추가
            </button>
          </div>
          {draft.custom_links.length === 0 ? (
            <p className="field-hint">서점, 출판사, 감상 참고 페이지를 여러 개 저장할 수 있습니다.</p>
          ) : (
            <div className="custom-link-rows">
              {draft.custom_links.map((link) => (
                <div className="custom-link-row" key={link.id}>
                  <input
                    aria-label="링크 이름"
                    value={link.label}
                    onChange={(event) => updateLink(link.id, { label: event.target.value })}
                    placeholder="링크 이름"
                  />
                  <input
                    aria-label="URL"
                    type="url"
                    value={link.url}
                    onChange={(event) => updateLink(link.id, { url: event.target.value })}
                    placeholder="https://..."
                  />
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, custom_links: draft.custom_links.filter((item) => item.id !== link.id) })
                    }
                    aria-label="링크 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="dialog-actions">
          <button className="button secondary" type="button" onClick={onClose}>취소</button>
          <button className="button primary" type="submit">{work ? "변경사항 저장" : "컬렉션에 추가"}</button>
        </footer>
      </form>
    </Dialog>
  );
}
