// =====================================================
// content-manager.js
// Admin CRUD for "Events & Accomplishments" and "SK Officials"
// Data: Firestore (collections: events, sk_officials)
// Images: Cloudinary (unsigned upload)
// Place in: assets/content-manager.js
// =====================================================

import { auth, db } from "./firebase-config.js";

import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { logActivity } from "./audit-log.js";


// =====================================================
// CLOUDINARY SETTINGS
// =====================================================

const CLOUD_NAME = "sbwtjmtr";
const UPLOAD_PRESET = "bukal_unsigned";
const UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;


// =====================================================
// HELPERS
// =====================================================

const $ = id => document.getElementById(id);

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeLog(data) {
  logActivity({
    email: auth.currentUser?.email || "Admin",
    role: "admin",
    ...data
  }).catch(error => console.error("Audit log error:", error));
}

// Small thumbnail via Cloudinary URL transformation
function thumb(url, w = 90, h = 90) {
  if (!url || !url.includes("/upload/")) {
    return url || "";
  }

  return url.replace(
    "/upload/",
    `/upload/c_fill,w_${w},h_${h},q_auto,f_auto/`
  );
}

function setBusy(button, busy, busyText, normalText) {
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}


// =====================================================
// IMAGE: RESIZE + UPLOAD TO CLOUDINARY
// =====================================================

async function resizeImage(file, maxSize = 1600) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Each image must not exceed 10 MB.");
  }

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(
      maxSize / bitmap.width,
      maxSize / bitmap.height,
      1
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    canvas.getContext("2d").drawImage(
      bitmap,
      0,
      0,
      canvas.width,
      canvas.height
    );

    bitmap.close?.();

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );

    return blob || file;

  } catch (error) {
    console.warn("Resize skipped, uploading original:", error);
    return file;
  }
}

async function uploadImage(file) {
  const blob = await resizeImage(file);

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result?.error?.message ||
      "Image upload failed. Please try again."
    );
  }

  return result.secure_url;
}


// =====================================================
// DIALOG CLOSE HELPERS
// =====================================================

function wireClose(dialog, ...buttons) {
  buttons.forEach(button => {
    button?.addEventListener("click", () => dialog?.close());
  });
}


// =====================================================
// EVENTS & ACCOMPLISHMENTS
// =====================================================

let eventsList = [];
let eventPhotos = [];      // gallery URLs of the event being edited
let eventCoverUrl = "";    // current cover URL of the event being edited

const eventDialog = $("eventDialog");

async function loadEvents() {
  const body = $("eventTableBody");
  if (!body) return;

  try {
    const snap = await getDocs(collection(db, "events"));

    eventsList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
      );

    renderEvents();

  } catch (error) {
    console.error("Events load error:", error);

    body.innerHTML = `
      <tr><td colspan="5" class="empty-state">
        Unable to load events. Check Firestore rules.
      </td></tr>`;
  }
}

function renderEvents() {
  const body = $("eventTableBody");
  const count = $("eventCountText");

  if (!body) return;

  if (!eventsList.length) {
    body.innerHTML = `
      <tr><td colspan="5" class="empty-state">
        No events yet. Click "+ New Event" to add one.
      </td></tr>`;

    if (count) count.textContent = "0 events";
    return;
  }

  body.innerHTML = eventsList.map(item => `
    <tr>
      <td>
        ${item.coverUrl
          ? `<img src="${esc(thumb(item.coverUrl, 120, 80))}"
               alt="" style="width:80px;height:54px;object-fit:cover;border-radius:8px;">`
          : "—"}
      </td>
      <td>${esc(formatDate(item.date))}</td>
      <td>${esc(item.category || "—")}</td>
      <td>
        <strong>${esc(item.title)}</strong>
        <small style="display:block;margin-top:4px;color:#71838a;">
          ${esc(item.summary || "")}
        </small>
      </td>
      <td>
        <div class="action-row">
          <button class="action-btn edit" type="button"
            data-edit-event="${esc(item.id)}" title="Edit">✎</button>
          <button class="action-btn delete" type="button"
            data-delete-event="${esc(item.id)}" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join("");

  if (count) {
    count.textContent =
      `${eventsList.length} event${eventsList.length === 1 ? "" : "s"}`;
  }

  body.querySelectorAll("[data-edit-event]").forEach(button =>
    button.addEventListener("click", () =>
      openEventDialog(button.dataset.editEvent)
    )
  );

  body.querySelectorAll("[data-delete-event]").forEach(button =>
    button.addEventListener("click", () =>
      deleteEvent(button.dataset.deleteEvent)
    )
  );
}

function renderEventPhotoList() {
  const list = $("eventPhotoList");
  if (!list) return;

  list.innerHTML = eventPhotos.map((url, index) => `
    <div style="position:relative;display:inline-block;margin:6px 8px 0 0;">
      <img src="${esc(thumb(url, 120, 90))}" alt=""
        style="width:76px;height:58px;object-fit:cover;border-radius:8px;">
      <button type="button" data-remove-photo="${index}"
        title="Remove photo"
        style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;
               border:none;border-radius:50%;background:#b3261e;color:#fff;
               cursor:pointer;line-height:1;">×</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-remove-photo]").forEach(button =>
    button.addEventListener("click", () => {
      eventPhotos.splice(Number(button.dataset.removePhoto), 1);
      renderEventPhotoList();
    })
  );
}

function renderEventCoverPreview() {
  const preview = $("eventCoverPreview");
  if (!preview) return;

  preview.innerHTML = eventCoverUrl
    ? `<img src="${esc(thumb(eventCoverUrl, 240, 160))}" alt=""
         style="width:120px;height:80px;object-fit:cover;border-radius:8px;margin-top:6px;">`
    : "";
}

function openEventDialog(id = null) {
  if (!eventDialog) return;

  const existing = id
    ? eventsList.find(item => item.id === id)
    : null;

  $("eventId").value = existing?.id || "";
  $("eventTitle").value = existing?.title || "";
  $("eventCategory").value = existing?.category || "";
  $("eventDate").value = existing?.date || "";
  $("eventSummary").value = existing?.summary || "";
  $("eventDetails").value = existing?.details || "";
  $("eventCover").value = "";
  $("eventPhotos").value = "";

  eventCoverUrl = existing?.coverUrl || "";
  eventPhotos = [...(existing?.photos || [])];

  $("eventDialogTitle").textContent =
    existing ? "Edit Event / Accomplishment" : "New Event / Accomplishment";

  renderEventCoverPreview();
  renderEventPhotoList();

  eventDialog.showModal();
}

async function saveEvent() {
  const btn = $("saveEventBtn");

  const id = $("eventId").value;
  const title = $("eventTitle").value.trim();
  const category = $("eventCategory").value.trim();
  const date = $("eventDate").value;
  const summary = $("eventSummary").value.trim();
  const details = $("eventDetails").value.trim();
  const coverFile = $("eventCover").files?.[0] || null;
  const galleryFiles = Array.from($("eventPhotos").files || []);

  if (!title || !category || !date || !summary) {
    alert("Please complete the title, category, date, and short description.");
    return;
  }

  if (!eventCoverUrl && !coverFile) {
    alert("Please select a cover photo.");
    return;
  }

  try {
    setBusy(btn, true, "Uploading...", "Save Event");

    let coverUrl = eventCoverUrl;

    if (coverFile) {
      coverUrl = await uploadImage(coverFile);
    }

    const photos = [...eventPhotos];

    for (const file of galleryFiles) {
      photos.push(await uploadImage(file));
    }

    setBusy(btn, true, "Saving...", "Save Event");

    const payload = {
      title,
      category,
      date,
      year: Number(date.slice(0, 4)),
      summary,
      details,
      coverUrl,
      photos,
      updatedAt: new Date()
    };

    if (id) {
      await updateDoc(doc(db, "events", id), payload);

      safeLog({
        activity: "Updated event",
        details: `${title} • ${category} • ${date}`
      });

    } else {
      await addDoc(collection(db, "events"), {
        ...payload,
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || ""
      });

      safeLog({
        activity: "Created event",
        details: `${title} • ${category} • ${date}`
      });
    }

    eventDialog.close();
    await loadEvents();
    alert("Event saved!");

  } catch (error) {
    console.error("Save event error:", error);
    alert(error.message || "Unable to save the event.");

  } finally {
    setBusy(btn, false, "", "Save Event");
  }
}

async function deleteEvent(id) {
  const target = eventsList.find(item => item.id === id);
  if (!target) return;

  if (!confirm(`Delete "${target.title}"? This cannot be undone.`)) {
    return;
  }

  try {
    await deleteDoc(doc(db, "events", id));

    safeLog({
      activity: "Deleted event",
      details: target.title
    });

    await loadEvents();

  } catch (error) {
    console.error("Delete event error:", error);
    alert("Unable to delete the event.");
  }
}

$("openAddEvent")?.addEventListener("click", () => openEventDialog());
$("saveEventBtn")?.addEventListener("click", saveEvent);
wireClose(eventDialog, $("eventCloseBtn"), $("eventCancelBtn"));


// =====================================================
// SK OFFICIALS
// =====================================================

let officialsList = [];
let officialPhotoUrl = "";

const officialDialog = $("officialDialog");

async function loadOfficials() {
  const body = $("officialTableBody");
  if (!body) return;

  try {
    const snap = await getDocs(collection(db, "sk_officials"));

    officialsList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        if (a.isChairperson !== b.isChairperson) {
          return a.isChairperson ? -1 : 1;
        }
        return Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
      });

    renderOfficials();

  } catch (error) {
    console.error("Officials load error:", error);

    body.innerHTML = `
      <tr><td colspan="6" class="empty-state">
        Unable to load SK officials. Check Firestore rules.
      </td></tr>`;
  }
}

function renderOfficials() {
  const body = $("officialTableBody");
  const count = $("officialCountText");

  if (!body) return;

  if (!officialsList.length) {
    body.innerHTML = `
      <tr><td colspan="6" class="empty-state">
        No officials yet. Click "+ New Official" to add one.
      </td></tr>`;

    if (count) count.textContent = "0 officials";
    return;
  }

  body.innerHTML = officialsList.map(item => `
    <tr>
      <td>
        ${item.photoUrl
          ? `<img src="${esc(thumb(item.photoUrl, 90, 90))}" alt=""
               style="width:46px;height:46px;object-fit:cover;border-radius:50%;">`
          : "—"}
      </td>
      <td>
        <strong>${esc(item.name)}</strong>
        ${item.isChairperson
          ? `<small style="display:block;margin-top:4px;color:#0a696d;font-weight:700;">
               Chairperson (featured)
             </small>`
          : ""}
      </td>
      <td>${esc(item.position || "—")}</td>
      <td>${esc(item.term || "—")}</td>
      <td>
        <span class="status-pill ${item.isActive === false ? "off" : ""}">
          ${item.isActive === false ? "Inactive" : "Active"}
        </span>
      </td>
      <td>
        <div class="action-row">
          <button class="action-btn edit" type="button"
            data-edit-official="${esc(item.id)}" title="Edit">✎</button>
          <button class="action-btn delete" type="button"
            data-delete-official="${esc(item.id)}" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join("");

  if (count) {
    count.textContent =
      `${officialsList.length} official${officialsList.length === 1 ? "" : "s"}`;
  }

  body.querySelectorAll("[data-edit-official]").forEach(button =>
    button.addEventListener("click", () =>
      openOfficialDialog(button.dataset.editOfficial)
    )
  );

  body.querySelectorAll("[data-delete-official]").forEach(button =>
    button.addEventListener("click", () =>
      deleteOfficial(button.dataset.deleteOfficial)
    )
  );
}

function renderOfficialPhotoPreview() {
  const preview = $("officialPhotoPreview");
  if (!preview) return;

  preview.innerHTML = officialPhotoUrl
    ? `<img src="${esc(thumb(officialPhotoUrl, 160, 160))}" alt=""
         style="width:80px;height:80px;object-fit:cover;border-radius:50%;margin-top:6px;">`
    : "";
}

function openOfficialDialog(id = null) {
  if (!officialDialog) return;

  const existing = id
    ? officialsList.find(item => item.id === id)
    : null;

  $("officialId").value = existing?.id || "";
  $("officialName").value = existing?.name || "";
  $("officialPosition").value = existing?.position || "";
  $("officialTerm").value = existing?.term || "";
  $("officialOrder").value = existing?.sortOrder ?? "";
  $("officialStatus").value = existing?.isActive === false ? "Inactive" : "Active";
  $("officialChair").value = existing?.isChairperson ? "Yes" : "No";
  $("officialPhoto").value = "";

  officialPhotoUrl = existing?.photoUrl || "";

  $("officialDialogTitle").textContent =
    existing ? "Edit SK Official" : "New SK Official";

  renderOfficialPhotoPreview();

  officialDialog.showModal();
}

async function saveOfficial() {
  const btn = $("saveOfficialBtn");

  const id = $("officialId").value;
  const name = $("officialName").value.trim();
  const position = $("officialPosition").value.trim();
  const term = $("officialTerm").value.trim();
  const sortOrder = Number($("officialOrder").value) || 999;
  const isActive = $("officialStatus").value === "Active";
  const isChairperson = $("officialChair").value === "Yes";
  const photoFile = $("officialPhoto").files?.[0] || null;

  if (!name || !position) {
    alert("Please enter the official's name and position.");
    return;
  }

  if (!officialPhotoUrl && !photoFile) {
    alert("Please select a photo.");
    return;
  }

  try {
    setBusy(btn, true, "Uploading...", "Save Official");

    // Only one featured chairperson at a time
    if (isChairperson && isActive) {
      const otherChair = officialsList.find(
        item =>
          item.isChairperson &&
          item.isActive !== false &&
          item.id !== id
      );

      if (otherChair) {
        const replace = confirm(
          `${otherChair.name} is currently the featured Chairperson.\n\n` +
          "Replace them with this official?"
        );

        if (!replace) {
          return;
        }

        await updateDoc(doc(db, "sk_officials", otherChair.id), {
          isChairperson: false,
          updatedAt: new Date()
        });
      }
    }

    let photoUrl = officialPhotoUrl;

    if (photoFile) {
      photoUrl = await uploadImage(photoFile);
    }

    setBusy(btn, true, "Saving...", "Save Official");

    const payload = {
      name,
      position,
      term,
      sortOrder,
      isActive,
      isChairperson,
      photoUrl,
      updatedAt: new Date()
    };

    if (id) {
      await updateDoc(doc(db, "sk_officials", id), payload);

      safeLog({
        activity: "Updated SK official",
        details: `${name} • ${position} • ${isActive ? "Active" : "Inactive"}`
      });

    } else {
      await addDoc(collection(db, "sk_officials"), {
        ...payload,
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || ""
      });

      safeLog({
        activity: "Added SK official",
        details: `${name} • ${position}`
      });
    }

    officialDialog.close();
    await loadOfficials();
    alert("SK official saved!");

  } catch (error) {
    console.error("Save official error:", error);
    alert(error.message || "Unable to save the SK official.");

  } finally {
    setBusy(btn, false, "", "Save Official");
  }
}

async function deleteOfficial(id) {
  const target = officialsList.find(item => item.id === id);
  if (!target) return;

  if (!confirm(
    `Delete ${target.name}? This cannot be undone.\n\n` +
    "Tip: if the term simply ended, set the status to Inactive instead."
  )) {
    return;
  }

  try {
    await deleteDoc(doc(db, "sk_officials", id));

    safeLog({
      activity: "Deleted SK official",
      details: `${target.name} • ${target.position || ""}`
    });

    await loadOfficials();

  } catch (error) {
    console.error("Delete official error:", error);
    alert("Unable to delete the SK official.");
  }
}

$("openAddOfficial")?.addEventListener("click", () => openOfficialDialog());
$("saveOfficialBtn")?.addEventListener("click", saveOfficial);
wireClose(officialDialog, $("officialCloseBtn"), $("officialCancelBtn"));


// =====================================================
// INITIALIZE
// =====================================================

Promise.allSettled([
  loadEvents(),
  loadOfficials()
]);