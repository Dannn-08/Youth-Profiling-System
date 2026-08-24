import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { logActivity } from "./audit-log.js";


const form = document.getElementById("youthRegisterForm");

const submitBtn =
  form.querySelector('button[type="submit"]');


// =====================================================
// CALCULATE AGE FROM BIRTH DATE
// =====================================================

function calculateAge(birthDateValue) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(birthDateValue);

  if (
    Number.isNaN(
      birthDate.getTime()
    )
  ) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
}


// =====================================================
// DETERMINE YOUTH STATUS
// =====================================================

function getYouthStatus(age) {

  if (
    age >= 15 &&
    age <= 30
  ) {
    return {
      status: "Active",
      eligibility: "Eligible"
    };
  }

  return {
    status: "Inactive",
    eligibility: "Archived"
  };
}


// =====================================================
// FORM SUBMISSION
// =====================================================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const email =
      document
        .querySelector(
          '[name="email"]'
        )
        .value
        .trim();


    const password =
      document
        .querySelector(
          '[name="password"]'
        )
        .value;


    const birthDate =
      document
        .querySelector(
          '[name="birthDate"]'
        )
        .value;


    const age =
      calculateAge(
        birthDate
      );


    // =================================================
    // VALIDATE AGE
    // =================================================

    if (
      age === null ||
      Number.isNaN(age)
    ) {

      alert(
        "Please enter a valid birth date."
      );

      return;
    }


    if (
      age < 15 ||
      age > 30
    ) {

      alert(
        "Only youth residents aged 15 to 30 are eligible to register."
      );

      return;
    }


    const youthStatus =
      getYouthStatus(age);


    // =================================================
    // GET NEW SK / KK INFORMATION
    // =================================================

    const civilStatus =
      document
        .querySelector(
          '[name="civilStatus"]'
        )
        .value;


    const registeredSKVoter =
      document
        .querySelector(
          '[name="registeredSKVoter"]'
        )
        .value;


    const votedLastSKElection =
      document
        .querySelector(
          '[name="votedLastSKElection"]'
        )
        .value;


    const kkAssemblyAttended =
      document
        .querySelector(
          '[name="kkAssemblyAttended"]'
        )
        .value;


    const kkAttendanceCount =
      document
        .querySelector(
          '[name="kkAttendanceCount"]'
        )
        .value;


    const kkNoReason =
      document
        .querySelector(
          '[name="kkNoReason"]'
        )
        .value;


    // =================================================
    // VALIDATE SK / KK INFORMATION
    // =================================================

    if (
      !civilStatus
    ) {

      alert(
        "Please select your civil status."
      );

      return;
    }


    if (
      !registeredSKVoter
    ) {

      alert(
        "Please indicate if you are a registered SK voter."
      );

      return;
    }


    if (
      !votedLastSKElection
    ) {

      alert(
        "Please indicate if you voted in the last SK election."
      );

      return;
    }


    if (
      !kkAssemblyAttended
    ) {

      alert(
        "Please indicate if you have attended a KK Assembly."
      );

      return;
    }


    if (
      kkAssemblyAttended === "Yes" &&
      !kkAttendanceCount
    ) {

      alert(
        "Please indicate how many times you attended a KK Assembly."
      );

      return;
    }


    if (
      kkAssemblyAttended === "No" &&
      !kkNoReason
    ) {

      alert(
        "Please indicate why you have not attended a KK Assembly."
      );

      return;
    }


    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "Registering...";


    let createdUser = null;


    try {

      // =================================================
      // CREATE FIREBASE AUTH ACCOUNT
      // =================================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      createdUser =
        user;


      // =================================================
      // SAVE YOUTH PROFILE TO FIRESTORE
      // =================================================

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {

          // =============================================
          // ACCOUNT / PERSONAL INFORMATION
          // =============================================

          fullName:
            document
              .querySelector(
                '[name="fullName"]'
              )
              .value
              .trim(),

          email:
            user.email,

          birthDate:
            birthDate,

          age:
            age,

          status:
            youthStatus.status,

          eligibility:
            youthStatus.eligibility,

          gender:
            document
              .querySelector(
                '[name="gender"]'
              )
              .value,

          civilStatus:
            civilStatus,

          address:
            document
              .querySelector(
                '[name="address"]'
              )
              .value
              .trim(),

          contact:
            document
              .querySelector(
                '[name="contact"]'
              )
              .value
              .trim(),


          // =============================================
          // EDUCATION AND EMPLOYMENT
          // =============================================

          education:
            document
              .querySelector(
                '[name="education"]'
              )
              .value,

          educationStatus:
            document
              .querySelector(
                '[name="educationStatus"]'
              )
              .value,

          employment:
            document
              .querySelector(
                '[name="employment"]'
              )
              .value,

          civic:
            document
              .querySelector(
                '[name="civic"]'
              )
              .value,


          // =============================================
          // GENERAL VOTER INFORMATION
          // =============================================

          voterStatus:
            document
              .querySelector(
                '[name="voterStatus"]'
              )
              .value,

          newVoter:
            document
              .querySelector(
                '[name="newVoter"]'
              )
              .value,

          voterParticipation:
            document
              .querySelector(
                '[name="voterParticipation"]'
              )
              .value,


          // =============================================
          // SK / KK INFORMATION
          // =============================================

          registeredSKVoter:
            registeredSKVoter,

          votedLastSKElection:
            votedLastSKElection,

          kkAssemblyAttended:
            kkAssemblyAttended,

          kkAttendanceCount:
            kkAssemblyAttended === "Yes"
              ? kkAttendanceCount
              : "",

          kkNoReason:
            kkAssemblyAttended === "No"
              ? kkNoReason
              : "",


          // =============================================
          // SUPPORT INFORMATION
          // =============================================

          specialNeeds:
            document
              .querySelector(
                '[name="specialNeeds"]'
              )
              .value,

          assistance:
            document
              .querySelector(
                '[name="assistance"]'
              )
              .value
              .trim(),


          // =============================================
          // SKILLS AND INTERESTS
          // =============================================

          hobbies:
            document
              .querySelector(
                '[name="hobbies"]'
              )
              .value
              .trim(),

          sports:
            document
              .querySelector(
                '[name="sports"]'
              )
              .value
              .trim(),


          // =============================================
          // SYSTEM INFORMATION
          // =============================================

          role:
            "youth",

          createdAt:
            new Date(),

          updatedAt:
            new Date()

        }
      );


      // =================================================
      // AUDIT LOG
      // =================================================

      try {

        await logActivity({
          email:
            user.email,

          role:
            "youth",

          activity:
            "Registered",

          details:
            `Youth account registered. Age: ${age}, Status: ${youthStatus.status}, SK Voter: ${registeredSKVoter}, KK Assembly: ${kkAssemblyAttended}`
        });

      } catch (auditError) {

        /*
          Do NOT cancel registration just because
          audit logging failed.
        */

        console.error(
          "Audit log error:",
          auditError
        );

      }


      // =================================================
      // SUCCESS
      // =================================================

      alert(
        "Youth registered successfully!"
      );


      window.location.href =
        "youth-dashboard.html";


    } catch (error) {

      console.log(
        error
      );

      console.log(
        error.code
      );

      console.log(
        error.message
      );


      // =================================================
      // REMOVE AUTH ACCOUNT IF FIRESTORE SAVE FAILED
      // =================================================

      if (
        createdUser
      ) {

        try {

          await deleteUser(
            createdUser
          );

          console.log(
            "Incomplete Authentication account removed."
          );

        } catch (deleteError) {

          console.error(
            "Could not remove incomplete Authentication account:",
            deleteError
          );

        }

      }


      let message =
        "Something went wrong while registering.";


      if (
        error.code ===
        "auth/email-already-in-use"
      ) {

        message =
          "This email address is already registered.";

      } else if (
        error.code ===
        "auth/weak-password"
      ) {

        message =
          "Password is too weak. Please use at least 8 characters.";

      } else if (
        error.code ===
        "auth/invalid-email"
      ) {

        message =
          "Please enter a valid email address.";

      } else if (
        error.code ===
        "permission-denied"
      ) {

        message =
          "The account could not be saved to the database because of Firestore permissions.";

      }


      alert(
        message
      );


      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "Register";

    }

  }
);