/* =============================================
   TRIPPICK — MAIN JAVASCRIPT
   ============================================= */

/* =============================================
   🔒 HERO SCROLL LOCK — 진입 시 히어로만 표시
   CTA 클릭 처리는 app-ui.js가 담당
   ============================================= */
(function initHeroLock() {
  const body = document.body;

  // ── 스크롤바 너비 계산 ──
  const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.setProperty('--scrollbar-width', scrollbarW + 'px');

  // ── 초기 잠금 ──
  body.classList.add('hero-locked');

  // ── 잠금 해제 공개 함수 (app-ui.js에서 호출) ──
  window._heroUnlock = function(afterCb) {
    if (!body.classList.contains('hero-locked')) {
      if (afterCb) afterCb();
      return;
    }
    const hero = document.getElementById('hero');
    body.style.paddingRight = '';
    if (hero) hero.classList.add('hero-exit');

    setTimeout(() => {
      if (hero) hero.classList.add('hero-hidden');
      body.classList.remove('hero-locked');
      // heroUnlocked 이벤트 발행 → app-ui.js가 탭 전환
      document.dispatchEvent(new CustomEvent('heroUnlocked'));
      if (afterCb) afterCb();
    }, 750);
  };

  // navbar pointer-events 복원
  const mo = new MutationObserver(() => {
    const navbar = document.getElementById('navbar');
    if (!body.classList.contains('hero-locked') && navbar) {
      navbar.style.pointerEvents = '';
    }
  });
  mo.observe(body, { attributes: true, attributeFilter: ['class'] });
})();

/* =============================================
   🌙/☀️ 테마 토글 — html 클래스 단독 제어
   (head 인라인 스크립트에서 이미 html에 dark-mode 클래스 부여)
   ============================================= */
function applyTheme(isDark) {
  // html 요소 하나만 토글 → CSS var(--bg) 등이 즉시 반영됨
  document.documentElement.classList.toggle('dark-mode', isDark);
  try { localStorage.setItem('trippick-theme', isDark ? 'dark' : 'light'); } catch(e) {}
}

// 페이지 로드 시 저장 테마 복원 (head 스크립트 백업용)
(function() {
  try {
    var saved = localStorage.getItem('trippick-theme');
    applyTheme(saved === 'dark');
  } catch(e) {
    applyTheme(false); // 기본 라이트
  }
})();

// 테마 토글 버튼
document.addEventListener('DOMContentLoaded', function() {
  var _themeBtn = document.getElementById('theme-toggle');
  if (_themeBtn) {
    _themeBtn.addEventListener('click', function() {
      var willBeDark = !document.documentElement.classList.contains('dark-mode');
      applyTheme(willBeDark);
    });
  }
});

/* ---- NAVBAR SCROLL ---- */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

/* =============================================
   🎬 히어로 배경 영상 컨트롤러 (최적화)
   - 첫 번째 영상만 즉시 로드·재생
   - 두 번째 영상은 첫 재생 후 lazy load
   ============================================= */
(function initHeroCrossfade() {
  const vidA = document.getElementById('heroVidA');
  const vidB = document.getElementById('heroVidB');
  if (!vidA || !vidB) return;

  const HOLD_MS = 14000; // 각 영상 유지 시간 (14초)
  let currentVid = 'A';
  let bLoaded = false;

  // ① vidA만 즉시 재생 (페이지 로드 블로킹 최소화)
  vidA.muted = true;
  vidA.loop  = true;
  vidA.playsInline = true;
  vidA.classList.add('active');

  // preload 속성을 metadata로 낮춰 빠른 초기 렌더링
  vidA.preload = 'auto';
  vidB.preload = 'none'; // 처음엔 로드 안 함

  vidA.play().catch(() => {});

  // ② vidB는 교차 전환 직전에 lazy load
  function loadVidB() {
    if (bLoaded) return;
    bLoaded = true;
    const src = vidB.querySelector('source');
    if (src && src.dataset.src) {
      src.src = src.dataset.src;
      vidB.load();
    }
    vidB.muted = true;
    vidB.loop  = true;
    vidB.preload = 'auto';
    vidB.play().catch(() => {});
  }

  // ③ 교차 전환 함수
  function crossfade() {
    if (currentVid === 'A') {
      loadVidB();
      vidA.classList.remove('active');
      vidB.classList.add('active');
      currentVid = 'B';
    } else {
      vidB.classList.remove('active');
      vidA.classList.add('active');
      currentVid = 'A';
    }
  }

  setInterval(crossfade, HOLD_MS);

  // ④ 스크롤 시 부드럽게 영상 페이드 (단순화)
  const heroWrap = document.getElementById('heroVideoWrap');
  if (heroWrap) {
    window.addEventListener('scroll', () => {
      heroWrap.classList.toggle('faded', window.scrollY > 300);
    }, { passive: true });
  }

  // ⑤ 탭 숨김 시 일시정지
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      vidA.pause(); vidB.pause();
    } else {
      if (currentVid === 'A') vidA.play().catch(() => {});
      else vidB.play().catch(() => {});
    }
  });
})();

/* ---- HAMBURGER MENU ---- */
const hamburger = document.getElementById('hamburger');
if (hamburger) hamburger.addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  const isOpen = navLinks.style.display === 'flex';
  navLinks.style.display = isOpen ? 'none' : 'flex';
  if (!isOpen) {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || (isDark ? 'rgba(18,18,31,0.97)' : 'rgba(245,245,255,0.97)');
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.12)');
    Object.assign(navLinks.style, {
      flexDirection: 'column', position: 'absolute',
      top: '70px', right: '24px',
      background: bgColor,
      backdropFilter: 'blur(20px)',
      padding: '20px', borderRadius: '16px',
      border: `1px solid ${borderColor}`,
      zIndex: '999'
    });
  }
});

/* ---- SMOOTH SCROLL ---- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    // 히어로 잠금 상태에서는 CTA 외 링크 무시 (initHeroLock에서 처리)
    if (document.body.classList.contains('hero-locked')) {
      e.preventDefault();
      return;
    }
    const target = document.querySelector(href);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ---- COUNTER ANIMATION ---- */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const step = target / (2000 / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = target; clearInterval(timer); }
    else el.textContent = Math.floor(current);
  }, 16);
}

/* ---- SCROLL ANIMATIONS ---- */
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.getAttribute('data-delay') || 0;
      setTimeout(() => entry.target.classList.add('aos-animate'), parseInt(delay));
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-aos]').forEach(el => animObserver.observe(el));

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.trust-num').forEach(animateCounter);
      statObserver.disconnect();
    }
  });
}, { threshold: 0.5 });
const statsEl = document.querySelector('.hero-trust');
if (statsEl) statObserver.observe(statsEl);

/* ---- CHIP SELECTION ---- */
function initChipGroup(groupId, maxSelect = 1) {
  const container = document.getElementById(groupId);
  if (!container) return;
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (maxSelect === 1) {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      } else {
        chip.classList.toggle('selected');
      }
      updateBudgetTierIndicator(); // 칩 변경 시에도 인디케이터 업데이트
    });
  });
}
/* =====================================================
   🌍 국가 선택 → 지역 2단계 목적지 UI 초기화
   ===================================================== */
(function initCountrySelector() {
  const countryGrid   = document.getElementById('country-grid');
  const regionPanel   = document.getElementById('dest-region-panel');
  if (!countryGrid || !regionPanel) return;

  /* 나라 메타 정보 (국기·이름) */
  const countryMeta = {
    '한국':    { flag: '🇰🇷', name: '대한민국', hint: '특별·광역시 + 주요 여행지' },
    '일본':    { flag: '🇯🇵', name: '일본',     hint: '인기 도시 선택' },
    '미국':    { flag: '🇺🇸', name: '미국',     hint: '인기 도시 선택' },
    '프랑스':  { flag: '🇫🇷', name: '프랑스',   hint: '인기 도시 선택' },
    '이탈리아':{ flag: '🇮🇹', name: '이탈리아', hint: '인기 도시 선택' },
    '스페인':  { flag: '🇪🇸', name: '스페인',   hint: '인기 도시 선택' },
    '태국':    { flag: '🇹🇭', name: '태국',     hint: '인기 도시 선택' },
    '베트남':  { flag: '🇻🇳', name: '베트남',   hint: '인기 도시 선택' },
    '싱가포르':{ flag: '🇸🇬', name: '싱가포르', hint: '주요 지구 선택' },
    '호주':    { flag: '🇦🇺', name: '호주',     hint: '인기 도시 선택' },
    '영국':    { flag: '🇬🇧', name: '영국',     hint: '인기 도시 선택' },
    '튀르키예':{ flag: '🇹🇷', name: '튀르키예', hint: '인기 도시 선택' },
    '스위스':  { flag: '🇨🇭', name: '스위스',   hint: '인기 도시 선택' },
    '그리스':  { flag: '🇬🇷', name: '그리스',   hint: '인기 도시 선택' },
    '포르투갈':{ flag: '🇵🇹', name: '포르투갈', hint: '인기 도시 선택' },
    '캐나다':  { flag: '🇨🇦', name: '캐나다',   hint: '인기 도시 선택' },
  };

  /* 현재 선택된 나라 추적 */
  let currentCountry = '한국';

  /* 지역 패널 내 모든 칩 선택 해제 */
  function clearAllRegionChips() {
    regionPanel.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  }
  /* 외부에서도 사용 가능하도록 노출 */
  window._clearAllRegionChips = clearAllRegionChips;

  /* 나라별 지역 블록에 헤더 삽입 (없으면 생성) */
  function injectRegionHeader(block, country) {
    const existing = block.querySelector('.region-country-header');
    if (existing) return;
    const meta = countryMeta[country] || { flag: '🌍', name: country, hint: '지역 선택' };
    const header = document.createElement('div');
    header.className = 'region-country-header';
    header.innerHTML = `
      <span class="region-country-flag">${meta.flag}</span>
      <span class="region-country-name">${meta.name}</span>
      <span class="region-country-hint">${meta.hint}</span>
    `;
    block.insertBefore(header, block.firstChild);
  }

  /* 나라 전환 */
  function switchCountry(country) {
    currentCountry = country;

    /* 버튼 active 상태 전환 */
    countryGrid.querySelectorAll('.country-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.country === country);
    });

    /* 지역 블록 전환 */
    regionPanel.querySelectorAll('.region-block').forEach(block => {
      const isTarget = block.dataset.country === country;
      block.classList.toggle('active', isTarget);
      if (isTarget) {
        injectRegionHeader(block, country);
        /* 칩 이벤트 바인딩 (한 번만) */
        if (!block.dataset.bound) {
          block.dataset.bound = '1';
          block.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
              const wasSelected = chip.classList.contains('selected');
              clearAllRegionChips();
              if (!wasSelected) {
                chip.classList.add('selected');
                showDestBadge(country, chip.dataset.val);
              } else {
                removeDestBadge();
              }
              updateBudgetTierIndicator();
            });
          });
        }
      }
    });

    /* 선택 해제 + 배지 제거 */
    clearAllRegionChips();
    removeDestBadge();
    updateBudgetTierIndicator();
  }

  /* 선택된 목적지 배지 표시 */
  function showDestBadge(country, dest) {
    removeDestBadge();
    const meta = countryMeta[country] || { flag: '🌍' };
    const badge = document.createElement('div');
    badge.id = 'selected-dest-badge';
    badge.className = 'selected-dest-badge';
    badge.innerHTML = `${meta.flag} <strong>${dest}</strong> 선택됨`;
    regionPanel.after(badge);
  }

  function removeDestBadge() {
    const b = document.getElementById('selected-dest-badge');
    if (b) b.remove();
  }

  /* 국가 버튼 클릭 이벤트 */
  countryGrid.querySelectorAll('.country-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const country = btn.dataset.country;
      if (country !== currentCountry) {
        switchCountry(country);
      }
    });
  });

  /* 초기화: 한국 지역 블록 헤더 삽입 + 칩 이벤트 바인딩 */
  const initialBlock = regionPanel.querySelector('.region-block[data-country="한국"]');
  if (initialBlock) {
    initialBlock.dataset.bound = '1';
    injectRegionHeader(initialBlock, '한국');
    initialBlock.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wasSelected = chip.classList.contains('selected');
        clearAllRegionChips();
        if (!wasSelected) {
          chip.classList.add('selected');
          showDestBadge('한국', chip.dataset.val);
        } else {
          removeDestBadge();
        }
        updateBudgetTierIndicator();
      });
    });
  }

  /* window에 현재 나라 접근용 노출 */
  window._getSelectedCountry = () => currentCountry;
})();

/* ---- 목적지 그룹 이벤트는 initCountrySelector에서 통합 처리 (이중 바인딩 방지) ---- */

/* ---- 직접 입력 목적지 ---- */
(function initCustomDest() {
  const input = document.getElementById('dest-custom-input');
  const btn   = document.getElementById('dest-custom-btn');
  const customChips = document.getElementById('dest-custom-chips');
  if (!input || !btn || !customChips) return;

  function addCustomChip(val) {
    val = val.trim();
    if (!val) return;

    // 이미 같은 이름의 칩이 있으면 그냥 선택만
    let existing = customChips.querySelector(`.chip[data-val="${val}"]`);
    if (!existing) {
      // 새 칩 생성
      const chip = document.createElement('span');
      chip.className = 'chip chip-custom';
      chip.setAttribute('data-val', val);
      chip.innerHTML = `✏️ ${val} <span class="chip-del" title="삭제">×</span>`;

      // 삭제 버튼
      chip.querySelector('.chip-del').addEventListener('click', (e) => {
        e.stopPropagation();
        chip.remove();
      });

      // 클릭 선택
      chip.addEventListener('click', () => {
        if (window._clearAllRegionChips) window._clearAllRegionChips();
        chip.classList.add('selected');
        updateBudgetTierIndicator();
      });

      customChips.appendChild(chip);
    } else {
      existing = existing;
    }

    // 선택 처리
    if (window._clearAllRegionChips) window._clearAllRegionChips();
    (existing || customChips.querySelector(`.chip[data-val="${val}"]`)).classList.add('selected');

    input.value = '';
    updateBudgetTierIndicator();
  }

  btn.addEventListener('click', () => addCustomChip(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomChip(input.value); }
  });
})();

initChipGroup('companion-chips', 1);
initChipGroup('theme-chips', 99);
initChipGroup('transport-chips', 99);

/* ---- 동행 직접 입력 ---- */
(function initCompanionCustom() {
  const input       = document.getElementById('companion-custom-input');
  const btn         = document.getElementById('companion-custom-btn');
  const customChips = document.getElementById('companion-custom-chips');
  const mainGroup   = document.getElementById('companion-chips');
  if (!input || !btn || !customChips) return;

  function addChip(val) {
    val = val.trim();
    if (!val) return;
    if (customChips.querySelector(`.chip[data-val="${val}"]`)) {
      input.value = ''; return;
    }
    // 동행은 단일 선택 — 기존 선택 모두 해제
    const clearAll = () => {
      mainGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      customChips.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    };
    const chip = document.createElement('span');
    chip.className = 'chip chip-custom selected';
    chip.dataset.val = val;
    chip.innerHTML = `✏️ ${val} <span class="chip-del" title="삭제">×</span>`;
    chip.querySelector('.chip-del').addEventListener('click', e => {
      e.stopPropagation(); chip.remove();
    });
    chip.addEventListener('click', () => {
      clearAll();
      chip.classList.add('selected');
      updateBudgetTierIndicator();
    });
    clearAll();
    customChips.appendChild(chip);
    input.value = '';
    updateBudgetTierIndicator();
  }

  btn.addEventListener('click', () => addChip(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(input.value); } });
})();

/* ---- 테마 직접 입력 ---- */
(function initThemeCustom() {
  const input       = document.getElementById('theme-custom-input');
  const btn         = document.getElementById('theme-custom-btn');
  const customChips = document.getElementById('theme-custom-chips');
  if (!input || !btn || !customChips) return;

  function addChip(val) {
    val = val.trim();
    if (!val) return;
    if (customChips.querySelector(`.chip[data-val="${val}"]`)) {
      input.value = ''; return;
    }
    const chip = document.createElement('span');
    chip.className = 'chip chip-custom selected';
    chip.dataset.val = val;
    chip.innerHTML = `✏️ ${val} <span class="chip-del" title="삭제">×</span>`;
    chip.querySelector('.chip-del').addEventListener('click', e => {
      e.stopPropagation(); chip.remove();
      updateBudgetTierIndicator();
    });
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      updateBudgetTierIndicator();
    });
    customChips.appendChild(chip);
    input.value = '';
    updateBudgetTierIndicator();
  }

  btn.addEventListener('click', () => addChip(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(input.value); } });
})();

/* =============================================
   예산 등급 정의
   ============================================= */
const TIERS = [
  {
    key: 'economy',
    label: '💚 알뜰',
    grade: '알뜰',
    icon: '💚',
    min: 200000, max: 299999,
    tripType: '당일치기',
    nights: 0,
    accommodation: '게스트하우스 · 도미토리',
    mealBudget: 10000,
    desc: '당일치기 · 게스트하우스 · 로컬 분식 (20~30만원)',
    color: '#22c55e',
    colorBg: 'rgba(34,197,94,0.12)',
    colorBorder: 'rgba(34,197,94,0.3)',
  },
  {
    key: 'standard',
    label: '💙 일반',
    grade: '일반',
    icon: '💙',
    min: 300000, max: 499999,
    tripType: '1박 2일',
    nights: 1,
    accommodation: '모텔 · 펜션',
    mealBudget: 15000,
    desc: '1박 2일 · 모텔/펜션 · 현지 식당 (30~50만원)',
    color: '#3b82f6',
    colorBg: 'rgba(59,130,246,0.12)',
    colorBorder: 'rgba(59,130,246,0.3)',
  },
  {
    key: 'comfort',
    label: '🟣 컴포트',
    grade: '컴포트',
    icon: '🟣',
    min: 500000, max: 1999999,
    tripType: '2박 3일',
    nights: 2,
    accommodation: '비즈니스 호텔',
    mealBudget: 25000,
    desc: '2박 3일 · 비즈니스 호텔 · 맛집 코스 (50~200만원)',
    color: '#a855f7',
    colorBg: 'rgba(168,85,247,0.12)',
    colorBorder: 'rgba(168,85,247,0.3)',
  },
  {
    key: 'premium',
    label: '🟠 프리미엄',
    grade: '프리미엄',
    icon: '🟠',
    min: 2000000, max: 2999999,
    tripType: '3박 4일',
    nights: 3,
    accommodation: '특급 호텔 · 오션뷰',
    mealBudget: 50000,
    desc: '3박 4일 · 특급 호텔 · 파인다이닝 (200~300만원)',
    color: '#f97316',
    colorBg: 'rgba(249,115,22,0.12)',
    colorBorder: 'rgba(249,115,22,0.3)',
  },
  {
    key: 'luxury',
    label: '👑 럭셔리',
    grade: '럭셔리',
    icon: '👑',
    min: 3000000, max: Infinity,
    tripType: '프리미엄 투어',
    nights: 4,
    accommodation: '럭셔리 리조트 · 빌라',
    mealBudget: 100000,
    desc: '프리미엄 투어 · 럭셔리 리조트 · 미슐랭 (300만원+)',
    color: '#eab308',
    colorBg: 'rgba(234,179,8,0.12)',
    colorBorder: 'rgba(234,179,8,0.3)',
  },
];

function getTier(budget) {
  // 정확히 범위 안에 있는 티어 반환
  const found = TIERS.find(t => budget >= t.min && budget <= t.max);
  if (found) return found;
  // 범위 밖이면 가장 가까운 티어 반환 (최솟값 이하 → 첫 번째, 최댓값 초과 → 마지막)
  if (budget < TIERS[0].min) return TIERS[0];
  return TIERS[TIERS.length - 1];
}

/* =============================================
   여행 데이터 (예산 등급별 × 목적지)
   ============================================= */
const travelData = {
  '제주도': {
    economy: {
      spots: [
        { time: '09:00', emoji: '🏝️', name: '협재 해수욕장', desc: '에메랄드빛 무료 해변, 한림공원 인근', vibe: '📸 포토스팟 · 🌊 청명한 바다', cost: 0 },
        { time: '11:30', emoji: '🍜', name: '제주 국수 골목', desc: '5,000~7,000원대 제주 고기국수', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 6000 },
        { time: '13:30', emoji: '🍊', name: '감귤 농원 체험', desc: '제주 직접 따기 체험 (입장 5,000원)', vibe: '🌿 체험 · 🍊 제주 특산', cost: 5000 },
        { time: '16:00', emoji: '🌅', name: '성산 일출봉', desc: '유네스코 세계자연유산 (입장 2,000원)', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 2000 },
        { time: '18:30', emoji: '🍽️', name: '동문시장 야시장', desc: '다양한 길거리 음식, 한 끼 8,000원 내외', vibe: '🍜 로컬 맛집 · 🌙 야시장', cost: 8000 },
      ],
      tag: '🏝️ 제주 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🏝️', name: '협재 해수욕장', desc: '에메랄드빛 바다, 무료 입장', vibe: '📸 포토스팟 · 🌊 청명한 바다', cost: 0 },
        { time: '12:30', emoji: '🍽️', name: '제주 흑돼지 거리', desc: '현지인도 인정한 제주 대표 흑돼지 맛집', vibe: '🍖 로컬 맛집 · 💰 가성비', cost: 15000 },
        { time: '15:00', emoji: '☕', name: '카멜리아 힐', desc: '동백나무 군락 속 감성 카페 (입장 8,000원)', vibe: '📸 포토스팟 · 🌿 자연', cost: 8000 },
        { time: '18:00', emoji: '🌅', name: '성산 일출봉', desc: '유네스코 세계자연유산, 일몰 뷰', vibe: '🌅 뷰 맛집 · ✨ 힙한', cost: 2000 },
        { time: '20:00', emoji: '🏨', name: '제주 게스트하우스', desc: '깔끔한 2인실, 조식 미포함', vibe: '🛏️ 편안함 · 💰 가성비', cost: 45000 },
      ],
      tag: '🏝️ 제주 1박 2일',
      accommodation: '게스트하우스 1박',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🏝️', name: '협재 해수욕장 & 카페', desc: '에메랄드빛 바다, 인근 뷰 카페', vibe: '📸 포토스팟 · 🌊 청명한 바다', cost: 12000 },
        { time: '12:30', emoji: '🍽️', name: '제주 흑돼지 거리', desc: '현지인도 인정한 제주 대표 맛집', vibe: '🍖 로컬 맛집 · 🌟 검증', cost: 20000 },
        { time: '15:00', emoji: '☕', name: '카멜리아 힐', desc: '동백나무 군락 속 감성 카페', vibe: '📸 포토스팟 · 🌿 자연', cost: 12000 },
        { time: '18:00', emoji: '🌅', name: '성산 일출봉 일몰', desc: '유네스코 세계자연유산, 황금빛 일몰', vibe: '🌅 뷰 맛집 · ✨ 힙한', cost: 2000 },
        { time: '20:00', emoji: '🏨', name: '제주 비즈니스 호텔', desc: '깔끔한 더블룸, 조식 포함', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 90000 },
      ],
      tag: '🏝️ 제주 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🚁', name: '제주 헬기 투어', desc: '하늘에서 바라본 제주 전경', vibe: '🚁 이색 체험 · 📸 포토스팟', cost: 80000 },
        { time: '13:00', emoji: '🍷', name: '제주 파인다이닝', desc: '제주 로컬 식재료 파인다이닝 코스', vibe: '🍷 파인다이닝 · 🌟 미슐랭', cost: 60000 },
        { time: '16:00', emoji: '🌿', name: '오설록 티 뮤지엄 VIP', desc: '프라이빗 티 클래스 + 뷰 카페', vibe: '🍵 티 클래스 · 📸 포토스팟', cost: 30000 },
        { time: '19:00', emoji: '🌅', name: '성산 일출봉 선셋 크루즈', desc: '요트에서 감상하는 제주 일몰', vibe: '🌅 뷰 맛집 · 🚢 요트', cost: 70000 },
        { time: '21:00', emoji: '🏨', name: '제주 신라 호텔', desc: '오션뷰 디럭스룸, 조식 포함', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 180000 },
      ],
      tag: '🏝️ 제주 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🚁', name: '프라이빗 헬기 투어', desc: '전용 헬기로 즐기는 제주 일주', vibe: '🚁 VIP 체험 · 📸 포토스팟', cost: 150000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 레스토랑 런치', desc: '제주 최고급 미슐랭 가이드 레스토랑', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 120000 },
        { time: '16:00', emoji: '🏌️', name: '제주 골프 클럽', desc: '오션뷰 퍼블릭 골프 라운딩', vibe: '🏌️ 골프 · 🌊 오션뷰', cost: 180000 },
        { time: '20:00', emoji: '🍾', name: '야경 루프탑 다이닝', desc: '제주 야경과 함께하는 시그니처 코스', vibe: '🌙 야경 · 🍾 고급 다이닝', cost: 150000 },
        { time: '22:00', emoji: '🏨', name: '제주 롯데 호텔 스위트', desc: '오션뷰 스위트룸, 프라이빗 버틀러', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 350000 },
      ],
      tag: '🏝️ 제주 럭셔리 투어',
      accommodation: '럭셔리 리조트 4박',
      accommodationCost: 350000,
    },
  },
  '부산': {
    economy: {
      spots: [
        { time: '09:30', emoji: '🌊', name: '해운대 해수욕장', desc: '부산 대표 해변, 무료 입장', vibe: '🌊 바다 · 📸 포토스팟', cost: 0 },
        { time: '12:00', emoji: '🍜', name: '부산 밀면 골목', desc: '부산 명물 밀면 한 그릇 6,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 6000 },
        { time: '14:00', emoji: '🎨', name: '감천문화마을', desc: '무료 입장, 알록달록 벽화 골목', vibe: '📸 사진 잘 나오는 · ✨ 힙한', cost: 0 },
        { time: '17:00', emoji: '🌅', name: '광안리 해변 산책', desc: '광안대교 야경 무료 감상', vibe: '🌅 야경 · 🤫 조용한', cost: 0 },
        { time: '19:00', emoji: '🍽️', name: '자갈치 시장 회', desc: '신선한 회 한 접시 15,000원~', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 15000 },
      ],
      tag: '🌊 부산 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌊', name: '해운대 블루라인파크', desc: '바다 위를 달리는 해변열차 (15,000원)', vibe: '📸 포토스팟 · 🌊 바다', cost: 15000 },
        { time: '12:00', emoji: '🍜', name: '광안리 횟집거리', desc: '신선한 해산물 (1인 15,000원~)', vibe: '🦞 신선한 해산물 · 🌊 오션뷰', cost: 20000 },
        { time: '14:30', emoji: '🎨', name: '감천문화마을', desc: '알록달록 계단마을, 포토스팟', vibe: '📸 사진 잘 나오는 · ✨ 힙한', cost: 0 },
        { time: '17:00', emoji: '🌉', name: '광안대교 뷰 카페', desc: '광안대교 뷰와 함께하는 커피', vibe: '🌅 뷰 맛집 · ☕ 감성', cost: 8000 },
        { time: '20:00', emoji: '🏨', name: '해운대 게스트하우스', desc: '해운대 도보 거리, 깔끔한 2인실', vibe: '🛏️ 편안함 · 💰 가성비', cost: 40000 },
      ],
      tag: '🌊 부산 1박 2일',
      accommodation: '게스트하우스 1박',
      accommodationCost: 40000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🌊', name: '해운대 블루라인파크', desc: '바다 위를 달리는 해변열차', vibe: '📸 포토스팟 · 🌊 바다', cost: 15000 },
        { time: '12:00', emoji: '🍜', name: '광안리 횟집거리', desc: '부산 최고의 신선한 해산물', vibe: '🦞 신선한 해산물 · 🌊 오션뷰', cost: 28000 },
        { time: '14:30', emoji: '🎨', name: '감천문화마을', desc: '알록달록 계단마을, 부산의 산토리니', vibe: '📸 사진 잘 나오는 · ✨ 힙한', cost: 0 },
        { time: '17:00', emoji: '🌉', name: '광안대교 뷰 카페', desc: '광안대교 야경과 함께하는 커피 한 잔', vibe: '🌅 뷰 맛집 · ☕ 감성', cost: 12000 },
        { time: '20:00', emoji: '🏨', name: '해운대 마린시티 호텔', desc: '오션뷰 더블룸, 조식 포함', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 85000 },
      ],
      tag: '🌊 부산 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🚢', name: '부산 요트 투어', desc: '광안대교 아래를 달리는 요트 체험', vibe: '🚢 요트 · 🌊 오션뷰', cost: 60000 },
        { time: '13:00', emoji: '🍷', name: '해운대 파인다이닝', desc: '오션뷰 레스토랑 점심 코스', vibe: '🍷 파인다이닝 · 🌊 오션뷰', cost: 55000 },
        { time: '16:00', emoji: '🎨', name: '부산 현대미술관', desc: '부산 대표 미술관 관람', vibe: '🎨 예술 · 🤫 조용한', cost: 5000 },
        { time: '19:00', emoji: '🦞', name: '대변항 랍스터 코스', desc: '신선한 랍스터 풀코스 디너', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 80000 },
        { time: '21:00', emoji: '🏨', name: '파크 하얏트 부산', desc: '오션뷰 스위트룸', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 200000 },
      ],
      tag: '🌊 부산 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🚢', name: '프라이빗 크루즈', desc: '부산 앞바다 프라이빗 크루즈', vibe: '🚢 VIP 크루즈 · 🌊 오션뷰', cost: 200000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 씨푸드 런치', desc: '광안대교 뷰 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 130000 },
        { time: '16:30', emoji: '🏌️', name: '기장 골프 라운딩', desc: '오션뷰 기장 골프 클럽', vibe: '🏌️ 골프 · 🌊 오션뷰', cost: 160000 },
        { time: '20:00', emoji: '🍾', name: '루프탑 샴페인 디너', desc: '광안대교 야경 VIP 루프탑 다이닝', vibe: '🍾 샴페인 · 🌙 야경', cost: 120000 },
        { time: '22:00', emoji: '🏨', name: '시그니엘 부산', desc: '최고층 오션뷰 스위트, 버틀러 서비스', vibe: '👑 최고급 · 🛎️ 버틀러', cost: 380000 },
      ],
      tag: '🌊 부산 럭셔리 투어',
      accommodation: '럭셔리 리조트 4박',
      accommodationCost: 380000,
    },
  },
  '강릉': {
    economy: {
      spots: [
        { time: '09:00', emoji: '☕', name: '강릉 커피거리 산책', desc: '무료로 즐기는 커피 향 가득한 거리', vibe: '☕ 커피 성지 · 🤫 조용한', cost: 5000 },
        { time: '11:00', emoji: '🌊', name: '경포해변', desc: '강릉 대표 해수욕장, 무료 입장', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '13:00', emoji: '🍽️', name: '강릉 중앙시장 순두부', desc: '강릉 명물 순두부 한 그릇 7,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 7000 },
        { time: '15:00', emoji: '🏛️', name: '오죽헌 (무료 관람)', desc: '율곡 이이 생가, 역사 문화 체험', vibe: '📚 역사 · 🌿 힐링', cost: 3000 },
        { time: '17:30', emoji: '🌅', name: '안목해변 일몰', desc: '강릉 커피거리 인근 일몰 명소', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
      ],
      tag: '🌲 강릉 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '09:00', emoji: '☕', name: '강릉 핸드드립 카페', desc: '커피의 도시 강릉, 핸드드립 성지', vibe: '☕ 커피 성지 · ✨ 힙한', cost: 7000 },
        { time: '11:00', emoji: '🌊', name: '경포해변', desc: '강릉 대표 해수욕장, 깨끗한 모래사장', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '13:30', emoji: '🍽️', name: '강릉 중앙시장', desc: '순두부, 감자전 등 로컬 먹거리', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '15:30', emoji: '🏛️', name: '오죽헌', desc: '율곡 이이 생가, 역사 문화 체험', vibe: '📚 문화 · 🌿 힐링', cost: 3000 },
        { time: '19:00', emoji: '🏨', name: '강릉 바닷가 펜션', desc: '오션뷰 2인실 펜션', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 55000 },
      ],
      tag: '🌲 강릉 1박 2일',
      accommodation: '펜션 1박',
      accommodationCost: 55000,
    },
    comfort: {
      spots: [
        { time: '09:00', emoji: '☕', name: '강릉 핸드드립 카페', desc: '스페셜티 원두 핸드드립', vibe: '☕ 커피 성지 · ✨ 힙한', cost: 10000 },
        { time: '11:00', emoji: '🌊', name: '경포해변 & 수상스포츠', desc: '서핑 체험 포함 (30,000원)', vibe: '🌊 청명한 바다 · 🏄 액티비티', cost: 30000 },
        { time: '13:30', emoji: '🍽️', name: '강릉 맛집 골목', desc: '강릉 대표 먹거리 투어', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 20000 },
        { time: '16:00', emoji: '🏛️', name: '오죽헌 & 강릉 선교장', desc: '강릉 대표 역사 유적지 2곳', vibe: '📚 역사 · 🌿 자연', cost: 5000 },
        { time: '19:00', emoji: '🏨', name: '씨마크 호텔', desc: '강릉 특급 오션뷰 호텔', vibe: '🛏️ 특급 · 🌊 오션뷰', cost: 95000 },
      ],
      tag: '🌲 강릉 2박 3일',
      accommodation: '특급 호텔 2박',
      accommodationCost: 95000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '🏄', name: '강릉 서핑 프라이빗 레슨', desc: '전담 강사와 함께하는 1:1 서핑', vibe: '🏄 서핑 · 🌊 바다', cost: 80000 },
        { time: '12:30', emoji: '🦞', name: '강릉 랍스터 런치', desc: '신선한 동해 해산물 랍스터 코스', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 75000 },
        { time: '15:00', emoji: '☕', name: '보헤미안 로스터리 VIP', desc: '강릉 커피 대가의 프라이빗 클래스', vibe: '☕ 커피 성지 · ✨ 힙한', cost: 40000 },
        { time: '18:30', emoji: '🌅', name: '강릉 정동진 선셋 크루즈', desc: '요트에서 감상하는 동해 일몰', vibe: '🌅 뷰 맛집 · 🚢 요트', cost: 70000 },
        { time: '21:00', emoji: '🏨', name: '씨마크 호텔 스위트', desc: '오션뷰 스위트룸, 스파 포함', vibe: '🛏️ 럭셔리 · 🧖 스파', cost: 200000 },
      ],
      tag: '🌲 강릉 3박 4일 프리미엄',
      accommodation: '특급 호텔 스위트 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🚁', name: '강릉 헬기 동해 투어', desc: '헬기로 즐기는 동해안 절경', vibe: '🚁 VIP 체험 · 📸 포토스팟', cost: 200000 },
        { time: '12:00', emoji: '🌟', name: '미슐랭 씨푸드 코스', desc: '강릉 최고급 레스토랑 풀코스', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 150000 },
        { time: '15:00', emoji: '🧖', name: '프라이빗 온천 스파', desc: '동해 해변 프라이빗 온천 & 스파', vibe: '🧖 힐링 · 🌿 자연', cost: 100000 },
        { time: '19:00', emoji: '🍾', name: '정동진 루프탑 갈라 디너', desc: '동해 야경 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 180000 },
        { time: '21:30', emoji: '🏨', name: '강릉 리조트 프라이빗 빌라', desc: '오션뷰 독채 빌라, 버틀러 서비스', vibe: '👑 프라이빗 빌라 · 🛎️ 버틀러', cost: 400000 },
      ],
      tag: '🌲 강릉 럭셔리 투어',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 400000,
    },
  },
  '경주': {
    economy: {
      spots: [
        { time: '09:30', emoji: '🏛️', name: '불국사', desc: '유네스코 세계문화유산 (입장 6,000원)', vibe: '📚 역사 · 🌿 자연', cost: 6000 },
        { time: '12:00', emoji: '🍽️', name: '황남빵 & 교동 쌈밥', desc: '경주 명물 황남빵과 전통 쌈밥 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:00', emoji: '⛰️', name: '남산 탐방로 (무료)', desc: '신라 유적 가득한 무료 트레킹', vibe: '🌿 힐링 · 📚 역사', cost: 0 },
        { time: '17:00', emoji: '🌙', name: '첨성대 야경', desc: '동양 최고(最古) 천문대, 무료 입장', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
        { time: '19:00', emoji: '🍽️', name: '경주 교촌마을 닭갈비', desc: '경주 대표 닭갈비 한 그릇 9,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 9000 },
      ],
      tag: '🏛️ 경주 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '09:30', emoji: '🏛️', name: '불국사', desc: '유네스코 세계문화유산', vibe: '📚 역사 · 🌿 자연', cost: 6000 },
        { time: '12:00', emoji: '🍽️', name: '황리단길 맛집', desc: '경주 황리단길의 힙한 카페와 음식점', vibe: '✨ 힙한 · 📸 포토스팟', cost: 13000 },
        { time: '14:00', emoji: '⛰️', name: '남산 탐방로', desc: '신라 유적이 가득한 경주 남산', vibe: '🌿 힐링 · 📚 역사', cost: 0 },
        { time: '17:00', emoji: '🌙', name: '첨성대 야경', desc: '동양 최고(最古) 천문대, 야경 명소', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
        { time: '20:00', emoji: '🏨', name: '경주 한옥 게스트하우스', desc: '전통 한옥 체험, 2인실', vibe: '🏡 전통 · 💰 가성비', cost: 45000 },
      ],
      tag: '🏛️ 경주 1박 2일',
      accommodation: '한옥 게스트하우스 1박',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '09:30', emoji: '🏛️', name: '불국사 & 석굴암', desc: '유네스코 세계문화유산 2곳', vibe: '📚 역사 · 🌿 자연', cost: 10000 },
        { time: '12:00', emoji: '🍽️', name: '황리단길 맛집', desc: '경주 황리단길의 힙한 카페와 음식점', vibe: '✨ 힙한 · 📸 포토스팟', cost: 18000 },
        { time: '14:00', emoji: '⛰️', name: '남산 탐방로', desc: '신라 유적이 가득한 경주 남산', vibe: '🌿 힐링 · 📚 역사', cost: 0 },
        { time: '17:00', emoji: '🌙', name: '첨성대 야경', desc: '동양 최고(最古) 천문대, 야경 명소', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
        { time: '20:00', emoji: '🏨', name: '경주 힐튼 호텔', desc: '경주 최고의 리조트 호텔, 조식 포함', vibe: '🛏️ 럭셔리 · 🏊 수영장', cost: 90000 },
      ],
      tag: '🏛️ 경주 2박 3일',
      accommodation: '특급 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '🏛️', name: '불국사 & 석굴암 VIP 투어', desc: '전문 가이드와 함께하는 프라이빗 투어', vibe: '📚 역사 · 🌟 VIP', cost: 50000 },
        { time: '12:30', emoji: '🍷', name: '경주 파인다이닝', desc: '신라 왕궁 테마 파인다이닝', vibe: '🍷 파인다이닝 · 📚 역사', cost: 60000 },
        { time: '15:00', emoji: '🎭', name: '신라 문화 체험 VIP', desc: '도예, 한지, 전통 의상 체험', vibe: '🎭 문화 체험 · 📚 역사', cost: 40000 },
        { time: '18:30', emoji: '🌙', name: '경주 야간 투어 (야경 버스)', desc: '야간 조명이 켜진 유적지 투어', vibe: '🌙 야경 · 📚 역사', cost: 20000 },
        { time: '21:00', emoji: '🏨', name: '경주 힐튼 스위트', desc: '정원뷰 스위트룸, 스파 포함', vibe: '🛏️ 럭셔리 · 🧖 스파', cost: 180000 },
      ],
      tag: '🏛️ 경주 3박 4일 프리미엄',
      accommodation: '특급 호텔 스위트 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🏛️', name: '불국사 새벽 프라이빗 투어', desc: '개장 전 단독 문화유산 탐방', vibe: '📚 역사 · 👑 VIP', cost: 100000 },
        { time: '12:00', emoji: '🌟', name: '미슐랭 한식 코스', desc: '신라 궁중 요리 재현 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 📚 전통', cost: 150000 },
        { time: '15:00', emoji: '🎭', name: '신라 문화 VIP 체험', desc: '왕족 의상 & 전통 악기 개인 레슨', vibe: '🎭 VIP 체험 · 📚 역사', cost: 80000 },
        { time: '19:00', emoji: '🌙', name: '첨성대 야간 프라이빗 디너', desc: '유적지 옆 단독 테이블 갈라 디너', vibe: '🌙 야경 · 🍾 갈라 디너', cost: 200000 },
        { time: '22:00', emoji: '🏨', name: '경주 고풍스러운 한옥 빌라', desc: '전통 한옥 프라이빗 독채, 버틀러', vibe: '👑 한옥 빌라 · 🛎️ 버틀러', cost: 350000 },
      ],
      tag: '🏛️ 경주 럭셔리 투어',
      accommodation: '프라이빗 한옥 빌라 4박',
      accommodationCost: 350000,
    },
  },
  '전주': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🥢', name: '전주 한옥마을 (무료)', desc: '700채 한옥, 역사 문화 체험 무료', vibe: '📸 포토스팟 · 📚 역사', cost: 0 },
        { time: '12:00', emoji: '🍚', name: '전주 비빔밥 골목', desc: '진짜 전주 비빔밥 한 그릇 9,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 9000 },
        { time: '14:30', emoji: '🏯', name: '경기전 (3,000원)', desc: '태조 이성계의 어진을 모신 유적', vibe: '📚 역사 · 🌿 자연', cost: 3000 },
        { time: '16:30', emoji: '🍫', name: '남부시장 야시장', desc: '전주 명물 청년몰, 각종 길거리 음식', vibe: '✨ 힙한 · 🍜 먹거리', cost: 8000 },
        { time: '19:00', emoji: '🍺', name: '막걸리 골목', desc: '전주 전통 막걸리 한 잔과 안주', vibe: '🍺 전통주 · 💰 가성비', cost: 8000 },
      ],
      tag: '🍜 전주 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🥢', name: '전주 한옥마을', desc: '700채의 한옥이 모인 전통 문화의 중심', vibe: '📸 포토스팟 · 📚 역사', cost: 0 },
        { time: '12:00', emoji: '🍚', name: '전주 비빔밥 골목', desc: '진짜 전주 비빔밥, 10곳 이상의 맛집', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '14:30', emoji: '🏯', name: '경기전', desc: '태조 이성계의 어진을 모신 역사 유적', vibe: '📚 역사 · 🌿 자연', cost: 3000 },
        { time: '16:30', emoji: '🍫', name: '남부시장 야시장', desc: '전주 명물 청년몰과 야시장', vibe: '✨ 힙한 · 🍜 먹거리', cost: 8000 },
        { time: '20:00', emoji: '🏨', name: '전주 한옥 게스트하우스', desc: '진짜 한옥에서 자는 특별한 경험', vibe: '🏡 전통 · 📸 포토스팟', cost: 40000 },
      ],
      tag: '🍜 전주 1박 2일',
      accommodation: '한옥 게스트하우스 1박',
      accommodationCost: 40000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🥢', name: '전주 한옥마을 투어', desc: '전통 의상 체험 포함 (10,000원)', vibe: '📸 포토스팟 · 📚 역사', cost: 10000 },
        { time: '12:00', emoji: '🍚', name: '전주 한정식', desc: '정통 전주 한정식 코스 (25,000원~)', vibe: '🍜 전통 한식 · 🌟 검증', cost: 25000 },
        { time: '14:30', emoji: '🏯', name: '경기전 & 전동성당', desc: '경기전과 전주 전동성당 투어', vibe: '📚 역사 · 📸 포토스팟', cost: 3000 },
        { time: '16:30', emoji: '🍫', name: '남부시장 & 막걸리 골목', desc: '전주 청년몰 + 막걸리 투어', vibe: '✨ 힙한 · 🍺 전통주', cost: 15000 },
        { time: '20:00', emoji: '🏨', name: '전주 라마다 호텔', desc: '한옥마을 도보 거리, 조식 포함', vibe: '🛏️ 편안함 · 📍 위치 좋음', cost: 80000 },
      ],
      tag: '🍜 전주 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 80000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🥢', name: '한옥마을 VIP 투어', desc: '전통 도예, 한지 공예 프라이빗 체험', vibe: '🎭 VIP 체험 · 📚 역사', cost: 50000 },
        { time: '13:00', emoji: '🍷', name: '전주 미식 코스 요리', desc: '전통 궁중 요리 재현 파인다이닝', vibe: '🍷 파인다이닝 · 📚 전통', cost: 65000 },
        { time: '16:00', emoji: '🏯', name: '경기전 역사 프라이빗 투어', desc: '문화해설사와 함께하는 깊이 있는 탐방', vibe: '📚 역사 · 🌟 VIP', cost: 30000 },
        { time: '19:00', emoji: '🍺', name: '전통주 소믈리에 클래스', desc: '전주 전통 막걸리 & 와인 페어링', vibe: '🍺 전통주 · ✨ 힙한', cost: 40000 },
        { time: '21:00', emoji: '🏨', name: '전주 럭셔리 한옥 호텔', desc: '현대적 편의시설 갖춘 프리미엄 한옥', vibe: '🏡 프리미엄 한옥 · 🛏️ 럭셔리', cost: 160000 },
      ],
      tag: '🍜 전주 3박 4일 프리미엄',
      accommodation: '프리미엄 한옥 호텔 3박',
      accommodationCost: 160000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🥢', name: '한옥마을 새벽 단독 투어', desc: '관광객 없는 고요한 새벽 한옥 탐방', vibe: '📸 포토스팟 · 👑 VIP', cost: 80000 },
        { time: '12:00', emoji: '🌟', name: '미슐랭 한정식 코스', desc: '전주 최고의 미슐랭 가이드 한정식', vibe: '🌟 미슐랭 · 🍚 전통', cost: 130000 },
        { time: '15:00', emoji: '🎭', name: '전통 예술 VIP 공연', desc: '판소리 & 전통 무용 프라이빗 공연', vibe: '🎭 공연 · 📚 전통', cost: 100000 },
        { time: '19:00', emoji: '🍾', name: '전주 성곽 루프탑 갈라 디너', desc: '성곽 뷰 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 180000 },
        { time: '21:30', emoji: '🏨', name: '전주 프라이빗 한옥 빌라', desc: '독채 한옥 빌라, 전통 다례 포함', vibe: '👑 한옥 빌라 · 🍵 다례', cost: 380000 },
      ],
      tag: '🍜 전주 럭셔리 투어',
      accommodation: '프라이빗 한옥 빌라 4박',
      accommodationCost: 380000,
    },
  },

  /* ===== 서울 ===== */
  '서울': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '경복궁 · 북촌 한옥마을', desc: '조선 왕궁 + 전통 한옥 골목 무료 산책', vibe: '📚 역사 · 📸 포토스팟', cost: 3000 },
        { time: '12:30', emoji: '🍜', name: '광장시장 순대·빈대떡', desc: '서울 전통 시장 로컬 먹거리 투어', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:30', emoji: '🎨', name: '인사동 · 쌈지길', desc: '전통 공예·갤러리 무료 탐방', vibe: '🎨 예술 · ✨ 힙한', cost: 0 },
        { time: '17:00', emoji: '🌇', name: '남산 서울타워 야경', desc: '케이블카 탑승 + 서울 파노라마 야경', vibe: '🌙 야경 · 📸 포토스팟', cost: 9000 },
        { time: '19:30', emoji: '🍽️', name: '홍대 거리 먹거리', desc: '홍대 포차·분식·떡볶이 6,000~8,000원', vibe: '🍜 로컬 맛집 · ✨ 힙한', cost: 8000 },
      ],
      tag: '🏛️ 서울 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '경복궁 · 창덕궁 투어', desc: '조선 왕궁 2곳 역사 탐방', vibe: '📚 역사 · 📸 포토스팟', cost: 6000 },
        { time: '13:00', emoji: '🍽️', name: '을지로 노포 점심', desc: '을지로 오래된 맛집 골목 점심', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '15:00', emoji: '🛍️', name: '성수동 카페 거리', desc: '힙한 브런치 카페 + 팝업스토어', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 10000 },
        { time: '18:00', emoji: '🌉', name: '한강 공원 야경 피크닉', desc: '치맥 한강 피크닉, 야경 감상', vibe: '🌙 야경 · 🤫 조용한', cost: 12000 },
        { time: '21:00', emoji: '🏨', name: '서울 게스트하우스', desc: '홍대·신촌 인근 깔끔한 게스트하우스', vibe: '🛏️ 편안함 · 💰 가성비', cost: 45000 },
      ],
      tag: '🏛️ 서울 1박 2일',
      accommodation: '게스트하우스 1박',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '경복궁 왕복 투어', desc: '문화해설사와 함께하는 경복궁', vibe: '📚 역사 · 📸 포토스팟', cost: 8000 },
        { time: '12:30', emoji: '🍽️', name: '종로 한식 맛집', desc: '서울 대표 전통 한식 레스토랑', vibe: '🍽️ 한식 · 🌟 검증', cost: 22000 },
        { time: '15:00', emoji: '☕', name: '성수동 감성 카페', desc: '인스타 감성 성수 카페 투어', vibe: '☕ 감성 카페 · 📸 포토스팟', cost: 12000 },
        { time: '18:00', emoji: '🌇', name: '남산 타워 선셋', desc: '케이블카 + 타워 전망대 서울 야경', vibe: '🌙 야경 · 📸 포토스팟', cost: 15000 },
        { time: '21:00', emoji: '🏨', name: '서울 비즈니스 호텔', desc: '명동 또는 종로 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌆 도심', cost: 90000 },
      ],
      tag: '🏛️ 서울 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '경복궁 VIP 해설 투어', desc: '전문 문화해설사 프라이빗 궁궐 투어', vibe: '📚 역사 · ✨ 프리미엄', cost: 30000 },
        { time: '13:00', emoji: '🍷', name: '청담동 파인다이닝', desc: '미슐랭 빕구르망 한식 코스', vibe: '🍷 파인다이닝 · 🌟 미슐랭', cost: 70000 },
        { time: '16:00', emoji: '🛍️', name: '압구정 플래그십 쇼핑', desc: '국내외 명품 플래그십 스토어 투어', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 50000 },
        { time: '19:30', emoji: '🌆', name: '63빌딩 루프탑 바', desc: '서울 야경과 함께하는 칵테일', vibe: '🌙 야경 · 🍹 루프탑바', cost: 50000 },
        { time: '22:00', emoji: '🏨', name: '롯데 호텔 서울', desc: '프리미엄 시티뷰 룸, 조식 포함', vibe: '🛏️ 럭셔리 · 🌆 시티뷰', cost: 200000 },
      ],
      tag: '🏛️ 서울 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '경복궁 프라이빗 새벽 투어', desc: '개장 전 단독 궁궐 투어, 한복 체험 포함', vibe: '👑 VIP · 📚 역사', cost: 80000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 3스타 한식 코스', desc: '서울 최정상 한식 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 200000 },
        { time: '16:00', emoji: '🛍️', name: '청담 명품 컨시어지 쇼핑', desc: '전담 스타일리스트와 VIP 쇼핑', vibe: '🛍️ VIP 쇼핑 · ✨ 럭셔리', cost: 150000 },
        { time: '20:00', emoji: '🌙', name: '한강 프라이빗 크루즈 디너', desc: '한강 야경 전용 크루즈 갈라 디너', vibe: '🌙 야경 · 🍾 갈라 디너', cost: 180000 },
        { time: '23:00', emoji: '🏨', name: '그랜드 하얏트 서울', desc: '남산뷰 프레지덴셜 스위트', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 500000 },
      ],
      tag: '🏛️ 서울 럭셔리 투어',
      accommodation: '럭셔리 호텔 4박',
      accommodationCost: 500000,
    },
  },

  /* ===== 인천 ===== */
  '인천': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🇨🇳', name: '인천 차이나타운', desc: '한국 유일 중국식 거리, 자장면 발상지', vibe: '📸 포토스팟 · 🍜 로컬', cost: 0 },
        { time: '12:00', emoji: '🍜', name: '공화춘 자장면', desc: '한국 자장면 원조 인근 맛집 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:00', emoji: '🌉', name: '월미도 테마파크', desc: '바이킹·디스코팡팡 등 놀이기구 탑승', vibe: '🎡 액티비티 · ✨ 힙한', cost: 10000 },
        { time: '17:00', emoji: '🌅', name: '을왕리 해수욕장', desc: '수도권 접근성 좋은 서해 석양 명소', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
        { time: '19:30', emoji: '🦞', name: '인천 용현동 새우튀김 거리', desc: '인천 명물 새우튀김 거리 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      ],
      tag: '✈️ 인천 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🇨🇳', name: '인천 차이나타운 탐방', desc: '한국 최초 중국식 거리, 역사 탐방', vibe: '📸 포토스팟 · 📚 역사', cost: 0 },
        { time: '12:00', emoji: '🍜', name: '차이나타운 자장면 맛집', desc: '100년 전통 자장면, 1인 10,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
        { time: '14:30', emoji: '🏝️', name: '영종도 마시안 해변', desc: '서해 갯벌 체험 + 드라이브', vibe: '🌊 바다 · 🌿 자연', cost: 0 },
        { time: '17:30', emoji: '🌅', name: '을왕리 일몰 감상', desc: '서해 최고의 일몰 명소', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '20:00', emoji: '🏨', name: '인천 영종도 모텔', desc: '공항 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 45000 },
      ],
      tag: '✈️ 인천 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🇨🇳', name: '차이나타운 + 개항장 투어', desc: '개항 역사거리 + 차이나타운 코스', vibe: '📚 역사 · 📸 포토스팟', cost: 5000 },
        { time: '12:30', emoji: '🦞', name: '소래포구 해산물 코스', desc: '신선한 서해 해산물 직거래', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 25000 },
        { time: '15:00', emoji: '🏝️', name: '실미도·무의도 드라이브', desc: '영화 촬영지 실미도 + 드라이브', vibe: '🌊 바다 · 📸 포토스팟', cost: 5000 },
        { time: '18:00', emoji: '🌅', name: '인천 하늘공원 을왕리 선셋', desc: '서해 석양 + 인천대교 야경', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '인천 파라다이스 호텔', desc: '영종도 오션뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 90000 },
      ],
      tag: '✈️ 인천 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🛫', name: '인천공항 프리미엄 라운지 투어', desc: '공항 라운지 + 면세점 쇼핑', vibe: '✈️ 프리미엄 · 🛍️ 쇼핑', cost: 30000 },
        { time: '13:00', emoji: '🦞', name: '인천 랍스터 & 킹크랩 코스', desc: '인천항 최고급 킹크랩 코스 요리', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 80000 },
        { time: '16:00', emoji: '🏝️', name: '실미도 프라이빗 투어', desc: '전용 보트로 실미도 섬 탐험', vibe: '🌊 바다 · 📸 포토스팟', cost: 40000 },
        { time: '19:30', emoji: '🌅', name: '인천대교 선셋 크루즈', desc: '인천대교 아래를 달리는 크루즈', vibe: '🌅 뷰 맛집 · ⛵ 크루즈', cost: 50000 },
        { time: '22:00', emoji: '🏨', name: '파라다이스 시티 호텔', desc: '인천 최고급 복합리조트, 조식 포함', vibe: '🛏️ 럭셔리 · 🎰 리조트', cost: 200000 },
      ],
      tag: '✈️ 인천 3박 4일 프리미엄',
      accommodation: '특급 리조트 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '✈️', name: '인천공항 프라이빗 라운지', desc: '퍼스트클래스 전용 라운지', vibe: '👑 VIP · ✈️ 퍼스트클래스', cost: 100000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 한식·중식 코스', desc: '인천 최고급 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 200000 },
        { time: '16:00', emoji: '🏝️', name: '프라이빗 요트 실미도 크루즈', desc: '전용 요트 다도해 투어', vibe: '⛵ VIP 요트 · 🌊 바다', cost: 250000 },
        { time: '20:00', emoji: '🎰', name: '파라다이스 시티 VIP 카지노', desc: 'VIP 전용 카지노 + 갈라 디너', vibe: '🎰 VIP · 🍾 갈라 디너', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '파라다이스 시티 아트 빌라', desc: '아트 테마 프라이빗 빌라', vibe: '👑 프라이빗 빌라 · 🎨 아트', cost: 500000 },
      ],
      tag: '✈️ 인천 럭셔리 투어',
      accommodation: '럭셔리 빌라 4박',
      accommodationCost: 500000,
    },
  },

  /* ===== 대구 ===== */
  '대구': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🍎', name: '동성로 패션 거리', desc: '대구 최대 번화가, 쇼핑·구경 무료', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 0 },
        { time: '12:00', emoji: '🍜', name: '서문시장 납작만두·찜갈비', desc: '대구 명물 납작만두 5,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 5000 },
        { time: '14:00', emoji: '🌿', name: '달성공원 무료 관람', desc: '대구 동물원 + 역사 공원 무료 입장', vibe: '🌿 자연 · 👨‍👩‍👧 가족', cost: 0 },
        { time: '16:30', emoji: '🏛️', name: '근대문화골목 투어', desc: '청라언덕·계산성당 역사 골목 무료', vibe: '📚 역사 · 📸 포토스팟', cost: 0 },
        { time: '19:00', emoji: '🍖', name: '안지랑 곱창 골목', desc: '대구 명물 곱창구이 1인 10,000원', vibe: '🍖 로컬 맛집 · 💰 가성비', cost: 10000 },
      ],
      tag: '🍎 대구 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '근대문화골목 투어', desc: '청라언덕·이상화 고택·계산성당', vibe: '📚 역사 · 📸 포토스팟', cost: 0 },
        { time: '12:30', emoji: '🍖', name: '대구 찜갈비 맛집', desc: '대구 대표 맛집 찜갈비 1인 15,000원', vibe: '🍖 로컬 맛집 · 💰 가성비', cost: 15000 },
        { time: '15:00', emoji: '🍎', name: '동성로 쇼핑', desc: '대구 최대 패션거리 쇼핑', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 0 },
        { time: '18:00', emoji: '🌅', name: '앞산 케이블카 야경', desc: '대구 야경 최고 명소, 케이블카 탑승', vibe: '🌙 야경 · 📸 포토스팟', cost: 9000 },
        { time: '21:00', emoji: '🏨', name: '대구 시내 모텔', desc: '동성로 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 40000 },
      ],
      tag: '🍎 대구 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 40000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '근대문화골목 + 김광석 거리', desc: '역사 골목 + 가수 김광석 기념 거리', vibe: '📚 역사 · 🎵 문화', cost: 0 },
        { time: '12:30', emoji: '🍖', name: '대구 찜갈비 코스', desc: '대구 대표 먹거리 맛집 투어', vibe: '🍖 로컬 맛집 · 🌟 검증', cost: 25000 },
        { time: '15:00', emoji: '☕', name: '수성못 카페 거리', desc: '수성못 뷰 감성 카페', vibe: '☕ 감성 카페 · 🌿 자연', cost: 12000 },
        { time: '18:00', emoji: '🌅', name: '팔공산 갓바위 일몰', desc: '대구 명산 팔공산 정상 일몰', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 5000 },
        { time: '21:00', emoji: '🏨', name: '대구 인터불고 호텔', desc: '대구 대표 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌆 시티뷰', cost: 85000 },
      ],
      tag: '🍎 대구 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '팔공산 케이블카 프라이빗 투어', desc: '전담 가이드와 함께하는 팔공산', vibe: '🌿 자연 · ✨ 프리미엄', cost: 30000 },
        { time: '13:00', emoji: '🍷', name: '대구 파인다이닝', desc: '대구 최고급 한식·이탈리안 코스', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 70000 },
        { time: '16:00', emoji: '🎨', name: '대구미술관 VIP 투어', desc: '큐레이터와 함께하는 프라이빗 관람', vibe: '🎨 예술 · ✨ 문화', cost: 10000 },
        { time: '19:00', emoji: '🌙', name: '앞산 전망대 루프탑 바', desc: '대구 야경 + 루프탑 칵테일', vibe: '🌙 야경 · 🍹 루프탑바', cost: 40000 },
        { time: '22:00', emoji: '🏨', name: '노보텔 대구', desc: '대구 최고급 호텔, 수영장 포함', vibe: '🛏️ 럭셔리 · 🏊 수영장', cost: 180000 },
      ],
      tag: '🍎 대구 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🚁', name: '팔공산 헬기 투어', desc: '헬기로 즐기는 대구 전경', vibe: '🚁 VIP 체험 · 📸 포토스팟', cost: 200000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 대구 한식 코스', desc: '대구 최정상 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '16:00', emoji: '🛍️', name: '대구 명품 컨시어지 쇼핑', desc: '프리미엄 아울렛 VIP 쇼핑', vibe: '🛍️ VIP 쇼핑 · ✨ 럭셔리', cost: 100000 },
        { time: '20:00', emoji: '🍾', name: '수성못 크루즈 갈라 디너', desc: '수성못 유람선 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '인터컨티넨탈 대구', desc: '펜트하우스 스위트, 버틀러 서비스', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 450000 },
      ],
      tag: '🍎 대구 럭셔리 투어',
      accommodation: '럭셔리 호텔 4박',
      accommodationCost: 450000,
    },
  },

  /* ===== 대전 ===== */
  '대전': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🌳', name: '유성온천 족욕 체험', desc: '대전 명물 유성온천 족욕 무료~3,000원', vibe: '🧖 힐링 · 💰 가성비', cost: 3000 },
        { time: '12:00', emoji: '🍜', name: '성심당 빵 & 대전 칼국수', desc: '대전 명물 성심당 + 칼국수 한 끼', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:00', emoji: '🏛️', name: '국립중앙과학관', desc: '과학·우주 전시관 무료 입장', vibe: '📚 교육 · 👨‍👩‍👧 가족', cost: 0 },
        { time: '17:00', emoji: '🌿', name: '계족산 황톳길 산책', desc: '맨발로 걷는 황톳길 힐링 코스', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
        { time: '19:30', emoji: '🍖', name: '대전 소 내장탕 골목', desc: '대전 명물 소 내장탕 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      ],
      tag: '🌳 대전 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '국립중앙과학관 + 엑스포공원', desc: '과학관 + 한빛탑 전망', vibe: '📚 교육 · 📸 포토스팟', cost: 3000 },
        { time: '12:30', emoji: '🍜', name: '성심당 & 대전 맛집', desc: '성심당 빵 + 대전 명물 한 끼', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '14:30', emoji: '🌿', name: '계족산 임도 드라이브', desc: '대전 최고의 드라이브 코스', vibe: '🌿 자연 · 🚗 드라이브', cost: 0 },
        { time: '17:00', emoji: '🧖', name: '유성 스파 & 온천', desc: '유성온천 스파 이용', vibe: '🧖 힐링 · 🌿 자연', cost: 12000 },
        { time: '21:00', emoji: '🏨', name: '대전 유성 모텔', desc: '유성온천 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 45000 },
      ],
      // ★ 최대 5박 6일까지 대비 — 날짜별 독립 동선
      days: [
        {
          label: '과학·문화 첫째날',
          spots: [
            { time: '09:30', emoji: '🚌', name: '대전 도착 · 여행 시작', desc: '대전역 도착, 여행 설렘 충전!', vibe: '🚀 출발 · 설렘', cost: 0 },
            { time: '11:00', emoji: '🏛️', name: '국립중앙과학관', desc: '우주·과학 전시 관람, 천체투영관 체험', vibe: '📚 교육 · 👨‍👩‍👧 가족', cost: 3000 },
            { time: '12:30', emoji: '🍞', name: '성심당 본점', desc: '대전 명물 성심당 빵 & 튀김소보로', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 10000 },
            { time: '14:00', emoji: '🌇', name: '한빛탑 & 엑스포 공원', desc: '엑스포 기념공원 산책 & 포토스팟', vibe: '📸 포토스팟 · 🌿 산책', cost: 0 },
            { time: '16:30', emoji: '🌿', name: '계족산 황톳길 산책', desc: '대전 명물 황톳길 맨발 힐링', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
            { time: '19:30', emoji: '🍖', name: '대전 소 내장탕 골목', desc: '대전 명물 소 내장탕 & 막걸리', vibe: '🍜 로컬 맛집 · 🍺 야식', cost: 10000 },
          ],
        },
        {
          label: '온천·힐링 둘째날',
          spots: [
            { time: '09:00', emoji: '☕', name: '유성 카페 모닝커피', desc: '유성온천 인근 감성 카페 브런치', vibe: '☕ 브런치 · 🌿 여유', cost: 7000 },
            { time: '10:30', emoji: '🎨', name: '이응노 미술관', desc: '고암 이응노 작품 관람', vibe: '🎨 예술 · 📚 문화', cost: 7000 },
            { time: '12:30', emoji: '🍜', name: '대전 칼국수 & 냉면 점심', desc: '대전 향토 음식 맛집 투어', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
            { time: '14:30', emoji: '🌿', name: '장태산 자연휴양림', desc: '편백나무 숲 힐링 트레킹 & 출렁다리', vibe: '🌿 힐링 · 🌲 자연', cost: 3000 },
            { time: '17:00', emoji: '🧖', name: '유성온천 스파 & 족욕', desc: '유성온천 스파 이용 & 족욕 힐링', vibe: '🧖 힐링 · 🌿 자연', cost: 12000 },
            { time: '19:30', emoji: '🍽️', name: '대전 오겹살 저녁', desc: '대전식 두루치기 오겹살 로컬 맛집', vibe: '🍽️ 로컬 맛집 · 💰 가성비', cost: 13000 },
          ],
        },
        {
          label: '대청호·원도심 셋째날',
          spots: [
            { time: '08:30', emoji: '🌊', name: '대청호 오백리길 아침 산책', desc: '대청호 수변 오백리길 트레킹', vibe: '🌿 힐링 · 🌅 아침', cost: 0 },
            { time: '10:30', emoji: '☕', name: '대전 카이스트 카페 거리', desc: '대덕연구단지 인근 힙한 감성 카페', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 7000 },
            { time: '12:30', emoji: '🍱', name: '중앙시장 순대국 & 어묵', desc: '대전 원도심 중앙시장 먹거리 탐방', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
            { time: '14:30', emoji: '🌳', name: '보문산 & 시루봉 전망대', desc: '대전 시가지 한눈에 보이는 전망 명소', vibe: '🌿 자연 · 📸 포토스팟', cost: 0 },
            { time: '17:00', emoji: '🛍️', name: '으능정이 문화거리 탐방', desc: '대전 최대 번화가, 쇼핑 & 거리 공연', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 8000 },
            { time: '19:30', emoji: '🌙', name: '대전 야경 & 야식 투어', desc: '대전 야경 명소 탐방 & 야식', vibe: '🌙 야경 · 🍺 야식', cost: 12000 },
          ],
        },
        {
          label: '공주 근교 나들이 넷째날',
          spots: [
            { time: '09:00', emoji: '🏰', name: '공주 공산성', desc: '유네스코 백제 역사유적 공산성 산책', vibe: '📚 역사 · ✨ 유네스코', cost: 3000 },
            { time: '11:00', emoji: '🏛️', name: '국립공주박물관', desc: '백제 금동대향로 등 국보 유물 관람', vibe: '🏛️ 박물관 · 📚 교육', cost: 0 },
            { time: '13:00', emoji: '🍡', name: '공주 알밤 정식 & 밤막걸리', desc: '공주 명물 알밤 정식 & 막걸리', vibe: '🍜 로컬 맛집 · 🌟 특산물', cost: 12000 },
            { time: '15:00', emoji: '🌾', name: '계룡산 & 갑사 단풍 코스', desc: '계룡산 갑사 단풍·계곡 산책', vibe: '🌿 자연 · 🏔️ 등산', cost: 0 },
            { time: '17:30', emoji: '🚗', name: '대전 귀환 & 갑천 수변 산책', desc: '갑천 수변 저녁 산책 & 한강공원 느낌', vibe: '🌿 힐링 · 🌆 석양', cost: 0 },
            { time: '19:30', emoji: '🍷', name: '대전 분위기 레스토랑 저녁', desc: '대전 감성 레스토랑 저녁 코스', vibe: '🍷 분위기 · 🌙 야경', cost: 22000 },
          ],
        },
        {
          label: '수목원·마무리 귀가 다섯째날',
          spots: [
            { time: '09:00', emoji: '🌸', name: '대전 수목원 아침 산책', desc: '도심 속 힐링 수목원 계절 꽃 감상', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
            { time: '10:30', emoji: '☕', name: '유성 감성 카페 브런치', desc: '마지막 날 여유로운 브런치', vibe: '☕ 브런치 · 🌿 여유', cost: 7000 },
            { time: '12:30', emoji: '🍞', name: '성심당 마지막 쇼핑 & 점심', desc: '대전 명물 빵 쇼핑 & 마지막 한 끼', vibe: '🍜 로컬 맛집 · 💛 추억', cost: 10000 },
          ],
        },
      ],
      tag: '🌳 대전 1박 2일',
      accommodation: '대전 유성 모텔',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '대전 역사 박물관 투어', desc: '국립중앙과학관 + 대전역사박물관', vibe: '📚 역사 · 📸 포토스팟', cost: 3000 },
        { time: '13:00', emoji: '🍽️', name: '대전 맛집 투어', desc: '성심당 빵 + 대전 오겹살 점심', vibe: '🍽️ 로컬 맛집 · 🌟 검증', cost: 22000 },
        { time: '15:30', emoji: '🌿', name: '장태산 휴양림', desc: '편백나무 숲 힐링 트레킹', vibe: '🌿 힐링 · 🤫 조용한', cost: 5000 },
        { time: '18:30', emoji: '🧖', name: '유성 스파&온천 풀 코스', desc: '유성온천 프리미엄 스파 패키지', vibe: '🧖 힐링 · 🌿 자연', cost: 35000 },
        { time: '21:00', emoji: '🏨', name: '대전 리베라 호텔', desc: '유성 비즈니스 호텔, 조식 포함', vibe: '🛏️ 편안함 · 🌆 시티뷰', cost: 80000 },
      ],
      // ★ 최대 5박 6일까지 대비 — 날짜별 독립 동선 (각 날 5~6개 스팟, 완전히 다른 코스)
      days: [
        {
          label: '과학·엑스포 첫째날',
          spots: [
            { time: '09:30', emoji: '🚌', name: '대전 도착 · 여행 시작', desc: '대전역 도착, 짐 맡기고 첫 탐방 출발!', vibe: '🚀 출발 · 설렘', cost: 0 },
            { time: '11:00', emoji: '🏛️', name: '국립중앙과학관', desc: '우주·과학 전시 무료 관람, 천체투영관 체험', vibe: '📚 교육 · 👨‍👩‍👧 가족', cost: 3000 },
            { time: '13:00', emoji: '🍞', name: '성심당 본점 & 대전 칼국수', desc: '대전 명물 성심당 빵 + 칼국수 점심', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 15000 },
            { time: '14:30', emoji: '🌇', name: '엑스포 과학공원 & 한빛탑', desc: '엑스포 기념 공원 산책, 한빛탑 전망 포토스팟', vibe: '📸 포토스팟 · 🌿 산책', cost: 0 },
            { time: '16:30', emoji: '☕', name: '카이스트 카페 거리', desc: '대덕연구단지 인근 감성 카페', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 8000 },
            { time: '19:00', emoji: '🍖', name: '대전 소 내장탕 골목 저녁', desc: '대전 명물 소 내장탕 & 막걸리', vibe: '🍜 로컬 맛집 · 🍺 야식', cost: 12000 },
          ],
        },
        {
          label: '힐링·온천 둘째날',
          spots: [
            { time: '08:30', emoji: '🌄', name: '계족산 황톳길 아침 산책', desc: '대전 명물 계족산 황톳길 맨발 산책 힐링', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
            { time: '10:30', emoji: '🌿', name: '장태산 자연휴양림', desc: '편백나무 숲 속 힐링 트레킹 & 출렁다리', vibe: '🌿 힐링 · 🌲 자연', cost: 5000 },
            { time: '12:30', emoji: '🍽️', name: '대전 오겹살 & 냉면 점심', desc: '대전식 두루치기 & 대전 냉면 로컬 맛집', vibe: '🍽️ 로컬 맛집 · 💰 가성비', cost: 16000 },
            { time: '14:30', emoji: '🎨', name: '이응노 미술관', desc: '세계적 화가 고암 이응노 작품 관람', vibe: '🎨 예술 · 📚 문화', cost: 7000 },
            { time: '16:30', emoji: '🌊', name: '대청호 오백리길 뷰포인트', desc: '대청호 수변 드라이브 & 노을 감상', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 0 },
            { time: '19:30', emoji: '🧖', name: '유성온천 스파 풀 코스', desc: '유성온천 프리미엄 스파 & 족욕 패키지', vibe: '🧖 힐링 · 🌙 여유', cost: 25000 },
          ],
        },
        {
          label: '문화·야경 셋째날',
          spots: [
            { time: '09:00', emoji: '☕', name: '대전 로스터리 카페 투어', desc: '대전 힙한 스페셜티 원두 카페 순례', vibe: '☕ 카페 · ✨ 힙한', cost: 8000 },
            { time: '10:30', emoji: '🏛️', name: '대전시립미술관', desc: '대전 대표 현대미술관, 무료~상설전', vibe: '🎨 예술 · 📚 문화', cost: 3000 },
            { time: '12:30', emoji: '🍜', name: '중앙시장 순대국 & 어묵', desc: '대전 원도심 중앙시장 먹거리 탐방', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
            { time: '14:30', emoji: '🌳', name: '보문산 & 시루봉 전망대', desc: '대전 시가지 한눈에 보이는 전망 명소', vibe: '🌿 자연 · 📸 포토스팟', cost: 0 },
            { time: '17:00', emoji: '🛍️', name: '대전 으능정이 문화거리', desc: '대전 최대 번화가, 쇼핑 & 거리 공연', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 10000 },
            { time: '19:30', emoji: '🌙', name: '대전 야경 & 루프탑 바', desc: '대전 시내 야경 명소 & 루프탑 분위기', vibe: '🌙 야경 · 🍷 분위기', cost: 18000 },
          ],
        },
        {
          label: '근교·체험 넷째날',
          spots: [
            { time: '08:30', emoji: '🌾', name: '공주 계룡산 국립공원', desc: '대전 근교 계룡산 갑사 코스 트레킹', vibe: '🌿 자연 · 🏔️ 등산', cost: 0 },
            { time: '11:00', emoji: '🏰', name: '공주 공산성 & 백제 문화', desc: '유네스코 백제역사유적지구, 공산성 산책', vibe: '📚 역사 · ✨ 유네스코', cost: 3000 },
            { time: '13:00', emoji: '🍡', name: '공주 알밤 특산물 & 점심', desc: '공주 밤막걸리 & 알밤 정식 점심', vibe: '🍜 로컬 맛집 · 🌟 특산물', cost: 14000 },
            { time: '15:00', emoji: '🎭', name: '국립공주박물관', desc: '백제 금동대향로 등 국보급 유물 관람', vibe: '📚 역사 · 🏛️ 박물관', cost: 0 },
            { time: '17:30', emoji: '🚗', name: '대전 귀환 & 갑천 산책', desc: '대전으로 복귀, 갑천 수변 저녁 산책', vibe: '🌿 힐링 · 🌆 석양', cost: 0 },
            { time: '19:30', emoji: '🍷', name: '대전 분위기 레스토랑 저녁', desc: '대전 프라이빗 레스토랑 저녁 코스', vibe: '🍷 파인다이닝 · 🌙 야경', cost: 35000 },
          ],
        },
        {
          label: '마무리·귀가 다섯째날',
          spots: [
            { time: '09:00', emoji: '☕', name: '유성 모닝커피 & 조식', desc: '여유로운 마지막 아침 브런치', vibe: '☕ 브런치 · 🌿 여유', cost: 7000 },
            { time: '10:30', emoji: '🌸', name: '대전 수목원', desc: '도심 속 힐링 수목원, 계절 꽃 감상', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
            { time: '12:30', emoji: '🍞', name: '성심당 마지막 쇼핑 & 점심', desc: '대전 명물 빵 최종 쇼핑 & 마지막 한 끼', vibe: '🍜 로컬 맛집 · 💛 추억', cost: 13000 },
          ],
        },
      ],
      tag: '🌳 대전 2박 3일',
      accommodation: '대전 리베라 호텔',
      accommodationCost: 80000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '대전 문화예술 투어', desc: '대전시립미술관 + 이응노미술관', vibe: '🎨 예술 · ✨ 문화', cost: 10000 },
        { time: '13:00', emoji: '🍷', name: '대전 파인다이닝', desc: '대전 최고급 한식 코스 레스토랑', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 65000 },
        { time: '16:00', emoji: '🌿', name: '계족산 황톳길 프라이빗 트레킹', desc: '전담 가이드와 함께하는 힐링 트레킹', vibe: '🌿 힐링 · ✨ 프리미엄', cost: 30000 },
        { time: '19:30', emoji: '🧖', name: '유성 럭셔리 스파 패키지', desc: '4성급 호텔 스파 풀패키지', vibe: '🧖 힐링 · 🌟 럭셔리', cost: 80000 },
        { time: '22:00', emoji: '🏨', name: '대전 신세계 호텔', desc: '대전 최고급 호텔 조식 포함', vibe: '🛏️ 럭셔리 · 🌆 시티뷰', cost: 180000 },
      ],
      // ★ 최대 5박 6일까지 대비 — 날짜별 독립 프리미엄 동선
      days: [
        {
          label: '예술·문화 첫째날',
          spots: [
            { time: '10:00', emoji: '🚌', name: '대전 도착 · 프리미엄 여행 시작', desc: '대전역 픽업 서비스 이용, VIP 체크인', vibe: '✨ 프리미엄 · 설렘', cost: 0 },
            { time: '11:30', emoji: '🎨', name: '대전시립미술관', desc: '현대미술 특별전 관람', vibe: '🎨 예술 · ✨ 문화', cost: 5000 },
            { time: '13:30', emoji: '🍷', name: '대전 파인다이닝 점심', desc: '대전 최고급 한식 코스 레스토랑', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 55000 },
            { time: '15:30', emoji: '🏛️', name: '이응노 미술관 프라이빗 투어', desc: '큐레이터와 함께하는 단독 관람', vibe: '🎨 VIP · ✨ 예술', cost: 25000 },
            { time: '18:00', emoji: '🌆', name: '대청댐 & 대청호 선셋 뷰', desc: '대청호 수변 드라이브 & 황금 노을', vibe: '🌅 선셋 뷰 · 🌿 자연', cost: 0 },
            { time: '20:00', emoji: '🍽️', name: '대전 로컬 맛집 저녁', desc: '현지인이 추천하는 대전 명물 저녁', vibe: '🍽️ 로컬 맛집 · 🌟 검증', cost: 30000 },
          ],
        },
        {
          label: '힐링·스파 둘째날',
          spots: [
            { time: '08:00', emoji: '🌄', name: '계족산 황톳길 새벽 트레킹', desc: '전담 가이드와 함께 황톳길 힐링 트레킹', vibe: '🌿 힐링 · ✨ 프리미엄', cost: 30000 },
            { time: '11:00', emoji: '🌿', name: '장태산 자연휴양림 & 편백 스파', desc: '편백나무 숲 힐링 + 프라이빗 족욕', vibe: '🌿 힐링 · 🧖 스파', cost: 20000 },
            { time: '13:00', emoji: '🍜', name: '대전 오겹살 & 된장찌개 점심', desc: '대전식 로컬 한정식 점심 코스', vibe: '🍽️ 로컬 맛집 · 💰 가성비', cost: 20000 },
            { time: '15:00', emoji: '🏛️', name: '국립중앙과학관 특별 프로그램', desc: 'VIP 과학관 투어 & 천체관측', vibe: '📚 교육 · 🌟 프리미엄', cost: 15000 },
            { time: '18:30', emoji: '🧖', name: '유성 럭셔리 스파 패키지', desc: '4성급 호텔 스파 풀패키지 2시간', vibe: '🧖 힐링 · 🌟 럭셔리', cost: 80000 },
            { time: '21:00', emoji: '🍺', name: '대전 야경 투어 & 야식', desc: '대전 야경 명소 & 분위기 바', vibe: '🌙 야경 · 🍺 분위기', cost: 25000 },
          ],
        },
        {
          label: '식도락·자연 셋째날',
          spots: [
            { time: '09:00', emoji: '☕', name: '호텔 조식 & 프리미엄 브런치', desc: '호텔 뷔페 조식 후 루프탑 커피', vibe: '☕ 브런치 · 🌿 여유', cost: 0 },
            { time: '10:30', emoji: '🌊', name: '대청호 오백리길 트레킹', desc: '대청호 수변 둘레길 걷기 & 포토스팟', vibe: '🌿 자연 · 📸 포토스팟', cost: 0 },
            { time: '12:30', emoji: '🦞', name: '대전 한식 파인다이닝 점심', desc: '대전 최고급 한식 코스 런치', vibe: '🍷 파인다이닝 · ✨ 특별한', cost: 60000 },
            { time: '15:00', emoji: '🎭', name: '대전 문화예술의전당', desc: '공연 · 전시 관람 (당일 프로그램)', vibe: '🎭 공연 · 🎨 예술', cost: 20000 },
            { time: '18:00', emoji: '🌇', name: '대전 성심당 & 원도심 탐방', desc: '대전 원도심 골목 탐방 & 성심당 쇼핑', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 15000 },
            { time: '20:30', emoji: '🍾', name: '루프탑 디너 & 야경', desc: '대전 시티뷰 루프탑 특별 디너', vibe: '🍾 루프탑 · 🌙 야경', cost: 50000 },
          ],
        },
        {
          label: '근교·역사 넷째날',
          spots: [
            { time: '09:00', emoji: '🏰', name: '공주 무령왕릉 & 공산성', desc: '유네스코 백제유적 VIP 해설 투어', vibe: '📚 역사 · ✨ 유네스코', cost: 15000 },
            { time: '11:30', emoji: '🌾', name: '공주 한옥마을 & 쌍수정', desc: '백제 문화유산 고즈넉한 산책', vibe: '🏛️ 전통 · 🤫 조용한', cost: 0 },
            { time: '13:00', emoji: '🍡', name: '공주 알밤 정식 점심', desc: '공주 명물 밤 정식 & 밤막걸리 코스', vibe: '🍜 로컬 맛집 · 🌟 특산물', cost: 25000 },
            { time: '15:30', emoji: '🎨', name: '국립공주박물관', desc: '금동대향로 등 국보급 백제 유물', vibe: '🏛️ 박물관 · 📚 교육', cost: 0 },
            { time: '17:30', emoji: '🚗', name: '계룡산 드라이브 & 갑사', desc: '계룡산 단풍·계곡 드라이브 코스', vibe: '🌿 드라이브 · 🏔️ 자연', cost: 0 },
            { time: '20:00', emoji: '🍷', name: '대전 프리미엄 바 & 야경', desc: '대전 최고 야경 루프탑 바에서 마무리', vibe: '🌙 야경 · 🍷 분위기', cost: 35000 },
          ],
        },
        {
          label: '쇼핑·귀가 다섯째날',
          spots: [
            { time: '09:30', emoji: '☕', name: '대전 카이스트 카페 거리', desc: '대전 최고의 감성 스페셜티 카페', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 10000 },
            { time: '11:00', emoji: '🛍️', name: '대전 갤러리아 & 타임월드', desc: '대전 프리미엄 쇼핑몰 & 기념품 구매', vibe: '🛍️ 쇼핑 · 💛 추억', cost: 20000 },
            { time: '13:00', emoji: '🍞', name: '성심당 최종 쇼핑 & 점심', desc: '대전 명물 성심당 마지막 쇼핑', vibe: '🍜 로컬 맛집 · 💛 추억', cost: 15000 },
          ],
        },
      ],
      tag: '🌳 대전 3박 4일 프리미엄',
      accommodation: '대전 신세계 호텔',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🏛️', name: '이응노미술관 프라이빗 투어', desc: '큐레이터와 함께하는 단독 관람', vibe: '🎨 VIP · ✨ 예술', cost: 50000 },
        { time: '13:00', emoji: '🌟', name: '대전 미슐랭 한식 코스', desc: '대전 최정상 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '16:00', emoji: '🌿', name: '계족산 프라이빗 스파 리트릿', desc: '프라이빗 편백 스파 전세', vibe: '🧖 프라이빗 스파 · 🌿 힐링', cost: 150000 },
        { time: '20:00', emoji: '🍾', name: '대전 루프탑 VIP 갈라 디너', desc: '대전 시티뷰 루프탑 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '대전 특급 스위트룸', desc: '펜트하우스 스위트, 버틀러 서비스', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 400000 },
      ],
      // ★ 최대 5박 6일까지 대비 — 날짜별 독립 럭셔리 동선
      days: [
        {
          label: 'VIP 아트·컬처 첫째날',
          spots: [
            { time: '11:00', emoji: '🚁', name: '프라이빗 리무진 & VIP 체크인', desc: '대전역 리무진 픽업, 펜트하우스 스위트 조기 체크인', vibe: '👑 VIP · 🛎️ 버틀러', cost: 0 },
            { time: '12:30', emoji: '🌟', name: '대전 미슐랭 한식 코스 런치', desc: '대전 최정상 파인다이닝 미슐랭 한식', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 150000 },
            { time: '15:00', emoji: '🎨', name: '이응노 미술관 프라이빗 큐레이팅', desc: '세계적 화가 이응노 작품 큐레이터 단독 해설', vibe: '🎨 VIP · ✨ 예술', cost: 50000 },
            { time: '17:30', emoji: '🏛️', name: '대전시립미술관 VIP 투어', desc: '미술관장 안내 프라이빗 특별 관람', vibe: '🎨 VIP 투어 · ✨ 문화', cost: 30000 },
            { time: '20:00', emoji: '🍾', name: '루프탑 갈라 디너 & 야경', desc: '대전 최고층 루프탑 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
            { time: '22:30', emoji: '🌙', name: '대전 VIP 재즈 클럽', desc: '대전 최고급 재즈 라이브 & 위스키', vibe: '🎵 재즈 · 🥃 위스키', cost: 80000 },
          ],
        },
        {
          label: '프라이빗 힐링·스파 둘째날',
          spots: [
            { time: '07:00', emoji: '🌄', name: '프라이빗 계족산 새벽 요가', desc: '황톳길 위 프라이빗 요가 & 명상 클래스', vibe: '🧘 명상 · 🌿 힐링', cost: 80000 },
            { time: '10:00', emoji: '🌿', name: '장태산 프라이빗 편백 스파', desc: '편백나무 숲 전세 스파 & 아로마 테라피', vibe: '🧖 프라이빗 스파 · 🌿 힐링', cost: 150000 },
            { time: '13:00', emoji: '🦞', name: '대전 프레스티지 런치', desc: '유기농 한우 & 로컬 식재료 셰프 코스', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 120000 },
            { time: '15:30', emoji: '🏊', name: '호텔 인피니티풀 & 프라이빗 비치', desc: '5성급 호텔 프라이빗 풀 독점 이용', vibe: '🏊 풀 · 👑 VIP', cost: 60000 },
            { time: '18:30', emoji: '🧖', name: '버틀러 서비스 인룸 스파', desc: '전담 테라피스트 스위트 인룸 마사지 2시간', vibe: '🧖 인룸 스파 · 👑 럭셔리', cost: 200000 },
            { time: '21:00', emoji: '🍾', name: '샴페인 & 야경 룸서비스 디너', desc: '돔 페리뇽 샴페인과 함께하는 프라이빗 룸 디너', vibe: '🍾 룸 다이닝 · 🌙 야경', cost: 180000 },
          ],
        },
        {
          label: '백제 역사 VIP 투어 셋째날',
          spots: [
            { time: '09:00', emoji: '🚁', name: '헬리콥터 대전 & 공주 에어투어', desc: '헬기로 내려다보는 대전·공주 절경', vibe: '🚁 헬기 투어 · 👑 VIP', cost: 350000 },
            { time: '11:00', emoji: '🏰', name: '공주 무령왕릉 VIP 해설', desc: '문화재청 전문 해설사 단독 투어', vibe: '📚 역사 · ✨ 유네스코', cost: 50000 },
            { time: '13:00', emoji: '🍡', name: '공주 프리미엄 알밤 코스', desc: '공주 최고급 한정식 & 밤 코스 요리', vibe: '🍜 로컬 맛집 · 🌟 특산물', cost: 60000 },
            { time: '15:00', emoji: '🎨', name: '국립공주박물관 VIP 큐레이팅', desc: '금동대향로 국보 유물 전담 큐레이터 해설', vibe: '🏛️ 박물관 · 👑 VIP', cost: 40000 },
            { time: '18:00', emoji: '🌅', name: '대청호 프라이빗 요트 선셋 크루즈', desc: '대청호 요트 대여 & 선셋 샴페인', vibe: '⛵ 요트 · 🌅 선셋', cost: 250000 },
            { time: '21:00', emoji: '🍷', name: '시그니처 셰프 프라이빗 디너', desc: '전담 셰프의 테이블 단독 코스 디너', vibe: '🍷 시그니처 · 👑 럭셔리', cost: 180000 },
          ],
        },
        {
          label: '문화·쇼핑 넷째날',
          spots: [
            { time: '09:30', emoji: '☕', name: '호텔 시그니처 브런치', desc: '총주방장 직접 준비하는 VIP 브런치', vibe: '☕ VIP 브런치 · 🌿 여유', cost: 0 },
            { time: '11:00', emoji: '🎭', name: '대전 문화예술의전당 VIP석', desc: 'VIP 지정석 공연 관람 & 백스테이지 투어', vibe: '🎭 공연 · 👑 VIP석', cost: 100000 },
            { time: '13:30', emoji: '🍷', name: '대전 최고급 와인 런치', desc: '소믈리에가 추천하는 내추럴 와인 & 요리', vibe: '🍷 와인 · ✨ 특별한', cost: 150000 },
            { time: '16:00', emoji: '🛍️', name: '대전 갤러리아 VIP 쇼핑', desc: 'VIP 전담 매니저와 함께하는 프라이빗 쇼핑', vibe: '🛍️ VIP 쇼핑 · 👑 럭셔리', cost: 50000 },
            { time: '18:30', emoji: '🌇', name: '보문산 전망대 선셋 피크닉', desc: '프라이빗 케이터링 & 보문산 선셋 뷰', vibe: '🌅 선셋 뷰 · 🧺 피크닉', cost: 80000 },
            { time: '21:00', emoji: '🌙', name: '대전 시크릿 바 & 디저트', desc: '바텐더 추천 시그니처 칵테일 & 가나슈 디저트', vibe: '🌙 바 · 🍫 디저트', cost: 70000 },
          ],
        },
        {
          label: 'VIP 마무리·귀가 다섯째날',
          spots: [
            { time: '09:00', emoji: '☕', name: '호텔 VIP 조식 & 모닝 스파', desc: '마지막 아침 조식 후 VIP 모닝 마사지', vibe: '☕ VIP 조식 · 🧖 스파', cost: 60000 },
            { time: '11:00', emoji: '🌸', name: '대전 수목원 프라이빗 투어', desc: '도심 수목원 전담 해설사 동행 산책', vibe: '🌿 힐링 · 📸 포토스팟', cost: 20000 },
            { time: '13:00', emoji: '🍞', name: '성심당 VIP 쇼케이스 & 점심', desc: '성심당 제과장 안내 프라이빗 쇼케이스 + 점심', vibe: '🌟 시그니처 · 💛 추억', cost: 30000 },
          ],
        },
      ],
      tag: '🌳 대전 럭셔리 투어',
      accommodation: '대전 특급 스위트룸',
      accommodationCost: 400000,
    },
  },

  /* ===== 광주 ===== */
  '광주': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🎨', name: '국립아시아문화전당 ACC', desc: '아시아 최대 문화 복합 시설 무료 입장', vibe: '🎨 예술 · ✨ 힙한', cost: 0 },
        { time: '12:00', emoji: '🍜', name: '광주 한정식 백반', desc: '광주 명물 한정식 백반 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:00', emoji: '🌿', name: '무등산 둘레길 산책', desc: '광주 시민의 산 무등산 둘레길 무료', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
        { time: '17:00', emoji: '🏛️', name: '5·18 민주화운동 기념관', desc: '역사 교육의 장, 무료 입장', vibe: '📚 역사 · 🤫 조용한', cost: 0 },
        { time: '19:30', emoji: '🍖', name: '광주 일신동 육전 골목', desc: '광주 명물 육전 10,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
      ],
      tag: '🎨 광주 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🎨', name: 'ACC + 광주비엔날레관', desc: '문화전당 + 비엔날레 전시관 탐방', vibe: '🎨 예술 · ✨ 힙한', cost: 3000 },
        { time: '12:30', emoji: '🍜', name: '광주 한정식', desc: '광주 대표 한정식 반찬 무한 리필', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 15000 },
        { time: '15:00', emoji: '🌿', name: '담양 죽녹원', desc: '광주 근교 대나무 숲 힐링 (입장 3,000원)', vibe: '🌿 힐링 · 📸 포토스팟', cost: 3000 },
        { time: '18:00', emoji: '☕', name: '동명동 카페 거리', desc: '광주 힙스터 카페 골목', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 8000 },
        { time: '21:00', emoji: '🏨', name: '광주 시내 모텔', desc: '충장로 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 40000 },
      ],
      tag: '🎨 광주 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 40000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🎨', name: 'ACC + 광주시립미술관', desc: '광주 대표 미술관 2곳 관람', vibe: '🎨 예술 · ✨ 문화', cost: 5000 },
        { time: '12:30', emoji: '🍽️', name: '광주 미식 투어', desc: '광주 5미 — 오리탕·육전·한정식 투어', vibe: '🍽️ 미식 · 🌟 검증', cost: 25000 },
        { time: '15:00', emoji: '🌿', name: '담양 메타세쿼이아 길', desc: '드라마 촬영지 메타세쿼이아 가로수길', vibe: '🌿 자연 · 📸 포토스팟', cost: 2000 },
        { time: '18:00', emoji: '☕', name: '동명동·양림동 카페', desc: '광주 감성 카페 골목 투어', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 12000 },
        { time: '21:00', emoji: '🏨', name: '광주 라마다 호텔', desc: '광주 비즈니스 호텔, 조식 포함', vibe: '🛏️ 편안함 · 🌆 시티뷰', cost: 80000 },
      ],
      tag: '🎨 광주 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 80000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🎨', name: 'ACC 프라이빗 큐레이터 투어', desc: '전담 큐레이터와 아시아문화전당 탐방', vibe: '🎨 VIP · ✨ 프리미엄', cost: 30000 },
        { time: '13:00', emoji: '🍷', name: '광주 파인다이닝 한식', desc: '광주 최고급 한식 코스 레스토랑', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 65000 },
        { time: '15:30', emoji: '🌿', name: '담양 죽녹원 VIP 힐링', desc: '죽녹원 + 소쇄원 프라이빗 투어', vibe: '🌿 힐링 · 📸 포토스팟', cost: 20000 },
        { time: '19:00', emoji: '🌙', name: '무등산 일몰 트레킹', desc: '무등산 정상 일몰 감상 트레킹', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 10000 },
        { time: '22:00', emoji: '🏨', name: '광주 특급 호텔', desc: '광주 4성급 특급 호텔, 스파 포함', vibe: '🛏️ 럭셔리 · 🧖 스파', cost: 170000 },
      ],
      tag: '🎨 광주 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 170000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🎨', name: '광주비엔날레 VIP 오프닝', desc: '비엔날레 VIP 프리뷰 + 작가 미팅', vibe: '🎨 VIP · ✨ 예술', cost: 80000 },
        { time: '13:00', emoji: '🌟', name: '광주 미슐랭 한식 풀코스', desc: '광주 최정상 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '16:00', emoji: '🌿', name: '무등산 헬기 투어', desc: '헬기로 즐기는 무등산 전경', vibe: '🚁 VIP 체험 · 🌿 자연', cost: 200000 },
        { time: '20:00', emoji: '🍾', name: '광주 루프탑 VIP 갈라 디너', desc: '시티뷰 루프탑 프라이빗 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '광주 최고급 스위트룸', desc: '펜트하우스 스위트, 버틀러 서비스', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 400000 },
      ],
      tag: '🎨 광주 럭셔리 투어',
      accommodation: '럭셔리 호텔 4박',
      accommodationCost: 400000,
    },
  },

  /* ===== 울산 ===== */
  '울산': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🐋', name: '장생포 고래 문화특구', desc: '고래 박물관 무료 입장, 포경 역사', vibe: '🐋 특이한 체험 · 📚 역사', cost: 2000 },
        { time: '12:00', emoji: '🍜', name: '언양 불고기 골목', desc: '울산 명물 언양불고기 10,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
        { time: '14:00', emoji: '🌿', name: '태화강 국가정원', desc: '국가 지정 정원, 대나무숲 무료', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
        { time: '16:30', emoji: '🌅', name: '간절곶 일출 포인트', desc: '한반도 최초 해 뜨는 곳, 무료', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '19:00', emoji: '🦀', name: '울산 온산 꽃게찜', desc: '울산 명물 꽃게찜 1인분 12,000원', vibe: '🦀 신선한 해산물 · 💰 가성비', cost: 12000 },
      ],
      tag: '🐋 울산 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🐋', name: '장생포 고래 박물관 + 수족관', desc: '고래 특화 박물관 + 수족관 입장', vibe: '🐋 특이한 체험 · 👨‍👩‍👧 가족', cost: 5000 },
        { time: '12:30', emoji: '🍜', name: '언양 불고기 맛집', desc: '울산 대표 언양불고기 1인분', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '14:30', emoji: '🌿', name: '태화강 국가정원 + 십리대숲', desc: '대나무숲 산책 + 메타세쿼이아길', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
        { time: '17:30', emoji: '🌅', name: '대왕암 공원', desc: '울기등대 + 해안 절경', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '울산 시내 모텔', desc: '삼산동 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 42000 },
      ],
      tag: '🐋 울산 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 42000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🐋', name: '고래 박물관 + 생태투어', desc: '장생포 고래 생태 체험 보트 탑승', vibe: '🐋 특이한 체험 · 🌊 바다', cost: 20000 },
        { time: '13:00', emoji: '🍖', name: '울산 언양 불고기 코스', desc: '전통 방식 언양불고기 + 냉면', vibe: '🍖 로컬 맛집 · 🌟 검증', cost: 25000 },
        { time: '15:30', emoji: '🌿', name: '간월재 억새 트레킹', desc: '울산 영남알프스 억새 능선 트레킹', vibe: '🌿 자연 · 🏔️ 산악', cost: 5000 },
        { time: '18:30', emoji: '🌅', name: '일산해수욕장 선셋', desc: '울산 대표 해수욕장 일몰 감상', vibe: '🌅 뷰 맛집 · 🌊 바다', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '울산 롯데 호텔', desc: '울산 비즈니스 호텔, 조식 포함', vibe: '🛏️ 편안함 · 🌆 시티뷰', cost: 85000 },
      ],
      tag: '🐋 울산 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🐋', name: '프라이빗 고래 탐사 크루즈', desc: '전용 보트로 고래 탐사 투어', vibe: '🐋 VIP 체험 · 🌊 바다', cost: 80000 },
        { time: '13:00', emoji: '🍷', name: '울산 파인다이닝', desc: '울산 최고급 해산물 코스 요리', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 70000 },
        { time: '16:00', emoji: '🏔️', name: '영남알프스 헬기 투어', desc: '헬기로 즐기는 영남알프스 전경', vibe: '🚁 이색 체험 · 🏔️ 산악', cost: 80000 },
        { time: '19:30', emoji: '🦞', name: '울산 킹크랩 & 랍스터', desc: '신선한 동해 최고급 해산물', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 80000 },
        { time: '22:00', emoji: '🏨', name: '울산 스위트 호텔', desc: '울산 특급 호텔 오션뷰 스위트', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 180000 },
      ],
      tag: '🐋 울산 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🚁', name: '영남알프스 프라이빗 헬기 투어', desc: '전용 헬기 + 간월재 프라이빗 착륙', vibe: '🚁 VIP · 🏔️ 절경', cost: 250000 },
        { time: '13:00', emoji: '🌟', name: '울산 미슐랭 해산물 코스', desc: '동해 최고급 해산물 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 200000 },
        { time: '16:00', emoji: '🐋', name: '프라이빗 요트 고래 탐사', desc: '럭셔리 요트로 고래 탐사', vibe: '🐋 VIP 탐사 · ⛵ 요트', cost: 250000 },
        { time: '20:00', emoji: '🍾', name: '오션뷰 VIP 갈라 디너', desc: '동해 파노라마뷰 프라이빗 갈라 디너', vibe: '🍾 갈라 디너 · 🌊 오션뷰', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '울산 프라이빗 비치 빌라', desc: '전용 해변 독채 빌라, 버틀러 서비스', vibe: '👑 프라이빗 빌라 · 🛎️ 버틀러', cost: 450000 },
      ],
      tag: '🐋 울산 럭셔리 투어',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 450000,
    },
  },

  /* ===== 여수 ===== */
  '여수': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🌅', name: '여수 돌산도 케이블카', desc: '여수 바다 파노라마 뷰 케이블카', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 13000 },
        { time: '12:30', emoji: '🦐', name: '여수 수산시장 해산물', desc: '여수 명물 갓김치 + 서대회 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:30', emoji: '⛵', name: '오동도 산책', desc: '동백꽃 섬 오동도 무료 산책', vibe: '🌿 자연 · 📸 포토스팟', cost: 0 },
        { time: '17:00', emoji: '🌇', name: '낭만포차 거리', desc: '여수 낭만포차 야경 + 해산물', vibe: '🌙 야경 · 🦞 신선한 해산물', cost: 12000 },
        { time: '19:30', emoji: '🍽️', name: '여수 갓김치 & 돌산 갓김치', desc: '여수 특산 갓김치 + 저녁 식사', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      ],
      tag: '🌅 여수 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌅', name: '여수 케이블카 + 마리나', desc: '케이블카 + 마리나 요트 투어', vibe: '🌅 뷰 맛집 · ⛵ 요트', cost: 15000 },
        { time: '12:30', emoji: '🦐', name: '여수 수산시장 서대회', desc: '여수 명물 서대회 + 갓김치', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 15000 },
        { time: '15:00', emoji: '⛵', name: '오동도 + 향일암 투어', desc: '해돋이 명소 향일암 석양', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 2000 },
        { time: '18:30', emoji: '🌙', name: '낭만포차 야경 포차', desc: '여수 낭만포차 야경 + 해산물 안주', vibe: '🌙 야경 · 🦞 신선한 해산물', cost: 15000 },
        { time: '21:00', emoji: '🏨', name: '여수 게스트하우스', desc: '돌산도 오션뷰 게스트하우스', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 45000 },
      ],
      tag: '🌅 여수 1박 2일',
      accommodation: '게스트하우스 1박',
      accommodationCost: 45000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🌅', name: '여수 케이블카 + 오동도', desc: '케이블카 + 동백꽃 섬 투어', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 15000 },
        { time: '13:00', emoji: '🦐', name: '여수 해산물 코스', desc: '여수 대표 해산물 코스 요리', vibe: '🦞 신선한 해산물 · 🌟 검증', cost: 30000 },
        { time: '15:30', emoji: '⛵', name: '향일암 크루즈', desc: '선상에서 보는 향일암 절경', vibe: '🌅 뷰 맛집 · ⛵ 크루즈', cost: 20000 },
        { time: '19:00', emoji: '🌙', name: '낭만포차 야경 코스', desc: '여수 최고의 야경 + 포차 안주', vibe: '🌙 야경 · 🍻 낭만', cost: 20000 },
        { time: '22:00', emoji: '🏨', name: '여수 베네치아 호텔', desc: '오션뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 90000 },
      ],
      tag: '🌅 여수 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '⛵', name: '여수 프라이빗 요트 투어', desc: '섬 사이 프라이빗 요트 크루즈', vibe: '⛵ 요트 · 🌊 다도해', cost: 80000 },
        { time: '13:00', emoji: '🍷', name: '여수 파인다이닝 해산물', desc: '여수 최고급 해산물 파인다이닝', vibe: '🍷 파인다이닝 · 🦞 해산물', cost: 75000 },
        { time: '16:00', emoji: '🌅', name: '향일암 VIP 선셋 크루즈', desc: '요트에서 감상하는 향일암 일몰', vibe: '🌅 뷰 맛집 · ⛵ 크루즈', cost: 60000 },
        { time: '19:30', emoji: '🌙', name: '여수 낭만포차 VIP', desc: '프라이빗 포차 전세 야경 디너', vibe: '🌙 야경 · 🍾 프라이빗', cost: 60000 },
        { time: '22:00', emoji: '🏨', name: '여수 디오션 리조트', desc: '여수 최고급 오션뷰 리조트', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 200000 },
      ],
      tag: '🌅 여수 3박 4일 프리미엄',
      accommodation: '특급 리조트 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '⛵', name: '여수 프라이빗 요트 다도해 일주', desc: '전세 요트로 다도해 섬 탐험', vibe: '⛵ VIP 크루즈 · 🌊 다도해', cost: 300000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 해산물 풀코스', desc: '여수 최정상 해산물 파인다이닝', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 200000 },
        { time: '16:00', emoji: '🏝️', name: '거문도 헬기 투어', desc: '헬기로 즐기는 여수 최남단 거문도', vibe: '🚁 VIP 체험 · 🏝️ 섬 탐험', cost: 250000 },
        { time: '20:00', emoji: '🍾', name: '오션뷰 VIP 갈라 디너', desc: '여수 야경 파노라마 프라이빗 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '여수 프라이빗 오션 빌라', desc: '전용 해변 독채 빌라', vibe: '👑 프라이빗 빌라 · 🛎️ 버틀러', cost: 500000 },
      ],
      tag: '🌅 여수 럭셔리 투어',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 500000,
    },
  },

  /* ===== 수원 ===== */
  '수원': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🏰', name: '수원화성 성곽 걷기', desc: '유네스코 세계문화유산 무료 산책', vibe: '📚 역사 · 📸 포토스팟', cost: 0 },
        { time: '12:00', emoji: '🍖', name: '수원 왕갈비 골목', desc: '수원 명물 왕갈비 1인분 18,000원', vibe: '🍖 로컬 맛집 · 🌟 유명한', cost: 18000 },
        { time: '14:30', emoji: '🏛️', name: '화성행궁 투어', desc: '정조대왕 행궁 (입장 1,500원)', vibe: '📚 역사 · 📸 포토스팟', cost: 1500 },
        { time: '17:00', emoji: '🌅', name: '팔달산 서장대 일몰', desc: '수원 시내 파노라마 일몰 무료', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '19:00', emoji: '🍜', name: '영동시장 먹거리 골목', desc: '수원 전통시장 먹거리 투어', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      ],
      tag: '🏰 수원 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🏰', name: '수원화성 + 화성행궁', desc: '세계문화유산 성곽 + 행궁 투어', vibe: '📚 역사 · 📸 포토스팟', cost: 3500 },
        { time: '12:30', emoji: '🍖', name: '수원 왕갈비 정식', desc: '수원 명물 왕갈비 + 갈비탕', vibe: '🍖 로컬 맛집 · 🌟 유명한', cost: 20000 },
        { time: '15:00', emoji: '🎭', name: '수원시립공연단 공연', desc: '수원 전통 공연 관람', vibe: '🎭 공연 · 📚 문화', cost: 10000 },
        { time: '18:00', emoji: '🌅', name: '팔달산 선셋', desc: '팔달산에서 바라보는 수원 야경', vibe: '🌅 뷰 맛집 · 🌙 야경', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '수원 시내 모텔', desc: '팔달구 인근 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 42000 },
      ],
      tag: '🏰 수원 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 42000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🏰', name: '수원화성 전문 해설 투어', desc: '문화해설사와 함께하는 화성 성곽 투어', vibe: '📚 역사 · ✨ 프리미엄', cost: 10000 },
        { time: '12:30', emoji: '🍖', name: '수원 갈비 코스', desc: '수원 대표 왕갈비 + 냉면 코스', vibe: '🍖 로컬 맛집 · 🌟 검증', cost: 28000 },
        { time: '15:00', emoji: '🏛️', name: '수원 박물관 + 미술관', desc: '수원박물관 + 수원시립미술관', vibe: '📚 교육 · 🎨 예술', cost: 5000 },
        { time: '18:00', emoji: '☕', name: '행리단길 카페 투어', desc: '수원 핫플 행리단길 감성 카페', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 12000 },
        { time: '21:00', emoji: '🏨', name: '수원 노보텔 호텔', desc: '수원 비즈니스 호텔, 조식 포함', vibe: '🛏️ 편안함 · 🌆 시티뷰', cost: 90000 },
      ],
      tag: '🏰 수원 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🏰', name: '수원화성 야간 조명 투어', desc: '화성 성곽 야간 특별 조명 투어', vibe: '🌙 야경 · 📚 역사', cost: 20000 },
        { time: '13:00', emoji: '🍷', name: '수원 한식 파인다이닝', desc: '수원 갈비 + 한식 코스 레스토랑', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 70000 },
        { time: '16:00', emoji: '🎭', name: '경기도문화의전당 VIP', desc: 'VIP 공연 + 아티스트 미팅', vibe: '🎭 VIP 공연 · ✨ 문화', cost: 50000 },
        { time: '19:30', emoji: '🌙', name: '수원 루프탑 바', desc: '화성 야경과 함께하는 칵테일', vibe: '🌙 야경 · 🍹 루프탑바', cost: 45000 },
        { time: '22:00', emoji: '🏨', name: '수원 특급 호텔', desc: '수원 최고급 호텔, 스파 포함', vibe: '🛏️ 럭셔리 · 🧖 스파', cost: 180000 },
      ],
      tag: '🏰 수원 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '10:00', emoji: '🏰', name: '수원화성 새벽 단독 투어', desc: '개장 전 단독 화성 투어 + 한복 체험', vibe: '👑 VIP · 📚 역사', cost: 80000 },
        { time: '13:00', emoji: '🌟', name: '수원 미슐랭 한식 코스', desc: '경기 최정상 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '16:00', emoji: '🎭', name: 'VIP 문화예술 투어', desc: '경기도 미술관 큐레이터 프라이빗 투어', vibe: '🎭 VIP · 🎨 예술', cost: 100000 },
        { time: '20:00', emoji: '🌙', name: '화성 야경 프라이빗 디너', desc: '화성 성곽 뷰 프라이빗 루프탑 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '수원 펜트하우스 스위트', desc: '화성뷰 펜트하우스 스위트룸', vibe: '👑 스위트룸 · 🛎️ 버틀러', cost: 400000 },
      ],
      tag: '🏰 수원 럭셔리 투어',
      accommodation: '럭셔리 호텔 4박',
      accommodationCost: 400000,
    },
  },

  /* ===== 춘천 ===== */
  '춘천': {
    economy: {
      spots: [
        { time: '10:00', emoji: '🌲', name: '소양강 스카이워크', desc: '유리 바닥 스카이워크 + 소양강 뷰', vibe: '📸 포토스팟 · 🌊 강', cost: 2000 },
        { time: '12:00', emoji: '🍗', name: '춘천 닭갈비 골목', desc: '춘천 명물 막국수 닭갈비 10,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
        { time: '14:00', emoji: '🚤', name: '의암호 보트 투어', desc: '의암호 수상 보트 체험', vibe: '🌊 강 · 🏄 액티비티', cost: 8000 },
        { time: '16:30', emoji: '🌿', name: '남이섬 나들이', desc: '메타세쿼이아 나무길 (입장 16,000원)', vibe: '🌿 자연 · 📸 포토스팟', cost: 16000 },
        { time: '19:30', emoji: '🍜', name: '춘천 막국수 골목', desc: '춘천 전통 메밀 막국수 7,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 7000 },
      ],
      tag: '🌲 춘천 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌿', name: '남이섬 + 자라섬', desc: '남이섬 + 자라섬 재즈 페스티벌 명소', vibe: '🌿 자연 · 📸 포토스팟', cost: 18000 },
        { time: '12:30', emoji: '🍗', name: '춘천 닭갈비', desc: '춘천 대표 닭갈비 + 막국수 세트', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
        { time: '15:00', emoji: '🚤', name: '의암호 카약 & 보트', desc: '의암호 수상 스포츠 체험', vibe: '🏄 액티비티 · 🌊 강', cost: 15000 },
        { time: '18:00', emoji: '🌅', name: '소양강 선셋 산책', desc: '소양강 둔치 산책 + 일몰', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '춘천 시내 펜션', desc: '소양강 뷰 깔끔한 펜션', vibe: '🛏️ 편안함 · 💰 가성비', cost: 50000 },
      ],
      tag: '🌲 춘천 1박 2일',
      accommodation: '펜션 1박',
      accommodationCost: 50000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🌿', name: '남이섬 + 레일바이크', desc: '남이섬 + 가평 레일바이크 탑승', vibe: '🌿 자연 · 🏄 액티비티', cost: 28000 },
        { time: '13:00', emoji: '🍗', name: '춘천 닭갈비 코스', desc: '춘천 닭갈비 + 막국수 + 닭매운탕', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 22000 },
        { time: '15:30', emoji: '🚤', name: '의암호 요트 체험', desc: '의암호 세일링 요트 체험', vibe: '⛵ 요트 · 🌊 강', cost: 35000 },
        { time: '18:30', emoji: '🌅', name: '소양강 일몰 + 닭갈비 포차', desc: '소양강 일몰 + 포장마차 야식', vibe: '🌅 뷰 맛집 · 🌙 야경', cost: 15000 },
        { time: '21:00', emoji: '🏨', name: '춘천 스프링힐 호텔', desc: '소양호 뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌊 뷰', cost: 85000 },
      ],
      tag: '🌲 춘천 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '🌿', name: '남이섬 프라이빗 투어', desc: '전세 보트 + 프라이빗 남이섬 탐방', vibe: '🌿 VIP · 📸 포토스팟', cost: 60000 },
        { time: '13:00', emoji: '🍷', name: '춘천 파인다이닝', desc: '닭갈비 파인다이닝 코스 레스토랑', vibe: '🍷 파인다이닝 · 🌟 특별한', cost: 65000 },
        { time: '16:00', emoji: '🚤', name: '소양호 프라이빗 크루즈', desc: '프라이빗 유람선 소양호 일주', vibe: '⛵ 크루즈 · 🌊 호수', cost: 60000 },
        { time: '19:30', emoji: '🌙', name: '소양강 야경 루프탑 디너', desc: '소양강 야경 + 루프탑 레스토랑', vibe: '🌙 야경 · 🍷 루프탑 다이닝', cost: 60000 },
        { time: '22:00', emoji: '🏨', name: '춘천 럭셔리 리조트', desc: '소양호 오션뷰 리조트, 조식 포함', vibe: '🛏️ 럭셔리 · 🌊 호수뷰', cost: 180000 },
      ],
      tag: '🌲 춘천 3박 4일 프리미엄',
      accommodation: '특급 리조트 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🚁', name: '소양호 헬기 투어', desc: '헬기로 즐기는 춘천·소양호 절경', vibe: '🚁 VIP 체험 · 🌊 호수', cost: 200000 },
        { time: '12:00', emoji: '🌟', name: '춘천 미슐랭 닭갈비 파인다이닝', desc: '닭갈비를 재해석한 창작 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '15:00', emoji: '🌿', name: '남이섬 프라이빗 단독 전세', desc: '폐장 후 남이섬 단독 전세 투어', vibe: '👑 VIP 전세 · 🌿 자연', cost: 300000 },
        { time: '20:00', emoji: '🍾', name: '소양호 크루즈 갈라 디너', desc: '프라이빗 크루즈 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 250000 },
        { time: '23:00', emoji: '🏨', name: '춘천 프라이빗 호수 빌라', desc: '소양호 전용 독채 빌라', vibe: '👑 프라이빗 빌라 · 🌊 호수뷰', cost: 450000 },
      ],
      tag: '🌲 춘천 럭셔리 투어',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 450000,
    },
  },

  /* ===== 포항 ===== */
  '포항': {
    economy: {
      spots: [
        { time: '09:30', emoji: '🦞', name: '죽도시장 과메기 골목', desc: '포항 명물 과메기 + 물회 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '12:00', emoji: '🌊', name: '영일만 해수욕장', desc: '포항 대표 해변 무료 산책', vibe: '🌊 바다 · 🤫 조용한', cost: 0 },
        { time: '14:00', emoji: '🌅', name: '호미곶 일출 광장', desc: '한반도 동쪽 끝 호미곶 명소 무료', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '17:00', emoji: '🏛️', name: '포항 운하 크루즈', desc: '포항 내항 운하 크루즈 5,000원', vibe: '⛵ 크루즈 · 📸 포토스팟', cost: 5000 },
        { time: '19:30', emoji: '🦀', name: '구룡포 대게 골목', desc: '포항 구룡포 대게 15,000원~', vibe: '🦀 신선한 해산물 · 💰 가성비', cost: 15000 },
      ],
      tag: '🦞 포항 당일치기',
      accommodation: '숙박 없음 (당일 귀환)',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌅', name: '호미곶 + 해안 드라이브', desc: '호미곶 상생의 손 + 해안 절경', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '12:30', emoji: '🦀', name: '구룡포 대게·물회', desc: '포항 특산 대게 + 물회 세트', vibe: '🦀 신선한 해산물 · 💰 가성비', cost: 20000 },
        { time: '15:00', emoji: '🏛️', name: '포항 스틸아트 테마 거리', desc: '포스코 스틸아트 조형물 + 운하', vibe: '🎨 예술 · 📸 포토스팟', cost: 0 },
        { time: '17:30', emoji: '🌊', name: '영일대 해수욕장', desc: '영일대 선착장 일몰 감상', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '포항 시내 모텔', desc: '북구 깔끔한 숙소', vibe: '🛏️ 편안함 · 💰 가성비', cost: 42000 },
      ],
      tag: '🦞 포항 1박 2일',
      accommodation: '모텔 1박',
      accommodationCost: 42000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '🌅', name: '호미곶 일출 + 해파랑길', desc: '일출 + 해안 트레킹 코스', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 0 },
        { time: '13:00', emoji: '🦀', name: '구룡포 킹크랩 코스', desc: '포항 최고급 킹크랩 코스 요리', vibe: '🦀 럭셔리 해산물 · 🌟 검증', cost: 35000 },
        { time: '16:00', emoji: '🏛️', name: '포항 운하 보트 투어', desc: '운하 + 포항 항구 투어', vibe: '⛵ 크루즈 · 📸 포토스팟', cost: 15000 },
        { time: '19:00', emoji: '🌙', name: '포항 영일만 야경 카페', desc: '영일만 야경 + 감성 카페', vibe: '🌙 야경 · ☕ 감성 카페', cost: 12000 },
        { time: '21:30', emoji: '🏨', name: '포항 라한 호텔', desc: '영일만 오션뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 85000 },
      ],
      tag: '🦞 포항 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '🌅', name: '호미곶 VIP 일출 투어', desc: '일출 전용 가이드 + 샴페인 브런치', vibe: '🌅 VIP 일출 · ✨ 프리미엄', cost: 60000 },
        { time: '13:00', emoji: '🍷', name: '포항 킹크랩 파인다이닝', desc: '포항 최고급 해산물 파인다이닝', vibe: '🍷 파인다이닝 · 🦀 킹크랩', cost: 80000 },
        { time: '16:00', emoji: '⛵', name: '영일만 프라이빗 요트', desc: '영일만 프라이빗 세일링 투어', vibe: '⛵ 요트 · 🌊 오션뷰', cost: 80000 },
        { time: '19:30', emoji: '🌙', name: '영일대 야경 루프탑 바', desc: '영일만 야경 + 루프탑 칵테일', vibe: '🌙 야경 · 🍹 루프탑바', cost: 50000 },
        { time: '22:00', emoji: '🏨', name: '포항 특급 오션뷰 호텔', desc: '영일만 특급 호텔, 스파 포함', vibe: '🛏️ 럭셔리 · 🧖 스파', cost: 190000 },
      ],
      tag: '🦞 포항 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 190000,
    },
    luxury: {
      spots: [
        { time: '06:00', emoji: '🌅', name: '호미곶 헬기 일출 투어', desc: '헬기로 즐기는 한반도 최동단 일출', vibe: '🚁 VIP · 🌅 일출 절경', cost: 250000 },
        { time: '12:00', emoji: '🌟', name: '미슐랭 해산물 풀코스', desc: '포항 킹크랩·랍스터·성게 풀코스', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 200000 },
        { time: '15:00', emoji: '⛵', name: '영일만 프라이빗 크루즈', desc: '전세 크루즈 + 호미곶 해안 일주', vibe: '⛵ VIP 크루즈 · 🌊 바다', cost: 300000 },
        { time: '20:00', emoji: '🍾', name: '포항 오션뷰 갈라 디너', desc: '영일만 파노라마뷰 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '포항 프라이빗 씨뷰 빌라', desc: '전용 해변 프라이빗 빌라', vibe: '👑 프라이빗 빌라 · 🌊 오션뷰', cost: 500000 },
      ],
      tag: '🦞 포항 럭셔리 투어',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 500000,
    },
  },
};

/* =============================================
   🗓️ main.js travelData — days 배열 직접 주입
   각 날마다 완전히 다른 동선 5~6개씩
   ============================================= */
// 제주도 comfort days
travelData['제주도'].comfort.days = travelData['제주도'].comfort.days || [
  {
    label: '협재·애월 서쪽 코스',
    spots: [
      { time: '09:00', emoji: '🌊', name: '협재 해수욕장', desc: '에메랄드빛 투명 바다, 제주 서쪽 대표 해변', vibe: '🌊 청명한 바다 · 📸 포토스팟', cost: 0 },
      { time: '10:30', emoji: '🍊', name: '한림공원 & 협재 용암동굴', desc: '열대식물·용암동굴 복합공원 (12,000원)', vibe: '🌿 자연 · 📚 역사', cost: 12000 },
      { time: '12:30', emoji: '🍜', name: '애월 흑돼지 구이', desc: '제주 브랜드 흑돼지 1인 25,000원', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 25000 },
      { time: '14:30', emoji: '☕', name: '애월 바다 뷰 카페거리', desc: '제주 최고 감성 카페 성지, 바다뷰 커피', vibe: '☕ 감성 카페 · 📸 인스타', cost: 8000 },
      { time: '16:30', emoji: '🌿', name: '오설록 티 뮤지엄', desc: '제주 녹차밭 속 티 뮤지엄 (무료)', vibe: '🍵 티 클래스 · 🌿 자연', cost: 0 },
      { time: '18:30', emoji: '🌅', name: '한담해안 산책로 일몰', desc: '제주 서쪽 최고 일몰 명소 무료', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
    ],
  },
  {
    label: '성산·우도 동쪽 코스',
    spots: [
      { time: '07:30', emoji: '🌄', name: '성산 일출봉 일출', desc: '유네스코 세계자연유산, 아침 일출 (2,000원)', vibe: '🌄 일출 명소 · 🏔️ 절경', cost: 2000 },
      { time: '09:30', emoji: '⛵', name: '우도 배편 & 자전거 투어', desc: '우도 페리 왕복 + 자전거 1일 대여', vibe: '⛵ 섬 투어 · 🚲 자전거', cost: 20000 },
      { time: '11:30', emoji: '🍦', name: '우도 땅콩아이스크림 & 해녀촌', desc: '우도 명물 땅콩아이스크림 + 해녀촌', vibe: '🍦 로컬 명물 · 📸 포토스팟', cost: 5000 },
      { time: '13:30', emoji: '🐟', name: '성산포항 해산물 점심', desc: '갓 잡은 생선 구이 & 회 정식 (25,000원)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 25000 },
      { time: '15:30', emoji: '🌾', name: '섭지코지 & 유채꽃 들판', desc: '영화 건축학개론 촬영지, 무료', vibe: '📸 포토스팟 · 🌿 자연', cost: 0 },
      { time: '18:00', emoji: '🌊', name: '표선 해비치 해변 석양', desc: '평원 같은 넓은 백사장, 아름다운 석양', vibe: '🌅 석양 · 🤫 조용한', cost: 0 },
    ],
  },
  {
    label: '한라산·중문 마무리 코스',
    spots: [
      { time: '08:30', emoji: '🌿', name: '천지연 폭포 아침 산책', desc: '제주 3대 폭포, 아침 산책 (2,000원)', vibe: '🌿 자연 · 🤫 조용한', cost: 2000 },
      { time: '10:00', emoji: '🎡', name: '중문 관광단지 & 천제연 폭포', desc: '중문 대표 관광지 탐방', vibe: '📸 포토스팟 · 🌿 자연', cost: 2500 },
      { time: '12:00', emoji: '🍣', name: '중문 해산물 뷔페', desc: '제주 신선 해산물 뷔페 점심 (30,000원)', vibe: '🦞 해산물 · 💰 가성비', cost: 30000 },
      { time: '14:00', emoji: '🎨', name: '제주 현대미술관', desc: '아름다운 제주 풍경 속 현대미술 (4,000원)', vibe: '🎨 예술 · 🌿 자연', cost: 4000 },
      { time: '16:00', emoji: '🛍️', name: '동문시장 & 특산물 쇼핑', desc: '제주 특산물·기념품 쇼핑', vibe: '🛍️ 쇼핑 · 🌙 야시장', cost: 10000 },
      { time: '18:30', emoji: '✈️', name: '귀가 준비 · 마지막 석양', desc: '제주 여행의 마지막, 아름다운 마무리', vibe: '🏠 귀가 · 💛 추억', cost: 0 },
    ],
  },
];

// 부산 comfort days
travelData['부산'].comfort.days = travelData['부산'].comfort.days || [
  {
    label: '해운대·달맞이 첫째날',
    spots: [
      { time: '09:30', emoji: '🌊', name: '해운대 해수욕장 & 마린시티', desc: '부산 대표 해변, 마린시티 빌딩 숲 뷰', vibe: '🌊 바다 · 📸 포토스팟', cost: 0 },
      { time: '11:00', emoji: '🚃', name: '해운대 블루라인파크 해변열차', desc: '바다 위를 달리는 해변열차 (15,000원)', vibe: '📸 포토스팟 · 🌊 오션뷰', cost: 15000 },
      { time: '13:00', emoji: '🦞', name: '기장 해산물 시장 점심', desc: '기장 대표 대게·해산물 직판장 (25,000원)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 25000 },
      { time: '15:00', emoji: '☕', name: '달맞이 고개 카페거리', desc: '벚꽃·바다뷰 감성 카페 성지 (9,000원)', vibe: '☕ 감성 카페 · 🌊 오션뷰', cost: 9000 },
      { time: '17:00', emoji: '🌉', name: '광안리 해변 & 광안대교 야경', desc: '광안대교 야경 무료 감상', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
      { time: '19:30', emoji: '🍺', name: '남포동 포장마차 골목', desc: '부산 명물 씨앗호떡·어묵탕 야식 (12,000원)', vibe: '🌙 야시장 · 🍜 야식', cost: 12000 },
    ],
  },
  {
    label: '영도·자갈치·감천 둘째날',
    spots: [
      { time: '09:00', emoji: '🎨', name: '감천문화마을', desc: '부산의 산토리니, 알록달록 계단마을', vibe: '📸 사진 잘 나오는 · ✨ 힙한', cost: 0 },
      { time: '11:00', emoji: '🌊', name: '흰여울 문화마을 & 영도', desc: '영화 촬영지 흰여울, 절벽 위 오션뷰', vibe: '📸 포토스팟 · 🌊 오션뷰', cost: 0 },
      { time: '12:30', emoji: '🐟', name: '자갈치 시장 회 점심', desc: '부산 대표 수산시장, 신선한 회 (25,000원)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 25000 },
      { time: '14:30', emoji: '🚢', name: '부산항 대교 전망대', desc: '부산항 전경 무료 조망, 대형 크루즈 감상', vibe: '🌊 오션뷰 · 📸 포토스팟', cost: 0 },
      { time: '16:30', emoji: '☕', name: '남포동 힙한 카페 투어', desc: '부산 원도심 감성 카페 & 디저트 투어 (10,000원)', vibe: '☕ 감성 카페 · ✨ 힙한', cost: 10000 },
      { time: '19:00', emoji: '🍖', name: '부산 돼지국밥 & 수육', desc: '부산 대표 로컬 맛집, 돼지국밥 (9,000원)', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 9000 },
    ],
  },
  {
    label: '서면·수영·귀가 셋째날',
    spots: [
      { time: '08:30', emoji: '🌅', name: '수영 망미동 아침 산책', desc: '부산 도시재생 핫플, 아기자기한 골목', vibe: '🌅 아침 산책 · ✨ 힙한', cost: 0 },
      { time: '10:00', emoji: '🎨', name: '부산 현대미술관 (MOCA)', desc: '을숙도 습지 옆 미술관 (5,000원)', vibe: '🎨 예술 · 🌿 자연', cost: 5000 },
      { time: '12:00', emoji: '🍜', name: '서면 밀면 & 비빔당면 점심', desc: '서면 원조 밀면집 (7,000원)', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 7000 },
      { time: '14:00', emoji: '🛍️', name: '서면 지하상가 & 쇼핑', desc: '부산 최대 지하 쇼핑 메카 (10,000원)', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 10000 },
      { time: '16:00', emoji: '🍢', name: '국제시장 & 부평깡통시장', desc: '70년 역사 국제시장 · 부산 야시장 (8,000원)', vibe: '🌙 야시장 · 💛 추억', cost: 8000 },
      { time: '18:00', emoji: '🚄', name: '귀가 · 부산역', desc: '부산의 마지막 풍경을 마음에 담고', vibe: '🏠 귀가 · 💛 추억', cost: 0 },
    ],
  },
];

// 강릉 comfort days
travelData['강릉'].comfort.days = travelData['강릉'].comfort.days || [
  {
    label: '커피·바다·경포 첫째날',
    spots: [
      { time: '09:00', emoji: '☕', name: '강릉 안목 커피거리', desc: '한국 커피 성지, 핸드드립 스페셜티 원두 (8,000원)', vibe: '☕ 커피 성지 · ✨ 힙한', cost: 8000 },
      { time: '10:30', emoji: '🌊', name: '경포 해수욕장 & 경포호', desc: '강릉 대표 해변 + 호수 자전거 산책 (3,000원)', vibe: '🌊 청명한 바다 · 🌿 힐링', cost: 3000 },
      { time: '12:30', emoji: '🍽️', name: '강릉 초당 순두부 점심', desc: '강릉 명물 초당 순두부찌개 (8,000원)', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      { time: '14:30', emoji: '🏛️', name: '오죽헌 & 강릉향교', desc: '율곡 이이 생가 + 조선시대 향교 (3,000원)', vibe: '📚 역사 · 🌿 자연', cost: 3000 },
      { time: '16:30', emoji: '🎨', name: '강릉 선교장 & 활래정', desc: '조선 최대 살림집 선교장, 전통 정원 (5,000원)', vibe: '📚 역사 · 📸 포토스팟', cost: 5000 },
      { time: '18:30', emoji: '🌅', name: '안목 해변 일몰 & 야경', desc: '강릉 커피거리 인근 일몰 + 야경 감상', vibe: '🌅 뷰 맛집 · 🌙 야경', cost: 0 },
    ],
  },
  {
    label: '정동진·주문진 둘째날',
    spots: [
      { time: '07:00', emoji: '🌄', name: '정동진 일출 감상', desc: '대한민국 대표 일출, 무료 감상', vibe: '🌄 일출 · 📸 포토스팟', cost: 0 },
      { time: '09:00', emoji: '⛵', name: '정동진 모래시계공원 & 해변', desc: '드라마 촬영지, 세계 최대 모래시계', vibe: '📸 포토스팟 · 📚 역사', cost: 0 },
      { time: '11:00', emoji: '🦀', name: '주문진 수산시장 & 대게', desc: '주문진 대표 수산시장, 대게·오징어 (20,000원)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 20000 },
      { time: '13:30', emoji: '🐙', name: '주문진 오징어 & 건어물 쇼핑', desc: '주문진 건어물 직판장 (15,000원)', vibe: '🛍️ 쇼핑 · 💰 가성비', cost: 15000 },
      { time: '15:30', emoji: '🌊', name: '하조대 & 낙산사', desc: '기암절벽 하조대 + 바다뷰 낙산사 (3,000원)', vibe: '🌿 자연 · 📚 역사', cost: 3000 },
      { time: '18:00', emoji: '🍷', name: '강릉 뷰 레스토랑 저녁', desc: '동해 뷰 감성 레스토랑 저녁 코스 (25,000원)', vibe: '🍷 분위기 맛집 · 🌊 오션뷰', cost: 25000 },
    ],
  },
  {
    label: '강릉 서핑·커피공장·귀가 셋째날',
    spots: [
      { time: '08:30', emoji: '🏄', name: '강문 해변 서핑 체험', desc: '강릉 대표 서핑 포인트, 강습 포함 (35,000원)', vibe: '🏄 서핑 · 🌊 바다', cost: 35000 },
      { time: '11:00', emoji: '☕', name: '테라로사 커피공장', desc: '강릉 커피의 역사, 테라로사 본점 (8,000원)', vibe: '☕ 커피 성지 · ✨ 힙한', cost: 8000 },
      { time: '12:30', emoji: '🍽️', name: '강릉 중앙시장 먹거리', desc: '감자전·순대·메밀전·닭강정 (12,000원)', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 12000 },
      { time: '14:30', emoji: '🌿', name: '경포 자연휴양림', desc: '피톤치드 가득한 소나무 숲 산책 (무료)', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
      { time: '16:30', emoji: '🛍️', name: '성남동 로데오 거리 & 기념품', desc: '강릉 시내 쇼핑 + 강릉 특산물 선물 (10,000원)', vibe: '🛍️ 쇼핑 · ✨ 힙한', cost: 10000 },
      { time: '18:30', emoji: '🚄', name: '강릉역 귀가', desc: '바다 냄새 가득 품고 집으로', vibe: '🏠 귀가 · 💛 추억', cost: 0 },
    ],
  },
];

// 경주 comfort days
travelData['경주'].comfort.days = travelData['경주'].comfort.days || [
  {
    label: '불국사·석굴암·황리단길 첫째날',
    spots: [
      { time: '09:00', emoji: '🏛️', name: '불국사', desc: '유네스코 세계문화유산, 신라 불교 건축의 정수 (6,000원)', vibe: '📚 역사 · 🌿 자연', cost: 6000 },
      { time: '11:00', emoji: '⛩️', name: '석굴암', desc: '통일신라 최고 걸작, 본존불 (6,000원)', vibe: '📚 역사 · 🏔️ 산악', cost: 6000 },
      { time: '12:30', emoji: '🍽️', name: '황리단길 맛집 점심', desc: '경주 힙한 황리단길 한식 맛집 (12,000원)', vibe: '✨ 힙한 · 🍜 로컬 맛집', cost: 12000 },
      { time: '14:30', emoji: '☕', name: '황리단길 카페 & 쇼핑', desc: '경주 버전 경리단길, 감성 카페 + 소품샵 (8,000원)', vibe: '☕ 감성 카페 · 📸 포토스팟', cost: 8000 },
      { time: '16:30', emoji: '🌾', name: '대릉원 · 첨성대 · 동궁과 월지', desc: '신라 역사 유적지 황금 트라이앵글 (3,000원)', vibe: '📸 포토스팟 · 📚 역사', cost: 3000 },
      { time: '19:30', emoji: '🌙', name: '동궁과 월지 야경', desc: '신라 별궁 야간 조명, 경주 최고 야경 (3,000원)', vibe: '🌙 야경 · 📸 포토스팟', cost: 3000 },
    ],
  },
  {
    label: '남산·교촌마을·양동마을 둘째날',
    spots: [
      { time: '08:30', emoji: '⛰️', name: '경주 남산 트레킹', desc: '신라 유적이 가득한 노천 박물관 (무료)', vibe: '🌿 힐링 · 📚 역사', cost: 0 },
      { time: '11:00', emoji: '🏡', name: '교촌마을 & 최씨고택', desc: '경주 교동 전통 한옥마을, 교리김밥 성지', vibe: '📚 역사 · 📸 포토스팟', cost: 0 },
      { time: '12:30', emoji: '🍱', name: '교리 김밥 & 경주 빵', desc: '경주 원조 교리김밥 + 황남빵 (8,000원)', vibe: '🍜 로컬 명물 · 💰 가성비', cost: 8000 },
      { time: '14:30', emoji: '🏘️', name: '양동마을 (유네스코)', desc: '유네스코 세계문화유산 민속마을 (4,000원)', vibe: '📚 역사 · 🌿 자연', cost: 4000 },
      { time: '17:00', emoji: '♨️', name: '보문 관광단지 & 호수 산책', desc: '경주 대표 리조트 단지, 보문호 뷰 산책', vibe: '🌿 힐링 · 🤫 조용한', cost: 0 },
      { time: '19:00', emoji: '🍖', name: '경주 닭갈비 & 쌈밥 저녁', desc: '경주 대표 먹거리 닭갈비 + 쌈밥 정식 (14,000원)', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 14000 },
    ],
  },
  {
    label: '감포·문무대왕릉·귀가 셋째날',
    spots: [
      { time: '08:00', emoji: '🌅', name: '문무대왕릉 (수중릉) 일출', desc: '세계 유일 수중왕릉, 신라 문무왕의 능 (무료)', vibe: '🌅 일출 · 📚 역사', cost: 0 },
      { time: '09:30', emoji: '🌊', name: '감포 대왕암·오류 해변', desc: '동해 청정 해변 & 기암절벽 감포 드라이브', vibe: '🌊 바다 · 🌿 자연', cost: 0 },
      { time: '11:30', emoji: '🐟', name: '감포항 신선 해산물', desc: '감포 항구 신선 회·생선구이 (20,000원)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 20000 },
      { time: '13:30', emoji: '🏛️', name: '국립경주박물관', desc: '신라 유물 2만 점 소장, 에밀레종 (무료)', vibe: '📚 역사 · 🎨 예술', cost: 0 },
      { time: '16:00', emoji: '🛍️', name: '경주 중앙시장 & 기념품', desc: '황남빵·경주법주·찰보리빵 (10,000원)', vibe: '🛍️ 쇼핑 · 💛 추억', cost: 10000 },
      { time: '18:00', emoji: '🚄', name: '귀가 · 신경주역', desc: '천년 고도의 추억을 가슴에 담고', vibe: '🏠 귀가 · 💛 추억', cost: 0 },
    ],
  },
];


const mysteryTrips = [
  {
    destination: '통영',
    economy: {
      spots: [
        { time: '09:30', emoji: '⛵', name: '통영 케이블카', desc: '남해안 파노라마 뷰 (입장 11,000원)', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 11000 },
        { time: '12:00', emoji: '🦐', name: '통영 중앙시장 굴국밥', desc: '통영 명물 굴국밥 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:00', emoji: '🎨', name: '동피랑 벽화마을', desc: '통영의 감성 벽화 골목, 무료', vibe: '📸 포토스팟 · ✨ 힙한', cost: 0 },
        { time: '17:30', emoji: '🌅', name: '달아 공원 일몰', desc: '한국 최고의 일몰 명소, 무료', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
        { time: '19:30', emoji: '🦪', name: '통영 굴구이', desc: '통영산 생굴 & 굴구이 10,000원', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 10000 },
      ],
      tag: '🎲 미스터리 — 통영 당일치기',
      accommodation: '숙박 없음',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '⛵', name: '통영 한려수도 케이블카', desc: '남해안 다도해 파노라마 뷰', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 11000 },
        { time: '12:30', emoji: '🦐', name: '통영 중앙시장 해산물', desc: '굴, 멍게, 도다리쑥국 등 신선 해산물', vibe: '🍜 로컬 맛집 · 🦞 신선한', cost: 15000 },
        { time: '15:00', emoji: '🎨', name: '동피랑 벽화마을', desc: '통영의 감성 벽화 골목', vibe: '📸 포토스팟 · ✨ 힙한', cost: 0 },
        { time: '18:30', emoji: '🌅', name: '달아 공원 일몰', desc: '한국 최고의 일몰 명소 중 하나', vibe: '🌅 뷰 맛집 · 🤫 조용한', cost: 0 },
        { time: '20:30', emoji: '🏨', name: '통영 리베라 호텔', desc: '오션뷰 가성비 호텔', vibe: '🛏️ 편안함 · 💰 가성비', cost: 50000 },
      ],
      tag: '🎲 미스터리 — 통영 1박 2일',
      accommodation: '호텔 1박',
      accommodationCost: 50000,
    },
    comfort: {
      spots: [
        { time: '10:00', emoji: '⛵', name: '통영 케이블카 & 미륵산', desc: '케이블카 + 미륵산 정상 트레킹', vibe: '🌅 뷰 맛집 · 🌿 자연', cost: 11000 },
        { time: '13:00', emoji: '🦐', name: '통영 해산물 코스', desc: '신선한 통영산 해산물 코스 요리', vibe: '🦞 신선한 해산물 · 🌟 검증', cost: 30000 },
        { time: '15:30', emoji: '🎨', name: '동피랑 & 서피랑 투어', desc: '통영 양쪽 벽화마을 투어', vibe: '📸 포토스팟 · ✨ 힙한', cost: 0 },
        { time: '18:30', emoji: '🌅', name: '달아 공원 일몰 크루즈', desc: '선상에서 감상하는 통영 일몰', vibe: '🌅 뷰 맛집 · ⛵ 크루즈', cost: 25000 },
        { time: '21:00', emoji: '🏨', name: '통영 마리나 호텔', desc: '요트 마리나 뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · ⛵ 마리나뷰', cost: 80000 },
      ],
      tag: '🎲 미스터리 — 통영 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 80000,
    },
    premium: {
      spots: [
        { time: '10:00', emoji: '⛵', name: '통영 프라이빗 요트 투어', desc: '다도해 섬 사이를 달리는 프라이빗 요트', vibe: '⛵ 요트 · 🌊 다도해', cost: 80000 },
        { time: '13:00', emoji: '🦞', name: '통영 랍스터 런치', desc: '통영산 최고급 해산물 파인다이닝', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 70000 },
        { time: '16:00', emoji: '🎨', name: '전혁림 미술관 VIP', desc: '통영 출신 거장 전혁림 작품 감상', vibe: '🎨 예술 · ✨ 힙한', cost: 5000 },
        { time: '19:00', emoji: '🌅', name: '통영 달아 크루즈 디너', desc: '일몰 크루즈 + 선상 디너', vibe: '🌅 뷰 맛집 · 🍷 선상 디너', cost: 90000 },
        { time: '22:00', emoji: '🏨', name: '통영 스탠포드 호텔', desc: '오션뷰 스위트룸', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 180000 },
      ],
      tag: '🎲 미스터리 — 통영 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 180000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '⛵', name: '프라이빗 요트 다도해 탐험', desc: '섬 하나씩 정박하는 1일 요트 크루즈', vibe: '⛵ VIP 크루즈 · 🌊 다도해', cost: 250000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 씨푸드 풀코스', desc: '통영 최고급 미슐랭 해산물 레스토랑', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 150000 },
        { time: '16:30', emoji: '🎭', name: '통영 국제음악제 VIP석', desc: '윤이상 고향 통영의 세계적 음악 축제', vibe: '🎭 공연 · 🌟 VIP', cost: 100000 },
        { time: '20:00', emoji: '🍾', name: '달아 공원 갈라 디너', desc: '남해 최고의 야경과 함께하는 VIP 갈라', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 180000 },
        { time: '22:30', emoji: '🏨', name: '통영 프라이빗 섬 빌라', desc: '독채 섬 리조트, 전용 해변 포함', vibe: '👑 프라이빗 섬 · 🌊 전용 해변', cost: 500000 },
      ],
      tag: '🎲 미스터리 — 통영 럭셔리',
      accommodation: '프라이빗 섬 빌라 4박',
      accommodationCost: 500000,
    },
  },
  {
    destination: '속초',
    economy: {
      spots: [
        { time: '09:30', emoji: '🏔️', name: '설악산 울산바위 트레킹', desc: '무료 국립공원 트레킹', vibe: '🌿 자연 · 🏔️ 산악', cost: 0 },
        { time: '13:00', emoji: '🍜', name: '속초 아바이 순대', desc: '속초 명물 아바이 순대국 7,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 7000 },
        { time: '15:00', emoji: '🌊', name: '속초 해변 산책', desc: '깨끗한 동해안 모래사장, 무료', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '17:00', emoji: '🦀', name: '속초 수산시장', desc: '생물 오징어, 명태 간식 (5,000원~)', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 8000 },
        { time: '19:30', emoji: '🍺', name: '속초 닭강정 + 야시장', desc: '속초 명물 닭강정 한 봉지 8,000원', vibe: '🍜 로컬 먹거리 · 🌙 야시장', cost: 8000 },
      ],
      tag: '🎲 미스터리 — 속초 당일치기',
      accommodation: '숙박 없음',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '09:30', emoji: '🏔️', name: '설악산 케이블카', desc: '설악산의 절경을 케이블카로 (11,000원)', vibe: '🌿 자연 · 🏔️ 산악', cost: 11000 },
        { time: '12:00', emoji: '🦐', name: '속초 아바이 마을', desc: '순대국밥과 아바이 순대의 원조', vibe: '🍜 로컬 맛집 · 📚 역사', cost: 10000 },
        { time: '14:30', emoji: '🌊', name: '속초 해변', desc: '깨끗한 동해안 모래사장', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '17:00', emoji: '🦀', name: '속초 수산시장 대게', desc: '살아있는 대게 시세 구매', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 25000 },
        { time: '20:00', emoji: '🏨', name: '속초 오션뷰 리조트', desc: '동해바다 뷰 숙소', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 55000 },
      ],
      tag: '🎲 미스터리 — 속초 1박 2일',
      accommodation: '리조트 1박',
      accommodationCost: 55000,
    },
    comfort: {
      spots: [
        { time: '09:30', emoji: '🏔️', name: '설악산 케이블카 & 권금성', desc: '케이블카 + 권금성 트레킹', vibe: '🌿 자연 · 🏔️ 산악', cost: 11000 },
        { time: '12:30', emoji: '🦀', name: '속초 대게 코스 요리', desc: '신선한 대게 풀코스 (1인 30,000원~)', vibe: '🦞 신선한 해산물 · 🌟 검증', cost: 35000 },
        { time: '15:00', emoji: '🌊', name: '속초 서핑 체험', desc: '속초 해변 서핑 레슨 (30,000원)', vibe: '🏄 서핑 · 🌊 바다', cost: 30000 },
        { time: '18:30', emoji: '🦐', name: '속초 수산시장 투어', desc: '살아있는 해산물 시장 탐방', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 20000 },
        { time: '21:00', emoji: '🏨', name: '속초 씨사이드 리조트', desc: '오션뷰 디럭스룸, 조식 포함', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 90000 },
      ],
      tag: '🎲 미스터리 — 속초 2박 3일',
      accommodation: '리조트 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '🏔️', name: '설악산 프라이빗 트레킹', desc: '전문 가이드와 함께하는 설악산 코스', vibe: '🌿 자연 · 🏔️ 산악', cost: 80000 },
        { time: '13:00', emoji: '🦞', name: '속초 랍스터 & 대게 코스', desc: '최상급 동해 해산물 파인다이닝', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 80000 },
        { time: '16:00', emoji: '🏄', name: '속초 프라이빗 서핑 레슨', desc: '1:1 전담 강사 서핑 레슨', vibe: '🏄 서핑 · 🌊 바다', cost: 60000 },
        { time: '19:30', emoji: '🌅', name: '속초 낙산사 야경 투어', desc: '의상대에서 바라보는 동해 야경', vibe: '🌅 야경 · 📚 역사', cost: 20000 },
        { time: '21:30', emoji: '🏨', name: '속초 조선호텔', desc: '동해 오션뷰 스위트룸', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 200000 },
      ],
      tag: '🎲 미스터리 — 속초 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '08:00', emoji: '🏔️', name: '설악산 헬기 투어', desc: '헬기로 즐기는 설악산 전경', vibe: '🚁 VIP 체험 · 🏔️ 절경', cost: 250000 },
        { time: '12:00', emoji: '🌟', name: '미슐랭 동해 씨푸드', desc: '속초 최고급 미슐랭 해산물 레스토랑', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 150000 },
        { time: '15:00', emoji: '🧖', name: '낙산 해변 럭셔리 스파', desc: '동해 파노라마뷰 프라이빗 스파', vibe: '🧖 힐링 · 🌊 오션뷰', cost: 120000 },
        { time: '19:30', emoji: '🍾', name: '속초 오션뷰 갈라 디너', desc: '동해 야경 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 180000 },
        { time: '22:00', emoji: '🏨', name: '속초 프라이빗 비치 빌라', desc: '전용 해변 독채 빌라', vibe: '👑 프라이빗 비치 · 🛎️ 버틀러', cost: 420000 },
      ],
      tag: '🎲 미스터리 — 속초 럭셔리',
      accommodation: '프라이빗 비치 빌라 4박',
      accommodationCost: 420000,
    },
  },
  {
    destination: '남해',
    economy: {
      spots: [
        { time: '10:00', emoji: '🌿', name: '남해 다랭이 마을', desc: '계단식 논 풍경, 무료 입장', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
        { time: '12:30', emoji: '🐟', name: '남해 멸치쌈밥', desc: '남해 특산 멸치 쌈밥 9,000원', vibe: '🍜 로컬 맛집 · 🐟 신선한', cost: 9000 },
        { time: '14:30', emoji: '🏖️', name: '상주 은모래 해변', desc: '남해에서 가장 아름다운 해변, 무료', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '17:30', emoji: '🌅', name: '창선 삼천포대교 일몰', desc: '5개 다리의 장관, 무료 감상', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
        { time: '19:30', emoji: '🍺', name: '남해 시장 해물파전', desc: '남해 시장 해물파전 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
      ],
      tag: '🎲 미스터리 — 남해 당일치기',
      accommodation: '숙박 없음',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌿', name: '남해 다랭이 마을', desc: '계단식 논 풍경, 한국의 숨은 비경', vibe: '🌿 힐링 · 📸 포토스팟', cost: 0 },
        { time: '12:30', emoji: '🐟', name: '남해 멸치쌈밥', desc: '남해 특산 멸치 요리의 진수', vibe: '🍜 로컬 맛집 · 🐟 신선한', cost: 12000 },
        { time: '15:00', emoji: '🏖️', name: '상주 은모래 해변', desc: '남해에서 가장 아름다운 해변', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '18:00', emoji: '🌅', name: '창선-삼천포대교 야경', desc: '5개의 다리가 이어진 장관', vibe: '🌅 야경 · 📸 포토스팟', cost: 0 },
        { time: '20:30', emoji: '🏨', name: '남해 힐링 펜션', desc: '바다 전망 프라이빗 펜션', vibe: '🏡 프라이빗 · 🌿 힐링', cost: 55000 },
      ],
      tag: '🎲 미스터리 — 남해 1박 2일',
      accommodation: '펜션 1박',
      accommodationCost: 55000,
    },
    comfort: {
      spots: [
        { time: '09:30', emoji: '🌿', name: '남해 다랭이 마을 투어', desc: '계단식 논과 인근 카페 투어', vibe: '🌿 힐링 · 📸 포토스팟', cost: 10000 },
        { time: '12:00', emoji: '🦞', name: '남해 해산물 코스', desc: '신선한 남해 해산물 코스 요리', vibe: '🦞 신선한 해산물 · 🌟 검증', cost: 30000 },
        { time: '14:30', emoji: '🏖️', name: '상주 은모래 해변 & 카약', desc: '해변 카약 체험 (20,000원)', vibe: '🌊 바다 · 🏄 액티비티', cost: 20000 },
        { time: '18:00', emoji: '🌅', name: '창선-삼천포대교 일몰 크루즈', desc: '선상에서 감상하는 남해 일몰', vibe: '🌅 뷰 맛집 · ⛵ 크루즈', cost: 30000 },
        { time: '21:00', emoji: '🏨', name: '남해 오션뷰 리조트', desc: '바다 전망 디럭스룸, 조식 포함', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 85000 },
      ],
      tag: '🎲 미스터리 — 남해 2박 3일',
      accommodation: '리조트 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '09:30', emoji: '⛵', name: '남해 요트 투어', desc: '한려수도 다도해를 달리는 요트', vibe: '⛵ 요트 · 🌊 다도해', cost: 80000 },
        { time: '13:00', emoji: '🦞', name: '남해 랍스터 파인다이닝', desc: '신선한 남해 해산물 파인다이닝', vibe: '🦞 럭셔리 해산물 · 🌟 특별한', cost: 70000 },
        { time: '16:00', emoji: '🌿', name: '독일마을 VIP 투어', desc: '남해 독일마을 프라이빗 문화 체험', vibe: '🌍 이색 문화 · 📸 포토스팟', cost: 20000 },
        { time: '19:30', emoji: '🌅', name: '창선대교 선셋 크루즈 디너', desc: '일몰 크루즈 + 선상 코스 디너', vibe: '🌅 뷰 맛집 · 🍷 선상 디너', cost: 90000 },
        { time: '22:00', emoji: '🏨', name: '남해 버드아일랜드 호텔', desc: '오션뷰 프리미엄 객실', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 170000 },
      ],
      tag: '🎲 미스터리 — 남해 3박 4일 프리미엄',
      accommodation: '특급 호텔 3박',
      accommodationCost: 170000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '🚁', name: '남해 한려수도 헬기 투어', desc: '헬기로 보는 다도해 최고의 절경', vibe: '🚁 VIP 체험 · 🌊 다도해', cost: 200000 },
        { time: '12:30', emoji: '🌟', name: '미슐랭 남해 씨푸드', desc: '남해 최고급 미슐랭 레스토랑', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 150000 },
        { time: '15:00', emoji: '🧖', name: '남해 힐링 스파 & 요가', desc: '바다 뷰 프라이빗 웰니스 센터', vibe: '🧖 힐링 · 🧘 요가', cost: 100000 },
        { time: '19:00', emoji: '🍾', name: '독도 앞 요트 갈라 디너', desc: '한려수도 야경 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '22:00', emoji: '🏨', name: '남해 프라이빗 아일랜드 빌라', desc: '섬 전체 독점 렌탈 풀빌라', vibe: '👑 프라이빗 아일랜드 · 🛎️ 버틀러', cost: 600000 },
      ],
      tag: '🎲 미스터리 — 남해 럭셔리',
      accommodation: '프라이빗 아일랜드 빌라 4박',
      accommodationCost: 600000,
    },
  },
  {
    destination: '가평',
    economy: {
      spots: [
        { time: '10:00', emoji: '🏕️', name: '남이섬', desc: '드라마 촬영지 남이섬 낭만 산책 (14,000원)', vibe: '📸 포토스팟 · 🌿 자연', cost: 14000 },
        { time: '13:00', emoji: '🐓', name: '가평 닭갈비 & 잣국수', desc: '춘천식 닭갈비 + 가평 특산 잣국수 9,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 9000 },
        { time: '15:00', emoji: '🌿', name: '아침고요수목원', desc: '사계절 꽃과 나무 수목원 (11,000원)', vibe: '🌿 힐링 · 📸 포토스팟', cost: 11000 },
        { time: '18:00', emoji: '🚣', name: '청평호 수상레저', desc: '카약·바나나보트 10,000원~', vibe: '🚣 액티비티 · 🌿 자연', cost: 10000 },
        { time: '19:30', emoji: '🍺', name: '가평 강변 포차', desc: '청평 강변 포차 먹거리 투어', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 10000 },
      ],
      tag: '🎲 미스터리 — 가평 당일치기',
      accommodation: '숙박 없음',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '09:30', emoji: '🏕️', name: '남이섬 + 쁘띠 프랑스', desc: '드라마 촬영지 2곳 (20,000원)', vibe: '📸 포토스팟 · 🌿 자연', cost: 20000 },
        { time: '13:00', emoji: '🐓', name: '가평 닭갈비 맛집', desc: '가평 대표 닭갈비 1인분 14,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 14000 },
        { time: '15:30', emoji: '🌿', name: '아침고요수목원', desc: '4만여 종 식물 정원', vibe: '🌿 힐링 · 📸 포토스팟', cost: 11000 },
        { time: '18:30', emoji: '☕', name: '청평호 뷰 카페', desc: '청평호 오션뷰 감성 카페', vibe: '☕ 감성 카페 · 🌅 뷰 맛집', cost: 10000 },
        { time: '21:00', emoji: '🏨', name: '가평 글램핑', desc: '청평호 뷰 글램핑', vibe: '🏕️ 글램핑 · 🌿 자연', cost: 60000 },
      ],
      tag: '🎲 미스터리 — 가평 1박 2일',
      accommodation: '글램핑 1박',
      accommodationCost: 60000,
    },
    comfort: {
      spots: [
        { time: '09:00', emoji: '🏕️', name: '남이섬 + 자라섬 투어', desc: '남이섬 + 재즈 페스티벌로 유명한 자라섬', vibe: '📸 포토스팟 · 🎵 음악', cost: 20000 },
        { time: '12:00', emoji: '🐓', name: '가평 닭갈비 & 막국수 코스', desc: '가평 최고 닭갈비 + 막국수', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: 20000 },
        { time: '15:00', emoji: '🌿', name: '아침고요수목원 & 허브아일랜드', desc: '수목원 + 허브 체험 + 아로마 테라피', vibe: '🌿 힐링 · 🧖 테라피', cost: 25000 },
        { time: '18:30', emoji: '☕', name: '가평 카페거리', desc: '청평호 뷰 감성 카페 투어', vibe: '☕ 감성 카페 · 🌅 뷰 맛집', cost: 12000 },
        { time: '21:00', emoji: '🏨', name: '가평 리조트', desc: '청평호 뷰 리조트', vibe: '🛏️ 편안함 · 🌿 자연', cost: 90000 },
      ],
      tag: '🎲 미스터리 — 가평 2박 3일',
      accommodation: '리조트 2박',
      accommodationCost: 90000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '🏕️', name: '남이섬 프라이빗 투어', desc: '개장 전 프라이빗 남이섬 단독 방문', vibe: '📸 VIP · 🌿 자연', cost: 50000 },
        { time: '12:30', emoji: '🍷', name: '가평 파인다이닝', desc: '청평호 뷰 레스토랑 코스 요리', vibe: '🍷 파인다이닝 · 🌅 뷰 맛집', cost: 65000 },
        { time: '15:00', emoji: '🌿', name: '아침고요수목원 프라이빗', desc: '큐레이터와 함께하는 수목원 탐방', vibe: '🌿 힐링 · ✨ 프리미엄', cost: 40000 },
        { time: '18:00', emoji: '🚁', name: '청평호 헬기 투어', desc: '헬기로 보는 청평호 절경', vibe: '🚁 이색 체험 · 🌅 절경', cost: 100000 },
        { time: '21:00', emoji: '🏨', name: '가평 프리미엄 풀빌라', desc: '개인 수영장 딸린 독채 풀빌라', vibe: '🛏️ 럭셔리 풀빌라 · 🏊 수영장', cost: 200000 },
      ],
      tag: '🎲 미스터리 — 가평 프리미엄',
      accommodation: '풀빌라 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '08:00', emoji: '🏕️', name: '남이섬 새벽 단독 탐방', desc: '새벽 안개 속 단독 남이섬', vibe: '📸 VIP · 🌿 신비로운', cost: 80000 },
        { time: '12:00', emoji: '🌟', name: '청평 미슐랭 레스토랑', desc: '청평호 뷰 최고급 파인다이닝', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 180000 },
        { time: '15:00', emoji: '🧖', name: '청평 프라이빗 스파 리트릿', desc: '숲속 프라이빗 스파 전세', vibe: '🧖 프라이빗 스파 · 🌿 힐링', cost: 150000 },
        { time: '19:00', emoji: '🍾', name: '청평호 크루즈 갈라 디너', desc: '청평호 유람선 VIP 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '22:00', emoji: '🏨', name: '가평 프라이빗 럭셔리 빌라', desc: '독채 럭셔리 빌라, 버틀러 서비스', vibe: '👑 프라이빗 빌라 · 🛎️ 버틀러', cost: 450000 },
      ],
      tag: '🎲 미스터리 — 가평 럭셔리',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 450000,
    },
  },
  {
    destination: '거제',
    economy: {
      spots: [
        { time: '10:00', emoji: '🌊', name: '해금강 탐방', desc: '거제 최고 절경 해금강 유람선 (12,000원)', vibe: '🌊 바다 · 📸 포토스팟', cost: 12000 },
        { time: '12:30', emoji: '🦐', name: '거제 멍게비빔밥', desc: '거제 명물 멍게비빔밥 8,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 8000 },
        { time: '14:30', emoji: '🏖️', name: '학동 흑진주 몽돌해변', desc: '검은 조약돌 해변 힐링', vibe: '🌊 청명한 바다 · 🤫 조용한', cost: 0 },
        { time: '17:00', emoji: '🌅', name: '바람의 언덕 일몰', desc: '거제 상징 일몰 명소', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '19:30', emoji: '🦞', name: '거제 대구탕 골목', desc: '거제 명물 대구탕 9,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 9000 },
      ],
      tag: '🎲 미스터리 — 거제 당일치기',
      accommodation: '숙박 없음',
      accommodationCost: 0,
    },
    standard: {
      spots: [
        { time: '10:00', emoji: '🌊', name: '해금강 + 외도 보타니아', desc: '거제 대표 섬 투어 (18,000원)', vibe: '🌊 바다 · 📸 포토스팟', cost: 18000 },
        { time: '13:00', emoji: '🦐', name: '거제 수산시장 해산물', desc: '멍게·해삼·전복 신선 해산물', vibe: '🦞 신선한 해산물 · 💰 가성비', cost: 18000 },
        { time: '15:30', emoji: '🏖️', name: '학동 몽돌 해변 + 바람의 언덕', desc: '몽돌 해변 + 바람의 언덕 투어', vibe: '🌊 바다 · 📸 포토스팟', cost: 0 },
        { time: '18:30', emoji: '🌅', name: '신선대 선셋 포인트', desc: '거제 최고의 일몰 뷰 포인트', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0 },
        { time: '21:00', emoji: '🏨', name: '거제 오션뷰 펜션', desc: '거제 바다뷰 2인실 펜션', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 55000 },
      ],
      tag: '🎲 미스터리 — 거제 1박 2일',
      accommodation: '펜션 1박',
      accommodationCost: 55000,
    },
    comfort: {
      spots: [
        { time: '09:30', emoji: '🌊', name: '외도 보타니아 + 해금강', desc: '거제 대표 섬 투어 2곳', vibe: '🌊 바다 · 🌿 자연', cost: 22000 },
        { time: '13:00', emoji: '🦐', name: '거제 해산물 코스', desc: '멍게비빔밥·전복죽·대구탕 투어', vibe: '🦞 신선한 해산물 · 🌟 검증', cost: 30000 },
        { time: '16:00', emoji: '🏖️', name: '구조라 해수욕장 + 바람의 언덕', desc: '맑은 물 구조라 해변 + 바람의 언덕', vibe: '🌊 청명한 바다 · 📸 포토스팟', cost: 0 },
        { time: '19:00', emoji: '☕', name: '거제 오션뷰 카페', desc: '거제 바다뷰 감성 카페', vibe: '☕ 감성 카페 · 🌅 뷰 맛집', cost: 12000 },
        { time: '21:30', emoji: '🏨', name: '거제 비즈니스 호텔', desc: '거제 오션뷰 비즈니스 호텔', vibe: '🛏️ 편안함 · 🌊 오션뷰', cost: 85000 },
      ],
      tag: '🎲 미스터리 — 거제 2박 3일',
      accommodation: '비즈니스 호텔 2박',
      accommodationCost: 85000,
    },
    premium: {
      spots: [
        { time: '09:00', emoji: '⛵', name: '거제 프라이빗 요트 해금강', desc: '전용 요트로 해금강 탐방', vibe: '⛵ 요트 · 🌊 바다', cost: 80000 },
        { time: '13:00', emoji: '🍷', name: '거제 파인다이닝 해산물', desc: '거제 최고급 해산물 코스', vibe: '🍷 파인다이닝 · 🦞 해산물', cost: 75000 },
        { time: '16:00', emoji: '🌅', name: '신선대 VIP 선셋', desc: '거제 최고 일몰 포인트 프라이빗', vibe: '🌅 뷰 맛집 · ✨ 프리미엄', cost: 30000 },
        { time: '19:00', emoji: '🌙', name: '거제 야경 크루즈 디너', desc: '거제도 야경 유람선 디너', vibe: '🌙 야경 · ⛵ 크루즈', cost: 70000 },
        { time: '22:00', emoji: '🏨', name: '거제 프리미엄 리조트', desc: '오션뷰 스위트 리조트', vibe: '🛏️ 럭셔리 · 🌊 오션뷰', cost: 200000 },
      ],
      tag: '🎲 미스터리 — 거제 프리미엄',
      accommodation: '프리미엄 리조트 3박',
      accommodationCost: 200000,
    },
    luxury: {
      spots: [
        { time: '09:00', emoji: '⛵', name: '거제 프라이빗 요트 일주', desc: '전세 요트 거제 섬 일주', vibe: '⛵ VIP 크루즈 · 🌊 바다', cost: 250000 },
        { time: '13:00', emoji: '🌟', name: '미슐랭 거제 씨푸드 풀코스', desc: '거제 최정상 해산물 파인다이닝', vibe: '🌟 미슐랭 · 🦞 해산물', cost: 200000 },
        { time: '16:00', emoji: '🚁', name: '거제 헬기 투어', desc: '헬기로 보는 거제도 전경', vibe: '🚁 VIP 체험 · 🌊 절경', cost: 200000 },
        { time: '20:00', emoji: '🍾', name: '신선대 VIP 갈라 디너', desc: '거제 절경 뷰 프라이빗 갈라 디너', vibe: '🍾 갈라 디너 · 🌙 야경', cost: 200000 },
        { time: '23:00', emoji: '🏨', name: '거제 프라이빗 비치 빌라', desc: '전용 해변 독채 빌라', vibe: '👑 프라이빗 빌라 · 🛎️ 버틀러', cost: 500000 },
      ],
      tag: '🎲 미스터리 — 거제 럭셔리',
      accommodation: '프라이빗 빌라 4박',
      accommodationCost: 500000,
    },
  },
];

/* =============================================
   예산 슬라이더 + 등급 인디케이터
   ============================================= */
const slider = document.getElementById('budget-slider');
const budgetLabel = document.getElementById('budget-label');
const budgetHint = document.getElementById('budget-hint');

function updateBudgetTierIndicator() {
  if (!slider) return;
  const val = parseInt(slider.value);
  const tier = getTier(val);

  // 슬라이더 그라디언트 (min=200000, max=5000000 기준)
  const sliderMinVal = parseInt(slider.min) || 200000;
  const sliderMaxVal = parseInt(slider.max) || 5000000;
  const pct = Math.min(100, Math.max(0, ((val - sliderMinVal) / (sliderMaxVal - sliderMinVal)) * 100));
  slider.style.background = `linear-gradient(to right, ${tier.color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;

  // 라벨
  if (budgetLabel) budgetLabel.textContent = '₩ ' + val.toLocaleString('ko-KR');
  if (budgetHint) budgetHint.textContent = tier.tripType + ' 기준';

  // 등급 인디케이터
  const btiIcon = document.getElementById('bti-icon');
  const btiGrade = document.getElementById('bti-grade');
  const btiDesc = document.getElementById('bti-desc');
  const btiRange = document.getElementById('bti-range');
  const btiEl = document.getElementById('budget-tier-indicator');

  if (btiIcon) btiIcon.textContent = tier.icon;
  if (btiGrade) btiGrade.textContent = tier.grade;
  if (btiDesc) btiDesc.textContent = tier.desc;

  // 예산 범위 텍스트 표시
  if (btiRange) {
    const fmtWon = (w) => {
      // w는 만원 단위 (예: 20, 200, 300)
      if (w >= 100) return (w / 100) + '백만원';
      return w + '만원';
    };
    const minW = Math.round(tier.min / 10000);
    const maxW = tier.max === Infinity ? null : Math.round((tier.max + 1) / 10000);
    let rangeText;
    if (maxW === null) {
      // 럭셔리: 300만원 이상
      const minDisplay = minW >= 10000 ? (minW / 100) + '억원' : (minW >= 100 ? (minW / 100) + '백만원' : minW + '만원');
      rangeText = minDisplay + ' 이상';
    } else {
      const minDisplay = minW >= 100 ? (minW / 100) + '백만원' : minW + '만원';
      const maxDisplay = maxW >= 100 ? (maxW / 100) + '백만원' : maxW + '만원';
      rangeText = minDisplay + ' ~ ' + maxDisplay + ' 미만';
    }
    btiRange.textContent = rangeText;
    btiRange.style.whiteSpace = 'normal';
  }

  if (btiEl) {
    btiEl.style.background = tier.colorBg;
    btiEl.style.borderColor = tier.colorBorder;
    const gradeEl = btiEl.querySelector('.bti-grade');
    if (gradeEl) gradeEl.style.color = tier.color;
  }

  // 티어 테이블 행 하이라이트
  document.querySelectorAll('.tier-row').forEach(row => row.classList.remove('tier-row-active'));
  const activeRow = document.querySelector(`.tier-${tier.key}`);
  if (activeRow) activeRow.classList.add('tier-row-active');

  // 눈금 마커 활성화
  const ticks = document.querySelectorAll('.budget-tick');
  ticks.forEach(tick => {
    const tickVal = parseInt(tick.dataset.val);
    const tickTier = getTier(tickVal);
    tick.classList.toggle('tick-active', tickTier.key === tier.key);
  });
}

if (slider) {
  slider.addEventListener('input', updateBudgetTierIndicator);
  updateBudgetTierIndicator();

  // 눈금 마커 클릭 시 슬라이더 이동
  document.querySelectorAll('.budget-tick').forEach(tick => {
    tick.addEventListener('click', () => {
      slider.value = tick.dataset.val;
      updateBudgetTierIndicator();
    });
  });

  // 눈금 마커 위치 설정 (선형 비율, 슬라이더 min/max 기준)
  const sliderMinPos = parseInt(slider.min) || 200000;
  const sliderMaxPos = parseInt(slider.max) || 5000000;
  document.querySelectorAll('.budget-tick').forEach(tick => {
    const v = parseInt(tick.dataset.val);
    const pct = Math.min(100, Math.max(0, ((v - sliderMinPos) / (sliderMaxPos - sliderMinPos)) * 100));
    tick.style.position = 'absolute';
    tick.style.left = `${pct}%`;
    tick.style.transform = 'translateX(-50%)';
  });
}

/* =============================================
   총 비용 계산
   ============================================= */
function calcTotalCost(spots, accommodationCost) {
  const spotCost = spots.reduce((sum, s) => sum + (s.cost || 0), 0);
  return spotCost + accommodationCost;
}

/* =============================================
   날짜 포맷 헬퍼
   ============================================= */
function fmtDateShort(d) {
  if (!d) return '';
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
}

/* =============================================
   날짜별 spots 분배 헬퍼
   ============================================= */
// 숙박 스팟 판별
function _isAccomSpot(s) {
  return s.emoji === '🏨' ||
    (s.name && /호텔|리조트|게스트하우스|펜션|빌라|료칸|숙소|스위트|민박/.test(s.name));
}

// 시간 문자열 → 분(minute) 변환
function _timeToMin(t) {
  if (!t) return 720; // 기본 12:00
  const parts = t.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  // 새벽 0~5시는 다음날로 취급 (야간 활동)
  return (h < 5 ? h + 24 : h) * 60 + m;
}

// 시간대 레이블
function _getTimeSlot(t) {
  if (!t) return '오후';
  const h = parseInt(t.split(':')[0]);
  if (h >= 5  && h < 9)  return '아침';
  if (h >= 9  && h < 12) return '오전';
  if (h >= 12 && h < 14) return '점심';
  if (h >= 14 && h < 17) return '오후';
  if (h >= 17 && h < 20) return '저녁';
  if (h >= 20 && h < 24) return '야간';
  return '심야'; // 0~5시
}

function splitSpotsByDay(spots, nights) {
  const totalDays = Math.max(1, nights + 1);
  const days = Array.from({ length: totalDays }, () => []);

  if (totalDays === 1) {
    // 당일치기: 숙박 제외 전체 + 시간순 정렬
    days[0] = [...spots]
      .filter(s => !_isAccomSpot(s))
      .sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));
    return days;
  }

  // 숙박 / 활동 분리
  const accomSpots = spots.filter(_isAccomSpot);
  const actSpots   = spots.filter(s => !_isAccomSpot(s));

  // 시간순 정렬
  actSpots.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

  // ── 핵심: 시간 기반 날짜 배정 ──────────────────────────────────────
  // 전체 시간 범위를 totalDays 구간으로 나눠서 배정
  // 활동 스팟을 균등하게 날짜별로 분배하되, 시간 순서 유지
  const perDay = Math.ceil(actSpots.length / totalDays);
  actSpots.forEach((s, i) => {
    const dayIdx = Math.min(Math.floor(i / perDay), totalDays - 1);
    days[dayIdx].push(s);
  });

  // 숙박 spot: 마지막 날 제외 각 날 마지막에 삽입
  accomSpots.forEach((s, i) => {
    const dayIdx = Math.min(i, totalDays - 2);
    days[dayIdx].push(s);
  });

  return days;
}

/* =============================================
   날짜 라벨 생성
   ============================================= */
function getDayLabels(totalDays, startDate) {
  const dayKo = ['일', '월', '화', '수', '목', '금', '토'];
  const ordinals = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째'];
  const labels = [];
  for (let i = 0; i < totalDays; i++) {
    const ord = ordinals[i] || `${i + 1}번째`;
    if (startDate) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const mo = d.getMonth() + 1;
      const da = d.getDate();
      const dw = dayKo[d.getDay()];
      labels.push({ ord, date: `${mo}/${da}(${dw})`, dayNum: i + 1 });
    } else {
      labels.push({ ord, date: null, dayNum: i + 1 });
    }
  }
  return labels;
}

/* =============================================
   💡 스마트 플랜 최적화 v2
   핵심: 각 날마다 완전히 다른 동선 5~6개씩 구성
   ============================================= */

// ── 날짜별 시간대 정의 ────────────────────────────────────────────
const _TIME_SLOTS = [
  { slot: '아침',  times: ['07:00','07:30','08:00','08:30'] },
  { slot: '오전',  times: ['09:00','09:30','10:00','10:30','11:00','11:30'] },
  { slot: '점심',  times: ['12:00','12:30','13:00','13:30'] },
  { slot: '오후',  times: ['14:00','14:30','15:00','15:30','16:00','16:30'] },
  { slot: '저녁',  times: ['17:00','17:30','18:00','18:30','19:00','19:30'] },
  { slot: '야간',  times: ['20:00','20:30','21:00','21:30','22:00'] },
];

function _getSlotIdx(t) {
  if (!t) return 3;
  const h = parseInt(t.split(':')[0]);
  if (h >= 5  && h < 9)  return 0;
  if (h >= 9  && h < 12) return 1;
  if (h >= 12 && h < 14) return 2;
  if (h >= 14 && h < 17) return 3;
  if (h >= 17 && h < 20) return 4;
  return 5;
}

// ── 날짜 인덱스별 기본 보충 스팟 (날짜마다 다른 동선으로 최대 6개 제공) ──────
// dayIdx: 0=첫째날, totalDays-1=마지막날
function _makeFillSpots(destination, dayIdx, totalDays, budget) {
  const isFirst = dayIdx === 0;
  const isLast  = dayIdx === totalDays - 1;
  const meal    = budget > 0 ? Math.min(15000, Math.floor(budget * 0.05)) : 8000;
  const cafe    = budget > 0 ? Math.min(10000, Math.floor(budget * 0.03)) : 6000;

  // ★ 날짜별로 완전히 다른 6개 보충 스팟 세트 (6개 슬롯 각 1개씩)
  const allVariants = [
    // ──── 첫째날 (설렘 · 도착 · 탐방) ────
    [
      { time: '08:30', emoji: '🚌', name: `${destination} 도착 · 여행 시작`, desc: '설레는 여행의 시작! 짐 맡기고 출발', vibe: '🚀 출발 · 설렘', cost: 0, _fill: true },
      { time: '10:00', emoji: '🗺️', name: `${destination} 핫플레이스 탐방`, desc: '현지인 추천 핫플레이스 구경', vibe: '✨ 힙한 · 📸 포토스팟', cost: 0, _fill: true },
      { time: '12:30', emoji: '🍽️', name: `${destination} 로컬 점심`, desc: '현지 대표 점심 메뉴로 배 채우기', vibe: '🍜 현지 맛집 · 💰 가성비', cost: meal, _fill: true },
      { time: '15:00', emoji: '☕', name: '감성 카페 방문', desc: '여행지 분위기 물씬 풍기는 카페', vibe: '☕ 감성 카페 · 📸 인스타', cost: cafe, _fill: true },
      { time: '18:30', emoji: '🌆', name: '저녁 노을 산책', desc: '여행 첫날 황금빛 노을 감상', vibe: '🌆 저녁 노을 · 📸 포토스팟', cost: 0, _fill: true },
      { time: '20:00', emoji: '🍺', name: '야시장 & 야식 탐방', desc: '현지 야시장에서 저녁 한 끼', vibe: '🌙 야시장 · 🍜 야식', cost: meal, _fill: true },
    ],
    // ──── 둘째날 (여유 · 힐링 · 현지 경험) ────
    [
      { time: '08:00', emoji: '🌅', name: '아침 명소 산책', desc: '상쾌한 아침 공기 마시며 산책', vibe: '🌿 힐링 · 🤫 조용한', cost: 0, _fill: true },
      { time: '10:00', emoji: '🎯', name: `${destination} 대표 체험`, desc: '이곳에서만 가능한 특별 체험', vibe: '🎭 체험 · ✨ 특별한', cost: meal, _fill: true },
      { time: '12:00', emoji: '🍜', name: `${destination} 맛집 투어`, desc: '현지인이 즐겨 찾는 맛집', vibe: '🍜 로컬 맛집 · 🌟 검증', cost: meal, _fill: true },
      { time: '14:30', emoji: '🏛️', name: '문화 명소 탐방', desc: '역사와 문화가 살아 숨 쉬는 곳', vibe: '📚 역사 · 🌿 자연', cost: 0, _fill: true },
      { time: '17:30', emoji: '🌅', name: '뷰 포인트 일몰', desc: '오늘의 하이라이트, 숨막히는 일몰', vibe: '🌅 뷰 맛집 · 📸 포토스팟', cost: 0, _fill: true },
      { time: '19:30', emoji: '🍷', name: '저녁 식사 & 분위기 맛집', desc: '여행 중간의 특별한 저녁', vibe: '🍽️ 분위기 맛집 · 🌙 야경', cost: meal, _fill: true },
    ],
    // ──── 셋째날 (마무리 · 쇼핑 · 귀가) ────
    [
      { time: '08:00', emoji: '🌄', name: '마지막 아침 산책', desc: '여행의 마지막 아침, 동네 조용히 산책', vibe: '🌅 아침 산책 · 🤫 조용한', cost: 0, _fill: true },
      { time: '09:30', emoji: '☕', name: '로컬 카페 모닝커피', desc: '마지막 날 아침을 여유롭게', vibe: '☕ 브런치 · 🌿 여유', cost: cafe, _fill: true },
      { time: '11:00', emoji: '🎨', name: '마지막 명소 방문', desc: '아직 못 가본 숨겨진 명소', vibe: '📸 포토스팟 · ✨ 힙한', cost: 0, _fill: true },
      { time: '12:30', emoji: '🍽️', name: '마지막 로컬 점심', desc: '다음에 또 오고 싶은 그 집', vibe: '🍜 로컬 맛집 · 💛 추억', cost: meal, _fill: true },
      { time: '15:00', emoji: '🛍️', name: '기념품 · 특산물 쇼핑', desc: '소중한 사람들을 위한 선물', vibe: '🛍️ 쇼핑 · 💛 추억', cost: meal, _fill: true },
      { time: '18:00', emoji: '🚌', name: '귀가 · 아름다운 마무리', desc: '소중한 추억을 가득 안고 집으로', vibe: '🏠 귀가 · 💛 추억', cost: 0, _fill: true },
    ],
    // ──── 넷째날 (재발견 · 새 코스) ────
    [
      { time: '09:00', emoji: '🚲', name: '자전거 & 도보 탐방', desc: '자전거로 구석구석 현지 탐방', vibe: '🚲 자전거 · 🌿 자연', cost: 5000, _fill: true },
      { time: '10:30', emoji: '🌿', name: '자연 힐링 산책', desc: '도심 벗어나 자연 속 힐링 코스', vibe: '🌿 힐링 · 🤫 조용한', cost: 0, _fill: true },
      { time: '12:30', emoji: '🍱', name: '현지 도시락 & 피크닉', desc: '공원에서 즐기는 현지 도시락', vibe: '🌿 피크닉 · 💰 가성비', cost: meal, _fill: true },
      { time: '14:30', emoji: '🎡', name: '이색 체험 액티비티', desc: '여기서만 즐길 수 있는 특별 체험', vibe: '🎭 체험 · ✨ 특별한', cost: meal, _fill: true },
      { time: '17:00', emoji: '🌅', name: '황금빛 노을 감상', desc: '오늘의 황금 시간, 숨막히는 노을', vibe: '🌅 노을 · 📸 포토스팟', cost: 0, _fill: true },
      { time: '19:30', emoji: '🌙', name: '야경 & 야식 투어', desc: '밤이 되어야 더 빛나는 야경 명소', vibe: '🌙 야경 · 🍜 야식', cost: meal, _fill: true },
    ],
    // ──── 다섯째날 이후 (자유 탐방) ────
    [
      { time: '08:30', emoji: '🌸', name: '자유 아침 탐방', desc: '자유로운 일정으로 아침 시작', vibe: '🌿 자유 · ✨ 여유', cost: 0, _fill: true },
      { time: '10:00', emoji: '📸', name: '사진 투어 & 포토스팟', desc: '여행지 명소 포토스팟 탐방', vibe: '📸 포토스팟 · 🎨 감성', cost: 0, _fill: true },
      { time: '12:00', emoji: '🥘', name: '특색 있는 현지 맛집', desc: '각 지역 고유 특색 있는 점심', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: meal, _fill: true },
      { time: '14:00', emoji: '🏞️', name: '공원 & 자연 코스', desc: '여유롭게 공원 산책', vibe: '🌿 힐링 · 🤫 조용한', cost: 0, _fill: true },
      { time: '17:30', emoji: '☕', name: '분위기 좋은 카페 방문', desc: '현지 유명 카페에서 여유 시간', vibe: '☕ 카페 · 🌅 뷰', cost: cafe, _fill: true },
      { time: '20:00', emoji: '🍽️', name: '저녁 & 추억 정리', desc: '오늘 하루 여행 추억 정리', vibe: '🌙 저녁 · 💛 추억', cost: meal, _fill: true },
    ],
  ];

  if (isFirst) return allVariants[0];
  if (isLast)  return allVariants[2];
  // 중간날은 dayIdx에 따라 순환
  return allVariants[1 + ((dayIdx - 1) % (allVariants.length - 2))];
}

// ── 숙박 스팟 삽입 헬퍼 ───────────────────────────────────────────
function _appendAccom(spots, planData, accomCost, nights, dest) {
  const perNight = nights > 0 ? Math.round(accomCost / nights) : 0;
  const accomSpot = (planData.spots || []).find(_isAccomSpot);
  if (accomSpot) {
    spots.push({ ...accomSpot, cost: perNight });
  } else if (accomCost > 0) {
    spots.push({
      time: '21:30', emoji: '🏨',
      name: planData.accommodation || `${dest} 숙소`,
      desc: `${dest} 숙소 체크인 · 편안한 휴식`,
      vibe: '🛏️ 숙박 · 🌙 휴식',
      cost: perNight, _fill: true
    });
  }
}

// ── 스팟 풀을 날짜 개수만큼 독립된 동선으로 분리 ─────────────────
// 핵심 알고리즘: 전체 풀을 시간대별로 그룹화 → 날짜마다 다른 스팟 배정
function _splitIntoDayPools(actSpots, totalDays) {
  if (totalDays <= 1) return [actSpots];

  // 스팟을 시간대 슬롯(0~5)별로 그룹화
  const slotGroups = Array.from({ length: 6 }, () => []);
  actSpots.forEach(s => slotGroups[_getSlotIdx(s.time)].push(s));

  const dayPools = Array.from({ length: totalDays }, () => []);

  // 각 슬롯 그룹 내에서 날짜 순서대로 라운드로빈 배정
  slotGroups.forEach(group => {
    group.forEach((spot, i) => {
      dayPools[i % totalDays].push(spot);
    });
  });

  return dayPools;
}

// buildSmartPlan v1은 아래 v3로 대체됨 — 이 블록은 v3에서 정의됨
/*function buildSmartPlan(planData, budget, requestedNights) {
  if (!planData || !planData.spots) return planData;

  const nights    = (requestedNights !== undefined) ? requestedNights : (planData.nights || 0);
  const totalDays = Math.max(1, nights + 1);
  const dest      = planData.destination || '';

  // ── 1. 숙박비 계산 ────────────────────────────────────────────────
  const origNights    = planData.nights || (planData.accommodationCost > 0 ? 1 : 0);
  const origAccomCost = planData.accommodationCost || 0;
  const perNightCost  = origNights > 0 ? Math.round(origAccomCost / origNights) : 0;
  let   accomCost     = perNightCost * nights;
  if (budget > 0 && accomCost > budget * 0.45) accomCost = Math.round(budget * 0.40);

  // ── 2. 활동 예산 ──────────────────────────────────────────────────
  const actBudget = budget > 0 ? Math.max(0, budget - accomCost) : Infinity;

  // ── 3. 데이터에 days 배열이 있으면 그대로 사용 (하루 5~6개 보장) ──────────
  if (planData.days && Array.isArray(planData.days) && planData.days.length > 0) {
    // 실제 사용할 day 데이터 목록 (요청 날수만큼 순환)
    const useDays = [];
    for (let di = 0; di < totalDays; di++) {
      useDays.push(planData.days[di % planData.days.length]);
    }

    const TARGET_MIN = 5; // 하루 최소 스팟 수
    const TARGET_MAX = 6; // 하루 최대 스팟 수

    const daySlots = useDays.map((dayData, di) => {
      // 숙박 스팟 제외한 활동 스팟만
      const baseSpots = (dayData.spots || []).filter(s => !_isAccomSpot(s)).map(s => ({...s}));
      baseSpots.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

      // 이미 5~6개면 그대로 사용
      if (baseSpots.length >= TARGET_MIN) {
        const spots = baseSpots.slice(0, TARGET_MAX);
        spots.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));
        // 숙박 추가 (마지막날 제외)
        if (di < totalDays - 1) _appendAccom(spots, planData, accomCost, nights, dest);
        return spots;
      }

      // 5개 미만이면 보충 스팟으로 채우기
      const occupied = new Set(baseSpots.map(s => _getSlotIdx(s.time)));
      const fillSpots = _makeFillSpots(dest, di, totalDays, budget);

      for (const fs of fillSpots) {
        if (baseSpots.length >= TARGET_MAX) break;
        const slotIdx = _getSlotIdx(fs.time);
        if (!occupied.has(slotIdx)) {
          baseSpots.push({...fs});
          occupied.add(slotIdx);
        }
      }

      // 그래도 부족하면 시간만 다르게 해서 추가
      if (baseSpots.length < TARGET_MIN) {
        const extraTimes = ['09:00','11:00','14:00','16:00','19:00','21:00'];
        for (const t of extraTimes) {
          if (baseSpots.length >= TARGET_MIN) break;
          const slotIdx = _getSlotIdx(t);
          if (!occupied.has(slotIdx)) {
            baseSpots.push({ time: t, emoji: '🗺️', name: `${dest} 탐방`, desc: '여행지 자유 탐방', vibe: '🌿 자유 · ✨ 여행', cost: 0, _fill: true });
            occupied.add(slotIdx);
          }
        }
      }

      baseSpots.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

      // 숙박 추가 (마지막날 제외)
      if (di < totalDays - 1) _appendAccom(baseSpots, planData, accomCost, nights, dest);

      return baseSpots;
    });

    const finalSpots = daySlots.flat();
    return {
      ...planData,
      spots: finalSpots,
      accommodationCost: accomCost,
      nights,
      _smartOptimized: true,
      _originalBudget: budget,
      _finalTotal: finalSpots.reduce((s, x) => s + (x.cost || 0), 0),
      _actBudget: actBudget,
      _accomCost: accomCost,
      _daySlots: daySlots,
    };
  }

  // ── 4. days 배열이 없는 경우: 각 날마다 5~6개 스팟 독립 생성 ─────
  const accomSpots = planData.spots.filter(_isAccomSpot);
  const actSpots   = planData.spots.filter(s => !_isAccomSpot(s));

  // 예산 내 선택
  const sorted   = [...actSpots].sort((a, b) => (a.cost || 0) - (b.cost || 0));
  let   remain   = actBudget;
  const chosen   = [];
  sorted.filter(s => !s.cost || s.cost === 0).forEach(s => chosen.push(s));
  sorted.filter(s => s.cost > 0).forEach(s => {
    if (remain === Infinity || s.cost <= remain) {
      chosen.push(s);
      if (remain !== Infinity) remain -= s.cost;
    }
  });

  // 날짜별 독립 동선 분리 (라운드로빈)
  const rawPools = _splitIntoDayPools(chosen, totalDays);

  const TARGET_MIN = 5;
  const TARGET_MAX = 6;

  const daySlots = rawPools.map((pool, di) => {
    const dayActs = [...pool];
    dayActs.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

    // 보충 스팟으로 빈 시간대 채우기 — 하루 최소 5개 보장
    const occupied = new Set(dayActs.map(s => _getSlotIdx(s.time)));
    const fillSpots = _makeFillSpots(dest, di, totalDays, budget);

    for (const fs of fillSpots) {
      if (dayActs.length >= TARGET_MAX) break;
      const slotIdx = _getSlotIdx(fs.time);
      if (!occupied.has(slotIdx)) {
        dayActs.push({...fs});
        occupied.add(slotIdx);
      }
    }

    // 그래도 5개 미만이면 시간대 겹치지 않게 강제 추가
    if (dayActs.length < TARGET_MIN) {
      const extraTimes = ['09:00','11:00','14:00','16:00','19:00','21:00'];
      for (const t of extraTimes) {
        if (dayActs.length >= TARGET_MIN) break;
        const slotIdx = _getSlotIdx(t);
        if (!occupied.has(slotIdx)) {
          dayActs.push({ time: t, emoji: '🗺️', name: `${dest} 자유 탐방`, desc: '여행지 자유 탐방', vibe: '🌿 자유 · ✨ 여행', cost: 0, _fill: true });
          occupied.add(slotIdx);
        }
      }
    }

    dayActs.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

    // 숙박 스팟 삽입 (마지막 날 제외)
    if (di < totalDays - 1) _appendAccom(dayActs, planData, accomCost, nights, dest);

    return dayActs;
  });

  const finalSpots = daySlots.flat();
  return {
    ...planData,
    spots: finalSpots,
    accommodationCost: accomCost,
    nights,
    _smartOptimized: true,
    _originalBudget: budget,
    _finalTotal: finalSpots.reduce((s, x) => s + (x.cost || 0), 0),
    _actBudget: actBudget,
    _accomCost: accomCost,
    _daySlots: daySlots,
  };
}*/
// ── 위 v1 함수는 주석 처리됨 (v3로 완전 대체) ──

/* ─ buildSmartPlan v3 ── 완전 재설계 ──────────────────────────────
   핵심 규칙:
   ① 첫째날·중간날: 5~6개 스팟 (중복 절대 없음)
   ② 마지막날: 3개 스팟 + 귀가 (숙박 없음)
   ③ 숙박: 날마다 똑같은 숙소, 1박당 동일 가격
   ④ 예산 80만원 → 숙박비 먼저 확보 → 나머지 활동비로 배분
   ─────────────────────────────────────────────────────────────── */
function buildSmartPlan(planData, budget, requestedNights) {
  if (!planData || !planData.spots) return planData;

  const nights    = (requestedNights !== undefined) ? requestedNights : (planData.nights || 0);
  const totalDays = Math.max(1, nights + 1);
  const dest      = planData.destination || '';

  /* ────────────────────────────────────────────────
     A. 1박당 숙박 단가 계산 & 예산 검증
  ──────────────────────────────────────────────── */
  const origNights   = planData.nights || (planData.accommodationCost > 0 ? 1 : 0);
  const origTotalAcc = planData.accommodationCost || 0;
  let perNight = origNights > 0 ? Math.round(origTotalAcc / origNights) : 0;

  // 숙박비가 총예산 45% 초과 시 예산 기준 40%/nights로 하향
  const rawTotalAcc = perNight * nights;
  if (budget > 0 && rawTotalAcc > budget * 0.45 && nights > 0) {
    perNight = Math.round((budget * 0.40) / nights);
  }
  const accomCost = perNight * nights; // 총 숙박비

  /* ────────────────────────────────────────────────
     B. 활동 예산
  ──────────────────────────────────────────────── */
  const actBudget = budget > 0 ? Math.max(0, budget - accomCost) : Infinity;

  /* ────────────────────────────────────────────────
     C. 날짜별 목표 스팟 수 (마지막날은 3개로 제한)
  ──────────────────────────────────────────────── */
  function dayTarget(di) {
    return (di === totalDays - 1) ? { min: 3, max: 3 } : { min: 5, max: 6 };
  }

  /* ────────────────────────────────────────────────
     D. 숙박 스팟 고정 삽입 (날마다 동일 이름·동일 가격)
  ──────────────────────────────────────────────── */
  const accomTemplate = (planData.spots || []).find(_isAccomSpot);
  function makeAccomSpot() {
    return {
      time: '21:30', emoji: '🏨',
      name: accomTemplate ? accomTemplate.name : (planData.accommodation || `${dest} 숙소`),
      desc: accomTemplate ? (accomTemplate.desc || '') : `${dest} 숙소 체크인 · 편안한 휴식`,
      vibe: '🛏️ 숙박 · 🌙 휴식',
      cost: perNight, // ★ 항상 동일
      _isAccom: true,
    };
  }

  /* ────────────────────────────────────────────────
     E. 귀가 스팟
  ──────────────────────────────────────────────── */
  function makeReturnSpot() {
    return {
      time: '17:00', emoji: '🚄',
      name: `${dest} 출발 · 귀가`,
      desc: '소중한 추억을 가득 안고 집으로 출발!',
      vibe: '🏠 귀가 · 💛 추억',
      cost: 0, _fill: true, _isReturn: true,
    };
  }

  /* ────────────────────────────────────────────────
     F. 스팟 채우기 공통 함수
     usedNames: Set — 이미 사용된 스팟 이름 (전체 날짜 공유)
  ──────────────────────────────────────────────── */
  function fillDay(baseList, di, usedNames, tMin, tMax) {
    const result = [];
    const occupied = new Set(); // 시간 슬롯 점유 여부

    for (const s of baseList) {
      if (result.length >= tMax) break;
      if (usedNames.has(s.name)) continue; // 중복 이름 건너뜀
      const slotIdx = _getSlotIdx(s.time);
      if (occupied.has(slotIdx)) continue; // 같은 시간대 건너뜀
      result.push({...s});
      occupied.add(slotIdx);
      usedNames.add(s.name);
    }

    // 부족하면 보충 스팟으로 채우기
    if (result.length < tMin) {
      const fills = _makeFillSpots(dest, di, totalDays, budget);
      for (const fs of fills) {
        if (result.length >= tMin) break; // tMin만큼 채우면 종료
        const slotIdx = _getSlotIdx(fs.time);
        if (occupied.has(slotIdx) || usedNames.has(fs.name)) continue;
        result.push({...fs});
        occupied.add(slotIdx);
        usedNames.add(fs.name);
      }
    }

    result.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));
    return result;
  }

  /* ────────────────────────────────────────────────
     G. days 배열 있는 경우 — 데이터 기반 일정 생성
  ──────────────────────────────────────────────── */
  if (planData.days && Array.isArray(planData.days) && planData.days.length > 0) {
    const usedNames = new Set();
    const daySlots  = [];

    for (let di = 0; di < totalDays; di++) {
      const dayData = planData.days[di % planData.days.length];
      const { min: tMin, max: tMax } = dayTarget(di);

      // 해당 날의 후보 스팟 (숙박 제외, 시간순)
      const candidates = (dayData.spots || [])
        .filter(s => !_isAccomSpot(s))
        .sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));

      const picked = fillDay(candidates, di, usedNames, tMin, tMax);

      // 마지막날: 귀가 추가 / 중간날: 숙박 추가
      if (di === totalDays - 1) {
        picked.push(makeReturnSpot());
      } else if (perNight > 0 || accomTemplate) {
        picked.push(makeAccomSpot());
      }

      daySlots.push(picked);
    }

    const finalSpots = daySlots.flat();
    return {
      ...planData,
      spots:           finalSpots,
      accommodationCost: accomCost,
      nights,
      _smartOptimized: true,
      _originalBudget: budget,
      _finalTotal:     finalSpots.reduce((s, x) => s + (x.cost || 0), 0),
      _actBudget:      actBudget,
      _accomCost:      accomCost,
      _perNightCost:   perNight,
      _daySlots:       daySlots,
    };
  }

  /* ────────────────────────────────────────────────
     H. days 배열 없는 경우 — spots 풀 → 날짜별 분배
  ──────────────────────────────────────────────── */
  const actSpots = planData.spots.filter(s => !_isAccomSpot(s));

  // 예산 내 활동 스팟 선택
  const sortedAct = [...actSpots].sort((a, b) => (a.cost || 0) - (b.cost || 0));
  let remBudget   = actBudget;
  const chosen    = [];
  sortedAct.filter(s => !s.cost || s.cost === 0).forEach(s => chosen.push(s));
  sortedAct.filter(s => s.cost > 0).forEach(s => {
    if (remBudget === Infinity || s.cost <= remBudget) {
      chosen.push(s);
      if (remBudget !== Infinity) remBudget -= s.cost;
    }
  });

  // 슬롯별 라운드로빈 분배
  const rawPools  = _splitIntoDayPools(chosen, totalDays);
  const usedNames = new Set();

  const daySlots = rawPools.map((pool, di) => {
    const { min: tMin, max: tMax } = dayTarget(di);
    const candidates = pool.sort((a, b) => _timeToMin(a.time) - _timeToMin(b.time));
    const picked     = fillDay(candidates, di, usedNames, tMin, tMax);

    if (di === totalDays - 1) {
      picked.push(makeReturnSpot());
    } else if (perNight > 0 || accomTemplate) {
      picked.push(makeAccomSpot());
    }

    return picked;
  });

  const finalSpots = daySlots.flat();
  return {
    ...planData,
    spots:           finalSpots,
    accommodationCost: accomCost,
    nights,
    _smartOptimized: true,
    _originalBudget: budget,
    _finalTotal:     finalSpots.reduce((s, x) => s + (x.cost || 0), 0),
    _actBudget:      actBudget,
    _accomCost:      accomCost,
    _perNightCost:   perNight,
    _daySlots:       daySlots,
  };
}

/* =============================================
   플랜 HTML 생성 — 여행 동선 타임라인 뷰
   첫째날 / 둘째날 / 셋째날... 실제 여행 동선처럼 표현
   ============================================= */
function buildPlanHTML(planData, tier, isMystery = false) {
  const nights    = (planData.nights !== undefined) ? planData.nights : (tier.nights || 0);
  const totalDays = Math.max(1, nights + 1);
  const startDate = window._selectedStartDate || null;
  const dayLabels = getDayLabels(totalDays, startDate);

  // ── 스마트플랜이면 _daySlots 재활용, 아니면 splitSpotsByDay ──────────
  let daySpots;
  if (planData._daySlots && planData._daySlots.length === totalDays) {
    daySpots = planData._daySlots;
  } else {
    daySpots = splitSpotsByDay(planData.spots, nights);
  }

  // 전체 비용 계산
  const allSpots      = daySpots.flat();
  const totalSpotCost = allSpots.reduce((s, x) => s + (x.cost || 0), 0);
  const accomCost     = planData.accommodationCost || 0;
  // 숙박비가 스팟에 포함되어 있으면 중복 방지
  const accomInSpots  = allSpots.filter(_isAccomSpot).reduce((s, x) => s + (x.cost || 0), 0);
  const total         = accomInSpots > 0 ? totalSpotCost : totalSpotCost + accomCost;
  const budget        = parseInt(document.getElementById('budget-slider')?.value || 0);
  const withinBudget  = budget <= 0 || total <= budget;
  const surplus       = budget > 0 ? budget - total : 0;
  const surplusAbs    = Math.abs(surplus);

  // 선택된 동행·테마·이동수단
  const companion     = getSelectedChip('companion-chips') || '';
  const themes        = getSelectedChips('theme-chips');
  const transports    = getSelectedChips('transport-chips');
  const companionBadge  = companion  ? `<span class="meta-chip">👥 ${companion}</span>` : '';
  const themeBadges     = themes.length     ? themes.map(t => `<span class="meta-chip">🎨 ${t}</span>`).join('') : '';
  const transportBadges = transports.length ? transports.map(t => `<span class="meta-chip">🚗 ${t}</span>`).join('') : '';

  /* ═══════════════════════════════════════════════
     날짜별 색상 & 테마 정의
  ═══════════════════════════════════════════════ */
  const DAY_PALETTE = [
    { color: '#6C63FF', bg: 'linear-gradient(135deg,#6C63FF18,#43CFBB0A)', icon: '🚀', label: '출발 · 탐방',   border: '#6C63FF40' },
    { color: '#43CFBB', bg: 'linear-gradient(135deg,#43CFBB18,#22c55e0A)', icon: '🌿', label: '탐방 · 힐링',   border: '#43CFBB40' },
    { color: '#FF8C42', bg: 'linear-gradient(135deg,#FF8C4218,#FF65840A)', icon: '🏁', label: '마지막 · 귀환', border: '#FF8C4240' },
    { color: '#FF6584', bg: 'linear-gradient(135deg,#FF658418,#f9731610)', icon: '⭐', label: '탐방 · 이동',   border: '#FF658440' },
    { color: '#FFD166', bg: 'linear-gradient(135deg,#FFD16618,#f59e0b0A)', icon: '✨', label: '자유 · 여행',   border: '#FFD16640' },
    { color: '#a855f7', bg: 'linear-gradient(135deg,#a855f718,#6C63FF0A)', icon: '🎯', label: '탐방 · 체험',   border: '#a855f740' },
    { color: '#22c55e', bg: 'linear-gradient(135deg,#22c55e18,#43CFBB0A)', icon: '🌟', label: '마무리 · 여행', border: '#22c55e40' },
  ];

  // 날짜별 비용 합산
  const dayTotals = daySpots.map(spots => spots.reduce((s, x) => s + (x.cost || 0), 0));

  /* ═══════════════════════════════════════════════
     날짜별 일정 타임라인 HTML 생성
  ═══════════════════════════════════════════════ */
  let runningTotal = 0;
  const daysHTML = dayLabels.map((lbl, di) => {
    const spots    = daySpots[di] || [];
    const dayCost  = dayTotals[di];
    runningTotal  += dayCost;
    const pal      = DAY_PALETTE[di % DAY_PALETTE.length];
    const isFirst  = di === 0;
    const isLast   = di === totalDays - 1;
    const icon     = isFirst ? '🚀' : isLast ? '🏁' : pal.icon;
    // days 배열에 label이 있으면 사용, 없으면 기본값 (순환 인덱스로 참조)
    const daysArr = planData.days;
    const dayDataLabel = daysArr && daysArr.length > 0 ? (daysArr[di % daysArr.length] || {}).label : null;
    const label    = dayDataLabel || (isFirst ? '출발 · 탐방' : isLast ? '마지막 · 귀환' : pal.label);
    const color    = pal.color;

    // 예산 바
    const dayPct  = budget > 0 ? Math.min(100, Math.round((dayCost / budget) * 100)) : 0;
    const cumPct  = budget > 0 ? Math.min(100, Math.round((runningTotal / budget) * 100)) : 0;
    const overDay = budget > 0 && dayCost > budget * 0.55;

    // 스팟 타임라인 아이템 HTML
    const spotsHTML = spots.map((spot, si) => {
      const isAccom  = _isAccomSpot(spot);
      const isFill   = !!spot._fill;
      const isFree   = !spot.cost || spot.cost === 0;
      const isLast_s = si === spots.length - 1;
      const timeSlot = _getTimeSlot(spot.time);
      const globalIdx = planData.spots ? planData.spots.indexOf(spot) : -1;

      // 비용 표시
      const costStr = isFree
        ? `<span class="tl-cost tl-free">FREE</span>`
        : `<span class="tl-cost">₩${spot.cost.toLocaleString('ko-KR')}</span>`;

      // 이동수단 연결 (스팟 사이)
      const transport = transports[0] || '도보';
      const moveIcon  = {
        '자동차': '🚗', '대중교통': '🚌', '자전거': '🚲',
        '도보': '🚶', '렌터카': '🚙', '택시': '🚕',
      }[transport] || '🚶';

      const connectorHTML = !isLast_s && !isAccom ? `
        <div class="tl-connector">
          <div class="tl-conn-line" style="border-color:${color}30;"></div>
          <span class="tl-conn-move">${moveIcon} 이동</span>
        </div>` : '';

      // 숙박 스팟은 별도 스타일
      if (isAccom) {
        return `
          <div class="tl-accom-wrap">
            <div class="tl-accom" style="--day-color:${color}; border-color:${color}40; background:${color}0A;">
              <div class="tl-accom-left">
                <span class="tl-accom-icon">🛏️</span>
                <div class="tl-accom-info">
                  <p class="tl-accom-name">${spot.name}</p>
                  <p class="tl-accom-desc">${spot.desc || ''}</p>
                </div>
              </div>
              <span class="tl-accom-cost" style="color:${color};">₩${(spot.cost || 0).toLocaleString('ko-KR')}</span>
            </div>
          </div>`;
      }

      return `
        <div class="tl-item${isFill ? ' tl-fill' : ''}${isFree ? ' tl-item-free' : ''}">
          <!-- 시간선 -->
          <div class="tl-time-col">
            <div class="tl-time-dot" style="background:${isFree ? '#22c55e' : color}; box-shadow:0 0 0 3px ${isFree ? '#22c55e30' : color+'30'};"></div>
            ${!isLast_s ? `<div class="tl-time-line" style="background:linear-gradient(${color},${color}20);"></div>` : ''}
          </div>
          <!-- 시간 라벨 -->
          <div class="tl-time-label">
            <span class="tl-time">${spot.time || ''}</span>
            <span class="tl-slot-badge" style="color:${color}; background:${color}15;">${timeSlot}</span>
          </div>
          <!-- 스팟 카드 -->
          <div class="tl-card" style="--day-color:${color}; border-color:${color}25;">
            <div class="tl-card-top">
              <span class="tl-emoji">${spot.emoji}</span>
              <div class="tl-info">
                <p class="tl-name">
                  ${spot.name}
                  ${isFree ? '<span class="tl-badge tl-badge-free">FREE</span>' : ''}
                  ${isFill ? '<span class="tl-badge tl-badge-fill">추천</span>' : ''}
                </p>
                <p class="tl-desc">${spot.desc || ''}</p>
              </div>
              <div class="tl-right">
                ${costStr}
                ${globalIdx >= 0 ? `<button class="si-reroll" data-idx="${globalIdx}" title="이 장소 교체">🔄</button>` : ''}
              </div>
            </div>
            ${spot.vibe ? `<div class="tl-vibe">${spot.vibe}</div>` : ''}
          </div>
        </div>
        ${connectorHTML}`;
    }).join('');

    // 날짜 카드 HTML
    const actSpotCount = spots.filter(s => !_isAccomSpot(s)).length;
    return `
      <div class="day-route-card" id="day-card-${di}" style="--day-color:${color};">
        <!-- 날짜 헤더 -->
        <div class="drc-header" style="background:${pal.bg}; border-left:4px solid ${color};">
          <div class="drc-header-left">
            <div class="drc-day-badge" style="background:${color};">
              <span>${icon}</span>
              <span>Day ${lbl.dayNum}</span>
            </div>
            <div class="drc-title-wrap">
              <div class="drc-title-row">
                <span class="drc-ord">${lbl.ord}날</span>
                <span class="drc-label" style="color:${color};">${label}</span>
              </div>
              <div class="drc-meta-row">
                ${lbl.date ? `<span class="drc-date">📅 ${lbl.date}</span>` : ''}
                <span class="drc-act-count" style="color:${color};">📍 ${actSpotCount}개 일정</span>
              </div>
            </div>
          </div>
          <div class="drc-header-right">
            <div class="drc-cost" style="color:${color};">₩${dayCost.toLocaleString('ko-KR')}</div>
            ${budget > 0 ? `<div class="drc-day-pct" style="color:${overDay ? '#ef4444' : color};">${dayPct}%</div>` : ''}
          </div>
        </div>

        <!-- 날짜별 미니 예산 바 -->
        ${budget > 0 ? `
        <div class="drc-mini-budget">
          <div class="drc-mini-track">
            <div class="drc-mini-fill" style="width:${dayPct}%; background:${overDay ? 'linear-gradient(90deg,#f97316,#ef4444)' : `linear-gradient(90deg,${color},${color}88)`};"></div>
          </div>
          <span class="drc-mini-label" style="color:${color};">당일 ${dayPct}% 사용</span>
        </div>` : ''}

        <!-- 타임라인 본문 -->
        <div class="tl-body">
          ${spotsHTML}
        </div>
      </div>`;
  }).join('');

  /* ═══════════════════════════════════════════════
     예산 게이지 (세그먼트 바)
  ═══════════════════════════════════════════════ */
  const budgetPct   = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;
  const budgetColor = withinBudget
    ? (budgetPct < 70 ? '#22c55e' : budgetPct < 90 ? '#f59e0b' : '#f97316')
    : '#ef4444';

  let cumW = 0;
  const segmentsHTML = budget > 0 ? dayTotals.map((dc, di) => {
    const w = Math.min(100 - cumW, Math.round((dc / budget) * 100));
    const c = DAY_PALETTE[di % DAY_PALETTE.length].color;
    const seg = `<div class="budget-seg" style="width:${w}%; background:${c};" title="Day${di+1}: ₩${dc.toLocaleString('ko-KR')}"></div>`;
    cumW += w;
    return seg;
  }).join('') : '';

  const budgetBar = budget > 0 ? `
    <div class="budget-gauge-wrap smart-gauge">
      <div class="smart-gauge-header">
        <div class="smart-gauge-title">
          <span class="smart-gauge-icon">${withinBudget ? '✅' : '⚠️'}</span>
          <span>예산 분석</span>
        </div>
        <div class="smart-gauge-total" style="color:${budgetColor};">
          ${withinBudget
            ? `여유 <strong>₩${surplusAbs.toLocaleString('ko-KR')}</strong> 남음`
            : `초과 <strong>₩${surplusAbs.toLocaleString('ko-KR')}</strong>`}
        </div>
      </div>
      <div class="budget-seg-bar">${segmentsHTML}${cumW < 100 ? `<div class="budget-seg-remain" style="width:${100-cumW}%;"></div>` : ''}</div>
      <div class="smart-gauge-nums">
        <span class="sn-used" style="color:${budgetColor};">사용 ₩${total.toLocaleString('ko-KR')}</span>
        <span class="sn-pct" style="color:${budgetColor};">${budgetPct}%</span>
        <span class="sn-budget">예산 ₩${budget.toLocaleString('ko-KR')}</span>
      </div>
      <div class="smart-gauge-legend">
        ${dayLabels.map((lbl, di) => `
          <span class="sgl-item">
            <i style="background:${DAY_PALETTE[di % DAY_PALETTE.length].color};"></i>
            ${lbl.ord}날 ₩${dayTotals[di].toLocaleString('ko-KR')}
          </span>`).join('')}
        ${accomCost > 0 && accomInSpots === 0 ? `<span class="sgl-item sgl-accom"><i style="background:#eab308;"></i>숙박 ₩${accomCost.toLocaleString('ko-KR')}</span>` : ''}
      </div>
      ${planData._smartOptimized ? `
        <div class="smart-optimized-badge">
          ✨ 예산 최적화 플랜 — ${budget.toLocaleString('ko-KR')}원 내 최선의 일정으로 구성했습니다
        </div>` : ''}
    </div>` : '';

  /* ═══════════════════════════════════════════════
     비용 요약표
  ═══════════════════════════════════════════════ */
  const costRows = dayLabels.map((lbl, di) => {
    const dc    = dayTotals[di];
    const color = DAY_PALETTE[di % DAY_PALETTE.length].color;
    const pct   = budget > 0 ? Math.round((dc / budget) * 100) : 0;
    return `
      <div class="cost-row">
        <span><span class="cost-row-dot" style="background:${color};"></span>${lbl.ord}날 (Day ${lbl.dayNum})</span>
        <span>₩${dc.toLocaleString('ko-KR')}${budget > 0 ? ` <em class="cost-row-pct">(${pct}%)</em>` : ''}</span>
      </div>`;
  }).join('');

  /* ═══════════════════════════════════════════════
     날짜 탭 네비게이션
  ═══════════════════════════════════════════════ */
  const dayTabsHTML = totalDays > 1 ? `
    <div class="day-tabs-nav">
      ${dayLabels.map((lbl, di) => {
        const color = DAY_PALETTE[di % DAY_PALETTE.length].color;
        const icon  = di === 0 ? '🚀' : di === totalDays - 1 ? '🏁' : DAY_PALETTE[di].icon;
        return `
          <button class="day-tab-btn${di === 0 ? ' active' : ''}" data-day="${di}"
            style="--tab-color:${color}; ${di === 0 ? `border-bottom:3px solid ${color}; color:${color};` : ''}">
            ${icon} ${lbl.ord}날
            ${lbl.date ? `<span class="day-tab-date">${lbl.date}</span>` : ''}
          </button>`;
      }).join('')}
    </div>` : '';

  /* ═══════════════════════════════════════════════
     최종 HTML 조립
  ═══════════════════════════════════════════════ */
  return `
    <div class="result-plan">
      ${planData._isFallback ? `
        <div class="fallback-notice">
          📌 <strong>${planData.destination}</strong> 전용 데이터 준비 중 —
          대표 도시 <strong>${planData._fallbackCity}</strong> 기반으로 플랜을 생성했습니다.
        </div>` : ''}

      <!-- 플랜 헤더 -->
      <div class="plan-header" style="border-left: 4px solid ${tier.color};">
        <div class="plan-header-top">
          <p class="plan-title">${planData.tag}</p>
          <div class="plan-cost-badge" style="color:${tier.color};">
            ₩ ${total.toLocaleString('ko-KR')}
          </div>
        </div>
        <div class="plan-meta">
          <span class="meta-chip" style="background:${tier.colorBg}; border-color:${tier.colorBorder}; color:${tier.color};">${tier.label}</span>
          <span class="meta-chip">🌙 ${nights > 0 ? `${nights}박 ${totalDays}일` : '당일치기'}</span>
          <span class="meta-chip">🏨 ${planData.accommodation || tier.accommodation}</span>
          ${startDate ? `<span class="meta-chip">📅 ${fmtDateShort(startDate)}${nights > 0 ? ` ~ ${fmtDateShort(new Date(startDate.getTime() + nights * 86400000))}` : ''}</span>` : ''}
          ${companionBadge}${transportBadges}${themeBadges}
        </div>
      </div>

      <!-- 예산 스마트 게이지 -->
      ${budgetBar}

      <!-- 날짜 탭 네비게이션 -->
      ${dayTabsHTML}

      <!-- 날짜별 여행 동선 타임라인 -->
      <div class="days-route-container">
        ${daysHTML}
      </div>

      <!-- 비용 요약 -->
      <div class="cost-summary">
        <div class="cost-summary-title">🧾 비용 요약</div>
        ${costRows}
        ${accomCost > 0 && accomInSpots === 0 ? `
          <div class="cost-row cost-row-accom">
            <span><span class="cost-row-dot" style="background:#eab308;"></span>🏨 숙박비 (${nights}박)</span>
            <span>₩${accomCost.toLocaleString('ko-KR')}</span>
          </div>` : ''}
        <div class="cost-row cost-row-total" style="color:${tier.color};">
          <span>💰 예상 총 비용</span>
          <span>₩${total.toLocaleString('ko-KR')}</span>
        </div>
        ${budget > 0 ? `
          <div class="cost-row cost-row-surplus" style="color:${budgetColor};">
            <span>${withinBudget ? '💚 잔여 예산' : '🔴 초과 금액'}</span>
            <span>${withinBudget ? '+' : '-'}₩${surplusAbs.toLocaleString('ko-KR')}</span>
          </div>` : ''}
      </div>
    </div>
  `;
}

// 날짜 탭 클릭 이벤트 바인딩 (플랜 생성 후 호출)
function bindDayTabs() {
  const tabBtns = document.querySelectorAll('.day-tab-btn');
  const dayCrds = document.querySelectorAll('.day-route-card');
  if (!tabBtns.length) return;

  tabBtns.forEach((btn, bi) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderBottom = '';
        b.style.color = '';
      });
      const color = getComputedStyle(btn).getPropertyValue('--tab-color').trim() || '#6C63FF';
      btn.classList.add('active');
      btn.style.borderBottom = `3px solid ${color}`;
      btn.style.color = color;

      // 모바일에서는 해당 day-card로 스크롤
      const card = document.getElementById(`day-card-${bi}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* =============================================
   플랜 생성
   ============================================= */
function getSelectedChip(groupId) {
  // 목적지는 전체 dest-region-panel 내 선택된 칩 통합 검색
  if (groupId === 'destination-chips') {
    // 1) 현재 활성화된 region-block 내 선택된 칩 우선
    const regionPanel = document.getElementById('dest-region-panel');
    if (regionPanel) {
      const activeBlock = regionPanel.querySelector('.region-block.active');
      if (activeBlock) {
        const selected = activeBlock.querySelector('.chip.selected');
        if (selected) return selected.getAttribute('data-val');
      }
      // 2) 모든 region-block 에서 검색 (fallback)
      const selected = regionPanel.querySelector('.chip.selected');
      if (selected) return selected.getAttribute('data-val');
    }
    // 3) 기존 한국 그룹 fallback
    const destGroups = ['destination-chips', 'destination-chips-2', 'dest-custom-chips'];
    for (const id of destGroups) {
      const container = document.getElementById(id);
      if (!container) continue;
      const sel = container.querySelector('.chip.selected');
      if (sel) return sel.getAttribute('data-val');
    }
    return null;
  }
  // 동행: 기본 + 커스텀 그룹 통합 검색
  if (groupId === 'companion-chips') {
    const groups = ['companion-chips', 'companion-custom-chips'];
    for (const id of groups) {
      const container = document.getElementById(id);
      if (!container) continue;
      const selected = container.querySelector('.chip.selected');
      if (selected) return selected.getAttribute('data-val');
    }
    return null;
  }
  // 테마·이동수단: 복수선택 → 첫 번째 선택값 (유효성 검사용), 전체는 getSelectedChips() 사용
  if (groupId === 'theme-chips') {
    const groups = ['theme-chips', 'theme-custom-chips'];
    for (const id of groups) {
      const container = document.getElementById(id);
      if (!container) continue;
      const selected = container.querySelector('.chip.selected');
      if (selected) return selected.getAttribute('data-val');
    }
    return null;
  }
  if (groupId === 'transport-chips') {
    const container = document.getElementById('transport-chips');
    if (!container) return null;
    const selected = container.querySelector('.chip.selected');
    return selected ? selected.getAttribute('data-val') : null;
  }
  const container = document.getElementById(groupId);
  if (!container) return null;
  const selected = container.querySelector('.chip.selected');
  return selected ? selected.getAttribute('data-val') : null;
}

// 복수선택 전체 값 배열 반환
function getSelectedChips(groupId) {
  if (groupId === 'theme-chips') {
    const vals = [];
    ['theme-chips', 'theme-custom-chips'].forEach(id => {
      const c = document.getElementById(id);
      if (c) c.querySelectorAll('.chip.selected').forEach(ch => vals.push(ch.getAttribute('data-val')));
    });
    return vals;
  }
  if (groupId === 'transport-chips') {
    const vals = [];
    const c = document.getElementById('transport-chips');
    if (c) c.querySelectorAll('.chip.selected').forEach(ch => vals.push(ch.getAttribute('data-val')));
    return vals;
  }
  return [];
}

function generatePlan(isMystery = false) {
  const resultContent = document.getElementById('result-content');
  const resultTitle = document.getElementById('result-title');
  const resultBadge = document.getElementById('result-badge');
  const resultActions = document.getElementById('result-actions');

  const budget = parseInt(slider ? slider.value : 500000);
  const tier = getTier(budget);

  // 로딩 스켈레톤
  resultContent.innerHTML = `
    <div class="skeleton-plan">
      <div class="skel-header">
        <div class="skel-title-wrap">
          <div class="skeleton skel-line skel-line-title"></div>
          <div class="skeleton skel-line skel-line-sm"></div>
          <div class="skeleton skel-line skel-line-xs"></div>
        </div>
        <div class="skeleton skel-cost"></div>
      </div>
      <div class="skel-ai-label">
        <div class="skel-ai-dot"></div>
        <div class="skel-ai-dot"></div>
        <div class="skel-ai-dot"></div>
        <span>${tier.label} 등급 · ${tier.tripType} 코스 생성 중…</span>
      </div>
      <div class="skel-items">
        ${[0,1,2,3,4].map(() => `
          <div class="skel-item">
            <div class="skeleton skel-time"></div>
            <div class="skeleton skel-emoji"></div>
            <div class="skel-info">
              <div class="skeleton skel-line skel-name"></div>
              <div class="skeleton skel-line skel-desc"></div>
              <div class="skeleton skel-line skel-vibe"></div>
            </div>
            <div class="skeleton skel-btn"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  resultActions.style.display = 'none';

  setTimeout(() => {
    let planData;
    const selectedCountry = window._getSelectedCountry ? window._getSelectedCountry() : '한국';

    if (isMystery) {
      const tripObj = mysteryTrips[Math.floor(Math.random() * mysteryTrips.length)];
      planData = { ...tripObj[tier.key], destination: tripObj.destination };
      resultTitle.textContent = '🎲 미스터리 트립!';
      resultBadge.textContent = tier.grade + ' 등급';
      resultBadge.style.cssText = `background:${tier.colorBg}; color:${tier.color}; border:1px solid ${tier.colorBorder}; padding:4px 12px; border-radius:50px; font-size:0.72rem; font-weight:700;`;
    } else {
      const dest = getSelectedChip('destination-chips') || '제주도';
      // selectedCountry는 상단에서 이미 정의됨

      // 나라 국기 매핑
      const countryFlags = {
        '한국':'🇰🇷','일본':'🇯🇵','미국':'🇺🇸','프랑스':'🇫🇷','이탈리아':'🇮🇹',
        '스페인':'🇪🇸','태국':'🇹🇭','베트남':'🇻🇳','싱가포르':'🇸🇬','호주':'🇦🇺',
        '영국':'🇬🇧','튀르키예':'🇹🇷','스위스':'🇨🇭','그리스':'🇬🇷','포르투갈':'🇵🇹','캐나다':'🇨🇦'
      };
      const flag = countryFlags[selectedCountry] || '🌍';
      const isOverseas = selectedCountry !== '한국';

      // ✅ 데이터 우선순위:
      // 1) 해외 → window.overseasData[dest]
      // 2) 국내 → travelData[dest]
      // 3) 같은 국가 대표 도시 폴백
      // 4) 최후 폴백 → 국내 랜덤
      const FALLBACK_DESTS = ['제주도', '부산', '강릉', '경주', '전주', '여수', '춘천'];
      // 국가별 대표 도시 (데이터 없을 때 같은 나라 대표 도시로 대체)
      const countryRepCity = {
        '일본': '도쿄', '미국': '뉴욕', '프랑스': '파리', '이탈리아': '로마',
        '스페인': '바르셀로나', '태국': '방콕', '베트남': '호치민',
        '싱가포르': '싱가포르', '호주': '시드니', '영국': '런던',
        '튀르키예': '이스탄불', '스위스': '인터라켄', '그리스': '산토리니',
        '포르투갈': '리스본', '캐나다': '밴쿠버',
      };
      const overseas = window.overseasData || {};
      // 싱가포르 전체를 대표하는 키가 없으므로 도시 지구 → 싱가포르 국가 전체 플랜으로 매핑
      const sgDistricts = ['마리나베이','오차드','센토사','차이나타운','클락키'];
      const actualDest = (selectedCountry === '싱가포르' && sgDistricts.includes(dest))
        ? '싱가포르' : dest;
      const normalizedDest = actualDest;
      const repCity = countryRepCity[selectedCountry];
      const destData = overseas[normalizedDest]
        || (isOverseas && repCity && overseas[repCity] ? overseas[repCity] : null)
        || travelData[dest]
        || travelData[FALLBACK_DESTS[Math.floor(Math.random() * FALLBACK_DESTS.length)]];

      // 실제 사용 도시명 (대표 도시 폴백 시 원래 dest 이름 유지)
      const displayDest = dest;
      const isRepCityFallback = !overseas[normalizedDest] && !travelData[dest] && isOverseas && repCity && overseas[repCity];

      // tier.key 가 없으면 가장 가까운 등급으로 폴백
      const tierKey = destData[tier.key] ? tier.key
        : ['economy','standard','comfort','premium','luxury'].find(k => destData[k])
        || 'economy';

      const basePlan = destData[tierKey];
      // 대표 도시 폴백 시 태그에 원래 목적지 이름 사용
      const planTag = isRepCityFallback
        ? `${flag} ${displayDest} ${tier.tripType}`
        : (basePlan.tag || (isOverseas ? `${flag} ${displayDest} ${tier.tripType}` : `📍 ${displayDest} ${tier.tripType}`));
      planData = {
        ...basePlan,
        destination: displayDest,
        tag: planTag,
        accommodation: isRepCityFallback ? `${displayDest} ${basePlan.accommodation || tier.accommodation}` : basePlan.accommodation,
        _isFallback: isRepCityFallback || false,
        _fallbackCity: isRepCityFallback ? repCity : null,
      };
      resultTitle.textContent = isOverseas ? `${flag} 해외 여행 플랜` : '✈️ 맞춤 여행 플랜';
      resultBadge.textContent = tier.grade + ' 등급';
      resultBadge.style.cssText = `background:${tier.colorBg}; color:${tier.color}; border:1px solid ${tier.colorBorder}; padding:4px 12px; border-radius:50px; font-size:0.72rem; font-weight:700;`;
    }

    window._currentPlan = planData;
    window._currentTier = tier;

    // ── 스마트 플랜 최적화: 예산 + 요청 박수 기반으로 일정 재조정 ──────
    // 슬라이더 예산이 tier 기본 nights보다 적을 때 자동 최적화
    const requestedNights = getSelectedNights ? getSelectedNights() : tier.nights;
    const needsOptimize   = budget > 0 && (
      // 예산이 tier 기본 예산 min보다 작거나
      budget < tier.min ||
      // 요청 박수가 tier 기본 박수와 다르거나
      (requestedNights !== undefined && requestedNights !== tier.nights) ||
      // 원본 플랜 총비용이 예산을 초과하는 경우
      planData.spots.reduce((s,x) => s+(x.cost||0), 0) + (planData.accommodationCost||0) > budget
    );
    if (needsOptimize) {
      planData = buildSmartPlan(planData, budget, requestedNights !== undefined ? requestedNights : tier.nights);
      window._currentPlan = planData;
    }

    // 지도용 목적지·장소·등급 저장
    window._lastGeneratedDest    = planData.destination;
    window._lastGeneratedSpots   = planData.spots;
    window._lastGeneratedTier    = tier;
    window._lastGeneratedCountry = selectedCountry;

    resultContent.innerHTML = buildPlanHTML(planData, tier, isMystery);
    resultContent.style.opacity = '0';
    resultContent.style.transform = 'translateY(10px)';
    setTimeout(() => {
      resultContent.style.transition = 'all 0.4s ease';
      resultContent.style.opacity = '1';
      resultContent.style.transform = 'translateY(0)';
    }, 50);
    resultActions.style.display = 'flex';
    bindRerollButtons();
    bindDayTabs();

  }, 1600);
}

/* ---- Reroll 교체 데이터 (등급별) ---- */
const rerollPool = {
  economy: [
    { emoji: '☕', name: '동네 로컬 카페', desc: '5,000원 아메리카노, 조용한 분위기', vibe: '☕ 가성비 카페 · 🤫 조용한', cost: 5000 },
    { emoji: '🌿', name: '무료 공원 산책', desc: '지역 주민도 즐기는 힐링 공원', vibe: '🌿 힐링 · 🆓 무료', cost: 0 },
    { emoji: '🍜', name: '로컬 분식집', desc: '떡볶이·순대 세트 6,000원', vibe: '🍜 로컬 맛집 · 💰 가성비', cost: 6000 },
    { emoji: '📚', name: '공공 도서관 휴식', desc: '지역 공공 도서관에서 여유 시간', vibe: '📚 문화 · 🆓 무료', cost: 0 },
    { emoji: '🏛️', name: '무료 지역 박물관', desc: '지역 역사·문화 무료 박물관', vibe: '📚 역사 · 🆓 무료', cost: 0 },
  ],
  standard: [
    { emoji: '🍕', name: '로컬 피자 맛집', desc: '화덕 피자 1판 15,000원', vibe: '🍕 맛집 · 💰 가성비', cost: 15000 },
    { emoji: '☕', name: '감성 카페', desc: '인스타 감성 카페 아메리카노', vibe: '☕ 감성 카페 · 📸 포토스팟', cost: 8000 },
    { emoji: '🎡', name: '지역 유원지', desc: '입장권 포함 놀이 시설', vibe: '🎡 액티비티 · 👨‍👩‍👧 가족', cost: 12000 },
    { emoji: '🧘', name: '요가 클래스', desc: '1회 체험 클래스', vibe: '🧘 힐링 · 🌿 자연', cost: 15000 },
    { emoji: '🎨', name: '지역 갤러리', desc: '로컬 아티스트 무료 전시', vibe: '🎨 예술 · ✨ 힙한', cost: 0 },
  ],
  comfort: [
    { emoji: '🍷', name: '와인 바', desc: '글라스 와인 2잔 + 안주', vibe: '🍷 와인바 · ✨ 힙한', cost: 30000 },
    { emoji: '🧖', name: '스파 & 마사지', desc: '60분 전신 마사지', vibe: '🧖 힐링 · 🌿 자연', cost: 40000 },
    { emoji: '🏄', name: '수상 스포츠', desc: '서핑 또는 패들보드 체험', vibe: '🏄 액티비티 · 🌊 바다', cost: 35000 },
    { emoji: '🎭', name: '공연 관람', desc: '지역 소극장 공연 관람', vibe: '🎭 공연 · ✨ 문화', cost: 20000 },
    { emoji: '🍣', name: '오마카세 스시', desc: '당일 직송 신선 스시 오마카세', vibe: '🍱 오마카세 · 🌟 특별한', cost: 50000 },
  ],
  premium: [
    { emoji: '🚁', name: '헬기 투어', desc: '15분 헬기 플라이트 체험', vibe: '🚁 이색 체험 · 📸 포토스팟', cost: 80000 },
    { emoji: '🍾', name: '루프탑 샴페인 바', desc: '야경과 함께하는 샴페인', vibe: '🍾 샴페인 · 🌙 야경', cost: 60000 },
    { emoji: '🏌️', name: '골프 라운딩', desc: '전망 좋은 코스 9홀 라운딩', vibe: '🏌️ 골프 · 🌿 자연', cost: 80000 },
    { emoji: '🧖', name: '럭셔리 스파', desc: '호텔 내 프리미엄 스파 패키지', vibe: '🧖 프리미엄 스파 · 🌟 럭셔리', cost: 70000 },
    { emoji: '⛵', name: '요트 세일링', desc: '2시간 프라이빗 요트 투어', vibe: '⛵ 요트 · 🌊 오션뷰', cost: 90000 },
  ],
  luxury: [
    { emoji: '🚁', name: '프라이빗 헬기 전세', desc: '전용 헬기 1시간 프라이빗 투어', vibe: '🚁 VIP · 📸 절경', cost: 250000 },
    { emoji: '🌟', name: '미슐랭 가이드 레스토랑', desc: '예약 필수 미슐랭 3스타 풀코스', vibe: '🌟 미슐랭 · 🍷 파인다이닝', cost: 200000 },
    { emoji: '🎭', name: 'VIP 문화 공연', desc: '프라이빗 갈라 콘서트 VIP석', vibe: '🎭 VIP 공연 · 🌟 특별한', cost: 150000 },
    { emoji: '🏊', name: '프라이빗 풀빌라', desc: '독채 인피니티풀 빌라 업그레이드', vibe: '🏊 풀빌라 · 👑 프라이빗', cost: 300000 },
    { emoji: '🦞', name: '랍스터 & 캐비어 코스', desc: '랍스터·캐비어 특별 코스 디너', vibe: '🦞 캐비어 · 🌟 최고급', cost: 200000 },
  ],
};

function bindRerollButtons() {
  document.querySelectorAll('.si-reroll').forEach(btn => {
    btn.addEventListener('click', function () {
      const idx = parseInt(this.getAttribute('data-idx'));
      const item = document.querySelector(`.schedule-item[data-idx="${idx}"]`);
      if (!item) return;

      item.style.transition = 'all 0.3s ease';
      item.style.opacity = '0';
      item.style.transform = 'translateX(-10px)';

      setTimeout(() => {
        const tier = window._currentTier || TIERS[2];
        const pool = rerollPool[tier.key] || rerollPool.comfort;
        const replacement = pool[Math.floor(Math.random() * pool.length)];
        const time = item.querySelector('.si-time').textContent;

        item.innerHTML = `
          <span class="si-time">${time}</span>
          <span class="si-emoji">${replacement.emoji}</span>
          <div class="si-info">
            <p class="si-name">${replacement.name}</p>
            <p class="si-desc">${replacement.desc}</p>
            <span class="si-vibe">${replacement.vibe}</span>
          </div>
          <div class="si-right">
            <span class="si-cost">${replacement.cost === 0 ? '무료' : '₩' + replacement.cost.toLocaleString('ko-KR')}</span>
            <button class="si-reroll" data-idx="${idx}" title="이 장소 교체">🔄</button>
          </div>
        `;
        item.style.background = `${tier.colorBg}`;
        item.style.borderColor = tier.colorBorder;
        item.style.opacity = '0';
        item.style.transform = 'translateX(10px)';

        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
          setTimeout(() => {
            item.style.background = '';
            item.style.borderColor = '';
          }, 1200);
        }, 50);

        bindRerollButtons();
      }, 300);
    });
  });
}

/* =============================================
   ✅ 폼 유효성 검사 + 토스트 알림
   ============================================= */
function showValidationToast(message) {
  // 기존 토스트 제거
  const existing = document.getElementById('validation-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'validation-toast';
  toast.innerHTML = `
    <div class="vtost-inner">
      <span class="vtost-icon">⚠️</span>
      <span class="vtost-msg">${message}</span>
    </div>
  `;
  toast.style.cssText = `
    position:fixed; top:80px; left:50%; transform:translateX(-50%) translateY(-20px);
    z-index:99999; background:var(--bg-card); border:2px solid var(--primary);
    border-radius:50px; padding:12px 24px; box-shadow:0 8px 32px rgba(108,99,255,0.35);
    opacity:0; transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1); pointer-events:none;
    white-space:nowrap; max-width:90vw;
  `;
  toast.querySelector('.vtost-inner').style.cssText = `
    display:flex; align-items:center; gap:10px; font-size:0.9rem; font-weight:600;
    color:var(--text);
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

function shakeField(labelText) {
  // form-group 레이블에서 찾아서 shake
  document.querySelectorAll('.form-group label').forEach(lbl => {
    if (lbl.textContent.trim().startsWith(labelText.trim().charAt(0))) {
      const group = lbl.closest('.form-group');
      if (group) {
        group.classList.add('shake-error');
        setTimeout(() => group.classList.remove('shake-error'), 700);
      }
    }
  });
}

function validatePlanForm() {
  const dest = getSelectedChip('destination-chips');
  const companion = getSelectedChip('companion-chips');
  const theme = getSelectedChip('theme-chips');
  const transport = getSelectedChip('transport-chips');
  const hasDate = calState && (calState.startDate || calState.endDate);

  if (!dest) {
    showValidationToast('📍 목적지를 선택해주세요!');
    // 해당 섹션으로 스크롤 (나라 선택 패널 위치)
    const el = document.getElementById('dest-region-panel') || document.getElementById('destination-chips');
    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
    // 지역 패널 shake
    const panel = document.getElementById('dest-region-panel');
    if (panel) { panel.classList.add('shake-error'); setTimeout(() => panel.classList.remove('shake-error'), 700); }
    return false;
  }
  if (!companion) {
    showValidationToast('👥 동행을 선택해주세요!');
    const el = document.getElementById('companion-chips');
    if (el) { el.classList.add('shake-error'); el.scrollIntoView({ behavior:'smooth', block:'center' }); setTimeout(() => el.classList.remove('shake-error'), 700); }
    return false;
  }
  if (!theme) {
    showValidationToast('🎨 테마를 하나 이상 선택해주세요!');
    const el = document.getElementById('theme-chips');
    if (el) { el.classList.add('shake-error'); el.scrollIntoView({ behavior:'smooth', block:'center' }); setTimeout(() => el.classList.remove('shake-error'), 700); }
    return false;
  }
  if (!transport) {
    showValidationToast('🚗 이동 수단을 선택해주세요!');
    const el = document.getElementById('transport-chips');
    if (el) { el.classList.add('shake-error'); el.scrollIntoView({ behavior:'smooth', block:'center' }); setTimeout(() => el.classList.remove('shake-error'), 700); }
    return false;
  }
  if (!hasDate || !calState.startDate) {
    showValidationToast('📅 여행 날짜를 선택해주세요!');
    const el = document.getElementById('date-start-field');
    if (el) { el.classList.add('shake-error'); el.scrollIntoView({ behavior:'smooth', block:'center' }); setTimeout(() => el.classList.remove('shake-error'), 700); }
    return false;
  }
  return true;
}

function validateMysteryForm() {
  const budget = parseInt(document.getElementById('budget-slider')?.value || '500000');
  if (!budget || budget < 200000) {
    showValidationToast('💰 예산을 설정해주세요! (최소 20만원)');
    const el = document.getElementById('budget-slider');
    if (el) { el.closest('.form-group').classList.add('shake-error'); setTimeout(() => el.closest('.form-group').classList.remove('shake-error'), 700); }
    return false;
  }
  return true;
}

/* ---- GENERATE / MYSTERY BUTTONS ---- */
const generateBtn = document.getElementById('generate-btn');
if (generateBtn) generateBtn.addEventListener('click', () => {
  if (!validatePlanForm()) return;
  saveDateBeforeGenerate();
  generatePlan(false);
});

const mysteryBtn = document.getElementById('mystery-btn');
if (mysteryBtn) mysteryBtn.addEventListener('click', () => {
  if (!validateMysteryForm()) return;
  saveDateBeforeGenerate();
  // 미스터리는 칩 선택 초기화 후 랜덤 생성
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  generatePlan(true);
});

/* ---- REROLL ALL ---- */
const rerollBtn = document.getElementById('reroll-btn');
if (rerollBtn) {
  rerollBtn.addEventListener('click', () => {
    const items = document.querySelectorAll('.schedule-item');
    if (items.length === 0) return;
    const indices = Array.from({ length: items.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5).slice(0, 2);
    indices.forEach(idx => {
      const btn = document.querySelector(`.si-reroll[data-idx="${idx}"]`);
      if (btn) btn.click();
    });
  });
}

/* ---- CONFIRM BUTTON ---- */
const confirmBtn = document.getElementById('confirm-btn');
const confirmModal = document.getElementById('confirm-modal');
const modalClose = document.getElementById('modal-close');
if (confirmBtn && confirmModal) confirmBtn.addEventListener('click', () => { confirmModal.classList.add('active'); spawnConfetti(); });
if (modalClose && confirmModal) modalClose.addEventListener('click', () => confirmModal.classList.remove('active'));
confirmModal && confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.classList.remove('active'); });

/* ---- CONFETTI ---- */
function spawnConfetti() {
  const colors = ['#6C63FF', '#FF6584', '#43CFBB', '#FF8C42', '#FFD166'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;z-index:99999;width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'2px'};top:-20px;left:${Math.random()*100}vw;pointer-events:none;`;
    document.body.appendChild(el);
    el.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${(Math.random()-.5)*200}px,100vh) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:Math.random()*2000+1500,easing:'cubic-bezier(0.25,0.46,0.45,0.94)',delay:Math.random()*500}).onfinish=()=>el.remove();
  }
}

/* ---- TESTIMONIALS ---- */
document.querySelectorAll('.testi-dots .dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

/* ---- PHONE FILTER CHIPS ---- */
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ---- PARALLAX ---- */
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * 20;
  const b1 = document.querySelector('.blob-1');
  const b2 = document.querySelector('.blob-2');
  const b3 = document.querySelector('.blob-3');
  if (b1) b1.style.transform = `translate(${x}px,${y}px)`;
  if (b2) b2.style.transform = `translate(${-x*.7}px,${-y*.7}px)`;
  if (b3) b3.style.transform = `translate(${x*.5}px,${y*.5}px)`;
});

/* ---- FLOAT CARD HOVER ---- */
document.querySelectorAll('.float-card').forEach(card => {
  card.addEventListener('mouseenter', () => { card.style.boxShadow='0 20px 40px rgba(108,99,255,0.3)'; card.style.borderColor='rgba(108,99,255,0.4)'; });
  card.addEventListener('mouseleave', () => { card.style.boxShadow=''; card.style.borderColor=''; });
});

/* ---- ACTIVE NAV ---- */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - 200) current = sec.getAttribute('id'); });
  navLinkEls.forEach(link => {
    const isActive = link.getAttribute('href') === `#${current}`;
    const isDark = document.documentElement.classList.contains('dark-mode');
    link.style.color = isActive ? 'var(--primary)' : '';
    link.style.fontWeight = isActive ? '700' : '';
  });
});

/* ---- SPIN ANIMATION ---- */
const style = document.createElement('style');
style.textContent = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;
document.head.appendChild(style);

/* ---- HERO ENTRANCE ---- */
['hero-content', 'hero-visual'].forEach((id, i) => {
  const el = document.querySelector('.' + id);
  if (!el) return;
  el.style.opacity = '0'; el.style.transform = 'translateY(20px)';
  setTimeout(() => { el.style.transition = 'all 0.9s cubic-bezier(0.25,0.46,0.45,0.94)'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 200 + i * 300);
});
/* =============================================
   📅 달력 (DATE PICKER)
   ============================================= */
const calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  startDate: null,
  endDate: null,
  selecting: 'start', // 'start' | 'end'
};

initCalendar();

function initCalendar() {
  const startField = document.getElementById('date-start-field');
  const endField   = document.getElementById('date-end-field');
  const popup      = document.getElementById('calendar-popup');
  if (!startField || !popup) return;

  // 출발일 클릭
  startField.addEventListener('click', (e) => {
    e.stopPropagation();
    calState.selecting = 'start';
    startField.classList.add('active');
    endField.classList.remove('active');
    popup.classList.toggle('open');
    renderCalendar();
  });

  // 귀환일 클릭
  endField.addEventListener('click', (e) => {
    e.stopPropagation();
    calState.selecting = 'end';
    endField.classList.add('active');
    startField.classList.remove('active');
    if (!popup.classList.contains('open')) popup.classList.add('open');
    renderCalendar();
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && e.target !== startField && e.target !== endField) {
      popup.classList.remove('open');
      startField.classList.remove('active');
      endField.classList.remove('active');
    }
  });

  // 이전/다음 달
  document.getElementById('cal-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    calState.month--;
    if (calState.month < 0) { calState.month = 11; calState.year--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', (e) => {
    e.stopPropagation();
    calState.month++;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    renderCalendar();
  });

  // 초기화
  document.getElementById('cal-reset').addEventListener('click', (e) => {
    e.stopPropagation();
    calState.startDate = null;
    calState.endDate   = null;
    calState.selecting = 'start';
    updateDateFields();
    renderCalendar();
  });

  renderCalendar();
}

function renderCalendar() {
  const grid  = document.getElementById('cal-grid');
  const label = document.getElementById('cal-month-label');
  const hint  = document.getElementById('cal-hint');
  if (!grid) return;

  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  label.textContent = `${calState.year}년 ${months[calState.month]}`;

  hint.textContent = calState.selecting === 'start'
    ? '✈️ 출발일을 선택하세요'
    : '🏠 귀환일 선택 (출발일과 같으면 당일치기)';

  const firstDay = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  grid.innerHTML = '';

  // 빈칸
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calState.year, calState.month, d);
    date.setHours(0,0,0,0);
    const dayOfWeek = date.getDay();

    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.textContent = d;

    // 오늘
    if (date.getTime() === today.getTime()) cell.classList.add('cal-today');
    // 과거
    if (date < today) { cell.classList.add('cal-disabled'); grid.appendChild(cell); continue; }
    // 일/토
    if (dayOfWeek === 0) cell.classList.add('cal-sunday');
    if (dayOfWeek === 6) cell.classList.add('cal-saturday');

    // 선택 상태
    const isStart = calState.startDate && date.getTime() === calState.startDate.getTime();
    const isEnd   = calState.endDate   && date.getTime() === calState.endDate.getTime();
    const inRange = calState.startDate && calState.endDate &&
                    date > calState.startDate && date < calState.endDate;

    if (isStart) cell.classList.add('cal-start');
    if (isEnd)   cell.classList.add('cal-end');
    if (isStart && isEnd) { cell.classList.add('cal-start', 'cal-end'); }
    if (inRange) cell.classList.add('cal-in-range');

    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      onDayClick(date);
    });

    grid.appendChild(cell);
  }
}

function onDayClick(date) {
  if (calState.selecting === 'start') {
    calState.startDate = date;
    calState.endDate   = null;
    calState.selecting = 'end';
    document.getElementById('date-start-field').classList.remove('active');
    document.getElementById('date-end-field').classList.add('active');
  } else {
    if (calState.startDate && date < calState.startDate) {
      // 귀환일이 출발일보다 앞이면 출발일로 재설정
      calState.startDate = date;
      calState.endDate   = null;
      calState.selecting = 'end';
    } else {
      // 같은 날짜 선택 허용 (당일치기)
      calState.endDate   = date;
      calState.selecting = 'start';
      // 선택 완료 → 팝업 닫기
      setTimeout(() => {
        document.getElementById('calendar-popup').classList.remove('open');
        document.getElementById('date-start-field').classList.remove('active');
        document.getElementById('date-end-field').classList.remove('active');
      }, 300);
    }
  }
  updateDateFields();
  renderCalendar();
}

function updateDateFields() {
  const startDisp = document.getElementById('date-start-display');
  const endDisp   = document.getElementById('date-end-display');
  const nightsBadge = document.getElementById('date-nights-badge');
  const nightsText  = document.getElementById('date-nights-text');

  const fmt = (d) => {
    if (!d) return null;
    const days = ['일','월','화','수','목','금','토'];
    return `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]})`;
  };

  if (calState.startDate) {
    startDisp.textContent = fmt(calState.startDate);
    startDisp.classList.remove('placeholder');
  } else {
    startDisp.textContent = '날짜 선택';
    startDisp.classList.add('placeholder');
  }

  if (calState.endDate) {
    endDisp.textContent = fmt(calState.endDate);
    endDisp.classList.remove('placeholder');
  } else {
    endDisp.textContent = '날짜 선택';
    endDisp.classList.add('placeholder');
  }

  // 박수 계산
  if (calState.startDate && calState.endDate) {
    const nights = Math.round((calState.endDate - calState.startDate) / (1000*60*60*24));
    const days   = nights + 1;
    nightsText.textContent = nights === 0 ? '당일치기' : `${nights}박 ${days}일`;
    nightsBadge.style.display = 'inline-flex';
    // 예산 인디케이터 업데이트
    updateBudgetTierIndicator();
  } else {
    nightsBadge.style.display = 'none';
  }
}

function getSelectedNights() {
  if (!calState.startDate || !calState.endDate) return null;
  return Math.round((calState.endDate - calState.startDate) / (1000*60*60*24));
}

/* =============================================
   🗺️ 지도 좌표 데이터
   ============================================= */

// 목적지별 좌표 + 장소 좌표
const destCoords = {
  '제주도': { lat: 33.3617, lng: 126.5292, zoom: 10 },
  '부산':   { lat: 35.1796, lng: 129.0756, zoom: 12 },
  '강릉':   { lat: 37.7519, lng: 128.8761, zoom: 12 },
  '경주':   { lat: 35.8562, lng: 129.2247, zoom: 12 },
  '전주':   { lat: 35.8242, lng: 127.1480, zoom: 13 },
  '통영':   { lat: 34.8544, lng: 128.4330, zoom: 13 },
  '속초':   { lat: 38.2070, lng: 128.5919, zoom: 13 },
  '남해':   { lat: 34.8374, lng: 127.8926, zoom: 12 },
  '서울':   { lat: 37.5665, lng: 126.9780, zoom: 12 },
  '인천':   { lat: 37.4563, lng: 126.7052, zoom: 11 },
  '대구':   { lat: 35.8714, lng: 128.6014, zoom: 12 },
  '대전':   { lat: 36.3504, lng: 127.3845, zoom: 12 },
  '광주':   { lat: 35.1595, lng: 126.8526, zoom: 12 },
  '울산':   { lat: 35.5384, lng: 129.3114, zoom: 12 },
  '여수':   { lat: 34.7604, lng: 127.6622, zoom: 12 },
  '수원':   { lat: 37.2636, lng: 127.0286, zoom: 13 },
  '춘천':   { lat: 37.8748, lng: 127.7342, zoom: 12 },
  '포항':   { lat: 36.0190, lng: 129.3435, zoom: 12 },
  '가평':   { lat: 37.8315, lng: 127.5095, zoom: 12 },
  '담양':   { lat: 35.3217, lng: 126.9880, zoom: 13 },
  '거제':   { lat: 34.8804, lng: 128.6214, zoom: 12 },
  '평창':   { lat: 37.3709, lng: 128.3904, zoom: 12 },
  '강화도': { lat: 37.7472, lng: 126.4877, zoom: 12 },

  // ===== 해외 도시 =====
  // 일본
  '도쿄':       { lat: 35.6762, lng: 139.6503, zoom: 12 },
  '오사카':     { lat: 34.6937, lng: 135.5023, zoom: 13 },
  '교토':       { lat: 35.0116, lng: 135.7681, zoom: 13 },
  '후쿠오카':   { lat: 33.5904, lng: 130.4017, zoom: 13 },
  '삿포로':     { lat: 43.0642, lng: 141.3469, zoom: 12 },
  '오키나와':   { lat: 26.2124, lng: 127.6809, zoom: 12 },
  '나고야':     { lat: 35.1815, lng: 136.9066, zoom: 13 },
  '나라':       { lat: 34.6851, lng: 135.8050, zoom: 14 },
  // 미국
  '뉴욕':       { lat: 40.7128, lng: -74.0060, zoom: 12 },
  '하와이':     { lat: 21.3069, lng: -157.8583, zoom: 12 },
  '로스앤젤레스':{ lat: 34.0522, lng: -118.2437, zoom: 11 },
  '샌프란시스코':{ lat: 37.7749, lng: -122.4194, zoom: 13 },
  '라스베이거스':{ lat: 36.1699, lng: -115.1398, zoom: 13 },
  '시카고':     { lat: 41.8781, lng: -87.6298, zoom: 12 },
  '마이애미':   { lat: 25.7617, lng: -80.1918, zoom: 12 },
  '시애틀':     { lat: 47.6062, lng: -122.3321, zoom: 13 },
  // 프랑스
  '파리':       { lat: 48.8566, lng: 2.3522, zoom: 13 },
  '니스':       { lat: 43.7102, lng: 7.2620, zoom: 14 },
  '리옹':       { lat: 45.7640, lng: 4.8357, zoom: 13 },
  '마르세유':   { lat: 43.2965, lng: 5.3698, zoom: 13 },
  '보르도':     { lat: 44.8378, lng: -0.5792, zoom: 13 },
  '몽생미셸':   { lat: 48.6361, lng: -1.5115, zoom: 15 },
  // 이탈리아
  '로마':       { lat: 41.9028, lng: 12.4964, zoom: 13 },
  '피렌체':     { lat: 43.7696, lng: 11.2558, zoom: 14 },
  '베네치아':   { lat: 45.4408, lng: 12.3155, zoom: 14 },
  '밀라노':     { lat: 45.4642, lng: 9.1900, zoom: 13 },
  '나폴리':     { lat: 40.8518, lng: 14.2681, zoom: 13 },
  '아말피':     { lat: 40.6340, lng: 14.6027, zoom: 15 },
  '시칠리아':   { lat: 37.5990, lng: 14.0154, zoom: 10 },
  // 스페인
  '바르셀로나': { lat: 41.3851, lng: 2.1734, zoom: 13 },
  '마드리드':   { lat: 40.4168, lng: -3.7038, zoom: 13 },
  '세비야':     { lat: 37.3891, lng: -5.9845, zoom: 13 },
  '그라나다':   { lat: 37.1773, lng: -3.5986, zoom: 14 },
  '발렌시아':   { lat: 39.4699, lng: -0.3763, zoom: 13 },
  '이비자':     { lat: 38.9067, lng: 1.4206, zoom: 13 },
  // 태국
  '방콕':       { lat: 13.7563, lng: 100.5018, zoom: 12 },
  '치앙마이':   { lat: 18.7883, lng: 98.9853, zoom: 13 },
  '푸켓':       { lat: 7.8804, lng: 98.3923, zoom: 12 },
  '코사무이':   { lat: 9.5120, lng: 100.0136, zoom: 13 },
  '파타야':     { lat: 12.9236, lng: 100.8824, zoom: 13 },
  '끄라비':     { lat: 8.0863, lng: 98.9063, zoom: 13 },
  // 베트남
  '하노이':     { lat: 21.0285, lng: 105.8542, zoom: 13 },
  '호치민':     { lat: 10.8231, lng: 106.6297, zoom: 13 },
  '다낭':       { lat: 16.0544, lng: 108.2022, zoom: 13 },
  '호이안':     { lat: 15.8800, lng: 108.3380, zoom: 15 },
  '나트랑':     { lat: 12.2388, lng: 109.1967, zoom: 13 },
  '달랏':       { lat: 11.9465, lng: 108.4419, zoom: 14 },
  '푸꾸옥':     { lat: 10.2899, lng: 103.9840, zoom: 13 },
  // 싱가포르
  '싱가포르':   { lat: 1.3521, lng: 103.8198, zoom: 13 },
  '마리나베이': { lat: 1.2816, lng: 103.8636, zoom: 15 },
  '오차드':     { lat: 1.3048, lng: 103.8318, zoom: 15 },
  '센토사':     { lat: 1.2494, lng: 103.8303, zoom: 14 },
  '차이나타운': { lat: 1.2838, lng: 103.8443, zoom: 15 },
  '클락키':     { lat: 1.2906, lng: 103.8465, zoom: 15 },
  // 호주
  '시드니':     { lat: -33.8688, lng: 151.2093, zoom: 12 },
  '멜버른':     { lat: -37.8136, lng: 144.9631, zoom: 13 },
  '브리즈번':   { lat: -27.4698, lng: 153.0251, zoom: 13 },
  '골드코스트': { lat: -28.0167, lng: 153.4000, zoom: 13 },
  '케언즈':     { lat: -16.9186, lng: 145.7781, zoom: 13 },
  '퍼스':       { lat: -31.9505, lng: 115.8605, zoom: 12 },
  // 영국
  '런던':       { lat: 51.5074, lng: -0.1278, zoom: 13 },
  '에든버러':   { lat: 55.9533, lng: -3.1883, zoom: 14 },
  '맨체스터':   { lat: 53.4808, lng: -2.2426, zoom: 13 },
  '옥스퍼드':   { lat: 51.7520, lng: -1.2577, zoom: 14 },
  '바스':       { lat: 51.3781, lng: -2.3597, zoom: 14 },
  // 튀르키예
  '이스탄불':   { lat: 41.0082, lng: 28.9784, zoom: 13 },
  '카파도키아': { lat: 38.6431, lng: 34.8289, zoom: 12 },
  '안탈리아':   { lat: 36.8969, lng: 30.7133, zoom: 13 },
  '에페소스':   { lat: 37.9398, lng: 27.3410, zoom: 14 },
  '파묵칼레':   { lat: 37.9137, lng: 29.1214, zoom: 14 },
  // 스위스
  '취리히':     { lat: 47.3769, lng: 8.5417, zoom: 14 },
  '인터라켄':   { lat: 46.6863, lng: 7.8632, zoom: 14 },
  '제네바':     { lat: 46.2044, lng: 6.1432, zoom: 14 },
  '루체른':     { lat: 47.0502, lng: 8.3093, zoom: 15 },
  '체르마트':   { lat: 46.0207, lng: 7.7491, zoom: 15 },
  // 그리스
  '산토리니':   { lat: 36.3932, lng: 25.4615, zoom: 14 },
  '아테네':     { lat: 37.9838, lng: 23.7275, zoom: 13 },
  '미코노스':   { lat: 37.4415, lng: 25.3283, zoom: 14 },
  '크레타':     { lat: 35.2401, lng: 24.8093, zoom: 11 },
  '로도스':     { lat: 36.4341, lng: 28.2176, zoom: 13 },
  // 포르투갈
  '리스본':     { lat: 38.7223, lng: -9.1393, zoom: 13 },
  '포르투':     { lat: 41.1579, lng: -8.6291, zoom: 14 },
  '신트라':     { lat: 38.7977, lng: -9.3878, zoom: 14 },
  '알가르베':   { lat: 37.0179, lng: -7.9307, zoom: 11 },
  // 캐나다
  '밴쿠버':     { lat: 49.2827, lng: -123.1207, zoom: 13 },
  '토론토':     { lat: 43.6532, lng: -79.3832, zoom: 12 },
  '퀘벡시티':   { lat: 46.8139, lng: -71.2082, zoom: 14 },
  '밴프':       { lat: 51.1784, lng: -115.5708, zoom: 14 },
  '몬트리올':   { lat: 45.5017, lng: -73.5673, zoom: 13 },
};

// 장소별 좌표 데이터
const spotCoords = {
  // 제주도
  '협재 해수욕장':        { lat: 33.3944, lng: 126.2392 },
  '제주 흑돼지 거리':     { lat: 33.4890, lng: 126.4983 },
  '카멜리아 힐':          { lat: 33.2989, lng: 126.3197 },
  '성산 일출봉':          { lat: 33.4587, lng: 126.9425 },
  '제주 씨뷰 리조트':     { lat: 33.5103, lng: 126.5221 },
  '제주 국수 골목':       { lat: 33.4890, lng: 126.4910 },
  '감귤 농원 체험':       { lat: 33.3617, lng: 126.5100 },
  '동문시장 야시장':      { lat: 33.5131, lng: 126.5219 },
  '제주 게스트하우스':    { lat: 33.4995, lng: 126.5312 },
  '제주 비즈니스 호텔':   { lat: 33.5003, lng: 126.5287 },
  '제주 신라 호텔':       { lat: 33.2478, lng: 126.4123 },
  // 부산
  '해운대 블루라인파크':  { lat: 35.1587, lng: 129.1603 },
  '광안리 횟집거리':      { lat: 35.1533, lng: 129.1186 },
  '감천문화마을':         { lat: 35.0979, lng: 129.0100 },
  '광안대교 뷰 카페':     { lat: 35.1527, lng: 129.1197 },
  '해운대 마린시티 호텔': { lat: 35.1631, lng: 129.1600 },
  '해운대 해수욕장':      { lat: 35.1587, lng: 129.1603 },
  '부산 밀면 골목':       { lat: 35.1798, lng: 129.0750 },
  '자갈치 시장 회':       { lat: 35.0979, lng: 129.0302 },
  // 강릉
  '강릉 커피거리':        { lat: 37.7712, lng: 128.9000 },
  '강릉 핸드드립 카페':   { lat: 37.7712, lng: 128.9010 },
  '경포해변':             { lat: 37.8033, lng: 128.9001 },
  '강릉 중앙시장':        { lat: 37.7519, lng: 128.8761 },
  '오죽헌':               { lat: 37.7751, lng: 128.8758 },
  '씨마크 호텔':          { lat: 37.8030, lng: 128.9140 },
  // 경주
  '불국사':               { lat: 35.7895, lng: 129.3317 },
  '황리단길 맛집':        { lat: 35.8368, lng: 129.2218 },
  '남산 탐방로':          { lat: 35.8104, lng: 129.2142 },
  '첨성대 야경':          { lat: 35.8368, lng: 129.2188 },
  '경주 힐튼 호텔':       { lat: 35.8390, lng: 129.1980 },
  '경기전':               { lat: 35.8190, lng: 129.2140 },
  // 전주
  '전주 한옥마을':        { lat: 35.8190, lng: 127.1530 },
  '전주 비빔밥 골목':     { lat: 35.8183, lng: 127.1530 },
  '경기전':               { lat: 35.8190, lng: 127.1520 },
  '남부시장 야시장':      { lat: 35.8096, lng: 127.1470 },
  '전주 한옥 게스트하우스': { lat: 35.8190, lng: 127.1540 },
  // 서울
  '경복궁':               { lat: 37.5796, lng: 126.9770 },
  '북촌 한옥마을':        { lat: 37.5824, lng: 126.9835 },
  '인사동 거리':          { lat: 37.5741, lng: 126.9854 },
  '홍대 클럽거리':        { lat: 37.5563, lng: 126.9219 },
  '명동 쇼핑':            { lat: 37.5634, lng: 126.9849 },
  '한강 공원':            { lat: 37.5283, lng: 126.9316 },
  '남산 서울타워':        { lat: 37.5511, lng: 126.9882 },
  '광장시장':             { lat: 37.5699, lng: 126.9994 },
  '익선동 한옥거리':      { lat: 37.5748, lng: 126.9997 },
  '동대문 DDP':           { lat: 37.5665, lng: 127.0094 },
  '강남 가로수길':        { lat: 37.5204, lng: 127.0230 },
  '성수동 카페거리':      { lat: 37.5447, lng: 127.0557 },
  '이태원 경리단길':      { lat: 37.5353, lng: 126.9944 },
  '삼청동 골목':          { lat: 37.5809, lng: 126.9799 },
  '서울 롯데호텔':        { lat: 37.5641, lng: 126.9815 },
  '서울 그랜드 하얏트':   { lat: 37.5350, lng: 126.9985 },
  // 부산 (추가)
  '용두산 공원':          { lat: 35.0994, lng: 129.0325 },
  '해동 용궁사':          { lat: 35.1880, lng: 129.2232 },
  '부산 타워':            { lat: 35.0994, lng: 129.0325 },
  '송정 해수욕장':        { lat: 35.1794, lng: 129.2025 },
  // 대구
  '수성못':               { lat: 35.8510, lng: 128.6275 },
  '동성로 쇼핑가':        { lat: 35.8697, lng: 128.5960 },
  '서문시장 야시장':      { lat: 35.8679, lng: 128.5812 },
  '팔공산 동화사':        { lat: 35.9680, lng: 128.6836 },
  '근대골목 투어':        { lat: 35.8693, lng: 128.5956 },
  '대구 국제호텔':        { lat: 35.8714, lng: 128.6014 },
  // 대전
  '엑스포 과학공원':      { lat: 36.3747, lng: 127.3878 },
  '성심당 본점':          { lat: 36.3291, lng: 127.4270 },
  '유성 온천':            { lat: 36.3636, lng: 127.3423 },
  '대전 보문산':          { lat: 36.3175, lng: 127.4187 },
  '대전 ICC 호텔':        { lat: 36.3745, lng: 127.3871 },
  // 광주
  '국립 5·18 민주묘지':  { lat: 35.1960, lng: 126.8527 },
  '양동시장 맛집':        { lat: 35.1508, lng: 126.9042 },
  '무등산 탐방':          { lat: 35.1348, lng: 126.9876 },
  '충장로 쇼핑':          { lat: 35.1502, lng: 126.9168 },
  '라마다 광주 호텔':     { lat: 35.1595, lng: 126.8526 },
  // 울산
  '간절곶 일출':          { lat: 35.3615, lng: 129.3761 },
  '울산 대공원':          { lat: 35.5501, lng: 129.2891 },
  '장생포 고래문화마을':  { lat: 35.4974, lng: 129.3857 },
  '십리대밭길':           { lat: 35.5384, lng: 129.3300 },
  '롯데 울산 호텔':       { lat: 35.5384, lng: 129.3114 },
  // 인천
  '인천 차이나타운':      { lat: 37.4748, lng: 126.6173 },
  '인천 개항장 거리':     { lat: 37.4738, lng: 126.6195 },
  '소래포구 어시장':      { lat: 37.4293, lng: 126.7382 },
  '강화도 고려궁지':      { lat: 37.7431, lng: 126.4878 },
  '영종도 을왕리 해수욕장': { lat: 37.4897, lng: 126.3861 },
  // 여수
  '여수 밤바다 이순신광장': { lat: 34.7392, lng: 127.7412 },
  '오동도':               { lat: 34.7337, lng: 127.7627 },
  '향일암':               { lat: 34.6566, lng: 127.7885 },
  '여수 케이블카':        { lat: 34.7386, lng: 127.7418 },
  '돌산도 갓김치 식당':   { lat: 34.7057, lng: 127.7480 },
  // 포항
  '호미곶 일출':          { lat: 36.0752, lng: 129.5664 },
  '구룡포 과메기 골목':   { lat: 35.9898, lng: 129.5578 },
  '죽도시장 회센터':      { lat: 36.0190, lng: 129.3450 },
  '영일대 해수욕장':      { lat: 36.0544, lng: 129.3794 },
  // 춘천
  '남이섬':               { lat: 37.7919, lng: 127.5247 },
  '소양강 댐':            { lat: 37.9096, lng: 127.7293 },
  '닭갈비 골목':          { lat: 37.8748, lng: 127.7335 },
  '춘천 막국수 박물관':   { lat: 37.8520, lng: 127.7358 },
  '레고랜드 코리아':      { lat: 37.8694, lng: 127.6945 },
  // 수원
  '수원 화성':            { lat: 37.2862, lng: 127.0139 },
  '행궁동 카페거리':      { lat: 37.2816, lng: 127.0136 },
  '통닭거리':             { lat: 37.2815, lng: 127.0161 },
  '수원 갈비거리':        { lat: 37.2688, lng: 127.0021 },
  // 속초
  '속초 닭강정 골목':     { lat: 38.2071, lng: 128.5930 },
  '속초 해수욕장':        { lat: 38.1946, lng: 128.5940 },
  '아바이마을 오징어순대':{ lat: 38.2110, lng: 128.5880 },
  '청초호 · 영랑호 산책': { lat: 38.2050, lng: 128.5850 },
  '속초 등대 일몰':       { lat: 38.2057, lng: 128.5946 },
  '설악산 권금성 케이블카':{ lat: 38.1246, lng: 128.4658 },
  '아바이마을 갯배 체험': { lat: 38.2115, lng: 128.5875 },
  '설악산 울산바위 트레킹':{ lat: 38.1300, lng: 128.4700 },
  '대포항 해산물':         { lat: 38.1620, lng: 128.6010 },
  '청초호 카페거리':       { lat: 38.2048, lng: 128.5862 },
  '속초 스카이베이 호텔':  { lat: 38.2078, lng: 128.5920 },
  // 통영
  '통영 케이블카':         { lat: 34.8275, lng: 128.4191 },
  '통영 굴국밥':           { lat: 34.8456, lng: 128.4334 },
  '동피랑 벽화마을':       { lat: 34.8456, lng: 128.4334 },
  '달아 공원 일몰':        { lat: 34.7816, lng: 128.3627 },
  '통영 한려수도 케이블카':{ lat: 34.8275, lng: 128.4191 },
  '통영 중앙시장 해산물':  { lat: 34.8448, lng: 128.4322 },
  '동피랑·서피랑 벽화마을':{ lat: 34.8460, lng: 128.4330 },
  '통영 한산도 유람선':    { lat: 34.8000, lng: 128.4100 },
  '윤이상 기념관':         { lat: 34.8468, lng: 128.4361 },
  '통영 코리아나 호텔':    { lat: 34.8473, lng: 128.4344 },
  // 남해
  '남해 다랭이 마을':      { lat: 34.7523, lng: 127.9253 },
  '남해 멸치쌈밥':         { lat: 34.8374, lng: 127.8926 },
  '상주 은모래 해변':      { lat: 34.7523, lng: 127.9600 },
  '창선 삼천포대교 일몰':  { lat: 34.9177, lng: 128.0553 },
  '물미해안도로 드라이브':  { lat: 34.7654, lng: 127.9100 },
  '독일마을':              { lat: 34.8139, lng: 127.9310 },
  // 가평
  '남이섬':                { lat: 37.7908, lng: 127.5252 },
  '아침고요수목원':        { lat: 37.8458, lng: 127.5540 },
  '청평호 수상레저':       { lat: 37.8149, lng: 127.4970 },
  '쁘띠 프랑스':           { lat: 37.8183, lng: 127.5080 },
  '자라섬':                { lat: 37.8025, lng: 127.5167 },
  '허브아일랜드':          { lat: 37.7871, lng: 127.2283 },
  // 담양
  '죽녹원 대나무 숲':      { lat: 35.3230, lng: 126.9872 },
  '담양 떡갈비':           { lat: 35.3144, lng: 126.9880 },
  '메타세쿼이아 가로수길': { lat: 35.3416, lng: 126.9866 },
  '소쇄원':                { lat: 35.2897, lng: 126.9638 },
  '관방제림':              { lat: 35.3121, lng: 126.9903 },
  '담양 알파카월드':        { lat: 35.3900, lng: 127.0100 },
  // 거제
  '해금강 탐방':           { lat: 34.7807, lng: 128.6877 },
  '거제 고현시장 멍게비빔밥':{ lat: 34.8804, lng: 128.6214 },
  '학동 흑진주 몽돌해변':  { lat: 34.8073, lng: 128.6703 },
  '바람의 언덕 일몰':      { lat: 34.7939, lng: 128.6648 },
  '외도 보타니아':         { lat: 34.7726, lng: 128.6455 },
  '구조라 해수욕장':       { lat: 34.8390, lng: 128.7067 },
  '신선대 선셋 포인트':    { lat: 34.8390, lng: 128.7067 },
  // 평창
  '알펜시아 스키장':       { lat: 37.6560, lng: 128.6710 },
  '평창 황태해장국':       { lat: 37.5722, lng: 128.3715 },
  '대관령 목장 체험':      { lat: 37.6810, lng: 128.6869 },
  '삼양목장':              { lat: 37.6811, lng: 128.6870 },
  '발왕산 선셋':           { lat: 37.6420, lng: 128.6821 },
  '봉평 메밀 막국수':      { lat: 37.6029, lng: 128.4825 },
  '하늘목장':              { lat: 37.6800, lng: 128.6900 },
  '알펜시아 리조트':       { lat: 37.6560, lng: 128.6710 },

  // ===== 해외 장소 =====
  // 일본 - 도쿄
  '아사쿠사 센소지':       { lat: 35.7148, lng: 139.7967 },
  '우에노 공원':           { lat: 35.7122, lng: 139.7741 },
  '시부야 스크램블':       { lat: 35.6595, lng: 139.7004 },
  '신주쿠 가부키초':       { lat: 35.6938, lng: 139.7034 },
  '아키하바라':            { lat: 35.6984, lng: 139.7731 },
  '하라주쿠 다케시타':     { lat: 35.6701, lng: 139.7029 },
  '도쿄 타워':             { lat: 35.6586, lng: 139.7454 },
  '도쿄 스카이트리':       { lat: 35.7101, lng: 139.8107 },
  '츠키지 시장':           { lat: 35.6654, lng: 139.7707 },
  '도쿄 디즈니랜드':       { lat: 35.6329, lng: 139.8804 },
  '오다이바':              { lat: 35.6252, lng: 139.7756 },
  '롯폰기 힐스':           { lat: 35.6604, lng: 139.7292 },
  '신주쿠 교엔':           { lat: 35.6852, lng: 139.7100 },
  '메이지 신궁':           { lat: 35.6764, lng: 139.6993 },
  '이치란 라멘':           { lat: 35.7149, lng: 139.7966 },
  // 일본 - 오사카
  '도톤보리':              { lat: 34.6687, lng: 135.5013 },
  '오사카 성':             { lat: 34.6873, lng: 135.5262 },
  '신사이바시':            { lat: 34.6728, lng: 135.5012 },
  '유니버설 스튜디오 재팬': { lat: 34.6654, lng: 135.4323 },
  '구로몬 시장':           { lat: 34.6688, lng: 135.5063 },
  '나카자키초 카페거리':   { lat: 34.7027, lng: 135.5019 },
  // 일본 - 교토
  '아라시야마 대나무숲':   { lat: 35.0094, lng: 135.6717 },
  '후시미 이나리':         { lat: 34.9671, lng: 135.7727 },
  '기온 거리':             { lat: 35.0037, lng: 135.7764 },
  '금각사':                { lat: 35.0394, lng: 135.7292 },
  '니조 성':               { lat: 35.0142, lng: 135.7481 },
  '철학의 길':             { lat: 35.0268, lng: 135.7969 },
  '니시키 시장':           { lat: 35.0047, lng: 135.7657 },
  // 프랑스 - 파리
  '에펠탑':                { lat: 48.8584, lng: 2.2945 },
  '루브르 박물관':         { lat: 48.8606, lng: 2.3376 },
  '샹젤리제 거리':         { lat: 48.8698, lng: 2.3079 },
  '노트르담 대성당':       { lat: 48.8530, lng: 2.3499 },
  '몽마르트 언덕':         { lat: 48.8867, lng: 2.3431 },
  '오르세 미술관':         { lat: 48.8600, lng: 2.3266 },
  '베르사유 궁전':         { lat: 48.8049, lng: 2.1204 },
  '개선문':                { lat: 48.8738, lng: 2.2950 },
  '생 제르맹 카페':        { lat: 48.8534, lng: 2.3330 },
  // 이탈리아 - 로마
  '콜로세움':              { lat: 41.8902, lng: 12.4922 },
  '트레비 분수':           { lat: 41.9009, lng: 12.4833 },
  '바티칸 박물관':         { lat: 41.9065, lng: 12.4536 },
  '판테온':                { lat: 41.8986, lng: 12.4769 },
  '스페인 계단':           { lat: 41.9058, lng: 12.4823 },
  '바티칸 시국':           { lat: 41.9022, lng: 12.4534 },
  '보르게세 공원':         { lat: 41.9138, lng: 12.4921 },
  // 이탈리아 - 피렌체
  '우피치 미술관':         { lat: 43.7677, lng: 11.2553 },
  '두오모 성당':           { lat: 43.7731, lng: 11.2560 },
  '폰테 베키오':           { lat: 43.7680, lng: 11.2531 },
  '미켈란젤로 광장':       { lat: 43.7629, lng: 11.2652 },
  '아카데미아 미술관':     { lat: 43.7767, lng: 11.2590 },
  // 이탈리아 - 베네치아
  '산마르코 광장':         { lat: 45.4341, lng: 12.3388 },
  '리알토 다리':           { lat: 45.4380, lng: 12.3359 },
  '대운하 곤돌라':         { lat: 45.4371, lng: 12.3316 },
  '무라노 섬':             { lat: 45.4580, lng: 12.3540 },
  // 스페인 - 바르셀로나
  '사그라다 파밀리아':     { lat: 41.4036, lng: 2.1744 },
  '람블라스 거리':         { lat: 41.3813, lng: 2.1714 },
  '파크 구엘':             { lat: 41.4145, lng: 2.1527 },
  '바르셀로네타 해변':     { lat: 41.3775, lng: 2.1898 },
  '보케리아 시장':         { lat: 41.3815, lng: 2.1718 },
  '카사 밀라':             { lat: 41.3954, lng: 2.1619 },
  '고딕 지구':             { lat: 41.3833, lng: 2.1770 },
  // 스페인 - 마드리드
  '프라도 미술관':         { lat: 40.4138, lng: -3.6921 },
  '레티로 공원':           { lat: 40.4153, lng: -3.6844 },
  '마요르 광장':           { lat: 40.4154, lng: -3.7074 },
  '왕궁':                  { lat: 40.4179, lng: -3.7143 },
  '푸에르타 델 솔':        { lat: 40.4169, lng: -3.7035 },
  // 영국 - 런던
  '타워 브리지':           { lat: 51.5055, lng: -0.0754 },
  '빅벤':                  { lat: 51.5007, lng: -0.1246 },
  '버킹엄 궁전':           { lat: 51.5014, lng: -0.1419 },
  '대영 박물관':           { lat: 51.5194, lng: -0.1270 },
  '런던 아이':             { lat: 51.5033, lng: -0.1195 },
  '피카딜리 서커스':       { lat: 51.5100, lng: -0.1340 },
  '코벤트 가든':           { lat: 51.5117, lng: -0.1240 },
  '하이드 파크':           { lat: 51.5073, lng: -0.1657 },
  '내셔널 갤러리':         { lat: 51.5089, lng: -0.1283 },
  // 태국 - 방콕
  '왓 프라케우':           { lat: 13.7516, lng: 100.4929 },
  '카오산 로드':           { lat: 13.7599, lng: 100.4972 },
  '짜뚜짝 시장':           { lat: 13.7999, lng: 100.5500 },
  '아시아티크':            { lat: 13.7009, lng: 100.5124 },
  '차이나타운 야오와랏':   { lat: 13.7400, lng: 100.5098 },
  '왓 포':                 { lat: 13.7465, lng: 100.4927 },
  '왓 아룬':               { lat: 13.7440, lng: 100.4888 },
  // 싱가포르
  '마리나베이 샌즈':       { lat: 1.2838, lng: 103.8606 },
  '가든스 바이 더 베이':   { lat: 1.2816, lng: 103.8636 },
  '유니버설 스튜디오 싱가포르': { lat: 1.2540, lng: 103.8238 },
  '클락키 리버사이드':     { lat: 1.2906, lng: 103.8465 },
  '오차드 로드':           { lat: 1.3048, lng: 103.8318 },
  '싱가포르 동물원':       { lat: 1.4043, lng: 103.7930 },
  '차이나타운 푸드스트리트': { lat: 1.2838, lng: 103.8443 },
  '리틀인디아':            { lat: 1.3066, lng: 103.8521 },
  '센토사 케이블카':       { lat: 1.2494, lng: 103.8303 },
  // 호주 - 시드니
  '시드니 오페라 하우스':  { lat: -33.8568, lng: 151.2153 },
  '하버 브리지':           { lat: -33.8523, lng: 151.2108 },
  '본다이 비치':           { lat: -33.8915, lng: 151.2767 },
  '달링 하버':             { lat: -33.8731, lng: 151.1985 },
  '록스 마켓':             { lat: -33.8596, lng: 151.2088 },
  // 그리스 - 산토리니
  '이아 마을':             { lat: 36.4619, lng: 25.3760 },
  '피라 중심가':           { lat: 36.4163, lng: 25.4319 },
  '레드 비치':             { lat: 36.3499, lng: 25.3929 },
  '아크로티리 유적':       { lat: 36.3517, lng: 25.4050 },
  // 그리스 - 아테네
  '아크로폴리스':          { lat: 37.9715, lng: 23.7267 },
  '파르테논 신전':         { lat: 37.9715, lng: 23.7267 },
  '플라카 지구':           { lat: 37.9742, lng: 23.7319 },
  '몬아스티라키 광장':     { lat: 37.9756, lng: 23.7254 },
  '국립 고고학 박물관':    { lat: 37.9890, lng: 23.7322 },
  // 포르투갈 - 리스본
  '벨렘 탑':               { lat: 38.6916, lng: -9.2159 },
  '알파마 지구':           { lat: 38.7120, lng: -9.1296 },
  '제로니무스 수도원':     { lat: 38.6978, lng: -9.2067 },
  '리스본 트램 28번':      { lat: 38.7127, lng: -9.1293 },
  '타임아웃 마켓':         { lat: 38.7063, lng: -9.1451 },
  // 캐나다 - 밴쿠버
  '스탠리 파크':           { lat: 49.3017, lng: -123.1417 },
  '그랜빌 아일랜드':       { lat: 49.2726, lng: -123.1340 },
  '캐필라노 출렁다리':     { lat: 49.3429, lng: -123.1143 },
  '개스타운':              { lat: 49.2837, lng: -123.1088 },
  '휘슬러 스키 리조트':    { lat: 50.1163, lng: -122.9574 },
};


// 미스터리 목적지 좌표
const mysteryCoords = {
  '통영': { lat: 34.8544, lng: 128.4330, zoom: 13 },
  '속초': { lat: 38.2070, lng: 128.5919, zoom: 13 },
  '남해': { lat: 34.8374, lng: 127.8926, zoom: 12 },
  '가평': { lat: 37.8315, lng: 127.5095, zoom: 12 },
  '담양': { lat: 35.3217, lng: 126.9880, zoom: 13 },
  '거제': { lat: 34.8804, lng: 128.6214, zoom: 12 },
  '평창': { lat: 37.3709, lng: 128.3904, zoom: 12 },
};

/* =============================================
   타임라인 플로우 + Leaflet 지도 통합 시스템
   ============================================= */

// 이동수단별 아이콘/시간 매핑
const transitModes = {
  '도보':     { icon: '🚶', label: '도보', times: ['5분', '10분', '15분', '20분'] },
  '대중교통': { icon: '🚌', label: '대중교통', times: ['10분', '20분', '30분', '40분'] },
  '자가용':   { icon: '🚗', label: '자가용', times: ['5분', '15분', '20분', '30분'] },
};

// Leaflet 지도 인스턴스
let _leafletMap = null;
let _leafletMarkers = [];
let _leafletPolyline = null;
let _currentFlowSpots = null;
let _currentFlowDest  = null;

/* ---------------------------------------------------
   renderFlowTimeline : 타임라인 카드 렌더링
   --------------------------------------------------- */
function renderFlowTimeline(spots, tier, destination) {
  const panel = document.getElementById('flow-panel');
  if (!panel) return;

  const colors   = ['#6C63FF','#43CFBB','#FF8C42','#FF6584','#FFD166'];
  const transport = getSelectedChip('transport-chips') || '도보';
  const mode      = transitModes[transport] || transitModes['도보'];

  let html = '';
  let total = 0;
  spots.forEach((spot, i) => {
    total += spot.cost || 0;
    const isFirst = i === 0;
    const isLast  = i === spots.length - 1;
    const isAccom = spot.emoji === '🏨' || (spot.name && spot.name.includes('호텔'))
                 || (spot.name && spot.name.includes('리조트'))
                 || (spot.name && spot.name.includes('게스트하우스'))
                 || (spot.name && spot.name.includes('펜션'))
                 || (spot.name && spot.name.includes('빌라'));
    const color = isFirst ? '#43CFBB' : isLast ? '#FF6584'
                : isAccom ? '#FFD166' : colors[i % colors.length];
    const dotCls  = isFirst ? 'dot-first' : isLast ? 'dot-last' : isAccom ? 'dot-accom' : '';
    const cardCls = isFirst ? 'card-first' : isLast ? 'card-last' : isAccom ? 'card-accom' : '';
    const vibeCls = isFirst ? 'vibe-first' : isLast ? 'vibe-last' : isAccom ? 'vibe-accom' : '';
    const costStr = (!spot.cost || spot.cost === 0) ? '무료' : '₩' + spot.cost.toLocaleString('ko-KR');
    const costCls = (!spot.cost || spot.cost === 0) ? 'free' : '';

    html += `
      <div class="flow-item" data-idx="${i}">
        <div class="flow-line-col">
          <div class="flow-dot ${dotCls}" style="border-color:${color};"></div>
          <div class="flow-vline"></div>
        </div>
        <div class="flow-card ${cardCls}" style="--card-color:${color};" onclick="toggleFlowCard(this)">
          <div class="flow-card-top">
            <div class="flow-card-left">
              <span class="flow-emoji">${spot.emoji}</span>
              <div class="flow-card-info">
                <span class="flow-time">${spot.time || ''}</span>
                <div class="flow-name">${spot.name}</div>
                <div class="flow-desc">${spot.desc || ''}</div>
              </div>
            </div>
            <div class="flow-card-right">
              <span class="flow-cost ${costCls}">${costStr}</span>
            </div>
          </div>
          ${spot.vibe ? `<div class="flow-card-bottom"><span class="flow-vibe ${vibeCls}">${spot.vibe}</span></div>` : ''}
        </div>
      </div>
    `;
    // 이동 커넥터 (마지막 제외)
    if (i < spots.length - 1) {
      const tTime = mode.times[Math.min(i, mode.times.length - 1)];
      html += `
        <div class="flow-transit">
          <div class="flow-transit-icon">${mode.icon} ${mode.label}</div>
          <span class="flow-transit-time">약 ${tTime}</span>
        </div>
      `;
    }
  });

  // 총 비용
  html += `
    <div class="flow-total-bar">
      <span class="flow-total-label"><span>💰</span> 예상 총 비용</span>
      <span class="flow-total-num">₩${total.toLocaleString('ko-KR')}</span>
    </div>
  `;

  panel.innerHTML = html;
  panel.style.display = 'flex';
}

/* ---------------------------------------------------
   toggleFlowCard : 카드 클릭 확장 토글
   --------------------------------------------------- */
function toggleFlowCard(card) {
  card.classList.toggle('expanded');
}

/* ---------------------------------------------------
   initMapView : 메인 진입점 (플로우 + 지도 초기화)
   --------------------------------------------------- */
function initMapView(destination, spots, tier, country = '한국') {
  const mapSection = document.getElementById('map-section');
  if (!mapSection) return;
  mapSection.style.display = 'block';

  _currentFlowDest  = destination;
  _currentFlowSpots = spots;

  // 타임라인 플로우 먼저 렌더
  renderFlowTimeline(spots, tier, destination);

  // 탭 바인딩
  bindMapTabs(destination, spots, tier, country);

  // 현재 활성 탭 확인
  const activeTab = document.querySelector('.map-tab.active');
  if (activeTab && activeTab.dataset.tab === 'map') {
    initLeafletMap(destination, spots, country);
  }
}

/* ---------------------------------------------------
   initLeafletMap : Leaflet + Nominatim 좌표 검색
   --------------------------------------------------- */
async function initLeafletMap(destination, spots, country = '한국') {
  const container  = document.getElementById('map-container');
  const loadingEl  = document.getElementById('map-loading');
  if (!container) return;

  // 로딩 표시
  container.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  // Leaflet 라이브러리 확인
  if (typeof L === 'undefined') {
    showLeafletError(container, loadingEl, 'Leaflet 지도 라이브러리를 불러올 수 없습니다.');
    return;
  }

  try {
    // 기존 지도 제거
    if (_leafletMap) {
      _leafletMap.remove();
      _leafletMap = null;
    }
    _leafletMarkers = [];
    _leafletPolyline = null;

    container.innerHTML = '';
    container.style.display = 'block';
    if (loadingEl) loadingEl.style.display = 'none';

    // 기본 좌표 (destCoords / mysteryCoords에서 찾기)
    const fallbackCoord = destCoords[destination] || mysteryCoords[destination]
                       || { lat: 37.5665, lng: 126.9780, zoom: 12 };

    // Leaflet 지도 초기화
    _leafletMap = L.map(container, {
      center:          [fallbackCoord.lat, fallbackCoord.lng],
      zoom:            fallbackCoord.zoom || 13,
      zoomControl:     true,
      attributionControl: true,
    });

    // OpenStreetMap 타일
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(_leafletMap);

    // 좌표 수집 (spotCoords 우선 → Nominatim 검색)
    const coordList = await resolveSpotCoords(spots, destination, country);

    const validCoords = [];
    const colors = ['#43CFBB', '#6C63FF', '#FF8C42', '#FF6584', '#FFD166'];

    coordList.forEach((coord, i) => {
      if (!coord) return;
      const spot    = spots[i];
      const isFirst = i === 0;
      const isLast  = i === spots.length - 1;
      const color   = isFirst ? '#43CFBB' : isLast ? '#FF6584' : colors[i % colors.length];
      validCoords.push([coord.lat, coord.lng]);

      // 커스텀 아이콘 (DivIcon)
      const iconEl = document.createElement('div');
      iconEl.className = 'lf-marker';
      iconEl.style.cssText = `border-color:${color}; color:${color};`;
      iconEl.innerHTML = `
        <div class="lf-marker-num" style="background:${color};">${i + 1}</div>
        <span>${spot.emoji}</span>
        <span>${spot.name.length > 8 ? spot.name.substring(0,8)+'…' : spot.name}</span>
      `;

      const icon = L.divIcon({
        html:        iconEl.outerHTML,
        className:   '',
        iconAnchor:  [60, 36],
        popupAnchor: [0, -38],
      });

      const costStr = (!spot.cost || spot.cost === 0)
        ? '<span style="color:#43CFBB">무료</span>'
        : '<span style="color:#43CFBB">₩' + spot.cost.toLocaleString('ko-KR') + '</span>';

      const marker = L.marker([coord.lat, coord.lng], { icon })
        .addTo(_leafletMap)
        .bindPopup(`
          <div class="lf-popup">
            <div class="lf-popup-emoji">${spot.emoji}</div>
            <div class="lf-popup-name">${spot.name}</div>
            <div class="lf-popup-desc">${spot.desc || ''}</div>
            ${spot.vibe ? `<div class="lf-popup-vibe">${spot.vibe}</div>` : ''}
            <div class="lf-popup-cost">${costStr}</div>
          </div>
        `, { maxWidth: 220, className: '' });

      _leafletMarkers.push(marker);
    });

    // 경로 폴리라인
    if (validCoords.length > 1) {
      _leafletPolyline = L.polyline(validCoords, {
        color:     '#6C63FF',
        weight:    3,
        opacity:   0.75,
        dashArray: '10, 8',
        lineCap:   'round',
        lineJoin:  'round',
      }).addTo(_leafletMap);
      _leafletMap.fitBounds(_leafletPolyline.getBounds(), { padding: [40, 40] });
    } else if (validCoords.length === 1) {
      _leafletMap.setView(validCoords[0], fallbackCoord.zoom || 14);
    }

    // 지도 리사이즈
    setTimeout(() => _leafletMap && _leafletMap.invalidateSize(), 200);

  } catch (err) {
    console.warn('Leaflet 지도 오류:', err);
    showLeafletError(container, loadingEl, '지도를 불러오는 중 오류가 발생했습니다.');
  }
}

/* ---------------------------------------------------
   resolveSpotCoords : spotCoords DB → Nominatim 검색
   --------------------------------------------------- */
// 국가명 → ISO 2자리 코드 매핑
const countryISOMap = {
  '한국': 'kr', '일본': 'jp', '미국': 'us', '프랑스': 'fr', '이탈리아': 'it',
  '스페인': 'es', '태국': 'th', '베트남': 'vn', '싱가포르': 'sg', '호주': 'au',
  '영국': 'gb', '튀르키예': 'tr', '스위스': 'ch', '그리스': 'gr', '포르투갈': 'pt',
  '캐나다': 'ca',
};

// 국가명 → 영문 국가명 매핑
const countryNameMap = {
  '한국': 'South Korea', '일본': 'Japan', '미국': 'United States',
  '프랑스': 'France', '이탈리아': 'Italy', '스페인': 'Spain',
  '태국': 'Thailand', '베트남': 'Vietnam', '싱가포르': 'Singapore',
  '호주': 'Australia', '영국': 'United Kingdom', '튀르키예': 'Turkey',
  '스위스': 'Switzerland', '그리스': 'Greece', '포르투갈': 'Portugal',
  '캐나다': 'Canada',
};

// 한국어 도시명 → 영문 도시명 매핑 (Nominatim 검색 정확도 향상)
const overseasDestEnMap = {
  // 일본
  '도쿄':'Tokyo','오사카':'Osaka','교토':'Kyoto','후쿠오카':'Fukuoka',
  '삿포로':'Sapporo','오키나와':'Okinawa','나고야':'Nagoya','나라':'Nara',
  // 미국
  '뉴욕':'New York','하와이':'Honolulu','로스앤젤레스':'Los Angeles',
  '샌프란시스코':'San Francisco','라스베이거스':'Las Vegas','시카고':'Chicago',
  '마이애미':'Miami','시애틀':'Seattle',
  // 프랑스
  '파리':'Paris','니스':'Nice','리옹':'Lyon','마르세유':'Marseille',
  '보르도':'Bordeaux','몽생미셸':'Mont Saint-Michel',
  // 이탈리아
  '로마':'Rome','피렌체':'Florence','베네치아':'Venice','밀라노':'Milan',
  '나폴리':'Naples','아말피':'Amalfi','시칠리아':'Sicily',
  // 스페인
  '바르셀로나':'Barcelona','마드리드':'Madrid','세비야':'Seville',
  '그라나다':'Granada','발렌시아':'Valencia','이비자':'Ibiza',
  // 태국
  '방콕':'Bangkok','치앙마이':'Chiang Mai','푸켓':'Phuket',
  '코사무이':'Koh Samui','파타야':'Pattaya','끄라비':'Krabi',
  // 베트남
  '하노이':'Hanoi','호치민':'Ho Chi Minh City','다낭':'Da Nang',
  '호이안':'Hoi An','나트랑':'Nha Trang','달랏':'Da Lat','푸꾸옥':'Phu Quoc',
  // 싱가포르
  '싱가포르':'Singapore','마리나베이':'Marina Bay','오차드':'Orchard',
  '센토사':'Sentosa','차이나타운':'Chinatown','클락키':'Clarke Quay',
  // 호주
  '시드니':'Sydney','멜버른':'Melbourne','브리즈번':'Brisbane',
  '골드코스트':'Gold Coast','케언즈':'Cairns','퍼스':'Perth',
  // 영국
  '런던':'London','에든버러':'Edinburgh','맨체스터':'Manchester',
  '옥스퍼드':'Oxford','바스':'Bath',
  // 튀르키예
  '이스탄불':'Istanbul','카파도키아':'Cappadocia','안탈리아':'Antalya',
  '에페소스':'Ephesus','파묵칼레':'Pamukkale',
  // 스위스
  '취리히':'Zurich','인터라켄':'Interlaken','제네바':'Geneva',
  '루체른':'Lucerne','체르마트':'Zermatt',
  // 그리스
  '산토리니':'Santorini','아테네':'Athens','미코노스':'Mykonos',
  '크레타':'Crete','로도스':'Rhodes',
  // 포르투갈
  '리스본':'Lisbon','포르투':'Porto','신트라':'Sintra','알가르베':'Algarve',
  // 캐나다
  '밴쿠버':'Vancouver','토론토':'Toronto','퀘벡시티':'Quebec City',
  '밴프':'Banff','몬트리올':'Montreal',
};

async function resolveSpotCoords(spots, destination, country = '한국') {
  const isOverseas  = country !== '한국';
  const countryEn   = countryNameMap[country] || country;
  const countryISO  = countryISOMap[country] || 'kr';
  const results     = [];

  for (const spot of spots) {
    // 1) 기존 spotCoords에 있으면 즉시 반환
    if (spotCoords[spot.name]) {
      results.push(spotCoords[spot.name]);
      continue;
    }

    // 2) Nominatim geocoding — 국가에 맞는 검색어 사용
    try {
      let queryStr;
      if (isOverseas) {
        const destEn = overseasDestEnMap[destination] || destination;
        // 해외 장소명: 한글 제거 후 남은 영문/숫자가 있으면 그것 + 도시, 없으면 한글 그대로
        const nameNoKo = spot.name.replace(/[가-힣\s]+/g, ' ').trim();
        const nameForSearch = nameNoKo.length >= 2 ? nameNoKo : spot.name;
        queryStr = nameForSearch + ', ' + destEn + ', ' + countryEn;
      } else {
        queryStr = spot.name + ' ' + destination + ' 한국';
      }
      const query = encodeURIComponent(queryStr.trim());
      const lang  = isOverseas ? 'en' : 'ko';
      const url   = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&accept-language=${lang}&countrycodes=${countryISO}`;
      const res   = await fetch(url, { headers: { 'User-Agent': 'TripPick/1.0' } });
      const data  = await res.json();
      if (data && data[0]) {
        results.push({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        // Nominatim 속도 제한 준수 (1 req/s)
        await new Promise(r => setTimeout(r, 1100));
        continue;
      }
    } catch (_) {}
    results.push(null);
  }
  return results;
}

/* ---------------------------------------------------
   showLeafletError : 에러 메시지 표시
   --------------------------------------------------- */
function showLeafletError(container, loadingEl, msg) {
  if (loadingEl) loadingEl.style.display = 'none';
  container.style.display = 'block';
  container.innerHTML = `
    <div class="map-error">
      <i class="fas fa-map-marked-alt"></i>
      <p>${msg}</p>
      <p style="font-size:0.72rem;opacity:0.6;margin-top:4px;">타임라인 플로우 탭에서 일정을 확인하세요.</p>
    </div>
  `;
}

/* ---------------------------------------------------
   bindMapTabs : 탭 전환 이벤트
   --------------------------------------------------- */
function bindMapTabs(destination, spots, tier, country = '한국') {
  document.querySelectorAll('.map-tab').forEach(tab => {
    // 중복 이벤트 방지
    const newTab = tab.cloneNode(true);
    tab.parentNode.replaceChild(newTab, tab);
  });

  document.querySelectorAll('.map-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const flowPanel  = document.getElementById('flow-panel');
      const mapCont    = document.getElementById('map-container');
      const mapLoading = document.getElementById('map-loading');

      if (this.dataset.tab === 'flow') {
        // 타임라인 탭
        if (flowPanel)  { flowPanel.style.display = 'flex'; }
        if (mapCont)    { mapCont.style.display   = 'none'; }
        if (mapLoading) { mapLoading.style.display = 'none'; }
      } else {
        // 지도 탭
        if (flowPanel)  { flowPanel.style.display = 'none'; }
        if (_leafletMap) {
          // 이미 초기화된 경우
          if (mapCont) mapCont.style.display = 'block';
          if (mapLoading) mapLoading.style.display = 'none';
          setTimeout(() => _leafletMap.invalidateSize(), 150);
        } else {
          // 최초 지도 탭 클릭 시 초기화
          initLeafletMap(destination, spots, country);
        }
      }
    });
  });
}

/* =============================================
   generatePlan에 날짜 저장 패치 (호출 시 calState 저장)
   ============================================= */
// 버튼 클릭 시 날짜 정보 저장 (buildPlanHTML에서 사용)
function saveDateBeforeGenerate() {
  window._selectedNights    = getSelectedNights();
  window._selectedStartDate = calState ? calState.startDate : null;
}

// 플랜 생성 후 결과 감지 → initMapView 호출
const _resultObserver = new MutationObserver(() => {
  const plan = document.querySelector('.result-plan');
  if (!plan) return;
  const dest    = window._lastGeneratedDest;
  const spots   = window._lastGeneratedSpots;
  const tier    = window._lastGeneratedTier;
  const country = window._lastGeneratedCountry || '한국';
  if (dest && spots) {
    window._lastGeneratedDest    = null;
    window._lastGeneratedSpots   = null;
    window._lastGeneratedTier    = null;
    window._lastGeneratedCountry = null;
    // 플로우 탭 먼저 활성화
    document.querySelectorAll('.map-tab').forEach(t => t.classList.remove('active'));
    const flowTab = document.querySelector('.map-tab[data-tab="flow"]');
    if (flowTab) flowTab.classList.add('active');
    const mapCont = document.getElementById('map-container');
    const flowPan = document.getElementById('flow-panel');
    if (mapCont) mapCont.style.display = 'none';
    if (flowPan) flowPan.style.display = 'flex';
    setTimeout(() => initMapView(dest, spots, tier, country), 120);
  }
});
const resultContent = document.getElementById('result-content');
if (resultContent) _resultObserver.observe(resultContent, { childList: true, subtree: false });

console.log('%c✈ TripPick', 'color: #6C63FF; font-size: 20px; font-weight: 900;');
console.log('%c원클릭 여행 큐레이션 서비스 — 고민은 TripPick이, 짐은 당신이!', 'color: #43CFBB; font-size: 12px;');


