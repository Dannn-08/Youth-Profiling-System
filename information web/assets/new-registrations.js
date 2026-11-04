// =====================================================
// NEW YOUTH REGISTRATIONS
//
// 1. "Recent Registrations" card in the Overview tab
// 2. Pop-up when the admin opens the dashboard, showing
//    who registered since the last visit
// 3. Live toast when someone registers while the admin
//    is already looking at the dashboard
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_LIMIT = 5;

let youth = [];
let firstSnapshot = true;
let popupShown = false;


// =====================================================
// HELPERS
// =====================================================

function toDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function timeAgo(date) {
  if (!date) {
    return "";
  }

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizePurok(value) {
  const text = String(value || "").trim();

  const aliases = {
    "BUKAL1": "BUKAL 1",
    "KALYE PUTOL/ BUKAL 2": "KALYE PUTOL / BUKAL 2",
    "KALYE PUTOL/BUKAL 2": "KALYE PUTOL / BUKAL 2",
    "KALYE PUTOL /BUKAL 2": "KALYE PUTOL / BUKAL 2"
  };

  return aliases[text.toUpperCase()] || text;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function sortedYouth() {
  return [...youth].sort(
    (a, b) =>
      (b.created?.getTime() || 0) - (a.created?.getTime() || 0)
  );
}

function el(tag, styles, text) {
  const node = document.createElement(tag);

  if (styles) {
    node.style.cssText = styles;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
}

function openYouthTab() {
  document
    .querySelector('.tab-nav button[data-tab="youth"]')
    ?.click();

  document
    .getElementById("tab-youth")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}


// =====================================================
// RECENT REGISTRATIONS CARD (OVERVIEW)
// =====================================================

function ensureSection() {
  let section = document.getElementById("recentRegistrations");
  const statCards = document.getElementById("statCards");

  if (!statCards) {
    return null;
  }

  if (!section) {
    section = document.createElement("section");
    section.id = "recentRegistrations";
    section.className = "panel";
    section.style.margin = "24px 0";
    section.style.padding = "28px 32px";
  }

  // Keep the card right under the stat cards.
  if (section.previousElementSibling !== statCards) {
    statCards.insertAdjacentElement("afterend", section);
  }

  return section;
}

function chip(label, value) {
  const box = el(
    "div",
    `flex:1; min-width:120px; padding:12px 16px; border-radius:12px;
     background:rgba(10,82,85,.06);`
  );

  box.append(
    el("div", "font-size:12px; color:#71838a;", label),
    el("div", "font-size:24px; font-weight:700; color:#0a5255;", String(value))
  );

  return box;
}

function renderCard() {
  const section = ensureSection();

  if (!section) {
    return;
  }

  const list = sortedYouth();
  const today = startOfToday();
  const now = Date.now();

  const todayCount = list.filter(
    y => y.created && y.created.getTime() >= today
  ).length;

  const weekCount = list.filter(
    y => y.created && now - y.created.getTime() <= WEEK_MS
  ).length;

  section.replaceChildren();

  // ---------- heading ----------
  const head = el(
    "div",
    "display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap;"
  );

  const titles = el("div");

  titles.append(
    el(
      "span",
      "font-size:11px; font-weight:700; letter-spacing:.08em; color:#0a696d;",
      "NEW REGISTRATIONS"
    ),
    el("h2", "margin:4px 0 2px;", "Recent Registrations"),
    el(
      "p",
      "margin:0; color:#71838a; font-size:14px;",
      "The latest youth who registered in the system."
    )
  );

  const viewAll = el("button", "", "View all youth →");

  viewAll.type = "button";
  viewAll.className = "btn btn-muted btn-sm";
  viewAll.addEventListener("click", openYouthTab);

  head.append(titles, viewAll);

  // ---------- chips ----------
  const chips = el("div", "display:flex; gap:12px; flex-wrap:wrap; margin:18px 0;");

  chips.append(
    chip("Registered today", todayCount),
    chip("Last 7 days", weekCount),
    chip("Total youth", list.length)
  );

  section.append(head, chips);

  // ---------- list ----------
  if (!list.length) {
    section.append(
      el("p", "color:#71838a; margin:0;", "No youth have registered yet.")
    );
    return;
  }

  list.slice(0, RECENT_LIMIT).forEach(person => {
    const row = el(
      "div",
      `display:flex; align-items:center; gap:16px; padding:14px 0;
       border-top:1px solid rgba(10,82,85,.10);`
    );

    const initial = el(
      "div",
      `flex:none; width:42px; height:42px; border-radius:50%;
       background:#0a5255; color:#fff; font-weight:700;
       display:flex; align-items:center; justify-content:center;`,
      (person.name || "?").trim().charAt(0).toUpperCase()
    );

    const info = el("div", "flex:1; min-width:0;");

    const nameLine = el("div", "display:flex; align-items:center; gap:8px; flex-wrap:wrap;");

    nameLine.append(el("strong", "", person.name || "Unnamed youth"));

    if (person.created && Date.now() - person.created.getTime() <= WEEK_MS) {
      nameLine.append(
        el(
          "span",
          `padding:2px 8px; border-radius:999px; background:#d8ad76;
           color:#063f42; font-size:10px; font-weight:800; letter-spacing:.05em;`,
          "NEW"
        )
      );
    }

    const meta = [
      person.address,
      person.age ? `${person.age} yrs old` : "",
      person.gender
    ]
      .filter(Boolean)
      .join(" • ");

    info.append(nameLine, el("div", "font-size:13px; color:#71838a; margin-top:2px;", meta));

    const when = el(
      "div",
      "flex:none; font-size:13px; color:#536970; text-align:right;",
      timeAgo(person.created)
    );

    row.append(initial, info, when);
    section.append(row);
  });
}


// =====================================================
// POP-UP WHEN THE ADMIN OPENS THE DASHBOARD
// =====================================================

function lastSeenKey() {
  return `bukalAdminLastSeenRegistration_${auth.currentUser?.uid || "admin"}`;
}

function getLastSeen() {
  try {
    const saved = Number(localStorage.getItem(lastSeenKey()));
    return saved > 0 ? saved : Date.now() - WEEK_MS;
  } catch {
    return Date.now() - WEEK_MS;
  }
}

function markSeen() {
  try {
    localStorage.setItem(lastSeenKey(), String(Date.now()));
  } catch {
    /* storage unavailable, ignore */
  }
}

function closePopup() {
  document.getElementById("newRegistrationPopup")?.remove();
  markSeen();
}

function showPopup(newcomers) {
  if (!newcomers.length || document.getElementById("newRegistrationPopup")) {
    return;
  }

  const overlay = el(
    "div",
    `position:fixed; inset:0; z-index:9998; padding:20px;
     background:rgba(6,63,66,.55);
     display:flex; align-items:center; justify-content:center;`
  );

  overlay.id = "newRegistrationPopup";

  const card = el(
    "div",
    `background:#fff; border-radius:18px; padding:28px;
     width:100%; max-width:460px; max-height:85vh; overflow:auto;
     font-family:Inter,Arial,sans-serif; color:#0a2f31;
     box-shadow:0 20px 60px rgba(0,0,0,.28);`
  );

  card.append(
    el("div", "font-size:34px; margin-bottom:6px;", "🎉"),
    el("h3", "margin:0 0 6px; color:#0a5255; font-size:22px;", "New Youth Registered!"),
    el(
      "p",
      "margin:0 0 18px; color:#536970; font-size:14px;",
      `${newcomers.length} youth registered since your last visit.`
    )
  );

  newcomers.slice(0, 5).forEach(person => {
    const row = el(
      "div",
      `display:flex; justify-content:space-between; gap:12px;
       padding:10px 0; border-top:1px solid #e3ecec;`
    );

    const left = el("div");

    left.append(
      el("strong", "display:block; font-size:14px;", person.name || "Unnamed youth"),
      el("span", "font-size:12px; color:#71838a;", person.address || "")
    );

    row.append(left, el("span", "font-size:12px; color:#536970; flex:none;", timeAgo(person.created)));
    card.append(row);
  });

  if (newcomers.length > 5) {
    card.append(
      el(
        "p",
        "margin:10px 0 0; font-size:13px; color:#71838a;",
        `and ${newcomers.length - 5} more…`
      )
    );
  }

  const actions = el("div", "display:flex; gap:10px; margin-top:22px;");

  const view = el(
    "button",
    `flex:1; padding:12px; border:0; border-radius:10px; cursor:pointer;
     background:#0a5255; color:#fff; font-weight:700; font-size:14px;`,
    "View Youth Records"
  );

  view.type = "button";

  view.addEventListener("click", () => {
    closePopup();
    openYouthTab();
  });

  const dismiss = el(
    "button",
    `flex:none; padding:12px 18px; border:1px solid #d6e0e1; border-radius:10px;
     cursor:pointer; background:transparent; color:#536970; font-weight:600; font-size:14px;`,
    "Dismiss"
  );

  dismiss.type = "button";
  dismiss.addEventListener("click", closePopup);

  actions.append(view, dismiss);
  card.append(actions);
  overlay.append(card);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closePopup();
    }
  });

  document.body.append(overlay);
}


// =====================================================
// LIVE TOAST (SOMEONE REGISTERS WHILE ADMIN IS ONLINE)
// =====================================================

function showToast(person) {
  const toast = el(
    "div",
    `position:fixed; right:20px; bottom:20px; z-index:9999; max-width:340px;
     padding:14px 18px; border-radius:14px; cursor:pointer;
     background:#0a5255; color:#fff; font-family:Inter,Arial,sans-serif;
     box-shadow:0 12px 36px rgba(0,0,0,.3); border-left:4px solid #d8ad76;`
  );

  toast.append(
    el("div", "font-size:12px; color:#d8ad76; font-weight:700; letter-spacing:.05em;", "NEW YOUTH REGISTERED"),
    el("div", "font-weight:700; margin-top:4px;", person.name || "Unnamed youth"),
    el("div", "font-size:13px; opacity:.85; margin-top:2px;", person.address || "")
  );

  toast.addEventListener("click", () => {
    toast.remove();
    openYouthTab();
  });

  document.body.append(toast);

  setTimeout(() => toast.remove(), 9000);
}


// =====================================================
// LIVE DATA
// =====================================================

function start() {
  onSnapshot(
    collection(db, "users"),

    snapshot => {
      youth = snapshot.docs
        .map(item => ({ id: item.id, ...item.data() }))
        .filter(user => user.role === "youth")
        .map(user => ({
          id: user.id,
          name: user.fullName,
          address: normalizePurok(user.address),
          age: user.age,
          gender: user.gender,
          created: toDate(user.createdAt)
        }));

      renderCard();

      if (firstSnapshot) {
        firstSnapshot = false;

        // Pop-up for everyone who registered since the last visit.
        if (!popupShown) {
          popupShown = true;

          const lastSeen = getLastSeen();

          showPopup(
            sortedYouth().filter(
              y => y.created && y.created.getTime() > lastSeen
            )
          );
        }

        return;
      }

      // Later updates: toast for brand-new registrations only.
      snapshot.docChanges().forEach(change => {
        if (change.type !== "added") {
          return;
        }

        const data = change.doc.data();

        if (data.role !== "youth") {
          return;
        }

        const created = toDate(data.createdAt);

        if (created && Date.now() - created.getTime() < 5 * 60 * 1000) {
          showToast({ name: data.fullName, address: normalizePurok(data.address) });
        }
      });
    },

    error => {
      console.error("New registrations listener error:", error);
    }
  );

  // Keep "x min ago" fresh.
  setInterval(renderCard, 60000);

  // The recommendations section is added later by the dashboard;
  // make sure this card stays directly under the stat cards.
  const overview = document.getElementById("tab-overview");

  if (overview) {
    new MutationObserver(ensureSection).observe(overview, {
      childList: true
    });
  }
}

let started = false;

onAuthStateChanged(auth, user => {
  if (user && !started) {
    started = true;
    start();
  }
});