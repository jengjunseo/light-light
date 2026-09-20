"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, Check, Plus, Search, X } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { STATUS_LABELS, type Memo, type Work, type WorkStatus } from "@/lib/types";

const css = `
:root{color-scheme:light}html{background:#fafaf8}body{margin:0;background:#fafaf8;color:#20211f;font-family:Arial,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;-webkit-font-smoothing:antialiased}button,input,textarea,select{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #4c6cff;outline-offset:3px}.ll *{box-sizing:border-box}.ll{min-height:100svh;color:#20211f}.ll button{border:0}.ll-top{height:74px;border-bottom:1px solid #e9e9e5;background:rgba(250,250,248,.93);backdrop-filter:blur(18px);position:sticky;top:0;z-index:5}.ll-nav{max-width:1120px;margin:auto;height:100%;padding:0 36px;display:flex;align-items:center;justify-content:space-between}.ll-logo{font-weight:800;letter-spacing:-1.1px;font-size:22px;text-decoration:none;color:#1e201e}.ll-logo span{color:#a1a29c}.ll-actions{display:flex;align-items:center;gap:10px}.ll-icon{width:44px;height:44px;display:grid;place-items:center;background:transparent;color:#252723;border-radius:50%;transition:background .18s,transform .18s}.ll-icon:hover{background:#efefed}.ll-add,.ll-primary{background:#222421;color:white;border-radius:13px;font-weight:650;display:inline-flex;align-items:center;justify-content:center;gap:8px;transition:transform .18s,background .18s}.ll-add{height:43px;padding:0 17px}.ll-add:hover,.ll-primary:hover{background:#424641;transform:translateY(-1px)}.ll-main{max-width:1120px;margin:0 auto;padding:74px 36px 110px}.ll-intro{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:34px}.ll-eyebrow{color:#92948c;font-size:11px;letter-spacing:.16em;font-weight:750;margin:0 0 13px}.ll h1{font-size:clamp(35px,5vw,53px);letter-spacing:-.075em;line-height:1.16;font-weight:740;margin:0}.ll-count{color:#95988f;font-size:14px;font-weight:500;letter-spacing:0;margin:14px 0 0}.ll-search{display:flex;align-items:center;gap:12px;border:1px solid #deded8;border-radius:14px;padding:0 15px;height:48px;width:100%;background:white;margin:0 0 32px;animation:ll-appear .18s ease-out}.ll-search input{border:0;outline:none!important;background:transparent;color:#252723;min-width:0;width:100%;font-size:15px}.ll-search input::placeholder{color:#a6a8a2}.ll-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:38px 22px}.ll-book{min-width:0;text-align:left;background:transparent;padding:0;color:inherit;display:block}.ll-cover{position:relative;aspect-ratio: .71;width:100%;border-radius:9px;overflow:hidden;background:#e9e8e2;box-shadow:0 5px 16px #151a0f0d;transition:transform .24s cubic-bezier(.2,.8,.2,1),box-shadow .24s}.ll-book:hover .ll-cover{transform:translateY(-4px);box-shadow:0 12px 26px #151a0f1a}.ll-cover img{width:100%;height:100%;object-fit:cover}.ll-cover-empty{width:100%;height:100%;padding:16px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(140deg,#eae7de,#d7d5ca);color:#43463d}.ll-cover-empty small{font-size:9px;letter-spacing:.12em}.ll-cover-empty strong{font-size:clamp(14px,1.7vw,23px);line-height:1.35;letter-spacing:-.045em;word-break:keep-all}.ll-book-name{display:block;margin-top:13px;font-size:14px;font-weight:700;letter-spacing:-.025em;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.ll-book-meta{display:block;margin-top:4px;font-size:12px;color:#969990;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ll-empty{padding:100px 20px;text-align:center;color:#9a9c95;grid-column:1/-1}.ll-empty h2{font-size:19px;color:#4a4d47;margin:14px 0 8px}.ll-empty p{font-size:14px;line-height:1.7}.ll-textbtn{color:#30342e;font-size:14px;font-weight:700;background:transparent;padding:10px 0}.ll-error{background:#fff2ee;color:#9d4034;border-radius:12px;padding:12px 16px;margin:0 0 24px;font-size:13px}.ll-backdrop{position:fixed;inset:0;background:#1417127a;z-index:20;display:flex;justify-content:flex-end;animation:ll-fade .18s ease-out}.ll-panel{width:min(100%,480px);height:100%;overflow-y:auto;overscroll-behavior:contain;background:#fafaf8;padding:24px 34px 50px;box-shadow:-16px 0 40px #0000000e;animation:ll-slide .26s cubic-bezier(.2,.8,.2,1)}.ll-panel-head{height:42px;display:flex;justify-content:space-between;align-items:center;margin-bottom:35px}.ll-panel-head button{display:flex;align-items:center;gap:6px;border:0;background:transparent;color:#4d514b;padding:8px 0;font-size:13px}.ll-panel h2{font-size:31px;line-height:1.3;letter-spacing:-.055em;font-weight:750;margin:8px 0 12px;word-break:keep-all}.ll-panel .ll-small{font-size:13px;color:#969990;line-height:1.6}.ll-label{display:block;font-size:12px;color:#60645c;font-weight:680;margin:24px 0 9px}.ll-input,.ll-select,.ll-textarea{display:block;width:100%;background:white;border:1px solid #e2e2dd;border-radius:12px;padding:14px 15px;color:#20211f;outline:none;font-size:15px}.ll-textarea{min-height:115px;resize:vertical;line-height:1.65}.ll-input:focus,.ll-select:focus,.ll-textarea:focus{border-color:#737b70}.ll-primary{width:100%;min-height:49px;margin-top:24px;font-size:14px}.ll-primary:disabled{opacity:.5;cursor:not-allowed}.ll-more{margin:24px 0 0;padding:16px 0;border-top:1px solid #e7e7e2}.ll-more summary{cursor:pointer;font-size:13px;font-weight:650;color:#656960;list-style:none}.ll-more summary:after{content:'+';float:right;font-size:16px}.ll-more[open] summary:after{content:'−'}.ll-details-cover{width:108px;aspect-ratio:.71;position:relative;overflow:hidden;border-radius:7px;margin-bottom:20px}.ll-details-cover .ll-cover-empty{padding:10px}.ll-details-cover .ll-cover-empty strong{font-size:12px}.ll-section{margin-top:34px;border-top:1px solid #e8e8e3;padding-top:24px}.ll-section-title{font-size:14px;font-weight:750;margin:0 0 15px}.ll-status{display:flex;gap:7px;flex-wrap:wrap}.ll-status button{font-size:12px;padding:10px 12px;border-radius:9px;background:#efefeb;color:#666960}.ll-status button[aria-pressed=true]{background:#282b26;color:white}.ll-notes{display:flex;flex-direction:column;gap:12px}.ll-note{background:#fff;border:1px solid #ebeae5;border-radius:12px;padding:14px}.ll-note p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;font-size:14px;margin:0 0 12px}.ll-note-actions{display:flex;align-items:center;gap:18px;font-size:12px;color:#a0a29b}.ll-note-actions button{background:none;color:#82857c;padding:3px 0;font-size:12px}.ll-danger{color:#a54d47!important}.ll-edit-actions{margin-top:32px;display:flex;align-items:center;gap:24px}.ll-edit-actions button{padding:8px 0;font-size:13px;background:none;color:#74776f}.ll-synopsis{white-space:pre-wrap;font-size:14px;color:#686b64;line-height:1.8}.ll-footer{max-width:1120px;margin:0 auto;padding:28px 36px 40px;border-top:1px solid #eaeae5;font-size:12px;color:#a4a69f}.ll-footer strong{font-weight:800;color:#a5a7a0;letter-spacing:-.04em}@keyframes ll-appear{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}@keyframes ll-fade{from{opacity:0}to{opacity:1}}@keyframes ll-slide{from{transform:translateX(18px);opacity:.8}to{transform:none;opacity:1}}@media(max-width:900px){.ll-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:30px 16px}}@media(max-width:600px){.ll-top{height:62px}.ll-nav{padding:0 20px}.ll-logo{font-size:20px}.ll-add{height:39px;padding:0 13px}.ll-main{padding:48px 20px 76px}.ll-intro{margin-bottom:30px}.ll h1{font-size:36px}.ll-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:29px 15px}.ll-book-name{font-size:13px}.ll-book-meta{font-size:11px}.ll-cover-empty{padding:12px}.ll-cover-empty strong{font-size:16px}.ll-panel{width:100%;padding:17px 23px 44px}.ll-backdrop{align-items:flex-end}.ll-footer{padding:24px 20px 32px}}@media(max-width:350px){.ll-nav{padding:0 15px}.ll-main{padding-left:15px;padding-right:15px}.ll-grid{gap:25px 11px}.ll-cover-empty strong{font-size:14px}.ll-panel{padding:16px 19px 36px}}@media(prefers-reduced-motion:reduce){.ll *{animation:none!important;transition:none!important}}
`;

function freshWork(): Work {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), series_id: null, volume_number: null, title: "", status: "unread", cover_image_url: "", synopsis_source: "", synopsis_generated: "", namuwiki_url: "", google_search_url: "", custom_links: [], created_at: now, updated_at: now };
}

function Cover({ work }: { work: Work }) {
  const [broken, setBroken] = useState(false);
  return work.cover_image_url && !broken ? <Image src={work.cover_image_url} alt={`${work.title} 표지`} fill sizes="(max-width:600px) 45vw,(max-width:900px) 24vw,180px" unoptimized onError={() => setBroken(true)} /> : <div className="ll-cover-empty"><small>LIGHT / LIGHT</small><strong>{work.title || "새로운 이야기"}</strong><small>MY LIBRARY</small></div>;
}

export function MinimalLibrary() {
  const store = useLibrary();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<"new" | "edit" | null>(null);
  const [draft, setDraft] = useState<Work | null>(null);
  const [newMemo, setNewMemo] = useState("");
  const [memoEditing, setMemoEditing] = useState<string | null>(null);
  const [memoText, setMemoText] = useState("");
  const selected = store.library.works.find((work) => work.id === selectedId);
  const seriesMap = useMemo(() => new Map(store.library.series.map((series) => [series.id, series.title])), [store.library.series]);
  const books = useMemo(() => [...store.library.works].sort((a,b) => b.updated_at.localeCompare(a.updated_at)), [store.library.works]);
  const shown = books.filter((book) => `${book.title} ${seriesMap.get(book.series_id ?? "") ?? ""}`.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko")));
  const memos = selected ? store.library.memos.filter((memo) => memo.work_id === selected.id).sort((a,b) => b.updated_at.localeCompare(a.updated_at)) : [];
  const panelOpen = editor !== null || selected !== undefined;

  function close() {
    if (editor === "edit") { setEditor(null); setDraft(null); return; }
    setEditor(null); setDraft(null); setSelectedId(null); setNewMemo(""); setMemoEditing(null);
  }
  function openAdd() { setSelectedId(null); setDraft(freshWork()); setEditor("new"); }
  function openEdit() { if (!selected) return; setDraft({ ...selected }); setEditor("edit"); }
  function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft?.title.trim()) return;
    void store.saveWork({ ...draft, title: draft.title.trim(), updated_at: new Date().toISOString() });
    if (editor === "new") setSelectedId(draft.id);
    setEditor(null); setDraft(null);
  }
  function addMemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !newMemo.trim()) return;
    const now = new Date().toISOString();
    void store.saveMemo({ id: crypto.randomUUID(), work_id: selected.id, content: newMemo.trim(), created_at: now, updated_at: now });
    setNewMemo("");
  }
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditor(null); setDraft(null); setSelectedId(null); setMemoEditing(null);
      }
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [panelOpen]);

  return <div className="ll">
    <style>{css}</style>
    <header className="ll-top"><nav className="ll-nav" aria-label="메인 메뉴">
      <a className="ll-logo" href="/">light<span>/</span>light.</a>
      <div className="ll-actions"><button type="button" className="ll-icon" aria-label={searching ? "검색 닫기" : "책 검색"} onClick={() => { setSearching((value) => !value); setQuery(""); }}>{searching ? <X size={20}/> : <Search size={20}/>}</button><button type="button" className="ll-add" onClick={openAdd}><Plus size={17}/>책 추가</button></div>
    </nav></header>
    <main className="ll-main">
      <div className="ll-intro"><div><p className="ll-eyebrow">MY BOOKSHELF</p><h1>나의 서재</h1><p className="ll-count">{books.length}권의 이야기</p></div></div>
      {searching && <label className="ll-search"><Search size={18} color="#979a92"/><input type="search" autoFocus aria-label="책 검색" placeholder="책 제목으로 검색" value={query} onChange={(e) => setQuery(e.target.value)}/><button className="ll-icon" type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><X size={16}/></button></label>}
      {store.error && <div role="alert" className="ll-error">{store.error} <button className="ll-textbtn" type="button" onClick={store.clearError}>닫기</button></div>}
      <section className="ll-grid" aria-label="책 목록">
        {store.loading ? <div className="ll-empty">서재를 불러오는 중…</div> : shown.length ? shown.map((work) => <button key={work.id} type="button" className="ll-book" aria-label={`${work.title} 상세보기`} onClick={() => {setSelectedId(work.id);setNewMemo("");}}><span className="ll-cover"><Cover work={work}/></span><span className="ll-book-name">{work.title}</span><span className="ll-book-meta">{seriesMap.get(work.series_id ?? "") ? `${seriesMap.get(work.series_id ?? "")} · ` : ""}{STATUS_LABELS[work.status]}</span></button>) : <div className="ll-empty"><h2>{query ? "검색 결과가 없어요" : "아직 책이 없어요"}</h2><p>{query ? "다른 제목으로 다시 찾아보세요." : "첫 번째 책부터 가볍게 시작해 보세요."}</p>{!query && <button className="ll-textbtn" type="button" onClick={openAdd}>책 추가하기 →</button>}</div>}
      </section>
    </main>
    <footer className="ll-footer"><strong>light/light.</strong></footer>
    {panelOpen && <div className="ll-backdrop" onMouseDown={close}><aside className="ll-panel" role="dialog" aria-modal="true" aria-label={editor ? editor === "new" ? "책 추가" : "책 수정" : "책 상세"} onMouseDown={(e) => e.stopPropagation()}>
      <div className="ll-panel-head"><button type="button" onClick={close}><ArrowLeft size={18}/>{editor === "edit" ? "상세로" : "서재로"}</button><button type="button" aria-label="닫기" onClick={() => {setEditor(null);setSelectedId(null);setDraft(null);}}><X size={20}/></button></div>
      {editor && draft ? <form onSubmit={saveBook}>
        <p className="ll-eyebrow">{editor === "new" ? "ADD A BOOK" : "EDIT A BOOK"}</p><h2>{editor === "new" ? "새로운 책" : "책 정보 수정"}</h2>
        <label className="ll-label" htmlFor="ll-title">책 제목</label><input className="ll-input" id="ll-title" autoFocus required maxLength={200} value={draft.title} placeholder="제목을 입력하세요" onChange={(e) => setDraft({...draft,title:e.target.value})}/>
        <details className="ll-more"><summary>추가 정보</summary><label className="ll-label" htmlFor="ll-cover">표지 이미지 주소</label><input id="ll-cover" className="ll-input" type="url" placeholder="https://…" value={draft.cover_image_url} onChange={(e) => setDraft({...draft,cover_image_url:e.target.value})}/><label className="ll-label" htmlFor="ll-series">시리즈</label><select className="ll-select" id="ll-series" value={draft.series_id ?? ""} onChange={(e) => setDraft({...draft,series_id:e.target.value || null,volume_number:e.target.value ? draft.volume_number : null})}><option value="">시리즈 없음</option>{store.library.series.map((series) => <option key={series.id} value={series.id}>{series.title}</option>)}</select>{draft.series_id && <><label className="ll-label" htmlFor="ll-volume">권 번호</label><input className="ll-input" id="ll-volume" type="number" min="0" step="1" value={draft.volume_number ?? ""} onChange={(e) => setDraft({...draft,volume_number:e.target.value === "" ? null : Number(e.target.value)})}/></>}<label className="ll-label" htmlFor="ll-synopsis">작품 소개</label><textarea className="ll-textarea" id="ll-synopsis" value={draft.synopsis_generated} onChange={(e) => setDraft({...draft,synopsis_generated:e.target.value})}/></details>
        <button className="ll-primary" type="submit" disabled={!draft.title.trim()}>{editor === "new" ? "책 추가하기" : "변경사항 저장"}<Check size={17}/></button>
      </form> : selected ? <div>
        <div className="ll-details-cover ll-cover"><Cover work={selected}/></div><p className="ll-eyebrow">BOOK DETAILS</p><h2>{selected.title}</h2><p className="ll-small">{seriesMap.get(selected.series_id ?? "") ?? "단권"}{selected.volume_number !== null ? ` · ${selected.volume_number}권` : ""}</p>
        <div className="ll-section"><h3 className="ll-section-title">읽기 상태</h3><div className="ll-status">{(Object.keys(STATUS_LABELS) as WorkStatus[]).map((status) => <button key={status} type="button" aria-pressed={selected.status === status} onClick={() => void store.saveWork({...selected,status,updated_at:new Date().toISOString()})}>{STATUS_LABELS[status]}</button>)}</div></div>
        {selected.synopsis_generated && <div className="ll-section"><h3 className="ll-section-title">책 소개</h3><p className="ll-synopsis">{selected.synopsis_generated}</p></div>}
        <section className="ll-section"><h3 className="ll-section-title">나의 메모 · {memos.length}</h3><form onSubmit={addMemo}><textarea className="ll-textarea" aria-label="새 메모" placeholder="떠오른 생각을 기록하세요…" value={newMemo} onChange={(e) => setNewMemo(e.target.value)}/><button className="ll-primary" type="submit" disabled={!newMemo.trim()}>메모 저장</button></form>
        <div className="ll-notes" style={{marginTop:22}}>{memos.map((memo) => <article className="ll-note" key={memo.id}>{memoEditing === memo.id ? <form onSubmit={(e) => {e.preventDefault();void store.saveMemo({...memo,content:memoText,updated_at:new Date().toISOString()});setMemoEditing(null);}}><textarea className="ll-textarea" aria-label="메모 수정" value={memoText} onChange={(e) => setMemoText(e.target.value)}/><button className="ll-primary" type="submit">수정 저장</button></form> : <><p>{memo.content}</p><div className="ll-note-actions"><span>{new Date(memo.updated_at).toLocaleDateString("ko-KR")}</span><button type="button" onClick={() => {setMemoEditing(memo.id);setMemoText(memo.content);}}>수정</button><button type="button" className="ll-danger" onClick={() => {if(window.confirm("이 메모를 삭제할까요?"))void store.deleteMemo(memo.id);}}>삭제</button></div></>}</article>)}</div></section>
        <div className="ll-edit-actions"><button type="button" onClick={openEdit}>책 정보 수정</button><button type="button" className="ll-danger" onClick={() => {if(window.confirm("이 책과 메모를 삭제할까요?")){void store.deleteWork(selected.id);setSelectedId(null);}}}>책 삭제</button></div>
      </div> : null}
    </aside></div>}
  </div>;
}
