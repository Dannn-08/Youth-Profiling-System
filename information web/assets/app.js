import { auth } from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// =====================================================
// TOAST MESSAGE
// =====================================================

function toast(message, type = "success") {

  const existing =
    document.querySelector(".toast");

  if (existing) {
    existing.remove();
  }


  const el =
    document.createElement("div");


  el.className =
    `toast ${type}`;


  el.textContent =
    message;


  document.body.appendChild(
    el
  );


  setTimeout(
    () => {
      el.remove();
    },
    3300
  );

}


// =====================================================
// HERO BACKGROUND SLIDESHOW
// =====================================================

function initHeroSlideshow() {

  const slides =
    document.querySelectorAll(
      ".hero-slide"
    );


  if (
    slides.length <= 1
  ) {
    return;
  }


  let currentSlide =
    0;


  setInterval(
    () => {

      slides[
        currentSlide
      ].classList.remove(
        "active"
      );


      currentSlide =
        (
          currentSlide + 1
        ) %
        slides.length;


      slides[
        currentSlide
      ].classList.add(
        "active"
      );

    },
    5000
  );

}


// =====================================================
// FIREBASE LOGOUT
// =====================================================

function initFirebaseLogout() {

  const logoutButtons =
    document.querySelectorAll(
      "[data-logout]"
    );


  logoutButtons.forEach(
    button => {

      /*
        Logout is already handled by youth-check.js
        or admin-check.js on protected dashboards.

        This prevents app.js from creating duplicate
        logout events.
      */

      if (
        document.body.dataset.page === "youth-dashboard" ||
        document.body.dataset.page === "admin-dashboard"
      ) {
        return;
      }


      button.addEventListener(
        "click",
        async () => {

          try {

            await signOut(
              auth
            );


            toast(
              "Logged out successfully!"
            );


            setTimeout(
              () => {

                window.location.href =
                  "login.html";

              },
              400
            );

          } catch (error) {

            console.error(
              "Logout error:",
              error
            );


            toast(
              "Unable to logout. Please try again.",
              "error"
            );

          }

        }
      );

    }
  );

}


// =====================================================
// HOME PAGE
// =====================================================

function initHome() {

  initHeroSlideshow();

}


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const page =
      document.body.dataset.page;


    if (
      page === "home"
    ) {

      initHome();

    }


    initFirebaseLogout();

  }
);