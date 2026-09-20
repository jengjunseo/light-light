"use client";

import {
  BookCopy, BookMarked, BookOpen, CheckCircle2, ChevronRight, CirclePause,
  Database, Library, LibraryBig, Menu, Plus, Search, SlidersHorizontal, Sparkles, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLibrary } from "@/hooks/use-library";
import { STATUS_LABELS, type Series, type Work, type WorkStatus } from "@/lib/types";
import { Cover } from "./cover";
import { SeriesDetail } from "./series-detail";
import { SeriesEditor } from "./series-editor";
import { WorkDetail } from "./work-detail";
import { WorkEditor } from "./work-editor";

type Filter = "all" | WorkStatus | "standalone";
type Sort = "recent" | "title" | "series" | "status";

function BookCard({ work, series, onOpen }: { work: Work; series?: Series; onOpen: () => void }) {
  return (
    <button className="book-card" type="button" onClick={onOpen} aria-label={`${work.title} 상세 열기`}>
      <div className="book-cover-wrap">
        <Cover src={work.cover_image_url} title={work.title} />
        <span className={`book-status-dot status-${work.status}`} title={STATUS_LABELS[work.status]} />
        {work.volume_number != null && <span className="volume-chip">{work.volume_number}권</span>}
      </div>
      <span className="book-title">{work.title}</span>
      <span className="book-meta">{series?.title ?? "단권"} · {STATUS_LABELS[work.status]}</span>
    </button>
  );
}

function Shelf({ series, works, onOpenSeries, onOpenWork }: {
  series?: Series; works: Work[]; onOpenSeries?: () => void; onOpenWork: (work: Work) => void;
}) {
  const completed = works.filter((work) => work.status === "completed").length;
  return (
    <section className="shelf-section">
      <header className="shelf-heading">
        <div>
          <span className="shelf-kicker">{series ? "SERIES" : "STANDALONE"}</span>
          <button className="shelf-title-button" type="button" onClick={onOpenSeries} disabled={!onOpenSeries}>
            <h2>{series?.title ?? "단권 및 미분류"}</h2>{onOpenSeries && <ChevronRight size={19} />}
          </button>
          <p>{series?.description || "한 권으로 완결되는 이야기와 아직 시리즈를 정하지 않은 작품"}</p>
        </div>
        <div className="shelf-progress"><strong>{completed}<span> / {works.length}</span></strong><small>완독</small></div>
      </header>
      <div className="shelf-books">
        {works.map((work) => <BookCard key={work.id} work={work} series={series} onOpen={() => onOpenWork(work)} />)}
      </div>
      <div className="shelf-plank" aria-hidden="true" />
    </section>
  );
}

const filterItems: Array<{ id: Filter; label: string; icon: typeof Library }> = [
  { id: "all", label: "전체 컬렉션", icon: Library },
  { id: "reading", label: "읽는 중", icon: BookOpen },
  { id: "completed", label: "완독", icon: CheckCircle2 },
  { id: "unread", label: "읽고 싶음", icon: BookMarked },
  { id: "paused", label: "보류", icon: CirclePause },
  { id: "standalone", label: "단권 / 미분류", icon: BookCopy },
];

export function LibraryApp() {
  const store = useLibrary();
  const { library } = store;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [workEditorOpen, setWorkEditorOpen] = useState(false);
  const [seriesEditorOpen, setSeriesEditorOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | undefined>();
  const [editingSeries, setEditingSeries] = useState<Series | undefined>();
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const seriesMap = useMemo(() => new Map(library.series.map((item) => [item.id, item])), [library.series]);
  const selectedWork = library.works.find((work) => work.id === selectedWorkId);
  const selectedSeries = library.series.find((series) => series.id === selectedSeriesId);
  const query = search.trim().toLocaleLowerCase("ko");

  const filteredWorks = useMemo(() => {
    const results = library.works.filter((work) => {
      const seriesTitle = work.series_id ? seriesMap.get(work.series_id)?.title ?? "" : "";
      const queryMatch = !query || `${work.title} ${seriesTitle}`.toLocaleLowerCase("ko").includes(query);
      const filterMatch = filter === "all" || (filter === "standalone" ? !work.series_id : work.status === filter);
      return queryMatch && filterMatch;
    });
    return results.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ko");
      if (sort === "series") return (seriesMap.get(a.series_id ?? "")?.title ?? "힣").localeCompare(seriesMap.get(b.series_id ?? "")?.title ?? "힣", "ko");
      if (sort === "status") return a.status.localeCompare(b.status);
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [filter, library.works, query, seriesMap, sort]);

  const shelves = useMemo(() => ({
    grouped: library.series.map((series) => ({ series, works: filteredWorks.filter((work) => work.series_id === series.id) })).filter((group) => group.works.length),
    standalone: filteredWorks.filter((work) => !work.series_id),
  }), [filteredWorks, library.series]);

  const stats = {
    total: library.works.length,
    reading: library.works.filter((work) => work.status === "reading").length,
    completed: library.works.filter((work) => work.status === "completed").length,
  };

  const openWorkEditor = (work?: Work) => { setEditingWork(work); setWorkEditorOpen(true); };
  const openSeriesEditor = (series?: Series) => { setEditingSeries(series); setSeriesEditorOpen(true); };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><LibraryBig size={20} strokeWidth={1.8} /></div>
          <div><strong>light.light</strong><span>YOUR STORY ARCHIVE</span></div>
          <button className="icon-button mobile-sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기"><X size={19} /></button>
        </div>
        <nav className="side-nav" aria-label="컬렉션 필터">
          <span className="nav-label">LIBRARY</span>
          {filterItems.map((item) => {
            const Icon = item.icon;
            const count = item.id === "all" ? library.works.length : item.id === "standalone"
              ? library.works.filter((work) => !work.series_id).length
              : library.works.filter((work) => work.status === item.id).length;
            return (
              <button key={item.id} className={filter === item.id ? "active" : ""} type="button" onClick={() => { setFilter(item.id); setSidebarOpen(false); }}>
                <Icon size={17} /><span>{item.label}</span><b>{count}</b>
              </button>
            );
          })}
          <div className="nav-series-heading"><span className="nav-label">SERIES</span><button type="button" onClick={() => openSeriesEditor()} aria-label="시리즈 추가"><Plus size={16} /></button></div>
          <div className="series-nav-list">
            {library.series.map((series) => (
              <button key={series.id} type="button" onClick={() => { setSelectedSeriesId(series.id); setSidebarOpen(false); }}>
                <span className="series-dot" /><span>{series.title}</span><b>{library.works.filter((work) => work.series_id === series.id).length}</b>
              </button>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <span className={`connection-dot ${store.mode}`} />
          <div><strong>{store.mode === "supabase" ? "Supabase 연결됨" : "브라우저 저장 모드"}</strong><small>{store.mode === "supabase" ? "클라우드에 자동 저장" : "환경 변수 연결 전 데모"}</small></div>
          <Database size={17} />
        </div>
      </aside>

      {sidebarOpen && <button className="mobile-overlay" type="button" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기"><Menu size={21} /></button>
          <span className="mobile-wordmark">light.light<span className="mobile-wordmark-dot">.</span></span>
          <div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="작품명이나 시리즈로 검색" aria-label="컬렉션 검색" />{search && <button type="button" onClick={() => setSearch("")} aria-label="검색어 지우기"><X size={16} /></button>}</div>
          <div className="top-actions"><button className="button secondary hide-mobile" type="button" onClick={() => openSeriesEditor()}><Plus size={16} /> 새 시리즈</button><button className="button primary" type="button" onClick={() => openWorkEditor()}><Plus size={18} /><span className="add-label">작품 추가</span></button></div>
        </header>

        <div className="content-wrap">
          {store.error && <div className="error-banner" role="alert"><span>{store.error}</span><button type="button" onClick={store.clearError}><X size={16} /></button></div>}
          <section className="collection-hero">
            <div><span className="eyebrow">THE PERSONAL LIBRARY</span><h1>이야기를 모으는 공간<span className="hero-period">.</span></h1><p>좋아하는 이야기의 모든 순간을, 나만의 서재에.</p></div>
            <div className="stats-row"><div><span>전체 작품</span><strong>{stats.total}</strong></div><div><span>읽는 중</span><strong className="amber">{stats.reading}</strong></div><div><span>완독</span><strong>{stats.completed}</strong></div></div>
          </section>
          <nav className="mobile-filters" aria-label="빠른 컬렉션 필터">
            {filterItems.map((item) => (
              <button key={item.id} type="button" className={`filter-chip ${filter === item.id ? "active" : ""}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>
            ))}
          </nav>
          <div className="toolbar">
            <div className="active-filter"><SlidersHorizontal size={15} /> {filterItems.find((item) => item.id === filter)?.label}<span>{filteredWorks.length}</span></div>
            <label className="sort-select"><span>정렬</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="recent">최근 업데이트</option><option value="title">제목</option><option value="series">시리즈</option><option value="status">상태</option></select></label>
          </div>

          {store.loading ? <div className="shelf-skeleton" aria-label="컬렉션 불러오는 중"><div /><div /><div /><div /></div>
            : filteredWorks.length === 0 ? (
              <section className="empty-state"><div className="empty-icon"><Sparkles size={27} /></div><h2>{query ? "검색 결과가 없습니다" : "이 선반은 아직 비어 있어요"}</h2><p>{query ? "다른 작품명이나 시리즈명을 입력해 보세요." : "첫 작품을 기록하면 나만의 디지털 서재가 시작됩니다."}</p>{!query && <button className="button primary" type="button" onClick={() => openWorkEditor()}><Plus size={16} /> 첫 작품 추가</button>}</section>
            ) : (
              <div className="shelves">
                {shelves.grouped.map(({ series, works }) => <Shelf key={series.id} series={series} works={works} onOpenSeries={() => setSelectedSeriesId(series.id)} onOpenWork={(work) => setSelectedWorkId(work.id)} />)}
                {shelves.standalone.length > 0 && <Shelf works={shelves.standalone} onOpenWork={(work) => setSelectedWorkId(work.id)} />}
              </div>
            )}
        </div>
      </main>

      {workEditorOpen && <WorkEditor key={editingWork?.id ?? "new-work"} work={editingWork} series={library.series} onSave={(work) => void store.saveWork(work)} onClose={() => { setWorkEditorOpen(false); setEditingWork(undefined); }} />}
      {seriesEditorOpen && <SeriesEditor key={editingSeries?.id ?? "new-series"} series={editingSeries} onSave={(series) => void store.saveSeries(series)} onClose={() => { setSeriesEditorOpen(false); setEditingSeries(undefined); }} />}
      {selectedWork && <WorkDetail work={selectedWork} series={selectedWork.series_id ? seriesMap.get(selectedWork.series_id) : undefined} memos={library.memos.filter((memo) => memo.work_id === selectedWork.id)} onClose={() => setSelectedWorkId(null)} onEdit={() => openWorkEditor(selectedWork)} onSaveWork={(work) => void store.saveWork(work)} onDeleteWork={() => { void store.deleteWork(selectedWork.id); setSelectedWorkId(null); }} onSaveMemo={(memo) => void store.saveMemo(memo)} onDeleteMemo={(id) => void store.deleteMemo(id)} />}
      {selectedSeries && <SeriesDetail series={selectedSeries} works={library.works.filter((work) => work.series_id === selectedSeries.id)} onClose={() => setSelectedSeriesId(null)} onEdit={() => openSeriesEditor(selectedSeries)} onDelete={() => { void store.deleteSeries(selectedSeries.id); setSelectedSeriesId(null); }} onOpenWork={(work) => { setSelectedSeriesId(null); setSelectedWorkId(work.id); }} />}
    </div>
  );
}
