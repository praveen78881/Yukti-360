> Source: CBDT_e-Filing_ITR 1_Validation Rules_AY 2026-27.pdf · 22 pages · transcribed verbatim

*Transcription note: the source PDF's text layer renders certain dash characters (used in "New Delhi — 110055", section-reference dashes, etc.) as an encoding-corrupted replacement character. These are reproduced below as an em dash (—) based on context; no wording was altered.*

---

Central Board of Direct Taxes,e-Filing Project

# ITR 1 — Validation Rules for AY 2026-27

Version 1.0

15th May 2026

Directorate of Income Tax (Systems)E-2,
A.R.A. Centre, Ground Floor,
Jhandewalan Extension
New Delhi — 110055

*(Page 2)*

## Contents

Purpose.............................................................................................................................................................4
1 Validation Rules .........................................................................................................................................4
&nbsp;&nbsp;&nbsp;&nbsp;1.1 Category A: ...................................................................................................................................5
&nbsp;&nbsp;&nbsp;&nbsp;1.2 Category B:.................................................................................................................................22
&nbsp;&nbsp;&nbsp;&nbsp;1.3 Category D:.................................................................................................................................22

*(Page 3)*

## List of Tables

Table 1: List of Category of Defect ........................................................................... 4
Table 2: Category A Rules ....................................................................................... 5
Table 3: Category B Rules......................................................................................22
Table 4: Category D Rules..................................................................................22

*(Page 4)*

## Purpose

The Income Tax Department has provided free return preparation software in downloads page which are fully compliant with data quality requirements. However, there are certain commercially available software or websites that offer return preparation facilities as well.In order to ensure the data quality of ITRs prepared through such commercially available software, various types of validation rules are being deployed in the e-Filing portal, so thatthe data which is being uploaded are accurate and compliant to the validation rules to a large extent. The taxpayers are advised to review these validation rules to ensure that the software used by them is compliant with these requirements, to avoid rejection of return due to poor data quality or mistakes in the return.

The software providers are strictly advised to adhere to these rules to avoid inconvenienceto the taxpayers, who may use their software. Software providers may please note that these validation rules will be strictly monitored and enforced, and each rule will have to be complied strictly. In case of violations, the concerned return preparation utility/ software is liable to be blacklisted without any notice, and such blacklisting will be publishedon the e-filing website. No return using blacklisted software will be permitted to be uploaded till the time the software provider is able to provide details of correction in software. This may cause avoidable inconvenience to the taxpayers and loss of reputationto software providers for which the Income Tax Department will not be responsible.

Note- If taxpayer is opting for old tax regime, the return should be filed within due date.

## 1 Validation Rules

The validation process at e-Filing/CPC end is to be carried out in ITR1 for each defect as categorized below:

### Table 1: List of Category of Defect

| Category of defect | Action to be Taken |
|---|---|
| A | Return will not be allowed to be uploaded. Error message will be displayed. |
| B | Return data will be allowed to be uploaded but the taxpayer uploading the return will be informed of a possible defect present in the return u/s 139(9). Appropriate notices/ communications will be issued from CPC. |
| D | Return data will be allowed to be uploaded but the taxpayer uploading the return will be informed of a possibility of some of the deduction or claim not to be allowed or entertained unless the return is accompanied by the respective claim forms or particulars. |

*(Page 5)*

## 1.1 Category A:

### Table 2: Category A Rules

Columns as printed: **Sl no.** | **Publishing Document**

1. If Old Tax Regime is selected and Sum of deductions claimed u/s 80C, 80CCC & 80CCD (1) cannot be more than Rs. 1,50,000.
2. If Old Tax is selected and employer category is "CG-Pensioners" "SG-Pensioners" "PSU-Pensioners" "Other Pensioners" or Not Applicable, then Deduction u/s 80CCD (1) should not be more than 20% of Gross total Income
3. If Old Tax is selected and If the employer category is other than "CG-Pensioners" "SG-Pensioners" "PSU-Pensioners" "Other Pensioners" or Not applicable, then Maximum amount that can be claimed for u/s 80CCD (1) is 10% of Salary
4. Deduction u/s 80CCD (2) should not be more than 10% of salary by an employer other than Central Government or State Government in case of Old tax regime.
5. If Old tax Regime is selected, and 80DDB - Resident assessee has claimed more than the maximum limit of Rs.1,00,000/-',
6. If Old tax Regime is selected and Assessee is claiming deduction under section 80DDB, but eligible category description not provided
7. If Old tax Regime is selected, then Maximum amount that can be claimed for category "Self or Dependent" u/s 80DDB is Rs. 40,000
8. If Old tax Regime is selected and Deduction u/s 80G claimed but details are not provided in Schedule 80G
9. If Old tax Regime is selected, then In Schedule 80G, in Table F, Donation should be equal to sum of donation entitled for 100% deduction without qualifying limit + donation entitled for 50% without qualifying limit +donation entitled for 100% deduction subject to qualifying limit + donation entitled for 50% subject to qualifying limit
10. If Old tax Regime is selected, then In Schedule VIA, deduction claimed u/s 80G is more than the eligible amount of donation mentioned in Schedule 80G
11. If Old tax Regime is selected, then Assessee can claim deduction under section 80TTA to the maximum limit of Rs.10,000/-
12. If Old tax Regime is selected, then Deduction u/s 80TTA is restricted to the savings account interest income from other sources.
13. Deduction u/s 80TTA cannot be claimed by Senior Citizen (date of birth is on or Before 01.04.1966
14. If Old tax Regime is selected, then Assessee can claim deduction under section 80TTB to the maximum limit of Rs.50,000/-
15. Assessee being less than 60 years of age cannot claim deduction under section 80TTB (date of birth is before 02.04.1966)
16. If Old tax Regime is selected, and Assessee being senior citizen and claiming deduction under section 80TTB on other than interest income from other source
17. Total of chapter VI-A deductions should match with sum of individual deductions restricted to GTI

*(Page 6)*

18. Deductions claimed under Chapter VI-A is should not be more than "Gross Total Income"
19. ITR-1 -"Name" of taxpayer in ITR does not match with the "Name" as per the PAN data base (This will be verified at the time of upload. To ensure that the name entered is as appearing in the PAN card)
20. In the return filed "Gross Total Income" and all the heads of income is entered should be more than zero if tax liability has been computed and paid
21. "Income details" and "Tax computation" should be disclosed where details regarding "Taxes Paid" have been disclosed.
22. If Old Tax Regime is selected and Gross Total Income is not equal to the Total of Incomes from Salary, House Property & Other Sources & Long-term capital gains as per sec 112A.
23. If Old tax Regime is selected, Rebate u/s 87A is claimed by Resident Individual having Total income including LTCG 7a(iii) u/s 112A of more than Rs. 5,00,000
24. Total income should be the difference between "Gross total income" and "Total deductions" OR Zero if the gross total income minus deduction is negative
25. The amount of "Tax after Rebate " should be equal to "Tax payable on total income" Minus "Rebate u/s 87A"
26. The amount at "Total tax and Cess" should be equal to sum of "Tax after Rebate" and "Heath & Education Cess
27. "Total Tax, Fees & Interest" should be equal to the sum of"Total Tax & Cess + Interest u/s 234A + 234B+ 234C + Fees u/s 234-I + 234F- Relief u/s 89"
28. In "Schedule Income Details" Total Interest, Fee Payable should be equal to the sum of Interest u/s 234 A+ Interest u/s 234 B+ Interest u/s 234 C+ Fee u/s 234F + Fees u/s 234-I
29. Agriculture Income shown as exempt cannot be more than Rs 5000/-
30. In "schedule "Income Details" Exempt income should be equal to sum of amount entered in individual col. Of exempt income.
31. Sec 10(10BC)-Any amount from the Central/State Govt./local authority by way of compensation on account of any disaster drop-down cannot be selected more than one time under Exempt Income.
32. Sec 10(10D)- Any sum received under a life insurance policy, including the sum allocated by way of bonus on such policy except sum as mentioned in sub-clause (a) to (d) of Sec.10(10D)" drop-down cannot be selected more than one time under Exempt Income.
33. Sec 10(11)-Statutory Provident Fund received drop-down cannot be selected more than one time under Exempt Income.
34. Sec 10(12)-Recognized Provident Fund received drop-down cannot be selected more than one time under Exempt Income.
35. Sec 10(13)-Approved superannuation fund received drop-down cannot be selected more than one time under Exempt Income.
36. Sec 10(16)-Scholarships granted to meet the cost of education drop-down cannot be selected more than one time under Exempt Income.
37. If Old Tax Regime is selected; then Sec 10(17)-Allowance MP/MLA/MLC drop-down cannot be selected more than one time under Exempt Allowances under salary schedule.
38. Sec 10(18)-Pension received by winner of "PARAM Vir Chakra or "Maha Vir Chakra" or "Vir Chakra" or such other gallantry award" drop-down cannot be selected more than one time under Exempt Income.

*(Page 7)*

39. Defense Medical Disability Pension drop-down cannot be selected more than one time under Exempt Income.
40. Sec 10(19)-Armed Forces Family pension in case of death during operational duty drop-down cannot be selected more than one time under Exempt Income
41. Sec 10(26)-Any income as referred to in section 10(26) drop-down cannot be selected more than one time under Exempt Income. (Message to be shown to the taxpayers while preparing the return that this deduction is available only for certain category of assesses of NE Region and Ladakh)
42. Sec 10(26AAA)-Any income as referred to in section 10(26AAA) drop-down cannot be selected more than one time under Exempt Income. (Message to be shown to the taxpayers while preparing the return that this deduction is available only for certain Sikkimese assessees)
43. Standard deduction allowed on House property should be equal to 30% of Annual value.
44. Gross rent received/ receivable/ lettable value should be more than zero or null where assessee is claiming municipal tax
45. Taxpayer has selected type of property as let-out or deemed let out then Gross rent received/ receivable/ lettable value should be more than zero
46. In Schedule Gross Total Income, Sl.no B2iii. Annual Value should be output of SL.no B2i-B2ii
47. In Schedule Gross total Income, Sl.no B2vii.Income chargeable under the head `House Property' (iii — iv-v + vi) should be equal to sum of B2iii- B2iv-B2v+B2vi or the sum of Individual values under the head of House Property cannot be different from the "Income chargeable under the head House Property".
48. If Old Tax Regime is selected then In Schedule HP, if "Type of House Property" is selected as "Self-Occupied", then the assessee cannot claim interest on borrowed capital more than Rs 2,00,000.
49. In "Schedule Income Details" Tax paid to local authorities shall not be allowed for Type of House Property as "Self-Occupied"
50. "Interest from savings account" drop-down cannot be selected more than one time under Income from other sources
51. "Interest from Deposits (Bank/Post Office/Cooperative Society)" drop-down cannot be selected more than one time under Income from other sources
52. In schedule "Income Details" Income from other sources should be equal to sum of amounts entered in individual col. of income from other sources
53. In "Schedule Income Details" Deduction u/s 57(iia) shall be allowed only if "Family pension" is offered to tax and option 'No' is selected for 'Are you opting for new tax regime u/s 115BAC?
54. In case of "Old Tax Regime"- Deduction u/s 57(iia) cannot be more than lower of 1/3rd of Family pension or Rs. 15,000. Note: Rounding off +1 and -1.
55. Interest from Income Tax Refund drop-down cannot be selected more than one time under Income from other sources.

*(Page 8)*

56. Family pension drop-down cannot be selected more than one time under Income from other sources.
57. If Old Tax Regime is selected, then for Central and State Govt, PSU employees, the Entertainment allowance u/s 16(ii) will be allowed to the extent of Rs 5000 or 1/5th of Salary whichever is lower
58. If Old Tax Regime is selected, then No Entertainment allowance u/s 16(ii) will be allowed to employees other than Central, State Government and PSU
59. Gross salary should be total of salary as per section 17(1) and value of perquisites as per section 17(2) and profits in lieu of salary as per section 17(3)
60. In the Schedule "Gross total Income", 'Net Salary' should be the difference between 'Gross salary' and 'Allowances to the extent exempt u/s 10'
61. In Schedule Gross Total Income, B1 (iv) Deductions u/s 16 should be sum of B1 (iva+ivb+ivc)
62. In Schedule Gross Total Income, Sl.no B1v Income chargeable under Salaries should be (B1iii— B1iv)
63. "Total of all allowances to the extent exempt u/s 10 cannot be more than Gross Salary''
64. If Old Tax Regime is selcted, then Exemption u/Sec 10(5)- Leave Travel concession/assistance cannot be more than respective income in Salary as per section 17(1)
65. Exempt allowance Sec 10(6)-Remuneration received as an official, by whatever name called, of an embassy, high commission etc." cannot be more than Gross Salary
66. Exempt allowance u/s 10(7)-Allowances or perquisites paid or allowed as such outside India by the Government to a citizen of India for rendering service outside India cannot be more than Gross salary
67. Exempt allowance u/s 10(10)-Death-cum-retirement gratuity received cannot be more than Rs. 20,00,000 if nature of employment is Public Sector Undertaking, PSU - Pensioners, others - Pensioners, Others
68. Exempt Allowance u/s Sec 10(10A)-Commuted value of pension received cannot be more than Salary as per sec 17(1)
69. Exempt Allowance u/s 10(10AA)-Earned leave encashment on retirement cannot more than Salary as per sec 17(1) (Message to be shown to the tax payers while preparing the return that maximum deduction for a non- Government employees including PSU employee is only Rs 25 lakh)
70. Exempt Allowance u/s 10(10B)-First Proviso- Compensation limit notified by CG in the Official Gazette cannot exceed Rs.500,000
71. Exempt Allowance u/s 10(10C)-Amount received/receivable on voluntary retirement or termination of service cannot exceed Rs. 5,00,000
72. In exempt allowances only Sec 10(10B) (i) OR Sec 10(10B) (ii) OR Sec 10(10C) can be selected.
73. Exempt Allowance u/s 10(10CC)-Tax paid by employer on non-monetary perquisite cannot be more than Value of perquisites as per section 17(2)
74. If Old Tax Regime is selected, then Exempt Allowance Sec 10(13A)-Allowance to meet expenditure incurred on house rent cannot be more than Salary as per section 17(1)
75. If Old Tax Regime is selected, then Exempt Allowances -Sec 10(14)(i) Prescribed Allowances or benefits (not in a nature of perquisite) specifically granted to meet expenses wholly, necessarily and exclusively and to the extent actually incurred, in performance of duties of office or employment cannot be more than Value of Salary as per section 17(1) at sr. no B1(ia)
76. If Old Tax Regime is selected, then Exempt Allowance -Sec 10(14)(ii) Prescribed Allowances or benefits granted to meet personal expenses in performance of duties of office or employment or to compensate him for increased cost of living cannot be more than Value of Salary as per section 17(1) at sr no (ia)

*(Page 9)*

77. In Schedule "Income Details" allowance to extent exempt u/s 10 should be equal to sum of individual values entered.
78. In Sch 80G Donee PAN should not be same as "Assessee PAN" or "PAN at Verification"
79. In Schedule 80G in table (A) "Donations entitled for 100% deduction without qualifying limit" donation in cash or donation in other mode is to be entered mandatory without which total deduction column should not be entered
80. In Schedule 80G in table (B) "Donations entitled for 50% deduction without qualifying limit" donation in cash or donation in other mode is to be entered mandatory without which total deduction column should not be entered
81. In Schedule 80G in table (c) "Donations entitled for 100% deduction Subject to Qualifying Limit" Donation in cash or Donation in other mode is to be entered mandatory without which total deduction column should not be entered
82. In Schedule 80G in table (D) "Donations entitled for 50% deduction Subject to Qualifying Limit" Donation in cash or Donation in other mode is to be entered mandatory without which total deduction column should not be entered
83. In Schedule 80G in table (E) Donations should be equal to the sum of (Donations entitled for 100% deduction without qualifying limit +Donations entitled for 50% deduction without qualifying limit+ Donations entitled for 100% deduction subject to qualifying limit +Donations entitled for 100% deduction subject to qualifying limit)
84. Total Donation should be equal to sum of "Donation in cash" AND "Donation in other mode" in table (80G) (A)"Donations entitled for 100% deduction without qualifying limit"
85. Total Donation' should be equal to sum of "Donation in cash" AND "Donation in other mode" in table (80G) (B)"Donations entitled for 50% deduction without qualifying limit"
86. Total Donation' should be equal to sum of "Donation in cash" AND "Donation in other mode" in table (80G) (C)"Donations entitled for 100% deduction subject to qualifying limit"
87. Total Donation' should be equal to sum of "Donation in cash" AND "Donation in other mode" in table (80G) (D)"Donations entitled for 50% deduction subject to qualifying limit"
88. If Old Tax Regime is selected, and In "schedule 80G" if multiple entries are under donation in cash with same PAN then more than Rs 2,000 then amount entered in donation in cash will not be considered for calculation of Eligible amount of donation.if sum of all such cash donation exceeds Rs. 2000 then eligible amount of donation shall not be more than 0 or in case of individual entry is more than Rs. 2000 in
89. In "Schedule 80GGA" "Donation in cash" or "Donation in other mode" is to be entered mandatory without which total deduction column should not be entered
90. Total Donation' should be equal to sum of "Donation in cash" AND "Donation in other mode" in table (80GGA)
91. If Deduction u/s 80GGA is claimed, details should be provided in Schedule 80GGA.
92. In Schedule 80GGA, 'Eligible amount of Donations' cannot be more than the 'Total Donations'.
93. In Schedule VIA, deduction claimed u/s 80GGA cannot be more than the eligible amount of donation mentioned in Schedule 80GGA
94. Donee PAN mentioned in Schedule 80GGA cannot be same as the assessee PAN or the verification PAN
95. In Schedule IT total of col 4 Tax Paid should be equal to sum of individual values
96. In Schedule TCS, "The Amount of TCS claimed this year" should not be more than "Tax collected".

*(Page 10)*

97. In Schedule TCS total of col 6 TCS credit out of (5) being claimed this year should be equal to sum of individual values
98. In Schedule TDS2 (Other than salary), "The Amount of TDS claimed this year" should not be more than "Tax deducted".
99. In Schedule TDS (2), TDS (3)/TCS year of tax deduction cannot be '0' / 'null ' if there is a claim of TDS / TCS
100. In Schedule TDS1 total of col 5 'Total Tax deducted" should be equal to sum of individual values of col 5
101. In Schedule TDS2 total of col 6 'TDS Credit out of (5) claimed this year" should be equal to sum of individual values of col 6
102. In Schedule TDS3 total of col 7' 'TDS Credit out of (5) claimed this year should be equal to sum of individual values of col 7
103. TDS, TCS or Tax paid claimed in "Taxes Paid and Verification" should be equal to the details of tax amount paid provided in Schedule IT, Schedule TDS1, Schedule TDS2 and Schedule TCS.
104. The sum of amounts claimed at TDS, TCS, Advance Tax and Self-Assessment Tax should be equal to the amount claimed at "Total Taxes Paid".
105. Refund claimed should be equal to "Total Taxes Paid" minus "Total Tax and Interest payable".
106. Tax payable Amount should be equal to "Total Tax and Interest payable" minus "Total Taxes Paid".
107. IFSC under "Bank Details" Schedule 80G and in schedule 80GGC should match with the RBI database / GIFT IFSC codes.
108. In "Schedule Taxes Paid and Verification" Total TDS Claimed should be equal to the sum of total TDS claimed in TDS 1, 2 & 3
109. In "Schedule Taxes Paid and Verification" Total TCS Claimed should be equal to the sum of total TCS claimed in TCS schedule
110. In "Schedule Taxes Paid and Verification" Total Advance Tax paid is not equal to the sum of total Tax Paid in schedule IT where date of deposit is between 1/04/20XX and 31/03/20XX of PY for which return is being filed.
111. In "Schedule Taxes Paid and Verification" Total Self-Assessment Tax Paid is not equal to the sum of total Tax Paid in schedule IT where date of deposit is after 31/03/20XX of AY for which return is being filed.
112. In case of Old Tax Regime, taxpayer being an employee can claim Standard deduction u/s 16ia only to the extent of Rs 50000.
113. Credit for TDS has been claimed in the return of income, but the corresponding receipts/income has been omitted to be offered for taxation. (Receipts/ Income should be offered to tax in one or the schedules in the return. Further, receipts as appearing in Form 26AS to be offered to tax in one or the schedules in the return)
114. In Schedule Income Details, the maximum limit allowable under section 80GG is: Rs.60,000/- or 25% of his total income excluding LTCG before allowing deduction of this expenditure, whichever is less.
115. If Old Tax Regime is selected, then the maximum limit allowable under section 80CCD(1B) is Rs.50,000/-
116. Deduction u/s 80CCD (2) cannot be claimed by taxpayer who has selected employer category as "CG-Pensioners" "SG-Pensioners" "PSU-Pensioners"

*(Page 11)*

"Other Pensioners " or "Not Applicable"

117. Total income excluding LTCG C3 (a)(iii) should not be greater than Rs 50 lakhs.
118. In schedule 80GGA, if donation is made in cash same PAN of Donee cannot appear more than once
119. House rent allowance (HRA u/s.10(13A)) is claimed, hence deduction u/s.80GG is not allowed for the corresponding period.
120. In case of Old Tax Regime - Deduction u/s 80CCD (2) should not be more than 14% of salary if any of the employer category is Central Government or state government
121. If Old Tax Regime is selected, then Assessee claiming deduction u/s 80EE more than the maximum limit of Rs 50000/-
122. If Old Tax Regime is selected, then Assessee claiming deduction u/s 80EEA more than the maximum limit of Rs 150000/-
123. Only one of the deductions u/s 80EE/ 80EEA is allowed. Thus, if deductions claimed under section 80EEA is greater than "Zero" deductions claimed under section 80EE cannot be greater than "Zero"
124. If Old Tax Regime is selected, then Assessee claiming deduction u/s 80EEB cannot be more than Rs 150000/-
125. Relief u/s 89 cannot be claimed by taxpayer if details of salary as per 17(1), Value of perquisite as per 17(2) and Profit in lieu of salary as per 17(3) or family pension are "zero"/ "blank"
126. If the original return is filed under section 142(1) then taxpayer cannot file a return u/s 139 (Will be checked at upload level)
127. If Old Tax Regime is selected, then In Schedule 80D, Deduction at Sl. No. 1a Self and Family will be allowed to the extent of Rs.25000
128. In Schedule 80D, Deduction at Sl. No. 1a should be equal to sum of Sl. No (i+ii)

Note: This validation to be checked if value of (i+ii) at Sl. No. 1a is less than 25000

129. If Old Tax Regime is selected, then In Schedule 80D, the amount of preventive health checkup of all the fields combined together should not exceed 5000.
130. If Old Tax Regime is selected, then In Schedule 80D, Deduction at Sl. No. 1b Self and Family (Senior Citizen) will be allowed to the extent of Rs. 50000
131. In Schedule 80D, Deduction at Sl. No. 1b should be equal to sum of Sl. No (i+ii+iii) Note: This validation to be checked if value of (i+ii+iii) at Sl. No. 1b is less than 50000
132. If Old Tax Regime is selected, then In Schedule 80D, Deduction at Sl. No. 2a Parents will be allowed to the extent of Rs. 25000
133. In Schedule 80D, Deduction at Sl. No. 2a should be equal to sum of Sl. No (i+ii)

Note: This rule will be applicable If Old Tax Regime is selected.
Note: If sum is greater than 25000, then 2a should be restricted to 25000

134. If Old Tax Regime is selected and In Schedule 80D, value at field 2b is greater than Rs. 50000
135. In Schedule 80D, Deduction at Sl. No. 2b should be equal to sum of Sl. No (i+ii+iii) Note: This validation to be checked if value of (i+ii+iii) Sl. No. 2b is less than 50000

*(Page 12)*

136. If Old tax Regime is selected and In Schedule 80D, Sl. No. 3 Eligible amount of deduction is greater than Rs. 100000
137. In Schedule 80D, Eligible amount of deduction at Sl. No. 3 should be equal to sum of Sl. No (1a+1b+2a+2b) subject to GTI Note: This validation to be checked if value of Sl. No. (1a+1b+2a+2b) at Sl. No. 3 is less than or equal to 100000
138. If 80D claimed in Income Details Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80D
139. In Schedule 80G, 'Eligible amount of Donations' cannot be more than the 'Total Donations'.
140. In "Schedule Income Details " Total Tax, Fee & Interest should be equal to sum of Balance Tax after Relief +Total Interest, Fee Payable
141. "Sec 10(17A)-Award instituted by Government" drop-down cannot be selected more than one time under Exempt Income.
142. If exempt allowance is claimed u/s. 10(10AA) above Rs.25 Lakhs for employer category other "Central and state government, CG- Pensioners, SG- Pensioner"
143. Deduction u/s 80GGA is not allowed for donation made in cash above Rs. 2000/-.
144. In schedule 80GGA, if donation is made, same PAN of Donee cannot appear more than once
145. In income details total of Dividend income should be equal to sum of "Quarterly breakup of Dividend Income"
146. If option Yes is selected for 'Are you opting for new tax regime u/s 115BAC?' then Part C — Deductions and Taxable Total Income, Deduction at B5(a), B5(b), B5(c ), B5(d),B5(f),B5(g),B5(h),B5(i),B5(j),B5(k),B5(l),B5(m),B5(n),B5(o),B5(p),B5(q),B5(r),B5(s) should not be more than "0"
147. In schedule 80G, If PAN is already entered in anyone of the set of blocks (i.e. 100%, 50%, with Qualifying limit, without Qualifying limit) then same PAN cannot be entered in any other block
148. If New Tax Regime is selected, exempt allowance under Section 10(14)(ii) - "Transport allowance granted to certain physically handicapped assessee" should not exceed Rs 38,400
149. If New Tax Regime is selected and Exempt allowances under "Sec 10(5)-Leave Travel concession/assistance" "Sec 10(13A)-Allowance to meet expenditure incurred on house rent" "Sec 10(14)(i)- Prescribed Allowances or benefits (not in a nature of perquisite) specifically granted to meet expenses wholly, necessarily and exclusively and to the extent actually incurred, in performance of duties of office or employment" "Sec 10(14)(ii) -Prescribed Allowances or benefits granted to meet personal expenses in performance of duties of office or employment or to compensate him for increased cost of living" is more than "0"
150. If Old Tax Regime is selected and Exempt allowances under "Section 10(14)(i) - Allowances referred in sub-clauses (a) to (c) of sub-rule (1) in Rule 2BB" "Section 10(14)(ii) - Transport allowance granted to certain physically handicapped assessee" is more than "0"
151. Old Tax Regime cannot be selected after the due date of filing of return mentioned u/s 139(1)
152. Once a proceeding is initiated u/s148, no other return can be filed u/s 139 (Will be blocked at upload level)

*(Page 13)*

153. If New Tax Regime is selected and the Sum of deductions claimed u/s 80C, 80CCC & 80CCD (1) should not be more than zero.
154. If New tax Regime is selected then In Schedule VIA, deduction claimed u/s 80DD should not be more than "0"
155. If New Tax regime is selected, then deduction claimed u/s 80DDB should not be more than "0"
156. If New Tax Regime is selected, then deduction u/s 80G claimed should not be more than "0". Further, no details should not be provided in schedule 80G
157. If New Tax Regime is selected Then In Schedule VIA, the deduction claimed u/s 80TTA should not be more than "0"
158. If New tax Regime is selected Then In Schedule VIA, deduction claimed u/s 80TTB should not be more than "0"
159. If New tax Regime is selected Then In Schedule VIA, deduction claimed u/s 80U should not be more than "0"
160. If New tax Regime is selected Then in case of house property loss, Gross Total Income should be equal to the Total of Incomes from Salary and Other Sources.
161. If New Tax Regime is selected, then exempt allowance income u/s 10(17)-Allowance MP/MLA/MLC should not be more than Zero
162. If New Tax Regime is selected and In Schedule HP, if "Type of House Property" is selected as "Self-Occupied", then the interest on borrowed capital should not be more than "0",
163. If New Tax Regime is selected, then Entertainment allowance u/s 16(ii) should not be more than "0"
164. If New Tax Regime is selected, Then Exemption u/Sec 10(5)- Leave Travel concession/assistance should not be more than "0"
165. If New Tax Regime is selected, Then Exempt Allowance Sec 10(13A)-Allowance to meet expenditure incurred on house rent should not be more than "0"
166. If New Tax Regime is selected Then Exempt Allowances -Sec 10(14)(i) Prescribed Allowances or benefits (not in a nature of perquisite) specifically granted to meet expenses wholly, necessarily and exclusively and to the extent actually incurred, in performance of duties of office or employment should not be more than "0"
167. If New Tax Regime is selected, Then Exempt Allowance -Sec 10(14)(ii) Prescribed Allowances or benefits granted to meet personal expenses in performance of duties of office or employment or to compensate him for increased cost of living should not be more than "0"
168. If New Tax Regime is selected then In Schedule VIA, Professional tax u/s 16(iii) should not be more than "0"
169. If New Tax Regime is selected then In Schedule VIA, deduction under section 80CCD(1B) should not be more than "0"
170. If New Tax Regime is selected then In Schedule VIA, deduction under section 80EE should not be more than "0"
171. If New Tax Regime is selected then In Schedule VIA, deduction under section 80EEA should not be more than "0"
172. If New Tax Regime is selected then In Schedule VIA, deduction under section 80EEB should not be more than "0"

*(Page 14)*

173. If New Tax Regime is selected, then deduction u/s 80D claimed should not be more than "0" and details should not be provided in schedule 80D
174. If New Tax Regime is selected and Income from house property is positive then Gross Total Income is not equal to the Total of Incomes from Salary, House Property & Other Sources & LTCG u/s 112A.
175. If New Tax Regime is selected, then deduction u/s 80GGA claimed should not be more than "0" and details should not be provided in schedule 80GGA
176. If Old Tax Regime is selected, then Exempt Allowance Sec 10(13A)-Allowance to meet expenditure incurred on house rent cannot be more than 1/3rd of Salary as per section 17(1)
177. Exempt allowance u/s 10(10CC) cannot be more than the TDS claimed u/s 192 in schedule TDS1
178. In Schedule 80D, Deduction at sl.no.1a "Self and Family" can be claimed only if dropdown at sl.no.1 `Whether you or any of your family member (excluding parents) is a senior citizen?' is selected as "No"
179. In Schedule 80D, Deduction at sl.no.1b "Self & Family including Senior Citizen" can be claimed only if dropdown at Sl.no.1 `Whether you or any of your family member (excluding parents) is a senior citizen? `is selected as "Yes"
180. In Schedule 80D, Deduction at sl.no.2a "Parents" can be claimed only if dropdown at sl.no.2 `Whether any one of your parents is a senior citizen' is selected as "No"
181. In Schedule 80D, Deduction at sl.no.2b "Parents including Senior Citizen" can be claimed only if dropdown at sl.no.2 `Whether any one of your parents is a senior citizen' is selected as "Yes"
182. In Schedule 80D, deduction cannot be claimed in sl.no.1a and 1b if dropdown is selected as "Not claiming for Self /Family"
183. In Schedule 80D, deduction cannot be claimed in sl.no.2a and 2b if dropdown is selected as "Not claiming for Parents"
184. Any drop-down of nature of income cannot be selected more than one time under Exempt Income.
185. Exempt Allowance u/s 10(10B) (i) and 10(10B) (ii) Should not be allowed to Central Government employees, state government employees, CG-Pensioners, SG- Pensioners, PSU-Pensioners, or Others-Pensioners
186. Deduction u/s 80CCH should not exceed 46.2% of Salary u/s 17(1)
187. Deduction u/s 80CCH can be claimed if Nature of employment is 'Central Government' and age is from 17 years to 27 years as on date of joining of armed forces.
188. Exempt Allowance u/s 10(10B)-Second proviso- Compensation under scheme approved by the Central Government cannot exceed Rs.500,000
189. If Return is filed u/s 139(5) and original return was filed u/s 139(4) then Old Tax Regime cannot be selected.
190. Option to withdraw from New Tax Regime is not available after due date of filing of return as mentioned u/s 139(1)
191. If New tax Regime is selected, Rebate u/s 87A is claimed by Resident Individual having Total income excluding LTCG of more than Rs.12,70,590.
192. Rebate u/s 87A can be claimed to the extent of Rs.12500 by Resident Individual having Total income of Rs. 5,00,000 under old tax regime
193. If 80GGC is claimed in Income Details Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80GGC

*(Page 15)*

194. In Schedule 80GGC, 'Eligible amount of contributions' for each row shall be equal to "contribution in other mode" to the extent of Gross total income
195. Total Contribution' should be equal to sum of "Contribution in cash" AND "Contribution in other mode" in table (80GGC)
196. In schedule 80GGC, Sl no. D "Eligible Amount of contribution" should be equal to sum of individual amounts restricted to GTI
197. In schedule 80GGC, Values at sl.no.A - total contribution in Cash, B-contribution in other mode and C-Total contribution should be equal to sum of individual amounts entered
198. Date of contribution is mandatory for contribution made under 80GGC
199. Details of contribution made in other mode are required in schedule 80GGC
200. If Old Tax Regime is selected, And In the schedule 80U value at i- 'Nature of disability' is selected as "self with severe disability" and the value at field ii-'Amount if deduction' is less or more than 125,000 subject to GTI.
201. If Old Tax Regime is selected, And In the schedule 80U value at i- 'Nature of disability' is selected as "self with disability" and the value at field ii-'Amount of deduction' is less or more than 75,000 subject to GTI.
202. If 80U claimed in Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80U
203. If Old Tax Regime is selected, And If drop down selected at sl no (i)-Nature of disability' of schedule 80DD is 'dependent person with disability' and amount is less or more Rs. 75000 subject to GTI.
204. If Old Tax Regime is selected, And If drop down selected at sl no (i)-Nature of disability' of schedule 80DD is 'dependent person with severe disability' and amount is less or more Rs. 125000 subject to GTI.
205. If 80DD is claimed in Deduction under Chapter VIA, then same amount and details should be provided in Schedule 80DD
206. In schedule 80DD, If deduction is > 0, then details of such deduction is required
207. In schedule 80U, If deduction is > 0, then details of such deduction is required
208. In schedule 80U, If deduction is > 0, then details of such donation are required
209. In schedule 80DD, If deduction is > 0, then details of such donation are required
210. When details of Salary Income are given then 'Nature of employment' cannot be selected as 'Not Applicable',
211. Deduction u/s 80GGC can be claimed for the Contributions made between period 01.04.2025 to 31.03.2026 for AY 2026-27
212. Aadhaar number in Part A general information schedule should match with Aadhaar number as per profile
213. "Exempt Allowances" in Salary under each section should be disclosed in one dropdown
214. In case of new tax regime, deduction u/s 57(iia) can be availed upto 1/3rd of Family pension maximum of Rs. 25,000

*(Page 16)*

215. In case of New Tax Regime: Taxpayer being an employee can claim Standard deduction u/s 16ia only to the extent of Rs 75000.
216. In case of New Tax Regime, deduction u/s 80CCD (2) should not be more than 14% of salary if the employer category is selected as PSU", "Others", "Central Govt" or "State Govt"
217. Under Exempt Income, Sl. No. iii Long term capital gains as per sec 112A should not be more than 1,25,000
218. In Exempt Income, Sl. No. iii Long term capital gains as per sec 112A should be output of Sl. No. (i - ii)
219. In Part A General, Filing section is selected as 139(9) and the responses for A23 in 139(9) is not matching with the responses of A23 question in the ITR against which defective response is getting submitted.
220. "Details of Bank from which loan is taken" needs to be provided for claiming Interest on borrowed capital u/s 24(b) in schedule Interest u/s 24(b)
221. Deduction u/s 80EE / 80EEA can be claimed when the limit u/s 24(b) is exhausted.
222. As the deduction u/s 80EE can be claimed over and above deduction u/s 24(b), "Details of bank from which loan is taken" in schedule 80EE should be part of the details disclosed in schedule 24(b)
223. As the deduction u/s 80EEA can be claimed over and above deduction u/s 24(b), "Details of bank from which loan is taken" in schedule 80EEA should be part of the details disclosed in schedule 24(b)
224. Details such as Amount eligible for deduction u/s 80C, Identification Number of supporting document are required to provide in schedule 80C to claim deduction
225. "Details of Bank from which loan is taken" need to be provided for claiming deduction u/s 80EE in schedule 80EE
226. PRAN should be provided in schedule VIA to claim deduction u/s 80CCD(1), or 80CCD(1B)
227. Deduction u/s 80EE can be claimed only if maximum loan taken does not exceed Rs. 35 lakhs against the property
228. "Details of Bank from which loan is taken" needs to be provided for claiming deduction u/s 80EEA in schedule 80EEA
229. Deduction u/s 80EEA can be claimed only on the residential house property having stamp duty value upto Rs.45 Lakhs
230. The Date of sanction of loan under schedule 80EEA shall be between 1.4.19 and 31.3.22
231. "Details of Bank from which loan is taken" need to be provided for claiming deduction u/s 80EEB in schedule 80EEB
232. The Date of sanction of loan under schedule 80EEB shall be between 1.4.19 and 31.3.23
233. Details of Form 10BA is required to provide to claim deduction u/s 80GG
234. In schedule 80D, breakup of individual rows for "amount of premium paid" shall match with the Health insurance premium entered by the user under "Health insurance" at sl.no.1a
235. In schedule 80D, breakup of individual rows for "amount of premium paid" shall match with the Health insurance premium entered by the user under "Health insurance" at sl.no.1b

*(Page 17)*

236. In schedule 80D, breakup of individual rows for "amount of premium paid" shall match with the Health insurance premium entered by the user under "Health insurance" at sl.no.2a
237. In schedule 80D, breakup of individual rows for "amount of premium paid" shall match with the Health insurance premium entered by the user under "Health insurance" at sl.no.2b
238. Form 10IA needs to be filed separately for claiming Deduction u/s 80U and 80DD respectively.
239. Details of specified disease is required to be provided to claim deduction u/s 80DDB
240. In schedule House property, value of "interest on borrowed capital" should be same as the "total of interest paid u/s 24(b)" as per schedule 24(b)
241. Deduction u/s 80C claimed under chapter VIA should be same as the "Total of payment made as per schedule 80C "
242. Deduction u/s 80E in schedule VIA should match with the "Total of interest paid" as per schedule 80E
243. Deduction u/s 80EE in schedule VIA should match with the "Total of interest paid" as per schedule 80EE
244. Deduction u/s 80EEA in schedule VIA should match with the "Total of interest paid" as per schedule 80EEA
245. Deduction u/s 80EEB in schedule VIA should match with the "Total of interest paid" as per schedule 80EEB
246. In schedule 24(b) the sum of individual rows for "Interest paid during the year" (x) shall match with the "Total of Payments" as per the schedule 24(b)
247. In schedule 80C the sum of individual rows for "Amount of payment" (ii) shall match with the "Total of Payments" as per the schedule 80C
248. In schedule 80E the sum of individual rows for "Amount of interest paid" (x) shall match with the "Total of Payments" as per the schedule 80E
249. In schedule 80EE the sum of individual rows for "Interest paid during the year" (x) shall match with the "Total of Payments" as per the schedule 80EE
250. In schedule 80EEA the sum of individual rows for "Amount of interest paid" (ix) shall match with the "Total of Payments" as per the schedule 80EEA
251. In schedule 80EEB the sum of individual rows for "Amount of interest paid" (x) shall match with the "Total of Payments" as per the schedule 80EEB
252. The Date of sanction of loan In schedule 80EE shall be between 1.4.16 and 31.3.17
253. Interest on borrowed capital In schedule 24(b) can't be claimed in case of Self occupied house property under new tax regime
254. If Old Tax Regime is selected, and Deduction u/s 80D is claimed but details not provided in Schedule 80D
255. Assessee having status as Individual and opting new tax regime have filled any of the schedules amongst 80C schedule, 10(13A) schedule, 80E schedule, 80EE schedule, 80EEA schedule or 80EEB schedule
256. Details such as name of the Insurer, Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 1a (i)
257. Details such as name of the Insurer, Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 1b (i)

*(Page 18)*

258. Details such as name of the Insurer, Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 2a (i)
259. Details such as name of the Insurer, Policy number are required to be provided in schedule 80D to claim deduction for health insurance at sl. No. 2b (i)
260. Section 192 applicable to Tax deducted on salary income is selected as the dropdown under schedule TDS 2, or 3 which are for details of TDS on other than salary income.
261. HRA u/s 10(13A) shall not be more than Actual rent paid after deducting 10% of basic salary and DA
262. HRA u/s 10(13A) shall not be more than 40% of basic salary and DA for those living in non-metro cities or, shall not be more than 50% of basic salary and DA for those living in metro cities (as applicable)
263. In schedule 10(13A) the lowest of the following amounts shall be claimed as HRA exemption:
    A) Actual HRA received
    B) Actual rent paid-10% of (salary+DA)
    C) 40% or 50% of (salary+DA)
264. Taxpayers having salary income and exempt allowances needs to provide "Nature of employment"
265. "Schedule 10(13A) needs to be filled for claiming exempt allowance u/s 10(13A)
266. Sum of Basic salary, dearness allowance as per schedule 10(13A) and actual HRA received shall not be more than salary as per section 17(1) under Income details
267. Exempt allowance u/s 10(10)-Death-cum-retirement gratuity received cannot be more than 25,00,000 if nature of employment is "CG", "CG-Pensioners", "Sg" or "SG-Pensioners"
268. Status selected is Individual and having date of formation on or after 01/04/2008 shall not be allowed to file return for AY 26-27
269. Exempt Allowance u/s 10(13A) in schedule Salary should match with the "Eligible allowance u/s 10(13A)" as per schedule 10(13A)
270. Exempt Allowance "Exempt income received by a judge covered under the payment of salaries to Supreme Court/High Court judges Act /Rules" can be claimed only by CG/SG employees
271. "Type of house property" shall be mandatory if interest on borrowed capital u/s 24(b) is claimed.
272. Eligible amount of deduction claimed u/s 80C should not be more than user enterable amount
273. Eligible amount of deduction claimed u/s 80CCC should not be more than user enterable amount
274. Eligible amount of deduction claimed u/s 80CCD (1) should not be more than user enterable amount
275. Eligible amount of deduction claimed u/s 80CCD(1B) should not be more than user enterable amount
276. Eligible amount of deduction claimed u/s 80CCD (2) should not be more than user enterable amount

*(Page 19)*

277. Eligible amount of deduction claimed u/s 80D should not be more than user enterable amount
278. Eligible amount of deduction claimed u/s 80DD should not be more than user enterable amount
279. Eligible amount of deduction claimed u/s 80DDB should not be more than user enterable amount
280. Eligible amount of deduction claimed u/s 80E should not be more than user enterable amount
281. Eligible amount of deduction claimed u/s 80EE should not be more than user enterable amount
282. Eligible amount of deduction claimed u/s 80EEA should not be more than user enterable amount
283. Eligible amount of deduction claimed u/s 80EEB should not be more than user enterable amount
284. Eligible amount of deduction claimed u/s 80G should not be more than user enterable amount
285. Eligible amount of deduction claimed u/s 80GG should not be more than user enterable amount
286. Eligible amount of deduction claimed u/s 80GGA should not be more than user enterable amount
287. Eligible amount of deduction claimed u/s 80GGC should not be more than user enterable amount
288. Eligible amount of deduction claimed u/s 80TTA should not be more than user enterable amount
289. Eligible amount of deduction claimed u/s 80TTB should not be more than user enterable amount
290. Eligible amount of deduction claimed u/s 80U should not be more than user enterable amount
291. Eligible amount of deduction claimed u/s 80CCH should not be more than user enterable amount
292. LTCG u/s 112A shall be equal to difference between GTI including LTCG and GTI exceluding LTCG
293. In Part A General "Name of the representative, Email ID of the representative, Contact No. are mandatory if in Part- Verification capacity is selected as "Representative" from drop down
294. Whether this return is being filed by a representative assessee? Flag is Y then details should be provided
295. In case of Co-owned property, the total of assessee's share and other co-owner's share should be equal to 100%
296. In Schedule HP, In case of co-owned property Annual value of the property owned should be own percentage share *Annual value.
297. Assessee share of co-owned property is zero then interest on borrowed capital cannot be more than zero',
298. In Schedule HP, Sl.no 1d -Total should be output of SL.no (1b+1c)

*(Page 20)*

299. In Schedule HP, Sl.no 1i -Total should be output of SL.no (1g+1h)
300. In case of co-owned house property, Asseesee PAN & other Co-owners PAN cannot be same
301. Exempt Allowance "Exempt income received by a judge covered under the payment of salaries to Supreme Court/High Court judges Act /Rules" can't be more than 0 is new tax regime is selected.
302. If in 80CCC the sum of individual rows for "Amount" is not equal to Total of "Amounts" as per field 80CCC in Income details.
303. "Sec 10(2) Member's share from HUF" drop-down cannot be selected more than one time under Exempt Income.
304. "Sec 10(10BB) payments made under the Bhopal Gas Leak Disaster" drop-down cannot be selected more than one time under Exempt Income.
305. "Sec 10(11A)- Sum received from an account opened under the Sukanya Samriddhi Yojan" drop-down cannot be selected more than one time under Exempt Income.
306. "Sec 10(12A) NPS partial withdrawal" drop-down cannot be selected more than one time under Exempt Income.
307. "Sec 10(12AA) any payment from the National Pension System Trust" drop-down cannot be selected more than one time under Exempt Income.
308. "Sec 10(12AB) any sum received as lump sum amount as per clause (vi) of paragraph 2 of the notification number FX-1/3/2024-PR" drop-down cannot be selected more than one time under Exempt Income.
309. "Sec 10(12B) NPS lumpsum at exit/closure (portion)" drop-down cannot be selected more than one time under Exempt Income.
310. "Sec 10(12BA) partial withdrawal made from the National Pension System" drop-down cannot be selected more than one time under Exempt Income.
311. "Sec 10(12C) Agniveer Corpus Fund income" drop-down cannot be selected more than one time under Exempt Income.
312. "Sec 10(15) Interest on specified securities/investments" drop-down cannot be selected more than one time under Exempt Income.
313. "Sec 10(19A) Annual value of one palace in occupation of ex-ruler" drop-down cannot be selected more than one time under Exempt Income.
314. "Sec 10(23AA) Sum received by any person on behalf of any Fund established by the armed force" drop-down cannot be selected more than one time under Exempt Income.
315. "Sec 10(23FBB)-income referred to in section 115UB, accruing or arising to, or received by, a unit holder of an investment fund" drop-down cannot be selected more than one time under Exempt Income.
316. "Sec 10(23FD) Unit holder income from Business Trust (certain parts" drop-down cannot be selected more than one time under Exempt Income.
317. "Sec 10(25)-Sum received by trustees on behalf of approved superannuation, gratuity, or pension fund" drop-down cannot be selected more than one time under Exempt Income.
318. "Minor child's income--small exemption" drop-down cannot be selected more than one time under Exempt Income.
319. "Sec 10(35) Income from specified Mutual Funds" drop-down cannot be selected more than one time under Exempt Income.

*(Page 21)*

320. "Sec 10(35A) distributed income referred to in section 115TA received from a securitization trust" drop-down cannot be selected more than one time under Exempt Income.
321. "Sec 10(43) Reverse mortgage--payments to senior citizens" drop-down cannot be selected more than one time under Exempt Income.
322. "Sec 10(44) Income received by any person for, or on behalf of, the New Pension System Trusts" drop-down cannot be selected more than one time under Exempt Income.
323. If New tax regime is selected, then exempt income u/s 10(32)-Minor child's income should not be more than Zero
324. Fees for furnishing revised return under 234-I shall be equal to Rs. 1000 if ITR is filed after 31/12/2026 and filing section is 139(5) and total income does not exceed 5lakh Rs.
325. IFSC and "Transaction Reference number for _UPI transfer / Cheque number/IMPS/NEFT/RTGS reference number", in Schedule 80G is mandatory in case of donation is in mode other than cash.
326. IFSC and "Transaction Reference number for _UPI transfer / Cheque number/IMPS/NEFT/RTGS reference number", in Schedule 80G is mandatory in case of donation is in mode other than cash.
327. If Old Tax Regime is selected, and In "schedule 80G" if multiple entries are there under donation in cash with same PAN then if sum of all such cash donation does not exceeds Rs. 2000 then eligible amount of donation shall be allowed to the extent of Rs. 2000 or claimed whichever is lower
328. Fees for furnishing revised return under 234-I shall be equal to Rs. 5000 if ITR is filed after 31/12/2026 and filing section is 139(5) and total income exceeds 5lakh Rs.
329. Name and PAN of the political party is necessary to claim deduction u/s 80GGC
330. Either cash donation or donation in other mode shall be entered under any row.
331. In Part A General, Email id and contact no of the representative assessee should not match with Email id (primary and secondary) and contact no (primary and secondary) of taxpayer.
332. In Schedule HP, if "Is property co-owned" is selected as Yes, then Assessee's percentage of share in the Property (%) should be less than 100%
333. In Schedule HP, if "Is property co-owned" is selected as Yes, then Percentage share of other co-owner(s) in property should be greater than 0 and less than 100%
334. In case of property is not Co-owned the assessee's share should be equal to 100%
335. If PRAN is entered but amount entered in 80CCD (1) and 80CCD(1B) is equal to 0
336. "The amount of rent which cannot be realized" cannot be more than Gross rent received/ receivable/ lettable during the year
337. If Deduction u/s 80CCC is more than 0 then it shall be mandatory to add at least one row and provide details for "Type of identifier", "Identifier No. and "Amount"
338. Secondary Address in Schedule Part A General Information is mandatory to be provided in the return of income
339. Secondary address should not be same as Primary address if "No" is mentioned for "Is the secondary address same as primary address?" in Schedule Part A General Information

*(Page 22)*

## 1.2 Category B:

### Table 3: Category B Rules

Columns as printed: **Sl.No** | **Scenarios**

1. Linking of Aadhar and PAN is required to avoid consequences of not linking PAN and Aadhar in eligible cases as per Circular 03/2023
2. Quoting of Aadhar in ITR is required as per section 139(AA)in applicable cases and also linking of Aadhar and PAN is required to avoid consequences of not linking PAN and Aadhar in eligible cases as per Circular 03/2023
3. TDS section code such 194B, 194BB, 194BA,194IA,194IC,194LA or 194S as is selected under Schedule "TDS2 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted"
   or
   Assessee having income under special rate is not eligible to file ITR-1
4. TDS section code such 194B, 194BB, 194BA, 194IA,194IC,194LA, or 194S as is selected under Schedule "TDS3 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted"
   or
   Assessee having income under special rate is not eligible to file ITR-1.
5. TDS section code such as 194E,194LB,194LC,194LBA(a),194LBA(b),194LBA(c),195,196A,196B,196C,196D or 196D(1A) is selected under Schedule "TDS2 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted"
6. TDS section code such as 194E,194LB,194LC,194LBA(a),194LBA(b),194LBA(c),195,196A,196B,196C,196D or 196D(1A) is selected under Schedule "TDS3 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted"
7. TDS section code such as 194Q, 194C or 194R is selected under Schedule "TDS2 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted" for which ITR 1 is not applicable
8. TDS section code such as 194Q,194C or 194R is selected under Schedule "TDS3 Details of Tax Deducted at Source on Income Other than Salary" at field 2a "Section under which TDS deducted" for which ITR 1 is not applicable
9. TDS deducted value in schedule TDS 1 CANNOT BE MORE THAN value in schedule Salary "Total Gross salary"

## 1.3 Category D:

### Table 4: Category D Rules

Columns as printed: **Sl. No.** | **Publishing Document**

1. The assessee has claimed relief u/s 89(1) without furnishing of Form 10E

---

*End of document (22 pages, all read and transcribed).*
