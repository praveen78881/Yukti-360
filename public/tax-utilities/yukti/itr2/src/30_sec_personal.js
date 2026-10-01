
/* ---------------- 1 · Who is filing — Part A General, from the book -- */
function secWho(){
  const ind=S.pi.status!=="H";let h="";
  /* ---- Block 1 · personal information ---- */
  h+=sub("Personal information");
  h+=row("Status",sel("pi.status",STATUS,{blank:false}),{req:1,hint:"I — individual, H — Hindu undivided family"});
  if(ind){
    h+=row("First name",inp("pi.first"),{req:1});
    h+=row("Middle name",inp("pi.mid"));
    h+=row("Last name",inp("pi.last"),{req:1});
  } else h+=row("Name of the Hindu undivided family",inp("pi.last"),{req:1});
  h+=row("PAN",inp("pi.pan",{max:10}),{req:1,hint:ind?"the fourth letter must be P":"the fourth letter must be H"});
  h+=row(ind?"Date of birth":"Date of formation",dte("pi.dob"),{req:1,hint:"on or before 31 March 2026"});
  if(ind){
    h+=row("Aadhaar number",inp("pi.aadhaar",{max:12}),{req:1,hint:"twelve digits"});
    h+=row("Aadhaar enrolment id",inp("pi.aadhenrol",{max:28}),{hint:"only where the number is not yet allotted — all 28 digits including the date and time"});
    h+=row("Passport number",inp("pi.passport"),{hint:"if available"});
  }
  /* ---- Block 2 · addresses ---- */
  h+=sub("Primary address — for communication");
  h+=row("Flat, door or block number",inp("pi.addr1"),{req:1});
  h+=row("Name of premises, building or village",inp("pi.premises"));
  h+=row("Road, street or post office",inp("pi.road"));
  h+=row("Area or locality",inp("pi.locality"),{req:1});
  h+=row("Town, city or district",inp("pi.city"),{req:1});
  h+=row("Country or region",sel("pi.country",COUNTRIES,{blank:false}),{req:1});
  if((S.pi.country||"91")==="91"){
    h+=row("State",sel("pi.state",Object.keys(STATE).map(k=>[k,STATE[k]])),{req:1});
    h+=row("PIN code",inp("pi.pin",{max:6}),{req:1,hint:"six digits"});
  } else {
    h+=row("State",sel("pi.state",[["99","Outside India"]],{blank:false}),{req:1});
    h+=row("Zip code",inp("pi.zip",{max:10}),{req:1});
  }
  h+=row("Is the secondary address the same as the primary?",sel("pi.addr2same",["Yes","No"],{blank:false}),{req:1});
  if(S.pi.addr2same==="No"){
    h+=sub("Secondary address");
    h+=row("Flat, door or block number",inp("pi.addr1b"),{req:1});
    h+=row("Name of premises, building or village",inp("pi.premisesb"));
    h+=row("Road, street or post office",inp("pi.roadb"));
    h+=row("Area or locality",inp("pi.localityb"),{req:1});
    h+=row("Town, city or district",inp("pi.cityb"),{req:1});
    h+=row("State",sel("pi.stateb",Object.keys(STATE).map(k=>[k,STATE[k]])),{req:1});
    h+=row("PIN code",inp("pi.pinb",{max:6}),{req:1});
  }
  /* ---- Block 3 · communication ---- */
  h+=sub("Details for communication");
  h+=row("Primary email of the taxpayer",inp("pi.email",{ph:"name@example.in"}),{req:1});
  h+=row("Secondary email",inp("pi.email2"));
  h+=row("Primary mobile of the taxpayer",inp("pi.mobile",{max:10}),{req:1,hint:"ten digits, country code 91"});
  h+=row("Secondary mobile",inp("pi.mobile2",{max:10}));
  h+=row("STD or ISD code",inp("pi.std",{max:5}));
  h+=row("Residential or office phone",inp("pi.phone",{max:12}));
  /* ---- Block 5 · residential status ---- */
  h+=sub("Residential status");
  h+=row("Residential status in India",sel("pi.res",RESIDENTIAL,{blank:false}),{req:1});
  if(ind){
    h+=row("Condition for the residential status",sel("pi.rescond",RESCOND.map(c=>[c[0],c[0]+" — "+c[1]])),
      {req:1,hint:"pick the one that applies; it has to agree with the status above"});
    const rc=RESCOND.find(c=>c[0]===S.pi.rescond);
    if(rc&&rc[2]!==S.pi.res)
      h+=note("Condition "+rc[0]+" makes the person <b>"+(RESIDENTIAL.find(r=>r[0]===rc[2])||["",""])[1]+
        "</b>, but the status above says otherwise. One of the two is wrong.","stop");
  }
  if(S.pi.res!=="RES"){
    h+=sub("(i) Jurisdictions of residence during the year");
    h+=grid("pi.juris",[{k:"country",h:"Jurisdiction of residence",t:"sel",w:"260px",req:1,opts:COUNTRIES},
      {k:"tin",h:"Taxpayer identification number",t:"txt",w:"auto",req:1}],
      S.pi.juris||[],{min:"640px",empty:"No jurisdiction listed.",add:"Add a jurisdiction"});
    if(ind){
      h+=sub("(ii) For a citizen of India or a person of Indian origin");
      h+=row("Total period of stay in India during the year, in days",inp("pi.days1",{n:1}),{req:1});
      h+=row("Total period of stay in India during the 4 preceding years, in days",inp("pi.days4",{n:1}),{req:1});
    }
    h+=row("Is there a permanent establishment in India?",sel("pi.pe",["No","Yes"],{blank:false}),{req:1});
  }
  /* ---- Block 8 · other particulars ---- */
  h+=sub("Other particulars");
  if(S.pi.res==="RES")h+=row("Do you want to claim the benefit under section 115H?",sel("pi.s115h",["No","Yes"],{blank:false}),
    {hint:"a resident who was a non-resident Indian earlier, on foreign-exchange assets"});
  h+=row("Are you governed by the Portuguese Civil Code under section 5A?",sel("pi.s5a",["No","Yes"],{blank:false}),
    {hint:"Goa, Dadra & Nagar Haveli, Daman & Diu — on Yes, fill Schedule 5A"});
  h+=row("Are you a foreign portfolio investor?",sel("pi.fpi",["No","Yes"],{blank:false}),{req:1});
  if(S.pi.fpi==="Yes")h+=row("SEBI registration number",inp("pi.sebi"),{req:1,ind:1});
  h+=card("rep","Return filed by a representative assessee",(S.pi.rep==="Yes"?st0(S.pi.rep_name)||"Yes":""),
    row("Is this return being filed by a representative assessee?",sel("pi.rep",["No","Yes"],{blank:false}))+
    (S.pi.rep==="Yes"?(
      row("a · Name of the representative",inp("pi.rep_name"),{req:1})+
      row("b · Email of the representative",inp("pi.rep_email"),{req:1})+
      row("c · Contact number",inp("pi.rep_mobile",{max:10}),{req:1})+
      row("d · Capacity",sel("pi.rep_cap",REPCAP.slice(1)),{req:1})+
      row("e · Address of the representative",inp("pi.rep_addr"),{req:1})+
      row("f · PAN of the representative",inp("pi.rep_pan",{max:10}),{req:1})+
      row("g · Aadhaar of the representative",inp("pi.rep_aadhaar",{max:12}))):""));
  h+=card("lei","Legal Entity Identifier",(st0(S.pi.lei)?st0(S.pi.lei):""),
    note("Mandatory only where the refund is ₹50 crore or more.")+
    row("LEI number",inp("pi.lei",{max:20}))+
    row("Valid up to",dte("pi.lei_dt")));
  /* ---- Block 9 · directorships, partnerships, unlisted shares ---- */
  h+=sub("Directorships, partnerships and unlisted shares");
  h+=card("director","Director in a company at any time during the year",
    (S.pi.dir==="Yes"?((S.pi.dirco||[]).length+" compan"+((S.pi.dirco||[]).length===1?"y":"ies")):""),
    row("Were you a director in any company during the year?",sel("pi.dir",["No","Yes"],{blank:false}))+
    (S.pi.dir==="Yes"?grid("pi.dirco",[{k:"name",h:"Name of company",t:"txt",w:"auto",req:1},
      {k:"type",h:"Type of company",t:"sel",w:"130px",req:1,opts:COTYPE},
      {k:"pan",h:"PAN",t:"txt",w:"130px",max:10},
      {k:"listed",h:"Shares listed or unlisted",t:"sel",w:"150px",req:1,opts:[["L","Listed"],["U","Unlisted"]]},
      {k:"din",h:"Director identification number",t:"txt",w:"180px"}],
      S.pi.dirco||[],{min:"900px",empty:"No directorship.",add:"Add a company"}):""));
  h+=card("partner","Partner in a firm",(S.pi.partner==="Yes"?((S.pi.firms||[]).length+" firm"+((S.pi.firms||[]).length===1?"":"s")):""),
    row("Are you a partner in a firm?",sel("pi.partner",["No","Yes"],{blank:false}))+
    (S.pi.partner==="Yes"?grid("pi.firms",[{k:"name",h:"Name of firm",t:"txt",w:"auto",req:1},
      {k:"pan",h:"PAN",t:"txt",w:"140px",max:10,req:1}],
      S.pi.firms||[],{min:"520px",empty:"No firm.",add:"Add a firm"}):""));
  h+=card("unlisted","Unlisted equity shares held at any time during the year",
    (S.pi.unl==="Yes"?((S.pi.unlco||[]).length+" compan"+((S.pi.unlco||[]).length===1?"y":"ies")):""),
    row("Did you hold any unlisted equity shares at any time during the year?",sel("pi.unl",["No","Yes"],{blank:false}))+
    (S.pi.unl==="Yes"?(note("One row per company. Opening and closing balances are compulsory on every row; "+
        "the acquisition and transfer columns only where something happened. The department "+
        "cross-checks these against the company's own filings.")+
      grid("pi.unlco",[{k:"name",h:"Name of company",t:"txt",w:"auto",req:1},
      {k:"type",h:"Type",t:"sel",w:"110px",req:1,opts:COTYPE},
      {k:"pan",h:"PAN",t:"txt",w:"120px",max:10},
      {k:"open",h:"Opening — shares",t:"num",w:"110px",req:1},
      {k:"opencost",h:"Opening — cost",t:"num",w:"120px",req:1},
      {k:"acq",h:"Acquired — shares",t:"num",w:"110px"},
      {k:"acqdt",h:"Date of subscription or purchase",t:"date",w:"130px"},
      {k:"fv",h:"Face value per share",t:"num",w:"110px"},
      {k:"ip",h:"Issue price per share",t:"num",w:"110px"},
      {k:"pp",h:"Purchase price per share",t:"num",w:"120px"},
      {k:"sold",h:"Transferred — shares",t:"num",w:"120px"},
      {k:"soldcons",h:"Transferred — consideration",t:"num",w:"140px"},
      {k:"close",h:"Closing — shares",t:"num",w:"110px",req:1},
      {k:"closecost",h:"Closing — cost",t:"num",w:"120px",req:1}],
      S.pi.unlco||[],{min:"1900px",empty:"No unlisted shares.",add:"Add a company"})):""));
  return h;
}