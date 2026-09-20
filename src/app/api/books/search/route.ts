import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Book = {
  id: string; title: string; authors: string[]; publisher: string; publishedDate: string;
  isbn: string; description: string; cover: string; link: string; source: string;
};
type KakaoBook = {
  title?: string; authors?: string[]; publisher?: string; datetime?: string;
  isbn?: string; contents?: string; thumbnail?: string; url?: string;
};
type GoogleBook = {
  id?: string;
  volumeInfo?: {
    title?: string; subtitle?: string; authors?: string[]; publisher?: string;
    publishedDate?: string; description?: string;
    industryIdentifiers?: { type?: string; identifier?: string }[];
    imageLinks?: Record<string, string>; infoLink?: string;
  };
};
function httpsUrl(value?: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}
function plainText(value?: string): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim().slice(0, 3000);
}
async function fromKakao(query: string): Promise<Book[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return [];
  const url = new URL("https://dapi.kakao.com/v3/search/book");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "12");
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(7000), next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Kakao 도서 검색 오류 (${response.status})`);
  const data = await response.json() as { documents?: KakaoBook[] };
  return (data.documents ?? []).filter((item) => item.title).map((item) => ({
    id: `kakao:${item.isbn ?? item.title}`,
    title: plainText(item.title), authors: item.authors ?? [], publisher: item.publisher ?? "",
    publishedDate: item.datetime?.slice(0, 10) ?? "", isbn: item.isbn?.split(" ").find((value) => value.length === 13) ?? item.isbn?.split(" ")[0] ?? "",
    description: plainText(item.contents), cover: httpsUrl(item.thumbnail), link: httpsUrl(item.url), source: "카카오 도서",
  }));
}
async function fromGoogle(query: string): Promise<Book[]> {
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("printType", "books");
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key) url.searchParams.set("key", key);
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Google Books 검색 오류 (${response.status})`);
  const data = await response.json() as { items?: GoogleBook[] };
  return (data.items ?? []).filter((item) => item.volumeInfo?.title).map((item) => {
    const info = item.volumeInfo!;
    const identifiers = info.industryIdentifiers ?? [];
    const image = info.imageLinks ?? {};
    return {
      id: `google:${item.id ?? info.title}`, title: info.title! + (info.subtitle ? `: ${info.subtitle}` : ""),
      authors: info.authors ?? [], publisher: info.publisher ?? "", publishedDate: info.publishedDate ?? "",
      isbn: identifiers.find((id) => id.type === "ISBN_13")?.identifier ?? identifiers[0]?.identifier ?? "",
      description: plainText(info.description), cover: httpsUrl(image.large ?? image.medium ?? image.small ?? image.thumbnail ?? image.smallThumbnail),
      link: httpsUrl(info.infoLink), source: "Google Books",
    };
  });
}
async function fromOpenLibrary(query: string): Promise<Book[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "12");
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,cover_i,isbn,publisher");
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Open Library 검색 오류 (${response.status})`);
  const data = await response.json() as { docs?: { key?: string; title?: string; author_name?: string[]; first_publish_year?: number; cover_i?: number; isbn?: string[]; publisher?: string[] }[] };
  return (data.docs ?? []).filter((item) => item.title).map((item) => ({
    id: `openlibrary:${item.key ?? item.title}`, title: item.title!, authors: item.author_name ?? [],
    publisher: item.publisher?.[0] ?? "", publishedDate: item.first_publish_year?.toString() ?? "",
    isbn: item.isbn?.find((value) => value.length === 13) ?? item.isbn?.[0] ?? "",
    description: "", cover: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg?default=false` : "",
    link: item.key ? `https://openlibrary.org${item.key.startsWith("/") ? "" : "/"}${item.key}` : "", source: "Open Library",
  }));
}
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) return NextResponse.json({ error: "두 글자 이상, 120자 이하로 검색해 주세요." }, { status: 400 });
  try {
    let books: Book[] = [];
    try { books = await fromKakao(query); } catch (error) { console.warn("Kakao books unavailable", error); }
    if (!books.length) {
      try { books = await fromGoogle(query); } catch (error) { console.warn("Google Books unavailable", error); }
    }
    if (!books.length) books = await fromOpenLibrary(query);
    return NextResponse.json({ books }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=3600" } });
  } catch (error) {
    console.error("Book lookup failed", error);
    return NextResponse.json({ error: "도서 검색에 연결하지 못했어요. 잠시 후 다시 시도하거나 직접 입력해 주세요." }, { status: 502 });
  }
}
