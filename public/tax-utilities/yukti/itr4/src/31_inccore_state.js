/* =====================================================================
   ITR-4 (SUGAM) · builder "inccore" — the core Income Details flow.
   Screen sections rendered: who · ret · inc · hp · tax.
   Schema blocks OWNED (export + import):
     PersonalInfo, FilingStatus, IncomeDeductions (all of it — salary,
     PropertyDetails/HP, IncomeFromBusinessProf, OthersInc, Chapter VI-A
     totals, GrossTotIncome, TotalIncome), TaxComputation, ScheduleBP
     (presumptive 44AD/44ADA/44AE), LTCG112A, TaxExmpIntIncDtls.
   Compute: engInc at order 20 (all income heads), engTax at order 80
     (Part D roll-up → footer contract). Reads (S.C.ded||{}).total (Chapter
     VI-A, regime-gated by the `ded` builder) and (S.C.paid||{}).total
     (taxes paid, by `paidbank`), both guarded.

   Built ONLY from ITR-4 books: Income_Details.md, HP.md, BP.md,
   Taxes_Paid_and_Verification.md (rule 2 — no engine ported from another
   form). Every formula carries its sheet cell ref in a comment.

   REGIME (task "## Regime (ITR-4)" note; there is no books/ITR-4/REGIME.md):
   New regime u/s 115BAC(1A) is the default; opting out (old) is via Form
   10-IEA (FilingStatus). isNew() = S.fs.optout!=="Yes". In the NEW regime:
     · exempt allowances 10(5)/10(13A)/10(14)(i)/10(14)(ii) close (rules #920/#990/#1000);
     · s.16(ii) entertainment allowance and s.16(iii) professional tax close;
     · s.24(b) interest on a self-occupied house closes;
     · s.57(iia) family-pension deduction is old-regime only;
     · a house-property loss cannot be set off (head floored at 0);
     · 87A rebate is up to Rs.60,000 for total income (excl. LTCG) up to Rs.12L (rule #1135),
       vs Rs.12,500 up to Rs.5L in the old regime (rule #1145).
   The Rs.75,000 standard deduction u/s 16(ia) and the family-pension part of
   s.57 stay in both. Chapter VI-A gating is the `ded` builder's job; inccore
   only reads its regime-gated total.

   NOTE on the tax method: ITR-4's Income_Details.md marks Part D lines
   D8–D11a (interest u/s 234A/234B/234C, fee 234F/234-I) as INPUTS, not
   computed ("only D6 relief, D8–D11a interest/fee are inputs"); only the
   slab tax (D1), 87A rebate (D2), tax after rebate (D3), cess (D4), total
   tax & cess (D5) and D7/D12 sums are computed. The AY 2026-27 slab rates
   themselves are not in ITR-4's books (no TaxCalc book / empty REGIME.md);
   they are the Finance Act 2025 statutory slabs, encoded below with the
   rebate caps confirmed by rules.json #1135/#1145 and the schema
   Rebate87A max 60000 (rule 17: source gap noted in the build report).
   ===================================================================== */

/* ---------------------------------------------------------------------
   STATE
   ------------------------------------------------------------------- */
S.pi = S.pi || {};
if(S.pi.status===undefined) S.pi.status="I";      /* PersonalInfo.Status  I/H/F */
if(S.pi.res===undefined)    S.pi.res="RES";       /* residential status (drives 87A) */
if(S.pi.country===undefined)S.pi.country="91";     /* Address.CountryCode 91-INDIA */
if(S.pi.empcat===undefined) S.pi.empcat="OTH";     /* EmployerCategory */
if(S.pi.secAdd===undefined) S.pi.secAdd="Y";       /* SecondaryAdd Y/N */

S.fs = S.fs || {};
if(S.fs.optout===undefined) S.fs.optout="No";      /* master regime switch → isNew() */
if(S.fs.sec===undefined)    S.fs.sec=11;           /* FilingStatus.ReturnFileSec (11=139(1)) */
if(S.fs.f10ieaEarlier===undefined) S.fs.f10ieaEarlier="NA"; /* Form10IEAEarlierAYOldRegime (mandatory) */
if(S.fs.duedate===undefined)S.fs.duedate="2026-08-31";      /* ItrFilingDueDate — non-audit (finalDuedate) */
if(S.fs.seventh===undefined)S.fs.seventh="N";      /* SeventhProvisio139 */
if(S.fs.rep===undefined)    S.fs.rep="N";          /* AsseseeRepFlg */
S.fs.clause7 = S.fs.clause7 || [];                 /* clauseiv7provisio139iDtls[] */

/* ic — this builder's own working namespace (arrays seeded [], cards off).
   IC is captured once and every engine below closes over it, so it must
   ALWAYS equal S.ic. seedIC() fills missing keys; afterOpen() re-points IC
   to a freshly-loaded S.ic (importFile replaces the object) then re-seeds,
   so opening a saved working file never leaves the engines on a stale ic. */
S.ic = S.ic || {};
const IC=S.ic;
function seedIC(){
  IC.sal = IC.sal || {};                           /* salary breakup */
  IC.sal.alw = IC.sal.alw || [];                   /* AllwncExemptUs10Dtls[] */
  IC.hp  = IC.hp  || [];                            /* PropertyDetails[] (max 2) */
  IC.os  = IC.os  || {};                            /* other sources */
  IC.os.rows = IC.os.rows || [];                    /* OthersIncDtlsOthSrc[] */
  IC.bp  = IC.bp  || {};                            /* ScheduleBP */
  IC.bp.nad  = IC.bp.nad  || [];                    /* NatOfBus44AD[] */
  IC.bp.ad   = IC.bp.ad   || {};                    /* PersumptiveInc44AD */
  IC.bp.nada = IC.bp.nada || [];                    /* NatOfBus44ADA[] */
  IC.bp.ada  = IC.bp.ada  || {};                    /* PersumptiveInc44ADA */
  IC.bp.nae  = IC.bp.nae  || [];                    /* NatOfBus44AE[] */
  IC.bp.gcv  = IC.bp.gcv  || [];                    /* GoodsDtlsUs44AE[] (max 10) */
  IC.bp.ae   = IC.bp.ae   || {};                    /* PersumptiveInc44AE (E6 SalInterestByFirm) */
  IC.bp.gstn = IC.bp.gstn || [];                    /* TurnoverGrsRcptForGSTIN[] */
  IC.bp.fin  = IC.bp.fin  || {};                    /* FinanclPartclrOfBusiness */
  IC.ltcg = IC.ltcg || {};                          /* LTCG112A (D20a) */
  IC.exmp = IC.exmp || [];                          /* TaxExmpIntIncDtls OthersIncDtls[] (D20) */
  IC.d   = IC.d   || {};                            /* Part D inputs (relief 89, interest, fees) */
}
seedIC();
function afterOpen(){
  if(S.ic&&S.ic!==IC){for(const k in IC)delete IC[k];Object.assign(IC,S.ic);}
  S.ic=IC;seedIC();
}

/* SEED — the shell's add-row handler carries its own literal seed table and
   shadows this global SEED; these are documented defaults (rows added blank). */
SEED["ic.hp"]=SEED["ic.hp"]||{};
SEED["ic.sal.alw"]=SEED["ic.sal.alw"]||{};

/* ---------------------------------------------------------------------
   CODE TABLES (clean labels from the books; codes verbatim from enums.json)
   ------------------------------------------------------------------- */
const STATUS=[["I","Individual"],["H","HUF"],["F","Firm (other than LLP)"]];
const EMPCAT=[["CGOV","Central Government"],["SGOV","State Government"],
  ["PSU","Public Sector Undertaking"],["PE","Pensioners - CG"],["PESG","Pensioners - SG"],
  ["PEPS","Pensioners - PSU"],["PEO","Pensioners - Others"],["OTH","Others"],
  ["NA","Not Applicable (eg. Family pension etc)"]];
const RES_STAT=[["RES","Resident"],["NRI","Non-Resident"],["NOR","Resident but not Ordinarily Resident"]];
const RET_SEC=[["11","139(1)-On or before due date"],["12","139(4)-After due date"],
  ["13","142(1)"],["14","148"],["16","153C"],["17","139(5)-Revised Return"],
  ["18","139(9)"],["20","119(2)(b)-After condonation of delay"]];
const DUE_DATES=[["2026-08-31","31/08/2026"],["2026-10-31","31/10/2026"],["2026-11-30","30/11/2026"]];
const YN=[["Y","Yes"],["N","No"]];
const YNNA=[["Y","Yes"],["N","No"],["NA","Not applicable"]];
const AY10IEA=[["2024-25","2024-25"],["2025-26","2025-26"]];
const CLAUSE7=[["1","Sales/turnover/gross receipts of business exceeds sixty lakh rupees"],
  ["2","Gross receipts in profession exceeds ten lakh rupees"],
  ["3","Aggregate of TDS and TCS is twenty-five thousand rupees or more"],
  ["4","Deposit in one or more savings bank account is fifty lakh rupees or more"]];
/* exempt allowances u/s 10 (I122); regime-closed set flagged below */
const ALW_NAT=[["10(5)","Sec 10(5)-Leave Travel concession/assistance"],
  ["10(6)","Sec 10(6)-Remuneration of an official of an embassy etc."],
  ["10(7)","Sec 10(7)-Allowances/perquisites outside India by Govt to a citizen"],
  ["10(10)","Sec 10(10)-Death-cum-retirement gratuity received"],
  ["10(10A)","Sec 10(10A)-Commuted value of pension received"],
  ["10(10AA)","Sec 10(10AA)-Earned leave encashment on retirement"],
  ["10(10C)","Sec 10(10C)-VRS / termination compensation"],
  ["10(10CC)","Sec 10(10CC)-Tax paid by employer on non-monetary perquisite"],
  ["10(13A)","Sec 10(13A)-House rent allowance"],
  ["10(14)(i)","Sec 10(14)(i)-Prescribed allowances to meet duties of office"],
  ["10(14)(ii)","Sec 10(14)(ii)-Prescribed allowances to meet personal expenses"],
  ["10(17)","Sec 10(17)-Allowance MP/MLA/MLC"]];
const ALW_CLOSED_NEW={"10(5)":1,"10(13A)":1,"10(14)(i)":1,"10(14)(ii)":1};   /* rules #920/#990/#1000 */
/* other-sources nature (I147); FAP (family pension) not for HUF/Firm (others1) */
const OS_NAT=[["SAV","Interest from Saving Bank Account"],
  ["IFD","Interest from Deposit (Bank/Post Office/Cooperative Society)"],
  ["TAX","Interest from Income Tax Refund"],["FAP","Family pension"],["DIV","Dividend"],
  ["OTH","Any Other"]];
const PROP_OWNER=[["SE","Self"],["MI","Minor"],["SP","Spouse"],["OT","Others"]];
const IF_LETOUT=[["L","Let Out"],["D","Deemed let out"],["S","Self Occupied"]];
const COOWN=[["YES","Yes"],["NO","No"]];
const LOAN_FROM=[["B","Bank"],["I","Other than Bank"]];
const OWN_LEASE=[["OWN","Owned"],["LEASE","Leased"],["HIRED","Hired"]];
const NOB44AE=[["08001","08001-Renting of land transport equipment"],
  ["11002","11002-Packers and movers"],["11008","11008-Freight transport by road"],
  ["11010","11010-Forwarding of freight"],["11011","11011-Receiving and acceptance of freight"],
  ["11012","11012-Cargo handling"],["11015","11015-Other Transport & Logistics services n.e.c"]];
const EXMP_CAT=[["AGRI","Agricultural & related incomes"],
  ["GOVC","Compensation/other sums from government/approved entities"],
  ["ISI","Income from specified Investments"],
  ["SSRA","Specified sums received by armed forces personnel"],
  ["SRSC","Sums received by Senior Citizens/Minors"],
  ["SRST","Sums received by specified Category of Taxpayers"],
  ["SRPC","Sums from policies/contributions (LIC/NPS/PF/SSY)"],["OTH","Other Incomes"]];
const STATE_CODES=[["01","01-Andaman and Nicobar islands"],["02","02-Andhra Pradesh"],
  ["03","03-Arunachal Pradesh"],["04","04-Assam"],["05","05-Bihar"],["06","06-Chandigarh"],
  ["07","07-Dadra & Nagar Haveli and Daman & Diu"],["09","09-Delhi"],["10","10-Goa"],
  ["11","11-Gujarat"],["12","12-Haryana"],["13","13-Himachal Pradesh"],["14","14-Jammu and Kashmir"],
  ["15","15-Karnataka"],["16","16-Kerala"],["17","17-Lakshadweep"],["18","18-Madhya Pradesh"],
  ["19","19-Maharashtra"],["20","20-Manipur"],["21","21-Meghalaya"],["22","22-Mizoram"],
  ["23","23-Nagaland"],["24","24-Odisha"],["25","25-Puducherry"],["26","26-Punjab"],
  ["27","27-Rajasthan"],["28","28-Sikkim"],["29","29-Tamil Nadu"],["30","30-Tripura"],
  ["31","31-Uttar Pradesh"],["32","32-West Bengal"],["33","33-Chattisgarh"],["34","34-Uttarakhand"],
  ["35","35-Jharkhand"],["36","36-Telangana"],["37","37-Ladakh"],["99","99-Foreign"]];
