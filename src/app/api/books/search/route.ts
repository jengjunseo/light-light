import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  isbn: string;
  description: string;
  cover: string;
  link: string;
  source: string;
};
type KakaoBook = {
  title?: string;
  authors?: string[];
  publisher?: string;
  datetime?: string;
  isbn?: string;
  contents?: string;
  thumbnail?: string;
  url?: string;
};
type GoogleBook = {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    language?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: Record<string, string>;
    infoLink?: string;
  };
};

const HANGUL = /[가-힣]/;
const ISBN = /^(?:97[89])?\d{9}[\dX]$/i;

function safeUrl(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
function plainText(value?: string): string {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);
}
function normalizeQuery(input: string): string {
  const query = input.trim();
  // Common names for the series shown in the Korean bookshelves. Never
  // translate arbitrary English queries by guessing the edition or ISBN.
  const indexAlias = /(?:a certain magic(?:al)? index|toaru majutsu no index|어마금|어떤 마술의 인덱스)/i;
  if (indexAlias.test(query)) {
    const volume = query.match(/(?:vol(?:ume)?\.?\s*|제\s*)(\d{1,3})(?:\s*권)?/i)
      ?? query.match(/(?:\s|^)(\d{1,3})\s*권?\s*$/);
    const prefix = /(?:new testament|신약)/i.test(query) ? "신약 " : /(?:genesis testament|창약)/i.test(query) ? "창약 " : "";
    return `${prefix}어떤 마술의 금서목록${volume ? ` ${volume[1]}` : ""}`;
  }
  return query;
}
function isKoreanEdition(book: Book): boolean {
  // Keep Korean-titled domestic listings only. English/Japanese translations
  // should not be displayed as the cover of a Korean edition.
  return HANGUL.test(book.title);
}
function isbn13(value: string): string {
  const parts = value.split(/\s+/).map((part) => part.replace(/[-\s]/g, ""));
  return parts.find((part) => /^97[89]\d{10}$/.test(part))
    ?? parts.find((part) => ISBN.test(part))
    ?? "";
}
async function fromKakao(query: string, isIsbn: boolean): Promise<Book[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return [];
  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  url.searchParams.set("target", isIsbn ? "isbn" : "title");
  url.searchParams.set("size", "50");
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    signal: AbortSignal.timeout(7000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`Kakao book search failed (${response.status})`);
  const data = (await response.json()) as { documents?: KakaoBook[] };
  return (data.documents ?? [])
    .filter((item) => item.title)
    .map((item) => ({
      id: `kakao:${isbn13(item.isbn ?? "") || item.url || item.title}`,
      title: plainText(item.title),
      authors: item.authors ?? [],
      publisher: item.publisher ?? "",
      publishedDate: item.datetime?.slice(0, 10) ?? "",
      isbn: isbn13(item.isbn ?? ""),
      description: plainText(item.contents),
      cover: safeUrl(item.thumbnail),
      link: safeUrl(item.url),
      source: "카카오 도서 · 국내판",
    }))
    .filter(isKoreanEdition);
}
async function fromGoogle(query: string, isIsbn: boolean): Promise<Book[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", isIsbn ? `isbn:${query}` : query);
  url.searchParams.set("langRestrict", "ko");
  url.searchParams.set("country", "KR");
  url.searchParams.set("printType", "books");
  url.searchParams.set("maxResults", "40");
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set("key", key);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(7000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`Google Books search failed (${response.status})`);
  const data = (await response.json()) as { items?: GoogleBook[] };
  return (data.items ?? [])
    .filter((item) => item.volumeInfo?.title)
    .filter((item) => !item.volumeInfo?.language || item.volumeInfo.language.toLowerCase() === "ko")
    .map((item) => {
      const info = item.volumeInfo!;
      const identifiers = info.industryIdentifiers ?? [];
      const image = info.imageLinks ?? {};
      return {
        id: `google:${item.id ?? info.title}`,
        title: plainText(info.title! + (info.subtitle ? `: ${info.subtitle}` : "")),
        authors: info.authors ?? [],
        publisher: info.publisher ?? "",
        publishedDate: info.publishedDate ?? "",
        isbn: isbn13(identifiers.find((id) => id.type === "ISBN_13")?.identifier ?? identifiers[0]?.identifier ?? ""),
        description: plainText(info.description),
        cover: safeUrl(image.large ?? image.medium ?? image.small ?? image.thumbnail ?? image.smallThumbnail),
        link: safeUrl(info.infoLink),
        source: "Google Books · 한국어판",
      };
    })
    .filter(isKoreanEdition);
}
function sortBooks(books: Book[], query: string): Book[] {
  const term = query.replace(/\s*\d+\s*권?\s*$/, "").replace(/\s+/g, "").toLocaleLowerCase("ko");
  const score = (book: Book): number => {
    const title = book.title.replace(/\s+/g, "").toLocaleLowerCase("ko");
    return (title.includes(term) ? 10 : 0) + (book.cover ? 2 : 0) + (book.source.startsWith("카카오") ? 1 : 0);
  };
  return books.sort((a, b) => score(b) - score(a));
}
function deduplicate(books: Book[]): Book[] {
  const seen = new Set<string>();
  return books.filter((book) => {
    const key = book.isbn || `${book.title.toLocaleLowerCase("ko")}:${book.publisher.toLocaleLowerCase("ko")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (rawQuery.length < 2 || rawQuery.length > 120) {
    return NextResponse.json({ error: "두 글자 이상, 120자 이하로 검색해 주세요." }, { status: 400 });
  }
  const query = normalizeQuery(rawQuery);
  const compact = query.replace(/[\s-]/g, "");
  const isIsbn = ISBN.test(compact);
  const errors: string[] = [];
  let kakaoBooks: Book[] = [];
  let googleBooks: Book[] = [];
  try {
    try { kakaoBooks = await fromKakao(isIsbn ? compact : query, isIsbn); }
    catch (error) { console.warn("Kakao book search unavailable", error); errors.push("카카오"); }
    try { googleBooks = await fromGoogle(isIsbn ? compact : query, isIsbn); }
    catch (error) { console.warn("Korean Google Books search unavailable", error); errors.push("Google Books"); }
    if (errors.length === 2 || (!process.env.KAKAO_REST_API_KEY && errors.includes("Google Books"))) {
      return NextResponse.json({ error: "국내 도서 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
    }
    const books = deduplicate(sortBooks([...kakaoBooks, ...googleBooks], query)).slice(0, 40);
    return NextResponse.json(
      { books, normalizedQuery: query, region: "KR", language: "ko" },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=3600" } },
    );
  } catch (error) {
    console.error("Korean book search failed", error);
    return NextResponse.json({ error: "국내 도서 검색에 연결하지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
