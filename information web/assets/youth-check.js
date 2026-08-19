import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

  if (user) {

    try {

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        const data = docSnap.data();

        if (data.role === "youth") {

          // Check if youth account is active
          if (
            data.status === "Inactive" ||
            data.eligibility === "Archived"
          ) {

            alert(
              "Your youth account is inactive or archived. Please contact the administrator."
            );

            await signOut(auth);

            window.location.href = "login.html";

            return;
          }

          console.log("Youth verified ✅");
          console.log("UID:", user.uid);
          console.log("Email:", user.email);
          console.log("Status:", data.status || "Active");

        } else {

          alert("Access denied! Youth only.");

          await signOut(auth);

          window.location.href = "login.html";

        }

      } else {

        console.log(
          "Authentication user exists but Firestore profile was not found."
        );

        console.log(
          "UID:",
          user.uid
        );

        alert(
          "User profile data was not found. Please contact the administrator."
        );

        await signOut(auth);

        window.location.href = "login.html";

      }

    } catch (error) {

      console.log(
        "Youth verification error:",
        error
      );

      console.log(
        error.code
      );

      console.log(
        error.message
      );

      alert(
        "Unable to verify your account. Please refresh the page or try again."
      );

    }

  } else {

    console.log(
      "No authenticated Firebase user found."
    );

    window.location.href = "login.html";

  }

});


// LOGOUT
const logoutBtn = document.querySelector("[data-logout]");

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    try {

      await signOut(auth);

      alert(
        "Logged out successfully!"
      );

      window.location.href =
        "login.html";

    } catch (error) {

      console.log(
        error
      );

      alert(
        error.message
      );

    }

  });

}