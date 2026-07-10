// IMPORT FIREBASE
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// FORM
const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    // LOGIN SA FIREBASE AUTH
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // KUHANIN ROLE SA FIRESTORE
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();

      // 🔥 CHECK ROLE
      if (userData.role === "admin") {
        alert("Login successful (Admin)");
        window.location.href = "admin-dashboard.html";
      } 
      else if (userData.role === "youth") {
        alert("Login successful (Youth)");
        window.location.href = "youth-dashboard.html";
      } 
      else {
        alert("Unknown role!");
      }

    } else {
      alert("No user data found!");
    }

  } catch (error) {
    alert("Error: " + error.message);
  }
});