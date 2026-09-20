import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  sourceType?: "text" | "url";
  source?: string;
  title?: string;
};

function isPrivateAddress(address: string) {
  const normalized = address.replace(/^::ffff:/, "").toLowerCase();
  if (normalized === "::1" || normalized === "0.0.0.0" || normalized === "127.0.0.1") return true;
  if (normalized.startsWith("10.") || normalized.startsWith("192.168.") || normalized.startsWith("169.254.")) return true;
  const second = Number(normalized.split(".")[1]);
  if (normalized.startsWith("172.") && second >= 16 && second <= 31) return true;
  return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

async function validatePublicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("올바른 URL을 입력해 주세요.");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("HTTP 또는 HTTPS URL만 사용할 수 있습니다.");
  if (url.username || url.password) throw new Error("인증 정보가 포함된 URL은 사용할 수 없습니다.");
  if (url.hostname === "localhost" || isPrivateAddress(url.hostname)) throw new Error("내부 네트워크 URL은 사용할 수 없습니다.");
  if (!isIP(url.hostname)) {
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
      throw new Error("공개 웹 페이지 URL만 사용할 수 있습니다.");
    }
  }
  return url;
}

function extractReadableText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSourceText(value: string) {
  const url = await validatePublicUrl(value);
  const response = await fetch(url, {
    headers: { "User-Agent": "LightNovelCollection/1.0 (+personal synopsis helper)" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`참고 페이지를 불러오지 못했습니다. (HTTP ${response.status})`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
    throw new Error("텍스트를 읽을 수 있는 웹 페이지가 아닙니다.");
  }
  const text = extractReadableText((await response.text()).slice(0, 500_000));
  if (text.length < 80) throw new Error("소개글을 만들 만큼 읽을 수 있는 텍스트가 없습니다.");
  return text;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const source = body.source?.trim();
  const title = body.title?.trim();
  if (!source || !title || !["text", "url"].includes(body.sourceType ?? "")) {
    return NextResponse.json({ error: "작품명과 참고 자료를 모두 입력해 주세요." }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API 키가 아직 설정되지 않았습니다. 직접 소개글을 작성해 저장할 수 있습니다." },
      { status: 503 },
    );
  }

  try {
    const context = body.sourceType === "url" ? await fetchSourceText(source) : source;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
        "X-Title": "Light Novel Collection",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "당신은 라이트노벨 개인 서재의 편집자입니다. 제공된 자료에 있는 사실만 사용해 한국어 작품 소개 초안을 3~5문장으로 작성하세요. 스포일러와 과장된 평가는 피하고, 출처나 작업 과정을 언급하지 마세요.",
          },
          { role: "user", content: `작품명: ${title}\n\n참고 자료:\n${context.slice(0, 14_000)}` },
        ],
        temperature: 0.45,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("AI 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
      throw new Error(`AI 서비스가 요청을 처리하지 못했습니다. (HTTP ${response.status})`);
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const synopsis = data.choices?.[0]?.message?.content?.trim();
    if (!synopsis) throw new Error("AI가 비어 있는 응답을 반환했습니다.");
    return NextResponse.json({ synopsis });
  } catch (cause) {
    const message = cause instanceof Error && cause.name === "TimeoutError"
      ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
      : cause instanceof Error ? cause.message : "소개글 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
