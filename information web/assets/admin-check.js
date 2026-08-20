import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// =====================================================
// LOGOUT STATE
// =====================================================

let isLoggingOut = false;


// =====================================================
// AUTHENTICATION / ADMIN ACCESS CHECK
// =====================================================

onAuthStateChanged(auth, async (user) => {

  // If logout is currently in progress,
  // do not run another redirect or alert.
  if (isLoggingOut) {
    return;
  }


  // ===================================================
  // NO USER SESSION
  // ===================================================

  if (!user) {

    console.log("No authenticated admin session.");

    window.location.replace("login.html");

    return;
  }


  try {

    // =================================================
    // GET USER PROFILE FROM FIRESTORE
    // =================================================

    const docRef =
      doc(
        db,
        "users",
        user.uid
      );


    const docSnap =
      await getDoc(
        docRef
      );


    // =================================================
    // USER PROFILE NOT FOUND
    // =================================================

    if (!docSnap.exists()) {

      console.log(
        "User profile not found in Firestore."
      );


      await signOut(auth);


      window.location.replace(
        "login.html"
      );


      return;

    }


    const data =
      docSnap.data();


    // =================================================
    // ADMIN ROLE VERIFIED
    // =================================================

    if (
      data.role === "admin"
    ) {

      console.log(
        "Admin verified ✅"
      );


      return;

    }


    // =================================================
    // WRONG ROLE
    // =================================================

    console.log(
      "Access denied. Account is not an admin."
    );


    alert(
      "Access denied! Admin account required."
    );


    await signOut(auth);


    window.location.replace(
      "login.html"
    );


  } catch (error) {

    console.error(
      "Admin authentication check failed:",
      error
    );


    alert(
      "Unable to verify your account. Please log in again."
    );


    try {

      await signOut(auth);

    } catch (signOutError) {

      console.error(
        "Sign out error:",
        signOutError
      );

    }


    window.location.replace(
      "login.html"
    );

  }

});


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
  document.querySelector(
    "[data-logout]"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      // Prevent multiple logout clicks
      if (isLoggingOut) {
        return;
      }


      isLoggingOut =
        true;


      logoutBtn.disabled =
        true;


      const originalText =
        logoutBtn.textContent;


      logoutBtn.textContent =
        "Logging out...";


      try {

        // =================================================
        // CLEAR FIREBASE AUTH SESSION
        // =================================================

        await signOut(auth);


        console.log(
          "Admin logged out successfully."
        );


        // =================================================
        // REDIRECT TO LOGIN
        // =================================================

        window.location.replace(
          "login.html"
        );


      } catch (error) {

        console.error(
          "Logout error:",
          error
        );


        alert(
          "Unable to log out. Please try again."
        );


        isLoggingOut =
          false;


        logoutBtn.disabled =
          false;


        logoutBtn.textContent =
          originalText;

      }

    }
  );

}