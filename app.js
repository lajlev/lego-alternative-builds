/* ============================================================
   10698 Build Lab — a tiny hash-routed app over window.BUILDS
   ============================================================ */
(function () {
  "use strict";

  var BUILDS = (window.BUILDS || []).slice();
  var app = document.getElementById("app");
  var tabs = document.getElementById("tabs");
  var STORE = "lego10698:";

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function save(key, val) {
    try { localStorage.setItem(STORE + key, JSON.stringify(val)); } catch (e) {}
  }
  function load(key, fallback) {
    try {
      var v = localStorage.getItem(STORE + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }

  function difficulty(parts) {
    if (parts < 240) return { label: "Easy", cls: "solid-green" };
    if (parts <= 290) return { label: "Medium", cls: "solid-yellow" };
    return { label: "Challenging", cls: "solid-red" };
  }

  // Primary way to actually follow the build.
  function primaryInstructions(b) {
    if (b.instructions) return { label: "Building instructions (PDF)", href: b.instructions, kind: "pdf" };
    var u = b.instructions_url || "";
    if (/youtu\.?be|youtube\.com/.test(u)) return { label: "Watch build video", href: u, kind: "video" };
    return { label: "Instructions on Rebrickable", href: b.url, kind: "rebrickable" };
  }
  function instructionsBadge(b) {
    var k = primaryInstructions(b).kind;
    return k === "pdf" ? "PDF" : k === "video" ? "Video" : "Rebrickable";
  }
  function cardActionLabel(kind) {
    return kind === "pdf" ? "Instructions" : kind === "video" ? "Watch video" : "Instructions";
  }

  function chip(text, cls) {
    return '<span class="chip ' + (cls || "") + '">' + esc(text) + "</span>";
  }

  /* ---------- card (browse) ---------- */

  function cardMarkup(b) {
    var d = difficulty(b.parts);
    var ins = primaryInstructions(b);
    return (
      '<article class="card fade-in">' +
        '<div class="thumb"><img loading="lazy" tabindex="0" role="button" ' +
          'aria-label="View ' + esc(b.title) + ' full screen" ' +
          'data-full="' + esc(b.image) + '" data-caption="' + esc(b.title + " — by " + b.creator) + '" ' +
          'src="' + esc(b.image) + '" alt="LEGO render of ' + esc(b.title) + '"></div>' +
        '<div class="card-body">' +
          "<h3>" + esc(b.title) + "</h3>" +
          '<p class="by">by ' + esc(b.creator) + "</p>" +
          '<div class="chips">' +
            chip(b.parts + " parts") +
            chip(b.type) +
            chip(d.label, d.cls) +
            chip(instructionsBadge(b)) +
          "</div>" +
          '<div class="card-actions">' +
            '<a class="btn red" href="' + esc(ins.href) + '" target="_blank" rel="noopener">' + esc(cardActionLabel(ins.kind)) + "</a>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- view: random ---------- */

  var lastRandomId = null;

  function pickRandom() {
    if (BUILDS.length === 0) return null;
    if (BUILDS.length === 1) return BUILDS[0];
    var choice;
    do {
      choice = BUILDS[Math.floor(Math.random() * BUILDS.length)];
    } while (choice.id === lastRandomId);
    lastRandomId = choice.id;
    return choice;
  }

  function renderRandom(build) {
    var b = build || pickRandom();
    if (!b) return renderEmpty();
    var d = difficulty(b.parts);
    var ins = primaryInstructions(b);

    app.innerHTML =
      '<div class="view-head">' +
        "<h1>Your build for today</h1>" +
        "<p>One alternative model from the 10698 box, picked at random. Not feeling it? Shuffle again.</p>" +
      "</div>" +
      '<section class="spotlight fade-in">' +
        '<div class="media"><img tabindex="0" role="button" ' +
          'aria-label="View ' + esc(b.title) + ' full screen" ' +
          'data-full="' + esc(b.image) + '" data-caption="' + esc(b.title + " — by " + b.creator) + '" ' +
          'src="' + esc(b.image) + '" alt="LEGO render of ' + esc(b.title) + '"></div>' +
        '<div class="body">' +
          "<h2>" + esc(b.title) + "</h2>" +
          '<p class="by">designed by ' + esc(b.creator) + "</p>" +
          '<div class="chips">' +
            chip(b.parts + " parts") + chip(b.type) + chip(d.label, d.cls) +
          "</div>" +
          '<p class="blurb">' + esc(b.blurb) + "</p>" +
          '<div class="actions">' +
            '<a class="btn red" href="' + esc(ins.href) + '" target="_blank" rel="noopener">' + esc(ins.label) + "</a>" +
            '<button class="btn ghost" id="shuffle">🎲 Shuffle again</button>' +
          "</div>" +
          '<div class="sub-actions">' +
            '<a href="' + esc(b.url) + '" target="_blank" rel="noopener">Details on Rebrickable ↗</a>' +
            (b.instructions && b.instructions_url && b.instructions_url !== b.url
              ? '<a href="' + esc(b.instructions_url) + '" target="_blank" rel="noopener">Mirror / source ↗</a>'
              : "") +
          "</div>" +
        "</div>" +
      "</section>" +
      '<p class="dice-hint">Tip: press <kbd>R</kbd> for another random build.</p>';

    var btn = document.getElementById("shuffle");
    if (btn) btn.addEventListener("click", function () { renderRandom(); });
  }

  /* ---------- view: browse ---------- */

  var SORTS = {
    "title-asc": { label: "Name (A–Z)", fn: function (a, b) { return a.title.localeCompare(b.title); } },
    "title-desc": { label: "Name (Z–A)", fn: function (a, b) { return b.title.localeCompare(a.title); } },
    "parts-asc": { label: "Fewest parts", fn: function (a, b) { return a.parts - b.parts; } },
    "parts-desc": { label: "Most parts", fn: function (a, b) { return b.parts - a.parts; } },
    "creator-asc": { label: "Creator (A–Z)", fn: function (a, b) { return a.creator.localeCompare(b.creator) || a.title.localeCompare(b.title); } },
    "type-asc": { label: "Model type", fn: function (a, b) { return a.type.localeCompare(b.type) || a.title.localeCompare(b.title); } },
    "random": { label: "Surprise order", fn: function () { return Math.random() - 0.5; } },
  };
  // Facet filters. `values` fixed where order matters, else derived from the data.
  var FACETS = {
    complexity: {
      label: "Complexity",
      any: "Any complexity",
      values: ["Easy", "Medium", "Challenging"],
      get: function (b) { return difficulty(b.parts).label; },
    },
    type: {
      label: "Type",
      any: "Any type",
      get: function (b) { return b.type; },
    },
    creator: {
      label: "Designer",
      any: "Any designer",
      get: function (b) { return b.creator; },
    },
    instructions: {
      label: "Instructions",
      any: "Any instructions",
      values: ["PDF", "Video", "Rebrickable"],
      get: function (b) {
        var k = primaryInstructions(b).kind;
        return k === "pdf" ? "PDF" : k === "video" ? "Video" : "Rebrickable";
      },
    },
  };

  function facetValues(key) {
    if (FACETS[key].values) return FACETS[key].values.slice();
    var seen = {};
    BUILDS.forEach(function (b) { seen[FACETS[key].get(b)] = true; });
    return Object.keys(seen).sort();
  }

  function renderBrowse() {
    var sortKey = load("sort", "title-asc");
    if (!SORTS[sortKey]) sortKey = "title-asc";
    var active = load("facets", {});
    Object.keys(active).forEach(function (k) {
      if (!FACETS[k] || facetValues(k).indexOf(active[k]) < 0) delete active[k];
    });

    var sortOptions = Object.keys(SORTS).map(function (k) {
      return '<option value="' + k + '"' + (k === sortKey ? " selected" : "") + ">" + esc(SORTS[k].label) + "</option>";
    }).join("");

    var facetSelects = Object.keys(FACETS).map(function (k) {
      var opts = ['<option value="">' + esc(FACETS[k].any) + "</option>"].concat(
        facetValues(k).map(function (v) {
          return '<option value="' + esc(v) + '"' + (active[k] === v ? " selected" : "") + ">" + esc(v) + "</option>";
        })
      ).join("");
      return (
        '<div class="field"><label for="f-' + k + '">' + esc(FACETS[k].label) + "</label>" +
        '<select id="f-' + k + '" data-facet="' + k + '">' + opts + "</select></div>"
      );
    }).join("");

    app.innerHTML =
      '<div class="view-head">' +
        "<h1>Browse the builds</h1>" +
        "<p>Every alternative model in the catalogue — sort and filter to find your next build.</p>" +
      "</div>" +
      '<div class="toolbar">' +
        '<div class="field"><label for="sort">Sort</label>' +
          '<select id="sort">' + sortOptions + "</select></div>" +
        facetSelects +
        '<button class="reset-filters" id="reset" hidden>Reset</button>' +
        '<span class="count" id="count"></span>' +
      "</div>" +
      '<div class="grid" id="grid"></div>';

    function paint() {
      var list = BUILDS.filter(function (b) {
        return Object.keys(active).every(function (k) { return FACETS[k].get(b) === active[k]; });
      }).slice().sort(SORTS[sortKey].fn);

      document.getElementById("count").textContent =
        list.length + (list.length === 1 ? " build" : " builds") +
        (Object.keys(active).length ? " of " + BUILDS.length : "");
      document.getElementById("reset").hidden = Object.keys(active).length === 0;
      document.getElementById("grid").innerHTML = list.length
        ? list.map(cardMarkup).join("")
        : '<p class="empty">No builds match these filters.</p>';
    }

    document.getElementById("sort").addEventListener("change", function (e) {
      sortKey = e.target.value;
      save("sort", sortKey);
      paint();
    });
    app.querySelectorAll("select[data-facet]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var k = sel.getAttribute("data-facet");
        if (sel.value) active[k] = sel.value; else delete active[k];
        save("facets", active);
        paint();
      });
    });
    document.getElementById("reset").addEventListener("click", function () {
      Object.keys(active).forEach(function (k) { delete active[k]; });
      save("facets", active);
      app.querySelectorAll("select[data-facet]").forEach(function (s) { s.value = ""; });
      paint();
    });

    paint();
  }

  /* ---------- view: christmas calendar ---------- */

  var countdownTimer = null;

  function renderCalendar() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

    var target = new Date(Date.UTC(2026, 11, 1, 0, 0, 0)); // 1 Dec 2026

    var doors = "";
    for (var i = 1; i <= 24; i++) {
      doors += '<div class="door' + (i === 24 ? " peek" : "") + '" aria-disabled="true">' + i + "</div>";
    }

    app.innerHTML =
      '<section class="calendar-hero fade-in">' +
        '<span class="soon-pill">❄ Coming soon</span>' +
        "<h1>10698 Christmas Calendar</h1>" +
        "<p>Twenty-four tiny festive builds, one for each day of December — each one buildable from just the Large Creative Brick Box. Doors unlock this winter.</p>" +
        '<div class="countdown" id="countdown"></div>' +
      "</section>" +
      '<div class="door-grid">' + doors + "</div>";

    function tick() {
      var box = document.getElementById("countdown");
      if (!box) { clearInterval(countdownTimer); return; }
      var diff = target - new Date();
      if (diff <= 0) {
        box.innerHTML = '<div class="unit"><div class="num">🎄</div><div class="lbl">It\'s December — doors opening soon</div></div>';
        clearInterval(countdownTimer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var parts = [
        [Math.floor(s / 86400), "days"],
        [Math.floor((s % 86400) / 3600), "hours"],
        [Math.floor((s % 3600) / 60), "minutes"],
        [s % 60, "seconds"],
      ];
      box.innerHTML = parts.map(function (p) {
        return '<div class="unit"><div class="num">' + p[0] + '</div><div class="lbl">' + p[1] + "</div></div>";
      }).join("");
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  /* ---------- empty state ---------- */

  function renderEmpty() {
    app.innerHTML = '<p class="empty">No build data found. Check that <code>data.js</code> loaded.</p>';
  }

  /* ---------- lightbox (fullscreen image) ---------- */

  var lightbox = null;

  function ensureLightbox() {
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox || e.target.closest(".lb-close")) closeLightbox();
    });
    document.body.appendChild(lightbox);
    return lightbox;
  }

  function openLightbox(src, caption) {
    var lb = ensureLightbox();
    lb.querySelector("img").src = src;
    lb.querySelector("img").alt = caption || "";
    lb.querySelector("figcaption").textContent = caption || "";
    lb.hidden = false;
    document.body.classList.add("lb-open");
    lb.querySelector(".lb-close").focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lb-open");
  }

  app.addEventListener("click", function (e) {
    var img = e.target.closest("img[data-full]");
    if (img) openLightbox(img.getAttribute("data-full"), img.getAttribute("data-caption"));
  });
  app.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var img = e.target.closest("img[data-full]");
    if (img) { e.preventDefault(); openLightbox(img.getAttribute("data-full"), img.getAttribute("data-caption")); }
  });

  /* ---------- router ---------- */

  var routes = {
    random: renderRandom,
    browse: renderBrowse,
    calendar: renderCalendar,
  };

  function currentRoute() {
    var h = (location.hash || "").replace(/^#\/?/, "").split("/")[0];
    return routes[h] ? h : "random";
  }

  function route() {
    var name = currentRoute();
    closeLightbox();
    if (name !== "calendar" && countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    [].forEach.call(tabs.querySelectorAll("a"), function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });
    window.scrollTo({ top: 0, behavior: "auto" });
    routes[name]();
  }

  window.addEventListener("hashchange", route);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeLightbox(); return; }
    if (lightbox && !lightbox.hidden) return;
    if (e.target.matches("input, select, textarea")) return;
    if ((e.key === "r" || e.key === "R") && currentRoute() === "random") renderRandom();
  });

  if (!location.hash) location.replace("#/random");
  route();
})();
