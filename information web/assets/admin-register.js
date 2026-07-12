import { auth, db, secondaryAuth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

const form = document.getElementById("adminRegisterForm");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.querySelector('[name="fullName"]').value.trim();
  const email = document.querySelector('[name="email"]').value.trim();
  const password = document.querySelector('[name="password"]').value;
  // NOTE: the security code itself is no longer the gatekeeper here — actual
  // access to this page is already restricted to logged-in admins by
  // admin-check.js and by the Firestore rules. This field can still be kept
  // as an extra manual step/log if you want, but it is not verified below.

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    // Create the new admin account on the SECONDARY auth instance so the
    // currently logged-in admin (on the primary "auth") stays signed in.
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;

    // Save the new admin's profile using the PRIMARY db/auth, so this write
    // is performed as the currently logged-in admin (required by the
    // Firestore rules for creating another admin's document).
    await setDoc(doc(db, "users", newUser.uid), {
      fullName,
      email: newUser.email,
      role: "admin",
      createdAt: new Date()
    });

    // Clean up: sign the newly created account out of the secondary
    // instance so it doesn't linger as an active session anywhere.
    await signOut(secondaryAuth);

    await logActivity({
      email: auth.currentUser?.email,
      role: "admin",
      activity: "Created new admin account",
      details: newUser.email
    });

    alert("Admin account created successfully!");
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.log(error.code);
    console.log(error.message);

    let message = "Something went wrong while creating the account. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email is already registered.";
    } else if (error.code === "auth/weak-password") {
      message = "Password is too weak. Use at least 8 characters.";
    } else if (error.code === "auth/invalid-email") {
      message = "The email you entered is not valid.";
    } else if (error.code === "permission-denied") {
      message = "You don't have permission to create an admin account.";
    }

    alert(message);

    submitBtn.disabled = false;
    submitBtn.textContent = "Register as Admin";
  }
});