# CodeMemo — AI 코드 리뷰 도우미

과제나 팀 프로젝트 코드를 제출하기 전, 코드를 붙여넣으면 AI가 가독성·잠재적 버그·개선
포인트를 짧고 구체적으로 짚어주는 학생용 코드 리뷰 웹 서비스입니다.

## 서비스 구성

- **홈 (`index.html`)** — 서비스 소개, 사용 시나리오, 리뷰 결과 미리보기
- **AI 코드 리뷰 (`review.html`)** — 실제 AI 기능. 언어 선택 + 코드 입력 → 리뷰 결과 표시
- **가이드 (`guide.html`)** — 사용 방법 3단계, 오류/지연 상황 안내

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | 순수 HTML / CSS / JavaScript (프레임워크 미사용) |
| 백엔드 | Vercel Serverless Functions (Python, `api/` 폴더) |
| AI API | Google Gemini API (`gemini-2.5-flash`, `google-genai` SDK) |
| 배포 | Vercel (GitHub 연동 자동 배포) |

## AI 기능 동작 방식

1. 사용자가 `review.html`에서 언어를 고르고 코드를 붙여넣은 뒤 "AI 리뷰 요청"을 누릅니다.
2. 프론트엔드(`js/review.js`)가 `POST /api/review`로 `{ code, language }`를 전송합니다.
3. 백엔드(`api/review.py`)가 Gemini API를 호출해 코드를 분석하고,
   `{ score, findings[] }` 형태의 JSON을 돌려받습니다.
4. 프론트엔드가 이를 점수 카드 + 좋음(+)/주의(!)/문제(-) 리스트로 렌더링합니다.

### 실패 처리

- **빈 입력**: 코드가 비어 있으면 API를 호출하지 않고 즉시 안내 메시지를 표시합니다.
- **API 오류(4xx/5xx)**: 서버가 반환한 오류 메시지를 화면에 그대로 안내합니다.
- **지연/타임아웃**: 20초 안에 응답이 없으면 요청을 자동 취소하고 재시도를 안내합니다.

## 로컬에서 실행하기

```bash
# 1) 저장소 클론 후 폴더 이동
git clone <본인 레포지토리 URL>
cd codereview-ai

# 2) Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 3) 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY 값을 본인의 키로 채워 넣기

# 4) 로컬 개발 서버 실행 (프론트+백엔드 동시 실행)
vercel dev
```

`vercel dev`가 실행되면 안내되는 로컬 주소(기본 `http://localhost:3000`)로 접속해
`review.html`에서 AI 리뷰 기능을 테스트할 수 있습니다.

## 배포 방법 (Vercel)

1. GitHub에 이 프로젝트를 푸시합니다.
2. [vercel.com](https://vercel.com)에서 New Project → 해당 GitHub 저장소를 Import 합니다.
3. Vercel 프로젝트 설정 → **Environment Variables**에서 아래 값을 등록합니다.

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | 본인의 Gemini API 키 |

4. Deploy를 누르면 자동으로 프론트엔드 정적 파일과 `api/review.py` 함수가 함께 배포됩니다.
5. 배포가 끝나면 발급된 URL로 접속해 3개 페이지 이동, 모바일 화면, AI 리뷰 기능이
   정상 동작하는지 확인합니다.

## 보너스 구현

- **최근 리뷰 기록**: 리뷰 결과를 브라우저 `localStorage`에 최근 10개까지 저장하고, `review.html`에서 목록으로 다시 열람할 수 있습니다.
- **다크/라이트 테마 토글**: 모든 페이지 상단의 버튼으로 테마를 전환할 수 있고, 선택은 `localStorage`에 저장되어 유지됩니다.

## 배포 URL

> 아직 배포 전입니다. Vercel에 배포한 뒤 이 자리에 실제 URL을 적어 넣으세요.
> 예: `https://codememo-xn0w.vercel.app`

## 환경 변수

| 변수명 | 설명 | 비고 |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio에서 발급받는 Gemini API 키 | 로컬은 `.env`, 배포는 Vercel Environment Variables에 등록. 절대 코드나 커밋 이력에 남기지 않는다 |

## 폴더 구조

```
codereview-ai/
├── index.html          # 홈
├── review.html          # AI 코드 리뷰 페이지
├── guide.html            # 가이드 페이지
├── css/style.css
├── js/main.js            # 공통 스크립트 (네비게이션, 거터 장식)
├── js/review.js          # AI 리뷰 요청/렌더링 로직
├── api/review.py         # Vercel Serverless Function (Gemini API 호출)
├── requirements.txt       # Python 의존성
├── vercel.json             # Vercel 함수 설정(타임아웃 등)
├── .env.example
└── PLANNING.md            # 서비스 기획서
```
