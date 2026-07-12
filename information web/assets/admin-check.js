import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      if (data.role === "admin") {
        console.log("Admin verified ✅");
      } else {
        alert("Access denied! Admin only.");
        window.location.href = "login.html";
      }

    } else {
      alert("User data not found!");
      window.location.href = "login.html";
    }

  } else {
    alert("Please login first!");
    window.location.href = "login.html";
  }
});

// LOGOUT
const logoutBtn = document.querySelector("[data-logout]");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      window.location.href = "login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}