// ===========================================================
// review.js
// review.html 전용 스크립트.
// 폼 제출 → /api/review(백엔드, Vercel Python Serverless Function) 호출
// → 결과를 카드로 렌더링.
//
// 과제 요구사항의 "AI 기능 UX 최소 기준"을 충족하기 위해
// 아래 3가지 실패 상황을 모두 사용자에게 안내한다.
//   1) 빈 입력(필수값 누락)
//   2) API 오류(4xx/5xx)
//   3) 지연/타임아웃
// ===========================================================

const REQUEST_TIMEOUT_MS = 20000; // 20초 넘게 응답이 없으면 타임아웃으로 간주

const form = document.getElementById('review-form');
const codeInput = document.getElementById('code');
const languageSelect = document.getElementById('language');
const submitBtn = document.getElementById('submit-btn');
const statusArea = document.getElementById('status-area');
const resultArea = document.getElementById('result-area');

/**
 * 상태 메시지(로딩/에러)를 status-area에 표시한다.
 * type: 'loading' | 'error' | null(지움)
 */
function setStatus(type, message) {
  statusArea.innerHTML = '';
  if (!type) return;
  const el = document.createElement('div');
  el.className = `status-msg ${type}`;
  el.textContent = message;
  statusArea.appendChild(el);
}

/**
 * fetch에 타임아웃을 적용하기 위한 헬퍼.
 * AbortController를 이용해 REQUEST_TIMEOUT_MS 이후 요청을 강제 취소한다.
 */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 리뷰 결과 JSON을 받아 result-area에 카드 형태로 그린다.
 * 기대하는 응답 형식:
 * {
 *   "score": 78,
 *   "findings": [
 *     { "type": "good" | "warn" | "bad", "tag": "Good", "message": "..." }
 *   ]
 * }
 */
function renderResult(data) {
  resultArea.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'result-card';

  const scoreRow = document.createElement('div');
  scoreRow.className = 'result-score';
  scoreRow.innerHTML = `
    <span class="num">${Number(data.score) || 0}</span>
    <span class="label">/ 100 · 가독성·안정성 종합 점수</span>
  `;
  card.appendChild(scoreRow);

  const markerByType = { good: '+', warn: '!', bad: '-' };

  (data.findings || []).forEach((finding) => {
    const row = document.createElement('div');
    const type = ['good', 'warn', 'bad'].includes(finding.type) ? finding.type : 'warn';
    row.className = `finding ${type}`;

    const marker = document.createElement('span');
    marker.className = 'marker';
    marker.textContent = markerByType[type];

    const body = document.createElement('div');
    body.className = 'body';

    const tag = document.createElement('p');
    tag.className = 'tag';
    tag.textContent = finding.tag || type.toUpperCase();

    const message = document.createElement('p');
    message.textContent = finding.message || '';

    body.appendChild(tag);
    body.appendChild(message);
    row.appendChild(marker);
    row.appendChild(body);
    card.appendChild(row);
  });

  resultArea.appendChild(card);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const code = codeInput.value.trim();
  const language = languageSelect.value;

  // 1) 빈 입력(필수값 누락) 처리
  if (!code) {
    setStatus('error', '코드를 입력해주세요. 빈 상태로는 리뷰를 요청할 수 없습니다.');
    return;
  }

  resultArea.innerHTML = '';
  setStatus('loading', 'AI가 코드를 읽는 중입니다... (최대 20초)');
  submitBtn.disabled = true;

  try {
    const response = await fetchWithTimeout(
      '/api/review',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      },
      REQUEST_TIMEOUT_MS
    );

    // 2) API 오류(4xx/5xx) 처리
    if (!response.ok) {
      let detail = `서버가 ${response.status} 오류를 반환했습니다.`;
      try {
        const errBody = await response.json();
        if (errBody && errBody.error) detail = errBody.error;
      } catch (_) {
        // 응답 본문이 JSON이 아니면 기본 메시지를 그대로 사용
      }
      setStatus('error', `리뷰를 가져오지 못했습니다: ${detail}`);
      return;
    }

    const data = await response.json();
    setStatus(null);
    renderResult(data);
  } catch (error) {
    // 3) 지연/타임아웃(AbortError) 및 네트워크 오류 처리
    if (error.name === 'AbortError') {
      setStatus('error', '응답이 너무 오래 걸려 요청을 중단했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      setStatus('error', '네트워크 오류로 요청에 실패했습니다. 연결 상태를 확인해주세요.');
    }
  } finally {
    submitBtn.disabled = false;
  }
});
