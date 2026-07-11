import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("youthRegisterForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector('[name="email"]').value;
  const password = document.querySelector('[name="password"]').value;
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    fullName: document.querySelector('[name="fullName"]').value,
    email: user.email,
    age: document.querySelector('[name="age"]').value,
    gender: document.querySelector('[name="gender"]').value,
    address: document.querySelector('[name="address"]').value,
    contact: document.querySelector('[name="contact"]').value,
    education: document.querySelector('[name="education"]').value,
    educationStatus: document.querySelector('[name="educationStatus"]').value,
    employment: document.querySelector('[name="employment"]').value,
    civic: document.querySelector('[name="civic"]').value,
    voterStatus: document.querySelector('[name="voterStatus"]').value,
    newVoter: document.querySelector('[name="newVoter"]').value,
    voterParticipation: document.querySelector('[name="voterParticipation"]').value,
    specialNeeds: document.querySelector('[name="specialNeeds"]').value,
    assistance: document.querySelector('[name="assistance"]').value,
    hobbies: document.querySelector('[name="hobbies"]').value,
    sports: document.querySelector('[name="sports"]').value,
    role: "youth"
  });

    alert("Youth registered!");
    window.location.href = "youth-dashboard.html";

  } catch (error) {
    console.log(error);
    console.log(error.code);
    console.log(error.message); 

     alert(error.code + "\n" + error.message);
  }
});