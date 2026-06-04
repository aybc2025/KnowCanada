/* ═══════════════════════════════════════════
   flashcard.js  —  Two flashcard modes:
     1. Abbreviation → Name  (classic)
     2. Flag image  → Name  (new)
   Depends on: data.js
═══════════════════════════════════════════ */

// ── Shared state ──────────────────────────────
let flashDeck = [], flashIdx = 0, flashFlipped = false;
let flashCorrect = 0, flashTotal = 0;
let flashSubMode = 'abbr'; // 'abbr' | 'flag'

// ── Init / reset ──────────────────────────────
function initFlash() {
  flashDeck = [...ALL_REGIONS].sort(() => Math.random() - 0.5);
  flashIdx = 0; flashCorrect = 0; flashTotal = 0; flashFlipped = false;
  document.getElementById('flash-score-area').innerHTML = '';
  document.getElementById('flash-progress-row').style.display = 'flex';

  // Sync sub-mode toggle buttons
  document.querySelectorAll('[id^="fsub-"]').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('fsub-' + flashSubMode);
  if (activeBtn) activeBtn.classList.add('active');

  renderFlashCard();
}

function switchFlashSub(mode, btn) {
  flashSubMode = mode;
  document.querySelectorAll('[id^="fsub-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Restart deck with new mode
  flashDeck = [...ALL_REGIONS].sort(() => Math.random() - 0.5);
  flashIdx = 0; flashCorrect = 0; flashTotal = 0; flashFlipped = false;
  document.getElementById('flash-score-area').innerHTML = '';
  document.getElementById('flash-progress-row').style.display = 'flex';
  renderFlashCard();
}

// ── Render ────────────────────────────────────
function renderFlashCard() {
  const pct = (flashIdx / flashDeck.length) * 100;
  document.getElementById('flash-prog').style.width = pct + '%';
  document.getElementById('flash-num').textContent = (flashIdx + 1) + '/' + flashDeck.length;

  if (flashIdx >= flashDeck.length) { showFlashScore(); return; }

  const r = flashDeck[flashIdx];

  // Front face content depends on sub-mode
  if (flashSubMode === 'flag') {
    document.getElementById('flash-abbr').innerHTML =
      `<img src="${r.flag_url}" alt="${r.en} flag"
            style="height:90px;max-width:200px;object-fit:contain;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.3)"
            onerror="this.outerHTML='<span style=\\'font-size:3rem\\'>${r.emoji}</span>'">`;
    document.getElementById('flash-hint').textContent = 'זהה את הדגל | Identify the flag';
  } else {
    document.getElementById('flash-abbr').textContent = r.abbr;
    document.getElementById('flash-hint').textContent = 'מה שם המחוז? | What province is this?';
  }

  // Back face — always the same
  document.getElementById('flash-name-he').textContent = r.he;
  document.getElementById('flash-name-en').textContent = r.en;
  document.getElementById('flash-cap').textContent = '🏛️ ' + r.capital_he + ' · ' + r.capital_en;

  const outer = document.getElementById('flash-card-outer');
  outer.classList.remove('flipped');
  flashFlipped = false;
  document.getElementById('flash-controls').style.display = 'none';
}

// ── Flip ──────────────────────────────────────
function flipCard() {
  if (flashIdx >= flashDeck.length) return;
  flashFlipped = !flashFlipped;
  document.getElementById('flash-card-outer').classList.toggle('flipped', flashFlipped);
  if (flashFlipped) document.getElementById('flash-controls').style.display = 'flex';
}

// ── Score answer ──────────────────────────────
function flashAnswer(correct) {
  if (correct) flashCorrect++;
  flashTotal++;
  flashIdx++;
  renderFlashCard();
}

// ── End screen ────────────────────────────────
function showFlashScore() {
  const pct = Math.round((flashCorrect / flashTotal) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '😊' : '📚';
  document.getElementById('flash-score-area').innerHTML = `
    <div class="flash-score-card">
      <div class="flash-score-emoji">${emoji}</div>
      <div class="flash-score-he">סיימת! | Done!</div>
      <div class="flash-score-pts">${flashCorrect}/${flashTotal}</div>
      <div style="font-size:.88rem;color:#8898b8;font-weight:700;margin-bottom:10px">${pct}% נכון | ${pct}% correct</div>
      <button class="flash-restart" onclick="initFlash()">🔄 שחק שוב | Play Again</button>
    </div>`;
  document.getElementById('flash-progress-row').style.display = 'none';
}
