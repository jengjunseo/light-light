"use client";

import {
  ArrowUpRight,
  Bot,
  Check,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Cover } from "./cover";
import { Dialog } from "./dialog";
import { STATUS_LABELS, type Memo, type Series, type Work, type WorkStatus } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function MemoEditor({ memo, onSave, onDelete }: { memo: Memo; onSave: (memo: Memo) => void; onDelete: () => void }) {
  const [content, setContent] = useState(memo.content);
  const [saved, setSaved] = useState(true);
  const first = useRef(true);
  const persistContent = useEffectEvent((nextContent: string) => {
    onSave({ ...memo, content: nextContent, updated_at: new Date().toISOString() });
  });

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaved(false);
    const timer = window.setTimeout(() => {
      persistContent(content);
      setSaved(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [content]);

  return (
    <article className="memo-card">
      <textarea
        aria-label="메모 내용"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onBlur={() => {
          if (content !== memo.content) {
            onSave({ ...memo, content, updated_at: new Date().toISOString() });
            setSaved(true);
          }
        }}
      />
      <footer>
        <span className={saved ? "save-state saved" : "save-state"}>
          {saved ? <Check size={13} /> : <Clock3 size={13} />} {saved ? "저장됨" : "저장 중…"}
        </span>
        <span>{formatDate(memo.updated_at)}</span>
        <button type="button" className="memo-delete" onClick={onDelete} aria-label="메모 삭제"><Trash2 size={14} /></button>
      </footer>
    </article>
  );
}

function QuickMemo({ workId, onSave }: { workId: string; onSave: (memo: Memo) => void }) {
  const [content, setContent] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const activeIdRef = useRef<string | null>(null);
  const persistMemo = useEffectEvent((memo: Memo) => onSave(memo));

  useEffect(() => {
    if (!content.trim()) return;
    const timer = window.setTimeout(() => {
      const now = new Date().toISOString();
      const id = activeIdRef.current ?? crypto.randomUUID();
      if (!activeIdRef.current) {
        activeIdRef.current = id;
        setActiveId(id);
      }
      persistMemo({ id, work_id: workId, content: content.trim(), created_at: now, updated_at: now });
      setSaved(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [content, workId]);

  const saveImmediately = () => {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const id = activeIdRef.current ?? crypto.randomUUID();
    activeIdRef.current = id;
    setActiveId(id);
    onSave({ id, work_id: workId, content: content.trim(), created_at: now, updated_at: now });
    setSaved(true);
  };

  return (
    <div className="quick-memo">
      <textarea
        value={content}
        onChange={(event) => { setContent(event.target.value); setSaved(false); }}
        onBlur={saveImmediately}
        placeholder="떠오른 문장, 감상, 인용구를 바로 남겨보세요…"
        aria-label="빠른 메모"
      />
      <footer>
        <span className={saved ? "save-state saved" : "save-state"}>
          {saved ? <Check size={13} /> : <Clock3 size={13} />} {content ? (saved ? "자동 저장됨" : "자동 저장 중…") : "입력하면 자동 저장"}
        </span>
        {activeId && (
          <button className="text-button" type="button" onClick={() => { activeIdRef.current = null; setContent(""); setActiveId(null); setSaved(true); }}>
            <Plus size={14} /> 새 메모
          </button>
        )}
      </footer>
    </div>
  );
}

export function WorkDetail({
  work,
  series,
  memos,
  onClose,
  onEdit,
  onSaveWork,
  onDeleteWork,
  onSaveMemo,
  onDeleteMemo,
}: {
  work: Work;
  series?: Series;
  memos: Memo[];
  onClose: () => void;
  onEdit: () => void;
  onSaveWork: (work: Work) => void;
  onDeleteWork: () => void;
  onSaveMemo: (memo: Memo) => void;
  onDeleteMemo: (id: string) => void;
}) {
  const [synopsis, setSynopsis] = useState(work.synopsis_generated);
  const [sourceType, setSourceType] = useState<"text" | "url">("text");
  const [source, setSource] = useState(work.synopsis_source);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const sortedMemos = useMemo(() => [...memos].sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [memos]);
  const encodedTitle = encodeURIComponent(work.title);
  const namuUrl = work.namuwiki_url || `https://namu.wiki/Search?q=${encodedTitle}`;
  const googleUrl = work.google_search_url || `https://www.google.com/search?q=${encodedTitle}`;

  const saveSynopsis = () => {
    onSaveWork({ ...work, synopsis_source: source, synopsis_generated: synopsis, updated_at: new Date().toISOString() });
  };

  const generateSynopsis = async () => {
    if (!source.trim()) {
      setAiError(sourceType === "url" ? "참고 URL을 입력해 주세요." : "줄거리 참고 텍스트를 입력해 주세요.");
      return;
    }
    setGenerating(true);
    setAiError("");
    try {
      const response = await fetch("/api/synopsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, source, title: work.title }),
      });
      const data = (await response.json()) as { synopsis?: string; error?: string };
      if (!response.ok || !data.synopsis) throw new Error(data.error || "소개글을 생성하지 못했습니다.");
      setSynopsis(data.synopsis);
    } catch (cause) {
      setAiError(cause instanceof Error ? cause.message : "AI 요청 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog title={`${work.title} 상세`} onClose={onClose} size="wide">
      <div className="work-detail">
        <header className="work-detail-hero">
          <div className="detail-cover">
            <Cover src={work.cover_image_url} title={work.title} priority />
          </div>
          <div className="detail-title-block">
            <span className="eyebrow">{series ? `${series.title} · ${work.volume_number ?? "?"}권` : "STANDALONE"}</span>
            <h2>{work.title}</h2>
            <div className="status-picker" aria-label="읽기 상태 변경">
              {(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`status-pill status-${status} ${work.status === status ? "active" : ""}`}
                  onClick={() => onSaveWork({ ...work, status, updated_at: new Date().toISOString() })}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            <p className="updated-label">최근 업데이트 {formatDate(work.updated_at)}</p>
            <div className="detail-hero-actions">
              <button className="button secondary" type="button" onClick={onEdit}><Edit3 size={16} /> 작품 정보 편집</button>
              <button
                className="button danger-button"
                type="button"
                onClick={() => {
                  if (window.confirm(`“${work.title}”과 연결된 메모를 모두 삭제할까요?`)) onDeleteWork();
                }}
              >
                <Trash2 size={16} /> 삭제
              </button>
            </div>
          </div>
        </header>

        <div className="detail-content-grid">
          <main>
            <section className="detail-section">
              <div className="section-heading-row">
                <div>
                  <span className="eyebrow">SYNOPSIS</span>
                  <h3>작품 소개</h3>
                </div>
                <button className="text-button" type="button" onClick={saveSynopsis}><Save size={15} /> 소개글 저장</button>
              </div>
              <textarea
                className="synopsis-editor"
                value={synopsis}
                onChange={(event) => setSynopsis(event.target.value)}
                placeholder="직접 소개글을 작성하거나 AI 초안을 만들어 보세요."
              />
            </section>

            <section className="detail-section ai-studio">
              <div className="ai-title">
                <span className="ai-icon"><Sparkles size={18} /></span>
                <div>
                  <span className="eyebrow">AI DRAFT STUDIO</span>
                  <h3>소개글 초안 만들기</h3>
                </div>
              </div>
              <div className="segmented-control">
                <button type="button" className={sourceType === "text" ? "active" : ""} onClick={() => setSourceType("text")}><FileText size={15} /> 참고 텍스트</button>
                <button type="button" className={sourceType === "url" ? "active" : ""} onClick={() => setSourceType("url")}><Link2 size={15} /> 참고 URL</button>
              </div>
              {sourceType === "url" ? (
                <input className="ai-source-input" type="url" value={source} onChange={(event) => setSource(event.target.value)} placeholder="https://example.com/book" />
              ) : (
                <textarea className="ai-source" value={source} onChange={(event) => setSource(event.target.value)} placeholder="출판사 소개나 내가 적어 둔 줄거리를 붙여 넣으세요." />
              )}
              {aiError && <p className="inline-error">{aiError}</p>}
              <div className="ai-footer">
                <p>결과는 자유롭게 편집한 뒤 저장할 수 있는 초안입니다.</p>
                <button className="button ai-button" type="button" disabled={generating} onClick={generateSynopsis}>
                  <Bot size={17} /> {generating ? "초안 생성 중…" : "AI 초안 생성"}
                </button>
              </div>
            </section>

            <section className="detail-section memo-section">
              <div className="section-heading-row">
                <div>
                  <span className="eyebrow">QUICK CAPTURE</span>
                  <h3>메모</h3>
                </div>
                <span className="count-badge">{sortedMemos.length}</span>
              </div>
              <QuickMemo workId={work.id} onSave={onSaveMemo} />
              <div className="memo-list">
                {sortedMemos.map((memo) => (
                  <MemoEditor key={memo.id} memo={memo} onSave={onSaveMemo} onDelete={() => onDeleteMemo(memo.id)} />
                ))}
              </div>
            </section>
          </main>

          <aside className="detail-aside">
            <section className="aside-card">
              <span className="eyebrow">REFERENCE</span>
              <h3>외부 자료</h3>
              <a href={namuUrl} target="_blank" rel="noreferrer">나무위키 검색 <ArrowUpRight size={15} /></a>
              <a href={googleUrl} target="_blank" rel="noreferrer">Google 검색 <ArrowUpRight size={15} /></a>
              {work.custom_links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                  {link.label || "참고 링크"} <ExternalLink size={14} />
                </a>
              ))}
              {work.custom_links.length === 0 && <p>작품 편집에서 나만의 링크를 추가할 수 있습니다.</p>}
            </section>
            <section className="aside-card facts-card">
              <span className="eyebrow">BOOK DATA</span>
              <dl>
                <div><dt>상태</dt><dd>{STATUS_LABELS[work.status]}</dd></div>
                <div><dt>시리즈</dt><dd>{series?.title ?? "단권"}</dd></div>
                <div><dt>권</dt><dd>{work.volume_number ? `${work.volume_number}권` : "—"}</dd></div>
                <div><dt>기록</dt><dd>{new Intl.DateTimeFormat("ko-KR").format(new Date(work.created_at))}</dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </Dialog>
  );
}
