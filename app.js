/* ═══════════════════════════════════════════
   app.js  —  Panel routing, PWA plumbing
   Depends on: all other JS files
═══════════════════════════════════════════ */

// ── Panel routing ─────────────────────────────
function showPanel(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  if (name === 'map')      setTimeout(initMap, 80);
  if (name === 'flash')    initFlash();
  if (name === 'quiz')     { qIdx=0; qScore=0; qStreak=0; resetQuiz(); }
  if (name === 'timeline') buildTimelineOnce();
}

// ── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Build province / territory cards
  initCards();

  // Add "Where is it?" sub-tab to quiz panel
  const qwrap = document.querySelector('#panel-quiz .quiz-wrap');
  const whereTabRow = document.createElement('div');
  whereTabRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-bottom:14px';
  whereTabRow.innerHTML = `
    <button class="quiz-mode-btn active" id="qsub-quiz"  onclick="switchQuizSub('quiz',this)">🧠 חידון | Quiz</button>
    <button class="quiz-mode-btn"        id="qsub-where" onclick="switchQuizSub('where',this)">🗺️ איפה זה? | Where Is It?</button>`;
  qwrap.insertBefore(whereTabRow, qwrap.firstChild);

  // Kick off default quiz render
  resetQuiz();

  // Handle ?tab= deep-link from PWA shortcuts
  const startTab = new URLSearchParams(location.search).get('tab');
  if (startTab) {
    const b = document.querySelector('.tab-btn.t-' + startTab.slice(0, 4));
    if (b) showPanel(startTab, b);
  }
});

// ── PWA: Service Worker ───────────────────────
let swReg = null, newWorker = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swReg = await navigator.serviceWorker.register('./sw.js');
      swReg.addEventListener('updatefound', () => {
        newWorker = swReg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller)
            document.getElementById('update-banner').classList.add('visible');
        });
      });
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
    } catch (e) { console.warn('[SW]', e); }
  });
}

function applyUpdate() { if (newWorker) newWorker.postMessage({type:'SKIP_WAITING'}); }

// ── PWA: Install prompt ───────────────────────
let deferredInstall = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  setTimeout(() => {
    if (!window.matchMedia('(display-mode:standalone)').matches)
      document.getElementById('install-banner').classList.add('visible');
  }, 3500);
});

async function triggerInstall() {
  dismissInstall();
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
}

function dismissInstall() { document.getElementById('install-banner').classList.remove('visible'); }
window.addEventListener('appinstalled', dismissInstall);
