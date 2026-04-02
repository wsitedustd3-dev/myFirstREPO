/* ====================================================
   TRIPPICK — APP UI CONTROLLER
   상태바 시간 · 탭 전환 · CTA 연결 · 마이페이지 폼
   ==================================================== */

(function initAppUI() {
  'use strict';

  /* ─────────────────────────────────────────
     1. 상태바 시간 업데이트
     ───────────────────────────────────────── */
  const sbTime = document.getElementById('sbTime');

  function updateTime() {
    if (!sbTime) return;
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    sbTime.textContent = h + ':' + m;
  }
  updateTime();
  setInterval(updateTime, 10000); // 10초마다 갱신

  /* ─────────────────────────────────────────
     2. 상태바 테마 토글
     ───────────────────────────────────────── */
  const themeBtn = document.getElementById('themeToggleApp');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const willBeDark = !document.documentElement.classList.contains('dark-mode');
      document.documentElement.classList.toggle('dark-mode', willBeDark);
      try { localStorage.setItem('trippick-theme', willBeDark ? 'dark' : 'light'); } catch(e) {}
    });
  }

  /* ─────────────────────────────────────────
     3. 탭 전환 코어
     ───────────────────────────────────────── */
  const tabs    = document.querySelectorAll('.app-tab');
  const navBtns = document.querySelectorAll('.bnav-btn');
  let   current = 'home';

  function switchTab(targetId, smooth = true) {
    if (targetId === current) return;

    const prevTab = document.getElementById('tab-' + current);
    const nextTab = document.getElementById('tab-' + targetId);
    if (!nextTab) return;

    // 방향 결정 (탭 순서 기준)
    const ORDER = ['home', 'search', 'plan', 'heart', 'mypage'];
    const prevIdx = ORDER.indexOf(current);
    const nextIdx = ORDER.indexOf(targetId);
    const goRight = nextIdx > prevIdx;

    // 이전 탭 퇴장
    if (prevTab) {
      prevTab.classList.remove('tab-active');
      prevTab.classList.add(goRight ? 'tab-exit-left' : 'tab-enter-right');
      setTimeout(() => {
        prevTab.classList.remove('tab-exit-left', 'tab-enter-right');
      }, 380);
    }

    // 다음 탭 진입
    nextTab.style.transform = goRight ? 'translateX(30px)' : 'translateX(-30px)';
    nextTab.style.opacity   = '0';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextTab.classList.add('tab-active');
        nextTab.style.transform = '';
        nextTab.style.opacity   = '';
      });
    });

    // 하단 네비 활성화
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === targetId);
    });

    // 플래닝 탭 진입 시 데모 섹션 이식
    if (targetId === 'plan') {
      embedDemoSection();
      // hero 잠금 해제 (잠금 상태라면)
      if (document.body.classList.contains('hero-locked')) {
        unlockHero(false);
      }
    }

    current = targetId;

    // 홈 탭으로 돌아올 때 스크롤 최상단
    if (targetId === 'home') {
      const homeTab = document.getElementById('tab-home');
      if (homeTab) homeTab.scrollTop = 0;
    }
  }

  // 하단 네비 버튼 클릭
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (!target) return;
      // 버튼 터치 효과
      btn.style.transform = 'scale(0.92)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
      switchTab(target);
    });
  });

  // 초기 활성 탭
  const firstTab = document.getElementById('tab-home');
  if (firstTab) firstTab.classList.add('tab-active');

  /* ─────────────────────────────────────────
     4. 데모 섹션 → 플래닝 탭 이식
     ───────────────────────────────────────── */
  let demoEmbedded = false;

  function embedDemoSection() {
    if (demoEmbedded) return;
    const demoEmbed  = document.getElementById('demo-embed');
    const demoSource = document.getElementById('demo');
    if (!demoEmbed || !demoSource) return;

    // 데모 섹션을 홈 탭에서 플래닝 탭으로 이동
    demoEmbed.appendChild(demoSource);
    demoSource.style.display = '';
    demoEmbedded = true;

    // Leaflet 지도 재초기화 (이동 후 크기 갱신)
    setTimeout(() => {
      if (window._tripMap) {
        try { window._tripMap.invalidateSize(); } catch(e) {}
      }
    }, 400);
  }

  /* ─────────────────────────────────────────
     5. 히어로 CTA → 플래닝 탭 전환
     ───────────────────────────────────────── */
  const heroCta = document.getElementById('heroCta');
  if (heroCta) {
    heroCta.addEventListener('click', (e) => {
      e.preventDefault();
      // 히어로 잠금 해제 + 플래닝 탭으로 전환
      if (document.body.classList.contains('hero-locked')) {
        unlockHero(true);
      } else {
        switchTab('plan');
      }
    });
  }

  /* ─────────────────────────────────────────
     6. 히어로 잠금 해제 함수 (main.js와 연동)
     ───────────────────────────────────────── */
  function unlockHero(goToPlan) {
    if (!document.body.classList.contains('hero-locked')) {
      if (goToPlan) switchTab('plan');
      return;
    }
    // main.js의 공개 함수 호출
    if (window._heroUnlock) {
      window._heroUnlock(() => {
        if (goToPlan) setTimeout(() => switchTab('plan'), 120);
      });
    }
  }

  /* ─────────────────────────────────────────
     7. 마이페이지 — 로그인 / 회원가입 탭 전환
     ───────────────────────────────────────── */
  const authLoginTab  = document.getElementById('authLoginTab');
  const authSignupTab = document.getElementById('authSignupTab');
  const loginForm     = document.getElementById('loginForm');
  const signupForm    = document.getElementById('signupForm');

  function switchAuthTab(showLogin) {
    if (!loginForm || !signupForm) return;
    if (showLogin) {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      authLoginTab && authLoginTab.classList.add('active');
      authSignupTab && authSignupTab.classList.remove('active');
    } else {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      authLoginTab && authLoginTab.classList.remove('active');
      authSignupTab && authSignupTab.classList.add('active');
    }
  }

  authLoginTab  && authLoginTab.addEventListener('click',  () => switchAuthTab(true));
  authSignupTab && authSignupTab.addEventListener('click',  () => switchAuthTab(false));

  // 폼 제출 (데모용 — 실제 서버 없음)
  loginForm && loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('✅ 로그인 기능은 준비 중이에요!');
  });
  signupForm && signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('✅ 회원가입 기능은 준비 중이에요!');
  });

  // 소셜 버튼
  document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('소셜 로그인은 준비 중이에요 🔜');
    });
  });

  /* ─────────────────────────────────────────
     8. 알림 버튼
     ───────────────────────────────────────── */
  const sbNotif = document.getElementById('sbNotif');
  if (sbNotif) {
    sbNotif.addEventListener('click', () => {
      showToast('🔔 알림 기능은 준비 중이에요!');
    });
  }

  /* ─────────────────────────────────────────
     9. 토스트 알림
     ───────────────────────────────────────── */
  let toastTimer = null;

  function showToast(msg) {
    let toast = document.querySelector('.app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  /* ─────────────────────────────────────────
     10. 상태바 로고 클릭 → 홈 이동
     ───────────────────────────────────────── */
  const sbLogoBtn = document.getElementById('sbLogoBtn');
  if (sbLogoBtn) {
    sbLogoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('home');
      // 홈 탭에서 히어로가 hidden 상태면 스크롤 최상단
      const homeTab = document.getElementById('tab-home');
      if (homeTab) homeTab.scrollTop = 0;
    });
  }

  /* ─────────────────────────────────────────
     11. 홈 탭 내 기존 앵커 링크 처리
     ───────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === '#') return;

    // #demo 링크는 플래닝 탭으로
    if (href === '#demo') {
      e.preventDefault();
      switchTab('plan');
      return;
    }

    // hero-locked 상태에서 다른 앵커 차단
    if (document.body.classList.contains('hero-locked')) {
      e.preventDefault();
    }
  }, true); // capture phase

})();
