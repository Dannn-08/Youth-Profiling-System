// =====================================================
// events-page.js
// Renders the full list on events.html from Firestore,
// builds the year filter, and supports #<eventId> links.
// If Firestore is empty or fails, the static cards already
// in events.html stay visible and the filter still works.
// Place in: assets/events-page.js
// =====================================================

import { db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const grid = document.querySelector(".events-page-grid");
const filterWrap = document.querySelector(".events-filter-wrap");


function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Cloudinary: auto format/quality + max width. Local paths unchanged.
function optimize(url, width) {
  if (url && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }

  return url || "";
}


// =====================================================
// FILTER
// =====================================================

function wireFilters() {
  if (!filterWrap || !grid) return;

  const buttons = filterWrap.querySelectorAll(".event-filter-btn");
  const cards = grid.querySelectorAll(".event-detail-card");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      buttons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");

      const selected = button.dataset.year;

      cards.forEach(card => {
        card.style.display =
          selected === "all" || card.dataset.year === selected
            ? ""
            : "none";
      });
    });
  });
}


// =====================================================
// LIGHTBOX (gallery photos)
// =====================================================

let lightbox = null;
let lightboxPhotos = [];
let lightboxIndex = 0;

function showLightbox() {
  if (!lightbox) {
    lightbox = document.createElement("div");

    lightbox.style.cssText =
      "position:fixed;inset:0;z-index:9999;display:none;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,.88);padding:24px;cursor:zoom-out;";

    lightbox.innerHTML =
      '<img alt="" style="max-width:100%;max-height:100%;border-radius:10px;">';

    lightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
    });

    document.addEventListener("keydown", event => {
      if (!lightbox || lightbox.style.display === "none") return;

      if (event.key === "Escape") {
        lightbox.style.display = "none";
      }

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const step = event.key === "ArrowRight" ? 1 : -1;

        lightboxIndex =
          (lightboxIndex + step + lightboxPhotos.length) %
          lightboxPhotos.length;

        lightbox.querySelector("img").src =
          optimize(lightboxPhotos[lightboxIndex], 1600);
      }
    });

    document.body.appendChild(lightbox);
  }

  lightbox.querySelector("img").src =
    optimize(lightboxPhotos[lightboxIndex], 1600);

  lightbox.style.display = "flex";
}


// =====================================================
// RENDER
// =====================================================

function cardHtml(item) {
  const year = item.year || String(item.date || "").slice(0, 4);
  const photos = Array.isArray(item.photos) ? item.photos : [];

  const gallery = photos.length
    ? `
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;">
        ${photos.map((url, index) => `
          <button type="button"
            data-gallery="${esc(item.id)}"
            data-index="${index}"
            style="padding:0;border:0;background:none;cursor:zoom-in;">
            <img src="${esc(optimize(url, 240))}" alt=""
              loading="lazy"
              style="width:84px;height:64px;object-fit:cover;border-radius:8px;">
          </button>
        `).join("")}
      </div>`
    : "";

  return `
    <article class="event-detail-card"
             data-year="${esc(year || "other")}"
             id="${esc(item.id)}">

      <div class="event-detail-image">
        <img src="${esc(optimize(item.coverUrl, 1000))}"
             alt="${esc(item.title)}"
             loading="lazy">
      </div>

      <div class="event-detail-content">

        <span class="event-category">
          ${esc(item.category || "Event")}${year ? ` • ${esc(year)}` : ""}
        </span>

        <h2>${esc(item.title)}</h2>

        <p style="white-space:pre-line;">${esc(item.details || item.summary || "")}</p>

        ${gallery}

      </div>

    </article>
  `;
}

function buildFilterButtons(items) {
  if (!filterWrap) return;

  const years = [
    ...new Set(
      items
        .map(item => item.year || String(item.date || "").slice(0, 4))
        .filter(Boolean)
    )
  ].sort((a, b) => Number(b) - Number(a));

  const hasOther = items.some(
    item => !(item.year || String(item.date || "").slice(0, 4))
  );

  filterWrap.innerHTML =
    '<button class="event-filter-btn active" data-year="all" type="button">All</button>' +
    years.map(year =>
      `<button class="event-filter-btn" data-year="${esc(year)}" type="button">${esc(year)}</button>`
    ).join("") +
    (hasOther
      ? '<button class="event-filter-btn" data-year="other" type="button">Other</button>'
      : "");
}

async function load() {
  const snap = await getDocs(collection(db, "events"));

  const items = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

  if (!items.length) {
    wireFilters();
    return;
  }

  grid.innerHTML = items.map(cardHtml).join("");

  buildFilterButtons(items);
  wireFilters();

  grid.querySelectorAll("[data-gallery]").forEach(button => {
    button.addEventListener("click", () => {
      const item = items.find(entry => entry.id === button.dataset.gallery);

      lightboxPhotos = item?.photos || [];
      lightboxIndex = Number(button.dataset.index) || 0;

      if (lightboxPhotos.length) showLightbox();
    });
  });

  // Jump to the event from a #<id> link, with a short highlight
  const hash = decodeURIComponent(location.hash.replace("#", ""));
  const target = hash ? document.getElementById(hash) : null;

  if (target) {
    target.scrollIntoView({ block: "center" });
    target.style.outline = "3px solid #d8ad76";
    target.style.outlineOffset = "6px";

    setTimeout(() => {
      target.style.outline = "";
      target.style.outlineOffset = "";
    }, 2500);
  }
}

if (grid) {
  load().catch(error => {
    console.warn("Events not loaded from Firestore (using static fallback):", error);
    wireFilters();
  });
}