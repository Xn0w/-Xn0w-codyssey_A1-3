# AI 코딩 도구 사용 과정 (Claude)

이 문서는 CodeMemo 프로젝트를 만들면서 Claude(AI 코딩 도구)와 나눈 작업 과정을
단계별로 정리한 것입니다. 원본 대화는 스크린샷으로 별도 첨부합니다.

## 1단계 — 서비스 기획 및 초기 스캐폴딩

- 요구사항 문서(과제 안내 이미지 4장)를 Claude에게 전달하고, VSCode 환경에서
  무엇을 어떤 순서로 해야 하는지 설계를 요청함.
- Claude가 8단계 작업 순서(기획 → 폴더 구조 → 프론트엔드 → 반응형 → 백엔드 →
  로컬 테스트 → 배포 → 문서화)를 먼저 제시함.
- "1단계부터 차례대로 구현해달라"고 요청하자, Claude가 서비스 아이디어를
  **"AI 코드 리뷰 도우미(CodeMemo)"**로 제안하고 직접 코드를 작성함.
  - 프론트엔드: `index.html`, `review.html`, `guide.html` (순수 HTML/CSS/JS)
  - 백엔드: `api/review.py` (Vercel Python Serverless Function, Gemini API 연동)
  - 문서: `README.md`, `PLANNING.md`
- 완성된 프로젝트를 zip 파일로 전달받아 로컬 `codememo-ai` 폴더에 압축 해제함.

## 2단계 — GitHub 연동

- `git init`, `git config`(사용자명/이메일 설정 순서 관련 질문 포함), `git add`,
  `git commit`, `git remote add`, `git push` 순서를 Claude에게 안내받으며 진행.
- 중간에 `git add .`를 빼먹고 커밋해 "src refspec main does not match any"
  오류가 발생 → Claude가 원인(스테이징 누락)을 짚어주어 해결.
- GitHub 저장소(`Xn0w/-Xn0w-codyssey_A1-3`)에 정상 push 완료.

## 3단계 — Vercel 배포 및 트러블슈팅

로컬에 Node.js/npm이 없어 `vercel dev`(CLI 로컬 테스트)를 포기하고,
**브라우저 기반 Vercel 대시보드 배포**로 방향을 전환함(Claude가 대안 제시).

진행 중 발생한 오류와 해결 과정:

| 오류 | 원인 | 해결 |
|---|---|---|
| Environment Variable "A1-3" is invalid | Key 입력란에 레포 이름이 잘못 채워짐 | Key를 `GEMINI_API_KEY`로 직접 수정 |
| `No python entrypoint found` | Vercel의 새 Python 런타임이 명시적 entrypoint 요구 | `pyproject.toml`에 `[tool.vercel] entrypoint` 추가 |
| `No 'project' table found in pyproject.toml` | `uv` 빌드가 표준 `[project]` 섹션을 요구 | `pyproject.toml`에 `[project]` 메타데이터(name/version/dependencies) 추가 |
| `Error code: 501 Unsupported method ('GET')` | Import 시 Framework Preset이 "Python"으로 설정되어 모든 요청이 단일 함수로 라우팅됨 | Vercel 프로젝트 Settings에서 Framework Preset을 "Other"로 변경 후 Redeploy |

각 오류마다 Vercel Build Logs 화면을 캡처해 Claude에게 전달했고, Claude가
로그를 읽고 원인을 특정한 뒤 구체적인 수정 코드/설정을 제시하는 방식으로
문제를 해결함.

## 4단계 — 배포 검증

- 배포된 URL(`https://xn0w-codyssey-a1-3.vercel.app`)에서 홈 화면 렌더링을 확인.
- `review.html`에서 실제 코드(A1-2 여행 추천 프로그램 일부)를 붙여넣어
  AI 리뷰 기능이 정상 동작함을 확인(88점, VALIDATION/ROBUSTNESS/READABILITY 등
  피드백 정상 출력).

## 5단계 — 보너스 과제 추가 구현

필수 요구사항 완료 후, Claude에게 보너스 과제 2종을 요청함.

- **데이터 저장 고도화**: 리뷰 결과를 `localStorage`에 최근 10개까지 저장하고,
  `review.html`에 "최근 리뷰 기록" 목록 UI를 추가.
- **UX 고도화**: 다크/라이트 테마 토글 버튼을 전체 페이지에 추가, 선택값을
  `localStorage`에 저장해 페이지 이동 후에도 유지되도록 구현.
- 변경된 8개 파일(`css/style.css`, `js/main.js`, `js/review.js`, `index.html`,
  `review.html`, `guide.html`, `PLANNING.md`, `README.md`)을 Claude로부터
  전달받아 기존 프로젝트에 덮어쓰고, 커밋 후 재배포하여 정상 동작을 확인함.

## 6단계 — 문서 마무리

- 실제 배포 URL을 확인해 `README.md`의 "배포 URL" 항목을 최종 반영.
- 모바일 반응형 확인 방법(개발자도구 기기 툴바 모드)을 Claude에게 안내받아
  실제로 3개 페이지와 AI 기능이 모바일 화면에서도 정상 동작함을 확인함.

## 요약

Claude를 활용해 (1) 요구사항 분석 및 작업 순서 설계, (2) 프론트엔드/백엔드
코드 전체 작성, (3) Git/GitHub 연동 트러블슈팅, (4) Vercel 배포 과정의
런타임 설정 오류 4건 해결, (5) 보너스 기능 구현까지 전 과정을 진행했다.
각 단계에서 발생한 오류는 실제 로그 화면을 Claude에게 전달하고, 원인 분석과
해결 방법을 제시받아 직접 적용하는 방식으로 작업했다.
