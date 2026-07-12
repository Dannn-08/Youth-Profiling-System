import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

const form = document.getElementById("loginForm");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // check role in Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("No profile found for this account. Please contact the administrator.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
      return;
    }

    const role = userDoc.data().role;

    if (role === "admin") {
      await logActivity({ email: user.email, role: "admin", activity: "Logged in" });
      window.location.href = "admin-dashboard.html";
    } else if (role === "youth") {
      await logActivity({ email: user.email, role: "youth", activity: "Logged in" });
      window.location.href = "youth-dashboard.html";
    } else {
      alert("Unknown account role. Please contact the administrator.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
    }

  } catch (error) {
    console.log(error.code);
    console.log(error.message);

    let message = "Something went wrong while logging in. Please try again.";

    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
      message = "Incorrect email or password.";
    } else if (error.code === "auth/user-not-found") {
      message = "No account is registered with this email.";
    } else if (error.code === "auth/too-many-requests") {
      message = "Too many failed attempts. Please try again later.";
    } else if (error.code === "auth/invalid-email") {
      message = "The email you entered is not valid.";
    } else if (error.code === "auth/user-disabled") {
      message = "This account has been disabled. Please contact the administrator.";
    }

    alert(message);

    submitBtn.disabled = false;
    submitBtn.textContent = "Login";
  }
});