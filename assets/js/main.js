/* Financial Dashboard — main.js */

// ── Tab switching ──────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab-section');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabSections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
    // Initialize the chart for the newly visible tab if needed
    initTabChart(target);
  });
});

// ── TradingView Advanced Chart instances ──────────────────────
const chartInstances = {};

function createAdvancedChart(containerId, symbol) {
  if (typeof TradingView === 'undefined') return;
  if (chartInstances[containerId]) {
    chartInstances[containerId].remove();
  }
  chartInstances[containerId] = new TradingView.widget({
    container_id: containerId,
    symbol: symbol,
    interval: 'D',
    timezone: 'Asia/Seoul',
    theme: 'dark',
    style: '1',
    locale: 'kr',
    toolbar_bg: '#1c2128',
    enable_publishing: false,
    allow_symbol_change: true,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    withdateranges: true,
    details: true,
    hotlist: false,
    calendar: false,
    studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
    width: '100%',
    height: '100%',
    autosize: true,
  });
}

// ── Symbol buttons within each tab ────────────────────────────
const tabChartMap = {
  indices:     { containerId: 'tradingview_main',        defaultSym: 'FOREXCOM:SPXUSD' },
  stocks:      { containerId: 'tradingview_stocks',      defaultSym: 'NASDAQ:NVDA' },
  commodities: { containerId: 'tradingview_commodities', defaultSym: 'TVC:GOLD' },
  crypto:      { containerId: 'tradingview_crypto',      defaultSym: 'BITSTAMP:BTCUSD' },
};

const initializedTabs = new Set();

function initTabChart(tabId) {
  const cfg = tabChartMap[tabId];
  if (!cfg || initializedTabs.has(tabId)) return;
  initializedTabs.add(tabId);
  createAdvancedChart(cfg.containerId, cfg.defaultSym);
}

// Wire up symbol buttons for all tabs
document.querySelectorAll('.tab-section').forEach(section => {
  section.querySelectorAll('.sym-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state within this section only
      section.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tabId = section.id.replace('tab-', '');
      const cfg = tabChartMap[tabId];
      if (!cfg) return;

      const sym = btn.dataset.sym;
      const name = btn.dataset.name || sym;

      // Update card title if present
      const titleEl = section.querySelector('.card-title');
      if (titleEl) titleEl.textContent = name;

      createAdvancedChart(cfg.containerId, sym);
    });
  });
});

// ── Market status indicator ────────────────────────────────────
function updateMarketStatus() {
  const dot = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  if (!dot || !text) return;

  // UTC time — NYSE: 14:30–21:00 UTC (Mon–Fri)
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun,6=Sat
  const h = now.getUTCHours();
  const m = now.getUTCMinutes();
  const mins = h * 60 + m;

  const isWeekday = day >= 1 && day <= 5;
  const isNYSEOpen = mins >= 870 && mins < 1260; // 14:30–21:00 UTC

  if (isWeekday && isNYSEOpen) {
    dot.classList.remove('closed');
    text.textContent = 'NYSE Open';
  } else {
    dot.classList.add('closed');
    text.textContent = 'Market Closed';
  }
}

// ── Last updated timestamp ─────────────────────────────────────
function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (!el) return;
  el.textContent = new Date().toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

// ── Bootstrap ─────────────────────────────────────────────────
function bootstrap() {
  updateMarketStatus();
  updateTimestamp();
  setInterval(updateMarketStatus, 60_000);
  setInterval(updateTimestamp, 1_000);

  // Wait for TradingView library then init the default (indices) tab
  waitForTV(() => initTabChart('indices'));
}

function waitForTV(cb, tries = 0) {
  if (typeof TradingView !== 'undefined') { cb(); return; }
  if (tries > 30) return; // give up after ~15 s
  setTimeout(() => waitForTV(cb, tries + 1), 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
