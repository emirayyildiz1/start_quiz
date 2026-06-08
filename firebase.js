// ============================================================
//  firebase.js – ArtQuiz Firebase Yapılandırması
//  Realtime Database kullanır
// ============================================================

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey:            "AIzaSyCQ1keqvYLReiKI3Mm1aG9IlMk9EVp9pfE",
  authDomain:        "start-c748e.firebaseapp.com",
  databaseURL:       "https://start-c748e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "start-c748e",
  storageBucket:     "start-c748e.firebasestorage.app",
  messagingSenderId: "79057303135",
  appId:             "1:79057303135:web:72bbae06c7d765a4ac8dea",
  measurementId:     "G-PF63SXXZQF"
};

// Firebase & Realtime Database başlat
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─────────────────────────────────────────────
//  saveScoreToFirestore
//  Oyun bittiğinde çağrılır; "scoreboard" düğümüne yeni kayıt ekler.
//
//  @param {Object} entry – { name, phone, score, correct, wrong, elapsed, reason, date }
// ─────────────────────────────────────────────
export async function saveScoreToFirestore(entry) {
  try {
    console.log("[ArtQuiz] Realtime Database'e kayıt gönderiliyor...", entry);
    const scoreboardRef = ref(db, "scoreboard");
    const newRef = await push(scoreboardRef, {
      name:      entry.name,
      phone:     entry.phone,
      score:     entry.score,
      correct:   entry.correct,
      wrong:     entry.wrong,
      elapsed:   entry.elapsed,
      reason:    entry.reason,
      date:      entry.date,
      createdAt: Date.now(),        // Realtime DB serverTimestamp farklı çalışır
    });
    console.log("[ArtQuiz] ✅ Skor kaydedildi! Key:", newRef.key);
  } catch (err) {
    console.error("[ArtQuiz] ❌ Database kayıt hatası:", err.code, err.message);
  }
}
