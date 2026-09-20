"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Plus, Search, X } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { STATUS_LABELS, type Work, type WorkStatus } from "@/lib/types";

type FoundBook = { id: string; title: string; authors: string[]; publisher: string; publishedDate: string; isbn: string; description: string; cover: string; link: string; source: string };
type Panel = "add" | "detail" | "lookup" | "edit" | null;
function newWork(): Work {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), series_id: null, volume_number: null, title: "", status: "unread", cover_image_url: "", synopsis_source: "", synopsis_generated: "", namuwiki_url: "", google_search_url: "", custom_links: [], created_at: now, updated_at: now };
}
function Cover({ title, url }: { title: string; url: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return url && !broken ? <Image src={url} alt={`${title} 표지`} fill sizes="(max-width:600px) 45vw,(max-width:900px) 24vw,180px" unoptimized onError={() => setBroken(true)} /> : <span className="bk-placeholder"><small>LIGHT / LIGHT</small><strong>{title || "새로운 이야기"}</strong><small>MY LIBRARY</small></span>;
}
function SearchResults({ query, onQuery, onPick }: { query: string; onQuery: (value: string) => void; onPick: (book: FoundBook) => void }) {
  const [results, setResults] = useState<FoundBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) { setResults([]); setSearched(false); setLoading(false); setError(""); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(""); setSearched(false);
      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(text)}`, { signal: controller.signal });
        const data = await response.json() as { books?: FoundBook[]; error?: string };
        if (!response.ok) throw new Error(data.error || "검색 실패");
        setResults(data.books ?? []); setSearched(true);
      } catch (cause) {
        if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "검색 실패"); setResults([]); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 380);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  return <>
    <label className="bk-lookup-input"><Search size={18} aria-hidden="true"/><input autoFocus aria-label="도서 제목 또는 ISBN" placeholder="제목이나 ISBN으로 검색" value={query} onChange={(event) => onQuery(event.target.value)} maxLength={120}/>{query && <button type="button" aria-label="검색어 지우기" onClick={() => { onQuery(""); setResults([]); setSearched(false); }}><X size={16}/></button>}</label>
    <p className="bk-hint">검색 결과에서 정확한 권과 판본을 골라 주세요. 선택하면 바로 서재에 저장돼요.</p>
    {loading && <p className="bk-message" role="status">책을 찾는 중…</p>}
    {error && <p className="bk-error" role="alert">{error}</p>}
    {!loading && !error && searched && !results.length && <p className="bk-message">검색 결과가 없어요. 제목을 짧게 검색하거나 직접 입력해 주세요.</p>}
    <div className="bk-results" aria-label="도서 검색 결과">{results.map((book) => <button className="bk-result" key={book.id} type="button" onClick={() => onPick(book)}>
      <span className="bk-result-cover">{book.cover ? <Image src={book.cover} alt="" fill sizes="60px" unoptimized/> : <span className="bk-mini-placeholder">표지 없음</span>}</span>
      <span className="bk-result-text"><strong>{book.title}</strong><small>{[book.authors.join(", "), book.publisher, book.publishedDate].filter(Boolean).join(" · ") || book.source}</small>{!book.cover && <em>표지 정보 없음</em>}</span>
      <span className="bk-result-arrow" aria-hidden="true">＋</span>
    </button>)}</div>
  </>;
}
export function Bookshelf() {
  const store = useLibrary();
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lookupQuery, setLookupQuery] = useState("");
  const [draft, setDraft] = useState<Work | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoText, setEditingMemoText] = useState("");
  const selected = store.library.works.find((book) => book.id === selectedId);
  const series = useMemo(() => new Map(store.library.series.map((item) => [item.id, item.title])), [store.library.series]);
  const books = useMemo(() => [...store.library.works].sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [store.library.works]);
  const filtered = books.filter((book) => `${book.title} ${series.get(book.series_id ?? "") ?? ""}`.toLocaleLowerCase("ko").includes(listQuery.trim().toLocaleLowerCase("ko")));
  const memos = selected ? store.library.memos.filter((item) => item.work_id === selected.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at)) : [];
  function close() { setPanel(null); setSelectedId(null); setDraft(null); setLookupQuery(""); setMemo(""); setEditingMemoId(null); }
  function startAdd() { setSelectedId(null); setLookupQuery(""); setDraft(null); setPanel("add"); }
  function startLookup() { if (!selected) return; setLookupQuery(selected.title); setPanel("lookup"); }
  function startEdit() { if (!selected) return; setDraft({ ...selected }); setPanel("edit"); }
  function applyBook(book: FoundBook) {
    const original = selected ?? newWork();
    const details = [book.authors.length ? `저자: ${book.authors.join(", ")}` : "", book.publisher ? `출판사: ${book.publisher}` : "", book.publishedDate ? `발행일: ${book.publishedDate}` : "", book.isbn ? `ISBN: ${book.isbn}` : ""].filter(Boolean).join("\n");
    const value: Work = {
      ...original, title: book.title, cover_image_url: book.cover || original.cover_image_url,
      synopsis_source: details || original.synopsis_source,
      synopsis_generated: original.synopsis_generated || book.description,
      google_search_url: book.link || original.google_search_url,
      updated_at: new Date().toISOString(),
    };
    void store.saveWork(value);
    setSelectedId(value.id); setPanel("detail"); setLookupQuery("");
  }
  function saveManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft?.title.trim()) return;
    const value = { ...draft, title: draft.title.trim(), updated_at: new Date().toISOString() };
    void store.saveWork(value); setSelectedId(value.id); setDraft(null); setPanel("detail");
  }
  function addMemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !memo.trim()) return;
    const now = new Date().toISOString();
    void store.saveMemo({ id: crypto.randomUUID(), work_id: selected.id, content: memo.trim(), created_at: now, updated_at: now }); setMemo("");
  }
  useEffect(() => {
    if (!panel) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = old; document.removeEventListener("keydown", esc); };
  }, [panel]);
  return <div className="bk">
    <header className="bk-top"><nav className="bk-nav"><a className="bk-logo" href="/">light<span>/</span>light.</a><div className="bk-nav-actions"><button className="bk-icon" aria-label={searchOpen ? "검색 닫기" : "내 서재 검색"} type="button" onClick={() => { setSearchOpen(!searchOpen); setListQuery(""); }}>{searchOpen ? <X size={19}/> : <Search size={19}/>}</button><button className="bk-add" type="button" onClick={startAdd}><Plus size={16}/>책 추가</button></div></nav></header>
    <main className="bk-main"><p className="bk-eyebrow">MY BOOKSHELF</p><h1>나의 서재</h1><p className="bk-count">{books.length}권의 이야기</p>
      {searchOpen && <label className="bk-list-search"><Search size={17}/><input aria-label="서재 내 검색" autoFocus placeholder="내 서재에서 검색" value={listQuery} onChange={(event) => setListQuery(event.target.value)}/></label>}
      {store.error && <p className="bk-error" role="alert">{store.error} <button type="button" onClick={store.clearError}>닫기</button></p>}
      <section className="bk-grid" aria-label="책 목록">{store.loading ? <p className="bk-empty">서재를 불러오는 중…</p> : filtered.length ? filtered.map((book) => <button type="button" className="bk-book" key={book.id} onClick={() => { setSelectedId(book.id); setPanel("detail"); }}><span className="bk-cover"><Cover title={book.title} url={book.cover_image_url}/></span><span className="bk-book-title">{book.title}</span><span className="bk-book-meta">{series.get(book.series_id ?? "") ? `${series.get(book.series_id ?? "")} · ` : ""}{STATUS_LABELS[book.status]}</span></button>) : <div className="bk-empty"><h2>{listQuery ? "검색 결과가 없어요" : "아직 책이 없어요"}</h2><p>{listQuery ? "다른 제목으로 찾아보세요." : "첫 책을 추가해 보세요."}</p>{!listQuery && <button type="button" className="bk-link" onClick={startAdd}>책 추가하기 →</button>}</div>}</section>
    </main><footer className="bk-footer">light/light.</footer>
    {panel && <div className="bk-backdrop" onMouseDown={close}><aside className="bk-panel" role="dialog" aria-modal="true" aria-label={panel === "detail" ? "책 상세" : "책 검색 및 편집"} onMouseDown={(event) => event.stopPropagation()}>
      <div className="bk-panel-head"><button type="button" onClick={() => { if (panel === "lookup" || panel === "edit") setPanel("detail"); else close(); }}><ArrowLeft size={18}/>{panel === "lookup" || panel === "edit" ? "책 상세" : "서재로"}</button><button type="button" aria-label="닫기" onClick={close}><X size={20}/></button></div>
      {panel === "add" || panel === "lookup" ? <><p className="bk-eyebrow">FIND YOUR BOOK</p><h2>{panel === "add" ? "어떤 책을 추가할까요?" : "표지와 정보 찾기"}</h2><SearchResults query={lookupQuery} onQuery={setLookupQuery} onPick={applyBook}/>{panel === "add" && <button type="button" className="bk-link bk-manual" onClick={() => { setDraft({ ...newWork(), title: lookupQuery }); setPanel("edit"); }}>검색 결과가 없나요? 직접 입력 →</button>}</> : null}
      {panel === "edit" && draft ? <form onSubmit={saveManual}><p className="bk-eyebrow">BOOK INFORMATION</p><h2>{selected ? "책 정보 수정" : "직접 입력"}</h2><label className="bk-label" htmlFor="bk-title">제목</label><input className="bk-input" id="bk-title" autoFocus required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/><label className="bk-label" htmlFor="bk-cover-url">표지 이미지 주소</label><input className="bk-input" id="bk-cover-url" type="url" placeholder="https://…" value={draft.cover_image_url} onChange={(event) => setDraft({ ...draft, cover_image_url: event.target.value })}/><label className="bk-label" htmlFor="bk-intro">책 소개</label><textarea className="bk-textarea" id="bk-intro" value={draft.synopsis_generated} onChange={(event) => setDraft({ ...draft, synopsis_generated: event.target.value })}/><button type="submit" className="bk-primary" disabled={!draft.title.trim()}><Check size={17}/>저장하기</button></form> : null}
      {panel === "detail" && selected ? <><div className="bk-detail-cover bk-cover"><Cover title={selected.title} url={selected.cover_image_url}/></div><p className="bk-eyebrow">BOOK DETAILS</p><h2>{selected.title}</h2><p className="bk-sub">{series.get(selected.series_id ?? "") ?? "내 서재"}{selected.volume_number !== null ? ` · ${selected.volume_number}권` : ""}</p><button type="button" className="bk-lookup-button" onClick={startLookup}><Search size={17}/>{selected.cover_image_url ? "표지·책 정보 다시 찾기" : "이 책의 표지·정보 찾기"}</button>
        {selected.synopsis_source && <section className="bk-section"><h3>도서 정보</h3><p className="bk-description">{selected.synopsis_source}</p>{selected.google_search_url && <a className="bk-book-link" href={selected.google_search_url} target="_blank" rel="noopener noreferrer">도서 정보 원문 ↗</a>}</section>}
        <section className="bk-section"><h3>읽기 상태</h3><div className="bk-status">{(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => <button key={status} type="button" aria-pressed={selected.status === status} onClick={() => void store.saveWork({ ...selected, status, updated_at: new Date().toISOString() })}>{STATUS_LABELS[status]}</button>)}</div></section>
        {selected.synopsis_generated && <section className="bk-section"><h3>책 소개</h3><p className="bk-description">{selected.synopsis_generated}</p></section>}
        <section className="bk-section"><h3>나의 메모 · {memos.length}</h3><form onSubmit={addMemo}><textarea className="bk-textarea" aria-label="새 메모" placeholder="떠오른 생각을 기록하세요…" value={memo} onChange={(event) => setMemo(event.target.value)}/><button className="bk-primary" type="submit" disabled={!memo.trim()}>메모 저장</button></form><div className="bk-notes">{memos.map((item) => <article className="bk-note" key={item.id}>{editingMemoId === item.id ? <form onSubmit={(event) => { event.preventDefault(); if (!editingMemoText.trim()) return; void store.saveMemo({ ...item, content: editingMemoText.trim(), updated_at: new Date().toISOString() }); setEditingMemoId(null); }}><textarea className="bk-textarea" aria-label="메모 수정" value={editingMemoText} onChange={(event) => setEditingMemoText(event.target.value)}/><button className="bk-primary" type="submit">저장</button></form> : <><p>{item.content}</p><div className="bk-note-actions"><small>{new Date(item.updated_at).toLocaleDateString("ko-KR")}</small><button type="button" onClick={() => { setEditingMemoId(item.id); setEditingMemoText(item.content); }}>수정</button><button type="button" onClick={() => { if (window.confirm("메모를 삭제할까요?")) void store.deleteMemo(item.id); }}>삭제</button></div></>}</article>)}</div></section>
        <div className="bk-edit-actions"><button type="button" onClick={startEdit}>정보 직접 수정</button><button type="button" onClick={() => { if (window.confirm("이 책과 메모를 삭제할까요?")) { void store.deleteWork(selected.id); close(); } }}>책 삭제</button></div>
      </> : null}
    </aside></div>}
  </div>;
}
