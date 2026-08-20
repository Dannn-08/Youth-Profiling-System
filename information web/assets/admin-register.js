import {
  auth,
  db,
  secondaryAuth
} from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  logActivity
} from "./audit-log.js";


// =====================================================
// ELEMENTS
// =====================================================

const form =
  document.getElementById(
    "adminRegisterForm"
  );

const submitBtn =
  form?.querySelector(
    'button[type="submit"]'
  );


// =====================================================
// FORM CHECK
// =====================================================

if (!form || !submitBtn) {

  console.error(
    "Admin registration form not found."
  );

} else {

  // ===================================================
  // ADMIN REGISTRATION
  // ===================================================

  form.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      // =================================================
      // CURRENT ADMIN CHECK
      // =================================================

      const currentAdmin =
        auth.currentUser;


      if (!currentAdmin) {

        alert(
          "Your admin session has expired. Please log in again."
        );

        window.location.replace(
          "login.html"
        );

        return;

      }


      // =================================================
      // GET FORM VALUES
      // =================================================

      const fullNameInput =
        form.querySelector(
          '[name="fullName"]'
        );

      const emailInput =
        form.querySelector(
          '[name="email"]'
        );

      const passwordInput =
        form.querySelector(
          '[name="password"]'
        );


      const fullName =
        fullNameInput?.value.trim() || "";

      const email =
        emailInput?.value.trim().toLowerCase() || "";

      const password =
        passwordInput?.value || "";


      // =================================================
      // BASIC VALIDATION
      // =================================================

      if (
        !fullName ||
        !email ||
        !password
      ) {

        alert(
          "Please complete all required fields."
        );

        return;

      }


      if (
        password.length < 8
      ) {

        alert(
          "Password must contain at least 8 characters."
        );

        return;

      }


      // =================================================
      // DISABLE BUTTON
      // =================================================

      submitBtn.disabled =
        true;

      submitBtn.textContent =
        "Creating account...";


      let newUser = null;


      try {

        // =================================================
        // CREATE ADMIN USING SECONDARY AUTH
        // =================================================
        //
        // IMPORTANT:
        // We use secondaryAuth here so the currently
        // logged-in administrator remains logged in.
        // =================================================

        const userCredential =
          await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
          );


        newUser =
          userCredential.user;


        console.log(
          "New Firebase admin account created:",
          newUser.uid
        );


        // =================================================
        // CREATE ADMIN PROFILE IN FIRESTORE
        // =================================================

        await setDoc(
          doc(
            db,
            "users",
            newUser.uid
          ),
          {

            uid:
              newUser.uid,

            fullName:
              fullName,

            email:
              newUser.email,

            role:
              "admin",

            status:
              "Active",

            createdBy:
              currentAdmin.uid,

            createdByEmail:
              currentAdmin.email,

            createdAt:
              serverTimestamp()

          }
        );


        console.log(
          "Admin Firestore profile created."
        );


        // =================================================
        // LOG ACTIVITY
        // =================================================

        try {

          await logActivity({

            email:
              currentAdmin.email,

            role:
              "admin",

            activity:
              "Created new admin account",

            details:
              `Created administrator account for ${newUser.email}`

          });

        } catch (auditError) {

          // Do not fail the whole registration
          // if audit logging has a separate problem.

          console.error(
            "Audit log error:",
            auditError
          );

        }


        // =================================================
        // SIGN OUT SECONDARY AUTH ONLY
        // =================================================

        await signOut(
          secondaryAuth
        );


        // =================================================
        // SUCCESS
        // =================================================

        alert(
          "Admin account created successfully!"
        );


        form.reset();


        window.location.replace(
          "admin-dashboard.html"
        );


      } catch (error) {

        console.error(
          "Admin registration error:",
          error
        );


        // =================================================
        // CLEAN SECONDARY SESSION
        // =================================================

        try {

          if (
            secondaryAuth.currentUser
          ) {

            await signOut(
              secondaryAuth
            );

          }

        } catch (secondaryLogoutError) {

          console.error(
            "Secondary auth cleanup error:",
            secondaryLogoutError
          );

        }


        // =================================================
        // FRIENDLY ERROR MESSAGE
        // =================================================

        let message =
          "Something went wrong while creating the admin account. Please try again.";


        if (
          error.code ===
          "auth/email-already-in-use"
        ) {

          message =
            "This email address is already registered.";

        }

        else if (
          error.code ===
          "auth/weak-password"
        ) {

          message =
            "Password is too weak. Use at least 8 characters.";

        }

        else if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "Please enter a valid email address.";

        }

        else if (
          error.code ===
          "auth/network-request-failed"
        ) {

          message =
            "Network error. Please check your internet connection.";

        }

        else if (
          error.code ===
          "auth/operation-not-allowed"
        ) {

          message =
            "Email/password registration is not enabled in Firebase Authentication.";

        }

        else if (
          error.code ===
          "permission-denied" ||
          error.code ===
          "firestore/permission-denied"
        ) {

          message =
            "Your account does not have permission to create another administrator.";

        }


        alert(
          message
        );


      } finally {

        // =================================================
        // RESTORE BUTTON
        // =================================================

        submitBtn.disabled =
          false;

        submitBtn.textContent =
          "Register as Admin";

      }

    }
  );

}