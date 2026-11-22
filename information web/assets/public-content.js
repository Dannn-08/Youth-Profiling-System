// =====================================================
// public-content.js
// Renders "Events & Accomplishments" and "SK Officials"
// on index.html from Firestore.
// If Firestore is empty or fails, the static HTML already
// in index.html stays visible as a fallback.
// Place in: assets/public-content.js
// =====================================================

import { db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Cloudinary delivery optimization (auto format/quality + max width).
// Local paths (e.g. assets/events/x.png) are returned unchanged.
function optimize(url, width) {
  if (url && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }

  return url || "";
}


// =====================================================
// EVENTS
// =====================================================

async function renderEvents() {
  const grid = document.getElementById("eventsGrid");

  if (!grid) return;

  const snap = await getDocs(collection(db, "events"));

  const items = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    )
    .slice(0, 6);

  if (!items.length) return;

  grid.innerHTML = items.map(item => {
    const year = item.year || String(item.date || "").slice(0, 4);

    return `
      <a class="sk-event-card" href="events.html#${esc(item.id)}">

        <div class="sk-event-image">
          <img src="${esc(optimize(item.coverUrl, 900))}"
               alt="${esc(item.title)}"
               loading="lazy">
        </div>

        <div class="sk-event-content">

          <span class="event-category">
            ${esc(item.category || "Event")}${year ? ` • ${esc(year)}` : ""}
          </span>

          <h3>${esc(item.title)}</h3>

          <p>${esc(item.summary || "")}</p>

          <span class="event-read-more">
            View Details →
          </span>

        </div>

      </a>
    `;
  }).join("");
}


// =====================================================
// SK OFFICIALS
// =====================================================

async function renderOfficials() {
  const featuredBox = document.getElementById("skFeatured");
  const councilGrid = document.getElementById("skCouncilGrid");

  if (!featuredBox || !councilGrid) return;

  const snap = await getDocs(collection(db, "sk_officials"));

  const officials = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(item => item.isActive !== false)
    .sort((a, b) =>
      Number(a.sortOrder || 999) - Number(b.sortOrder || 999)
    );

  if (!officials.length) return;

  const chair =
    officials.find(item => item.isChairperson) ||
    officials[0];

  const others = officials.filter(item => item !== chair);

  featuredBox.innerHTML = `
    <article class="sk-leadership-feature">

      <div class="sk-leadership-copy">

        <span class="sk-feature-number">01</span>

        <span class="sk-feature-label">
          ${esc(String(chair.position || "").toUpperCase())}
        </span>

        <h3>${esc(chair.name)}</h3>

        <p>Sangguniang Kabataan ng Barangay Bukal</p>

        <div class="sk-feature-divider"></div>

        <div class="sk-feature-meta">
          <span>YOUTH</span>
          <i></i>
          <span>SERVICE</span>
          <i></i>
          <span>LEADERSHIP</span>
        </div>

      </div>

      <div class="sk-leadership-photo">
        <img src="${esc(optimize(chair.photoUrl, 1000))}"
             alt="${esc(chair.name)}">
        <div class="sk-photo-fade"></div>
      </div>

    </article>
  `;

  councilGrid.innerHTML = others.map((item, index) => `
    <article class="sk-council-card">

      <div class="sk-council-photo">
        <img src="${esc(optimize(item.photoUrl, 700))}"
             alt="${esc(item.name)}"
             loading="lazy">
      </div>

      <div class="sk-council-info">

        <span class="sk-council-number">
          ${String(index + 2).padStart(2, "0")}
        </span>

        <span class="sk-council-position">
          ${esc(String(item.position || "").toUpperCase())}
        </span>

        <h3>${esc(item.name)}</h3>

      </div>

    </article>
  `).join("");
}


// =====================================================
// START
// =====================================================

renderEvents().catch(error =>
  console.warn("Events not loaded from Firestore (using static fallback):", error)
);

renderOfficials().catch(error =>
  console.warn("Officials not loaded from Firestore (using static fallback):", error)
);