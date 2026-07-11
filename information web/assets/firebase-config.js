import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFkzBqpTuol1y_xkBucPBZ1R0qqXuQxEE",
  authDomain: "bukal-youth-data.firebaseapp.com",
  projectId: "bukal-youth-data",
  storageBucket: "bukal-youth-data.firebasestorage.app",
  messagingSenderId: "319242252308",
  appId: "1:319242252308:web:9885a77fe5d79f1ddb7701"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);