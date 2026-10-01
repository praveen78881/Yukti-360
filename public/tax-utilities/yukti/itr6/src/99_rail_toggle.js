/* =====================================================================
   YUKTI ADDON — collapsible SECTIONS rail.   Shared by every ITR form.

   Purely additive: this file injects its own <style> and its own button
   at runtime, so it never modifies a single line of the split modules or
   the generated index.html / styles.css. Nothing to lose, nothing to
   re-verify — drop the file and the forms are exactly as they were.

   It works because every form's layout hangs off ONE custom property:
     .rail { width: var(--rail) }   .wrap { left: var(--rail) }
   so setting --rail to 0 collapses the rail and reflows the sheet in one
   step, with no knowledge of the form's contents.

   The choice is remembered per form (FORM.id) in localStorage.
   Toggle: the ☰ button in the header, or Ctrl/Cmd + B.
   ===================================================================== */
(function () {
  "use strict";

  var KEY = (function () {
    try { return "yukti_rail_" + ((window.FORM && window.FORM.id) || "x"); }
    catch (e) { return "yukti_rail_x"; }
  })();

  /* ---- 1. styles ---- */
  var css = document.createElement("style");
  css.id = "yukti-rail-toggle-css";
  css.textContent = [
    /* collapsed state: the rail folds away and the sheet takes the space */
    ":root.rail-off{--rail:0px}",
    ":root.rail-off .rail{width:0;overflow:hidden;border-right:0}",
    /* both sides animate together so the sheet never jumps */
    ".rail{transition:width .18s ease}",
    ".wrap{transition:left .18s ease}",
    /* the toggle itself, sitting at the head of the top bar */
    ".railbtn{appearance:none;background:transparent;border:1px solid rgba(255,255,255,.28);",
    "  color:#fff;width:30px;height:26px;border-radius:5px;cursor:pointer;line-height:1;",
    "  font-size:13px;display:inline-flex;align-items:center;justify-content:center;",
    "  padding:0;flex:0 0 auto;transition:background .15s ease,border-color .15s ease}",
    ".railbtn:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.5)}",
    ".railbtn:active{background:rgba(255,255,255,.22)}",
    ".railbtn:focus-visible{outline:2px solid #fff;outline-offset:1px}",
    /* the top bar's flex gap is generous; tighten just after the button */
    ".top .railbtn + .b{margin-left:-14px}",
    "@media print{.railbtn{display:none}}"
  ].join("\n");
  document.head.appendChild(css);

  /* ---- 2. state ---- */
  function collapsed() { return document.documentElement.classList.contains("rail-off"); }

  function apply(off, remember) {
    document.documentElement.classList.toggle("rail-off", !!off);
    var b = document.getElementById("b_rail");
    if (b) {
      b.setAttribute("aria-expanded", off ? "false" : "true");
      b.title = (off ? "Show" : "Hide") + " sections  (Ctrl+B)";
    }
    if (remember) { try { localStorage.setItem(KEY, off ? "1" : "0"); } catch (e) {} }
    /* let the form re-measure anything that keys off the sheet width */
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  }

  /* ---- 3. button + shortcut ---- */
  function mount() {
    var top = document.querySelector("header.top");
    if (!top || document.getElementById("b_rail")) return;

    var btn = document.createElement("button");
    btn.id = "b_rail";
    btn.className = "railbtn";
    btn.type = "button";
    btn.setAttribute("aria-controls", "nav");
    btn.innerHTML = "&#9776;";                 /* ☰ */
    btn.addEventListener("click", function () { apply(!collapsed(), true); });
    top.insertBefore(btn, top.firstChild);

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved === "1", false);
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
        (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      apply(!collapsed(), true);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
