# Light Light UI Remaster — 배포 안내

이 폴더는 원본 Light Light Next.js 프로젝트의 기능을 유지하며 디자인만 변경한 배포용 소스입니다.
원본 ZIP에 포함되어 있던 `.env.local`, `.git`, `.vercel` 및 빌드 산출물은 의도적으로 제외했습니다.

## Windows에서 배포하기

1. ZIP을 풀어 나온 `light-light-remaster` 폴더를 엽니다.
2. Git이 설치되어 있고 GitHub 로그인이 되어 있는지 확인합니다.
3. `PUBLISH_TO_GITHUB.cmd`를 실행합니다. GitHub 로그인을 요청하면 본인 계정으로 로그인하세요.
4. 정상적으로 `main`에 푸시되면, Vercel의 Light Light 프로젝트에서 새 배포를 확인합니다. Git 통합이 main 브랜치에 제대로 연결되어 있어야 자동 배포됩니다.

**주의:** 예전 사이트가 Supabase와 OpenRouter를 사용하는 경우, Vercel 프로젝트 설정의 환경 변수가 유지되어 있어야 해당 기능이 동작합니다. 비밀 키를 GitHub에 올리지 마세요. 앱의 원래 Supabase 정책은 로그인 없는 공개 CRUD를 허용하도록 작성되어 있습니다. 실제 데이터가 있는 서비스를 공개 배포할 때에는 별도의 인증/접근 제어를 추가하거나 배포 URL에 접근 제한을 적용하세요.

## 수동 명령어

다음 명령은 빈 `jengjunseo/light-light` 저장소에 처음 업로드하는 경우를 기준으로 합니다.

```bash
git init -b main
git remote add origin https://github.com/jengjunseo/light-light.git
git add .
git commit -m "Remaster Light Light interface"
git push -u origin main
```

## 확인 사항

- 변경한 화면: 데스크톱 사이드바, 검색/버튼, 컬렉션 개요, 표지 카드, 상세 화면, 편집 폼, 모바일 필터/메뉴/하단 시트.
- 기존 작품/시리즈 CRUD, 검색, 정렬, 저장 및 AI 소개글 API는 수정하지 않았습니다.
- 화면 시안은 320px, 390px, 1440px에서 가로 넘침 없이 렌더링한 상태입니다.
- 의존성을 새로 설치할 수 없어 전체 Next.js 프로덕션 빌드와 실서비스 기능 테스트는 실행하지 못했습니다. Vercel 빌드 결과를 반드시 확인하세요.
