import { db } from "./firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// Gaano karaming email ang isasama sa bawat Gmail window.
// Maliit ang batch para hindi masyadong humaba ang link.
const BATCH_SIZE = 40;


// =====================================================
// HELPERS
// =====================================================

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function calculateAge(birthDateValue) {
  if (!birthDateValue) {
    return null;
  }

  const birthDate = new Date(birthDateValue);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function isActiveYouth(youth) {
  if (youth.status === "Inactive" || youth.eligibility === "Archived") {
    return false;
  }

  const computed = calculateAge(youth.birthDate);
  const age = Number(computed !== null ? computed : youth.age);

  return age >= 15 && age <= 30;
}

async function getYouthEmails() {
  const snap = await getDocs(collection(db, "users"));
  const emails = new Set();

  snap.docs.forEach(item => {
    const user = item.data();

    if (user.role !== "youth" || !isActiveYouth(user)) {
      return;
    }

    const email = String(user.email || "").trim().toLowerCase();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emails.add(email);
    }
  });

  return [...emails];
}

function buildBody(announcement) {
  const lines = [
    "Hi, mga kabataan ng Bukal!",
    "",
    "May bagong announcement mula sa Sangguniang Kabataan:",
    "",
    `[${announcement.category}] ${announcement.title}`,
    "",
    announcement.message,
    "",
    "I-check din ang Youth Dashboard para sa complete details ng announcement.",
    "",
    "Salamat po!",
    "- Sangguniang Kabataan ng Bukal, Pagbilao, Quezon"
  ];

  return lines.join("\n");
}

function gmailLink(bccList, announcement) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    bcc: bccList.join(","),
    su: `[${announcement.category}] ${announcement.title}`,
    body: buildBody(announcement)
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}


// =====================================================
// PANEL
// =====================================================

function closePanel() {
  document.getElementById("gmailNotifyOverlay")?.remove();
}

function openPanel(announcement, emails) {
  closePanel();

  const batches = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE));
  }

  const overlay = document.createElement("div");
  overlay.id = "gmailNotifyOverlay";

  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9999;
    background:rgba(6,63,66,.55);
    display:flex; align-items:center; justify-content:center;
    padding:20px;
  `;

  const card = document.createElement("div");

  card.style.cssText = `
    background:#fff; border-radius:16px; padding:26px;
    width:100%; max-width:480px; max-height:85vh; overflow:auto;
    font-family:Inter,Arial,sans-serif; color:#0a2f31;
    box-shadow:0 20px 60px rgba(0,0,0,.25);
  `;

  const title = document.createElement("h3");
  title.textContent = "Notify Youth via Gmail";
  title.style.cssText = "margin:0 0 6px; color:#0a5255;";

  const info = document.createElement("p");
  info.style.cssText = "margin:0 0 16px; color:#536970; font-size:14px;";
  info.textContent =
    `"${announcement.title}" • ${emails.length} youth email` +
    `${emails.length === 1 ? "" : "s"} • ${batches.length} Gmail window` +
    `${batches.length === 1 ? "" : "s"}. ` +
    "I-click ang bawat button, tapos pindutin ang Send sa Gmail.";

  card.append(title, info);

  batches.forEach((batch, index) => {
    const link = document.createElement("a");

    link.href = gmailLink(batch, announcement);
    link.target = "_blank";
    link.rel = "noopener";

    link.textContent =
      `Open Gmail — Batch ${index + 1} of ${batches.length} ` +
      `(${batch.length} youth)`;

    link.style.cssText = `
      display:block; margin:0 0 10px; padding:12px 14px;
      background:#0a5255; color:#fff; text-decoration:none;
      border-radius:10px; font-weight:600; font-size:14px;
      text-align:center;
    `;

    link.addEventListener("click", () => {
      link.style.background = "#5f8c8d";
      link.textContent += " ✓";
    });

    card.append(link);
  });

  const copyBtn = document.createElement("button");

  copyBtn.type = "button";
  copyBtn.textContent = "Copy all emails";

  copyBtn.style.cssText = `
    width:100%; margin:4px 0 10px; padding:11px 14px;
    background:#eef4f4; color:#0a5255; border:0;
    border-radius:10px; font-weight:600; font-size:14px; cursor:pointer;
  `;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      copyBtn.textContent = "Copied ✓";
    } catch {
      copyBtn.textContent = "Could not copy";
    }
  });

  const closeBtn = document.createElement("button");

  closeBtn.type = "button";
  closeBtn.textContent = "Close";

  closeBtn.style.cssText = `
    width:100%; padding:11px 14px; background:transparent;
    color:#536970; border:1px solid #d6e0e1;
    border-radius:10px; font-weight:600; font-size:14px; cursor:pointer;
  `;

  closeBtn.addEventListener("click", closePanel);

  card.append(copyBtn, closeBtn);
  overlay.append(card);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closePanel();
    }
  });

  document.body.append(overlay);
}


// =====================================================
// ADD A "NOTIFY" BUTTON TO EACH ANNOUNCEMENT ROW
// =====================================================

function getAnnouncementFromRow(row) {
  const cells = row.querySelectorAll("td");

  if (cells.length < 6) {
    return null;
  }

  return {
    category: clean(cells[1].textContent),
    title: clean(cells[2].textContent),
    message: String(cells[3].textContent || "").trim(),
    until: clean(cells[4].querySelector("strong")?.textContent)
  };
}

function addNotifyButtons() {
  document
    .querySelectorAll("#announcementTableBody tr")
    .forEach(row => {
      const actions = row.querySelector(".action-row");

      if (!actions || actions.querySelector("[data-gmail-notify]")) {
        return;
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className = "action-btn edit";
      button.dataset.gmailNotify = "1";
      button.title = "Notify youth via Gmail";
      button.textContent = "✉";

      button.addEventListener("click", async () => {
        const announcement = getAnnouncementFromRow(row);

        if (!announcement) {
          return;
        }

        const original = button.textContent;

        button.disabled = true;
        button.textContent = "…";

        try {
          const emails = await getYouthEmails();

          if (!emails.length) {
            alert("Walang youth email na mapapadalhan.");
            return;
          }

          openPanel(announcement, emails);

        } catch (error) {
          console.error("Gmail notify error:", error);
          alert("Hindi makuha ang listahan ng email ng youth.");

        } finally {
          button.disabled = false;
          button.textContent = original;
        }
      });

      actions.prepend(button);
    });
}

const tableBody = document.getElementById("announcementTableBody");

if (tableBody) {
  new MutationObserver(addNotifyButtons).observe(tableBody, {
    childList: true,
    subtree: true
  });

  addNotifyButtons();
}