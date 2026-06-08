// ============================================================
//  firebase.js – ArtQuiz Firebase Yapılandırması
// ============================================================

import { initializeApp }                          from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
                                                  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config (Firebase Console'dan alınan)
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

// Firebase & Firestore başlat
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─────────────────────────────────────────────
//  saveScoreToFirestore
//  Oyun bittiğinde çağrılır; "scoreboard" koleksiyonuna yeni belge ekler.
//
//  @param {Object} entry – { name, phone, score, correct, wrong, elapsed, reason, date }
// ─────────────────────────────────────────────
export async function saveScoreToFirestore(entry) {
  try {
    console.log("[ArtQuiz] Firestore'a kayıt gönderiliyor...", entry);
    const docRef = await addDoc(collection(db, "scoreboard"), {
      name:      entry.name,
      phone:     entry.phone,
      score:     entry.score,
      correct:   entry.correct,
      wrong:     entry.wrong,
      elapsed:   entry.elapsed,   // ms cinsinden toplam süre
      reason:    entry.reason,    // 'complete' | 'timeout'
      date:      entry.date,
      createdAt: serverTimestamp(),
    });
    console.log("[ArtQuiz] ✅ Skor Firestore'a kaydedildi! Belge ID:", docRef.id);
  } catch (err) {
    console.error("[ArtQuiz] ❌ Firestore kayıt hatası:", err.code, err.message);
  }
}
