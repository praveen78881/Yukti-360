/* =====================================================================
   ITR-1 (SAHAJ) · A.Y. 2026-27 — base scaffold (STUB).
   ITR-1 is the return for a RESIDENT INDIVIDUAL (ordinarily resident,
   not a director, no unlisted equity, income up to Rs.50 lakh) with
   income from salary/pension, one house property, other sources
   (interest, dividend, family pension) and long-term capital gains u/s
   112A up to Rs.1.25 lakh. Every on-screen section is present with its
   title and a "being built" placeholder body; the real fields, engines,
   exports, imports and rule bodies arrive in the section-builder phase.
   Modelled on forms/ITR-7/src/00_form.js (the shell reg() contract) with
   the ITR-1 tax ladder from forms/ITR-1/Yukti_ITR1_prev.html.
   ===================================================================== */
/* FORM.due = 2026-07-31 is the ITR-1 filer's ordinary 139(1) due date:
   a resident individual filing ITR-1 has no accounts to audit and no 92E
   report, so the utility's finalDuedate carries the 31/07/2026 literal.
   (The audit / 92E branches of finalDuedate never apply to an ITR-1
   filer — those cases fall out of ITR-1 eligibility entirely.)
   FORM.sw is the CBDT software-vendor id emitted into CreationInfo; it
   matches the schema pattern [S][W][0-9]{8} and equals the SKEL default. */
window.FORM={id:"ITR-1",name:"ITR-1",ay:"2026-27",sw:"SW10000000",due:"2026-07-31"};

/* ---- code tables the shell's commit() reads (00_form.js contract) ----
   When the filer edits pi.pin the shell resolves the PIN's first two
   digits to a state code (PIN2ST); when the filer edits a bank row's IFSC
   the shell resolves the first four characters to a bank name (BANK).
   Both are lifted verbatim from the prior functional builder. */
const PIN2ST={"11":"09","12":"12","13":"12","14":"26","15":"26","16":"06","17":"13","18":"14",
"19":"14","20":"31","21":"31","22":"31","23":"31","24":"31","25":"34","26":"34","27":"31",
"28":"31","30":"27","31":"27","32":"27","33":"27","34":"27","36":"11","37":"11","38":"11",
"39":"11","40":"19","41":"19","42":"19","43":"19","44":"19","45":"18","46":"18","47":"18",
"48":"18","49":"33","50":"36","51":"02","52":"02","53":"02","56":"15","57":"15","58":"15",
"59":"15","60":"29","61":"29","62":"29","63":"29","64":"29","67":"16","68":"16","69":"16",
"70":"32","71":"32","72":"32","73":"32","74":"32","75":"24","76":"24","77":"24","78":"04",
"79":"03","80":"05","81":"05","82":"05","83":"35","84":"05","85":"05"};   /* PIN first-two-digits -> state code */
const BANK={ABHY:"Abhyudaya Co-op Bank",AUBL:"AU Small Finance Bank",BARB:"Bank of Baroda",
BDBL:"Bandhan Bank",BKID:"Bank of India",CBIN:"Central Bank of India",CIUB:"City Union Bank",
CNRB:"Canara Bank",CSBK:"CSB Bank",DBSS:"DBS Bank India",DCBL:"DCB Bank",
ESFB:"Equitas Small Finance Bank",FDRL:"Federal Bank",HDFC:"HDFC Bank",HSBC:"HSBC India",
IBKL:"IDBI Bank",ICIC:"ICICI Bank",IDFB:"IDFC FIRST Bank",INDB:"IndusInd Bank",
IOBA:"Indian Overseas Bank",IDIB:"Indian Bank",JAKA:"Jammu & Kashmir Bank",KARB:"Karnataka Bank",
KKBK:"Kotak Mahindra Bank",KVBL:"Karur Vysya Bank",MAHB:"Bank of Maharashtra",
PSIB:"Punjab & Sind Bank",PUNB:"Punjab National Bank",RATN:"RBL Bank",SBIN:"State Bank of India",
SIBL:"South Indian Bank",SRCB:"Saraswat Co-op Bank",TMBL:"Tamilnad Mercantile Bank",
UBIN:"Union Bank of India",UCBA:"UCO Bank",UTIB:"Axis Bank",
UTKS:"Utkarsh Small Finance Bank",YESB:"YES Bank"};   /* IFSC first-four-chars -> bank name */
