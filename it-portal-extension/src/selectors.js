/* ===========================================================================
   selectors.js — the ONLY file that should need editing when the Income-Tax
   portal changes its HTML. Everything the automation clicks/reads is named here.

   ⚠️ The portal is behind login, so these cannot be verified from outside.
   The values below are best-effort placeholders. Run capture.js on each live
   page (see README) and paste the real selectors in — that's the "tuning" step.
   =========================================================================== */
'use strict';

var YUKTI_SELECTORS = {

  /* ---- e-portal login (eportal.incometax.gov.in SPA) --------------------- */
  login: {
    userIdInput:   'input#loginuserid, input[formcontrolname="userId"], input[placeholder*="User ID" i]',
    userContinue:  'button#loginContinue, button[type="submit"]',
    secureAccyes:  'button#secureAccessOk, button:contains("Continue")',
    passwordInput: 'input[type="password"], input[formcontrolname="password"]',
    loginBtn:      'button#loginButton, button:contains("Continue")',
    loggedInMark:  'a[href*="dashboard" i], .dashboard, #dashboard'
  },

  /* ---- AIS (Annual Information Statement) -------------------------------- */
  ais: {
    /* AIS opens from the top nav "AIS" then "Proceed"; the AIS home lists FY
       tiles. Download → "AIS" → format JSON. TUNE THESE: */
    navAis:        'a[href*="ais" i], [aria-label*="AIS" i]',
    proceedBtn:    'button:contains("Proceed")',
    yearTile:      '[data-fy], .fy-tile',        // choose by FY text
    downloadBtn:   'button:contains("Download")',
    formatJson:    'input[type="radio"][value="json" i], label:contains("JSON")',
    confirmDl:     'button:contains("Download")'
  },

  /* ---- Form 26AS (redirects to TRACES / tdscpc.gov.in) ------------------- */
  form26as: {
    navVia26as:    'a:contains("View Form 26AS"), [href*="26AS" i]',
    disclaimerBox: 'input#chkbox, input[type="checkbox"]',     // the 1 tick box
    confirmProceed:'input#proceed, button:contains("Proceed")',
    viewTaxCredit: 'a:contains("View Tax Credit"), #viewtaxcredit',
    ayDropdown:    'select#assessmentYear, select[name*="assessment" i]',
    viewAsDropdown:'select#frmView, select[name*="view" i]',   // choose "Text"
    viewAsText:    'Text',                                     // option label
    exportBtn:     'input#exportText, button:contains("Export as Text")'
  },

  /* ---- File-ITR AY page (the screenshot you sent) ----------------------- */
  fileItr: {
    ayDropdown:    'select, [role="combobox"]',                // "Select Assessment year"
    modeOnline:    'input[type="radio"][value="online" i]',
    modeOffline:   'input[type="radio"][value="offline" i]',
    continueBtn:   'button:contains("Continue")'
  }
};

/* ---- Assessment-Year logic ----------------------------------------------
   Yukti stores S.aySel like "2026-27". Map it to the portal's option text and
   to any year-specific branch (e.g. your "Act 168" rule — pending your note).
   ------------------------------------------------------------------------- */
var YUKTI_AY = {
  /** "2026-27" -> portal dropdown label. Portal usually shows "2026-27". */
  toPortalLabel: function (aySel) { return String(aySel || '').trim(); },

  /** Which statement path applies for this AY.
      TODO(user): confirm the "if 2027-28 → Act 168, else → 26AS" rule wording. */
  pathFor: function (aySel) {
    // Placeholder until you clarify "Act 168":
    // return aySel === '2027-28' ? 'act168' : '26as';
    return '26as';
  }
};
