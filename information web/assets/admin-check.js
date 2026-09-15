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
// SAFE SIGN OUT + REDIRECT
// =====================================================

async function denyAdminAccess(
  message = "",
  showAlert = true
) {

  if (isLoggingOut) {
    return;
  }

  isLoggingOut = true;


  if (
    showAlert &&
    message
  ) {

    alert(message);

  }


  try {

    await signOut(auth);

  } catch (error) {

    console.error(
      "Sign out during access denial failed:",
      error
    );

  }


  window.location.replace(
    "login.html"
  );

}


// =====================================================
// AUTHENTICATION / ADMIN ACCESS CHECK
// =====================================================

onAuthStateChanged(
  auth,
  async (user) => {

    // Logout is already running.
    if (isLoggingOut) {
      return;
    }


    // ===================================================
    // NO USER SESSION
    // ===================================================

    if (!user) {

      console.log(
        "No authenticated admin session."
      );


      window.location.replace(
        "login.html"
      );


      return;

    }


    try {

      // =================================================
      // GET USER PROFILE
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
      // PROFILE NOT FOUND
      // =================================================

      if (!docSnap.exists()) {

        console.warn(
          "Authenticated account has no Firestore user profile."
        );


        await denyAdminAccess(
          "Your user profile could not be found. Please contact the system administrator."
        );


        return;

      }


      const data =
        docSnap.data();


      // =================================================
      // VERIFY ROLE
      // =================================================

      if (
        data.role !==
        "admin"
      ) {

        console.warn(
          "Access denied. Account role:",
          data.role
        );


        await denyAdminAccess(
          "Access denied. An administrator account is required."
        );


        return;

      }


      // =================================================
      // VERIFY ADMIN STATUS
      // =================================================
      //
      // Old admin records without a status field are
      // treated as Active for backward compatibility.
      // =================================================

      const status =
        String(
          data.status ||
          "Active"
        )
          .trim()
          .toLowerCase();


      if (
        status !==
        "active"
      ) {

        console.warn(
          "Inactive administrator attempted to access admin page:",
          user.email
        );


        await denyAdminAccess(
          "Your administrator account is currently inactive. Please contact an authorized SK administrator."
        );


        return;

      }


      // =================================================
      // ACCESS GRANTED
      // =================================================

      console.log(
        "Active administrator verified ✅",
        {
          fullName:
            data.fullName ||
            "",

          position:
            data.position ||
            "Administrator",

          email:
            user.email
        }
      );

  } catch (error) {

      console.error(
        "Admin authentication check failed:",
        error
      );


      await denyAdminAccess(
        "Unable to verify your administrator account. Please log in again."
      );

    }

  }
);


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


      const originalContent =
        logoutBtn.innerHTML;


      logoutBtn.textContent =
        "Logging out...";


      try {

        // =================================================
        // CLEAR AUTH SESSION
        // =================================================

        await signOut(auth);


        console.log(
          "Administrator logged out successfully."
        );


        // =================================================
        // REDIRECT
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


        logoutBtn.innerHTML =
          originalContent;

      }

    }
  );

}