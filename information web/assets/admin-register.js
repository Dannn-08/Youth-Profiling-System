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

      const positionInput =
        form.querySelector(
          '[name="position"]'
        );

      const emailInput =
        form.querySelector(
          '[name="email"]'
        );

      const passwordInput =
        form.querySelector(
          '[name="password"]'
        );

      const confirmPasswordInput =
        form.querySelector(
          '[name="confirmPassword"]'
        );


      const fullName =
        fullNameInput?.value
          .trim() || "";

      const position =
        positionInput?.value
          .trim() || "";

      const email =
        emailInput?.value
          .trim()
          .toLowerCase() || "";

      const password =
        passwordInput?.value || "";

      const confirmPassword =
        confirmPasswordInput?.value || "";


      // =================================================
      // BASIC VALIDATION
      // =================================================

      if (
        !fullName ||
        !position ||
        !email ||
        !password ||
        !confirmPassword
      ) {

        alert(
          "Please complete all required fields."
        );

        return;

      }


      // =================================================
      // PASSWORD LENGTH
      // =================================================

      if (
        password.length < 8
      ) {

        alert(
          "Password must contain at least 8 characters."
        );

        return;

      }


      // =================================================
      // PASSWORD MATCH
      // =================================================

      if (
        password !==
        confirmPassword
      ) {

        alert(
          "Password and Confirm Password do not match."
        );

        confirmPasswordInput?.focus();

        return;

      }


      // =================================================
      // VALID SK POSITION
      // =================================================

      const allowedPositions = [
        "SK Chairperson",
        "SK Kagawad",
        "SK Secretary",
        "SK Treasurer",
        "Administrator"
      ];


      if (
        !allowedPositions.includes(
          position
        )
      ) {

        alert(
          "Please select a valid SK position."
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
        // secondaryAuth is used so the currently signed-in
        // administrator remains logged in.
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
          "New Firebase SK admin account created:",
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

            position:
              position,

            status:
              "Active",

            createdBy:
              currentAdmin.uid,

            createdByEmail:
              currentAdmin.email,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()

          }
        );


        console.log(
          "SK administrator Firestore profile created."
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
              "Created new SK admin account",

            details:
              `Created ${position} account for ${fullName} (${newUser.email})`

          });

        } catch (auditError) {

          // Registration should still succeed
          // even if audit logging fails.

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
          `${fullName} has been registered successfully as ${position}.`
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

        } catch (
          secondaryLogoutError
        ) {

          console.error(
            "Secondary auth cleanup error:",
            secondaryLogoutError
          );

        }


        // =================================================
        // FRIENDLY ERROR MESSAGE
        // =================================================

        let message =
          "Something went wrong while creating the SK administrator account. Please try again.";


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
          "Create SK Admin Account";

      }

    }
  );

}