> Source: CBDT__e-Filing_ITR 2_Validation Rules_AY 2025-26_V1.0.pdf · 49 pages · transcribed verbatim

# Central Board of Direct Taxes, e-Filing Project

## ITR 2 – Validation Rules for AY 2025-26
### Version 1.0

10th July 2025

Directorate of Income Tax (Systems)
E-2, A.R.A. Centre, Ground Floor
Jhandewalan Extension
New Delhi – 110055

---

## Document Revision List

**Document Name:** ITR 2 – Validation Rules for AY 2025-26

**Version Number:** 1.0

### Revision Details

| Version No. | Revision Date | Revision Description | Page Number |
|---|---|---|---|
| 1.0 | 10th July 2025 | Initial Release | NA |

---

## Contents

1. Purpose ..................................................................................................................................... 5
2. Validation Rules ...................................................................................................................... 5

   Category A: ................................................................................................................................. 6

   Category B/D: ........................................................................................................................... 47

### List of Tables

- Table 1: List of Category of Defect
- Table 2: Category A Rules
- Table 3: Category D Rule

---

## 1. Purpose

The Income Tax Department has provided free return preparation software in downloads page which are fully compliant with data quality requirements. However, there are certain commercially available software or websites that offer return preparation facilities as well. In order to ensure the data quality of ITRs prepared through such commercially available software, various types of validation rules are being deployed in the e-Filing portal, so that the data which is being uploaded are accurate and compliant to the validation rules to a large extent. The taxpayers are advised to review these validation rules to ensure that the software used by them is compliant with these requirements, to avoid rejection of return due to poor data quality or mistakes in the return.

The software providers are strictly advised to adhere to these rules to avoid inconvenience to the taxpayers, who may use their software. Software providers may please note that these validation rules will be strictly monitored and enforced, and each rule will have to be complied strictly. In case of violations, the concerned return preparation utility/ software is liable to be blacklisted without any notice and such blacklisting will be published on the e-filing website. No return using blacklisted software will be permitted to be uploaded till the time the software provider is able to provide details of correction in software. This may cause avoidable inconvenience to the taxpayers and loss of reputation to software providers for which the Income Tax Department will not be responsible.

---

## 2. Validation Rules

The validation process at e-Filing/CPC end is to be carried out in ITR 2 for each defect as categorized below:

### Table 1: List of Category of Defect

| Category of defect | Action to be Taken |
|---|---|
| A | Return will not be allowed to be uploaded. Error message will be displayed. |
| D | Return data will be allowed to be uploaded but the taxpayer uploading the return will be informed of a possibility of some of the deduction or claim not to be allowed or entertained unless the return is accompanied by the respective claim forms or particulars. |

---

## Category A:

### Table 2: Category A Rules

| Sl. No. | Scenario |
|---|---|
| 1 | Assessee should enter valid Mobile Number |
| 2 | Name of the taxpayer does not match with the "Name" as per the PAN database. Please update the name as appearing in e-filing profile. |
| 3 | Assessee claiming the benefit of senior citizen & super senior citizen, but the date of birth is not matching with PAN database/ Aadhaar database |
| 4 | If the original return is filed under section 142(1) then revised return cannot be filed |
| 5 | If "Whether you have held unlisted equity shares at any time during the previous year?" is selected as Yes, then the details should be filled. |
| 6 | In Filing status, "Are you governed by Portuguese Civil Code as per section 5A?" is selected as 'Yes' then Schedule Governed by Portuguese Civil Code should be mandatory. |
| 7 | "Whether this return is being filed by a representative assessee?" is selected as Yes then details should be provided. |
| 8 | In Part A General, Return is being filed by Representative Assessee, but the PAN quoted in representative assessee field is not the same as the PAN who is trying to upload the return. |
| 9 | In Part A General, "Are you filing return of income under the Seventh proviso to Section 139(1) " is selected as Yes then the respective details should be filled. |
| 10 | "Whether you were Director in a company at any time during the previous year?" is selected as Yes then the respective details should be filled. |
| 11 | First three alphabets should be as per list TAN codes on field TAN |
| 12 | Once a proceeding is initiated u/s 148 or 153A or 153C, return cannot be filed u/s 139. |
| 13 | In Part A General, "Are you filing return of income under clause (iv) of the Seventh proviso to Section 139(1) " is selected as Yes and drop-down is selected then the respective amounts should be filled. |
| 14 | In Filing status, "Are you governed by Portuguese Civil Code as per section 5A?" is selected as 'No' then Schedule Governed by Portuguese Civil Code should not be filed. |
| 15 | In Part A General, "Whether you are / FPI?" should be selected "Yes" for enabling the Schedule 115AD(1)(b)(iii)-Proviso |
| 16 | In Part A general, if filed in response to a notice u/s 139(9)/142(1)/148 or order under section 119(2)(b) then unique number /Document Identification Number (DIN) and date of such notice/Order are mandatory |
| 17 | Return which is getting filed should be as per role CD of the PAN |
| 18 | Option for opting out of new tax regime is not available after due date of filing of return as mentioned u/s 139(1) |
| 19 | Option for opting out of new tax regime is not available after due date of filing of return as mentioned u/s 139(1) |
| 20 | Residents and not ordinarily residents cannot be FII/FPIs. |
| 21 | Old Tax Regime cannot be selected after due date if filing u/s 139(1) |
| 22 | In Schedule S, Sl. No. 1 Gross Salary (1a + 1b + 1c +1d + 1e + 1f) should be consistent with sum of Sl. No. 1a+1b+1c+1d+1e +1f |
| 23 | In Schedule S, Sl. No. 2 Total Gross Salary (from all employers) should be sum of Sl. No. 1 +…. n |
| 24 | In Schedule S, Sl. No. 3 Allowances to the extent exempt u/s 10 should be equal to the sum of all the dropdowns |
| 25 | In Schedule S, Sl. No. 4 Net Salary should be output of Sl. No. 2 - 3 - 3a |
| 26 | In Schedule S, Sl. No. 5 Deductions u/s 16 (5a+5b+5c) should be equal to sum of 5a+5b+5c |
| 27 | In Schedule S, Sl. No. 6 Income chargeable under Salaries should be output of Sl. No 4-5 |
| 28 | Exemption u/s 10(10) for gratuity shall not exceed income offered under the head salary under sub head gratuity receipt and cannot exceed (i) Rs20 lakhs in case of Nature of employment is "Public Sector Undertaking", "PSU- Pensioners", "Others-Pensioners" or "Others". (ii)Rs 25 lakhs in case of Nature of employment is "Central Government", "State Government", "CG-Pensioners" or "SG-Pensioners" |
| 29 | If old tax regime is selected, In Schedule S in Field 3 dropdown value of "Sec 10(13A)- Allowance to meet expenditure incurred on house rent " should not be more than (50% of dropdown value of " Basic Salary and Dearness Allowance) or House Rent Allowance " in the Sl. No. . 1a of all employers of Schedule S. |
| 30 | In Sch S in Field 3 dropdown value of "Sec 10(10B) Second proviso - Compensation under scheme approved by the Central Government " should not be more than dropdown value of "Compensation due/received by an assessee from his employer or former employer in connection with the termination of his employment or modification thereto" in the Sl. No. . 1c in Sch S or Rs. 500000/- |
| 31 | In Schedule S in Field 3 Total value of allowances to the extent exempt u/s 10 excluding HRA u/s 10(13A) shall not exceed Sl. No. 1(a)+1(b)+1© (of all the employers) as reduced by House Rent Allowance (of all the employers) |
| 32 | Sum of Drop downs in Sl. No. 1a of Schedule S should be equal to Sl. No. 1a |
| 33 | Sum of Drop downs in Sl. No. 1b of Schedule Should be equal to Sl. No. 1b |
| 34 | Sum of Drop downs in Sl. No. 1c of Schedule S should be equal to Sl. No. 1c |
| 35 | Entertainment allowance 16(ii) will not be allowed for employees other than government. |
| 36 | If old tax regime is selected, In Schedule Salary, Entertainment allowance (sl.no 5b) will be allowed only to the extent of Rs 5000 or 1/5 of basic salary whichever is less for Central Govt, State Government and PSU employees u/s 16(ii) |
| 37 | In Schedule Salary, Professional tax u/s 16(iii) will be allowed only to the extent of Rs.5000/- |
| 38 | In Schedule Salary, at Sl. No. 1a- Gratuity shall not be allowed against more than one Employer. |
| 39 | In Schedule Salary, at Sl. No. 1a- Commuted pension shall not be allowed against more than one Employer. |
| 40 | If old tax regime is selected, in schedule Salary, Standard deduction shall not be allowed more than the lower of Rs. 50,000 or Net Salary |
| 41 | Sec 10(5)-Leave Travel concession/assistance received cannot be more than "Leave Travel Allowance" under Salary as per section 17(1). |
| 42 | Exempt allowance Sec 10(6)-Remuneration received as an official, by whatever name called, of an embassy, high commission etc." cannot be more than Gross Salary i.e., Sl. No. 1(a)+1(b)+1(c) (of all the employers) |
| 43 | Exempt allowance u/s 10(7)-Allowances or perquisites paid or allowed as such outside India by the Government to a citizen of India for rendering service outside India cannot be more than Gross salary i.e. Sl. No. 1(a)+1(b)+1(c) (of all the employers) |
| 44 | Sec 10(10A)-Commuted value of pension received cannot be more than Salary as per section 17(1) |
| 45 | Sec 10(10AA)-Earned leave encashment cannot be more than Salary as per section 17(1) |
| 46 | Exempt Allowance u/s 10(10C)-Amount received/receivable on voluntary retirement or termination of service cannot exceed Rs. 5,00,000 |
| 47 | In Schedule Salary, exempt allowances in Section 10(10B)(i) OR Section 10(10B)(ii) OR Section 10(10C), only one can be claimed. |
| 48 | In Schedule Salary, Exempt Allowance u/s 10(10CC)-Tax paid by employer on non- monetary perquisite cannot be more than Value of perquisites as per section 17(2) |
| 49 | In Schedule Salary, Section 10(14)(i) Prescribed Allowances or benefits (not in a nature of perquisite) specifically granted to meet expenses wholly, necessarily and exclusively and to the extent actually incurred, in performance of duties of office or employment cannot be more than the value of Salary under "Other Allowance" & "Others" in Section 17(1) |
| 50 | Sec 10(14)(ii) Prescribed Allowances or benefits granted to meet personal expenses in performance of duties of office or employment or to compensate him for increased cost of living cannot be more than the value of Salary under "Other Allowance" & "Others" in Section 17(1) |
| 51 | In Schedule Salary, same exempt allowance cannot be selected more than once. |
| 52 | If exempt allowance u/s 10(13A) is claimed, then deduction u/s 80GG cannot be claimed more than Rs. 55,000. |
| 53 | In schedule S, if taxpayer selects other than central & state government in nature of employer & if he is claiming deduction u/s 10(10AA), then deduction u/s 10(10AA) should not be more than Rs. 25 lakh. |
| 54 | If new tax regime is selected, then following allowances cannot be claimed as exempt (i.e. all these allowances should not be more than zero): "Sec 10(5)-Leave Travel concession/assistance" "Sec 10(13A)-Allowance to meet expenditure incurred on house rent" "Sec 10(14)(i)- Prescribed Allowances or benefits (not in a nature of perquisite) specifically granted to meet expenses wholly, necessarily and exclusively and to the extent actually incurred, in performance of duties of office or employment" "Sec 10(14)(ii) -Prescribed Allowances or benefits granted to meet personal expenses in performance of duties of office or employment or to compensate him for increased cost of living" |
| 55 | If old tax regime is selected, the following allowances cannot be claimed as exempt (i.e. all these allowances should not be more than zero): "Section 10(14)(i) - Allowances referred in sub-clauses (a) to (c) of sub-rule (1) in Rule 2BB" "Section 10(14)(ii) - Transport allowance granted to certain physically handicapped assessee" |
| 56 | Exempt allowance u/s 10(14)(ii) "Transport allowance granted to certain physically handicapped assessee" cannot exceed Rs 38,400 |
| 57 | If new tax regime is selected, Entertainment allowance u/s 16(ii) cannot be claimed. |
| 58 | If new tax regime is selected, Professional allowance u/s 16(iii) cannot be claimed. |
| 59 | HUF cannot claim Income claimed for relief from taxation u/s 89A |
| 60 | In Schedule Salary, Income claimed for relief from taxation u/s 89A cannot be claimed more than income offered in 1d |
| 61 | Sum of Drop downs in Sl. No. 1d of Schedule S should be equal to Sl. No. 1d |
| 62 | Exempt allowance u/s 10(10B) is claimed by Central Government employees, State government employees, CG-Pensioners, and SG- Pensioners |
| 63 | In schedule salary, under nature of perquisites, income is given more than once against one dropdown, under each block. |
| 64 | In schedule salary, under profit in lieu of salary, income is given more than once against one dropdown, under each block. |
| 65 | In "Income from retirement benefit account maintained in a notified country u/s 89A" in country drop-down, one country cannot be selected more than one time. |
| 66 | In Schedule Salary, Exempt allowance u/s 10(10B)(ii)-Retrenchment Compensation received in respect of approved scheme cannot exceed Rs.5,00,000 |
| 67 | In Schedule HP, Standard deduction allowed on House property should be equal to 30% of Annual value. |
| 68 | In case of co-owned house property assessee’s share and co-owner(s) share should be equal to 100 %. |
| 69 | In case property is co-owned, annual value of the property owned should be equal to own percentage share *annual value. |
| 70 | Assessee cannot claim interest on borrowed capital if assessee’s share of co-owned property is zero |
| 71 | Municipal tax is not allowed where Gross rent received/ receivable/ lettable value is zero or null |
| 72 | If old tax regime is selected, in schedule HP 'Interest on borrowed capital from HP' should not be more than 2 lakhs in case of self-occupied property. |
| 73 | Value at field 3 should be equal to Sum of Sl. No. 1k+2k+2 |
| 74 | In case of type of property is let out or deemed let out then Gross rent received/ receivable/ lettable value should be more than zero |
| 75 | In Schedule HP, Sl.no 1e - Annual Value should be output of SL.no (1a- 1d) |
| 76 | In Schedule HP, Sl.no 1d -Total should be output of SL.no (1b+1c) |
| 77 | In Schedule HP, Sl.no 1i -Total should be output of SL.no (1g+1h) |
| 78 | In Schedule HP - Sl.no 1k Income from House Property (1f – 1i + 1j) should be equal to sum of 1f – 1i + 1j |
| 79 | In Schedule HP, Sl.no 2 Pass through income should be equal to the amount of HP income mentioned in Schedule PTI |
| 80 | In Schedule HP, more than two houses are claimed to be self-occupied / annual lettable value for the properties is zero or null for more than two house and interest on borrowed capital cannot be claimed as deduction for more than two self-occupied properties |
| 81 | If new tax regime is selected, Interest on borrowed capital cannot be claimed for "Self- Occupied" house property. |
| 82 | In case of co-owned house property, Asseesee PAN & Co-owners PAN cannot be same |
| 83 | Being Resident or Resident but not Ordinarily resident Individual question "Please select whether you want to claim the benefit u/s 115H or not" should be answered. |
| 84 | In Schedule 112A, Col. 6 Total Sale Value should be equal to Col. 4*Col. 5 |
| 85 | In Schedule 112A, Col. 7 Cost of acquisition without indexation should be higher of Col. 8 and Col. 9 |
| 86 | In Schedule 112A, Col. 9 If the long-term capital asset was acquired before 01.02.2018 should be lower of Col. 6 and Col. 11 |
| 87 | In Schedule 112A, Col. 11 Total Fair Market Value of capital asset as per section 55(2)(ac) should be equal to Col. 4*Col. 10 |
| 88 | In Schedule 112A, Col. 13 Total deductions should be equal to sum of Col. (7+12) |
| 89 | In Schedule 112A, Col. 14 Balance should be equal to the output of Col. 6-Col. 13 |
| 90 | In Schedule 112A, Total should be equal to the sum of individual rows |
| 91 | In Schedule 115AD(1)(iii) proviso, Col. 6 Total Sale Value should be equal to Col. 4*Col. 5 |
| 92 | In Schedule 115AD(1)(iii) proviso, Col. 7 Cost of acquisition without indexation should be higher of Col. 8 and Col. 9 |
| 93 | In Schedule 115AD(1)(iii) proviso, Col. 9 If the long-term capital asset was acquired before 01.02.2018 should be lower of Col. 6 and Col. 11 |
| 94 | In Schedule 115AD(1)(iii) proviso, Col. 11 Total Fair Market Value of capital asset as per section 55(2)(ac) should be equal to Col. 4*Col. 10 |
| 95 | In Schedule 115AD(1)(iii) proviso, Col. 13 Total deductions should be equal to sum of Col. (7+12) |
| 96 | In Schedule 115AD(1)(iii) proviso, Col. 14 Balance should be equal to the output of Col. 6-Col. 13 |
| 97 | In Schedule 115AD(1)(iii) proviso, Total should be equal to the sum of individual rows |
| 98 | Total of STCG should be equal to the individual breakup in Schedule CG |
| 99 | Total of LTCG should be equal to the individual breakup in Schedule CG |
| 100 | In Schedule CG, SL.no. C Income chargeable under the head "Capital Gain" should be equal to the sum of Sl. No. A9+B13 |
| 101 | In Schedule CG, Full Value of Consideration (Sl. No. A1aiii) is zero than expenses (Sl. No. A1b(iv) should not be claimed |
| 102 | In Schedule CG, Full Value of Consideration (Sl. No. A(2)(a)) is zero then expenses (Sl. No. A(2)(biv)) should not be claimed |
| 103 | In Schedule CG, Full Value of Consideration (Sl. No. A(4)(aiii)) is zero then expenses (Sl. No. A(4)(biv)) should not be claimed |
| 104 | In Schedule CG, Full Value of Consideration (Sl. No. A(5)(aiii)) is zero then expenses (Sl. No. A(5)(biv)) should not be claimed |
| 105 | In Schedule CG, Full Value of Consideration (Sl. No. B(1)(aiii)) is zero then expenses (Sl. No. B(1)(biv)) should not be claimed |
| 106 | In Schedule CG, Full Value of Consideration (Sl. No. B(2)(a)) is zero then expenses (Sl. No. B(2)(biv)) should not be claimed |
| 107 | In Schedule CG, Full Value of Consideration (Sl. No. B3a) is zero then expenses (Sl. No. (B(3)(biv)) should not be claimed |
| 108 | In Schedule CG, Full Value of Consideration (Sl. No. B6aiii) is zero then expenses (Sl. No. B(6)(biv)) should not be claimed |
| 109 | In Schedule CG, Full Value of Consideration (Sl. No. B9aiii) is zero and expenses (Sl. No. B9b(iv) should not be claimed |
| 110 | In schedule CG, Sl. No. A1 biv of STCG Total should be equal to sum of A1(bi+bii+biii) |
| 111 | In schedule CG, Sl. No. A1c of STCG Balance should be equal to A1(aiii-biv) |
| 112 | In Schedule CG Sl.no. A1e of STCG should be equal to A(1c-1d) |
| 113 | In schedule CG, Sl. No. A2 biv of STCG Total should be equal to sum of A2(bi+bii+biii) |
| 114 | In schedule CG, Sl. No. A2c of STCG Balance should be equal to A(2a-biv) |
| 115 | In Schedule CG Sl.no. A2e of STCG should be equal to the sum of A(2c+2d) |
| 116 | In Schedule CG Sl.no. A4(a)(ic) should be higher of A4(a)(ia) or A4(a)(ib) |
| 117 | In Schedule CG, Sl. No. A4(aiii) should be equal to sum of A4[(a)(ic)+(a)(ii)] |
| 118 | If in Sch CG A4(biv) is should be equal to Sum of A4(bi+bii+biii) |
| 119 | In schedule CG, Sl. No. A4c Balance should be equal to A4(aiii-biv) |
| 120 | In Schedule CG Sl.no. A4e of STCG should be equal to the sum of A(4c+4d) |
| 121 | In Schedule CG Sl.no. A5(a)(ic) should be higher of A5(a)(ia) or A5(a)(ib) |
| 122 | In Schedule CG, Sl. No. A5(aiii) should be equal to sum of A5[(a)(ic)+(aii)] |
| 123 | If in Sch CG A5(biv) should be equal to Sum of A5(bi+bii+biii) |
| 124 | In schedule CG, Sl. No. A5c Balance should be equal to A5(aiii-biv) |
| 125 | In Schedule CG Sl.no. A5e of STCG should be equal to the sum of A(5c+5d) |
| 126 | In Schedule CG Sl.no. A6 of STCG should be equal to the sum of A(aXi + b) |
| 127 | In Schedule CG Sl.no. A7 of STCG should be equal to the sum of (A7ai + A7aii + A7b + A7c) |
| 128 | In Schedule CG, Sl. No. A8 Col. 10 Applicable Rate should be equal to lower of Col. 6 (Rate as per Treaty) or Col. 9 (Rate as per IT Act) |
| 129 | In schedule CG, Sl. No. B1 biv of LTCG Total should be equal to sum of B1 (biia + ∑biib(c) + biii) - where transfer is before 23rd July 2024 and B1(bi + ∑biib(a) + biii) - where transfer is on or after 23rd July 2024 |
| 130 | In schedule CG, Sl. No. B1c of LTCG Balance should be equal to B1(aiii-biv) |
| 131 | In Schedule CG Sl.no. B1e of LTCG should be equal to B(1c-1d) |
| 132 | In schedule CG, Sl. No. B2 biv of LTCG Total should be equal to sum of B2(bi+bii+biii) |
| 133 | In schedule CG, Sl. No. B2c of LTCG Balance should be equal to B(2a-biv) |
| 134 | In Schedule CG Sl.no. B2e of LTCG should be equal to B(2c-2d) |
| 135 | In schedule CG, Sl. No. B3ii biv of LTCG Total should be equal to sum of B3(bi+bii+biii) |
| 136 | In schedule CG, Sl. No. B3c of LTCG Balance should be equal to B(3a-biv) |
| 137 | In Schedule CG Sl.no. B3e of LTCG should be the difference of B(3c-3d) |
| 138 | In Schedule CG, Sl. No. B4a LTCG u/s 112A should be equal to total of Col. 14 of Schedule 112A |
| 139 | In Schedule CG Sl.no. B4c of LTCG should be equal to B(4a-4b) |
| 140 | In Schedule CG, Sl. No. B5c LTCG on share or debenture should be equal to B(5a-5b) |
| 141 | In Schedule CG Sl.no. B6(a)(ic) should be higher of B6(a)(ia) or B4(a)(ib) |
| 142 | In schedule CG, Sl. No. B6 aiii Total should be equal to sum of B6(a)(ic+ii) |
| 143 | In schedule CG, Sl. No. B6 biv Total should be equal to sum of B6(bi+bii+biii) |
| 144 | In schedule CG, Sl. No. B6c Balance should be equal to B(6aiii-biv) |
| 145 | In Schedule CG Sl. No. B6e of LTCG should be equal to B(6c-6d) |
| 146 | In Schedule CG, Sl. No. B7a LTCG u/s 112A should be equal to total of Col. 14 of Schedule 115AD(1)(iii) |
| 147 | In Schedule CG Sl. No. B7c of LTCG should be equal to B(7a-7b) |
| 148 | In Schedule CG, Sl. No. B8c LTCG on share or debenture should be equal to B(8a-8b) |
| 149 | In Schedule CG, Sl. No. B9(a)(ic) should be higher of B9(a)(ia) or B9(a)(ib) |
| 150 | In Schedule CG, Sl. No. B9 aiii Total should be equal to sum of B9(a)(ic+ii) |
| 151 | In Schedule CG, Sl. No. B9 biv Total should be equal to sum of B9(bi+bii+biii) |
| 152 | In Schedule CG, Sl. No. B9c Balance should be equal to B(9aiii-biv) |
| 153 | In Schedule CG Sl. No. B9e of LTCG should be equal to B(9c-9d) |
| 154 | In Schedule CG, Sl. No. B10 should be equal to B10(aXi + aXii + b) |
| 155 | In Schedule CG, Sl. No. B11 should be equal to B11a1(i) + B11a1(ii) + B11a2(i)+ B11a2(ii)+B11b |
| 156 | In Schedule CG, Sl. No. B12 Col. 10 Applicable Rate is not equal to lower of Col. 6 (Rate as per Treaty) or Col. 9 (Rate as per IT Act) |
| 157 | In Schedule Capital Gain, Resident cannot claim tax benefit u/s 112(1)(c) at Sl. No. B6ie if he has not exercised option under 115H. |
| 158 | In Schedule OS, Resident cannot claim tax benefit u/s 115AC if he has not exercised option under 115H. |
| 159 | In Schedule Capital Gain, Resident cannot claim tax benefit u/s 115AC at Sl. No. B6iie if he has not exercised option under 115H. |
| 160 | In Schedule CG, Sl. No. D1f should be equal to sum of D (1a + 1b + 1c + 1d + 1e) |
| 161 | In Schedule CG, Sl. No. Exi should be equal to the sum of sl. no (ii + iii + iv + v + vi + vii+viii +ix + x) |
| 162 | In “Schedule CG" E(xii) Total should be equal to the sum of E (Capital Loss to be set off -Total loss set off) |
| 163 | In Schedule CG, Value at field Ei2 should be equal to the sum of Sl. No. (A2ei+ A3ai+ A7ai) |
| 164 | In Schedule CG, Value at field Ei4 should be equal to the sum of Sl. No. (A4e+ A7b + A(A)) |
| 165 | In Schedule CG, value at field Ei5 should be equal to the sum of Sl. No. (A1e+A3b+A5e+A6+A7c + A(A)) |
| 166 | In Schedule CG, Sl. No. Ei6 should be equal to Amount of income at sl. no A8b. |
| 167 | In Sch CG, value at field Ei7 should be equal to the sum of Sl. No. (B3(ii)ei + B4ci + B6ei+B6eiii + B7ci + B8ci + B11a1(i) + B11a2(i) + B(A)) |
| 168 | In Sch CG, value at field Ei9 should be equal to the sum of Sl. No. (B1ga+B2e+B3(i)ei+B5ci+ B9ei+B10i+ B11b) |
| 169 | In Schedule CG, Sl. No. Ei10 should be equal to Amount of income at Sl. No. B12b. |
| 170 | In Schedule CG, value at field Eii should be equal to the sum of Sl. No. (A2ei+A3ai+A7ai) |
| 171 | In Sch CG, value at field Eiv should be equal to the sum of Sl. No. (A4e+A7b+A(A)) |
| 172 | In Sch CG, value at field Ev should be equal to the sum of Sl. No. (A1e+A3b+A5e +A6+A7c +A(A)) |
| 173 | In Schedule CG, Sl. No. Evi should be equal to Amount at income of Sl. No. A8b. |
| 174 | In Sch CG, value at field Evii should be equal to the sum of Sl. No. (B3(ii)ei+B4ci+B5cii+B6ei+B6eiii+B7ci+B8ci+B11a1(i)+B11a2(i)+ B(A)_10%) |
| 175 | In Sch CG, value at field Eix should be equal to the sum of Sl. No. (B1ga + B2e + B3(i)ei+B5ci + B9ei + B10i + B11b) |
| 176 | In Schedule CG, Sl. No. Ex should be equal to Amount of income at Sl. No. B12b. |
| 177 | Total of deductions claimed under respective section in STCG and LTCG should match Table D. |
| 178 | In Sch CG, value at field E11should be equal to the Col no (1-2-3-4-5-6-7-8 -9- 10) |
| 179 | In schedule CG at table F total of all the quarter of field "Short-term capital gains taxable at the rate of 15%" should match with field 3(iiia) of schedule BFLA "Short- term capital gain taxable @ 15% (Not applicable for Resident Senior Citizens)" |
| 180 | In schedule CG at table F the total of all the quarters of field "Short-term capital gains taxable at the rate of 30%" should match with field 3(iv) of schedule BFLA "Short-term capital gain taxable @ 30%" (Not applicable for Resident Senior Citizens) |
| 181 | In schedule CG at table F total of all the quarters of field "Short-term capital gains taxable at applicable rates" should match with field 3(v) of schedule BFLA "Short-term capital gain taxable at applicable rates" (Not applicable for Resident Senior Citizens) |
| 182 | In schedule CG at table F total of all the quarter of field "Short-term capital gains taxable at DTAA rates" should match with field 3(vi) of schedule BFLA "Short-term capital gain taxable at special rates in India as per DTAA" (Not applicable for Resident Senior Citizens) |
| 183 | In schedule CG at table F total of all the quarters of field "Long- term capital gains taxable at the rate of 10%" should match with field 3(viia) of schedule BFLA "Long- term capital gain taxable @ 10%" (Not applicable for Resident Senior Citizens) |
| 184 | In schedule CG at table F total of all the quarter of field "Long- term capital gains taxable at the rate of 20%" should match with field 3(viii) of schedule BFLA "Long term capital gain taxable @ 20%" (Not applicable for Resident Senior Citizens) |
| 185 | In schedule CG at table F total of all the quarter of field "Long term capital gains taxable @ DTAA rates" should match with field 3(ix) of schedule BFLA "Long-term capital gain taxable at special rates in India as per DTAA" (Not applicable for Resident Senior Citizens) |
| 186 | In schedule 112A, Value at Column no. 4,5,10 & 11 cannot be greater than zero in case drop down is selected as "After 31st January 2018" to question whether shares are acquired on or before 31.01.2018 or after 31.01.2018? |
| 187 | In schedule 115AD(1)(b)(iii), Value at Column no. 4,5,10 & 11 cannot be greater than zero in case drop down is selected as "After 31st January 2018" to question whether shares are acquired on or before 31.01.2018 or after 31.01.2018? |
| 188 | In Schedule CG, in case A1(aii) does not exceed 1.10 times A1(ai), value at A1(aiii) should be equal to A1(ai), or else value at A1(aiii) should be equal to A1(aii) |
| 189 | In Schedule CG, in case B1(aii) does not exceed 1.10 times B1(ai), value at B1(aiii) should be equal to B1(ai), or else value at B1(aiii) should be equal to B1(aii) |
| 190 | Please fill in either Schedule 112A" or "Schedule 115AD(1)(b)(iii) proviso" as applicable in your case" |
| 191 | In Schedule CG, SL. No. C3 Income chargeable under the head “CAPITAL GAINS” should be equal to the sum of "Sum of Capital Gain Incomes" and "Income from transfer of Virtual Digital Assets" |
| 192 | In Schedule CG, SL. No. C2 Income from transfer of Virtual Digital Assets should be equal to Sl. No. B of Schedule VDA |
| 193 | In Schedule CG, Table F Sl. No. 10 the breakup of all the quarters should be equal to the value of 'Income under the head Capital Gain' of schedule SI |
| 194 | In Schedule CG, Table F Sl. No.10 the breakup of all the quarters should be equal to the value at Sl. No. C2 |
| 195 | Schedule CG, Date of sale is mandatory if either of the field at B(1)(aiii) or B(1)(biia) or B(1)(biib) is more than zero |
| 196 | Schedule CG, Date of purchase is mandatory if either of the field at B(1)(aiii) or B(1)(biia) or B(1)(biib) is more than zero |
| 197 | In Schedule CG, since the date of purchase is less than 24 months from the date of sale, it does not qualify for long-term capital gain. |
| 198 | In Schedule CG, since the date of purchase is more than 24 months from the date of sale, it does not qualify for short-term capital gain. |
| 199 | The year of improvement is mandatory if Cost of improvement is declared in Schedule CG, Sl. No. B1 'From sale of land or building or both'. |
| 200 | Please fill in either Schedule 112A" or "Schedule 115AD(1)(b)(iii) proviso" as applicable in your case" |
| 201 | In Schedule VDA, value at Sl. No. 7 should be equal to Sl. No. 6 - Sl. No. 5 |
| 202 | In Schedule VDA, value at 'Total (Sum of all Positive Incomes of Capital Gain in Col. 7) should be equal to sum of col. 7 if head of income is selected as Capital Gain in col. 4 |
| 203 | In Schedule OS, Sl.no 1 Gross amount chargeable to tax at normal applicable rates should be equal to the sum of Sl. No. 1a+1b+1c+1d+1e |
| 204 | In Schedule OS, Sl.no 3c Deduction u/s 57 should be equal to the sum of Sl. No. 3a(i)+3a(ii)+3a(iii)+3b |
| 205 | In Schedule OS, Sl. No. 1c Rental income from machinery, plants, building, etc., Gross is equal to zero or null than Sl. No. 3b Depreciation cannot be claimed. |
| 206 | In Schedule OS, Sl.no 7 Income from other sources (other than from owning racehorses) should be equal to sum of sl.no 2+6 |
| 207 | In Schedule OS, Sl.no 8 Income from the activity of owning and maintaining racehorses should be equal to sum of sl.no 8a-8b+8c+8d |
| 208 | In Schedule OS, Sl.no 9 Income under the head" Income from Other Sources" should be equal to sum of sl.no (7 +8e) |
| 209 | In "Schedule OS" 2e should be equal to sum of all the drop downs |
| 210 | In Schedule OS, Sl.no 1d Income of nature referred to in section 56(2)(x) which is chargeable to tax (di + dii + diii + div + dv) should be equal to sum of sl.no 1di+1dii+1diii+1div+1dv |
| 211 | Taxpayer is a non-resident and showing income under section 115BBF |
| 212 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 1a should not exceed the field 1ai "Dividend other than ii" |
| 213 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 1b should not exceed field 1b "Interest, Gross" |
| 214 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 1c should not exceed the field 1c "Rental income from machinery, plants, buildings, etc., Gross" |
| 215 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 1d should not exceed the field 1d "Income of the nature referred to in section 56(2)(x) which is chargeable to tax " |
| 216 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 2a(i) should not exceed the field 2a(i) "Winnings from lotteries, crossword puzzles etc. chargeable u/s 115BB" |
| 217 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 2d should not exceed the field 2d "Any other income chargeable at special rate" above |
| 218 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of 2e at Col 2 Amount of Income should not exceed the field 2e "Pass through income in the nature of income from other sources chargeable at special rates" above |
| 219 | In schedule OS field 6 "Net Income from other sources chargeable at normal applicable rates " should equal to (1 – 3 + 4 + 5 - 5a -DTAA related to 1) i.e. "Gross income chargeable to tax at normal applicable rates (1a+ 1b+ 1c+ 1d + 1e) - Deductions under section 57 + Amounts not deductible u/s 58 + Profits chargeable to tax u/s 59 - Income claimed for relief from taxation u/s 89A - DTAA related to 1 in table f". |
| 220 | In schedule OS, Sl. No. 2f For TRC flag is Yes, column 10 should be lower of column 6 and column 9. |
| 221 | In Schedule OS, Sl.no 2 Income chargeable to tax at special rate should be equal to the sum of Sl. No. 2a+2b+2c+2d+2e+2f elements related to Sl. No. 1 |
| 222 | Deduction u/s 57(iia) can be claimed only if income is offered in Family Pension in Schedule OS |
| 223 | In Schedule OS, Sl. No. 1b should be equal to sum of (bi + bii + biii + biv + bv + bvi + bvii + bviii + bix) |
| 224 | In Schedule OS, Sl. No. 2c Accumulated balance of recognized provident fund taxable u/s 111 should be equal to sum of Col iii of Income Benefit |
| 225 | In Schedule OS, Sl. No. 2c Total of tax benefit should be equal to individual amounts of col iv (Tax Benefit) |
| 226 | The total of all the quarters of Income from Lottery should be equal to 2a(i) of Schedule OS - DTAA 115BB respectively. |
| 227 | In Schedule OS, Sl. No. 10 the quarterly break up of Dividend Income should be equal to [1ai (Dividend, gross) - DTAA Dividend other than 2(22)(e) - System calculated value of Interest expenditure u/s 57 attributable to Dividend other than 2(22)(e)] |
| 228 | In case of Old Tax Regime, in schedule OS, Deduction u/s 57(iia) cannot be more than lower of (i)1/3rd of Family pension or (ii)Rs.15,000. Note: Rounding off +1 and -1. |
| 229 | In Schedule OS, Interest expenditure on dividend u/s 57(1) should not be more than 20% of Dividend income. |
| 230 | In Schedule OS, Expenses / deductions (in case of other than family pension), shall be allowed only if income is offered in Sl. No. 1b, 1c, 1d and 1e (except Family pension). |
| 231 | In Schedule OS, value at sl.no.1a should be equal to 1ai + 1aii+1aiii. |
| 232 | In Schedule OS, Sl. No. 10 the quarterly break up of Dividend income taxable at DTAA rates should be equal to Dividend income selected at Sl. No. 2f of Schedule OS |
| 233 | In Schedule OS, Sl. No. 10 the quarterly break up of Dividend Income u/s 115A(1)(a)(i) @ 20% (Including PTI Income) should be equal to Dividend income selected at Sl. No. 2d and Sl. No 2e of Schedule OS |
| 234 | In Schedule OS, Sl. No. 10 Dividend Income u/s 115AC @ 10% should be equal to Dividend income selected at Sl. No. 2d and Sl. No 2e of Schedule OS |
| 235 | In Schedule OS, Sl. No. 10 the quarterly break up of Dividend Income u/s 115ACA (1)(a) 10% (Including PTI Income) should be equal to Dividend income selected at Sl. No. 2d and Sl. No 2e of Schedule OS. |
| 236 | In Schedule OS, Sl. No. 10 the quarterly break up of Dividend Income (other than units referred to in section 115AB) u/s 115AD(1)(i) @ 20% (Including PTI Income) should be equal to Dividend income selected at Sl. No. 2d and Sl. No 2e of Schedule OS |
| 237 | In Schedule Other Sources, Income claimed for relief from taxation u/s 89A cannot be claimed more than the income offered under Income from retirement benefit account maintained in a notified country u/s 89A |
| 238 | The quarterly breakup of Income from retirement benefit account maintained in a notified country u/s 89A" must be equal to amount entered in "Income from retirement benefit account maintained in a notified country u/s 89A" less "Income claimed for relief from taxation u/s 89A". |
| 239 | In Schedule OS, sl. no 5a. Income claimed for relief from taxation u/s 89A, shall be allowed only if income is offered in Sl. No. 1e under Income from retirement benefit account maintained in a notified country u/s 89A) |
| 240 | In Schedule other sources, Income from retirement benefit account maintained in a notified country u/s 89A is not equal to sum of amounts of income entered against individual country. |
| 241 | In schedule other sources, Expenses and deduction u/s 57 other than interest is claimed but corresponding income is not offered under the head other sources. |
| 242 | In Schedule OS - column 3 of table 2f, the sum of dropdown value of Col 2 Amount of Income of 2a(ii) should not exceed the field 2a(ii) "Income by way of winnings from online games chargeable u/s 115BBJ" |
| 243 | In Schedule OS, Sl. No. 10 the quarterly break up of "Income by way of winnings from online games u/s 115BBJ" should be equal to Sl. No. 2a(ii) -Income by way of winnings from online games u/s 115BBJ- DTAA 115BBJ respectively |
| 244 | In Schedule OS, Sl. No. 10 the quarterly break up of "Dividend Income as per proviso to sec 115A(1)(a)(A) @10%" (Including PTI Income) (i+ii+iii+iv+v) should be equal to sum of dividend income selected at Sl. No. 2d and Sl. No 2e in Schedule OS. |
| 245 | In "Income from retirement benefit account maintained in a notified country u/s 89A" in country drop-down, one country cannot be selected more than one time. |
| 246 | For ITR-2, Anonymous donation u/s 115BBC is not applicable. |
| 247 | In Schedule BFLA Sl. no 2(xi) should be equal to sl. no 6(x) of CFL |
| 248 | In Schedule BFLA Sl. no 2(ii) should be equal to sl. no 3c(x) of CFL |
| 249 | In "Schedule BFLA 2xiii Total of brought forward loss set off should be equal to sum of (2ii+ 2iiia + 2iiib +2iv + 2v+ 2vi + 2viia + 2viib + 2viii + 2ix + 2xi+2xii) |
| 250 | In "Schedule BFLA" in 3(xiv) Current year’s income remaining after set off Total should be equal to the sum of (3i + 3ii + 3iiia+3iiib + 3iv+ 3v + 3vi + 3viia+3viib + 3viii + 3ix +3x +3xi+3xii) |
| 251 | In Schedule BFLA, Col. 3 should be equal to Col. 1- Col. 2 |
| 252 | In schedule BFLA 1(i) "Salaries" should match with 4(ii) of schedule CYLA |
| 253 | In schedule BFLA 1(ii) "House property" should match with 4(iii) of schedule CYLA |
| 254 | In schedule BFLA 1(iiia) "Short-term capital gain taxable @ 15%" should match with 4(iva) of schedule CYLA |
| 255 | In schedule BFLA 1(iv) "Short-term capital gain taxable @ 30%" should match with 4(v) of schedule CYLA |
| 256 | In schedule BFLA 1(v) "Short-term capital gain taxable at applicable rates" should match with 4(vi) of schedule CYLA |
| 257 | In schedule BFLA 1(vi) "Short-term capital gain taxable at special rates in India as per DTAA" should match with 4(vii) of schedule CYLA |
| 258 | In schedule BFLA 1(viia) "Long-term capital gain taxable @ 10%" should match with 4(viiia) of schedule CYLA |
| 259 | In schedule BFLA 1(viii) "Long term capital gain taxable @ 20%" should match with 4(ix) of schedule CYLA |
| 260 | In Schedule BFLA, Sl. No. 1ix should be equal to Sl. No. 4x of schedule CYLA |
| 261 | In schedule BFLA 1(x) "Net income from other sources chargeable at normal applicable rates." should match with 4(xi) of schedule CYLA |
| 262 | In schedule BFLA 1(xi) "Profit from owning and maintaining racehorses" should match with 4(xii) of schedule CYLA |
| 263 | Schedule BFLA Sl. no 2(iiia+iiib+iv+v+vi+viia+viib+viii+ix) should be equal to sl. no 4(x)+5(x) of CFL |
| 264 | The amount of adjustment mentioned in CFL is not equal to the amount of adjustment in BFLA. |
| 265 | If old tax regime is selected, then sl.no 2xiv 'total house property loss of the current year set off' should not be more than Rs.200000. |
| 266 | "House property loss claimed at Schedule CYLA" should be equal to amount at "Schedule HP". |
| 267 | "Other sources loss at Schedule CYLA" should be equal to amount at "Schedule OS". |
| 268 | In Schedule CYLA, Sl.no 2xiv Total loss set off (2ii+ 2iva+2ivb + 2v + 2vi + 2vii + 2viiia+2viiib + 2ix + 2x+2xi+2xii+2xiii) should be equal to sum of 2ii + 2iva+2ivb + 2v + 2vi + 2vii + 2viiia+2viiib + 2ix + 2x+2xi+2xii+2xiii |
| 269 | In Schedule CYLA, Sl.no 3xiv Total loss set off (3ii + 3iii + 3iva+3ivb + 3v + 3vi + 3vii + 3viiia+3viiib + 3ix + 3x+3xi+3xii+3xiii) should be equal to sum of 3ii + 3iii + 3iva+3ivb + 3v + 3vi + 3vii + 3viiia+3viiib + 3ix + 3x+3xii+3xiii |
| 270 | In Schedule CYLA, Sl.no 2xv i.e., Loss remaining after set-off should be equal to the output of Sl.no. 2i-2xiv |
| 271 | In Schedule CYLA, Sl.no 3xv i.e., Loss remaining after set-off should be equal to the output of Sl.no. 3i-3xiv |
| 272 | In Schedule CYLA, Col No. 4 Current year’s Income remaining after set off should be equal to the output of Col No. 1-2-3 |
| 273 | In Schedule CYLA Short term capital gain @15% should be equal to SL.no. 11ii of item E of Schedule CG |
| 274 | In Schedule CYLA Short term capital gain @30% should be equal to SL.no. 11iv of item E of Schedule CG |
| 275 | In Schedule CYLA Short term capital gain taxable at applicable rates should be equal to SL.no. 11v of item E of Schedule CG |
| 276 | In Schedule CYLA Short term capital gain taxable at DTAA rates should be equal to SL.no. 11vi of item E of Schedule CG |
| 277 | In Schedule CYLA Long term capital gain taxable @10% should be equal to SL.no. 11vii of item E of Schedule CG |
| 278 | In Schedule CYLA Long term capital gain taxable @20% should be equal to SL.no. 11ix of item E of Schedule CG |
| 279 | In Schedule CYLA Other Source Income (excluding profit from owning race horses and amount chargeable to special rate of tax) should be equal to SL.no. 6 of Schedule OS |
| 280 | In Schedule CYLA Profit from owning and maintaining race horses should be equal to SL.no. 8e of Schedule OS |
| 281 | In Schedule CYLA Salary Income should be equal to SL.no. 6 of Schedule Salary |
| 282 | In Schedule CYLA Long term capital gain taxable at DTAA rates should be equal to SL.no. 11x of item E of Schedule CG |
| 283 | If new tax regime is selected, in schedule CYLA Sl. No. 2ii to 2xiv should not be more than Rs. Zero (i.e., house property loss of the current year can't set off against any other income). |
| 284 | If new tax regime is selected, in schedule CYLA Sl. No. 2xv cannot be more than Rs. Zero |
| 285 | In Schedule CYLA, 'Total loss set off' cannot be more than the 'Loss to be set off' |
| 286 | In Schedule CYLA, Normal OS loss should be set off first against the Profit from the activity of owning and maintaining race horses. |
| 287 | In Schedule CYLA sum of column no 2 + 3 should not exceed amount as referred in column 1 |
| 288 | In Schedule BFLA value in Column 2 should not exceed amount as referred in column 1. |
| 289 | In Schedule BFLA, the amount mentioned at Column 3 should not exceed the amount mentioned at Column 1. |
| 290 | Schedule BFLA, amount mentioned at Sl. no 2(xii) should not exceed the sum of amount mentioned at Sl. no. x of Column 3 to 6 of CFL. |
| 291 | Short Term Capital Loss at Schedule CFL" should be equal to sum of "Short Term Capital Losses remaining after set off" at table E of Schedule CG. |
| 292 | Long Term Capital Loss at Schedule CFL is not equal to sum of "Long Term Capital Losses remaining after set off" at table E of Schedule CG. |
| 293 | House Property Loss at Schedule CFL should be equal to the amount at "House Property Loss remaining after set-off at Schedule CYLA". |
| 294 | Total of brought forward losses should be equal to amount provided in individual AYs |
| 295 | The amount of adjustment mentioned in CFL is not equal to amount of adjustment in BFLA. |
| 296 | Donee PAN should not be same as "Assessee PAN" or "PAN at Verification" |
| 297 | In Schedule 80G, the amount of deduction computed should not be more than the eligible amount |
| 298 | Deduction u/s 80G is not allowed for donation made in cash above Rs. 2,000/- at Sl. No. A. |
| 299 | Deduction u/s 80G is not allowed for donation made in cash above Rs. 2,000/- at Sl. No. B. |
| 300 | Deduction u/s 80G is not allowed for donation made in cash above Rs. 2,000/- at Sl. No. C. |
| 301 | Deduction u/s 80G is not allowed for donation made in cash above Rs. 2,000/- at Sl. No. D. |
| 302 | In Schedule 80G (A) "Donations entitled for 100% deduction without qualifying limit" "Total Donation" should be equal to sum of "Donation in cash" AND "Donation in other mode" |
| 303 | In Schedule 80G (B) "Donations e "Total Donation" should be equal to sum of "Donation in cash" AND "Donation in other mode" |
| 304 | In Schedule 80G (C) "Donations entitled for 100% deduction without qualifying limit" "Total Donation" should be equal to sum of "Donation in cash" AND "Donation in other mode" |
| 305 | In Schedule 80G (D) "Donations entitled for 100% deduction without qualifying limit" "Total Donation" should be equal to sum of "Donation in cash" AND "Donation in other mode" |
| 306 | In Schedule 80G(E) Donations should be equal to (A+B+C+D) |
| 307 | If old tax regime is selected, In Schedule VIA, deduction claimed u/s 80G should not be more than the total eligible amount of donation mentioned in Schedule 80G. |
| 308 | Schedule 80G should be blank if new tax regime is selected. |
| 309 | In schedule 80G, If PAN is already entered in anyone of the set of blocks (i.e., 100%, 50%, with Qualifying limit, without Qualifying limit) then the same PAN cannot be entered in any other block except PAN 'AAAAR1077P'. |
| 310 | If old tax regime is selected, then Deduction at Sl. No. 1a of Schedule 80D Self and Family shall be allowed to the extent of 25000 |
| 311 | If Old tax Regime is selected, then In Schedule 80D, Deduction at Sl. No. 1a should be equal to sum of Sl. No (i+ii) Note: This validation to be checked if value at Sl. No. 1a is less than 25000 |
| 312 | If Old tax Regime is selected, In Schedule 80D, the amount of preventive health checkup of all the fields combined together should not exceed 5000 |
| 313 | If Old Tax Regime is selected, In Schedule 80D, Deduction at Sl. No. 1b Self and Family (Senior Citizen) shall be allowed to the extent of 50000 |
| 314 | If Old Tax Regime is selected, then in Schedule 80D, the Deduction at Sl. No. 1b should be equal to the sum of Sl. No (i+ii+iii) Note: This validation to be checked if value at Sl. No. 1b is less than 50000 |
| 315 | If old tax regime is selected, then Deduction at Sl. No. 2a of Schedule 80D parents shall be allowed to the extent of 25000 |
| 316 | If Old tax Regime is selected, then In Schedule 80D, Deduction at Sl. No. 2a should be equal to sum of Sl. No (i+ii) Note: This validation to be checked if value at Sl. No. 2a is less than 25000 |
| 317 | If Old Tax Regime is selected, In Schedule 80D, Deduction at Sl. No. 2b parents (Senior Citizen) shall be allowed to the extent of 50000 |
| 318 | If Old Tax Regime is selected, then in Schedule 80D, Deduction at Sl. No. 2b should be equal to sum of Sl. No (i+ii+iii) Note: This validation to be checked if value at Sl. No. 2b is less than 50000 |
| 319 | If old tax regime is selected, then sl. No 3 of schedule 80D 'Eligible amount of deduction' should not be more than 100000 |
| 320 | If old tax regime is selected, In Schedule 80D, Eligible amount of deduction at Sl. No. 3 should be equal to sum of Sl. No (1a+1b+2a+2b) Note: This validation to be checked if value at Sl. No. 3 is less than or equal to 100000 |
| 321 | Deduction under section 80D is claimed in Sch VI A then Schedule 80D must be filled |
| 322 | 80D claimed in Sch VI A should be equal to Eligible amount of deduction of Schedule 80D |
| 323 | If new tax regime is selected, Deduction u/s 80D should not be claimed. |
| 324 | Please select drop down as 'No' to claim deduction for Self and Family |
| 325 | Please select drop down as 'Yes' to claim deduction for Self and Family including Senior Citizen |
| 326 | Please select drop down as 'No' to claim deduction for Parents |
| 327 | Please select drop down as 'Yes' to claim deduction for Parents including Senior Citizen |
| 328 | Please select dropdowns 'Yes' or 'No' to claim deduction u/s 80D |
| 329 | Please select dropdowns 'Yes' or 'No' to claim deduction u/s 80D |
| 330 | In Schedule 80GGA, Details of donation for scientific research are rural development "Total Donation" should be equal to sum of "Donation in cash" AND "Donation in other mode" |
| 331 | in Schedule 80GGA, Total Donation should be equal to the sum of (i+ii) |
| 332 | Donee PAN should not be same as "Assessee PAN" or "PAN at Verification" |
| 333 | If old tax regime is selected & if taxpayer wants to claim deduction u/s 80GGA of Schedule VIA, then mandatorily he is required to fill Schedule 80GGA. |
| 334 | Schedule 80GGA should be blank if option Yes is selected for 'Are you opting for new tax regime u/s 115BAC?' |
| 335 | In Schedule 80GGA, then Deduction u/s 80GGA is not allowed for donation made in cash for above Rs. 2000. |
| 336 | Deduction u/s 80CCD(1) is not applicable to HUF. |
| 337 | Deduction u/s 80CCD(1B) is not allowed to HUF. |
| 338 | Deduction u/s 80CCD(2) is not allowed to HUF. |
| 339 | Deduction u/s 80E is not allowed to HUF. |
| 340 | Deduction u/s 80EE is not allowed to HUF. |
| 341 | If Old Tax regime is selected, deduction u/s 80TTA cannot be claimed by a Resident Senior Citizen person |
| 342 | If option No is selected for 'Are you opting for new tax regime u/s 115BAC?', Deduction u/s 80TTB is not allowed to senior citizen. |
| 343 | Deduction u/s 80U is not allowed to HUF. |
| 344 | Deduction u/s 80EEA is not allowed to HUF |
| 345 | Deduction u/s 80EEB is not allowed to HUF |
| 346 | Deduction u/s 80DD is not allowed to Non Resident. |
| 347 | Deduction u/s 80DDB is claimed by Non resident. |
| 348 | Deduction u/s 80U is claimed by Non resident. |
| 349 | Deductions claimed under Chapter VI-A should not be greater than “Gross Total Income” |
| 350 | In Schedule VIA, amount claimed in deduction u/s 80GGA should not be different from the amount claimed in Schedule 80GGA |
| 351 | In Schedule Part BTI- Deduction under Chapter VI-A should be consistent with the total of all deductions in Schedule VI-A |
| 352 | Deduction u/s 80QQB is not applicable to Non resident individuals & HUF. |
| 353 | Deduction u/s 80QQB is not applicable to Non resident individuals & HUF. |
| 354 | Deduction u/s 80RRB is not applicable to Non resident Individuals & HUF. |
| 355 | Deduction u/s 80RRB is not applicable to Non resident Individuals &n HUF. |
| 356 | In Schedule VIA, deduction u/s 80RRB plus 80QQB claimed is more than the income entered in Schedule OS Sl. No. 1e |
| 357 | Deduction u/s 80CCD(2) cannot be claimed by taxpayer who has selected all employer category as CG-Pensioners, SG-Pensioners, PSU-Pensioners, Other- Pensioners |
| 358 | Deduction u/s 80CCD(2) cannot be claimed more than 14% of salary if any of the employer is Central Government or State Government in case of Old tax regime |
| 359 | Deduction u/s 80QQB cannot be claimed if return is not filed within the due date or extended due date. |
| 360 | Deduction u/s 80RRB cannot be claimed if return is not filed within the due date or extended due date. |
| 361 | If new tax regime is selected, then In Schedule Chapter VI-A, Deduction u/s 80C, 80CCC, 80CCD(1) , 80CCD(1B), 80D, 80DD, 80DDB, 80E, 80EE, 80EEA, 80EEB, 80G, 80GG, 80GGA, 80GGC, 80QQB, 80RRB, 80TTA, 80TTB, 80U cannot be claimed. |
| 362 | Deduction u/s 80TTA should be restricted to interest income from Savings Account under Income from other sources. |
| 363 | If Old Tax Regime is selected, Assessee being resident senior citizen claiming deduction u/s 80TTB should be restricted to interest income (Savings & Deposits) from other sources. |
| 364 | Deduction u/s 80CCD(2) should not be more than 10% of salary in case of employer category is other than Central Government or State Government in case of Old Tax Regime |
| 365 | Sum of deductions u/s 80C, 80CCC and 80CCD(1) is more than Rs. 150000. |
| 366 | Deduction u/s 80CCH to be limited to 60% of salary. |
| 367 | Deduction u/s 80CCD(1) to be limited to 10% of salary or 20% of GTI as applicable. |
| 368 | Non resident individuals cannot claim deduction u/s 80TTB |
| 369 | Deduction u/s 80CCH(1) is not allowed in New (Default) Tax Regime u/s 115BAC |
| 370 | In Schedule 80GGC, Amount of deduction computed cannot be more than the eligible amount. Hence deduction u/s 80GGC is restricted to eligible amount of contribution in schedule 80GGC |
| 371 | In Schedule 80GGC, 'Eligible amount of contributions' for each row shall be equal to "contribution in other mode" subject to GTI |
| 372 | Total contribution' should be equal to sum of "contribution in cash" AND "contribution in other mode" in table (80GGC) |
| 373 | In schedule 80GGC, sl. no. D "Eligible Amount of contribution" should be equal to sum of individual amounts restricted to GTI |
| 374 | In schedule 80GGC, Values at sl. no. A - total contribution in Cash, B-contribution in other mode and C-Total contribution should be equal to sum of individual amounts entered |
| 375 | In schedule 80GGC, If Values at "Total contribution" in a row is more than "0", then "Date of contribution" is required |
| 376 | In schedule 80GGC, if "contribution in other mode" is > 0, then details of such contribution are required |
| 377 | If Old Tax Regime is selected, and in the schedule VI-A, value at 2u is selected as "Self with disability", Then the amount should be equal to Rs. 75,000 subject to GTI. |
| 378 | If Old Tax Regime is selected, and if drop down selected at sl. no (i)-Nature of disability' of schedule 80DD is 'dependent person with disability' and amount is less or more -Rs. 75000 subject to GTI. |
| 379 | If Old Tax Regime is selected, and if drop down selected at sl. no (i)-Nature of disability' of schedule 80DD is 'dependent person with severe disability' and amount is less or more Rs. 125000 subject to GTI. |
| 380 | If Old Tax Regime is selected, and in the schedule 80U value at i- 'Nature of disability' is selected as "self with severe disability" and the value at field ii-'Amount if deduction' is less or more than 125,000 subject to GTI. |
| 381 | If 80U claimed in Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80U |
| 382 | In schedule 80U, if deduction is > 0, then details of such donation are required |
| 383 | If 80DD claimed in Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80DD |
| 384 | In schedule 80DD, if deduction is > 0, then details of such donation are required |
| 385 | In schedule SI, Sl. No. 1 should be equal to Sl. No. 2(c) of schedule OS |
| 386 | In schedule SI, Sl. No. 1 should be equal to Sl. no 2(civ) of schedule OS |
| 387 | If no special Income is shown, then tax at special rates should not be computed. |
| 388 | Special income u/s 115BB (Winnings from lotteries, puzzles, races, games etc.) offered in schedule OS Sl. No. 2a should be equal to corresponding income in schedule SI |
| 389 | Special income u/s115BBE (Income under section 68, 69, 69A, 69B, 69C or 69D) offered in schedule OS Sl. No. 2b is not equal to corresponding income in schedule SI |
| 390 | Special income under Income from other sources chargeable at special rates in India as per DTAA offered in schedule BFLA Sl. No. 3(xii) is not equal to corresponding income in schedule SI |
| 391 | In Schedule SI, the amount at column (ii) Tax thereon should be equal to taxable income (*) special rate |
| 392 | In Schedule SI, tax computed cannot be null if income is greater than zero |
| 393 | In Schedule Part B-TI, Income chargeable to tax at special rate under section 111A, 112, 112A etc. included in 10 should be consistent with all the special incomes of Schedule SI |
| 394 | Sum of income u/s 111A or section 115AD(1)(ii)- Proviso (STCG on shares/equity- oriented MF on which STT paid) & Pass Through Income in the nature of Short Term Capital Gain chargeable @ 15% in schedule SI should be equal to corresponding income as per schedule BFLA |
| 395 | Sum of income u/s 115AD (STCG for FIIs on securities where STT not paid) & Pass- Through Income in the nature of Short Term Capital Gain chargeable @ 30% should be equal to corresponding income as per schedule BFLA |
| 396 | Sum of income u/s 112 (LTCG on others), Proviso to 112(1)( LTCG on listed securities/ units without indexation) & Pass Through Income in the nature of Long Term Capital Gain chargeable @ 20% should be equal to corresponding income as per schedule BFLA |
| 397 | Sum of income u/s 112(1)(c)(iii) (LTCG for non-resident on unlisted securities or other than Listed debentures), 115AC (LTCG for non-resident on bonds/GDR), 115ACA (LTCG for an employee of specified company on GDR), 115AD (LTCG for FII on securities), 115E (LTCG for non-resident Indian on specified asset), 112A or section 115AD(1)(iii)-Proviso (LTCG on sale of shares or units on which STT is paid), Pass Through Income in the nature of Long Term Capital Gain chargeable @ 10%-u/s 112A, Pass Through Income in the nature of Long Term Capital Gain chargeable @ 10% - u/s other than 112A should be equal to corresponding income as per schedule BFLA |
| 398 | Total of all special incomes at (i) should match with total income in schedule SI |
| 399 | In "Schedule SI" Total of column "Tax thereon (ii)" should be equal to value entered in individual columns |
| 400 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 401 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 402 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 403 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 404 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 405 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 406 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 407 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 408 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 409 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 410 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 411 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 412 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 413 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 414 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 415 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 416 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 417 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 418 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 419 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 420 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 421 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 422 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 423 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 424 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 425 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 426 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 427 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 428 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 429 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 430 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 431 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 432 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI |
| 433 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI |
| 434 | Income selected in 2d"Any other income chargeable at special rate" of schedule OS should match with the corresponding income in schedule SI |
| 435 | Income selected in sl. no 2e of schedule OS should match with the corresponding income in schedule SI |
| 436 | Special income offered in schedule OS Sl. No. 2d should be equal to corresponding income in schedule SI, i.e., Income chargeable u/s 115AC(1)(b)' Income by way of dividend on GDR purchased in foreign currency in case of a non-resident' |
| 437 | Special income offered in schedule OS Sl. No. 2e should be equal to corresponding income in schedule SI, i.e., Pass through Income chargeable u/s 115AC(1)(b)' Income by way of dividend on GDR purchased in foreign currency in case of a non-resident' |
| 438 | Income selected in sl. no 2d of schedule OS should match with the corresponding income in schedule SI |
| 439 | Income selected in sl. no 2e of schedule OS should match with the corresponding income in schedule SI |
| 440 | Special income u/s 115BBJ (Winnings from lotteries, puzzles, races, games etc.) offered in Schedule OS, sl. no. 2a(ii) should be equal to corresponding income in Schedule SI. |
| 441 | If Old Tax regime is selected, In Schedule AMT, Sl.no. 1 shall be equal to Sl. No. 12 Total Income of Part BTI. |
| 442 | In Schedule AMT, Sl. No. 3 Adjusted Total Income under section 115JC should be equal to sum of Sl. No. 1 + 2a. |
| 443 | If Old Tax Regime is selected, In Schedule AMT, Sl. No. 2a should be equal to sum of system computed value of 80QQB & 80RRB of Schedule VIA. |
| 444 | In Schedule AMTC, Sl. No. 1 should be equal to Sl. No. 1d of Part BTTI |
| 445 | If Old Tax Regime is selected, In Schedule AMTC, Sl. No. 2 should be equal to Sl. No. 7 of Part BTTI. |
| 446 | In Schedule AMTC, Sl. No. 3 should be equal to Sl. No. (2 - 1) |
| 447 | In Schedule AMTC, Sl. No. 3 should be equal to zero when Sl. No. 2 is less than or equal to Sl. No. 1 |
| 448 | If Old Tax regime is selected, In Schedule AMTC, Sl.no. 5 Amount of tax credit under section 115JD utilized during the year [total of item No. 4 (C)] should be equal to Total of item no. 4C |
| 449 | If Old Tax regime is selected, In Schedule AMTC, Sl.no. 6 Amount of AMT liability available for credit in subsequent assessment years [total of 4 (D)] should be equal to Total of item no. 4D. |
| 450 | In Schedule AMT, Sl. No. 4 tax payable under section 115JC should be equal to 18.5% of Sl. No. 3, provided Sl. No. 3 is greater than 20 Lakh. |
| 451 | If Old Tax regime is selected, in "Schedule AMTC" Col. D Balance AMT Credit Carried Forward should be equal to the sum of Col. B3 (Balance brought forward to the current assessment year) - Col. C (AMT Credit Utilized during the Current Assessment Year) Note: This rule is not applicable for total column. It is applicable for each individual AY |
| 452 | If new tax regime is selected, Schedule AMT should be blank. |
| 453 | If new tax regime is selected, In Schedule AMTC, values at column C and column D should not be more than zero. |
| 454 | In Schedule EI, Sl. No. 5 Pass through income not chargeable to tax should be equal to the amount of exempt income mentioned in Schedule PTI |
| 455 | In "Schedule EI", in total of Other exempt income, (including exempt income of minor child) should be equal to value entered in amount columns. |
| 456 | In "Schedule EI", "Total income not chargeable to tax as per DTAA" should be equal to the total of amount entered in "Amount of Income" |
| 457 | In Schedule EI, Sl. No. 6 should be equal to sum of Sl. No. (1 + 2 + 3 + 4 + 5) |
| 458 | In "Schedule EI" in the Net Agricultural income for the year should be equal to (Gross Agricultural receipts (other than income to be excluded under rule 7A, 7B or 8 of I.T. Rules) – Expenditure incurred on agriculture –Unabsorbed agricultural loss of previous eight assessment years) |
| 459 | In Schedule PTI Col. 9 should be equal to output of Col 7-8 |
| 460 | In Schedule PTI, Sl. No. iia Short Term should be equal to sum of ai+aii |
| 461 | In Schedule PTI, Sl. No. iib Long Term should be equal to sum of bi+bii |
| 462 | In Schedule PTI, Sl. No. iii Other Sources should be equal to sum of a+b |
| 463 | In Schedule PTI, Sl. No. iv Income claimed to be exempt should be equal to sum of a+b+c |
| 464 | In schedule FSI total of column e "Tax relief available in India(e)= (c) or (d) whichever is lower" should match with e(i) + e(ii) + e(iii) + e(iv) i.e. Salary + House Property + Capital Gains + Other Sources. |
| 465 | Schedule FSI is not applicable if residential status is non resident |
| 466 | In schedule FSI total of column b "Income from outside India (included in PART B- TI) should match with b(i) + b(ii) + b(iii) + b(iv) i.e. Salary + House Property + Capital Gains + Other Sources. |
| 467 | If new tax regime is selected, then in schedule EI exempt income u/s 10(17)-Allowance MP/MLA/MLC cannot be claimed. |
| 468 | In Schedule EI, if net agricultural income for the year exceeds Rs.5 lakh, details of each agriculture land should not be blank |
| 469 | In Schedule FSI, if tax relief is claimed against salary income, then amount shown in Gross salary under Schedule salary should not be less than the amount shown under salary in Schedule FSI |
| 470 | In Schedule FSI If tax relief is claimed against House Property, then the amount shown in House property in Sl.no 1k+2 should not be less than the amount of income shown under House property in Schedule FSI |
| 471 | In Schedule FSI, if tax relief is claimed against Capital Gains then amount of Income shown in Capital gains should not be less than the amount of income shown under Capital gains in Schedule FSI |
| 472 | The assessee is governed by Portuguese Code, then "PAN of Spouse" should be provided. |
| 473 | In Schedule 5A, Sl. No. 4 total is not equal to sum of Sl. No. (1+2+3) for all the columns. |
| 474 | In schedule TR field 2 "Total Tax relief available in respect of country where DTAA is applicable (section 90/90A) (Part of total of 1(d)" should match with the sum of items in 1(d), wherever the corresponding 1(e) field is selected as Section 90/90A |
| 475 | In schedule TR field 3 "Total Tax relief available in respect of country where DTAA is not applicable (section 91) (Part of total of 1(d))" should match with the sum of items in 1(d), wherever the corresponding 1(e) field is selected as Section 91. |
| 476 | Schedule TR is not applicable if residential status is non resident |
| 477 | In schedule TR field "Total taxes paid outside India (total of (c) of Schedule FSI in respect of each country)" should match with total of column "Tax paid outside India" in schedule FSI for each and every "Country code" and "Taxpayer Identification Number". |
| 478 | In schedule TR field "Total tax relief available (total of (e) of Schedule FSI in respect of each country" should match with total of column "Tax relief available in India (e) = (c) or (d) whichever is lower" in schedule FSI for each and every "Country code" and "Taxpayer Identification Number". |
| 479 | Schedule AL should be filled if total Income is greater than 1 crore. |
| 480 | In Part A General "Name of the representative, Capacity of the representative, Address of the representative and Permanent Account Number (PAN)/ Aadhaar of the representative" is mandatory if in schedule "Verification" Verification capacity is selected as "Representative" from drop down |
| 481 | In Schedule TCS, “The Amount of TCS claimed this year” cannot be more than “Tax collected”. |
| 482 | In "Schedule IT" Total of Column 5 "Amount" Should be equal to sum of amount entered in amount column |
| 483 | In "Schedule Part B-TTI" in 15( c) of TCS should be equal to the value entered in total of column 7(i) of 20D |
| 484 | In Schedule TCS, Total TCS claimed should be equal to sum of individual values |
| 485 | In Schedule TDS2 (Other than salary), "Unclaimed TDS brought forward and details of TDS of current FY should be provided in different rows in Sch TDS 2" |
| 486 | In schedule TDS Other than Salary, TDS claimed cannot be more than Gross income disclosed |
| 487 | Corresponding Receipts/withdrawals offered - "Gross Amount (Col 11)" and "Head of Income (Col 12)" are to be filled since TDS is claimed in column 9 of TDS2. |
| 488 | Corresponding Receipts/withdrawals offered - "Gross Amount (Col 11)" and "Head of Income (Col 12)" are to be filled since TDS is claimed in column 6 of TDS3. |
| 489 | In field "TDS claimed" amount entered cannot be more than sum of amount filled in "TDS b/f" and "TDS Deducted". |
| 490 | In field "TDS claimed" amount entered cannot be more than sum of amount filled in "TDS b/f" and "TDS Deducted". |
| 491 | HUF cannot have TDS on salary. |
| 492 | In Schedule TDS (2)/(3), TDS credit relating to other person is selected than the PAN of other person should be provided. |
| 493 | In Schedule TDS (2)/(3), if TDS credit relating to other person is selected then TAN of the Deductor/ PAN of Tenant/ Buyer should not be filled. |
| 494 | In Schedule TDS from salary, “Total tax deducted" cannot be more than "Income chargeable under the head Salary". |
| 495 | TDS on Salary can be claimed only if respective Salary income is disclosed in Salary Schedule. |
| 496 | In Schedule TCS, Unclaimed TCS brought forward & details of TCS of current FY cannot be entered in same rows |
| 497 | TCS Claimed in own hands & in hands of any other person, shall not exceed TCS brought forward, TCS collected in own hands & Collected in the hands of spouse as per section 5A or any other person as per rule 37-I(1) in schedule TCS |
| 498 | In Schedule TCS, TCS credit relating to other person is selected but the PAN of other person is not provided or TCS credit is claimed in other person's hand but PAN of other person is not provided |
| 499 | In Schedule TCS, applicable dropdown in column 2(i) should be selected |
| 500 | In schedule TCS, Tax deduction and Tax collection account no. of the collector should be provided |
| 501 | In Schedule TCS, column 8, 'TCS credit being carried forward' should be equal to column 5 + column 6 - column 7 |
| 502 | In Schedule TDS2, column 13, 'TDS credit being carried forward' should be equal to column 6 + 7 + 8 - 9 – 10 |
| 503 | In Schedule ESOP "Balance amount of tax deferred to be carried forward to be next Assessment years" Sl.no 8 should be equal to Sl.no 3-7 |
| 504 | In Schedule ESOP "Balance amount of tax deferred to be carried forward to be next Assessment years" Sl.no 8 should be equal to Sl.no 3b of Part B-TTI |
| 505 | In Schedule ESOP If Sl.no 4, option selected as 'Not sold' AND If in Sl.no 5, option selected as 'No', then Sl.no 7 should be as Zero |
| 506 | In Schedule ESOP if Sl. No. 5 is selected as "Yes", then Sl.no 7 should be auto populated from Sl.no 3, |
| 507 | Assessee with total income exceeding Rs. 7,00,000 subject to marginal relief (if any) cannot claim Rebate u/s 87A. Please refer to section 87A of Income tax act, 1961. |
| 508 | If Old tax regime is selected, then value in the field "Rebate u/s 87A" should not be more than Rs.12,500. |
| 509 | "Losses of current year to be carried forward" at "Part B TI" should be equal to "Total of Current Year Losses" of Schedule CFL. |
| 510 | Tax computation has been disclosed but GTI (Gross Total Income) is Nil or 0. |
| 511 | The value in pt.3av -"Total Short term " in Part B TI should be equal to total of pt. (3aia+3aib + 3aii + 3aiii +3aiv) |
| 512 | The value in pt.3biv -"Total Long term" in Part B TI should be equal to total of pt. (3bia+3bib+3bii+3biii) |
| 513 | In Schedule Part BTI, the amount of "Total Capital Gains" should be equal to the sum of "Short Term and Long Term Capital Gains". |
| 514 | "Total Income from other sources" at Schedule B TI is different with the sum of "Individual incomes from Other Sources head". |
| 515 | The Total value of all heads of income should be equal to sum of individual heads of income. |
| 516 | Tax Payments claimed in "Part B-TTI" should be equal to claims made in Schedule TDS/TCS/Schedule IT. |
| 517 | Schedule Salary is mandatory to fill if Income claimed under the head Salaries in Part B-TI. |
| 518 | Schedule HP is mandatory to fill if Income claimed under the head House Property in Part B TI. |
| 519 | Income claimed in STCG chargeable @15%, "Table E in Schedule CG" should be filled. |
| 520 | Income claimed in STCG chargeable @30%, then "Table E in Schedule CG" should be filled. |
| 521 | Income claimed in STCG is chargeable at applicable rate, then "Table E in Schedule CG" should be filled |
| 522 | Income claimed under the head Short-term chargeable at special rates in India as per DTAA in Part B TI, should be consistent with the amount mentioned in Schedule CG |
| 523 | Income claimed in LTCG chargeable @10%, then "Table E in Schedule CG" should be filled |
| 524 | Income claimed in LTCG chargeable @20%, then "Table E in Schedule CG" should be filled |
| 525 | Income claimed under the head Long term chargeable at special rates in India as per DTAA in Part B TI, should be consistent with the amount mentioned in Schedule CG |
| 526 | "Income from sources other than from owning Race Horses & Income chargeable at special rate" is claimed at Schedule Part B TI, then Sch OS should be filled. |
| 527 | "Income chargeable to tax at special rate" is claimed at Schedule Part B TI, then “Schedule OS" should be filled |
| 528 | "Income from the activity of owning and maintaining race horses" is claimed at Schedule Part B TI, then "Schedule OS" should be filled |
| 529 | "Losses of the current year set off against income from all the heads" should be equal to "Total losses set off" at Schedule CYLA. |
| 530 | Brought forward losses set off against Balance Income should be equal to "Total of brought forward losses set off" at Schedule BFLA. |
| 531 | Gross Total Income should be equal to the sum of the Incomes individually offered. |
| 532 | "Total Income" should be equal to "Gross Total Income minus Chapter VI-A deductions after considering rounding-off". |
| 533 | If deductions claimed at "Part B TI", then "Schedule VI-A" should be filled. |
| 534 | In "Schedule Part B-TI" Net agricultural income/ any other income for rate purpose should be equal to the value entered in Sl. No. 2 of Schedule EI |
| 535 | In "Schedule Part B-TI" in '11' Deductions under Chapter VI-A should be equal to the value entered in "v" of Schedule VIA or (9-10) of PART-BTI, whichever is lower. |
| 536 | In "Schedule Part B-TI", at Sl. No. '7' Balance after set off in the current year losses should be equal to value of Sl. No. 5 - Sl. No. 6 of Schedule Part BTI |
| 537 | In Part BTI, Sl. No. 17 Deemed income under section 115JC should be equal to Sl. No. .3 of Schedule AMT |
| 538 | In "Schedule Part B-TI", Sl. No.'15' Aggregate income should be equal to the sum of 12-13+14 |
| 539 | Taxpayer cannot offer income chargeable at special rates in Schedule Part B-TI without mentioning the same in respective schedules |
| 540 | In schedule Part B-TI, Income offered in Capital gain chargeable @ 30% u/s 115BBH, is not matching with Sl. No. C2 of Sch CG |
| 541 | Amount of "Total Capital Gains" is not equal to sum of Sl. No. 3c 'Sum of Short- term/Long-term capital gains' & 3d 'Capital gain chargeable @ 30% u/s 115BBH'. |
| 542 | HUF cannot claim relief u/s 89 |
| 543 | In "Schedule Part B-TTI" Tax payable on deemed total income under section 115JC should be equal to the 4 of schedule AMT. |
| 544 | In Schedule Part BTTI, Credit under section 115JD of tax paid in earlier years should be equal to Sl. No. 5 of Schedule AMTC. |
| 545 | If Old Tax regime is selected, In Part B TTI Sl. No. 1a should be equal to sl. No. 4 of Schedule AMT |
| 546 | In "Schedule Part B TTI" 15d Self-Assessment Tax should be equal to the sum of total Tax Paid in schedule IT where date of deposit is after 31/03/2025 for A.Y 2025-26. |
| 547 | In "Schedule Part B TTI" point 15a "Advance Tax" paid should be equal to the sum of total Tax Paid in schedule IT where date of deposit is between 01/04/2024 and 31/03/2025. |
| 548 | If old tax regime is selected, then In Schedule Part BTTI, SL.no 1d Total tax payable on deemed total income (1a+1b+1c) should be equal to sum of Sl.no. 1a+1b+1c |
| 549 | "Tax Payable on Total Income" should be equal to Normal Tax plus Special Tax minus Rebate on Agricultural Income. |
| 550 | The amount at "Tax payable" should be equal to the amount of Tax Payable on Total Income minus Rebate u/s 87A. |
| 551 | The amount at "Gross tax liability" should be equal to the sum of (Tax Payable, Surcharge & Education Cess) |
| 552 | "Relief claimed under section 90/90A in Part B TTI" should be equal to "Amount entered in Schedule TR" |
| 553 | "Relief claimed under section 91 in Part B TTI" should be equal to "Amount entered in Schedule TR" |
| 554 | "Total Tax Relief" should be equal to the sum of (Relief u/s 89, Relief u/s 90/90A and Relief u/s 91). |
| 555 | "Total Interest and Fee Payable" should be equal to "Interest u/s 234A + 234B + 234C+ Fee payable u/s 234F" |
| 556 | "Aggregate liability" should be equal to the sum of "Net tax liability plus Total Interest Payable" |
| 557 | "Total Taxes Paid" should be equal to the sum of "Advance Tax, TDS, TCS & Self- Assessment Tax" |
| 558 | IFSC under "Bank Details" should match with the RBI database |
| 559 | Rebate u/s 87A is not allowed to Non-resident. |
| 560 | Rebate u/s 87A is not allowed to HUF. |
| 561 | If old tax regime is selected & sl. no. 12 of part B-TI (i.e. total income) is more than Rs. 5 lakhs, then Rebate u/s 87A cannot be claimed by Resident or Resident but not Ordinarily Resident Individual. |
| 562 | Refund claimed should match with the difference of “Total Taxes Paid” and “Total Tax and Interest payable”. |
| 563 | Tax payable Amount should match with the difference of “Total Tax and “Interest payable” and “Total Taxes Paid”. |
| 564 | "Income details" and "Tax computation" should be disclosed where details regarding “Taxes Paid” have been disclosed. |
| 565 | In "Schedule Part B-TTI", Gross tax payable should be higher of Total Tax Payable on deemed total income or Gross tax liability. |
| 566 | In Schedule Part BTTI, Sl. No. 10 Tax payable after credit u/s 115JD should be equal to sum of Sl. No. 8a + 8c – 9 |
| 567 | In Schedule Part BTTI, Sl. No. 12 Net tax liability should be equal to Sl. No. 10-11e |
| 568 | Relief u/s 89 cannot be claimed by taxpayer if details of salary are "zero"/ "blank" |
| 569 | If new tax regime is selected, In Schedule Part B TTI, Sl. No. 1a to 1d should not be more than zero. |
| 570 | In Schedule Part B TTI, Sl. No. 8a + 8b should be equal to Sl.No.8. |
| 571 | In Sl. No 8c, figure is not equal to Col 7 of Schedule Tax Deferred on ESOP |
| 572 | Since your status is HUF, remove all the field filed in Schedule Tax Deferred on ESOP |
| 573 | Deduction u/s 80GGC can be claimed for the Contributions made between period 01.04.2024 to 31.03.2025 for AY 2025-26. |
| 574 | HUF can claim deductions u/s 80DD for dependent being "Member of HUF" |
| 575 | If the property is co-owned, the percentage share of property and Name & PAN of co- owner(s) is mandatory. |
| 576 | Option out of opting in for new tax regime is not available after due date of filing of return as mentioned u/s 139(1) |
| 577 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- STCG 15%. |
| 578 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- STCG 20%. |
| 579 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- STCG 30%. |
| 580 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- STCG Applicable rates%. |
| 581 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- STCG DTAA rates. |
| 582 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- LTCG 10%. |
| 583 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- LTCG 12.5%. |
| 584 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- LTCG 20%. |
| 585 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the income available for set off- LTCG DTAA Rates. |
| 586 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- STCL15%. |
| 587 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- STCL20%. |
| 588 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- STCL30%. |
| 589 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- STCL Applicable rate%. |
| 590 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- STCL_DTAA Rates |
| 591 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- LTCL 10% |
| 592 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- LTCL 12.5% |
| 593 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- LTCL 20% |
| 594 | In Table E of Schedule CG, Sum of amount of set off claimed cannot exceed the losses available for set off- LTCL _DTAA Rates |
| 595 | In Table E of Schedule CG, Column 11 of each row should be equal to 1- (2+3+4+5+6+7+8+9+10) |
| 596 | In Table E of Schedule CG, Row (xii) 'Loss remaining after set off' should be equal to (i - xi) |
| 597 | In Schedule Part B-TI, Income disclosed in Short term chargeable @20% should be equal to Sl.no. 11iii of Table E in Schedule CG. |
| 598 | In Schedule Part B-TI, Income disclosed in Long term chargeable @12.5% should be equal to Sl.no. 11viii of Table E in Schedule CG. |
| 599 | In Schedule CYLA, Short term capital gain @20% should be equal to Sl. No. 11iii of item E of Schedule CG |
| 600 | In Schedule CYLA, Long term capital gain taxable @10% should be equal to Sl. No. 11viii of item E of Schedule CG |
| 601 | In Schedule CG, the beneficial rate of LTCG on sale of land or building or both is applicable only if the acquisition is before 23 July 2024 and transfer is on or after 23 July 2024 |
| 602 | Indexation should not be allowed if the asset is transferred On or after 23 July 2024 in case of Non Residents. |
| 603 | In schedule CG, value at B1eii should be B1eiA- B1eiB, if eiA>eiB, else 0 if purchase was before 23rd July 2024 and date of sale is on after 23rd July. In other cases, it should be "0" |
| 604 | In Schedule CG, tax on LTCG from sale of land or building or both should be 20% in case of transfer is before 23 July for both Residents and Non Residents (also for Residents after 23rd July 2024 for purpose of second proviso to Sec 112(1)(a)) and 12.5% in case of transfer on or after 23 July 2024 for Non Residents |
| 605 | In Schedule CG, Long Term Capital Gains from listed securities referred in proviso to 112(1) and GDR of Indian company before 23 July 2024 and on or after 23 July 2024 should be equal to the total Long Term Capital Gains from such assets |
| 606 | In schedule CG, value at B3iie should be equal to B3iiei+B3iieii |
| 607 | In Schedule CG, value of capital gains u/s 112A (where transfer is before 23 July 2024) should be equal to the corresponding amount mentioned for the same in Schedule 112A |
| 608 | In Schedule CG, value of capital gains u/s 112A (where transfer is on or after 23 July 2024) should be equal to the corresponding amount mentioned for the same in Schedule 112A |
| 609 | In Schedule CG, Long Term Capital Gains from sale of shares or debentures of Indian Company in hands of Non residents before 23rd July 2024 (for listed debentures and other than listed debentures) and on or after 23rd July 2024(only listed shares and debentures) should be equal to the total LTCG from such shares or debentures |
| 610 | In schedule CG, value at sl.no. B5c should be same as B5ci+B5cii+B5ciii |
| 611 | In schedule CG, value at B6e should be equal to B6ei+B6eii+B6eiii |
| 612 | In Schedule CG, value of capital gains u/s 115AD(1)(b)(iii) proviso (where transfer is before 23 July 2024) should be equal to the corresponding amount mentioned for the same in Schedule 115AD(1)(b)(iii) proviso |
| 613 | In Schedule CG, value of capital gains u/s 115AD(1)(b)(iii) proviso (where transfer is on or after 23 July 2024) should be equal to the corresponding amount mentioned for the same in Schedule 115AD(1)(b)(iii) proviso |
| 614 | In schedule CG, value at sl.no. B8a should be same as B8ai+B8aii |
| 615 | In schedule CG, value at sl.no. B8c should be same as B8ci+B8cii |
| 616 | In schedule CG, value at sl.no. B8b should be same as B8bi+B8bii |
| 617 | In schedule CG, value at B9e should be equal to B9ei+B9eii |
| 618 | In Schedule CG, if any unutilized amount in Capital Gains Deposit Scheme is withdrawn then, whether date of limitation / withdrawal was before 23rd July 2024 should be mentioned |
| 619 | In schedule CG, value at sl.no. B10b should be same as B10bi+B10bii |
| 620 | In schedule CG, value at B10(i) should be equal to "B10bi + sum of B10a where date of limitation / withdrawal was before 23rd July 2024" |
| 621 | In schedule CG, value at B10(ii) is not equal to "B10bii + sum of B10a where date of limitation / withdrawal was on or after 23rd July 2024" |
| 622 | Value at field Ei3 should be equal to the sum of sl. no (A2e(ii)+ A3a(ii)+ A7a(ii)+A(A) @20%) |
| 623 | Value at field Eiii should be equal to the sum of sl. no A2e(ii)+ A3a(ii)+ A7a(ii)+A(A) @20% |
| 624 | Value at field Ei8 should be equal to the sum of sl. no (B1gb+ B3(i)eii+B3(ii)eii+ B4cii+ B5ciii +B6eii + B7cii +B8cii+ B9eii+ B10ii+ B11a1 (ii)+ B11a2(ii) + B(A)12.5%) |
| 625 | Value at field Eviii should be equal to the sum of sl. no (B1gb+ B3(i)eii+B3(ii)eii+ B4cii+ B5ciii +B6eii + B7cii +B8cii+ B9eii+ B10ii+ B11a1 (ii)+ B11a2(ii) + B(A)12.5%) |
| 626 | In schedule CG at table F total of all the quarter of field "Short term capital gains taxable @ 20% rates" should match with field 3(iiib) of schedule BFLA "Short-term capital gain taxable 20%" (Not applicable for Resident Senior Citizens) |
| 627 | In schedule CG at table F total of all the quarter of field "Long term capital gains taxable @ 12.5% rates" should match with field 3(viib) of schedule BFLA "Long-term capital gain taxable @12.5%" (Not applicable for Resident Senior Citizens) |
| 628 | In Schedule BFLA, Sl. No. 1iiib should be equal to Sl.No.4ivb of schedule CYLA |
| 629 | In Schedule BFLA, Sl. No. 1viib should be equal to Sl. No. 4viiib of schedule CYLA |
| 630 | Sum of income u/s 111A or section 115AD(1)(b)(ii)- Proviso (STCG on shares/equity- oriented MF on which STT paid) & Pass Through Income in the nature of Short-Term Capital Gain chargeable @ 20% in schedule SI should be equal to corresponding income as per schedule BFLA |
| 631 | In schedule CG, Sl. No. B1ca of LTCG Balance should be equal to B1(aiii-biva) |
| 632 | In schedule CG, Sl. No. B1ea of LTCG Balance should be equal to B1(ca - d) |
| 633 | Sum of capital gains from all properties where date of transfer was before 23rd July 2024 and where date of transfer was on or after 23rd July 2024 should be correctly reflected at B1g(a) and B1g(b) respectively |
| 634 | In Schedule CG, B4a should be equal to sum of B4ai + B4aii. |
| 635 | In Schedule CG, B4b should be equal to sum of B4bi + B4bii. |
| 636 | In Schedule CG, B5b should be equal to sum of B5bi + B4bii+B5biii. |
| 637 | In Schedule CG, B7a should be equal to sum of B7ai + B7aii. |
| 638 | In Schedule CG, B7b should be equal to sum of B7bi + B7bii. |
| 639 | In Schedule CG, B7c should be equal to sum of B7ci + B7cii. |
| 640 | Sum of income u/s 112(1) (LTCG on listed securities/ units without indexation),112(1)(c)(iii) (LTCG for non-resident on unlisted securities), 115AC (LTCG for non-resident on bonds/GDR), 115ACA (LTCG for an employee of specified company on GDR), 115E (LTCG for non-resident Indian on specified asset), 112 (LTCG on others), 112A or section 115AD(1)(iii)-Proviso (LTCG on sale of shares or units on which STT is paid), Pass Through Income in the nature of Long Term Capital Gain chargeable @ 12.5%-u/s 112A, Pass Through Income in the nature of Long Term Capital Gain chargeable @ 12.5% - u/s other than 112A should be equal to corresponding income as per schedule BFLA. |
| 641 | In Schedule CYLA Income from other sources taxable at special rates in India as per DTAA should be equal to SL.no. 2f of Schedule OS |
| 642 | In schedule BFLA 1(xii) "Income from other sources taxable at special rates in India as per DTAA" should match with 4(xiii) of schedule CYLA |
| 643 | In Schedule OS, quarterly break up of Dividend Income at 3b should be equal to "Dividend Income referred in Sl. No. 1a(iii)-DTAA of Dividend. " In Schedule OS |
| 644 | In schedule 112A, Value at field "Total of Col 14 where transfer was before 23rd July 2024 " is not matching with sum of individual fields of col 14 where dropdown is selected as "Before 23rd July 2024 " in 1b |
| 645 | In schedule 115AD, Value at field "Total of Col 14 where transfer was before 23rd July 2024 " is not matching with sum of individual fields of col 14 where dropdown is selected as "Before 23rd July 2024 " in 1b |
| 646 | Value at field A(A) should be equal to sum of values of drop downs 20% or 30% or applicable rate |
| 647 | Value at field B(A) should be equal to sum of values of drop down 12.5% or 10% |
| 648 | In Schedule CG, Table D, Sl. No. 1aiv,1biv and 1div are more than zero but details of iva, ivb and ivc are blank |
| 649 | In Schedule CG, Long Term Capital Gains from sale of Land or building or both before 23 July 2024 and on or after 23 July 2024 should be equal to the total Long Term Capital Gains from sale of Land or building or both |
| 650 | In schedule CG, in Table D, Deduction u/s 54EC of LTCG, amount invested should not be more than 50L |
| 651 | Sl.no.2 of Schedule 80D is not applicable for HUF |
| 652 | In schedule CG, Sl. No. B2 of LTCG, Total deduction u/s 54 should be equal to sum of deduction mentioned. |
| 653 | Sum of Improve cost in each L&B block should be equal to sum of all improve costs for such block of land and building in schedule CG under Long term capital gain |
| 654 | Sum of Indexed Improve cost in each L&B block should be equal to sum of all Indexed improve costs for such block of land and building in schedule CG under Long term capital gain |
| 655 | If New tax regime is selected, In schedule Salary, Standard deduction shall not be allowed more than the lower of Rs. 75,000 or Net Salary |
| 656 | In Schedule CG, if sl.no.6 in sl.no.B. in LTCG is being filled, then its mandatory to select the section code i.e., 115AD/112(1)(c ) or 115AC |
| 657 | Under New Tax Regime, deduction u/s 80CCD(2) should not exceed 14% of basic salary and dearness allowance |
| 658 | Please choose the same tax regime that the taxpayer selected in the return for which the response to the defective notice is being filed. |
| 659 | Kindly fill in the details of dividend in Sl. No. 1a(iii) of schedule OS if buy back loss is claimed in schedule CG |
| 660 | In schedule CG, Sl. No. B3i biva of LTCG Total should be equal to sum of B3i(bia+biia+biiia) |
| 661 | In schedule CG, Sl. No. B3 biv of LTCG Total should be equal to sum of B3(bi+bii+biii) |
| 662 | In schedule CG, Sl. No. B3(i)(ca) of LTCG Balance should be equal to B(3a-biva) |
| 663 | In Schedule CG Sl.no. B3(i)ea of LTCG should be the difference of B(3ca-3d) |
| 664 | In Schedule CG Sl.no. B3(i)e of LTCG should be equal to the sum of B3iei and B3ieii. |
| 665 | In Schedule CG, tax on LTCG from sale listed securities (other than a unit) or zero coupon bonds should be 20% in case of transfer is before 23 July. |
| 666 | In Schedule CG, tax on LTCG from sale listed securities (other than a unit) or zero coupon bonds as per 1st Proviso to section 112(1) should be 10% in case of transfer is before 23 July. |
| 667 | In schedule CG, value at B3ih should be [B3(f) – B3(g)] if transfer was before 23rd July 2024 |
| 668 | In schedule CG,sl. No 2(i) of Table F Short-term capital gains taxable at the rate of 20% should not be more than zero |
| 669 | In schedule CG,sl. No 7(i) of Table F Long- term capital gains taxable at the rate of 12.5% should not be more than zero |
| 670 | In Schedule Salary, Nature of Exempt allowance can be selected as "Exempt income received by a judge covered under the payment of salaries to Supreme Court/High Court judges Act /Rules" only if nature of Employer is CG/SG |
| 671 | HRA u/s 10(13A) shall not be more than Actual rent paid after deducting 10% of basic salary and DA |
| 672 | HRA u/s 10(13A) shall not be more than 50% of basic salary and DA |
| 673 | In Table 10(13A) of schedule salary, the lowest of the following amounts shall be claimed as HRA exemption: A) Actual HRA received B) Actual rent paid- 10% of (salary+DA) C) 40% or 50% of (salary+DA) |
| 674 | "Table 10(13A) of schedule salary" needs to be filled for claiming exempt allowance u/s 10(13A) |
| 675 | Sum of Basic salary, dearness allowance as per Table 10(13A) of schedule salary and actual HRA received shall not be more than salary as per section 17(1) under Income details |
| 676 | In schedule House property, value of "Interest payable on borrowed capital" should be same as the "Total Interest on Borrowed capital u/s 24(b)" as per schedule 24(b) |
| 677 | In Table 24(b) of Schedule HP, the sum of individual rows for "Interest on Borrowed capital u/s 24(b)" shall match with the "Total Interest on borrowed capital u/s 24(b)" as per Table 24(b) |
| 678 | Interest on borrowed capital can’t be claimed in case of Self occupied house property under new tax regime |
| 679 | Details of loan taken need to be provided for claiming Interest on borrowed capital u/s 24(b) in Table 24(b) of Schedule HP |
| 680 | Name of the Insurer and Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 1a (i) |
| 681 | Name of the Insurer and Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 1b (i) |
| 682 | Name of the Insurer and Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 2a (i) |
| 683 | Name of the Insurer and Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 2b (i) |
| 684 | In schedule 80D, breakup of individual rows for "Health Insurance amount" shall match with the health insurance premium entered by the user under "Health insurance" at sl.no.1a |
| 685 | In schedule 80D, breakup of individual rows for "Health Insurance amount" shall match with the health insurance premium entered by the user under "Health insurance" at sl.no.1b |
| 686 | In schedule 80D, breakup of individual rows for "Health Insurance amount" shall match with the health insurance premium entered by the user under "Health insurance" at sl.no.2a |
| 687 | In schedule 80D, breakup of individual rows for "Health Insurance amount" shall match with the health insurance premium entered by the user under "Health insurance" at sl.no.2b |
| 688 | Form 10IA needs to be filed separately for claiming Deduction u/s 80U and 80DD respectively. |
| 689 | Deduction u/s 80EE / 80EEA can be claimed when the limit u/s 24(b) is exhausted. |
| 690 | As the deduction u/s 80EE can be claimed over and above deduction u/s 24(b), details of loan taken in schedule 80EE should be part of the details disclosed in Table 24(b) of Schedule HP |
| 691 | As the deduction u/s 80EEA can be claimed over and above deduction u/s 24(b), details of loan taken in schedule 80EEA should be part of the details disclosed in Table 24(b) of Schedule HP |
| 692 | Details of loan need to be provided for claiming deduction u/s 80E in schedule 80E |
| 693 | Details of loan need to be provided for claiming deduction u/s 80EE in schedule 80EE |
| 694 | Deduction u/s 80EE can be claimed only if maximum loan taken does not exceed Rs. 35 lakhs against the property |
| 695 | "Details of Bank from which loan is taken" needs to be provided for claiming deduction u/s 80EEA in schedule 80EEA |
| 696 | Deduction u/s 80EEA can be claimed only on the residential house property having stamp value upto Rs.45 Lakhs |
| 697 | The Date of sanction of loan under schedule 80EEA shall be between 01.04.2019 and 31.03.2022 |
| 698 | Details of loan need to be provided for claiming deduction u/s 80EEB in schedule 80EEB |
| 699 | The Date of sanction of loan under schedule 80EEB shall be between 01.04.2019 and 31.03.2023 |
| 700 | Deduction u/s 80E in schedule VIA should match with the "Total Interest u/s 80E" as per schedule 80E |
| 701 | Deduction u/s 80EE in schedule VIA should match with the "Total Interest u/s 80EE" as per schedule 80EE |
| 702 | Deduction u/s 80EEA in schedule VIA should match with the "Total Interest u/s 80EEA" as per schedule 80EEA |
| 703 | Deduction u/s 80EEB in schedule VIA should match with the "Total Interest u/s 80EEB" as per schedule 80EEB |
| 704 | In schedule 80E the sum of individual rows for "Interest u/s 80E" shall match with the "Total Interest u/s 80E" as per the schedule 80E |
| 705 | In schedule 80EE the sum of individual rows for "Interest u/s 80EE" shall match with the "Total Interest u/s 80EE" as per the schedule 80EE |
| 706 | In schedule 80EEA the sum of individual rows for "Interest u/s 80EEA" shall match with the "Interest u/s 80EEA" as per the schedule 80EEA |
| 707 | In schedule 80EEB the sum of individual rows for "Interest u/s 80EEB" shall match with the "Total Interest u/s 80EEB" as per the schedule 80EEB |
| 708 | The Date of sanction of loan in schedule 80EE shall be between 01.04.2016 and 31.03.2017 |
| 709 | Assessee having status as HUF is not eligible to fill any schedule out of 80E Schedule, 80EE Schedule, 80EEA Schedule or 80EEB Schedule for claiming respective deduction |
| 710 | Assessee having status as Individual and opting new tax regime have filled any of the schedules amongst 80C schedule, 80E schedule, 80EE schedule, 80EEA schedule, 80EEB schedule or Table 10(13A) |
| 711 | Details such as Amount eligible for deduction u/s 80C, Policy number or Document Identification number are required to provide in schedule 80C to claim deduction |
| 712 | Deduction u/s 80C claimed under chapter VIA should be same as the "Total Deduction u/s 80C" |
| 713 | In schedule 80C the sum of individual rows for "Amount eligible for deduction u/s 80C" shall match with the "Total Deduction u/s 80C" as per the schedule 80C |
| 714 | PRAN should be provided in schedule VIA to claim deduction u/s 80CCD(1) or 80CCD(1B) |
| 715 | Details of Form 10BA are required to provide to claim deduction u/s 80GG |
| 716 | Details of specified disease are required to be provided to claim deduction u/s 80DDB |
| 717 | Acknowledgement Number of Form 10CCD should be provided in schedule VIA to claim deduction u/s 80QQB |
| 718 | Acknowledgement Number of Form 10CCE should be provided in schedule VIA to claim deduction u/s 80RRB |
| 719 | Section 192 applicable to Tax deducted on salary income is selected as the dropdown under schedule TDS 2, or TDS 3 which are for details of TDS on other than salary income. |
| 720 | In AY 25, In Schedule OS, Dividend u/s 2(22)(f) cannot be entered in Q1 & Q2 |
| 721 | In AY 25, In Schedule CG, STCG @15% cannot be entered in Q3, Q4 or Q5. |
| 722 | Exempt Allowance u/s 10(13A) in schedule Salary should match with the "Eligible allowance u/s 10(13A)" as per Table 10(13A) of Schedule Salary |
| 723 | The date of Birth/ Formation should be before 01/04/20XX of AY for which ITR is being filled. |
| 724 | In Schedule HP, Details of Interest on borrowed capital u/s 24(b) is mandatory to claim the deduction. |

---

## Category B/D:

### Table 3: Category B/D Rule

| Sl. No | Scenarios |
|---|---|
| 1 | Form 29C- Report under section 115JC of the Income-tax Act, 1961 is mandatory to file if AMT tax is more than Normal Tax. |
| 2 | Total income under section 115JC as per schedule AMT is less than or equal to Rs. 5000000 and surcharge is entered in Schedule B-TTI. |
| 3 | If the assessee is claiming relief u/s 90 & 91 then it is mandatory to file form 67 |
| 4 | If assessee is shown income under section 115BBF then furnishing of Form 3CFA is mandatory within due time |
| 5 | Form 10E is required to be filed to claim Relief u/s 89. |
| 6 | Form 10BA is required to be filed to claim deduction u/s 80GG. |
| 7 | Deduction u/s 80QQB cannot be claimed if return is not filed within the due date or extended due Date |
| 8 | Deduction u/s 80RRB cannot be claimed if return is not filed within the due date or extended due Date |
| 9 | In Schedule CYLA, income is available for setoff of losses, but house property loss is not fully setoff. The losses not applied to be set off cannot be carried forward as there is income available. |
| 10 | In Schedule CYLA, the whole OS loss should be set off against any head of income in case the income is more than loss. The losses not applied to be set off cannot be carried forward as there is income available. |
| 11 | In schedule 80U, if deduction is > 0, then details of such donation are required |
| 12 | In schedule 80DD, if deduction is > 0, then details of such disability form are required. |
| 13 | For Resident taxpayers, DTAA benefit is not available in rate of taxation, and the claim may not be allowed. Please re-check the claims made. Residents may claim DTAA benefit under Schedule TR and FSI |
| 14 | TDS credited in hands of other person will be allowed to taxpayer only if that other person declares the same in schedule TDS of their ITR |
| 15 | TCS credited in the hands of other person will be allowed to taxpayer only if that other person declares the same in schedule TCS of their ITR |
| 16 | In Schedule CG, Table E, the entire loss should be set off with gains available for set off. |
| 17 | TDS section code such as 194Q,194C,194R or 194M is selected under Schedule "TDS2 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted" |
| 18 | TDS section code such as 194Q, 194C, 194R or 194M is selected under Schedule "TDS3 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted" |
| 19 | TDS made under the section quoted that income in the nature of VDA (Virtual Digital Assets) is derived by you in FY concerned. Must however it is seen from the content of return that income correspondent to VDA is either not offered to tax or is not offered to tax completely. |
| 20 | TDS made under the section quoted that income in the nature of Winnings from lotteries, crossword puzzles, races, card games etc. chargeable u/s 115BB is derived by you in FY concerned. Must however it is seen from the content of return that income correspondent to Winnings from lotteries, crossword puzzles, races, card games etc. chargeable u/s 115BB is either not offered to tax or is not offered to tax completely. |
| 21 | TDS made under the section quoted that income in the nature of the activity of owning and maintaining race horses is derived by you in FY concerned. Must however it is seen from the content of return that income correspondent to activity of owning and maintaining race horses is either not offered to tax or is not offered to tax completely. |
| 22 | TDS made under the section quoted that income in the nature of Winnings from Online games chargeable u/s 115BBJ is derived by you in FY concerned. Must however it is seen from the content of return that income correspondent to Winnings from Online Games chargeable u/s 115BBJ is either not offered to tax or is not offered to tax completely. |
| 23 | For Resident taxpayers, DTAA benefit is not available, and the claim may not be allowed. Please re-check the claims made. |

