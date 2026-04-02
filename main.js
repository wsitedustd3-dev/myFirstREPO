/* ====================================================
   TRIPPICK — APP UI LAYER
   상단 상태바 · 하단 네비게이션 · 탭 전환 · 마이페이지
   ==================================================== */

/* ──────────────────────────────────────────────────
   0. 글로벌 앱 레이아웃
   ────────────────────────────────────────────────── */
body.app-mode {
  /* 상단 상태바(56px) + 하단 네비(72px) 공간 확보 */
  padding-top: 56px;
  padding-bottom: 72px;
  overflow-x: hidden;
}

/* ──────────────────────────────────────────────────
   1. 상단 상태바 (Top Status Bar)
   ────────────────────────────────────────────────── */
.app-statusbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bg, #f5f5ff);
  border-bottom: 1px solid var(--border, rgba(108,99,255,0.1));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: background 0.3s ease, border-color 0.3s ease;
}

html.dark-mode .app-statusbar {
  background: rgba(8, 6, 20, 0.95);
  border-bottom-color: rgba(255,255,255,0.07);
}

/* 현재 시각 */
.sb-time {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text, #1a1a2e);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  min-width: 38px;
}

html.dark-mode .sb-time { color: #e0deff; }

/* 중앙 로고 */
.sb-logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text, #1a1a2e);
  text-decoration: none;
  letter-spacing: -0.4px;
}

html.dark-mode .sb-logo { color: #e0deff; }
.sb-logo .logo-icon { font-size: 1rem; }

/* 우측 아이콘 그룹 */
.sb-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sb-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: var(--text-muted, #6b7280);
  transition: background 0.2s ease, transform 0.15s ease, color 0.2s ease;
  position: relative;
}
.sb-icon-btn:hover {
  background: rgba(108,99,255,0.1);
  color: var(--primary, #6C63FF);
  transform: scale(1.08);
}
.sb-icon-btn:active { transform: scale(0.94); }

/* 알림 뱃지 */
.notif-badge {
  position: absolute;
  top: 4px; right: 4px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--secondary, #FF6584);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg, #f5f5ff);
}
html.dark-mode .notif-badge {
  border-color: rgba(8,6,20,0.95);
}

/* ──────────────────────────────────────────────────
   2. 앱 메인 콘텐츠 영역
   ────────────────────────────────────────────────── */
.app-main {
  position: relative;
  width: 100%;
  min-height: calc(100vh - 56px - 72px);
  overflow: hidden;
}

/* ──────────────────────────────────────────────────
   3. 탭 콘텐츠 전환
   ────────────────────────────────────────────────── */
.app-tab {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  min-height: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateX(30px);
  transition: opacity 0.35s cubic-bezier(0.4,0,0.2,1),
              transform 0.35s cubic-bezier(0.4,0,0.2,1);
  /* 내부 스크롤 */
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.app-tab.tab-active {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  position: relative; /* 활성 탭만 흐름 차지 */
}

/* 탭 나가기 방향 애니메이션 */
.app-tab.tab-exit-left {
  opacity: 0;
  transform: translateX(-30px);
}
.app-tab.tab-enter-right {
  opacity: 0;
  transform: translateX(30px);
}

/* ──────────────────────────────────────────────────
   4. 하단 네비게이션 바 (Bottom Navigation)
   ────────────────────────────────────────────────── */
.app-bottom-navbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 72px;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--bg, #f5f5ff);
  border-top: 1px solid var(--border, rgba(108,99,255,0.1));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

html.dark-mode .app-bottom-navbar {
  background: rgba(8,6,20,0.96);
  border-top-color: rgba(255,255,255,0.07);
}

/* 일반 탭 버튼 */
.bnav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px 0;
  color: var(--text-muted, #9ca3af);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color 0.2s ease, transform 0.15s ease;
  position: relative;
}
.bnav-btn i {
  font-size: 1.25rem;
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), color 0.2s ease;
}
.bnav-btn:hover i   { transform: translateY(-2px) scale(1.12); }
.bnav-btn:active i  { transform: scale(0.9); }

/* 활성 탭 */
.bnav-btn.active {
  color: var(--primary, #6C63FF);
}
.bnav-btn.active i {
  transform: translateY(-2px) scale(1.1);
}
/* 활성 탭 상단 인디케이터 점 */
.bnav-btn.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px; height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--primary, #6C63FF);
}

/* + 플래닝 버튼 — 특별 스타일 */
.bnav-btn.bnav-plus {
  flex: 1.1;
}
.plus-ring {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--gradient, linear-gradient(135deg,#6C63FF,#43CFBB));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 18px rgba(108,99,255,0.45);
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
              box-shadow 0.2s ease;
  margin-bottom: 2px;
}
.plus-ring i {
  font-size: 1.2rem;
  color: #fff !important;
  transform: none !important;
}
.bnav-btn.bnav-plus:hover .plus-ring {
  transform: translateY(-3px) scale(1.08);
  box-shadow: 0 8px 28px rgba(108,99,255,0.55);
}
.bnav-btn.bnav-plus:active .plus-ring {
  transform: scale(0.93);
}
.bnav-btn.bnav-plus.active .plus-ring {
  box-shadow: 0 6px 24px rgba(108,99,255,0.6);
  transform: translateY(-2px) scale(1.04);
}
.bnav-btn.bnav-plus.active::before { display: none; }
.bnav-btn.bnav-plus span { color: var(--text-muted, #9ca3af); font-size: 0.62rem; }
.bnav-btn.bnav-plus.active span { color: var(--primary, #6C63FF); }

/* ──────────────────────────────────────────────────
   5. 플래닝 탭 헤더
   ────────────────────────────────────────────────── */
.plan-tab-inner {
  padding-top: 0;
}
.plan-tab-header {
  padding: 28px 24px 4px;
  background: var(--bg, #f5f5ff);
}
.plan-tab-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text, #1a1a2e);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.plan-tab-title i { color: var(--primary, #6C63FF); }
.plan-tab-sub {
  font-size: 0.88rem;
  color: var(--text-muted, #9ca3af);
  margin: 0 0 8px;
}

/* ──────────────────────────────────────────────────
   6. 준비 중 화면 (Coming Soon)
   ────────────────────────────────────────────────── */
.coming-soon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px - 72px);
  padding: 32px 24px;
}
.coming-soon-card {
  text-align: center;
  padding: 48px 36px;
  background: var(--bg-card, #fff);
  border-radius: 28px;
  border: 1px solid var(--border, rgba(108,99,255,0.1));
  box-shadow: 0 8px 32px rgba(108,99,255,0.08);
  max-width: 320px;
  width: 100%;
  animation: csCardIn 0.5s cubic-bezier(0.4,0,0.2,1) both;
}
@keyframes csCardIn {
  from { opacity:0; transform: translateY(24px) scale(0.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
.cs-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: csIconFloat 2.5s ease-in-out infinite;
}
@keyframes csIconFloat {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
.coming-soon-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text, #1a1a2e);
  margin-bottom: 10px;
}
.coming-soon-card p {
  font-size: 0.88rem;
  color: var(--text-muted, #9ca3af);
  line-height: 1.6;
  margin-bottom: 20px;
}
.cs-badge {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 50px;
  background: rgba(108,99,255,0.12);
  color: var(--primary, #6C63FF);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ──────────────────────────────────────────────────
   7. 마이페이지 — 로그인·회원가입 화면
   ────────────────────────────────────────────────── */
.mypage-wrap {
  min-height: calc(100vh - 56px - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
}

.auth-screen {
  width: 100%;
  max-width: 400px;
  animation: authIn 0.45s cubic-bezier(0.4,0,0.2,1) both;
}
@keyframes authIn {
  from { opacity:0; transform: translateY(28px); }
  to   { opacity:1; transform: translateY(0); }
}

/* 상단 로고 */
.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text, #1a1a2e);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.auth-logo .logo-icon { font-size: 1.4rem; }

.auth-tagline {
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-muted, #9ca3af);
  margin-bottom: 28px;
}

/* 로그인 / 회원가입 탭 */
.auth-tabs {
  display: flex;
  background: var(--bg-card2, rgba(108,99,255,0.07));
  border-radius: 14px;
  padding: 4px;
  margin-bottom: 24px;
  gap: 4px;
}
.auth-tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted, #9ca3af);
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.auth-tab-btn.active {
  background: var(--bg-card, #fff);
  color: var(--primary, #6C63FF);
  box-shadow: 0 2px 8px rgba(108,99,255,0.15);
}

/* 입력 필드 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.auth-form.hidden { display: none; }

.auth-field {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, rgba(108,99,255,0.15));
  border-radius: 14px;
  padding: 14px 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.auth-field:focus-within {
  border-color: var(--primary, #6C63FF);
  box-shadow: 0 0 0 3px rgba(108,99,255,0.12);
}
.auth-field i {
  font-size: 0.9rem;
  color: var(--text-muted, #9ca3af);
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}
.auth-field input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text, #1a1a2e);
  font-family: inherit;
}
.auth-field input::placeholder {
  color: var(--text-muted, #9ca3af);
  font-weight: 400;
}

/* 로그인/회원가입 버튼 */
.btn-auth-primary {
  width: 100%;
  padding: 15px;
  border-radius: 14px;
  border: none;
  background: var(--gradient, linear-gradient(135deg,#6C63FF,#43CFBB));
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 4px;
  letter-spacing: -0.2px;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 24px rgba(108,99,255,0.35);
}
.btn-auth-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(108,99,255,0.45);
}
.btn-auth-primary:active { transform: scale(0.98); }

/* 구분선 */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
  color: var(--text-muted, #9ca3af);
  font-size: 0.78rem;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border, rgba(108,99,255,0.1));
}

/* 소셜 로그인 버튼 */
.social-auth {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.social-btn {
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  border: 1px solid var(--border, rgba(108,99,255,0.15));
  background: var(--bg-card, #fff);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text, #1a1a2e);
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}
.social-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
}
.social-btn:active { transform: scale(0.97); }
.social-btn.kakao {
  background: #FEE500;
  border-color: #FEE500;
  color: #3C1E1E;
}
.social-btn.kakao:hover { background: #f5dc00; }
.social-btn.google {
  border-color: rgba(108,99,255,0.15);
}
.social-btn.google i { color: #EA4335; }
.social-btn.apple {
  background: var(--text, #1a1a2e);
  border-color: var(--text, #1a1a2e);
  color: #fff;
}
.social-btn.apple:hover { opacity: 0.9; }

/* ──────────────────────────────────────────────────
   8. 탭 전환 토스트 알림
   ────────────────────────────────────────────────── */
.app-toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: rgba(20,18,40,0.92);
  color: #fff;
  padding: 10px 22px;
  border-radius: 50px;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  z-index: 3000;
  opacity: 0;
  pointer-events: none;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.app-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* ──────────────────────────────────────────────────
   9. 반응형 보정
   ────────────────────────────────────────────────── */
/* hero 섹션 상태바 패딩 보정 */
.app-mode .hero {
  min-height: calc(100vh - 56px);
}
.app-mode .hero-inner {
  padding-top: 80px;
}

/* 홈 탭 내 기존 navbar 숨김 */
.app-mode .navbar { display: none !important; }

/* 홈 스크롤 콘텐츠 */
#home-scroll-content {
  padding-bottom: 20px;
}

/* dark mode auth */
html.dark-mode .auth-field {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
}
html.dark-mode .auth-field input { color: #e0deff; }
html.dark-mode .social-btn {
  background: rgba(255,255,255,0.05);
  color: #e0deff;
}
html.dark-mode .auth-tab-btn.active {
  background: rgba(108,99,255,0.2);
}
html.dark-mode .coming-soon-card {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}
