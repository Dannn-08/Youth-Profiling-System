import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      const docSnap = await getDoc(doc(db, "users", user.uid));
      const data = docSnap.data();

      if (data.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "youth-dashboard.html";
      }
    })
    .catch((error) => {
      alert(error.message);
    });
}