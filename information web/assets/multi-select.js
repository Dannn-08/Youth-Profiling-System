// =====================================================
// MULTI-SELECT FOR HOBBIES / SKILLS AND SPORTS
//
// Finds <input name="hobbies"> and <input name="sports">
// and replaces them with a dropdown that has checkboxes.
// The original input stays in the form (hidden) and keeps
// its name, so the value is still saved as:
//   "Singing, Dancing, Chess"
// which means the charts and old records keep working.
//
// Works on the registration form, the admin Add/Edit Youth
// dialog, and any other page where the script is loaded.
// =====================================================

const CONFIG = {
  hobbies: {
    placeholder: "Select hobbies / skills",
    options: [
      "Singing",
      "Dancing",
      "Playing a Musical Instrument",
      "Drawing & Painting",
      "Writing & Poetry",
      "Photography & Videography",
      "Cooking & Baking",
      "Gardening",
      "Gaming & Esports",
      "Coding & Programming",
      "Graphic Design & Video Editing",
      "Public Speaking & Hosting",
      "Sewing & Crafts",
      "Acting & Theater",
      "Content Creation & Vlogging",
      "Reading"
    ]
  },

  sports: {
    placeholder: "Select sports interests",
    exclusive: "None",
    options: [
      "Basketball",
      "Volleyball",
      "Badminton",
      "Table Tennis",
      "Football",
      "Baseball & Softball",
      "Swimming",
      "Running & Athletics",
      "Cycling",
      "Billiards",
      "Chess",
      "Sepak Takraw",
      "Arnis",
      "Zumba & Aerobics",
      "Boxing & Martial Arts",
      "None"
    ]
  }
};


// =====================================================
// HELPERS
// =====================================================

function parseItems(value) {
  const seen = new Set();

  return String(value || "")
    .split(/[,;|]+/)
    .map(item => item.trim())
    .filter(item => {
      const key = item.toLowerCase();

      if (!item || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function luminanceOf(colorText) {
  const numbers = String(colorText).match(/[\d.]+/g);

  if (!numbers || numbers.length < 3) {
    return 0;
  }

  let [r, g, b] = numbers.slice(0, 3).map(Number);

  if (String(colorText).startsWith("color(")) {
    r *= 255;
    g *= 255;
    b *= 255;
  }

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}


// =====================================================
// UPGRADE ONE INPUT
// =====================================================

function upgrade(input) {
  const cfg = CONFIG[input.name];

  if (!cfg || input.dataset.msUpgraded) {
    return;
  }

  input.dataset.msUpgraded = "1";

  // Copy the look of the original input before hiding it.
  const cs = getComputedStyle(input);

  const look = {
    color: cs.color,
    background: cs.backgroundColor,
    borderWidth: cs.borderTopWidth,
    borderStyle: cs.borderTopStyle,
    borderColor: cs.borderTopColor,
    radius: cs.borderTopLeftRadius,
    padding: cs.padding,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    height: cs.height
  };

  const dark = luminanceOf(look.color) > 0.55;

  const theme = dark
    ? {
        panelBg: "#0d4a4d",
        panelBorder: "rgba(255,255,255,.18)",
        text: "#eaf3f3",
        hover: "rgba(255,255,255,.08)",
        accent: "#d8ad76",
        accentText: "#063f42",
        tagBg: "rgba(216,173,118,.22)",
        boxBorder: "rgba(255,255,255,.5)"
      }
    : {
        panelBg: "#ffffff",
        panelBorder: "#d6e0e1",
        text: "#0a2f31",
        hover: "#eef4f4",
        accent: "#0a5255",
        accentText: "#ffffff",
        tagBg: "rgba(10,82,85,.10)",
        boxBorder: "#9db2b4"
      };


  // ---------- wrapper + hidden original input ----------

  const wrap = document.createElement("div");
  wrap.className = "ms-wrap";
  wrap.style.cssText = "position:relative; width:100%;";

  input.insertAdjacentElement("afterend", wrap);
  wrap.append(input);

  Object.assign(input.style, {
    position: "absolute",
    left: "0",
    bottom: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none"
  });

  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");


  // ---------- trigger (looks like the other fields) ----------

  const trigger = document.createElement("div");

  trigger.setAttribute("role", "button");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.tabIndex = 0;

  trigger.style.cssText = `
    display:flex; align-items:center; gap:10px;
    width:100%; box-sizing:border-box; cursor:pointer;
    min-height:${look.height};
    padding:${look.padding};
    color:${look.color};
    background:${look.background};
    border:${look.borderWidth} ${look.borderStyle} ${look.borderColor};
    border-radius:${look.radius};
    font-family:${look.fontFamily};
    font-size:${look.fontSize};
  `;

  const tagsBox = document.createElement("div");
  tagsBox.style.cssText =
    "flex:1; display:flex; flex-wrap:wrap; gap:6px; min-width:0;";

  const arrow = document.createElement("span");
  arrow.textContent = "▾";
  arrow.style.cssText = "opacity:.7; transition:transform .15s;";

  trigger.append(tagsBox, arrow);


  // ---------- panel with checkbox rows ----------

  const panel = document.createElement("div");

  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-multiselectable", "true");

  panel.style.cssText = `
    display:none; margin-top:6px;
    max-height:260px; overflow:auto;
    background:${theme.panelBg};
    color:${theme.text};
    border:1px solid ${theme.panelBorder};
    border-radius:12px;
    box-sizing:border-box;
    font-family:${look.fontFamily};
    font-size:${look.fontSize};
  `;

  function makeRow(label) {
    const row = document.createElement("div");

    row.setAttribute("role", "option");

    row.style.cssText = `
      display:flex; align-items:center; gap:12px;
      padding:10px 14px; cursor:pointer; user-select:none;
    `;

    const box = document.createElement("span");

    box.style.cssText = `
      flex:none; width:18px; height:18px; box-sizing:border-box;
      border:2px solid ${theme.boxBorder}; border-radius:5px;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:700; line-height:1;
    `;

    const text = document.createElement("span");
    text.textContent = label;

    row.append(box, text);

    row.addEventListener("mouseenter", () => {
      row.style.background = theme.hover;
    });

    row.addEventListener("mouseleave", () => {
      row.style.background = "transparent";
    });

    function setChecked(checked) {
      row.setAttribute("aria-selected", checked ? "true" : "false");
      box.textContent = checked ? "✓" : "";
      box.style.background = checked ? theme.accent : "transparent";
      box.style.borderColor = checked ? theme.accent : theme.boxBorder;
      box.style.color = theme.accentText;
    }

    setChecked(false);

    return { row, setChecked };
  }


  // ---------- state ----------

  const selected = new Set();
  let othersOn = false;
  let customText = "";

  const optionRows = new Map();

  cfg.options.forEach(label => {
    const item = makeRow(label);

    optionRows.set(label, item);
    panel.append(item.row);

    item.row.addEventListener("click", event => {
      event.preventDefault();

      if (selected.has(label)) {
        selected.delete(label);
      } else {
        if (cfg.exclusive) {
          if (label === cfg.exclusive) {
            selected.clear();
            othersOn = false;
            customText = "";
            othersInput.value = "";
          } else {
            selected.delete(cfg.exclusive);
          }
        }

        selected.add(label);
      }

      update(true);
    });
  });

  // "Others" row + text box
  const othersItem = makeRow("Others (please specify)");

  const othersInput = document.createElement("input");

  othersInput.type = "text";
  othersInput.placeholder = "Type here (separate with commas)";
  othersInput.autocomplete = "off";

  othersInput.style.cssText = `
    display:none; width:calc(100% - 28px); box-sizing:border-box;
    margin:0 14px 12px; padding:10px 12px;
    background:transparent; color:${theme.text};
    border:1px solid ${theme.panelBorder}; border-radius:8px;
    font-family:inherit; font-size:inherit;
  `;

  othersItem.row.addEventListener("click", event => {
    event.preventDefault();

    othersOn = !othersOn;

    if (othersOn && cfg.exclusive) {
      selected.delete(cfg.exclusive);
    }

    if (!othersOn) {
      customText = "";
      othersInput.value = "";
    }

    update(true);

    if (othersOn) {
      othersInput.focus();
    }
  });

  othersInput.addEventListener("input", () => {
    customText = othersInput.value;
    update(true, { keepOthersText: true });
  });

  othersInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  panel.append(othersItem.row, othersInput);
  wrap.append(trigger, panel);


  // ---------- value handling ----------

  function customItems() {
    return parseItems(customText);
  }

  function compose() {
    const base = cfg.options.filter(option => selected.has(option));

    const extras = othersOn
      ? customItems().filter(
          item =>
            !base.some(b => b.toLowerCase() === item.toLowerCase())
        )
      : [];

    return [...base, ...extras].join(", ");
  }

  function renderTags() {
    tagsBox.replaceChildren();

    const base = cfg.options.filter(option => selected.has(option));
    const extras = othersOn ? customItems() : [];

    if (!base.length && !extras.length) {
      const placeholder = document.createElement("span");

      placeholder.textContent = cfg.placeholder;
      placeholder.style.cssText = "opacity:.55;";

      tagsBox.append(placeholder);
      return;
    }

    function addTag(label, onRemove) {
      const tag = document.createElement("span");

      tag.style.cssText = `
        display:inline-flex; align-items:center; gap:6px;
        padding:3px 10px; border-radius:999px;
        background:${theme.tagBg}; font-size:.85em;
      `;

      const text = document.createElement("span");
      text.textContent = label;

      const remove = document.createElement("span");

      remove.textContent = "✕";
      remove.setAttribute("role", "button");
      remove.setAttribute("aria-label", `Remove ${label}`);
      remove.style.cssText = "cursor:pointer; opacity:.7; font-size:.8em;";

      remove.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
        update(true);
      });

      tag.append(text, remove);
      tagsBox.append(tag);
    }

    base.forEach(option =>
      addTag(option, () => selected.delete(option))
    );

    extras.forEach(item =>
      addTag(item, () => {
        customText = customItems()
          .filter(c => c.toLowerCase() !== item.toLowerCase())
          .join(", ");

        othersInput.value = customText;
      })
    );
  }

  function update(fromUser, options = {}) {
    optionRows.forEach((item, label) =>
      item.setChecked(selected.has(label))
    );

    othersItem.setChecked(othersOn);
    othersInput.style.display = othersOn ? "block" : "none";

    if (!options.keepOthersText) {
      othersInput.value = customText;
    }

    renderTags();

    const value = compose();

    input.value = value;

    input.setCustomValidity(
      input.required && !value
        ? "Please choose at least one option."
        : ""
    );

    if (fromUser) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function load(value) {
    selected.clear();

    const custom = [];

    parseItems(value).forEach(item => {
      const match = cfg.options.find(
        option => option.toLowerCase() === item.toLowerCase()
      );

      if (match) {
        selected.add(match);
      } else {
        custom.push(item);
      }
    });

    customText = custom.join(", ");
    othersOn = custom.length > 0;

    update(false);
  }


  // ---------- open / close ----------

  function setOpen(open) {
    panel.style.display = open ? "block" : "none";
    arrow.style.transform = open ? "rotate(180deg)" : "none";
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function isOpen() {
    return panel.style.display === "block";
  }

  trigger.addEventListener("click", event => {
    event.preventDefault();
    setOpen(!isOpen());
  });

  trigger.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(!isOpen());
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  document.addEventListener("click", event => {
    if (!wrap.contains(event.target)) {
      setOpen(false);
    }
  });

  // If the form says this field is empty, bring it into view.
  input.addEventListener("invalid", () => {
    wrap.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  // Keep the dropdown in sync when the form is reset.
  input.form?.addEventListener("reset", () => {
    setTimeout(() => load(input.value), 0);
  });

  load(input.value);
}


// =====================================================
// FIND INPUTS (now and whenever the page adds new ones)
// =====================================================

function scan() {
  document
    .querySelectorAll('input[name="hobbies"], input[name="sports"]')
    .forEach(upgrade);
}

scan();

new MutationObserver(scan).observe(document.body, {
  childList: true,
  subtree: true
});