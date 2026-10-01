/* ITR-4 · AY 2026-27 — validation-rule FIX batch 07 (enforcement gaps/weak fixes).
   Registered via ruleset(); A(n,cond,msg) fires when cond is FALSE. Reads guarded; nothing throws.
   Serials 8 and 9 (Category B, GAP): TDS section codes that belong to non-residents / FIIs /
   business-trust-NR payees (194E, 194LB, 194LC, 194LBA(a)/(b)/(c), 195, 196A, 196B, 196C, 196D,
   196D(1A)) make the assessee ineligible for ITR-4 when selected at col 2a of TDS2(i) or TDS2(ii).
   Short codes are the TDSSection enum written by 70_sec_paidbank.js (TDSSEC_P4). */
ruleset(function(I,S_,A,Dd){
  I=I||{};
  /* TDSSection short codes (70_sec_paidbank.js) for the sections the rule names */
  var NR_CODES={
    "94E":1,                                   /* 194E   */
    "4LB":1,                                   /* 194LB  */
    "4LC1":1,"4LC2":1,"4LC3":1,                /* 194LC (2)(i)/(ia), (ib), (ic) */
    "4BA1":1,"4BA2":1,                         /* 194LBA(a), 194LBA(b) — resident labels */
    "LBA1":1,"LBA2":1,"LBA3":1,                /* 194LBA(a), 194LBA(b), 194LBA(c) — NR labels */
    "195":1,                                   /* 195    */
    "96A":1,"96B":1,"96C":1,"96D":1,"96DA":1   /* 196A, 196B, 196C, 196D, 196D(1A) */
  };
  var secOf=function(r){ return String(((r||{}).TDSSection)==null?"":(r||{}).TDSSection).trim(); };
  var badRow=function(rows){
    rows=rows||[]; var hit=-1;
    for(var i=0;i<rows.length;i++){ if(rows[i]&&NR_CODES[secOf(rows[i])]){ hit=i; break; } }
    return hit;
  };

  /* 8: TDS2(i) — TDSonOthThanSals.TDSonOthThanSalDtls[].TDSSection */
  var t2=RG(I,"TDSonOthThanSals.TDSonOthThanSalDtls",[])||[];
  var b2=badRow(t2);
  A(8, !I.TDSonOthThanSals || b2<0,
    "Schedule TDS2(i) row "+(b2+1)+": section "+(b2<0?"":secOf(t2[b2]))+" (194E/194LB/194LC/194LBA/195/196A-196D/196D(1A)) at col 2a is a non-resident TDS section; the assessee is not eligible to file ITR-4.");

  /* 9: TDS2(ii) — ScheduleTDS3Dtls.TDS3Details[].TDSSection */
  var t3=RG(I,"ScheduleTDS3Dtls.TDS3Details",[])||[];
  var b3=badRow(t3);
  A(9, !I.ScheduleTDS3Dtls || b3<0,
    "Schedule TDS2(ii) row "+(b3+1)+": section "+(b3<0?"":secOf(t3[b3]))+" (194E/194LB/194LC/194LBA/195/196A-196D/196D(1A)) at col 2a is a non-resident TDS section; the assessee is not eligible to file ITR-4.");
});
