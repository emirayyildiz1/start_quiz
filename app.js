/* ============================================================
   ArtQuiz – app.js
   Full game logic: Login, Quiz, Scoreboard (localStorage + Firestore)
   ============================================================ */

import { saveScoreToFirestore } from './firebase.js';

'use strict';

// ─────────────────────────────────────────────
//  MOCK VERİSİ – 10 Sanat Sorusu
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  SORU VERİSİ – Görseller /images/ klasöründen statik olarak okunur
// ─────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    image: 'images/q1_mona_lisa.jpg',
    question: 'Bu ünlü tablo hangi ressamın eseridir?',
    options: ['Leonardo da Vinci', 'Michelangelo'],
    correct: 'Leonardo da Vinci',
    era: 'Rönesans · ~1503'
  },
  {
    id: 2,
    image: 'images/q2_starry_night.jpg',
    question: '"Yıldızlı Gece" adlı bu eseri kim yaratmıştır?',
    options: ['Claude Monet', 'Vincent van Gogh'],
    correct: 'Vincent van Gogh',
    era: 'Post-İzlenimcilik · 1889'
  },
  {
    id: 3,
    image: 'images/q3_dali.jpg',
    question: 'Salvador Dalí\'nin "Hafızanın Azmi" tablosunda öne çıkan nesne nedir?',
    options: ['Eriyen saatler', 'Uçan filler'],
    correct: 'Eriyen saatler',
    era: 'Sürrealizm · 1931'
  },
  {
    id: 4,
    image: 'images/q4_michelangelo.jpg',
    question: '"Sistine Şapeli" tavanını kim boyamıştır?',
    options: ['Raphael', 'Michelangelo'],
    correct: 'Michelangelo',
    era: 'Rönesans · 1508–1512'
  },
  {
    id: 5,
    image: 'images/q5_american_gothic.jpg',
    question: '"American Gothic" adlı bu ikonik tablo kimin eseridir?',
    options: ['Grant Wood', 'Edward Hopper'],
    correct: 'Grant Wood',
    era: 'Amerikan Gerçekçiliği · 1930'
  },
  {
    id: 6,
    image: 'images/q6_rembrandt.jpg',
    question: 'Chiaroscuro tekniğiyle ünlü bu Hollandalı ressam kimdir?',
    options: ['Rembrandt van Rijn', 'Johannes Vermeer'],
    correct: 'Rembrandt van Rijn',
    era: 'Barok · 17. yüzyıl'
  },
  {
    id: 7,
    image: 'images/q7_scream.jpg',
    question: '"Çığlık" (The Scream) adlı bu tabloyu hangi ressam yapmıştır?',
    options: ['Edvard Munch', 'Gustav Klimt'],
    correct: 'Edvard Munch',
    era: 'Ekspresyonizm · 1893'
  },
  {
    id: 8,
    image: 'images/q8_klimt.jpg',
    question: '"Öpücük" (The Kiss) tablosu hangi sanatçıya aittir?',
    options: ['Egon Schiele', 'Gustav Klimt'],
    correct: 'Gustav Klimt',
    era: 'Sembolizm · 1907–08'
  },
  {
    id: 9,
    image: 'images/q9_hokusai.jpg',
    question: '"Kanagawa\'nın Büyük Dalgası" hangi Japon sanatçıya aittir?',
    options: ['Hokusai', 'Hiroshige'],
    correct: 'Hokusai',
    era: 'Ukiyo-e · ~1831'
  },
  {
    id: 10,
    image: 'images/q10_guernica.jpg',
    question: 'Picasso\'nun hangi eseri Kübizm akımının en simgesel çalışmasıdır?',
    options: ['Guernica', 'Les Demoiselles d\'Avignon'],
    correct: 'Guernica',
    era: 'Kübizm · 1937'
  }
];

// ─────────────────────────────────────────────
//  UYGULAMA DURUMU
// ─────────────────────────────────────────────
const state = {
  player: { name: '', phone: '' },
  currentQuestion: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  timeLeft: 30,
  startTime: null,
  elapsedSeconds: 0,
  timerInterval: null,
  isAnswering: false,
  shuffledQuestions: [],
};

// ─────────────────────────────────────────────
//  YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────

/** Fisher-Yates karıştırma */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Saniye → "ss.S sn" formatı */
function formatTime(totalMs) {
  const s = (totalMs / 1000).toFixed(1);
  return `${s}s`;
}

/** Ekranlar arası geçiş */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });
  const target = document.getElementById(id);
  target.classList.remove('hidden');
  target.classList.add('active');
  // Üste scroll
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────
//  GİRİŞ EKRANI
// ─────────────────────────────────────────────

const inputName  = document.getElementById('input-name');
const inputPhone = document.getElementById('input-phone');
const nameError  = document.getElementById('name-error');
const phoneError = document.getElementById('phone-error');

// Sadece rakam girişine zorla
inputPhone.addEventListener('input', () => {
  inputPhone.value = inputPhone.value.replace(/\D/g, '');
});

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const name  = inputName.value.trim();
  const phone = inputPhone.value.trim();

  let valid = true;

  // İsim validasyonu
  if (!name || name.split(' ').filter(w => w.length > 0).length < 2) {
    showError(inputName, nameError);
    valid = false;
  } else {
    clearError(inputName, nameError);
  }

  // Telefon validasyonu: sadece rakam, en az 10 hane
  if (!phone || !/^\d{10,11}$/.test(phone)) {
    showError(inputPhone, phoneError);
    valid = false;
  } else {
    clearError(inputPhone, phoneError);
  }

  if (!valid) return;

  state.player.name  = name;
  state.player.phone = phone;

  startQuiz();
});

function showError(input, errorEl) {
  input.classList.add('error');
  errorEl.classList.remove('hidden');
}
function clearError(input, errorEl) {
  input.classList.remove('error');
  errorEl.classList.add('hidden');
}

// ─────────────────────────────────────────────
//  QUIZ BAŞLATMA
// ─────────────────────────────────────────────

function startQuiz() {
  // Durumu sıfırla
  state.currentQuestion = 0;
  state.score    = 0;
  state.correct  = 0;
  state.wrong    = 0;
  state.timeLeft = 30;
  state.isAnswering = false;
  state.shuffledQuestions = shuffle(QUESTIONS);
  state.startTime = Date.now();

  // Oyuncu adını göster
  document.getElementById('player-name-display').textContent = state.player.name;

  showScreen('screen-quiz');
  renderQuestion();
  startTimer();
}

// ─────────────────────────────────────────────
//  SAYAÇ
// ─────────────────────────────────────────────

function startTimer() {
  clearInterval(state.timerInterval);
  updateTimerDisplay();

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      endQuiz('timeout');
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el    = document.getElementById('timer-display');
  const badge = document.getElementById('timer-badge');
  el.textContent = state.timeLeft;

  if (state.timeLeft <= 10) {
    badge.classList.add('danger');
  } else {
    badge.classList.remove('danger');
  }
}

// ─────────────────────────────────────────────
//  SORU GÖSTERME
// ─────────────────────────────────────────────

function renderQuestion() {
  const q = state.shuffledQuestions[state.currentQuestion];

  // Soru kartını yenile
  const card = document.getElementById('question-card');
  card.classList.remove('animate-fade-in');
  void card.offsetWidth; // reflow
  card.classList.add('animate-fade-in');

  // Görsel
  const img = document.getElementById('question-image');
  img.src = q.image;
  img.alt = q.question;

  // Rozet
  document.getElementById('question-badge').textContent = q.era || '';

  // Soru metni
  document.getElementById('question-text').textContent = q.question;

  // İlerleme
  const progress = ((state.currentQuestion + 1) / 10) * 100;
  document.getElementById('progress-bar').style.width = `${progress}%`;
  document.getElementById('progress-text').textContent = `${state.currentQuestion + 1} / 10`;

  // Skor
  document.getElementById('correct-count').textContent = state.correct;
  document.getElementById('wrong-count').textContent   = state.wrong;

  // Seçenekleri karıştır
  const shuffledOptions = shuffle(q.options);
  const container = document.getElementById('options-container');
  container.innerHTML = '';

  shuffledOptions.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn animate-bounce-in';
    btn.type = 'button';

    const textSpan = document.createElement('span');
    textSpan.textContent = opt;
    btn.appendChild(textSpan);

    btn.addEventListener('click', () => handleAnswer(opt, q.correct));
    container.appendChild(btn);
  });

  state.isAnswering = false;
}

// ─────────────────────────────────────────────
//  CEVAP İŞLEME
// ─────────────────────────────────────────────

function handleAnswer(selected, correct) {
  if (state.isAnswering) return;
  state.isAnswering = true;

  const isCorrect = selected === correct;
  const buttons   = document.querySelectorAll('.option-btn');

  buttons.forEach(btn => {
    btn.disabled = true;
    const btnText = btn.querySelector('span').textContent;
    if (btnText === correct) {
      btn.classList.add('correct');
    } else if (btnText === selected && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    state.correct++;
    state.score += 10;
  } else {
    state.wrong++;
  }

  // Kısa gecikme sonrası sonraki soruya geç
  setTimeout(() => {
    state.currentQuestion++;
    if (state.currentQuestion >= 10) {
      clearInterval(state.timerInterval);
      endQuiz('complete');
    } else {
      renderQuestion();
    }
  }, 350);
}

// ─────────────────────────────────────────────
//  OYUN BİTİŞİ
// ─────────────────────────────────────────────

function endQuiz(reason) {
  clearInterval(state.timerInterval);
  const elapsed = Date.now() - state.startTime; // ms
  state.elapsedSeconds = elapsed;

  // Bonus: hız skoru (tamamladıysa)
  let finalScore = state.score;
  if (reason === 'complete') {
    const bonusTime = Math.max(0, state.timeLeft);
    finalScore += bonusTime; // kalan her saniye +1 puan bonus
  }

  // Scoreboard'a kaydet
  saveScore({
    name:    state.player.name,
    phone:   state.player.phone,
    score:   finalScore,
    correct: state.correct,
    wrong:   state.wrong,
    elapsed: elapsed,
    reason:  reason,
    date:    new Date().toLocaleDateString('tr-TR'),
  });

  showResultScreen(finalScore, reason, elapsed);
}

// ─────────────────────────────────────────────
//  SONUÇ EKRANI
// ─────────────────────────────────────────────

function showResultScreen(finalScore, reason, elapsedMs) {
  showScreen('screen-result');

  // Emoji & başlık
  const emoji    = document.getElementById('result-emoji');
  const title    = document.getElementById('result-title');
  const subtitle = document.getElementById('result-subtitle');

  if (reason === 'timeout') {
    emoji.textContent    = '⏰';
    title.textContent    = 'Süre Doldu!';
    subtitle.textContent = `${state.currentQuestion} soruda ${state.correct} doğru yaptın.`;
  } else if (state.correct >= 9) {
    emoji.textContent    = '🏆';
    title.textContent    = 'Mükemmel!';
    subtitle.textContent = 'Neredeyse hepsini doğru bildin, olağanüstü!';
  } else if (state.correct >= 6) {
    emoji.textContent    = '🎨';
    title.textContent    = 'Harika!';
    subtitle.textContent = 'Sanat bilgin gerçekten güçlü!';
  } else if (state.correct >= 4) {
    emoji.textContent    = '🖌️';
    title.textContent    = 'İyi Deneme!';
    subtitle.textContent = 'Biraz daha pratik yaparak zirveye çıkabilirsin.';
  } else {
    emoji.textContent    = '🎭';
    title.textContent    = 'Devam Et!';
    subtitle.textContent = 'Sanat keşfi uzun bir yolculuk, tekrar dene!';
  }

  document.getElementById('res-correct').textContent = state.correct;
  document.getElementById('res-wrong').textContent   = reason === 'timeout' ? (10 - state.currentQuestion) + state.wrong : state.wrong;
  document.getElementById('res-time').textContent    = formatTime(elapsedMs);
  document.getElementById('res-score').textContent   = finalScore;

  renderScoreboard(state.player.name);
}

// ─────────────────────────────────────────────
//  LOCALSTORAGE + FIRESTORE SCOREBOARD
// ─────────────────────────────────────────────

const LS_KEY = 'artquiz_scoreboard_v1';

function getScoreboard() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch { return []; }
}

/**
 * Skoru hem localStorage'a hem de Firestore'a kaydeder.
 * Firestore kaydı asenkron çalışır; hata olursa oyun akışını engellemez.
 */
function saveScore(entry) {
  // 1) localStorage'a kaydet (anlık liderlik tablosu için)
  const board = getScoreboard();
  board.push(entry);
  const deduped = deduplicateBoard(board);
  localStorage.setItem(LS_KEY, JSON.stringify(deduped));

  // 2) Firestore'a kaydet (kalıcı veri tabanı)
  saveScoreToFirestore(entry);
}

/** Aynı telefon numarasından birden fazla giriş varsa en yüksek skoru tut */
function deduplicateBoard(board) {
  const map = new Map();
  for (const entry of board) {
    const key = entry.phone;
    if (!map.has(key) || map.get(key).score < entry.score) {
      map.set(key, entry);
    }
  }
  return [...map.values()];
}

function renderScoreboard(currentPlayerName = null) {
  const board   = getScoreboard().sort((a, b) => b.score - a.score);
  const list    = document.getElementById('scoreboard-list');
  const emptyEl = document.getElementById('scoreboard-empty');

  list.innerHTML = '';

  if (board.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  board.forEach((entry, idx) => {
    const rank = idx + 1;
    const isCurrentUser = entry.name === currentPlayerName;

    const row = document.createElement('div');
    row.className = `scoreboard-row${rank <= 3 ? ` rank-${rank}` : ''}${isCurrentUser ? ' current-user' : ''}`;
    row.style.animationDelay = `${idx * 0.06}s`;

    // Rozet
    const rankBadge = document.createElement('div');
    let badgeClass = 'rank-badge';
    if (rank === 1) badgeClass += ' gold';
    else if (rank === 2) badgeClass += ' silver';
    else if (rank === 3) badgeClass += ' bronze';
    rankBadge.className = badgeClass;
    rankBadge.textContent = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

    // İsim + tel + tarih
    const info = document.createElement('div');
    info.style.flex = '1';
    info.style.overflow = 'hidden';
    info.innerHTML = `
      <div class="sb-name">${escapeHtml(entry.name)} ${isCurrentUser ? '<span style="color:#A78BFA;font-size:0.7rem">● Sen</span>' : ''}</div>
      <div class="sb-phone">${maskPhone(entry.phone)} · ${entry.date || ''}</div>
    `;

    // Skor
    const scoreBox = document.createElement('div');
    scoreBox.style.textAlign = 'right';
    scoreBox.innerHTML = `
      <div class="sb-score">${entry.score}</div>
      <div class="sb-score-label">puan</div>
    `;

    row.appendChild(rankBadge);
    row.appendChild(info);
    row.appendChild(scoreBox);
    list.appendChild(row);
  });
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-2);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────
//  BUTON OLAYLARI
// ─────────────────────────────────────────────

// Tekrar oyna – aynı kullanıcı, yeni quiz
document.getElementById('btn-replay').addEventListener('click', () => {
  startQuiz();
});

// Ana sayfa
document.getElementById('btn-home').addEventListener('click', () => {
  showScreen('screen-login');
  inputName.value  = '';
  inputPhone.value = '';
  clearError(inputName, nameError);
  clearError(inputPhone, phoneError);
});

// Scoreboard temizle
document.getElementById('btn-clear-board').addEventListener('click', () => {
  if (confirm('Liderlik tablosunu sıfırlamak istediğine emin misin?')) {
    localStorage.removeItem(LS_KEY);
    renderScoreboard();
  }
});

// Scoreboard'u TXT olarak indir
document.getElementById('btn-export-board').addEventListener('click', exportScoreboard);

function exportScoreboard() {
  const board = getScoreboard().sort((a, b) => b.score - a.score);

  if (board.length === 0) {
    alert('Liderlik tablosunda henüz kayıt yok!');
    return;
  }

  const now     = new Date();
  const dateStr = now.toLocaleDateString('tr-TR');
  const timeStr = now.toLocaleTimeString('tr-TR');

  const separator = '─'.repeat(52);
  const lines = [
    '╔══════════════════════════════════════════════════════╗',
    '║          🎨  ArtQuiz – Liderlik Tablosu              ║',
    '╚══════════════════════════════════════════════════════╝',
    `  Tarih : ${dateStr}   Saat : ${timeStr}`,
    `  Toplam Katılımcı : ${board.length} kişi`,
    separator,
    `  ${'Sıra'.padEnd(5)} ${'İsim Soyisim'.padEnd(22)} ${'Telefon'.padEnd(12)} ${'Skor'.padStart(6)}`,
    separator,
  ];

  board.forEach((entry, idx) => {
    const rank  = String(idx + 1).padEnd(5);
    const name  = entry.name.slice(0, 21).padEnd(22);
    const phone = entry.phone.padEnd(12);
    const score = String(entry.score).padStart(6);
    const medal = idx === 0 ? '[ALTIN]' : idx === 1 ? '[GUMUS]' : idx === 2 ? '[BRONZ]' : '';
    lines.push(`  ${rank} ${name} ${phone} ${score}  ${medal}`);
  });

  lines.push(separator);
  lines.push('');
  lines.push('  Detaylar (Dogru / Yanlis / Sure):');
  lines.push(separator);

  board.forEach((entry, idx) => {
    const elapsed = entry.elapsed ? (entry.elapsed / 1000).toFixed(1) + 's' : '--';
    lines.push(`  #${idx + 1}  ${entry.name} -> ${entry.correct ?? '?'} dogru, ${entry.wrong ?? '?'} yanlis, ${elapsed}`);
  });

  lines.push('');
  lines.push(separator);
  lines.push('  ArtQuiz (c) 2026 - Sanat Kulubu Etkinligi');

  const content = lines.join('\r\n');
  const blob    = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url     = URL.createObjectURL(blob);

  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `ArtQuiz_Liderlik_${dateStr.replace(/\./g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
//  İLK YÜKLEME
// ─────────────────────────────────────────────
showScreen('screen-login');
