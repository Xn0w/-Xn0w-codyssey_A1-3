// ===========================================================
// main.js
// 모든 페이지에서 공통으로 쓰는 기능:
//  1) 좌측 거터(줄번호 여백)에 화면 높이만큼 줄번호를 채워 넣기
//  2) 현재 페이지에 해당하는 네비게이션 링크에 aria-current 표시
// ===========================================================

/**
 * 거터(.gutter) 요소 안에 화면 높이에 맞춰 줄번호를 생성한다.
 * 실제 코드 에디터의 줄번호처럼 보이도록 하는 순수 장식용 요소이며,
 * 화면 크기가 바뀌면(리사이즈) 다시 계산해서 채운다.
 */
function fillGutter() {
  const gutter = document.querySelector('.gutter');
  if (!gutter) return;

  const lineHeight = 28; // css의 .gutter span height 값과 동일해야 함
  const lineCount = Math.ceil(window.innerHeight / lineHeight) + 5;

  // 매번 새로 그리기 전에 기존 내용을 비운다
  gutter.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (let i = 1; i <= lineCount; i += 1) {
    const span = document.createElement('span');
    span.textContent = String(i).padStart(2, '0');
    fragment.appendChild(span);
  }
  gutter.appendChild(fragment);
}

/**
 * 현재 문서 경로와 네비게이션 링크의 href를 비교해서
 * 일치하는 링크에 aria-current="page"를 붙인다.
 * (CSS에서 이 속성을 이용해 밑줄 강조를 준다)
 */
function markActiveNavLink() {
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const linkFile = link.getAttribute('href');
    if (linkFile === currentFile) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fillGutter();
  markActiveNavLink();
});

// 화면 크기가 바뀔 때마다 거터 줄번호도 다시 계산 (디바운스 적용)
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fillGutter, 150);
});
