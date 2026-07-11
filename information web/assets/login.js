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

console.log("Logged in UID:", user.uid);

const userRef = doc(db, "users", user.uid);
const userSnap = await getDoc(userRef);

console.log("Document exists:", userSnap.exists());

if (userSnap.exists()) {
    const userData = userSnap.data();

    console.log("User Data:", userData);
    console.log("Role:", userData.role);

    if (userData.role === "admin") {
        console.log("Redirecting to admin...");
        window.location.href = "admin-dashboard.html";
    } else if (userData.role === "youth") {
        console.log("Redirecting to youth...");
        window.location.href = "youth-dashboard.html";
    } else {
        alert("Unknown role");
    }
} else {
    alert("No user data found!");
}

  } catch (error) {
    alert("Error: " + error.message);
  }
});