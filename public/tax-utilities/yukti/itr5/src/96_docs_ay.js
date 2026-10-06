/* ===========================================================================
   Toolbar extensions — Date-Range selector (replaces the plain A.Y. dropdown)
   + "Import docs" (attach & record). Added 2026-10-06 (user request).

   Kept in its OWN file so the pre-existing shell (95_shell.js) stays untouched.
   Everything persists by living inside the form's own `S` working state:
   saveFile() copies every S key into the .yukti working file, importFile()
   restores them, and the host autosave bridge snapshots `JSON.stringify(S)` —
   so `S.dateRange` {from,to}, the derived `S.aySel`, and the `S.documents`
   list ride along and come back on reload with no shell changes.

   The A.Y. is now chosen by picking the period in detail: a From/To date box
   (modelled on the app's own DateRangeFilter) opens from the toolbar, with
   quick A.Y. presets. The Assessment Year shown is derived from the "To" date.
   Scope note: computation and the official e-filing return stay pinned to
   A.Y. 2026-27 (the only ruleset built); this records the chosen period.
   =========================================================================== */
(function () {
  "use strict";

  /* default period = Previous Year 2025-26 → Assessment Year 2026-27 */
  var DEF_FROM = "2025-04-01", DEF_TO = "2026-03-31";

  /* `S` is a top-level const in the shared global lexical scope. */
  function st() { try { return (typeof S !== "undefined" && S) ? S : null; } catch (e) { return null; } }
  function docs() { var s = st(); if (!s) return []; if (!Array.isArray(s.documents)) s.documents = []; return s.documents; }
  function range() {
    var s = st();
    if (!s) return { from: DEF_FROM, to: DEF_TO };
    if (!s.dateRange || typeof s.dateRange !== "object") s.dateRange = { from: DEF_FROM, to: DEF_TO };
    if (!s.dateRange.from) s.dateRange.from = DEF_FROM;
    if (!s.dateRange.to) s.dateRange.to = DEF_TO;
    return s.dateRange;
  }
  function setRange(from, to) {
    var r = range(); if (from) r.from = from; if (to) r.to = to;
    var s = st(); if (s) s.aySel = deriveAY(r.to);
  }
  /* Assessment Year from a yyyy-mm-dd "To" date: Apr–Mar financial year, AY is
     the year after the FY ends. */
  function deriveAY(iso) {
    var p = String(iso || "").split("-");
    if (p.length < 3) return "2026-27";
    var y = +p[0], m = +p[1];
    var start = (m >= 4) ? y + 1 : y;
    return start + "-" + String((start + 1) % 100).padStart(2, "0");
  }
  /* AY start-year (e.g. 2026 for "2026-27") → its Previous-Year date range. */
  function ayRange(ayStart) { return { from: (ayStart - 1) + "-04-01", to: ayStart + "-03-31" }; }
  var PRESETS = [
    { l: "A.Y. 2024-25", ay: 2024 }, { l: "A.Y. 2025-26", ay: 2025 },
    { l: "A.Y. 2026-27", ay: 2026 }, { l: "A.Y. 2027-28", ay: 2027 }
  ];
  function fmtDMY(iso) { var p = String(iso || "").split("-"); return p.length === 3 ? (p[2] + "-" + p[1] + "-" + p[0]) : iso; }

  function fmtSize(n) {
    if (n == null) return "";
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }
  /* Ping the host autosave (it listens for change/input in capture on the
     document). Always fire on <body> — NEVER on an input that has its own
     change handler, or we'd recurse. */
  function notifyHost() { try { document.body.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ----------------------------------------- 26AS / AIS → Taxes paid --------
     The Income-Tax portal cannot be auto-fetched (authenticated, no API), so
     the user downloads 26AS/AIS from the portal and imports the file here. We
     parse it into the "Taxes paid" grids (S.tds1/tds2/tds3/tcs/it) and, after
     an explicit review step, write the rows and open the e-Filing portal.
     Text (TRACES 26AS) parses most reliably; AIS JSON is best-effort. Fields
     map to the ITR-1 paid grids; other forms attach the file for record. */
  var EFILING_URL = "https://eportal.incometax.gov.in/iec/foservices/#/login";
  var TAN_RE = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
  var BSR_RE = /^[0-9]{7}$/;
  function defYr() { return (range().from || "2025-04-01").split("-")[0] || "2025"; }
  function num(s) { s = String(s == null ? "" : s).replace(/[,\s₹]/g, ""); return /^-?\d+(\.\d+)?$/.test(s) ? s : ""; }
  function toISODate(s) {
    s = String(s || "").trim(); var m;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/); if (m) return m[3] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[1]).slice(-2);
    var mon = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    m = s.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3})[A-Za-z]*[-\/ ](\d{4})$/); if (m && mon[m[2].toLowerCase()]) return m[3] + "-" + mon[m[2].toLowerCase()] + "-" + ("0" + m[1]).slice(-2);
    return "";
  }
  function mapSec(s) {
    s = String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
    try {
      if (typeof PD_TDSSEC !== "undefined") {
        for (var i = 0; i < PD_TDSSEC.length; i++) if (PD_TDSSEC[i][0] === s) return s;
        var alt = s.replace(/^1/, "");
        for (var j = 0; j < PD_TDSSEC.length; j++) if (PD_TDSSEC[j][0] === alt) return alt;
      }
    } catch (e) {}
    return "94A";
  }
  function parseStatement(raw) {
    var res = { tds1: [], tds2: [], tds3: [], tcs: [], it: [], source: "26AS (Text)" };
    var t = String(raw || "").replace(/^﻿/, "").trim();
    if (t.charAt(0) === "{" || t.charAt(0) === "[") { try { parseAisJson(JSON.parse(t), res); res.source = "AIS (JSON)"; return res; } catch (e) {} }
    parse26asText(String(raw || ""), res); return res;
  }
  function parse26asText(txt, res) {
    var lines = txt.split(/\r?\n/), part = "";
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li], low = line.toLowerCase();
      if (/collected at source/.test(low)) part = "TCS";
      else if (/deducted at source/.test(low)) part = "TDS";
      else if (/other than tds|other than tcs|details of tax paid|advance tax|self[- ]?assessment|challan/.test(low)) part = "CHALLAN";
      var cells = line.split(/\^|\t|\|/).map(function (s) { return s.trim(); });
      var tan = null, bsr = null, sec = "", name = "", nums = [], dt = "";
      for (var c = 0; c < cells.length; c++) {
        var v = cells[c]; if (!v) continue;
        if (!tan && TAN_RE.test(v)) { tan = v; continue; }
        if (!bsr && part === "CHALLAN" && BSR_RE.test(v)) { bsr = v; continue; }
        if (!sec && /^(19[2-9][A-Z]?|20[0-9][A-Z]?|9[0-9][A-Z]{0,2})$/.test(v)) { sec = v; continue; }
        if (!dt) { var d = toISODate(v); if (d) { dt = d; continue; } }
        var n = num(v); if (n !== "") { nums.push(n); continue; }
        if (/[A-Za-z]{3,}/.test(v) && !TAN_RE.test(v) && v.length > name.length) name = v;
      }
      if (part === "CHALLAN" && bsr && nums.length) {
        var amtC = nums[nums.length - 1];
        var snC = (nums.length >= 2 && /^\d{1,5}$/.test(nums[nums.length - 2])) ? nums[nums.length - 2] : "";
        res.it.push({ bsr: bsr, dt: dt, sn: snC, amt: amtC });
      } else if (tan && nums.length) {
        var last = nums[nums.length - 1], mx = "", mv = -1;
        for (var q = 0; q < nums.length; q++) { if (+nums[q] > mv) { mv = +nums[q]; mx = nums[q]; } }
        var paid = (nums.length > 1 && mx !== last) ? mx : "";
        if (part === "TCS") res.tcs.push({ tan: tan, name: name, yr: defYr(), bf: "", coll: last, claim: last });
        else if (/^192/.test(sec)) res.tds1.push({ tan: tan, name: name, inc: paid, tds: last });
        else res.tds2.push({ tan: tan, name: name, sec: mapSec(sec), yr: defYr(), gross: paid, tds: last, claim: last });
      }
    }
  }
  function parseAisJson(j, res) {
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      var tan = null;
      for (var k in o) { var v = o[k]; if (typeof v === "string" && TAN_RE.test(v.toUpperCase())) tan = v.toUpperCase(); }
      if (tan) {
        var amt = "", name = "";
        for (var k2 in o) {
          var v2 = o[k2];
          if (typeof v2 === "number" && v2 > 0 && !amt) amt = String(v2);
          else if (typeof v2 === "string") { if (/name|deductor|collector/i.test(k2) && v2 && !name) name = v2; var nn = num(v2); if (nn !== "" && +nn > 0 && !amt) amt = nn; }
        }
        if (amt) res.tds2.push({ tan: tan, name: name, sec: "94A", yr: defYr(), gross: "", tds: amt, claim: amt });
      }
      for (var k3 in o) walk(o[k3]);
    })(j);
  }
  function canPrefill() { var s = st(); return !!(s && Array.isArray(s.tds1) && Array.isArray(s.it)); }
  function prefillTotal(res) { return res.tds1.length + res.tds2.length + res.tds3.length + res.tcs.length + res.it.length; }
  function applyPrefill(res) {
    var s = st(); if (!s) return 0;
    var map = [["tds1", res.tds1], ["tds2", res.tds2], ["tds3", res.tds3], ["tcs", res.tcs], ["it", res.it]], n = 0;
    for (var i = 0; i < map.length; i++) {
      var key = map[i][0], rows = map[i][1];
      if (!rows || !rows.length || !Array.isArray(s[key])) continue;
      for (var r = 0; r < rows.length; r++) { s[key].push(rows[r]); n++; }
    }
    try { if (typeof commit === "function") commit(); } catch (e) {}
    try { if (typeof paint === "function") paint(); } catch (e) {}
    return n;
  }

  /* ---------------------------------------------------------------- styles -- */
  function injectCss() {
    if (document.getElementById("ay-docs-css")) return;
    var s = document.createElement("style");
    s.id = "ay-docs-css";
    s.textContent = [
      ".ay-wrap{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}",
      ".ay-wrap>.lab{font:500 12px/1 var(--yk-mono,monospace);opacity:.8;color:#fff}",
      ".ay-trigger{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px;color:#fff;cursor:pointer;",
      "font:600 12px/1 var(--yk-mono,monospace);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);border-radius:4px}",
      ".ay-trigger:hover{background:rgba(255,255,255,.22)}",
      ".ay-trigger svg{opacity:.9;flex-shrink:0}",
      /* date-range popover — white card, modelled on the app's DateRangeFilter */
      ".dr-pop{position:fixed;z-index:200;width:312px;background:#fff;color:#14191F;border:1px solid #D4E2F0;",
      "border-radius:12px;box-shadow:0 18px 40px -18px rgba(10,31,62,.5);padding:14px}",
      ".dr-pop .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}",
      ".dr-pop .hd h4{font:700 10.5px/1 var(--yk-display,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:#4C5A6A;margin:0}",
      ".dr-pop .hd .rst{font:600 11px/1 var(--yk-read,sans-serif);color:#17457F;cursor:pointer;background:none;border:0;padding:2px 2px}",
      ".dr-pop .hd .rst:hover{text-decoration:underline}",
      ".dr-pop .gr{display:grid;grid-template-columns:1fr 1fr;gap:11px}",
      ".dr-pop .gr label{display:block}",
      ".dr-pop .gr .cap{display:block;margin:0 0 4px;font:600 11px/1 var(--yk-read,sans-serif);color:#6C7E90}",
      ".dr-pop .gr input{height:33px;width:100%;padding:0 8px;color:#14191F;background:#fff;border:1px solid #D4E2F0;border-radius:8px;",
      "font:500 12px/1 var(--yk-mono,monospace);cursor:pointer}",
      ".dr-pop .gr input:focus{outline:none;border-color:#17457F;box-shadow:0 0 0 3px rgba(23,69,127,.12)}",
      ".dr-pop .ayl{margin:11px 0 0;padding:8px 10px;background:#F5FAFE;border:1px solid #E7F0F9;border-radius:8px;",
      "font:600 11.5px/1.3 var(--yk-read,sans-serif);color:#14191F}",
      ".dr-pop .ayl b{font-family:var(--yk-mono,monospace);color:#17457F}",
      ".dr-pop .ayl .sub{display:block;margin-top:3px;font:500 10px/1.3 var(--yk-read,sans-serif);color:#8496A7}",
      ".dr-pop .pz{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}",
      ".dr-pop .pz button{height:28px;padding:0 10px;font:600 11px/1 var(--yk-read,sans-serif);color:#4C5A6A;",
      "background:#fff;border:1px solid #D4E2F0;border-radius:7px;cursor:pointer}",
      ".dr-pop .pz button:hover{border-color:#9DBDE4;color:#17457F;background:#F2F7FD}",
      ".dr-pop .pz button.on{border-color:#17457F;color:#17457F;background:var(--yk-navy-soft,#DFEAF9)}",
      /* import button count badge + docs popover */
      ".b-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;margin-left:7px;padding:0 4px;",
      "border-radius:999px;background:#fff;color:var(--yk-navy-2,#0F3162);font:700 10px/1 var(--yk-display,sans-serif);vertical-align:middle}",
      ".doc-pop{position:fixed;z-index:200;width:306px;max-height:62vh;overflow:auto;background:#fff;color:#14191F;",
      "border:1px solid #D4E2F0;border-radius:10px;box-shadow:0 18px 40px -18px rgba(10,31,62,.5);padding:13px 13px 12px}",
      ".doc-pop h4{font:700 10.5px/1 var(--yk-display,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:#4C5A6A;margin:0 0 9px}",
      ".doc-pop .dl{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:6px}",
      ".doc-pop .dl li{display:flex;align-items:center;gap:8px;padding:6px 8px;background:#F5FAFE;border:1px solid #E7F0F9;border-radius:7px}",
      ".doc-pop .dl .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 12px/1.25 var(--yk-read,sans-serif);color:#14191F}",
      ".doc-pop .dl .sz{font:500 10.5px/1 var(--yk-mono,monospace);color:#8496A7;flex-shrink:0}",
      ".doc-pop .dl .rm{flex-shrink:0;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px;color:#8496A7;font-size:14px;line-height:1;cursor:pointer}",
      ".doc-pop .dl .rm:hover{background:#FBEAEA;color:#B23B33}",
      ".doc-pop .empty{font:500 11.5px/1.4 var(--yk-read,sans-serif);color:#8496A7;margin:0 0 11px}",
      ".doc-pop .add{width:100%;height:33px;border-radius:8px;background:var(--yk-navy,#17457F);color:#fff;font:700 11px/1 var(--yk-display,sans-serif);letter-spacing:.08em;text-transform:uppercase;border:0;cursor:pointer}",
      ".doc-pop .add:hover{background:var(--yk-navy-2,#0F3162)}",
      ".doc-pop .hint{margin:9px 2px 0;font:500 10.5px/1.45 var(--yk-read,sans-serif);color:#8496A7}",
      ".doc-pop .lead{font:500 11.5px/1.45 var(--yk-read,sans-serif);color:#4C5A6A;margin:0 0 10px}",
      ".doc-pop .prow{display:flex;gap:7px;margin-bottom:8px}",
      ".doc-pop .pbtn{flex:1;height:30px;border-radius:7px;border:1px solid #D4E2F0;background:#fff;color:#17457F;font:600 11px/1 var(--yk-read,sans-serif);cursor:pointer}",
      ".doc-pop .pbtn:hover{background:#F2F7FD;border-color:#9DBDE4}",
      ".doc-pop .imp-stmt{width:100%;height:33px;border-radius:8px;background:var(--yk-navy,#17457F);color:#fff;font:700 11px/1 var(--yk-display,sans-serif);letter-spacing:.06em;text-transform:uppercase;border:0;cursor:pointer}",
      ".doc-pop .imp-stmt:hover{background:var(--yk-navy-2,#0F3162)}",
      ".doc-pop .prev{margin-top:10px;padding:10px;border-radius:9px}",
      ".doc-pop .prev.warn{background:#FFF6E9;border:1px solid #F3E2C4;color:#6B5529;font:500 11.5px/1.45 var(--yk-read,sans-serif)}",
      ".doc-pop .prev.ok{background:#F5FAFE;border:1px solid #D4E2F0}",
      ".doc-pop .prev .pt{font:700 10px/1 var(--yk-display,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:#4C5A6A;margin-bottom:7px}",
      ".doc-pop .prev .pl{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:4px}",
      ".doc-pop .prev .pl li{font:600 12px/1.3 var(--yk-read,sans-serif);color:#14191F;font-variant-numeric:tabular-nums}",
      ".doc-pop .prev .apply{width:100%;height:34px;border-radius:8px;background:#2F7D5A;color:#fff;font:700 10.5px/1.2 var(--yk-display,sans-serif);letter-spacing:.04em;text-transform:uppercase;border:0;cursor:pointer;margin-bottom:6px}",
      ".doc-pop .prev .apply:hover{background:#246046}",
      ".doc-pop .prev .cancel{width:100%;height:28px;border-radius:7px;background:#fff;color:#8496A7;border:1px solid #E7F0F9;font:600 11px/1 var(--yk-read,sans-serif);cursor:pointer}",
      ".doc-pop .sep{height:1px;background:#E7F0F9;margin:13px 0 11px}"
    ].join("");
    (document.head || document.documentElement).appendChild(s);
  }

  var CAL_SVG = "<svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='18' rx='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>";
  var CHV_SVG = "<svg width='10' height='10' viewBox='0 0 10 10' fill='none' stroke='currentColor' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'><path d='M1 3l4 4 4-4'/></svg>";

  /* ------------------------------------------------- Date-Range trigger ----- */
  var trigVal, drPop, fromInp, toInp, ayLine, presetWrap;
  function buildAy() {
    var host = document.getElementById("ay") || document.querySelector(".top .y");
    if (!host || host.getAttribute("data-ay-done")) return;
    host.setAttribute("data-ay-done", "1");
    host.classList.add("ay-wrap");
    host.textContent = "";

    var lab = document.createElement("span"); lab.className = "lab"; lab.textContent = "A.Y.";
    var trig = document.createElement("button");
    trig.type = "button"; trig.className = "ay-trigger";
    trig.setAttribute("aria-label", "Select assessment-year period");
    trig.title = "Pick the return period (From / To). Computation uses A.Y. 2026-27 rules.";
    trig.innerHTML = CAL_SVG + "<span class='v'>2026-27</span>" + CHV_SVG;
    trigVal = trig.querySelector(".v");

    host.appendChild(lab); host.appendChild(trig);
    trig.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); toggleDr(); });
    window._drTrig = trig;
    updateTrigger();
  }
  function updateTrigger() { if (trigVal) trigVal.textContent = deriveAY(range().to); }

  function buildDrPop() {
    drPop = document.createElement("div");
    drPop.className = "dr-pop"; drPop.style.display = "none";
    drPop.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    drPop.innerHTML =
      "<div class='hd'><h4>Date Range</h4><button type='button' class='rst'>Reset</button></div>" +
      "<div class='gr'>" +
        "<label><span class='cap'>From</span><input type='date' class='f'></label>" +
        "<label><span class='cap'>To</span><input type='date' class='t'></label>" +
      "</div>" +
      "<div class='ayl'></div>" +
      "<div class='pz'></div>";
    document.body.appendChild(drPop);
    fromInp = drPop.querySelector(".f");
    toInp = drPop.querySelector(".t");
    ayLine = drPop.querySelector(".ayl");
    presetWrap = drPop.querySelector(".pz");

    fromInp.addEventListener("change", function () { setRange(fromInp.value, null); afterRangeChange(); });
    toInp.addEventListener("change", function () { setRange(null, toInp.value); afterRangeChange(); });
    drPop.querySelector(".rst").addEventListener("click", function () {
      setRange(DEF_FROM, DEF_TO); fromInp.value = DEF_FROM; toInp.value = DEF_TO; afterRangeChange();
    });

    PRESETS.forEach(function (p) {
      var btn = document.createElement("button");
      btn.type = "button"; btn.textContent = p.l; btn.setAttribute("data-ay", p.ay);
      btn.addEventListener("click", function () {
        var r = ayRange(p.ay); setRange(r.from, r.to);
        fromInp.value = r.from; toInp.value = r.to; afterRangeChange();
      });
      presetWrap.appendChild(btn);
    });
  }
  function afterRangeChange() { renderDr(); updateTrigger(); notifyHost(fromInp); }

  function renderDr() {
    if (!drPop) return;
    var r = range();
    if (fromInp) fromInp.value = r.from;
    if (toInp) toInp.value = r.to;
    var ay = deriveAY(r.to);
    if (ayLine) {
      ayLine.innerHTML = "Assessment Year &nbsp;<b>" + esc(ay) + "</b>" +
        "<span class='sub'>Period " + esc(fmtDMY(r.from)) + " to " + esc(fmtDMY(r.to)) +
        (ay !== "2026-27" ? " · tax computed for A.Y. 2026-27" : "") + "</span>";
    }
    if (presetWrap) {
      var btns = presetWrap.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) {
        var pr = ayRange(+btns[i].getAttribute("data-ay"));
        btns[i].classList.toggle("on", pr.from === r.from && pr.to === r.to);
      }
    }
  }

  function positionPop(pop, anchor) {
    if (!pop || !anchor) return;
    var a = anchor.getBoundingClientRect();
    pop.style.top = Math.round(a.bottom + 8) + "px";
    pop.style.left = Math.round(Math.min(a.left, window.innerWidth - pop.offsetWidth - 10)) + "px";
    pop.style.right = "auto";
  }
  function openDr() { if (!drPop) return; closePop(); renderDr(); drPop.style.display = "block"; positionPop(drPop, window._drTrig); }
  function closeDr() { if (drPop) drPop.style.display = "none"; }
  function toggleDr() { if (drPop && drPop.style.display === "block") closeDr(); else openDr(); }

  /* --------------------------------------------------------- Import docs ---- */
  var importBtn, fileInput, stmtInput, pop, countEl, pending = null;
  function buildImport() {
    importBtn = document.getElementById("b_import");
    if (!importBtn || importBtn.getAttribute("data-imp-done")) return;
    importBtn.setAttribute("data-imp-done", "1");

    countEl = document.createElement("span");
    countEl.className = "b-count"; countEl.style.display = "none";
    importBtn.appendChild(countEl);

    /* attachment picker (supporting documents) */
    fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.multiple = true;
    fileInput.accept = ".pdf,.jpg,.jpeg,.png,.csv,.xls,.xlsx,.json,.xml,.zip,image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    fileInput.addEventListener("change", function (e) {
      var fl = e.target.files; if (!fl || !fl.length) return;
      var list = docs();
      for (var i = 0; i < fl.length; i++) { var f = fl[i]; list.push({ name: f.name, size: f.size, type: f.type || "", added: new Date().toISOString() }); }
      fileInput.value = ""; updateCount(); renderPop(); notifyHost();
    });

    /* 26AS / AIS statement picker (parse → prefill Taxes paid) */
    stmtInput = document.createElement("input");
    stmtInput.type = "file"; stmtInput.accept = ".txt,.text,.json,.csv,.html,.htm,.pdf";
    stmtInput.style.display = "none";
    document.body.appendChild(stmtInput);
    stmtInput.addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      docs().push({ name: f.name, size: f.size, type: f.type || "", added: new Date().toISOString() });
      updateCount(); notifyHost();
      if (/\.pdf$/i.test(f.name)) { pending = { pdf: true, name: f.name }; renderPop(); stmtInput.value = ""; return; }
      var rd = new FileReader();
      rd.onload = function () { pending = parseStatement(String(rd.result)); renderPop(); };
      rd.onerror = function () { pending = { error: true }; renderPop(); };
      rd.readAsText(f); stmtInput.value = "";
    });

    importBtn.addEventListener("click", function (ev) { ev.preventDefault(); ev.stopPropagation(); togglePop(); });
    updateCount();
  }
  function updateCount() {
    if (!countEl) return;
    var n = docs().length;
    countEl.textContent = n ? String(n) : "";
    countEl.style.display = n ? "inline-flex" : "none";
  }
  function buildPop() {
    pop = document.createElement("div"); pop.className = "doc-pop"; pop.style.display = "none";
    pop.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    document.body.appendChild(pop);
  }

  function previewHtml() {
    if (!pending) return "";
    if (pending.pdf) return '<div class="prev warn">PDF statements can\'t be read automatically here. Download <b>Form 26AS</b> in <b>Text</b> to auto-fill Taxes paid. "<i>' + esc(pending.name) + '</i>" is attached below.</div>';
    if (pending.error) return '<div class="prev warn">That file could not be read.</div>';
    var tot = prefillTotal(pending);
    if (!tot) return '<div class="prev warn">No taxes-paid rows were recognised in this file (' + esc(pending.source) + '). It\'s attached below. Tip: <b>Form 26AS</b> in <b>Text</b> format imports most reliably.</div>';
    if (!canPrefill()) return '<div class="prev warn">Found ' + tot + ' entr' + (tot > 1 ? 'ies' : 'y') + ' in ' + esc(pending.source) + ', but auto-fill into Taxes paid isn\'t available for this form yet. The file is attached below for your record.</div>';
    var h = '<div class="prev ok"><div class="pt">Found in ' + esc(pending.source) + '</div><ul class="pl">';
    if (pending.tds1.length) h += '<li>' + pending.tds1.length + ' · TDS on salary</li>';
    if (pending.tds2.length) h += '<li>' + pending.tds2.length + ' · TDS (other than salary)</li>';
    if (pending.tds3.length) h += '<li>' + pending.tds3.length + ' · TDS u/s 194IA/IB/M</li>';
    if (pending.tcs.length) h += '<li>' + pending.tcs.length + ' · TCS</li>';
    if (pending.it.length) h += '<li>' + pending.it.length + ' · Advance / self-assessment challans</li>';
    h += '</ul><button type="button" class="apply">Add to Taxes paid &amp; continue to e-Filing &rarr;</button><button type="button" class="cancel">Cancel</button></div>';
    return h;
  }

  function renderPop() {
    if (!pop) return;
    var h = '<h4>Prefill Taxes paid — 26AS / AIS</h4>';
    h += '<p class="lead">Download your statement from the Income-Tax portal, then import it to auto-fill <b>Taxes paid</b>. <b>Text</b> format imports most accurately.</p>';
    h += '<div class="prow"><button type="button" class="pbtn" data-portal="ais">AIS / TIS &#8599;</button><button type="button" class="pbtn" data-portal="26as">Form 26AS &#8599;</button></div>';
    h += '<button type="button" class="imp-stmt">Import 26AS / AIS file…</button>';
    h += previewHtml();
    h += '<div class="sep"></div>';
    h += '<h4>Supporting documents</h4>';
    var list = docs();
    if (!list.length) {
      h += '<p class="empty">No documents attached yet. Add Form 16, AIS/26AS, bank statements or any supporting file — they are listed on this return and saved with it.</p>';
    } else {
      h += '<ul class="dl">';
      for (var i = 0; i < list.length; i++) {
        var d = list[i];
        h += '<li><span class="nm" title="' + esc(d.name) + '">' + esc(d.name) + '</span><span class="sz">' + esc(fmtSize(d.size)) + '</span><span class="rm" role="button" aria-label="Remove" data-rm="' + i + '">&times;</span></li>';
      }
      h += '</ul>';
    }
    h += '<button type="button" class="add">+ Add documents</button>';
    h += '<p class="hint">Attached for your record. The e-filing export carries the return only, not the files.</p>';
    pop.innerHTML = h;

    var pbtns = pop.querySelectorAll(".pbtn");
    for (var p = 0; p < pbtns.length; p++) pbtns[p].addEventListener("click", function () { window.open(EFILING_URL, "_blank", "noopener,noreferrer"); });
    pop.querySelector(".imp-stmt").addEventListener("click", function () { stmtInput.click(); });
    var applyBtn = pop.querySelector(".apply");
    if (applyBtn) applyBtn.addEventListener("click", function () {
      var n = applyPrefill(pending); pending = null; updateCount(); notifyHost(); closePop();
      window.open(EFILING_URL, "_blank", "noopener,noreferrer");
      try { alert("Added " + n + " row" + (n === 1 ? "" : "s") + " to Taxes paid. Opening the e-Filing portal — sign in and upload the return you export."); } catch (e) {}
    });
    var cancelBtn = pop.querySelector(".cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", function () { pending = null; renderPop(); });
    pop.querySelector(".add").addEventListener("click", function () { fileInput.click(); });
    var rms = pop.querySelectorAll("[data-rm]");
    for (var j = 0; j < rms.length; j++) rms[j].addEventListener("click", function () { docs().splice(+this.getAttribute("data-rm"), 1); updateCount(); renderPop(); notifyHost(); });
  }
  function openPop() { if (!pop) return; closeDr(); renderPop(); pop.style.display = "block"; positionPop(pop, importBtn); pop.style.left = "auto"; var r = importBtn.getBoundingClientRect(); pop.style.right = Math.max(10, Math.round(window.innerWidth - r.right)) + "px"; }
  function closePop() { pending = null; if (pop) pop.style.display = "none"; }
  function togglePop() { if (pop && pop.style.display === "block") closePop(); else openPop(); }

  /* ------------------------------------------------- global close + resize -- */
  document.addEventListener("mousedown", function (e) {
    if (pop && pop.style.display === "block" && !pop.contains(e.target) && importBtn && !importBtn.contains(e.target)) closePop();
    if (drPop && drPop.style.display === "block" && !drPop.contains(e.target) && window._drTrig && !window._drTrig.contains(e.target)) closeDr();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closePop(); closeDr(); } });
  window.addEventListener("resize", function () {
    if (pop && pop.style.display === "block") { var r = importBtn.getBoundingClientRect(); pop.style.right = Math.max(10, Math.round(window.innerWidth - r.right)) + "px"; pop.style.top = Math.round(r.bottom + 8) + "px"; }
    if (drPop && drPop.style.display === "block") positionPop(drPop, window._drTrig);
  });

  /* ------------------------------------------------- init + state re-sync --- */
  function syncAll() { updateTrigger(); if (drPop && drPop.style.display === "block") renderDr(); updateCount(); if (pop && pop.style.display === "block") renderPop(); }
  function init() {
    injectCss(); buildAy(); buildDrPop(); buildImport(); buildPop(); syncAll();
    var sheet = document.getElementById("sheet");
    if (sheet && window.MutationObserver) {
      var mo = new MutationObserver(function () { clearTimeout(window._aydocsT); window._aydocsT = setTimeout(syncAll, 60); });
      mo.observe(sheet, { childList: true });
    }
    [400, 1200, 2600].forEach(function (t) { setTimeout(syncAll, t); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
