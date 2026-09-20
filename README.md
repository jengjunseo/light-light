# Light Novel Collection

읽은 라이트노벨을 시리즈와 권 단위로 정리하고, 읽기 상태·소개글·참고 링크·감상 메모를 한곳에 모으는 개인용 디지털 서재입니다.

## 주요 기능

- 작품과 시리즈 생성, 조회, 수정, 삭제
- 단권 작품 및 시리즈별 권 번호 관리
- `읽고 싶음`, `읽는 중`, `완독`, `보류` 상태 관리
- 작품명과 시리즈명 검색, 상태 필터, 정렬
- 표지 URL 및 표지 없는 작품의 placeholder
- 빠른 메모 작성, 다중 메모, debounce 자동 저장
- 나무위키·Google 검색 링크와 사용자 정의 참고 링크
- 직접 입력한 텍스트 또는 참고 URL을 이용한 OpenRouter 소개글 초안
- Supabase 연결 전에도 확인할 수 있는 브라우저 저장 데모 모드

## 로컬 개발

Node.js 20 이상과 npm을 사용합니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`http://localhost:3000`에서 앱을 엽니다. Supabase 변수가 비어 있으면 브라우저 `localStorage`에 데모 데이터와 변경사항을 저장합니다. 이 모드는 UI와 기능 검증을 위한 fallback이며, 브라우저별로 데이터가 분리됩니다.

## 환경 변수

| 이름 | 필수 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 사용 시 | Supabase 프로젝트 API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 사용 시 | RLS와 함께 사용하는 publishable key |
| `OPENROUTER_API_KEY` | AI 기능 사용 시 | 서버 전용 OpenRouter 키 |
| `OPENROUTER_MODEL` | 선택 | 기본값 `openai/gpt-oss-20b` |

`OPENROUTER_API_KEY`는 `NEXT_PUBLIC_` 접두사를 붙이지 않으며 클라이언트 번들에 노출하지 않습니다.

## Supabase 스키마

초기 migration은 [`supabase/migrations/20260808121449_initial_library_schema.sql`](supabase/migrations/20260808121449_initial_library_schema.sql)에 있습니다.

Supabase 프로젝트를 만든 뒤 CLI로 연결하고 migration을 적용합니다.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

이 제품은 명세에 따라 로그인 없는 1인용 앱입니다. 따라서 migration은 `anon` 역할에 세 테이블의 CRUD를 허용하는 RLS 정책을 포함합니다. 신뢰할 수 있는 개인 Preview URL에서만 사용하거나, 공개 배포 전에 별도의 접근 제어를 추가하세요.

2026년 Supabase Data API 기본값 변경에 대응해 테이블 권한을 migration에서 명시적으로 `grant`하고 모든 공개 테이블에 RLS를 활성화합니다.

## OpenRouter

`/api/synopsis` Route Handler가 서버에서 OpenRouter를 호출합니다. URL 자료는 공개 HTTP/HTTPS 문서만 허용하며, 내부 네트워크 주소·인증 정보가 포함된 URL·텍스트가 아닌 응답을 거부합니다. API 키가 없거나 외부 페이지 추출이 실패해도 앱은 중단되지 않고 편집 가능한 오류 메시지를 보여줍니다.

## 검증

```bash
npm run typecheck
npm run lint
npm run build
```

## Vercel Preview

저장소는 Vercel 프로젝트 `wondaes-projects-fe5c826b/light-light`에 연결됩니다. Preview 환경에 위 변수를 추가한 뒤 production 옵션 없이 배포합니다.

```bash
npx vercel deploy
```

Production promotion 또는 Production Branch 변경은 이 프로젝트 범위에 포함되지 않습니다.
