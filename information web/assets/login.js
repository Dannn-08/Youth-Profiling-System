import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  logActivity
} from "./audit-log.js";


// =====================================================
// ELEMENTS
// =====================================================

const form =
  document.getElementById(
    "loginForm"
  );


const submitBtn =
  form.querySelector(
    'button[type="submit"]'
  );


// =====================================================
// RESTORE LOGIN BUTTON
// =====================================================

function restoreLoginButton() {

  submitBtn.disabled =
    false;


  submitBtn.textContent =
    "Login";

}


// =====================================================
// BACKGROUND AUDIT LOG
// =====================================================
//
// This records the activity WITHOUT forcing
// the user to wait before dashboard redirect.
//
// =====================================================

function logActivityInBackground(data) {

  logActivity(data)
    .catch(error => {

      console.error(
        "Audit log error:",
        error
      );

    });

}


// =====================================================
// LOGIN
// =====================================================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const email =
      document
        .getElementById("email")
        .value
        .trim();


    const password =
      document
        .getElementById("password")
        .value;


    // Prevent multiple login clicks
    submitBtn.disabled =
      true;


    submitBtn.textContent =
      "Logging in...";


    try {

      // =================================================
      // FIREBASE AUTHENTICATION
      // =================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // =================================================
      // GET USER PROFILE / ROLE
      // =================================================
      //
      // This Firestore request is necessary because
      // role and youth status are stored in users/{uid}.
      //
      // =================================================

      const userDoc =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );


      // =================================================
      // PROFILE NOT FOUND
      // =================================================

      if (!userDoc.exists()) {

        await signOut(auth);


        alert(
          "No profile found for this account. Please register again or contact the administrator."
        );


        restoreLoginButton();


        return;

      }


      const userData =
        userDoc.data();


      const role =
        userData.role;


      const status =
        userData.status;


      // =================================================
      // BLOCK INACTIVE / ARCHIVED YOUTH
      // =================================================

      if (
        role === "youth" &&
        (
          status === "Inactive" ||
          userData.eligibility === "Archived"
        )
      ) {

        // Keep this awaited because login is being denied,
        // so there is no need to optimize a dashboard redirect.

        try {

          await logActivity({

            email:
              user.email,

            role:
              "youth",

            activity:
              "Login blocked",

            details:
              "Inactive / Archived youth account"

          });

        } catch (auditError) {

          console.error(
            "Audit log error:",
            auditError
          );

        }


        await signOut(auth);


        alert(
          "Your youth account is currently inactive or archived. Please contact the administrator."
        );


        restoreLoginButton();


        return;

      }


      // =================================================
      // ADMIN LOGIN
      // =================================================

      if (
        role === "admin"
      ) {

        // Do NOT await this.
        // Let audit logging run separately.

        logActivityInBackground({

          email:
            user.email,

          role:
            "admin",

          activity:
            "Logged in",

          details:
            "Admin login successful"

        });


        // replace() is slightly cleaner for authentication
        // pages because Login won't stay in browser history.

        window.location.replace(
          "admin-dashboard.html"
        );


        return;

      }


      // =================================================
      // YOUTH LOGIN
      // =================================================

      if (
        role === "youth"
      ) {

        // Do NOT await this.
        // Redirect immediately after verification.

        logActivityInBackground({

          email:
            user.email,

          role:
            "youth",

          activity:
            "Logged in",

          details:
            "Youth login successful"

        });


        window.location.replace(
          "youth-dashboard.html"
        );


        return;

      }


      // =================================================
      // UNKNOWN ROLE
      // =================================================

      await signOut(auth);


      alert(
        "Unknown account role. Please contact the administrator."
      );


      restoreLoginButton();


    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      console.log(
        error.code
      );


      console.log(
        error.message
      );


      let message =
        "Something went wrong while logging in. Please try again.";


      // =================================================
      // FIREBASE AUTH ERRORS
      // =================================================

      if (
        error.code ===
          "auth/invalid-credential" ||
        error.code ===
          "auth/wrong-password"
      ) {

        message =
          "Incorrect email or password.";

      }

      else if (
        error.code ===
        "auth/user-not-found"
      ) {

        message =
          "No account is registered with this email.";

      }

      else if (
        error.code ===
        "auth/too-many-requests"
      ) {

        message =
          "Too many failed attempts. Please try again later.";

      }

      else if (
        error.code ===
        "auth/invalid-email"
      ) {

        message =
          "The email you entered is not valid.";

      }

      else if (
        error.code ===
        "auth/user-disabled"
      ) {

        message =
          "This account has been disabled. Please contact the administrator.";

      }

      else if (
        error.code ===
        "auth/network-request-failed"
      ) {

        message =
          "Network connection problem. Please check your internet connection and try again.";

      }


      alert(
        message
      );


      restoreLoginButton();

    }

  }
);