// ============================================================
//  firebase.js – ArtQuiz Firebase Yapılandırması
//  Kendi Firebase Console'undaki config bilgilerini aşağıya yapıştır.
// ============================================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:            "AIzaSyCQ1keqvYLReiKI3Mm1aG9IlMk9EVp9pfE",
  authDomain:        "start-c748e.firebaseapp.com",
  databaseURL:       "https://start-c748e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "start-c748e",
  storageBucket:     "start-c748e.appspot.com",
  messagingSenderId: "79057303135",
  appId:             "1:79057303135:web:72bbae06c7d765a4ac8dea",
  measurementId:     "G-PF63SXXZQF"
};

// Initialize Firebase
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getFirestore(app);

// ─────────────────────────────────────────────
//  saveScoreToFirestore
//  Oyun bittiğinde çağrılır; "scoreboard" koleksiyonuna yeni belge ekler.
//
//  @param {Object} entry  – { name, phone, score, correct, wrong, elapsed, reason, date }
//  @returns {Promise<void>}
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
    // Firestore hatası oyun akışını engellememeli; sadece logla
    console.error("[ArtQuiz] ❌ Firestore kayıt hatası:", err.code, err.message);
  }
}
