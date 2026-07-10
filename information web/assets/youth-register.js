import { auth, db } from "./firebase-config.js";
function registerYouth(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "youth"
      });

      alert("Youth registered!");
      window.location.href = "youth-dashboard.html";
    })
    .catch((error) => {
      alert(error.message);
    });
}