import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { logActivity } from "./audit-log.js";

const form = document.getElementById("youthRegisterForm");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector('[name="email"]').value.trim();
  const password = document.querySelector('[name="password"]').value;

  submitBtn.disabled = true;
  submitBtn.textContent = "Registering...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      fullName: document.querySelector('[name="fullName"]').value.trim(),
      email: user.email,
      age: Number(document.querySelector('[name="age"]').value),
      gender: document.querySelector('[name="gender"]').value,
      address: document.querySelector('[name="address"]').value.trim(),
      contact: document.querySelector('[name="contact"]').value.trim(),
      education: document.querySelector('[name="education"]').value,
      educationStatus: document.querySelector('[name="educationStatus"]').value,
      employment: document.querySelector('[name="employment"]').value,
      civic: document.querySelector('[name="civic"]').value,
      voterStatus: document.querySelector('[name="voterStatus"]').value,
      newVoter: document.querySelector('[name="newVoter"]').value,
      voterParticipation: document.querySelector('[name="voterParticipation"]').value,
      specialNeeds: document.querySelector('[name="specialNeeds"]').value,
      assistance: document.querySelector('[name="assistance"]').value.trim(),
      hobbies: document.querySelector('[name="hobbies"]').value.trim(),
      sports: document.querySelector('[name="sports"]').value.trim(),
      role: "youth",
      createdAt: new Date()
    });

    await logActivity({ email: user.email, role: "youth", activity: "Registered" });

    alert("Youth registered!");
    window.location.href = "youth-dashboard.html";

  } catch (error) {
    console.log(error);
    console.log(error.code);
    console.log(error.message);

    alert(error.code + "\n" + error.message);

    submitBtn.disabled = false;
    submitBtn.textContent = "Register";
  }
});