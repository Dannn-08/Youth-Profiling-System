import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("adminRegisterForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔥 SAVE SA FIRESTORE
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      role: "admin",
      createdAt: new Date()
    });

    alert("Admin registered successfully!");

    // 🔥 mas recommended: sa login muna
    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
});