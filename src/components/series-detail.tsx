"use client";

import { Edit3, Trash2 } from "lucide-react";
import { Cover } from "./cover";
import { Dialog } from "./dialog";
import { STATUS_LABELS, type Series, type Work } from "@/lib/types";

export function SeriesDetail({
  series,
  works,
  onClose,
  onEdit,
  onDelete,
  onOpenWork,
}: {
  series: Series;
  works: Work[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenWork: (work: Work) => void;
}) {
  const ordered = [...works].sort((a, b) => (a.volume_number ?? 9999) - (b.volume_number ?? 9999));
  const completed = ordered.filter((work) => work.status === "completed").length;
  const progress = ordered.length ? Math.round((completed / ordered.length) * 100) : 0;

  return (
    <Dialog title={`${series.title} 시리즈`} onClose={onClose} size="wide">
      <div className="series-detail">
        <header>
          <div>
            <span className="eyebrow">SERIES ARCHIVE</span>
            <h2>{series.title}</h2>
            <p>{series.description || "이 시리즈에 대한 설명이 아직 없습니다."}</p>
          </div>
          <div className="series-actions">
            <button className="button secondary" type="button" onClick={onEdit}><Edit3 size={16} /> 편집</button>
            <button
              className="button danger-button"
              type="button"
              onClick={() => {
                if (window.confirm("시리즈만 삭제할까요? 작품은 단권 선반으로 이동합니다.")) onDelete();
              }}
            >
              <Trash2 size={16} /> 삭제
            </button>
          </div>
        </header>
        <section className="series-progress-card">
          <div><span>독서 진행률</span><strong>{completed}<small> / {ordered.length}권 완독</small></strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <b>{progress}%</b>
        </section>
        <section className="volume-list">
          <div className="section-heading-row"><h3>권별 기록</h3><span className="count-badge">{ordered.length}</span></div>
          {ordered.length === 0 ? (
            <div className="empty-inline">아직 이 시리즈에 연결된 작품이 없습니다.</div>
          ) : ordered.map((work) => (
            <button className="volume-row" key={work.id} type="button" onClick={() => onOpenWork(work)}>
              <div className="volume-cover"><Cover src={work.cover_image_url} title={work.title} /></div>
              <span className="volume-number">{work.volume_number ?? "?"}<small>권</small></span>
              <span className="volume-title">{work.title}</span>
              <span className={`status-pill status-${work.status}`}>{STATUS_LABELS[work.status]}</span>
            </button>
          ))}
        </section>
      </div>
    </Dialog>
  );
}
