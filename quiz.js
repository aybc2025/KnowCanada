/* ═══════════════════════════════════════════
   quiz.js  —  Three quiz modes:
     easy  — multiple-choice text questions
     flag  — show a flag, pick the province name (NEW)
     hard  — type the answer
   Depends on: data.js
═══════════════════════════════════════════ */

let qMode = 'easy', qIdx = 0, qScore = 0, qAnswered = false, qStreak = 0;
let qShuffled = [];

// ── localStorage best score ───────────────────
function loadBest() { try { return parseInt(localStorage.getItem('canada_quiz_best') || '0'); } catch { return 0; } }
function saveBest(s) { try { if (s > loadBest()) localStorage.setItem('canada_quiz_best', s); } catch {} }

// ── Mode switching ────────────────────────────
function setQuizMode(m) {
  qMode = m;
  ['easy','flag','hard'].forEach(id => {
    document.getElementById('qm-' + id).classList.toggle('active', id === m);
  });
  resetQuiz();
}

function resetQuiz() {
  qIdx = 0; qScore = 0; qStreak = 0; qAnswered = false;
  if (qMode === 'flag') {
    // Build flag-identification questions from ALL_REGIONS
    qShuffled = buildFlagQuestions();
  } else {
    qShuffled = [...QUIZ_Q].sort(() => Math.random() - 0.5);
  }
  renderQuiz();
}

// ── Flag quiz builder ─────────────────────────
function buildFlagQuestions() {
  // For each region, create a question: show flag → pick from 4 names
  return ALL_REGIONS
    .sort(() => Math.random() - 0.5)
    .map(correct => {
      // Pick 3 wrong options
      const others = ALL_REGIONS.filter(r => r !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
      const allOpts = [correct, ...others].sort(() => Math.random() - 0.5);
      const correctIdx = allOpts.indexOf(correct);
      return {
        flag_url: correct.flag_url,
        flag_emoji: correct.emoji,
        flag_abbr: correct.abbr,
        he: 'לאיזה מחוז/טריטוריה שייך הדגל הזה?',
        en: 'Which province or territory does this flag belong to?',
        opts_he: allOpts.map(r => r.he),
        opts_en: allOpts.map(r => r.en),
        c: correctIdx,
        exp_he: `זהו דגל ${correct.he} (${correct.abbr}). בירה: ${correct.capital_he}.`,
        exp_en: `This is the flag of ${correct.en} (${correct.abbr}). Capital: ${correct.capital_en}.`,
        isFlagQ: true
      };
    });
}

// ── Render ────────────────────────────────────
function renderQuiz() {
  const c = document.getElementById('quiz-container');
  const totalQ = qShuffled.length;

  if (qIdx >= totalQ) {
    saveBest(qScore);
    const pb  = loadBest();
    const pct = Math.round((qScore / totalQ) * 100);
    const em  = pct >= 80 ? '🏆' : pct >= 50 ? '😊' : '📚';
    c.innerHTML = `
      <div class="quiz-score-card">
        <span class="quiz-score-emoji">${em}</span>
        <div class="quiz-score-he">סיימת! | Done!</div>
        <div class="quiz-score-pts">${qScore}/${totalQ}</div>
        <div class="quiz-pb">שיא אישי | Personal best: <span>${pb}/${totalQ}</span></div>
        <button class="quiz-restart" onclick="resetQuiz()">🔄 נסה שוב | Try Again</button>
      </div>`;
    return;
  }

  const q = qShuffled[qIdx];
  qAnswered = false;
  const pct = (qIdx / totalQ) * 100;

  let questionBlock = '';
  if (q.isFlagQ) {
    // Show flag image as the "question"
    questionBlock = `
      <div class="quiz-flag-wrap">
        <img src="${q.flag_url}" alt="flag"
             style="max-height:110px;max-width:220px;object-fit:contain;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,.18)"
             onerror="this.outerHTML='<span style=\\'font-size:3.5rem\\'>${q.flag_emoji}</span>'">
        <div style="margin-top:8px;font-size:.75rem;color:var(--muted);font-weight:700;direction:ltr">${q.flag_abbr}</div>
      </div>
      <div class="quiz-q-he">${q.he}</div>
      <div class="quiz-q-en">${q.en}</div>`;
  } else {
    questionBlock = `
      <div class="quiz-q-he">${q.he}</div>
      <div class="quiz-q-en">${q.en}</div>`;
  }

  let answerHtml = '';
  if (qMode === 'hard') {
    answerHtml = `
      <div class="quiz-type-wrap">
        <input class="quiz-input" id="quiz-input" type="text" dir="auto"
          placeholder="הקלד/י תשובה | Type your answer..." autocomplete="off">
        <button class="quiz-submit" id="quiz-submit-btn" onclick="submitTyped()" style="margin-top:10px">✔ בדוק | Check</button>
      </div>`;
  } else {
    // Both 'easy' and 'flag' modes use 4-option grid
    answerHtml = `
      <div class="quiz-opts">
        ${q.opts_he.map((opt, i) => `
          <button class="quiz-opt" onclick="answerQuiz(${i})" id="qo${i}">
            ${opt}<br><span style="font-size:.72rem;color:#8898b8">${q.opts_en[i]}</span>
          </button>`).join('')}
      </div>`;
  }

  c.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-prog-row">
        <div class="quiz-prog-outer"><div class="quiz-prog-fill" style="width:${pct}%"></div></div>
        <div class="quiz-num">${qIdx + 1}/${totalQ}</div>
      </div>
      ${qStreak >= 2 ? `<div class="quiz-streak">🔥 ${qStreak} ברצף | ${qStreak} streak</div>` : ''}
      ${questionBlock}
      ${answerHtml}
      <div class="quiz-feedback" id="quiz-fb"></div>
      <button class="quiz-next" id="quiz-next-btn" onclick="nextQ()">הבא ← Next</button>
    </div>`;

  if (qMode === 'hard') {
    document.getElementById('quiz-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitTyped(); });
  }
}

// ── Answer handlers ───────────────────────────
function answerQuiz(idx) {
  if (qAnswered) return;
  qAnswered = true;
  const q = qShuffled[qIdx];
  for (let i = 0; i < 4; i++) {
    const b = document.getElementById('qo' + i);
    if (b) { b.disabled = true; if (i === q.c) b.classList.add('correct'); else if (i === idx) b.classList.add('wrong'); }
  }
  const ok = idx === q.c;
  if (ok) { qScore++; qStreak++; } else { qStreak = 0; }
  showQFeedback(ok, q);
}

function submitTyped() {
  if (qAnswered) return;
  qAnswered = true;
  const q = qShuffled[qIdx];
  const inp = document.getElementById('quiz-input');
  const val = (inp.value || '').trim().toLowerCase();
  const correct_he = q.opts_he[q.c].toLowerCase();
  const correct_en = q.opts_en[q.c].toLowerCase();
  const ok = val === correct_he || val === correct_en
    || correct_he.includes(val) || (correct_en.includes(val) && val.length > 2);
  inp.classList.add(ok ? 'correct' : 'wrong');
  document.getElementById('quiz-submit-btn').disabled = true;
  if (ok) { qScore++; qStreak++; } else { qStreak = 0; }
  showQFeedback(ok, q);
}

function showQFeedback(ok, q) {
  const fb = document.getElementById('quiz-fb');
  fb.className = 'quiz-feedback show ' + (ok ? 'correct' : 'wrong');
  const wrongNote = ok ? '' : ` התשובה: ${q.opts_he[q.c]} | ${q.opts_en[q.c]}`;
  fb.innerHTML = `${ok ? '✅ נכון! Correct!' : '❌ לא נכון! Not quite!' + wrongNote}<br><small>${q.exp_he}<br>${q.exp_en}</small>`;
  document.getElementById('quiz-next-btn').classList.add('show');
}

function nextQ() { qIdx++; renderQuiz(); }

// ── Where-is-it sub-game ──────────────────────
let whereMap, whereMapReady = false, whereTarget = null, whereScore = 0, whereTurn = 0, whereAnswered = false;

function initWhereMap() {
  if (whereMapReady) return;
  whereMapReady = true;
  whereMap = L.map('where-map', {center:[62,-96], zoom:3, minZoom:2, maxZoom:7, zoomControl:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap', maxZoom:19}).addTo(whereMap);
  whereMap.on('click', whereMapClick);
  setTimeout(() => whereMap.invalidateSize(), 100);
  nextWhereQuestion();
}

function nextWhereQuestion() {
  whereAnswered = false;
  whereTurn++;
  document.getElementById('where-feedback').textContent = '';
  document.getElementById('where-next-btn').disabled = true;
  const pool = ALL_REGIONS.filter(r => r !== whereTarget);
  whereTarget = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('where-target-he').textContent = whereTarget.he;
  document.getElementById('where-target-en').textContent = whereTarget.en;
  document.getElementById('where-score-val').textContent = whereScore + '/' + Math.max(0, whereTurn - 1);
}

function whereMapClick(e) {
  if (whereAnswered || !whereTarget) return;
  whereAnswered = true;
  const dist = e.latlng.distanceTo(L.latLng(whereTarget.lat, whereTarget.lng)) / 1000;
  const correct = dist < 500;
  if (correct) whereScore++;
  const fb = document.getElementById('where-feedback');
  fb.className = 'where-feedback ' + (correct ? 'ok' : 'bad');
  fb.textContent = correct
    ? `✅ נכון! רחוק ${Math.round(dist)} קמ״ר מהמרכז | Correct! ${Math.round(dist)}km from center`
    : `❌ הפספסת ב-${Math.round(dist)} קמ״ר. המחוז: ${whereTarget.he} | Missed by ${Math.round(dist)}km`;
  L.circleMarker([whereTarget.lat, whereTarget.lng], {radius:14, fillColor:whereTarget.color, color:'#fff', weight:3, fillOpacity:.9})
    .addTo(whereMap).bindPopup(`<b>${whereTarget.he}</b><br>${whereTarget.en}`).openPopup();
  document.getElementById('where-score-val').textContent = whereScore + '/' + whereTurn;
  document.getElementById('where-next-btn').disabled = false;
}

function injectWhereGame() {
  const qwrap = document.getElementById('quiz-container').parentElement;
  if (document.getElementById('where-section')) return;
  const sec = document.createElement('div');
  sec.id = 'where-section';
  sec.innerHTML = `
    <div class="sec-title" style="padding-top:32px">
      <h2>🗺️ איפה זה? | Where Is It?</h2>
      <p>לחץ על המפה את מיקום המחוז · Click the map where you think the province is</p>
    </div>
    <div class="where-wrap">
      <div class="where-question">
        <div>
          <div class="where-target" id="where-target-he">...</div>
          <div class="where-target" style="font-size:.9rem"><small id="where-target-en" style="color:#8898b8;font-weight:700"></small></div>
        </div>
        <div class="where-score-badge">✅ <span id="where-score-val">0/0</span></div>
      </div>
      <div id="where-map"></div>
      <div class="where-feedback" id="where-feedback"></div>
      <button class="where-next" id="where-next-btn" onclick="nextWhereQuestion()" disabled>הבא ← Next</button>
    </div>`;
  qwrap.appendChild(sec);
  setTimeout(initWhereMap, 100);
}

function switchQuizSub(sub, btn) {
  document.querySelectorAll('[id^="qsub-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const quizContainer = document.getElementById('quiz-container');
  const modeRow = document.getElementById('quiz-mode-row');
  const ws = document.getElementById('where-section');
  if (sub === 'where') {
    quizContainer.style.display = 'none';
    if (modeRow) modeRow.style.display = 'none';
    injectWhereGame();
    if (ws) ws.style.display = '';
  } else {
    quizContainer.style.display = '';
    if (modeRow) modeRow.style.display = '';
    if (ws) ws.style.display = 'none';
  }
}
