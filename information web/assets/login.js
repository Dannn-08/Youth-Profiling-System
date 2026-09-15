import { auth, db } from "./firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  logActivity
} from "./audit-log.js";


// =====================================================
// LOGIN ELEMENTS
// =====================================================

const form =
  document.getElementById(
    "loginForm"
  );


const submitBtn =
  form.querySelector(
    'button[type="submit"]'
  );


const emailInput =
  document.getElementById(
    "email"
  );


const passwordInput =
  document.getElementById(
    "password"
  );


const termsAgreement =
  document.getElementById(
    "termsAgreement"
  );


// =====================================================
// FORGOT PASSWORD ELEMENTS
// =====================================================

const forgotPasswordBtn =
  document.getElementById(
    "forgotPasswordBtn"
  );


const forgotPasswordModal =
  document.getElementById(
    "forgotPasswordModal"
  );


const forgotPasswordBackdrop =
  document.getElementById(
    "forgotPasswordBackdrop"
  );


const closeForgotPassword =
  document.getElementById(
    "closeForgotPassword"
  );


const cancelForgotPassword =
  document.getElementById(
    "cancelForgotPassword"
  );


const resetEmail =
  document.getElementById(
    "resetEmail"
  );


const sendResetBtn =
  document.getElementById(
    "sendResetBtn"
  );


const forgotPasswordMessage =
  document.getElementById(
    "forgotPasswordMessage"
  );


// =====================================================
// RESTORE LOGIN BUTTON
// =====================================================

function restoreLoginButton() {

  submitBtn.disabled =
    false;


  submitBtn.innerHTML = `
    <span class="access-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M9 18l6-6-6-6"></path>
        <path d="M15 12H3"></path>
        <path d="M15 4h5v16h-5"></path>
      </svg>
    </span>

    <span>
      Access Portal
    </span>
  `;

}


// =====================================================
// LOGIN LOADING STATE
// =====================================================

function setLoginLoading() {

  submitBtn.disabled =
    true;


  submitBtn.innerHTML = `
    <span class="portal-login-spinner"></span>

    <span>
      Verifying Access...
    </span>
  `;

}


// =====================================================
// BACKGROUND AUDIT LOG
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
// FORGOT PASSWORD MODAL
// =====================================================

function openForgotPasswordModal() {

  if (!forgotPasswordModal) {
    return;
  }


  // Use email already entered on Login page
  // as the default reset email.

  if (
    resetEmail &&
    emailInput
  ) {

    resetEmail.value =
      emailInput.value.trim();

  }


  if (forgotPasswordMessage) {

    forgotPasswordMessage.textContent =
      "";

    forgotPasswordMessage.className =
      "forgot-password-message";

  }


  forgotPasswordModal.classList.add(
    "active"
  );


  forgotPasswordModal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "forgot-password-open"
  );


  setTimeout(
    () => {

      if (resetEmail) {
        resetEmail.focus();
      }

    },
    100
  );

}


// =====================================================
// CLOSE FORGOT PASSWORD MODAL
// =====================================================

function closeForgotPasswordModal() {

  if (!forgotPasswordModal) {
    return;
  }


  forgotPasswordModal.classList.remove(
    "active"
  );


  forgotPasswordModal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "forgot-password-open"
  );


  if (forgotPasswordMessage) {

    forgotPasswordMessage.textContent =
      "";

    forgotPasswordMessage.className =
      "forgot-password-message";

  }

}


// =====================================================
// SHOW RESET MESSAGE
// =====================================================

function showResetMessage(
  message,
  type = ""
) {

  if (!forgotPasswordMessage) {
    return;
  }


  forgotPasswordMessage.textContent =
    message;


  forgotPasswordMessage.className =
    "forgot-password-message";


  if (type) {

    forgotPasswordMessage.classList.add(
      type
    );

  }

}


// =====================================================
// RESTORE RESET BUTTON
// =====================================================

function restoreResetButton() {

  if (!sendResetBtn) {
    return;
  }


  sendResetBtn.disabled =
    false;


  sendResetBtn.innerHTML = `
    <span class="forgot-send-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M22 2 11 13"></path>
        <path d="m22 2-7 20-4-9-9-4z"></path>
      </svg>
    </span>

    <span>
      Send Reset Link
    </span>
  `;

}


// =====================================================
// RESET BUTTON LOADING
// =====================================================

function setResetLoading() {

  if (!sendResetBtn) {
    return;
  }


  sendResetBtn.disabled =
    true;


  sendResetBtn.innerHTML = `
    <span class="portal-login-spinner"></span>

    <span>
      Sending...
    </span>
  `;

}


// =====================================================
// OPEN FORGOT PASSWORD
// =====================================================

if (forgotPasswordBtn) {

  forgotPasswordBtn.addEventListener(
    "click",
    openForgotPasswordModal
  );

}


// =====================================================
// CLOSE FORGOT PASSWORD
// =====================================================

if (closeForgotPassword) {

  closeForgotPassword.addEventListener(
    "click",
    closeForgotPasswordModal
  );

}


if (cancelForgotPassword) {

  cancelForgotPassword.addEventListener(
    "click",
    closeForgotPasswordModal
  );

}


if (forgotPasswordBackdrop) {

  forgotPasswordBackdrop.addEventListener(
    "click",
    closeForgotPasswordModal
  );

}


// =====================================================
// SEND PASSWORD RESET EMAIL
// =====================================================

if (sendResetBtn) {

  sendResetBtn.addEventListener(
    "click",
    async () => {

      const email =
        resetEmail
          ? resetEmail.value.trim()
          : "";


      // =================================================
      // EMPTY EMAIL
      // =================================================

      if (!email) {

        showResetMessage(
          "Please enter your registered email address.",
          "error"
        );


        if (resetEmail) {
          resetEmail.focus();
        }


        return;

      }


      // =================================================
      // BASIC EMAIL VALIDATION
      // =================================================

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(email)
      ) {

        showResetMessage(
          "Please enter a valid email address.",
          "error"
        );


        if (resetEmail) {
          resetEmail.focus();
        }


        return;

      }


      setResetLoading();


      showResetMessage(
        ""
      );


      try {

        // =================================================
        // FIREBASE PASSWORD RESET
        // =================================================

        await sendPasswordResetEmail(
          auth,
          email
        );


        showResetMessage(
          "Password reset email sent. Please check your inbox and follow the reset link.",
          "success"
        );


        // Also copy it back to the Login email field.

        if (emailInput) {

          emailInput.value =
            email;

        }


      } catch (error) {

        console.error(
          "Password reset error:",
          error
        );


        let message =
          "Unable to send the password reset email. Please try again.";


        // =================================================
        // RESET PASSWORD ERRORS
        // =================================================

        if (
          error.code ===
          "auth/invalid-email"
        ) {

          message =
            "The email address you entered is not valid.";

        }

        else if (
          error.code ===
          "auth/too-many-requests"
        ) {

          message =
            "Too many password reset attempts. Please wait a while and try again.";

        }

        else if (
          error.code ===
          "auth/network-request-failed"
        ) {

          message =
            "Network connection problem. Please check your internet connection and try again.";

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
          "auth/user-not-found"
        ) {

          // Generic message to avoid exposing
          // whether an account exists.

          message =
            "If an account is registered with this email, a password reset message will be sent.";

        }


        showResetMessage(
          message,
          error.code === "auth/user-not-found"
            ? "success"
            : "error"
        );


      } finally {

        restoreResetButton();

      }

    }
  );

}


// =====================================================
// ENTER KEY INSIDE RESET EMAIL
// =====================================================

if (resetEmail) {

  resetEmail.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();


        if (sendResetBtn) {

          sendResetBtn.click();

        }

      }

    }
  );

}


// =====================================================
// ESCAPE KEY FOR RESET MODAL
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      forgotPasswordModal &&
      forgotPasswordModal.classList.contains(
        "active"
      )
    ) {

      closeForgotPasswordModal();

    }

  }
);


// =====================================================
// LOGIN
// =====================================================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    // =================================================
    // TERMS & PRIVACY AGREEMENT
    // =================================================

    if (
      !termsAgreement ||
      !termsAgreement.checked
    ) {

      alert(
        "Please read and agree to the Terms and Conditions and Privacy Notice before accessing the portal."
      );


      if (termsAgreement) {

        termsAgreement.focus();

      }


      return;

    }


    const email =
      emailInput
        .value
        .trim();


    const password =
      passwordInput
        .value;


    // =================================================
    // PREVENT MULTIPLE LOGIN CLICKS
    // =================================================

    setLoginLoading();


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

      if (
        !userDoc.exists()
      ) {

        await signOut(
          auth
        );


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


        await signOut(
          auth
        );


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

  // ===============================================
  // NORMALIZE ADMIN STATUS
  // ===============================================

  const adminStatus =
    String(
      status || "Active"
    )
      .trim()
      .toLowerCase();


  // ===============================================
  // BLOCK INACTIVE ADMIN
  // ===============================================

  if (
    adminStatus !== "active"
  ) {

    try {

      await logActivity({

        email:
          user.email,

        role:
          "admin",

        activity:
          "Login blocked",

        details:
          `Administrator account status: ${status || "Inactive"}`

      });

    } catch (auditError) {

      console.error(
        "Audit log error:",
        auditError
      );

    }


    await signOut(
      auth
    );


    alert(
      "Your administrator account is currently inactive. Please contact an authorized SK administrator."
    );


    restoreLoginButton();


    return;

  }


  // ===============================================
  // ACTIVE ADMIN LOGIN
  // ===============================================

  logActivityInBackground({

    email:
      user.email,

    role:
      "admin",

    activity:
      "Logged in",

    details:
      `Admin login successful${
        userData.position
          ? ` - ${userData.position}`
          : ""
      }`

  });


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

      await signOut(
        auth
      );


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