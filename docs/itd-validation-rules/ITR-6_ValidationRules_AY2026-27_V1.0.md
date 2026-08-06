> Source: CBDT__e-Filing_ITR-6_Validation Rules_Version 1.0_AY 2026-27.pdf · transcribed verbatim via pdftotext -raw (poppler). The '-' glyph is a PDF text-layer encoding artifact for a dash/bullet in the source; no wording altered, no rules renumbered.

CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 1
Central Board of Direct Taxes
e-filing project
ITR 6 - Validation Rules for AY 2026-27
Version 1.0
04th August 2026
Directorate of Income Tax (Systems)
E-2 , A.R.A. Centre, Ground Floor
Jhandewalan Extension
New Delhi - 110055
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 2
Document Revision List
Document Name: ITR 6 - Validation Rules for AY 2026-27
Version Number: 1.0
Revision Details
Version
No. Revision Date Revision Description Page Number
1.0 4th Aug 2026 Initial Release 06
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 3
Contents
1 Purpose ...................................................................................................... 5
2 Validation Rules ............................................................................................ 5
2.1 Category A: .............................................................................................. 6
2.2 Category B: ............................................................................................ 62
2.3 Category D: ............................................................................................ 65
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 4
List of Tables
Table 1: List of Category of Defect......................................................................... 5
Table 2: Category A Rules .................................................................................... 6
Table 3: Category B Rules ...................................................................................62
Table 4: Category D Rules .................................................................................. 65
Table 5: Annexure 1 ............................................................................................ 67
Table 6: Annexure 2 ............................................................................................ 75
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 5
1 Purpose
The Income Tax Department has provided free return preparation software in downloads page
which are fully compliant with data quality requirements. However, there are certain
commercially available software or websites that offer return preparation facilities as well. In
order to ensure the data quality of ITRs prepared through such commercially available software,
various types of validation rules are being deployed in the e-Filing portal, so that the data which
is being uploaded are accurate and compliant to the validation rules to a large extent. The
taxpayers are advised to review these validation rules to ensure that the software used by them is
compliant with these requirements, to avoid rejection of return due to poor data quality or
mistakes in the return.
The software providers are strictly advised to adhere to these rules to avoid inconvenience to the
taxpayers, who may use their software. Software providers may please note that these validation
rules will be strictly monitored and enforced and each rule will have to be complied strictly. In
case of violations, the concerned return preparation utility/ software is liable to be blacklisted
without any notice and such blacklisting will be published on the efiling website. No return using
blacklisted software will be permitted to be uploaded till the time the software provider is able to
provide details of correction in software. This may cause avoidable inconvenience to the
taxpayers and loss of reputation to software providers for which the Income Tax Department will
not be responsible.
2 Validation Rules
The validation process at e-Filing/CPC end is to be carried out in ITR 6 for each defect as
categorized below:
Table 1: List of Category of Defect
Category of
defect Action to be taken
A Return will not be allowed to be uploaded. Error message will be displayed.
B Return data will be allowed to be uploaded but the taxpayer uploading the return
will be informed of a possible defect present in the return u/s 139(9). Appropriate
notices/ communications will be issued from CPC.
D Return data will be allowed to be uploaded but the taxpayer uploading the return
will be informed of a possibility of some of the deduction or claim not to be
allowed or entertained unless the return is accompanied by the respective claim
forms or particulars.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 6
2.1 Category A:
Table 2: Category A Rules
S. No. Schedule Scenarios
1.
Part A- General
Information
If Assessee mentioned country as India in the "Personal
Information" then user should not quote mobile number less
than or more than 10 digits
2.
Part A- General
Information
Return is being filed by Representative Assessee but the PAN
quoted in return should be same as the PAN who is trying to
upload the return.
3.
Part A- General
Information
If Assessee is liable for audit u/s 44AB and the flag is Y for
accounts have been audited by an accountant, information
relating to auditor and audit report should be furnished
4.
Part A- General
Information
Field Whether assessee is declaring income only under
section44AE/44B/44BB/44BBA/44BBB/44BBC/44BBD/44D
cannot be blank
5.
Part A- General
Information
If Assessee selects field Whether assessee is declaring income
only under section
44AE/44B/44BB/44BBA/44BBB/44BBC/44BBD/44D as no,
a2i cannot be left blank
6.
Part A- General
Information
If Assessee selects "More than Rs. 1 crore and up to Rs. 10
crores" in field, a2i (Please select the range of whether during
the year Total sales/turnover/gross receipts of business of Part
A general , then a2ii cannot be left blank
7.
Part A- General
Information
If Assessee selects "More than Rs. 1 crore and up to Rs. 10
crores" in field, a2i (Please select the range of whether during
the year Total sales/turnover/gross receipts of business of Part
A general , then a2iii cannot be left blank
8.
Part A- General
Information
In part A general, Date of audit report cannot be greater than
system date
9.
Part A- General
Information
Type of company is selected as foreign company, then Section
115BA/115BAA/115BAB is not applicable.
10.
Part A- General
Information
Once opted for taxation u/s 115BA/115BAA/115BAB, assessee
can't opt out from above in subsequent years.
11.
Part A- General
Information
Domestic company cannot be a non-resident
12.
Part A- General
Information
Once a proceeding is initiated u/s 148 or 153C the original
return filed u/s 139 cannot be revised
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 7
13.
Part A- General
Information
If `Yes' is selected for the question `Whether the financial
statements of the company are drawn up in compliance to the
Indian Accounting Standards specified in Annexure to the
companies (Indian Accounting Standards) Rules, 2015' from
Part A general 1 then Manufacturing A/c, Trading A/c, Profit &
loss A/c & Balance sheet cannot be filled
14.
Part A- General
Information
If `No' is selected for the question `Whether the financial
statements of the company are drawn up in compliance to the
Indian Accounting Standards specified in Annexure to the
companies (Indian Accounting Standards) Rules, 2015' from
Part A general 1 then Manufacturing A/c -Ind As, Trading A/c
- Ind As, Profit & loss A/c-Ind As & Balance sheet -Ind As
cannot be filled
15.
Part A- General
Information
If any option other than "None of the above" is selected for
"Have you opted for taxation under section
115BA/115BAA/115BAB?", then "Assessment Year", "Date
of filing" and "Acknowledgement number" are mandatory in
Part A General
16.
Part A- General
Information
If option "Yes" is selected for "If no, whether you are choosing
to opt for taxation under section 115BA/115BAA/115BAB this
year?" then "Section", "Date of filing" and "Acknowledgement
number" are mandatory in Part A General
17.
Part A- General
Information
If any option other than "None of the above" is selected for
"Have you opted for taxation under section
115BA/115BAA/115BAB?", then "yes" cannot be selected in
question "If no, whether you are choosing to opt for taxation
under section 115BA/115BAA/115BAB this year?"
18.
Part A- General
Information
In Part A General, "Whether you are FII / FPI?" should be
selected "Yes" for filling the Schedule 115AD(1)(b)(iii)-
Proviso
19.
Part A- General
Information
In Part A general, if filed in response to a notice u/s
139(9)/142(1)/148/153C or order under section
119(2)(b)/170A/92CD is selected then unique number
/Document Identification Number (DIN) and date of such
notice/Order are mandatory
20.
Part A- General
Information
In Part A general, Sl. No. A6 - Date of commencement of
business should not be before date of incorporation and should
not be after end of financial year
21.
Part A- General
Information
Taxpayer has to select either "Yes'' or "No" in the question
"whether you are recognized as MSME ?"
22.
Part A- General
Information
Taxpayer has selected "Yes" in the question " whether you are
recognized as MSME?" then details of registration are
mandatory to be filled up
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 8
23.
Part A- General
Information
In Part A General, Whether liable for audit under section
44AB? Is YES, Acknowledgement number is mandatory to be
filled up.
24.
Part A- General
Information
In Part A General, "Whether accounts have been audited under
section 92E?" Is YES, Acknowledgement number is
mandatory.
25.
Part A- General
Information
In Part A General, "If liable to furnish other audit report under
the Income-tax Act is YES, Acknowledgement number is
mandatory.
26.
Part A- General
Information
Please choose the same tax regime that the taxpayer selected in
the return for which the response to the defective notice is being
filed.
27.
Part A- General
Information
You are liable to audit u/s 44AB, since you have selected Sl.
No. a2ii as "More than 5%" in Schedule Part A General
Information
28.
Part A- General
Information
You are liable to audit u/s 44AB, since you have selected Sl.
No. a2iii as "More than 5%" in Schedule Part A General
Information.
29.
Part A- General
Information
Since you have selected a2i as "Yes" and either of a2ii or a2iii
"No" in Part A General, then you are liable to audit u/s 44AB.
30.
Part A- General
Information
In Part A general, to claim the benefit of section 115BAB the
date of incorporation (DOI) and date of commencement (DOC)
should be on or after 01/10/2019.
31.
Part A- General
Information
In Part A general, to claim the benefit of section 115BA the date
of incorporation (DOI) and date of commencement (DOC)
should be on or after 01/03/2016.
32.
Part A- General
Information
If any of the field in Business organization table in part A
general 2 is filled, then all the fields are mandatory except PAN
and Date of event
33.
Part A- General
Information
If Due date 30th November is selected, kindly fill Schedule IF
or audit details in Part A Gen
34.
Part A- General
Information
Audit Details u/s 92E in Part A Gen is filled but due date is
selected as 31st October or extended
35.
Part A- General
Information
Return u/s 139(1) is submitted after the date selected as due date
in Part A General.
36.
Part A- General
Information
In Part A General, If "more than 5%" is selected in Sl. No a2ii
"If More than Rs. 1 crore and up to Rs. 10 crores option is
selected at a2i, please select the percentage of amounts received
in cash & non a/c payee cheque/ bank draft out of the aggregate
receipts during the previous year" then you are liable for audit
u/s. 44AB
37.
Part A- General
Information
In Part A General, If "more than 5%" is selected in Sl. No a2iii
"If More than Rs. 1 crore and up to Rs. 10 crores option is
selected at a2i, please select the percentage of payments made
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 9
in cash & non a/c payee cheque/ bank draft out of the aggregate
payments made during the previous year " then you are liable
for audit u/s. 44AB
38.
Part A- General
Information
In Part A General, Email id and contact no of the representative
assessee should not be same as Email id (primary) and contact
no (primary) of taxpayer.
39.
Part A- General
Information
In Part A General, "Whether you are FPI?" should be selected
"Yes" for offering income under Section 115AD(1)(i) in
Schedule OS
40.
Part A- General
Information
Secondary Address in Schedule Part A General Information is
mandatory to be provided in the return of income
41.
Part A- General
Information
Secondary address should not be same as Primary address if
"No" is mentioned for "Is the secondary address same as
primary address?" in Schedule Part A General Information
42.
Part A- Balance sheet If Assessee is liable for audit u/s 44AB, Part A BS and Part A
P&L cannot be blank
43.
Part A- Balance sheet In Balance Sheet total of Equity & Liability should be equal to
total of assets.
44.
Part A- Balance sheet Arithmetical check In Part A-BS, Sl. no 1Bix should be equal
to (Bi + Bii + Biii + Biv + Bv + Bvi + Bvii + Bviii)
45.
Part A- Balance sheet Arithmetical check In Part A-BS sl. no. 2iii should be equal to
2i+2ii
46.
Part A- Balance sheet Arithmetical check In Part A-BS "Equity and liabilities "Sl.No.
3E should be equal to (3A + 3B + 3C + 3D)
47.
Part A- Balance sheet Arithmetical check In Part A-BS, Sl. no 4E should be equal to
(4A + 4B + 4C + 4D)
48.
Part A- Balance sheet Arithmetical check In Part A-BS ,Total of equity and liabilities
should be equal to (1D + 2iii + 3E + 4E)
49.
Part A- Balance sheet Arithmetical check In Part A-BS "Non Current Assets" Total of
fixed assets, Sl. No. 1Av should be equal to 1(id + iid + iii + iv)
50.
Part A- Balance sheet Arithmetical check In Part A-BS "Non Current Assets" Total
of non current investment, sl. no. 1B ix should be equal to (i +
iic + iii + iv + v + vi + vii + viii)
51.
Part A- Balance sheet Arithmetical check In Part A-BS , Sl. no 1F should be equal to
(Av + Bix + C + Dv + Eiii)
52.
Part A- Balance sheet Arithmetical check In Part A-BS, Sl. no 2Aviii should be equal
to 2A(ic + ii + iii + iv + v + vi + vii)
53.
Part A- Balance sheet Arithmetical check In Part A-BS ,Sl. no 2Bviii should be equal
to 2b(i + ii + iii + iv + v + vi + vii)
54.
Part A- Balance sheet Arithmetical check In Part A-BS ,Sl.No. 2Ciii should be equal
to 2C(i + ii)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 10
55.
Part A- Balance sheet Arithmetical check In Part A-BS ,Sl. no. 2Dv should be equal
to 2D(i + ii + iii + iv)
56.
Part A- Balance sheet Arithmetical check In Part A-BS ,Sl. no. 2G should be equal to
2(Aviii + Bviii + Ciii + Dv + Eiii + F)
57.
Part A- Balance sheet Arithmetical check In Part A-BS , Total of assets should be
equal to Sl.No. 1F+2G
58.
Part A- Balance sheet -
Ind As
In Part A-BS IND AS, Sl. no 1Aiv should be equal to 1iv(Aii
+ Aiii)
59.
Part A- Balance sheet -
Ind As
In Part A-BS IND AS, Sl. no 1C should be equal to 1(Aiv +
Biii)
60.
Part A- Balance sheet -
Ind As
In Part A-BS IND AS, Total non current liabilities should be
equal to (Ii + Ij + Ik + IIC + III + IVc)
61.
Part A- Balance sheet -
Ind As
In Part A-BS IND AS, Total of equity and liabilities should be
equal to (1C + 2A +2B)
62.
Part A- Balance sheet -
Ind As
In Part A-BS IND AS, Total of non current assets should be
equal to (Ad + B + Cd + Dc + Ed + F + Gc + HI + HII + HIII +
HIV + I + J)
63.
Part A- Balance sheet -
Ind As
Part A-BS IND AS "ASSETS" Total of Current assets should
be equal to II(2A + 2B + 2C + 2D)
64.
Part A- Trading Account In Trading Account, value at Sl. No. 4Aiii(c) should be equal to
4Aiii(a) + 4Aiii(b)
65.
Part A- Trading Account In Part A-Trading Account, SL. No. 4A(iv) "total (i + ii + iiic)"
should be equal to sum of SL. No. 4A(i) + 4A(ii) + 4A(iiic).
66.
Part A- Trading Account In Part A-Trading Account, SL. No. 4A(Cix) should be equal to
total of SL. No. 4Ci + 4Cii + 4Ciii + 4Civ + 4Cv + 4Cvi + 4Cvii
+ 4Cviii
67.
Part A- Trading Account In Part A-Trading Account, SL. No. 4D-Total Revenue from
operations (Aiv + B + Cix) should be equal to the sum of (Aiv
+ B + Cix)
68.
Part A- Trading Account In "Schedule Trading Account" Total of Direct Expenses at
SL. No. 9 should be equal to the sum of 9i+9ii+9iii
69.
Part A- Trading Account In "Schedule Trading Account" '10' Total should be equal to the
sum of (10i + 10ii + 10iii + 10iv + 10v + 10vi + 10vii + 10viii
+ 10ix + 10x + 10xi)
70.
Part A- Trading Account In Trading Account, value at SL. No. 12 should be equal to
sum of SL. No. (6-7-8-9-10xii-11)
71.
Part A- Trading Account Value at " SL. No. 11" of PartAtradingAccount should be equal
to SL. No. 3 of Part A Manufacturing Account
72.
Part A- Trading Account In Part A trading account, Sl. No. 6 - Total of credits to Trading
Account (4D + 5) should be equal to sum of Sl. No. 4D + Sl.
No. 5
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 11
73.
Part A- Trading Account In Schedule Trading account/Trading account Ind AS, "Income
from Intraday Trading - transferred to Statement of Profit and
Loss" at Sl.No. 12b should not be more than Turnover from
Intraday Trading at Sl. No. 12a.
74.
Part A- Trading Account In Schedule Trading account/Trading account Ind AS, "Income
from Futures & Options Trading - transferred to Statement of
Profit and Loss" at Sl.No. 12d should not be more than
Turnover from Futures & Options Trading at Sl. No. 12c.
75.
Part A- Trading Account
- Ind As
In Trading Account-Ind As, value at SL. No. 4Aiii(c) should be
equal to 4Aiii(a) + 4Aiii(b)
76.
Part A- Trading Account
- Ind As
In Part A-Trading Account-Ind As, SL. No. 4A(iv) "total (i + ii
+ iiic)" should be equal to sum of SL. No. 4A(i) + 4A(ii) +
4A(iiic).
77.
Part A- Trading Account
- Ind As
In Part A-Trading Account-Ind As, SL. No. 4A(Cix) should be
equal to total of SL. No. 4Ci + 4Cii + 4Ciii + 4Civ + 4Cv +
4Cvi + 4Cvii + 4Cviii
78.
Part A- Trading Account
- Ind As
In Part A-Trading Account-Ind As, SL. No. 4D-Total Revenue
from operations (Aiv + B + Cix) should be equal to the sum of
(Aiv + B + Cix)
79.
Part A- Trading Account
- Ind As
In "Schedule TradingAccount-IndAs" Total of Direct Expenses
at SL. No. 9 should be equal to the sum of 9i+9ii+9iii
80.
Part A- Trading Account
- Ind As
In "Schedule Trading Account-Ind As" SL. No. 10 Total should
be equal to the sum of (10i + 10ii + 10iii + 10iv + 10v + 10vi
+ 10vii + 10viii + 10ix + 10x + 10xi)
81.
Part A- Trading Account
- Ind As
In Trading Account-Ind As, value at SL. No. 12 should be equal
to sum of SL. No. (6-7-8-9-10xii-11)
82.
Part A- Trading Account
- Ind As
In Part A trading account - Ind AS, Sl. No. 6 - Total of credits
to Trading Account (4D + 5) should be equal to sum of Sl. No.
4D + Sl. No. 5
83.
Part A-
Manufacturing Account
In "Schedule Manufacturing Account" Total of Opening
Inventory SL. No. 1Aiii should be equal to 1Ai+1Aii
84.
Part A-
Manufacturing Account
In "Schedule Manufacturing Account" at SL. No. 1 Total Direct
expenses should be equal to the sum of values at 1Di + 1Dii +
1Diii
85.
Part A-
Manufacturing Account
In "Schedule Manufacturing Account" Total Factory
Overheads at SL. No. 1Evii should be equal to the sum of
values at SL. No. (Ei + Eii + Eiii + Eiv + Ev + Evi)
86.
Part A-
Manufacturing Account
In "Schedule Manufacturing Account" Total of Debits to
Manufacturing Account at SL. No. 1F should be equal to the
sum of (Aiii + B + C + D + Evii)
87.
Part A-
Manufacturing Account
In "Schedule Manufacturing Account", Total Closing Stock at
SL. No. 2 should be equal to the sum of values at SL. No. 2i +
2ii
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 12
88.
Part A-
Manufacturing Account
In Manufacturing Account, value at SL. No. 3 should be equal
to 1F - 2
89.
Part A-
Manufacturing Account
Part A Manufacturing Account, Negative signs should not be
allowed other than in SL. No. 3
90.
Part A-
Manufacturing Account-
Ind As
In "Schedule Manufacturing Account-Ind As" Total of Opening
Inventory SL. No. 1Aiii should be equal to 1Ai + 1Aii
91.
Part A-
Manufacturing Account-
Ind As
In "Schedule Manufacturing Account-Ind As" at SL. No. 1
Total Direct expenses should be equal to the sum of values at
1Di + 1Dii + 1Diii
92.
Part A-
Manufacturing Account-
Ind As
In "Schedule Manufacturing Account-Ind As" Total Factory
Overheads at SL. No. 1Evii should be equal to the sum of
values at SL. No. (Ei + Eii + Eiii + Eiv + Ev + Evi)
93.
Part A-
Manufacturing Account-
Ind As
In "Schedule Manufacturing Account-Ind As" Total of Debits
to Manufacturing Account-Ind As at SL. No. 1F should be
equal to the sum of (Aiii + B + C + D + Evii)
94.
Part A-
Manufacturing Account-
Ind As
In "Schedule Manufacturing Account-Ind As", Total Closing
Stock at SL. No. 2 should be equal to the sum of values at SL.
No. 2i + 2ii
95.
Part A-
Manufacturing Account-
Ind As
In Manufacturing Account-Ind As, value at SL. No. 3 should be
equal to 1F-2
96.
Part A-
Manufacturing Account-
Ind As
Part A Manufacturing Account-Ind As, Negative signs should
not be allowed other than in SL. No. 3
97.
Part A- P & L Part A P&L, Sl.No. 13 Gross profit transferred from Trading
Account should be equal to Sl. no 12 (Gross Profit from
Business/Profession - transferred to Statement of Profit and
Loss) + Sl. No. 12b " Income from Intraday Trading' + Sl. No.
12d "Income from Futures & Options Trading" of Part Atrading
account.
98.
Part A- P & L In schedule Part A-P & L, the breakup of Any Other Income
(Specify Nature and Amount) at Sl. No. 14.xic shall be equal
to sum of Sl. No. 14x (ia + ib + ic + n)
99.
Part A- P & L Sum of other income at Sl. No. 14 (i + ii + iii + iv + v + vi + vii
+ viii + ix + x + xin) should be equal to total of other income at
Sl. No.
14 in Schedule Part A- P&L
100.
Part A- P & L Part A P&L, Sl.No. 15 Total of credits to statement of profit and
loss (13+14xii) should be equal to the sum of sl. no. 13+14xii
101.
Part A- P & L Part A P&L, If Sl. No. 22xiia is yes then Sl. No. 22xiib cannot
be Zero or null or blank
102.
Part A- P & L Part A P&L, Sl. No. 22xi Compensation to employees should be
equal to sum of 22i to 22x
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 13
103.
Part A- P & L In Part A -P&L, Sl. No. 23v 'Total expenditure on insurance'
should be equal to amounts at Sl. No. (23i+23ii+23iii+ 23iv)
104.
Part A- P & L Part A P&L, Sl. No. 30iii Total of commission should be equal
to SL. No. 30i + 30ii
105.
Part A- P & L Part A P&L, Sl. No. 31iii Royalty should be equal to SL. No.
31i + 31ii
106.
Part A- P & L Part A P&L, SL. No. 32iii Professional / Consultancy fees / Fee
for technical services should be equal to SL. No. 32i + 32ii
107.
Part A- P & L In Part A -P&L, Sl. No. 44x 'Total rates and taxes paid or
payable' should be equal to amounts at Sl. No. 44(I + ii + iii +
iv + v + vi + vii + viii + ix).
108.
Part A- P & L Part A P&L, SL. No. 46 Other expenses, total should be equal
to sum of individual figures
109. Part A- P & L In Sch P&L, breakup of Bad debts shall be consistent with
total
110.
Part A- P & L Part A P&L, SL. No. 50 Profit before interest, depreciation and
taxes should be equal to sum of SL. No. 15 - (16 to 21 + 22xi
+ 23v + 24 to 29 + 30iii + 31iii + 32iii + 33 to 43 + 44x + 45 +
46iii + 47iv + 48 + 49)
111.
Part A- P & L Part A P&L, SL. No. 51iii interest should be equal to SL. No.
51i+51ii
112.
Part A- P & L Part A P&L, SL. No. 53 Net profit before taxes should be equal
to SL. No. 50 - 51iii - 52
113.
Part A- P & L Part A P&L, SL. No. 56 Profit after tax should be equal to SL.
No. 53 - 54 - 55
114.
Part A- P & L Part A P&L, SL. No. 58 Amount available for appropriation,
should be equal to SL. No. 56 + 57
115.
Part A- P & L Part A P&L, SL. No. 60 Balance carried to balance sheet
should be equal to SL. No. 58 -59
116.
Part A- P & L If "business code" u/s 44AE is selected, then it is mandatory to
declare income u/s 44AE.
117.
Part A- P & L In "Schedule statement of Profit & Loss " field 61(ii) "Total
presumptive income from goods carriage u/s 44AE" should be
equal to the value entered in
[total of column (5)].
118.
Part A- P & L In "Schedule statement of Profit & Loss " in table 61(i) of
44AE, total of column 4 "Number of months for which goods
carriage was owned / leased / hired by assessee" shall not
exceed 120.
119.
Part A- P & L Tonnage capacity cannot exceeds 100MT in Sl. No. 61 of
Statement of Profit & Loss
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 14
120.
Part A- P & L In profit & loss Account, Presumptive income u/s 44AE
should be: 1.- Tonnage<=12MT-Rs. 7500 *no. of months or
higher of amount entered
2.-Tonnage >12MT-Tonnage *1000*no. of months or higher of
amount entered
121.
Part A- P & L If income is declared u/s 44AE then it is mandatory to select
"Business code" u/s 44AE.
122.
Part A- P & L Part AP&L, Sl. No. 59Vi Total ofAppropriation should be equal
to sum of break-up of appropriation
123.
Part A- P & L Part A P&L, the value at filed "61(ii)" is greater than zero then
it is mandatory to fill details in table at Sl. No. 61
124.
Part A- P & L Assessee is having presumptive income but Part-B of P&L
(Profit and Loss) A/c has not been filled
125.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44B, SL.
No. 62b "Net Profit" cannot be less than 7.5% of " Gross
receipts /turnover
126.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44BB, SL.
No. 62b "Net Profit " cannot be less than 10% of " Gross
receipts /turnover
127.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44BBA,
SL. No. 62b "Net Profit " cannot be less than 5% of " Gross
receipts /turnover
128.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44BBB,
SL. No. 62b "Net Profit" cannot be less than 10% of "Gross
receipts /turnover"
129.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44D, SL.
No. 62b "Net Profit " cannot be less than 80% of " Gross
receipts /turnover
130.
Part A- P & L In Part A P&L, if assessee has opted for taxation u/s 44BBC,
Sl. No. 62b "Net Profit "cannot be less than 20% of " Gross
receipts /turnover
131.
Part A- P & L In Part A P&L, if assessee has opted for taxation under Rule
10TIA, Sl. No. 62b "Net Profit "cannot be less than 4% of "
Gross receipts /turnover
132.
Part A- P & L In P&L, for 44AE same registration number of good carriages
cannot be entered more than once.
133.
Part A- P & L In Part A P&L, Sl. No. 62b "Net Profit" should be equal to sum
of net profit of all the sections
134.
Part A- P & L In Part A P&L, Bad Debts, Sl. No. 47 (i) & (ii) should match
with sum of those detail tables
135.
Part A- P & L In Part A P&L, Sl. No. 62A "gross receipts/ Turnover" should
be equal to sum of net profit of all the sections
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 15
136.
Part A- P & L In Part A P&L, if assesee has opted for taxation u/s 44BBD, Sl.
no 62b "Net Profit " cannot be less than 25% of " Gross receipts
/turnover
137.
Part A- P & L In Schedule P&L, Net Profit at Sl.No. 62(b) should not be more
than Turnover at Sl. No. 62(a).
138.
Part A- P & L In Schedule P & L, Bad debts amount in Sl. No 47(i) or 47(ii)
is more than 1 lakh, then it is mandatory to fill PAN or Aadhaar
in Sl. No 47(i) and Name and address in Sl.No. 47(ii)
139.
Part A- P & L- Ind AS Part A P&L-IndAS, Sl. No 13 Gross profit transferred from
Trading Account should be equal to Sl.No. 12 (Gross Profit
from Business/Profession - transferred to the Statement of Profit
and Loss ) + Sl. No. 12b " Income from Intraday Trading' Sl.
No. 12d "Income from Futures & Options Trading" of Part A
trading account Ind AS
140.
Part A- P & L- Ind AS In schedule Part A-P & L Ind As, sum of individual of Any
Other Income at Sl. No. 14.xi shall be equal total amount of
"any other income"
141.
Part A- P & L- Ind AS In schedule Part A-P & L Ind AS, Sl. No.14 should be equal to
sum of values at 14(i + ii + iii + iv + v + vi + vii + viii + ix +
x+xic)
142.
Part A- P & L- Ind AS Part A P&L-Ind AS, Sl. No. 15 Total of credits to statement of
profit and loss (13+14xii) should be equal to the sum of Sl.No.
13+14xii
143.
Part A- P & L- Ind AS Part A P&L-Ind AS, If Si no 22xiia is yes then SL. No. 22xiib
cannot be Zero or null or blank
144.
Part A- P & L- Ind AS Part A P&L-Ind AS SL. No. 22xi Compensation to employees
should be equal to sum of 22i to 22x
145.
Part A- P & L- Ind AS Part A P&L-Ind AS value at SL. No. 23i to 23iv should be equal
to SL. No. 23v
146.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 30iii Total of commission should
be equal to SL. No. 30i+30ii
147.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 31iii Royalty should be equal to
SL. No. 31i+31ii
148.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 32iii Professional / Consultancy
fees / Fee for technical services should be equal to SL. No.
32i+32ii
149.
Part A- P & L- Ind AS In Sch P&L-Ind AS, breakup of Rates and taxes paid or
payable to govt or any local body shall be consistent with total
150.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 46 Other expenses, total should be
equal to sum of individual figures
151.
Part A- P & L- Ind AS Part A P&L-Ind AS, the sum of Bad Debts, amount entered in
Sl. No. 47i + 47ii + 47iii shall be consistent with total of Sl.
No. 47iv. Total Bad Debt
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 16
152.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 50 Profit before interest,
depreciation and taxes should be equal to sum of SL. No. 15 -
(16 to 21 + 22xi + 23v + 24 to 29 + 30iii + 31iii + 32iii + 33 to
43 + 44x + 45 + 46iii + 47iv + 48 + 49
153.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 51iii interest should be equal to
SL. No. 51i+51ii
154.
Part A- P & L- Ind AS Part A P&L-Ind AS, SL. No. 53 Net profit before taxes should
be equal to SL. No. 50 - 51iii - 52
155.
Part A- P & L- Ind AS Part A P&L-Ind AS, Sl. No. 56 Profit after tax should be equal
to SL. No. 53 - 54 - 55
156.
Part A- P & L- Ind AS Part A P&L-Ind AS, Sl. No. 58 Amount available for
appropriation, should be equal to SL. No. 56 + 57
157.
Part A- P & L- Ind AS Part A P&L-Ind AS, Sl. No. 59Vi Total of Appropriation should
be equal to sum of break-up of appropriation
158.
Part A- P & L- Ind AS Part A P&L-Ind AS, Sl. No. 60 Balance carried to balance sheet
should be equal to Sl. No. 58 -59
159.
Part A- P & L- Ind AS Part A P&L IND AS, Sl. No. 61AViii items that will be
reclassified to P&L should be equal to sum of Sl. No. 61Ai to
61Avii
160.
Part A- P & L- Ind AS Part A P&L IND AS, Sl. No. 61BVii items that will be
reclassified to P&L should be equal to sum of Sl. No. 61Bi to
61Bvi
161.
Part A- P & L- Ind AS Part A P&L IND AS, Sl. No. 62 Total comprehensive income
should be equal to sum of Sl. No. (56 + 61A + 61B)
162.
Part A- P & L- Ind AS In Part A P&L - Ind AS, Bad Debts, Sl. No. 47 (i) & (ii) should
match with sum of those detail tables
163.
Part A- OI Part A OI SL. No. 3a should be equal to column XI(3) of
schedule ICDS
164.
Part A- OI Part A OI SL. No. 3b should be equal to column XI(4) of
schedule ICDS
165.
Part A- OI In Part A OI , Sl. No. 5f Total of amounts not credited to
statement of profit and loss should be equal to sum of
5a+5b+5c+5d+5e
166.
Part A- OI In Schedule Part A-OI, SL. No. 6, Total amount disallowable
under section 36 should be equal to sum of individual amounts
at SL. No.6
167.
Part A- OI In Schedule Part A-OI, Sl. No. 7 Total amount disallowable
under section 37 should be equal to sum of individual amounts
at Sl. No 7.
168.
Part A- OI In Schedule Part A-OI, Sl. No. 8A.j. Total amount disallowable
under section 40 should be equal to sum of Sl. No.8A.a to
Sl.No.8Ai
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 17
169.
Part A- OI In Schedule Part A-OI, Sl. No. 9 Total amount disallowable
under section 40A should be equal to sum of individual
amounts at Sl.No.9
170.
Part A- OI In Schedule Part A-OI, Sl. No. 10i. Total amount allowable
under section 43B should be equal to sum of amounts at
Sl. No. 10a to Sl. No. 10h
171.
Part A- OI In Schedule Part A-OI, Sl. No. 11i Total amount disallowable
under section 43B should be equal to sum of Sl. No. 11a to Sl.
No. 11h
172.
Part A- OI In Schedule Part A-OI, SL. No. 12i should be equal to sum of
SL. No. 12a to 12h
173.
Part A- OI In Schedule Part A-OI, Sl. No. 13 - Amounts deemed to be
profits and gains under section 33AB or 33ABA or 33AC
should be equal to sum of (a+b+c)
174.
Part A- OL If assessee is company under liquidation, then schedule OL
should be mandatory
175.
Schedule HP In Schedule HP Standard deduction allowed on House property
should be equal to 30% of Annual value.
176.
Schedule HP In case of Co-owned property the total of assessee's share and
co-owner's share should be equal to 100% and co-owner's
PAN/Aadhar has to be mentioned or In schedule HP , Assesee
PAN & Co-Owner's PAN cannot be same.
177.
Schedule HP In Schedule HP, In case of co-owned property Annual value of
the property owned should be own percentage share *Annual
value.
178.
Schedule HP Assessee share of co-owned property is zero then interest on
borrowed capital cannot be more than zero'.
179.
Schedule HP In Schedule HP, if annual value lettable value is zero or null then
assessee cannot claim municipal tax '.
180.
Schedule HP Total of House property should match with total of individual
values.
181.
Schedule HP if Type of property is let-out or deemed let out then Gross rent
received/ receivable/ lettable value at Sl. No. "a" of schedule
HP cannot be 0.
182.
Schedule HP In Schedule HP, SL. No. 1e - Annual Value should be equal to
SL. No. (1a- 1d)
183.
Schedule HP In Schedule HP, SL. No. 1d -Total should be equal to SL. No.
(1b+1c)
184.
Schedule HP In Schedule HP, SL. No. 1i -Total should be equal to SL. No.
(1g+1h)
185.
Schedule HP In Schedule HP - SL. No. 1k Income from House Property
should be equal to sum of 1f - 1i + 1j
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 18
186.
Schedule HP In Schedule HP, SL. No. 2 Pass through income should be
equal to equal to the amount of net income/ loss of HP
mentioned in Schedule PTI
187.
Schedule HP In Schedule HP Standard deduction u/s 24(a) will not be
allowed in case in assessee has opted for taxation u/s 115BAB
188.
Schedule HP In Schedule HP Interest payable on borrowed capital u/s 24(b)
will not be allowed in case in assessee has opted for taxation
u/s 115BAB
189.
Schedule HP In Schedule HP, in case of Co-Owned property, Assessee PAN
and Co-Owner's PAN cannot be same
190.
Schedule HP In Schedule HP, Sl. No. 3 should be equal to sum of Sl.no 1k+
2
191.
Schedule HP In schedule 24(b) the sum of individual rows for "Interest paid
during the year" (x) shall match with the "Total of Payments"
as per the schedule 24(b)
192.
Schedule HP In Schedule HP, if "Is property co-owned" is selected as Yes,
then Percentage share of other co-owner(s) in property should
be less than 100%
193.
Schedule HP In case of property is not Co-owned the assessee's share should
be equal to 100%
194.
Schedule HP "The amount of rent which cannot be realized" cannot be more
than Gross rent received/ receivable/ lettable during the year
195.
Schedule BP In Such BP Pt A1 "Profit before Tax as per Statement of Profit
& Loss " should be equal to sum of (item 53 and 61(ii) and 62(b)
of Part A-P&L) or (item 53 of Part A-P&L - Ind AS) (as
applicable)
196.
Schedule BP Schedule BP- The value in pt. 12(i) "Depreciation allowable
under section 32(1)(ii) and 32(1)(iia)" should be equal to value
in item 6 of Schedule-DEP
197.
Schedule BP The value at field (A25) of schedule BP should be equal to sum
total of Column 3a + 4d of Part A- OI.
198.
Schedule BP In Schedule BP, Income reduced from Sl. No. A3 to be offered
under schedule HP - receipts shown in schedule HP should not
be less than amount reduced from schedule BP Sl. No. A3
199.
Schedule BP In Schedule BP, Income reduced from Sl. No. A3b to be offered
under schedule CG - receipts shown in schedule CG should not
be less than amount reduced from schedule BP Sl. No. A3b.
200.
Schedule BP In Schedule BP, Income reduced from Sl. No. A3c to be offered
under schedule OS- receipts shown in schedule OS should not
be less than amount reduced from schedule BP Sl. No. A3c.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 19
201.
Schedule BP In Schedule BP, Income reduced from Row no A3c (i)
"Dividend Income" to be offered under schedule OS- Income
reduced should not be more than dividend income offered in
Sl. No. 14(iii) Of P & L /P & L Ind As
202.
Schedule BP In schedule BP, Sl.No.A6. should be equal to the sum of Sl.No
(1- 2a- 2b - 3a -3b -3c -3d-3e-3f- 4a -4b-4c -4d - 5d-5A) are
inconsistent.
203.
Schedule BP In schedule BP, Sl. No. A10 Adjusted profit or loss (6+9) and
the sum of amount entered in Sl. No. 6 + Sl. No. 9 are
inconsistent
204.
Schedule BP SL. No. A12iii should be equal to sum of SL. No. A (12i +
12ii)
205.
Schedule BP In schedule BP, Sl. No. A13 Profit or loss after adjustment for
depreciation should be equal to sum of amount entered in Sl.
No. (10+11-12iii)
206.
Schedule BP In schedule BP, Sl. No. A26 should be equal to sum of Sl. No.
(14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24 + 25)
207.
Schedule BP The value at field (A14) of schedule BP should be equal to the
value at SL. No. 6s of schedule OI.
208.
Schedule BP The value at field (A15) of schedule BP should be equal to the
value at SL. No. 7k of schedule OI.
209.
Schedule BP The value at field (A16) of schedule BP should be equal to the
value at SL. No. 8Aj of schedule OI.
210.
Schedule BP The value at field (A17) of schedule BP should be equal to the
value at SL. No. 9F of schedule Part A- OI.
211.
Schedule BP The value at field (A18) of schedule BP should be equal to the
value at SL. No. 11i of schedule Part A- OI.
212.
Schedule BP In schedule BP, value at Sl. No. A29 should be equal to total of
column (4) of Schedule ESR.
213.
Schedule BP In schedule BP, Sl. No. A30 should be equal to Sl. No. 8B of
Such Part-A OI
214.
Schedule BP The value at field (A31) of schedule BP should be equal to the
value at SL. No. 10i of schedule Part A - OI.
215.
Schedule BP The value at field (A33) of schedule BP should be equal to sum
total of Column 3b + 4e of Part A- OI.
216.
Schedule BP The value at SL. No. (11) of schedule BP should be equal to
value of (1Evi of Manufacturing account+ (52) of PART-A-
P&L) or SL. No. 1Evi of Manufacturing account Ind AS+ SL.
No. 52of Part A P&L Ind AS)
217. Schedule BP In schedule BP, SL. No. A5d should be equal to A (5a + 5b +
5cn)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 20
218.
Schedule BP In "Schedule BP" in Table E Business income remaining after
set off should be equal to the value of (Income of current
year)(Business loss set off)
219.
Schedule BP In schedule BP, SL. No. 36(i) should be equal to SL. No. 61(ii)
of schedule P&L
220.
Schedule BP In schedule BP, SL. No. 36(ii) should be equal to SL. No.
62(b)"Net Profit u/s 44B" of schedule P&L
221.
Schedule BP In schedule BP, SL. No. 36(iii) should be equal to SL. No.
62(b)"Net Profit u/s 44BB" of schedule P&L
222.
Schedule BP In schedule BP, SL. No. 36(iv) should be equal to 62(b)"Net
Profit u/s 44BBA" of schedule P&L
223.
Schedule BP In schedule BP, SL. No. 36(va) should be equal to SL. No.
62(b)"Net Profit u/s 44BBB" of schedule P&L
224.
Schedule BP In schedule BP, Sl. No. 36(vb) should be equal to 62(b)"Net
Profit u/s 44BBC" of schedule P&L
225.
Schedule BP In schedule BP, Sl.No. 36(vc) should be equal to 62(b)"Net
Profit u/s 44BBD" of schedule P&L
226.
Schedule BP In schedule BP, SL. No. 36(vi) should be equal to SL. No.
62(b)"Net Profit u/s 44AD" of schedule P&L
227.
Schedule BP In Such BP Pt 8b "Expenses debited to statement of profit and
loss which relate to exempt income and disallowed u/s 14A "
should be equal to 16 of Part A-OI.
228.
Schedule BP In Schedule BP, "Depreciation allowable under section
32(1)(i)", can be claimed only if ''Nature of business''
mentioned by the taxpayer pertains to power sector.
229.
Schedule BP In schedule BP, if income/ loss from specified business is
entered then nature of specified business cannot be blank
230.
Schedule BP The Income/receipts, that have been reduced at Sl. No. 3
and/or SL. No. 5 of schedule BP cannot be higher than the
Income/receipts that have been credited to the P and L A/c./ P
and L Ind As.
231. Schedule BP Non-resident taxpayer cannot offer income u/s 115BBF
232.
Schedule BP In schedule BP amount of exempt income reduced from Profits
and Gains of Business and Profession does not tally with
income offered in schedule EI & Column Amount of share in
profits from schedule IF
233.
Schedule BP In Schedule BP, value at SL. No. A21 should be equal to sum
of values at SL. No. A (21a + 21b + 21c + 21d + 21e + 21f +
21g + 21h + 21i + 21j + 21k + 21i)
234.
Schedule BP The value at field A24 of schedule BP should be equal to sum
of Sl. no 24(a+b+c)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 21
235.
Schedule BP Schedule BP, Sl.No. 24(c) should be minimum of Absolute
value of total of negative values of "col 3 - col 2" of all fields
in Schedule ESR
236.
Schedule BP The value at field (A20) of schedule BP should be equal to the
value at Sl. no. 14 of schedule OI
237.
Schedule BP If in schedule SI, benefit of Income from Insurance Business
u/s 115B is claimed then it is mandatory to fill Sl. No. 4b of
schedule BP
238.
Schedule BP In schedule BP, Sl. No. A.9 should be equal to the sum of
amount entered in Sl. No. (7a + 7b + 7c + 7d + 7e + 7f + 8a +
8b)
239.
Schedule BP The value at field (A34) of schedule BP should be equal to
sum of Sl. No. A (27 + 28 + 29 + 30 + 31 + 32 + 33)
240.
Schedule BP The value at field (A35) of schedule BP should be equal to
sum of SL. No. A (13 + 26 - 34)
241.
Schedule BP The value at field (A36x) of schedule BP should be equal to
sum of values in SL. No. A (36i to 36ix).
242.
Schedule BP The value at field (A37) of schedule BP should be equal to
sum of SL. No. A(35) & A(36x).
243.
Schedule BP The Value at SL. No. 38 of schedule BP should be equal to sum
of (38a+ 38b + 38c + 38d + 38e + 38f)
244.
Schedule BP The value at field (B43) of schedule BP should be equal to sum
of SL. No. B40 + B41 - B42
245.
Schedule BP The value at field C47 of schedule BP should be equal to sum
of SL. No. C(44 + 45 - 46)
246.
Schedule BP The value at field C49 of schedule BP should be equal to sum
of SL. No. C(47 - 48)
247.
Schedule BP In schedule BP, Sl. No. D "Income chargeable under the head
'Profits and gains from Business or Profession' should be equal
to the sum of amount entered in Sl. No A38 + B43 + C49
(provided B43 & C49 is more than 0)
248.
Schedule BP The sum of Values at fields SL. No. A(4a) should be equal to
values at field SL. No. A (36x).
249.
Schedule BP In "Schedule BP" value at field A39 should be equal to the
sum of [4c-(38a + 38b + 38c + 38d + 38e)]
250.
Schedule BP In "Schedule BP", value at field Ev should be equal to sum of
SL. No. Eii + Eiii + Eiv
251. Schedule BP In Schedule BP SL. No. Evi should be equal to SL. No. Ei-Ev
252.
Schedule BP In Such BP SL. No. B40 should be equal to Pt 2a "Net profit
or loss from speculative business"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 22
253.
Schedule BP Amount can be reduced from schedule BP at SL. No. A4c i.e.
Profit from activities covered under rule 7A, 7B(1), 7B(1A)
and 8 only if business code is selected as 1003 , 1002, 1001
respectively
254.
Schedule BP If opted for benefit of lower rate of taxation u/s
115BAB/115BA/115BAA, deduction u/s 35AD (Sl. No. 48) in
schedule BP
255.
Schedule BP In schedule BP, "Deductions in accordance with section
35AD(1)" or in schedule ESR deduction u/s 35(1)(ii) ,
35(1)(iia) , 35(1)(iii),35(2AA) or 35CCCcannot be claimed if
115BAA or 115BAB is opted
256.
Schedule BP In schedule BP, Sl. No. A3c should be equal to Sl. No.
A3(c)(i) + Sl. No. A3(c)(ii)
257.
Schedule BP In Schedule BP, values entered from 36(i) to 36(ix) should
match with values declared at SL. No. 4a(i) to 4a(ix) for
respective sections
258.
Schedule BP In Sch BP, SL. No. 23 should be min of sum of amounts
entered at SL. No. 5a to 5d of part A OI
259.
Schedule BP In schedule BP, Sl. No. 36(vi) should be equal to Sl. No.
62(b)"Net Profit u/s 44D" of schedule P&L
260.
Schedule BP If 115BA is selected from "Have you opted for taxation under
section 115BA/115BAA/115BAB?" or from "If yes, please
provide the date of filing of relevant form (10-IB/10-IC/10-ID)
from part A general then Schedule BP SL. No. 28 should not
be filled
261.
Schedule BP In schedule BP value mentioned at the Sl. No. 38a "Income
Chargeable under Rule 7" does not tally with the amount
mentioned at the Sl. No. 4c(i) "Profit from activities covered
under rule 7".
262.
Schedule BP In schedule BP value mentioned at the Sl. No. 38b "Deemed
income chargeable under Rule 7A" Should be minimum 35%
of the amount mentioned at the Sl. No. 4c(ii) "Profit from
activities covered under rule 7A".
263.
Schedule BP In schedule BP value mentioned at the Sl. No. 38c "Deemed
income chargeable under Rule 7B(1)" Should be minimum
25% of the amount mentioned at the Sl. No. 4c(iii) "Profit from
activities covered under rule 7B(1)".
264.
Schedule BP In schedule BP value mentioned at the Sl. No. 38d "Deemed
income chargeable under Rule 7B(1A)" Should be minimum
40% of the amount mentioned at the Sl. No. 4c(iv) "Profit from
activities covered under rule 7B(1A)".
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 23
265.
Schedule BP In schedule BP value mentioned at the Sl. No. 38e "Deemed
income chargeable under Rule 8" Should be minimum 40% of
the amount mentioned at the Sl. No. 4c(v) "Profit from
activities covered under rule 8".
266.
Schedule BP In schedule BP Sl. No. C44 should be equal to Sl. No. 2b "Net
profit or loss from specified business as per profit or loss
account"
267.
Schedule BP Amount entered at Sl. No. 3f "u/s 115BBH (net of Cost of
acquisition, if any)" should match with Sl. No. A "Total" of
Schedule VDA
268.
Schedule BP The value at field (A19) of schedule BP should be equal to the
value at Sl.No. 17 of schedule Part A- OI.
269.
Schedule BP Sum of A3 in Schedule BP cannot be greater than sum of
revenues in Schedule P & L / trading Account.
270.
Schedule DPM Schedule DPM, SL. No. 6 should be equal to sum of SL. No. 3
+ 4 - 5, or 0 if the value is negative
271.
Schedule DPM Schedule DPM, SL. No. 9 should be equal to difference
between SL. No. 7-8 or 0 if the value is negative
272.
Schedule DPM SL. No. 15 in Schedule DPM should be sum of SL. No. (10 +
11 + 12 + 13 + 14)
273. Schedule DPM SL. No. 17 in Schedule DPM should be sum of SL. No. (15-
16)
274.
Schedule DPM In schedule DPM, additional depreciation is not allowed, if
opted for lower taxation u/s 115BA or 115BAA or 115BAB
275.
Schedule DPM In schedule DPM, assessee cannot claim depreciation more
than 40% if opted for lower taxation u/s 115BA or 115BAA or
115BAB
276.
Schedule DPM Schedule DPM, Value of depreciation at Sl. No. 10 is not
matching as per the depreciation rates mentioned in Sl. No. 2
277.
Schedule DPM Schedule DPM, Value of depreciation at Sl. No. 11 is not
matching as per the depreciation rates mentioned in Sl. No. 2 at
half rates
278.
Schedule DPM Schedule DPM, value at Sl. No. 20 should be equal to "5 + 8 -
3 - 4 -7 - 19". Please enter properly
279.
Schedule DPM Schedule DPM, value at Sl. No. 18 cannot be more than value
at Sl. No. 17 in 15% block
280.
Schedule DPM Schedule DPM, value at Sl. No. 18 cannot be more than value
at Sl. No. 17 in 30% block
281.
Schedule DPM Schedule DPM, value at Sl. No. 18 cannot be more than value
at Sl. No. 17 in 40% block
282.
Schedule DPM Schedule DPM, value at Sl. No. 18 cannot be more than value
at Sl. No. 17 in 45% block
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 24
283.
Schedule DPM Since Sl. No. 18 of any block in Schedule DPM is to be filled
in case of any business organisation, same is not filled or not
within same previous year
284.
Schedule DPM Capital gains/ loss under section 50 at Sl. No. 20 of Schedule
DPM should not be less than the amount at Sl. No. (5+8-3-4-7-
19) in case the consideration is more than the opening WDV
and additions made during the year
285.
Schedule DPM Capital gains/ loss under section 50 at Sl. No. 20 of Schedule
DPM is other than 0, then Sl.No. 10,11,12,13,14,15, 16, 17,18
and 21 should be 0
286.
Schedule DPM In schedule DPM, If Sl. No.20 is 0, value at 21 should be equal
to 7-8+3+4-5-15
287.
Schedule DOA Schedule DOA Sl. No. 17 should be equal to sum of Sl. No.
5+8-3-4-7-16
288.
Schedule DOA In schedule DOAAmount on which depreciation at full rate to
be allowed should be equal to SL. No. 3 + 4 -5 or 0 if the value
is negative
289.
Schedule DOA In schedule DOA, SL. No. 9 should be equal to difference
between SL. No. 7-8 or 0 if the value is negative
290. Schedule DOA SL. No. 12 in Schedule DOA should be sum of SL. No.
(10+11)
291.
Schedule DOA SL. No. 14 in Schedule DOA should be equal to SL. No. 12-
13
292.
Schedule DOA In schedule DOA, Value of depreciation at Sl. No. 10 is not
matching as per the depreciation rates mentioned in Sl. No. 2
293.
Schedule DOA In schedule DOA, Value of depreciation at Sl. No. 11 is not
matching as per the depreciation rates mentioned in Sl. No. 2
at half rates
294.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 5% building block
295.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 10% building block
296.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 40% building block
297.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 10% Furniture and Fitting block
298.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 25% Intangible assets block
299.
Schedule DOA Schedule DOA, value at Sl. No. 15 cannot be more than value
at Sl. No. 14 in 20% Ships block
300.
Schedule DOA Since Sl. No. 15 of any block in Schedule DOA is to be filled
in case of any business organization, same is not filled or not
within same previous year
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 25
301.
Schedule DOA Capital gains/ loss under section 50 at Sl. No. 17 of Schedule
DOA should not be less than the amount at Sl. No. 5+8-3-4-7-
16 in case the consideration is more than the opening WDV
and additions made during the year
302.
Schedule DOA Capital gains/ loss under section 50 at Sl. No. 17 of Schedule
DOA is other than 0, then Sl.No. 10,11,12,13,14,15 and 18
should be 0
303.
Schedule DOA In schedule DOA, If Sl. No.17 is 0, value at 18 should be
equal to (7-8+3+4-5-12)
304.
Schedule DEP Schedule DEP, Total depreciation on plant and machinery
should be equal to sum of SL. No. 1a + 1b + 1c+1d
305.
Schedule DEP Schedule DEP, total depreciation on building should be equal
to sum of SL. No. 2a + 2b + 2c
306.
Schedule DEP Schedule DEP, total depreciation should be equal to sum of SL.
No. 1e + 2d + 3 + 4 + 5
307.
Schedule DEP Schedule DEP, block of plant and machinery entitled for
depreciation @ 15% should be equal to SL. No. 17i or 18i of
schedule DPM as applicable
308.
Schedule DEP Schedule DEP, block of plant and machinery entitled for
depreciation @ 30% should be equal to SL. No. 17ii or 18ii of
schedule DPM as applicable
309.
Schedule DEP Schedule DEP, block of plant and machinery entitled for
depreciation @ 40% should be equal to SL. No. 17iii or 18iii
of schedule DPM as applicable
310.
Schedule DEP Schedule DEP, block of plant and machinery entitled for
depreciation @ 45% should be equal to SL. No. 17iv or 18iv
of schedule DPM as applicable
311.
Schedule DEP Schedule DEP, block of Building entitled for depreciation @
5% should be equal to SL. No. 14ii or 15ii of schedule DOA as
applicable
312.
Schedule DEP Schedule DEP, block of Building entitled for depreciation @
10% should be equal to SL. No. 14iii or 15iii of schedule DOA
as applicable
313.
Schedule DEP Schedule DEP, block of Building entitled for depreciation @
40% should be equal to SL. No. 14iv or 15iv of schedule DOA
as applicable
314.
Schedule DEP Schedule DEP block of furniture and fittings should be equal to
SL. No. 14v or 15v of schedule DOA as applicable
315.
Schedule DEP Schedule DEP block of intangible assets should be equal to SL.
No. 14vi or 15vi of schedule DOA as applicable
316.
Schedule DEP Schedule DEP block of ships should be equal to SL. No. 14vii
or 15vii of schedule DOA as applicable
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 26
317.
Schedule DCG Schedule DCG, Total deemed capital gains on sale of plant and
machinery should be equal to sum of SL. No. 1a + 1b + 1c+ 1d
318.
Schedule DCG Schedule DCG, total deemed capital gains on sale of building
should be equal to sum of SL. No. 2a + 2b + 2c
319.
Schedule DCG Schedule DCG, total deemed capital gains on sale of
depreciable assets should be equal to sum of SL. No.
1e+2d+3+4+5
320.
Schedule DCG Schedule DCG plant and machinery block entitled for
depreciation at 15% should be equal to Sl. no 20i of schedule
DPM
321.
Schedule DCG Schedule DCG plant and machinery block entitled for
depreciation at 30% should be equal to SL. No. 20ii of schedule
DPM
322.
Schedule DCG Schedule DCG plant and machinery block entitled for
depreciation at 40% should be equal to SL. No. 20iii of schedule
DPM
323.
Schedule DCG Schedule DCG plant and machinery block entitled for
depreciation at 45% should be equal to SL. No. 20iv of schedule
DPM
324.
Schedule DCG Schedule DCG block of building entitled for depreciation at 5%
should be equal to SL. No. 17ii of schedule DOA
325.
Schedule DCG Schedule DCG block of building entitled for depreciation at
10% should be equal to SL. No. 17iii of schedule DOA
326.
Schedule DCG Schedule DCG block of building entitled for depreciation at
40% should be equal to SL. No. 17iv of schedule DOA
327.
Schedule DCG Schedule DCG block of furniture and fittings should be equal
to SL. No. 17v of schedule DOA
328.
Schedule DCG Schedule DCG block of intangible assets should be equal to SL.
No. 17vi of schedule DOA
329.
Schedule DCG Schedule DCG block of ships should be equal to SL. No. 17vii
of schedule DOA
330.
Schedule ESR In Schedule ESR, Sl.No.4. Amount of deduction in excess of
the amount debited to statement of profit and loss (4)=(3)-(2)
and Sl.No.3-Sl.No.2 should be consistent.
331.
Schedule ESR Schedule ESR SL. No. x should be equal to sum of SL. No. (c)
+ ii + iii + iv + v + vi + vii + viii + ix
332.
Schedule RA Schedule RA, total donation should be equal to donation in cash
+ donation in other mode
333.
Schedule RA Schedule RA, total donation in cash should be equal to the
bifurcation of donation in cash
334.
Schedule RA Schedule RA, total donation in other mode should be equal to
the bifurcation of donation in other than cash
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 27
335.
Schedule RA Schedule RA, Total donation should be equal to bifurcation of
total donation
336.
Schedule CG The Amount claimed in A6e of Schedule CG should be equal to
value of pt. 6 of Sch DCG
337.
Schedule CG Value at field "A10" in "Schedule CG" should be equal to the
sum of value A1e of all the blocks + A2c + A3e + A4a + A4b
+ A5e + A6g + A7 + A8 - A9a + A(A) of Schedule CG.
338.
Schedule CG Value at field "B12" in "Schedule CG" should be equal to the
sum of value B1g of all the blocks + B2e + B3c + B4 + B5 +
B6c + B7+ B8e+ B9+B10-B11a+B(A)] of Schedule CG .
339.
Schedule CG Value at field "C1" in "Schedule CG" should be equal to the
sum of (8ii + 8iii + 8iv + 8v + 8vi + 8vii of table E) of Schedule
CG.
340.
Schedule CG In Schedule CG, expenses u/s 48 (Sl. No. A1b(iv) cannot be
claimed, if Full Value of Consideration (Sl. No. A1aiii) is not
offered to tax
341.
Schedule CG In Schedule CG, expenses u/s 48 (Sl. No. A3b(iv) cannot be
claimed, if Full Value of Consideration (Sl. No. A3a) is not
offered to tax
342.
Schedule CG In Schedule CG, expenses u/s 48 (Sl. No. A5b(iv) cannot be
claimed, if Full Value of Consideration (Sl. No. A5aiii) is not
offered to tax
343.
Schedule CG In Schedule CG, expenses u/s 48 Sl. No. A6b(iv) cannot be
claimed, if Full Value of Consideration (Sl. No. A6aiii) is not
offered to tax
344.
Schedule CG In Schedule CG, expenses u/s 48 (Sl. No. B1b(iv)) cannot be
claimed, if Full Value of Consideration (Sl. No. B1aiii) is not
offered to tax
345.
Schedule CG In Schedule CG, expenses u/s 48 (Sl.No.. B3b(iv) cannot be
claimed, if Full Value of Consideration (sl. no. B3a) is not
offered to tax
346.
Schedule CG In Schedule CG, expenses u/s 48 (Sl.No.. B6b(iv) cannot be
claimed, if Full Value of Consideration (Sl.No. B6aiii) is not
offered to tax
347.
Schedule CG In schedule CG, Sl. No. A1 biv of STCG Total should be equal
to sum of A1(bi + bii + biii)
348.
Schedule CG In schedule CG, Sl. No. A1c of STCG Balance should be equal
to A1(aiii - biv)
349.
Schedule CG In Schedule CG Sl. No. A1e of STCG should be the difference
of A(1c-1d), only if 1c is greater than 1d
If A1c-A1d, is negative, then A1e, should be equal to 0
350. Schedule CG In Schedule CG Sl. No. A2c of STCG should be equal to
A(2aiii-2b)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 28
351.
Schedule CG In schedule CG, Sl. No. A3 biv of STCG Total should be equal
to sum of A3(bi+bii+biii)
352.
Schedule CG In schedule CG, Sl. No. A3c of STCG Balance should be equal
to A(3a-biv)
353.
Schedule CG In Schedule CG Sl.No. A3e of STCG should be equal to the
sum of A(3c+3d)
354.
Schedule CG In Schedule CG Sl.No. A5(a)(ic) should be higher of Sl. No.
A5(a)(ia) or A5(a)(ib)
355.
Schedule CG In Schedule CG, Sl. No. A5(aiii) should be equal to sum of
A5[(a)(ic) + (aii)]
356.
Schedule CG In schedule CG, Sl. No. A5 biv Total should be equal to sum of
A5(bi + bii + biii)
357.
Schedule CG In schedule CG, Sl. No. A5c Balance should be equal to Sl.
No. A5(aiii-biv)
358.
Schedule CG In Schedule CG Sl. No. A5e of STCG should be equal to the
sum of Sl. No. A(5c+5d)
359.
Schedule CG In Schedule CG Sl. No. A6(a)(ic) should be higher of Sl. No.
A6(a)(ia) or A6(a)(ib)
360.
Schedule CG In Schedule CG, Sl. No. A6(aiii) should be equal to sum of
A6[(a)(ic)+(aii)]
361.
Schedule CG In schedule CG, Sl. No. A6biv Total should be equal to sum of
A6(bi+bii+biii)
362. Schedule CG In schedule CG, Sl. No. A6c Balance should be equal to
A6(aiii-biv)
363.
Schedule CG In Schedule CG Sl. No. A6g of STCG should be equal to the
sum of A(6c+6d+6e-6f)
364.
Schedule CG In Schedule CG Sl. No. A7 of STCG should be equal to the sum
of A(aXi + aXii+aXiii+ b)
365.
Schedule CG In Schedule CG Sl.No. A8 of STCG should be equal to the sum
of (A8a + A8b + A8c)
366.
Schedule CG In schedule CG, Sl. No. B1 biv of LTCG Total should be equal
to sum of B1(bi+bii+biii)
367.
Schedule CG In schedule CG, Sl. No. B1c of LTCG Balance should be equal
to B1(aiii - biv)
368.
Schedule CG In Schedule CG Sl. No. B1e of LTCG should be the difference
of B(1c-1d), only if 1c is greater than 1d
If B (1c-1d) is negative then B1e should be equal to 0
369.
Schedule CG In Schedule CG Sl. No. B2e of LTCG should be the difference
of B(2c-2d)
370.
Schedule CG In Schedule CG Sl. No. B2c of LTCG should be the difference
of B(2aiii-2b)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 29
371.
Schedule CG In Schedule CG, Sl. No. B4 LTCG u/s 112A should be equal to
total of Col. 14 of Schedule 112A
372.
Schedule CG In Schedule CG Sl.No. B6(a)(ic) should be higher of B6(a)(ia)
or B6(a)(ib)
373.
Schedule CG In schedule CG, Sl. No. B6 aiii Total should be equal to sum
of B6 (a)(ic+ii)
374.
Schedule CG In schedule CG, Sl. No. B6 biv Total should be equal to sum
of B6(bi+bii+biii)
375. Schedule CG In schedule CG, Sl. No. B6c Balance should be equal to
B(6aiii-6biv)
376.
Schedule CG In Schedule CG, Sl. No. B7 LTCG u/s 112A should be equal to
total of Col. 14 of Schedule 115AD(1)(iii)
377.
Schedule CG Schedule CG Sl.No. Eviii should be equal to the sum of Sl.No.
(ii + iii + iv + v + vi + vii)
378.
Schedule CG Schedule CG Sl.No. Eix should be equal to difference of i-viii
,only if (i) is greater than (viii ). This rule will be implemented
for all columns
379.
Schedule CG Schedule CG Sl.No. Ei3 should be equal to sum of Sl.No.
(A5e+ A8b + A(A)) as reduced by the amount of STCG
chargeable or not chargeable to tax at special rates specified in
sl. No A9a & A9b , which is included therein
380.
Schedule CG Schedule CG Sl.No. Ei4 should be equal to sum of Sl.No.
(A1e+A2c+A4b+A6g+A7+A8c+A(A)) as reduced by the
amount of STCG chargeable or not chargeable to tax at special
rates specified in sl. No A9a & A9b , which is included therein
381. Schedule CG In Schedule CG, Sl.No. Ei5 should be equal to Sl.No. A9b.
382.
Schedule CG Schedule CG Sl.No. Eiii should be equal to sum of Sl.No.
(A5e+A8b+A(A))as reduced by the amount of STCG
chargeable or not chargeable to tax at special rates specified in
sl. No A9a & A9b , which is included therein
383.
Schedule CG Schedule CG Sl.No. Eiv should be equal to sum of Sl.No.
(A1e+A2c+A4b+A6g +A7+A8c+A(A))as reduced by the
amount of STCG chargeable or not chargeable to tax at special
rates specified in sl. No A9a & A9b , which is included therein
384. Schedule CG In Schedule CG, Sl.No. Ev should be equal to Sl.No. A9b.
385.
Schedule CG Deductions claimed under respective section in STCG and
LTCG should match with Table D.
386.
Schedule CG Deduction claimed under 54D/54G and 54GA, then Date of
deposit/account number and IFS code should not be blank. Date
of deposit cannot be after 31-March-2025. IFSC Code should
be exactly 11 characters, First 4 characters should be alphabets,
5th character must be zero (0) and remaining 6 should be either
numeric or alphabets
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 30
387.
Schedule CG Schedule CG Col no E8 should be equal to Col no (1-2-3-4-5-
6-7)
388.
Schedule CG In Schedule CG, Table F Sl.No. 2 the breakup of all the quarters
should be equal to the value from item 5vii of schedule BFLA
389.
Schedule CG In Schedule CG, Table F Sl. No. 3 the breakup of all the quarters
should be equal to the value from item 5viii of schedule BFLA
390.
Schedule CG In Schedule CG, Table F Sl. No. 4 the breakup of all the quarters
should be equal to the value from item 5ix of schedule BFLA
391.
Schedule CG In Schedule CG, Table F Sl. No. 6 the breakup of all the quarters
should be equal to the value from item 5xi of schedule BFLA
392.
Schedule CG In Schedule CG, Sl. No. B11, Col.10 Applicable Rate should be
lower of Col. 6(Rate as per Treaty) or Col. 9 (Rate as per ITAct)
393.
Schedule CG In Schedule CG, Sl. No. A9 Col.10 Applicable Rate should be
lower of Col. 6(Rate as per Treaty) or Col. 9 (Rate as per ITAct)
394.
Schedule CG In Schedule CG, expenses u/s 48(sl. no B8b(iv) cannot be
claimed, if Full Value of Consideration(Sl.No. B8aiii) is not
offered to tax
395.
Schedule CG In Schedule CG Sl.No. B8(a)(ic) should be higher of B8(a)(ia)
or B8(a)(ib)
396.
Schedule CG In schedule CG, Sl. No. B8 aiii Total should be equal to sum
of B8(a)(ic+ii)
397.
Schedule CG In schedule CG, Sl. No. B8 biv Total should be equal to sum of
B8(bi+bii+biii)
398. Schedule CG In schedule CG, Sl. No. B8c Balance should be equal to
B(8aiii-biv)
399.
Schedule CG In Schedule CG Sl.No. B8e of LTCG should be equal to B(8c-
8d), only if 8c is greater than 8d
400. Schedule CG In Schedule CG, Sl. No. B9 should be equal to B9(aXi + aXii
+ aXiii + b)
401. Schedule CG In Schedule CG, Sl. No. B10 should be equal to B10a1+B10a2
402.
Schedule CG Schedule CG Sl. No. D1e should be equal to sum of D(1a + 1b
+ 1c + 1d )
403. Schedule CG In Schedule CG, Sl.No. Ei7 should be equal Sl.No. B11b .
404. Schedule CG In Schedule CG, Sl.No. Evii should be equal Sl.No. B11b .
405.
Schedule CG In Schedule CG, in case A1(aii) does not exceed 1.10 times
A1(ai), value at A1(aiii) will be equal to A1(ai), or else value
at A1(aiii) will be equal to A1(aii)
406.
Schedule CG In Schedule CG, in case B1(aii) does not exceed 1.10 times
B1(ai), value at B1(aiii) will be equal to B1(ai), or else value
at B1(aiii) will be equal to B1(aii)
407.
Schedule CG In schedule CG, for STCG 2aiii should be equal to higher of 2ai
and 2aii
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 31
408.
Schedule CG In schedule CG, for LTCG 2aiii should be equal to higher of 2ai
and 2aii
409.
Schedule CG Schedule CG, Date of sale and Date of purchase is mandatory
if either of the field at B(1)(aiii) or B(1)(bii) is more than Zero.
410.
Schedule CG Schedule CG, Date of sale and Date of purchase is mandatory
if either of the field at B(1)(aiii) or B(1)(bii) is more than Zero.
411.
Schedule CG In Schedule CG, SL. No. C3 Income chargeable under the head
"CAPITAL GAINS" should be equal to the sum of "Sum of
Capital Gain Incomes" and "Income from transfer of Virtual
Digital Assets"
412.
Schedule CG In Schedule CG, SL. No. C2 Income from transfer of Virtual
Digital Assets should be equal to Sl. No. B of Schedule VDA
413.
Schedule CG In Schedule CG, Table F Sl. No.7 the breakup of all the
quarters should be equal to the value of 'Income under the head
Capital Gain' under 115BBH- Tax on Income from Virtual
Digital asset of schedule SI
414.
Schedule CG In Schedule CG, Table F Sl. No.7 the breakup of all the quarters
should be equal to the value at Sl. No. C2
415.
Schedule CG In Schedule CG, Table D, Sl. No. 1aiv,1civ and 1div is more
than zero but details of iva, ivb and ivc are blank
416.
Schedule CG STCG @ 20% u/s 111A and 115AD(1)(b)(ii) can only be
entered once
417.
Schedule CG In schedule CG, value at B7c should be equal to B7ci + B7cii
(for sections 112(1)( c ), 115AB and 115AC) + 7ciii (i.e.
115AD)
418.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- STCG 20%.
419.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- STCG 30%.
420.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- STCG
Applicable rates%.
421.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- STCG DTAA
rates.
422.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- LTCG 12.5%.
423.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the income available for set off- LTCG DTAA
Rates.
424.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- STCL20%.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 32
425.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- STCL30%.
426.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- STCLApplicable
rate%.
427.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- STCL_DTAA
Rates
428.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- LTCL 12.5%
429.
Schedule CG In Table E of Schedule CG, Sum of amount of set off claimed
cannot exceed the losses available for set off- LTCL _DTAA
Rates
430.
Schedule CG In Table E of Schedule CG, Column 8 of each row should be
equal to 1-(2+3+4+5+6+7)
431.
Schedule CG In Schedule CG, Table E, entire loss should be set off with gains
available for set off.
432.
Schedule CG In Schedule CG, if Sl.No.6 in Sl.No.B. in LTCG is being filled,
then its mandatory to select the section code i.e.,
115AD/112(1)(c ) or 115AC
433.
Schedule CG Kindly fill in the details of dividend in Sl.No. 1a(iii) of schedule
OS if buy back loss is claimed in schedule CG
434.
Schedule CG In schedule CG, Sl. No. B3 b(iv) of LTCG should be equal to
sum of B3 (bi +bii +biii)
435.
Schedule CG In schedule CG, Sl. No. B3(c) of LTCG Balance should be equal
to B(3a-3biv)
436.
Schedule CG If Sl. No.B3a<=0, then deduction u/s 48 cannot be claimed, i.e.
Sl. No. B3b cannot be greater than zero
437.
Schedule CG In schedule CG, in Table D, Deduction u/s 54EC, amount
invested should not be more than 50L
438.
Schedule CG In Schedule CG, Date of sale/Transfer of land or building or
both in Sl.No. A1 or B1 cannot be after 31st March of financial
year
439.
Schedule CG In Schedule CG, value at B1g should be equal to sum of B1e of
all properties.
440.
Schedule 112A In Schedule 112A, Col. 6 Total Sale Value should be equal to
Col. 4*Col. 5
441.
Schedule 112A In Schedule 112A, Col. 7 Cost of acquisition without indexation
should be higher of Col. 8 and Col. 9
442.
Schedule 112A In Schedule 112A, Col. 9 If the long term capital asset was
acquired before 01.02.2018 should be lower of Col. 6 and Col.
11
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 33
443.
Schedule 112A In Schedule 112A, Col. 11 Total Fair Market Value of capital
asset as per section 55(2)(ac) should be equal to Col. 4*Col.
10
444.
Schedule 112A In Schedule 112A, Col. 13 Total deductions should be equal to
sum of Col. (7+12)
445.
Schedule 112A In Schedule 112A, Col. 14 Balance should be equal to the
output of Col. 6-Col. 13
446.
Schedule 112A In Schedule 112A, Total of Col 6, 7, 8, 9, 11, 12, 13 and 14
should be equal to the sum of Sl. No. (1+2+3+4+....)
447.
Schedule 112A In schedule 112A, Value at Column no. 4,5,10 & 11 cannot be
greater than zero in case drop down is selected as "After 31s
January 2018" to question whether shares are acquired on or
before 31.01.2018 or after 31.01.2018?
448.
Schedule 112A Taxpayer to provide the details in either Schedule 112A or
115AD(1)(b)(iii) proviso as applicable
449.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Col. 6 Total Sale Value
should be equal to Col. 4*Col. 5 for the shares purchased On
or Before 31st January 2018
450.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii)proviso, Col. 7 Cost of acquisition
without indexation should be higher of Col. 8 and Col. 9
451.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Col. 9 If the long term
capital asset was acquired before 01.02.2018 is not lower of
Col. 6 and Col. 11
452.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Col. 11 Total Fair Market
Value of capital asset as per section 55(2)(ac) should be equal
to Col. 4*Col. 10 for the shares purchased On or Before 31st
January 2018
453.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Col. 13 Total deductions
should be equal to sum of Col. (7+12)
454.
Schedule
115AD(1)(b)(iiii)Proviso
Taxpayer to provide the details in either Schedule 112A or
115AD(1)(b)(iii) proviso as applicable
455.
Schedule
15AD(1)(b)(iiii)Proviso
In schedule 115AD(1)(b)(iii), Value at Column no. 4,5, 10 & 11
cannot be greater than zero in case drop down is selected as
"After 31s January 2018" to question whether shares are
acquired on or before 31.01.2018 or after 31.01.2018?
456.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Col. 14 Balance should
be equal to the output of Col. 6-Col. 13
457.
Schedule
115AD(1)(b)(iiii)Proviso
In Schedule 115AD(1)(b)(iii) proviso, Total should be equal to
the sum of individual rows
458.
Schedule VDA In Schedule VDA, value at Sl. No. 7 should be equal to Sl. No.
6 - Sl. No. 5
459.
Schedule VDA In Schedule VDA, value at Sl. No. A 'Total (Sum of all Positive
Incomes of Business Income in Col. 7) should be equal to sum
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 34
of col. 7 if head of income is selected as Business income in
col. 4
460.
Schedule VDA In Schedule VDA, value at Sl. No. B 'Total (Sum of all Positive
Incomes of Capital Gain in Col. 7) should be equal to sum of
col. 7 if head of income is selected as Capital Gain in col. 4
461.
Schedule VDA In schedule VDA, Date of Acquisition or Date of transfer
cannot be after 31st March of financial year.
462.
Schedule OS In Schedule OS, Non-resident cannot offer income under
section 115BBF.
463.
Schedule OS In Schedule OS, Sl. No. 1 Gross amount chargeable to tax at
normal applicable rates should be equal to the sum of Sl. No.
1a + 1b + 1c + 1d + 1e
464.
Schedule OS In Schedule OS, Sl. No. 3d Deduction u/s 57 should be equal to
the sum of Sl. No. 3a + 3b + 3c
465.
Schedule OS In Schedule OS, deduction at Sl. No. 3b `Depreciation'will not
be allowed/ restricted to the extent of amount at Sl. No.1c
`Rental income from machinery, plants, building, etc'.
466.
Schedule OS In Schedule OS, Sl. No. 7 Income from other sources (other
than from owning racehorses) should be equal to sum of Sl. No.
2 + 6
467.
Schedule OS In Schedule OS, Sl. No. 8e Balance should be equal to sum of
Sl.no 8a - 8b + 8c + 8d
468.
Schedule OS In Schedule OS, Sl. No. 9 Income under the head" Income from
Other Sources" should be equal to sum of Sl. No. (7 + 8e) (take
8e as nil if negative)
469.
Schedule OS In Schedule OS, Sl. No. 2, Pass through income in the nature
of income from other sources chargeable at special rates should
be equal to sum of all the drop downs
470.
Schedule OS In Schedule OS, Sl. No. 1d Income of the nature referred to in
section 56(2)(x) which is chargeable to tax should be equal to
sum of Sl.no 1di + 1dii + 1diii + 1div + 1dv
471.
Schedule OS In Schedule OS, Sl. No. 6 Net Income from other sources
chargeable at normal applicable rates should be equal to sum
of Sl.no (1(after reducing income related to DTAA portion)- 3
+ 4 + 5)
472.
Schedule OS In Schedule OS, Sl. No. 2 Income chargeable to tax at special
rate should be equal to the sum of Sl. No. 2ai + 2aii + 2b + 2c
+ 2d + 2e elements related to Sl. No. 1
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 35
473.
Schedule OS In schedule OS, Sl. No. 2e, column 10 should be lower of
column 6(rates as per treaty) and column 9(rates as per ITAct)-
For residents
For Non-residents - Sl. No. 2e, column 10 should be lower of
column 6(rates as per treaty) and column 9(rates as per IT Act),
only if TRC flag is Y
474.
Schedule OS In Schedule OS, Sl. No. 1b should be equal to sum of (bi + bii
+ biii + biv + bv + bvi)
475.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
Income should be equal to amount in Sl. No. 1a(i) i.e, normal
dividend - DTAA for Dividend subject to TRC -Adj
Expenditure u/s 57(i)
Adj Expenditure u/s 57(i) = Max (0, exp u/s 57(1) at Sl. No.
3c - Deemed dividend u/s 2(22e) at Sl.No.1a(ii) )
476.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of winnings
from lotteries, crossword puzzles, races, games, gambling,
betting etc. referred to in section 2(24)(ix) should be equal to
Sl. No. 2ai Winnings from lotteries, crossword puzzles etc
chargeable u/s 115BB
477.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Income
by way of winnings from Online games chargeable u/s 115BBJ
should be equal to Sl. No. 2aii Income by way of winnings
from Online games chargeable u/s 115BBJ
478.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
received from a unit in an International Financial Services
Centre, as referred to in sub-section (1A) of section 80LA
chargeable under proviso to section 115A(1)(a)(A) @ 10%
(Including PTI Income) should be equal to Dividend income
selected at Sl.No. 2c and Sl.No. 2d of Schedule OS
479.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
Income u/s 115A(1)(a)(i) & read with clause A of the said
section 115A(1)(a) @ 20% (Including PTI Income) should be
equal to Dividend income selected at Sl.No. 2c and Sl.No. 2d
of Schedule OS
480.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of Income of 2aii should not exceed the
field 2aii "Income by way of winnings from Online games
chargeable u/s 115BBJ"
481.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of all the
dropdown value of Col 2 Amount of income of 1a(i) should not
exceed the field 1a(i) "Dividend income [other than (ii)]"
482.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of income of 1b should not exceed the
field 1b "Interest, Gross"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 36
483.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of Income of 1c should not exceed the
field 1c "Rental income from machinery, plants, buildings, etc.,
Gross"
484.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of income of 1d should not exceed the
field 1d "Income of the nature referred to in section 56(2)(x)
which is chargeable to tax "
485.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of Income of 2ai should not exceed the
field 2ai "Winnings from lotteries, crossword puzzles etc.
chargeable u/s 115BB"
486.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of Income of 2c should not exceed the
field 2c "Any other income chargeable at special rate" above
487.
Schedule OS In Schedule OS - column 3 of table 2e, the sum of dropdown
value of Col 2 Amount of Income of 2d should not exceed the
field 2d "Pass through income in the nature of income from
other sources chargeable at special rates" above
488.
Schedule OS In schedule OS, deduction claimed at Sl. No. 3d or at Sl. No.
8b will not be allowed in case you have opted for benefit of
lower taxation u/s 115BAB
489.
Schedule OS In schedule OS, Sl. No. 1(a) should be equal to Sl. No. 1(a)(i)
+ Sl. No. 1(a)(ii) + Sl. No. 1(a)(iii)
490.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
Income u/s 115AC @ 10% should be equal to Dividend income
selected at Sl. No. 2c and Sl.No. 2d of Schedule OS
491.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
Income (other than units referred to in section 115AB) received
by a FII u/s 115AD(1)(i) @ 20% (Including PTI Income)
should be equal to Dividend income selected at Sl. No. 2c and
Sl.No. 2d of Schedule OS
492.
Schedule OS In Schedule OS, Sl. No. 10 the quarterly break up of Dividend
Income (other than units referred to in section 115AB)
received by a specified fund u/s 115AD(1)(i) @ 10%
(Including PTI Income) should be equal to Dividend income
selected at Sl. No. 2c and Sl.No. 2d of Schedule OS
493.
Schedule OS Interest expenditure u/s 57(1) should not be more than 20% of
the dividend income at Sl. No. 1ai + Sl. No. 1aii in Schedule
OS.
494.
Schedule OS In Schedule OS, Sl.no 2c, "Any other income chargeable at
special rate" should be equal to sum of all the drop downs
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 37
495.
Schedule OS In Schedule OS, Sl.no 2e, "Amount included in 1 and 2 above,
which is chargeable at special rates in India as per DTAA"
should be equal to sum of all the drop downs
496.
Schedule OS In schedule OS, expenses and deduction u/s 57 other than
interest is claimed then corresponding income should be
offered under the head other sources.
497.
Schedule OS In Schedule OS, Sl. No. 2b Income chargeable u/s 115BBE
should be equal to sum of Sl. No. bi + bii + biii + biv+ bv + bvi
498.
Schedule OS To offer income u/s 115BBF, Taxpayer has to be resident and
return has to be filed within the due date, and should be in
receipt of such income
499.
Schedule OS In Schedule OS, Sl. No. 10 the quartely break up of Dividend
Income referred in Sl. No. 1a(iii) should be equal to Sl. No.
1a(iii) Dividend income u/s 2(22)(f) Less DTAA of 1a(iii)
subject to TRC flag
500.
Schedule OS Kindly fill in the details of dividend in Sl.No. 1a(iii) of schedule
OS if buy back loss is claimed in schedule CG
501.
Schedule CYLA Value in 3i of Schedule CYLA should be equal to Sl. No. 2vi of
Table E of Schedule BP.
502. Schedule CYLA In schedule CYLASl. No. 2xvi cannot be more than Rs. 200000
503.
Schedule CYLA In Schedule CYLA "HP loss" at Sl. No. 2i should be equal to
Sl. No. 3 of Schedule HP
504.
Schedule CYLA In schedule CYLA, OS Loss should be equal to loss specified
in Sl. No 6 of Sch OS
505.
Schedule CYLA In Schedule CYLA, Sl.no 4xvi i.e Total loss set off should be
equal to sum of (4ii + 4iii + 4iv + 4v + 4vi + 4vii+ 4viii + 4ix +
4x + 4xi+ 4xiii + 4xiv + 4xv)
506.
Schedule CYLA In Schedule CYLA, Sl.no 2xvii Loss remaining after set-off
should be equal to the output of Sl.No. 2i-2xvi
507.
Schedule CYLA In Schedule CYLA, Sl.no 3xvii i.e. Loss remaining after set-
off should be equal to the output of Sl.No. 3i-3xvi
508.
Schedule CYLA In Schedule CYLA, Sl.no 4xvii i.e. Loss remaining after set-
off should be equal to the output of Sl.No. 4i-4xvi
509.
Schedule CYLA In Schedule CYLA, Col No. 5 Current year's Income remaining
after set off should be equal to the output of Col No. 1-2-3-4
510.
Schedule CYLA In Schedule CYLA Sl. No. 1v, Speculative Income should be
equal to Sl. No. 3ii of Table E Schedule BP
511.
Schedule CYLA In Schedule CYLA, Sl. No 1vi "Specified business Income"
should be equal to Sl. No. 3iii of Table E of Schedule BP
512.
Schedule CYLA In Schedule CYLA, Sl. No. 1vii "Short term capital gain @20%
should be equal to Sl. No. 8ii of item E of Schedule CG
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 38
513.
Schedule CYLA In Schedule CYLA, ,Sl. No 1viii " Short term capital gain
@30%" should be equal to Sl. No. 8iii of item E of Schedule
CG
514.
Schedule CYLA In Schedule CYLA,,Sl. No 1ix" Short term capital gain taxable
at applicable rates" should be equal to Sl.No. 8iv of item E of
Schedule CG
515.
Schedule CYLA In Schedule CYLA ,Sl. No 1x "Short term capital gain taxable
at special rates in India as per DTAA" should be equal to Sl.
No. 8v of item E of Schedule CG
516.
Schedule CYLA In Schedule CYLA Sl. No 1xi " Long term capital gain taxable
@12.5%" should be equal to Sl. No. 8vi of item E of Schedule
CG
517.
Schedule CYLA In Schedule CYLA, Sl. No 1xii " Long term capital gain
taxable at special rates in India as per DTAA" should be equal
to Sl. No. 8vii of item E of Schedule CG
518.
Schedule CYLA In Schedule CYLA, Sl. No 1xiii " Other Source
Income(excluding profit from owning race horses and amount
chargeable to special rate of tax)" should be equal to Sl.No. 6
of Schedule OS
519.
Schedule CYLA In Schedule CYLA, Sl. No 1xiv " Profit from owning and
maintaining race horses" should be equal to Sl.No. 8e of
Schedule OS
520.
Schedule CYLA In schedule CYLA, Value in 1iii should be equal to A38 of
Schedule BP, only if A38 is positive
521.
Schedule CYLA In schedule CYLA , Value in 1iv should be equal to E3iv of
Schedule BP
522.
Schedule CYLA In Schedule CYLA, Sl.no 2xvi i.e Total loss set off should be
equal to sum of (2iii + 2iv + 2v + 2vi + 2vii + 2viii + 2ix + 2x
+ 2xi + 2xii + 2xiii + 2xiv + 2xv)
523.
Schedule CYLA In Schedule CYLA, Sl.no 3xvi i.e Total loss set off should be
equal to sum of (3ii+ 3vii+ 3viii + 3ix + 3x + 3xi + 3xii
+3xiii+3xiv+3xv)
524.
Schedule CYLA In Schedule CYLA Income from other sources taxable at
special rates in India as per DTAA should be equal to Sl. No.
2e of Schedule OS
525.
Schedule CYLA In Schedule CYLA, Normal OS loss should be set off first
against the (i)Profit from the activity of owning and
maintaining race horses & (ii)Income from other sources
taxable at special rates in India as per DTAA
526.
Schedule CYLA In Schedule CYLA, income is available for setoff of losses but
house property loss is not fully setoff
527.
Schedule CYLA In Schedule CYLA sum of amount mentioned in column no 2
+ 3 + 4 should not exceed amount mentioned in column 1
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 39
528.
Schedule BFLA Schedule BFLA Sl.No. 2(i)"Brought forward HP Loss" should
be equal to Sl.No. 4(xviii) "Adjustment of above losses in
Schedule BFLA" of CFL
529.
Schedule BFLA In Schedule BFLA sum of amount mentioned in column no 2 +
3 + 4 should not exceed amount mentioned in column 1
530.
Schedule BFLA Schedule BFLA, amount mentioned at Sl.No. 2(xv) should not
exceed the sum of amount mentioned at Sl.No.. 4xviii + 5cxviii
+ 6xviii + 7xviii + 8xviii + 9xviii + 10xviii + 11xviii of CFL
531.
Schedule BFLA In Schedule BFLA, Col No. 5 Current year's Income remaining
after set off should be equal to the output of Col No. 1 - 2 - 3 -
4
532.
Schedule BFLA In Schedule BFLA, amount mentioned at Sl.No.5 should not
exceed the amount mentioned at Sl.No.1
533.
Schedule BFLA Schedule BFLA Sl.No. 2xv should be equal to sum of Sl.No.
(2i + 2ii + 2iii + 2iv + 2v + 2vi + 2vii +2viii + 2ix + 2x + 2xi
+ 2xiii)
534.
Schedule BFLA Schedule BFLA Sl.No. 5xvi should be equal to sum of Sl.No.
(5i + 5ii + 5iii + 5iv+ 5v + 5vi + 5vii + 5viii + 5ix + 5x + 5xi
+5xii + 5xiii+ 5xiv)
535.
Schedule BFLA In Sch BFLA , the total value in Column no 4xv Brought
forward allowance under section 35(4) set off should be equal
to total of Col. 7 of UD
536.
Schedule BFLA In Sch BFLA , the total value in Column no 3xv Brought
forward depreciation set off Should be equal to total of Col. 4
of UD
537.
Schedule BFLA Schedule BFLA Sl. No. 1i should be equal to Sl. No. (5ii of
schedule CYLA)
538.
Schedule BFLA Schedule BFLA Sl. No. 1ii should be equal to Sl. No. (5iii of
schedule CYLA)
539.
Schedule BFLA Schedule BFLA Sl. No. 1iii should be equal to Sl. No. (5iv of
schedule CYLA)
540.
Schedule BFLA Schedule BFLA Sl. No. 1iv should be equal to Sl. No. (5v of
schedule CYLA)
541.
Schedule BFLA Schedule BFLA Sl. No. 1v should be equal to Sl. No. (5vi of
schedule CYLA)
542.
Schedule BFLA Schedule BFLA Sl. No. 1vi should be equal to Sl. No. (5vii of
schedule CYLA)
543.
Schedule BFLA Schedule BFLA Sl. No. 1vii should be equal to Sl. No. (5viii of
schedule CYLA)
544.
Schedule BFLA Schedule BFLA Sl. No. 1viii should be equal to Sl. No. (5ix of
schedule CYLA)
545.
Schedule BFLA Schedule BFLA Sl. No. 1ix should be equal to Sl. No. (5x of
schedule CYLA)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 40
546.
Schedule BFLA Schedule BFLA Sl. No. 1x should be equal to Sl. No. (5xi of
schedule CYLA)
547.
Schedule BFLA Schedule BFLA Sl.No. 1xi should be equal to Sl.No.(5xii of
schedule CYLA)
548.
Schedule BFLA Schedule BFLA Sl.No. 1xii should be equal to Sl.No.(5xiii of
schedule CYLA)
549.
Schedule BFLA Schedule BFLA Sl.No. 1xiii should be equal to Sl.No.(5xiv of
schedule CYLA)
550.
Schedule BFLA Schedule BFLA Sl.No. 1xiv should be equal to Sl.No.(5xv of
schedule CYLA)
551.
Schedule BFLA Schedule BFLA Sl.No. 2(xiii) should be equal to Sl.No.
11(xvii) of CFL
552.
Schedule BFLA Schedule BFLA Sl.No. 3xv should be equal to sum of Sl.No.
(3i + 3ii + 3iii + 3iv+ 3v + 3vi+ 3vii + 3viii + 3ix + 3x + 3xi
+3xii + 3xiii+ 3xiv)
553.
Schedule BFLA Schedule BFLA Sl.No. 4xv should be equal to sum of Sl. No.
(4i + 4ii + 4iii + 4iv+ 4v + 4vi+ 4vii + 4viii + 4ix + 4x+ 4xi
+4xii + 4xiii+ 4xiv)
554.
Schedule BFLA Schedule BFLA, Sl. No. 2 (vi + vii + viii + ix + x + xi) should
be equal to Sl.No. 9(xviii)+10(xviii) of CFL
555.
Schedule BFLA Schedule BFLA Sl. No. 2(ii+iii+iv+v) "Brought forward
Business Loss other than Speculation and specified business
loss" should be equal to Sl. No. xviii (5+6+7+8) "Adjustment
of above losses in Schedule BFLA " of CFL
556.
Schedule CFL Current year Speculative loss in CFL should be equal to amount
mentioned in field "speculative loss" of schedule BP
557.
Schedule CFL Current year loss from specified business in schedule CFL
should be equal to amount mentioned in field "Income from
specified business u/s 35AD" of schedule BP
558.
Schedule CFL Current year STCG loss in Sch CFL at Sl. No. 9xix should be
equal to Table E (2ix + 3ix + 4ix + 5ix + 6ix ) of Sch CG
559.
Schedule CFL Current year LTCG at Sl. No. 10ix loss in Sch CFL should be
equal to Table E (6ix+7ix) of Sch CG
560.
Schedule CFL Current year HP loss at Sl. No. 4xix in CFL should be equal to
Sl. No. 2xvii of Sch CYLA
561.
Schedule CFL Current year loss from owning & maintaining race horses at
Sl. No. 11xix in schedule CFL should be equal to sl. No 8e of
Sch OS
562.
Schedule CFL Current Year Loss from life insurance business u/s 115B in
CFL should be equal to sl. No 4b of schedule BP
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 41
563.
Schedule CFL Current year Loss from Business & Profession (other than loss
from Insurance business u/s 115B, loss from speculative
business and specified business) i.e sl. No (xix)5c in CFL
should be equal to 3xvii of schedule CYLA
564.
Schedule CFL In schedule CFL, amount at Sl. No. 5b can be entered only if,
assessee is opting for taxation u/s 115BAA
565. Schedule CFL In Schedule CFL, 5c should be equal to 5a- 5b
566. Schedule CFL In Schedule CFL, value at Sl.No. xxi should be equal to xix -
xx
567.
Schedule CFL Total of brought forward losses should be equal to amount
provided in individual AY fields
568.
Schedule CFL In Schedule CFL, value at Sl.No.xxii should be equal to xvii-
xviii+xxi . If result is negative, restrict to "0"
569.
Schedule UD In schedule UD, amount at Sl. No. 3a can be entered only if,
assessee is opting for taxation u/s 115BAA
570.
Schedule UD In Schedule UD, value at Sl. No. 4 cannot be more than Sl.No.
3- Sl. No. 3a in any of the row
571.
Schedule UD In Schedule UD, value at Sl.No.5 should be equal to Sl.No. 3-
Sl. No. 3a - Sl. No. 4
572.
Schedule UD In Schedule UD, value at Sl. No. 8 should be equal to Sl. No. 6
- Sl. No. 7
573.
Schedule UD In Schedule UD, sum of individual row should match with
value at total fields for all columns i.e. column 3 to 8
574.
Schedule UD In Schedule UD, value at Sl. No. 5 for current assessment year
should not exceed the value mentioned at Sl. No. 12iii of Schle
BP
575.
Schedule ICDS Schedule ICDS Sl. No. XI should be equal to the sum of (I +
II + III + IV + V
+ VI + VII + VIII + IX + X) if positive
576.
Schedule ICDS In Schedule ICDS column 5 -Net effect should match with
(Column 3- column 4) for all fields.
577.
Schedule 80GGB In Part A General, "115BAB/ 115BB" is selected for the
question "Have you opted for taxation under section
115BA/115BAA/115BAB" or 115BAB/ 115BA is selected for
the question "If no, whether you are choosing to opt for taxation
under section 115BA/115BAA/115BAB this year?" then
Schedule 80GGB is not required to be filled.
578.
Schedule 80GGB In Schedule 80GGB, if Sl. No. iii is greater than '0', then Sl. No.
iv, vi, ix and x are not required to be filled
579.
Schedule 80GGB In Schedule 80GGB, Sl. No. X is not equal to sum of Sl. No. iii
Donation in cash and Sl. No. iv Donation in other mode
580.
Schedule 80GGB In Schedule 80GGB, Sl. No. A "Donation in cash" is not equal
to total of column iii
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 42
581.
Schedule 80GGB In Schedule 80GGB, Sl. No. B "Donation in other mode" is not
equal to total of column iii
582.
Schedule 80GGB In Schedule 80GGB, Sl. No. C "Total Donation" is not equal to
total of column x
583.
Schedule 80GGB If Gross Total Income in Part B TI is zero, Sl. No. D "Eligible
amount of Donation" can not be more than 0
584.
Schedule 80GGB If deduction under section 80GGB claimed in sl. No (a) of Sch
VI A then its mandatory to fill details in Schedule 80GGB
585.
Schedule 80GGB Deduction u/s 80GGB can be claimed for the Contributions
made between period 01.04.2025 to 31.03.2026 for AY 2026-
27.
586.
Schedule 80GGB In schedule 80GGB, If "contribution in other mode" is > 0, then
"Transaction Reference number for UPI transfer / Cheque
number/IMPS/NEFT/RTGS" and "IFSC code of Bank" is
mandatory
587.
Schedule 80GGB Name and PAN of the political party is necessary to claim
deduction u/s 80GGB
588.
Schedule 80GGC In Part A General, "115BAB/ 115BA" is selected for the
question "Have you opted for taxation under section
115BA/115BAA/115BAB" or 115BAB/ 115BA is selected for
the question "If no, whether you are choosing to opt for taxation
under section 115BA/115BAA/115BAB this year?" then
Schedule 80GGC is not to be filled.
589.
Schedule 80GGC In Schedule 80GGC, if Sl. No. iii is greater than '0', then Sl. No.
Sl. No. iv,vi ix,x are not required to be filled
590.
Schedule 80GGC In Schedule 80GGC, Sl. No. X is not equal to sum of Sl. No. iii
Contribution in cash and Sl. No. iv Contribution in other mode
591.
Schedule 80GGC In Schedule 80GGC, Sl. No. A " Contribution in cash" is not
equal to total of column iii
592.
Schedule 80GGC In Schedule 80GGC, Sl. No. B " Contribution in other mode" is
not equal to total of column iii
593.
Schedule 80GGC In Schedule 80GGC, Sl. No. C "Total Contribution " is not
equal to total of column x
594.
Schedule 80GGC If Gross Total Income in Part B TI is zero, Sl. No. D "Eligible
amount of Contribution" cannot be more than 0
595.
Schedule 80GGC If deduction under section 80GGC claimed in Sl. No (a) of Sch
VI A then its mandatory to fill details in Schedule 80GGC
596.
Schedule 80GGC Deduction u/s 80GGC can be claimed for the Contributions
made between period 01.04.2025 to 31.03.2026 for AY 2026-
27
597.
Schedule 80GGC In schedule 80GGC, If "contribution in other mode" is > 0, then
"Transaction Reference number for UPI transfer / Cheque
number/IMPS/NEFT/RTGS" and "IFSC code of Bank" is
mandatory
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 43
598.
Schedule 80GGC Name and PAN of the political party is necessary to claim
deduction u/s 80GGC
599.
Schedule 80IAC Schedule 80IAC, Amount of deduction claimed is more than
zero but remaining fields are not filled up
600.
Schedule 80IAC Schedule 80IAC, Amount of deduction can be claimed by
entities whose date of incorporation is after 01st April, 2016
601.
Schedule 80IAC Schedule 80IAC will be enabled only when the taxpayer has
selected "Yes" in the field "Whether you are recognized as start
up by DPIIT" in Part A general.
602.
Schedule 80IAC Value claimed in 80-IAC field in Schedule VI A at Sl. No. 2d
cannot be higher than the value in Schedule 80-IAC at Sl. No.
6.
603.
Schedule 80IAC Deduction u/s 80-IAC claimed in "Schedule VI-A" at Sl.No.2d
but "Schedule 80-IAC" is not filled
604.
Schedule 80LA Schedule 80LA, Amount of deduction claimed is more than
zero but section under which the deduction claimed is not
selected
605.
Schedule 80LA Schedule 80LA, Amount of deduction claimed at Sl. No. 8 is
more than zero but remaining field at Sl. No. 1 to 7 is not filled
up
606.
Schedule 80LA In schedule 80LA, type of entity should be enabled based on
the sub-section under which the deduction is claimed
607.
Schedule 80LA In schedule 80LA, type of income of the unit should be enabled
based on the sub-section under which the deduction is claimed
608.
Schedule 80LA Value claimed in 80-LA(1) field in Schedule VI A at Sl.No. 2d
cannot be higher than the value in Schedule 80-LA at Sl.No 8.
609.
Schedule 80LA Deduction u/s 80LA(1) claimed in "Schedule VI-A" at Sl.No.2d
but "Schedule 80LA" is not filled.
610.
Schedule 80LA Value claimed in 80-LA(1A) field in Schedule VI A at Sl.No.
2d cannot be higher than the value in Schedule 80-LA at Sl.No
8.
611.
Schedule 80LA Deduction u/s 80LA(1A) claimed in "Schedule VI-A" at
Sl.No.2d but "Schedule 80LA" is not filled.
612.
Schedule SI In schedule SI, 115BB (Winnings from lotteries, puzzles, races,
games etc.) should match with corresponding income offered
in Sl. No. 2a schedule OS, after reducing applicable DTAA
income, if any.
613.
Schedule SI In schedule SI, 115BBE (Income under section 68, 69, 69A,
69B,
69C or 69D) should match with corresponding income offered
in Sl. No. 2b of schedule OS
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 44
614.
Schedule SI In schedule SI, Income at "115BBG (a) Tax on Transfer of
carbon credits" in schedule SI should match with amount of
income offered in Sl. No. 3e of schedule BP
615.
Schedule SI In schedule SI, Amount of special income u/s 115BBF (Tax on
income from patent)-Income under head business or
profession, offered in schedule SI should match with amount
offered in Sl. No. 3d of schedule BP
616.
Schedule SI In schedule SI, Income from other sources chargeable at
special rates in India as per DTAA should match with
corresponding income offered in Sl. No. 2e of schedule OS
617.
Schedule SI If amount at column (ii) Tax thereon should be equal to taxable
income column (i) multiply by special rate mentioned against
that column except excluding OS DTAA, ,112A @12.5%,
PTI-112A @12.5% or section 115AD(1)(iii)-Proviso (LTCG
on sale of shares or units on which STT is paid @12.5% ,
STCG -DTAA, LTCG- DTAA fields
618.
Schedule SI In Schedule SI tax computed in column (ii) cannot be null if
income in column (i) is greater than zero
619.
Schedule SI Sum of income u/s 115AD (STCG for FIIs on securities where
STT not paid) & Pass Through Income in the nature of Short
Term Capital Gain chargeable @ 30% in Schedule SI should
be equal to corresponding income Sl. No. 5vii of schedule
BFLA
620.
Schedule SI Total of Income (i) of schedule SI should match with sum of
individual line items
621.
Schedule SI Total of all tax on special incomes at "Tax Thereon" (ii) should
be consistent with total tax in schedule SI
622.
Schedule SI 115B income from life insurance business in schedule SI should
be equal to balance income post BFLA i.e Sl. No. 5(iii)
623.
Schedule SI In schedule SI, amount of special income u/s 115BBH (Income
from transfer of virtual digital asset)-Income under head
business or profession, offered in schedule SI should match
with amount offered in Sl. No. 3f of schedule BP
624.
Schedule SI In schedule SI, 115BBJ (Income by way of winnings from
Online games) should match with corresponding income
offered in Sl. No 2a schedule OS, after reducing applicable
DTAA income , if any
625.
Schedule SI In schedule SI, Income from short term capital gains
chargeable at special rates in India as per DTAA should match
with corresponding income offered in Sl. No A9 of schedule
CG
626.
Schedule SI In schedule SI, Income from Long term capital gains chargeable
at special rates in India as per DTAA should match with
corresponding income offered in sl. No B11 of schedule CG
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 45
627.
Schedule SI In schedule SI, 115BBJ (Income by way of winnings from
Online games) should match with corresponding income
offered in Sl. No 2a schedule OS, after reducing applicable
DTAA income , if any.
628.
Schedule SI Sum of income u/s 111A or section 115AD(1)(b)(ii)- Proviso
(STCG on shares units on which STT paid) & Pass Through
Income in the nature of Short Term Capital Gain chargeable @
20% in schedule SI should be equal to corresponding income
in Sl.No. 5vi of schedule BFLA
629.
Schedule SI Sum of income u/s
(i)112(1)(c)(iii) (LTCG for non-resident on unlisted securities
or other than listed debentures),
(ii)115AB (LTCG for non-resident on units referred in
section115AB),
(iii)115AC (LTCG for non-resident on bonds/GDR),
(iv) 112 (LTCG on others)
(v) 112A (LTCG on sale of shares or units on which STT is
paid) or section 115AD(1)(b)(iii)-Proviso
(vi)Pass Through Income in the nature of Long Term Capital
Gain chargeable @ 12.5% u/s 112A
(vii)Pass Through Income in the nature of Long Term Capital
Gain chargeable @ 12.5% other than section 112A
(viii) 112(1) (LTCG on listed securities/ units)
in schedule SI should be equal to Sl. No. 5x schedule BFLA
630.
Schedule SI Amount of special income offered in schedule SI should be
equal to amount offered in corresponding dropdown at Sl.No.
2d in schedule OS.
Note: If status in PartAgeneral is Non-resident, for the purpose
of schedule SI, each of the special income under this category
should be passed after reducing DTAA income as referred to in
2e under given section provided TRC flag is "Yes" in case of
non-resident .
If status in Part A general is Resident, for the purpose of
schedule SI, each of the special income under this category
should be passed after reducing DTAA income as referred to in
2e under given section irrespective of the TRC flag.
631.
Schedule SI Amount of special income offered in schedule SI should be
equal to amount offered in corresponding dropdown at Sl.No.
2c in schedule OS.
Note: If status in PartAgeneral is Non-resident, for the purpose
of schedule SI, each of the special income under this category
should be passed after reducing DTAA income as referred to in
2e under given section provided TRC flag is "Yes" in case of
non-resident .
If status in Part A general is Resident, for the purpose of
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 46
schedule SI, each of the special income under this category
should be passed after reducing DTAA income as referred to in
2e under given section irrespective of the TRC flag.
632.
Schedule SI Income under "111A-Short term capital gains on equity share
or equity-oriented fund chargeable to STT" in schedule SI
should not be more than income offered in sch CG at Sl.
No.A3ie or A4a after reducing DTAA income if any.
633.
Schedule SI Income under "115AD(1)(b)(ii)Proviso- Short term capital
gains referred to in section 111A- by FII" in schedule SI should
not be more than income offered in sch CG at Sl. No. A3iie
after reducing DTAA income if any.
634.
Schedule SI Income under "112(1) (LTCG on listed securities/ units)" in
Schedule SI should not be more than income offered in
schedule CG at Sl. No. B3c after reducing DTAA income if
any.
635.
Schedule SI Income under "112(1)(c)(iii) - LTCG for non-resident on
unlisted securities or other than Listed debentures" in Schedule
SI should not be more than income offered in schedule CG at
Sl. No. B6ic after reducing DTAA income if any.
636.
Schedule SI Income under "112A- LTCG on equity shares/units of equity
oriented fund/units of business trust on which STT is paid" in
Schedule SI should not be more than income offered in
schedule CG at Sl. No. B4 or Col 14 of Schedule 112A after
reducing DTAA income if any.
637.
Schedule SI Income under "115AB(1)(b)- Income by way of long-term
capital gains arising from the transfer of units purchase in
foreign currency by a off-shore fund" in Schedule SI should
not be more than income offered in schedule CG at Sl. No.
B6iic after reducing DTAA income if any.
638.
Schedule SI Income under "115AC(1)(c)- Long term capital gains arising
from their transfer of bonds or GDR purchased in foreign
currency in case of a non-resident" in Schedule SI should not
be more than income offered in schedule CG at Sl. No. B6iiic
after reducing DTAA income if any.
639.
Schedule SI Income under "115AD(1)(b)(ii)- Short term capital gains
(other than on equity share or equity oriented mutual fund
referred to in section 111A) by an FII" in Schedule SI should
not be more than income offered in schedule CG at Sl. No. A5e
after reducing DTAA income if any.
640.
Schedule SI Income under "115AD(1)(b)(iii)- Long term capital gains
(other than on equity share or equity oriented mutual fund
referred to in section 112A)by an FII" in Schedule SI should
not be more than income offered in schedule CG at Sl. No.
B6ivc after reducing DTAA income if any.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 47
641.
Schedule SI Income under "115AD(1)(b)(iii) Proviso- For NON-
RESIDENTS from sale of equity share in a company or unit of
equity oriented fund or unit of a business trust on which STT
is paid under section 112A" in Schedule SI should not be more
than income offered in schedule CG at Sl. No. B7 after
reducing DTAA income if any.
642.
Schedule SI Income under "Pass Through Income in the nature of Short
Term Capital Gain chargeable @ 20%" in Schedule SI should
not be more than income offered in schedule CG at Sl. No. A8a
after reducing DTAA income if any.
643.
Schedule SI Income under "Pass Through Income in the nature of Short
Term Capital Gain chargeable @ 30%" in Schedule SI should
not be more than income offered in schedule CG at Sl. No. A8b
after reducing DTAA income if any.
644.
Schedule SI Income under "Pass Through Income in the nature of Long
Term Capital Gain chargeable @ 12.5% u/s 112A" in Schedule
SI should not be more than income offered in schedule CG at
Sl. No. B10a1 after reducing DTAA income if any.
645.
Schedule SI Income under "Pass Through Income in the nature of Long
Term Capital Gain chargeable @ 12.5% other than section
112A" in Schedule SI should not be more than income offered
in schedule CG at Sl. No. B10a2 after reducing DTAA income
if any.
646.
Schedule EI In Schedule EI, Sl. No. 5 Pass through income not chargeable
to tax should be equal to the amount of exempt income
mentioned in Schedule PTI
647.
Schedule EI In Schedule EI, Sl. No. 6 should be equal to sum of Sl.no 1 +
2(v) + 3 + 4 + 5
648. Schedule EI In Schedule EI, Sl. No. 2v should be equal to sum of Sl. No. i-
ii-iii+iv
649.
Schedule EI In Schedule EI, Sl. No. 2 (iv) Agricultural income portion
relating to Rule 7, 7A, 7B(1), 7B(1A) and 8 should be equal to
Sl. No. 40 of Schedule BP
650.
Schedule EI In Schedule EI, in total of Other exempt income at Sl. No. 3,
should be equal to value entered in individual columns.
651.
Schedule EI In Schedule EI, `Total income not chargeable to tax as per
DTAA' at Sl. No. 4 should be equal to the total of amount
entered in "Amount of Income"
652.
Schedule EI In Schedule EI at Sl. No. 3, if amount mentioned for section
10(23FF) is more than zero please ensure to file form 10-II
653.
Schedule EI In Schedule EI at Sl. No. 3, if amount mentioned for section
10(4D) is more than zero please ensure to file form 10-IG or
form 10-IK
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 48
654. Schedule EI In Schedule EI, if the net agricultural income for the year at
Sl.No. 2v exceeds Rs.5 lakh, below details are mandatory:
a. Name of district along with pin code in which agricultural
land is located
b. Measurement of agricultural land in Acre
c. Whether the agricultural land is owned or held on lease
d..Whether the agricultural land is irrigated or rain-fed
655. Schedule EI Any sub-category dropdown at Sl. No. 3 of Schedule EI can
not be selected more than once
656. Schedule EI Exempt income u/s 10(4)(i), 10(4E), 10(4F), 10(4G), 10(6BB),
10(8A) and 10(15A) cannot be reported by Residents in
Schedule EI
657. Schedule EI Exempt income u/s 10(4C), 10(6A), 10(6B), 10(6C), 10(6D),
10(15B), 10(48), 10(48A) and 10(48B) cannot be reported by
Domestic company in Schedule EI
658. Schedule EI Description is mandatory where amount is more than 0 and
sub-categories "Income exempt as per CBDT Circular" ,or
"Income exempt as per CBDT Notification", or "Receipts not
in the nature of Income" is selected in Schedule EI
659. Schedule EI Selection of Category and sub-category is mandatory in case
amount reported is more than zero in schedule EI
660. Schedule EI Where amount is more than 0 under any sub-categories other
than "Income exempt as per CBDT Circular" , or "Income
exempt as per CBDT Notification", or "Receipts not in the
nature of Income" then Description is not required.
661. Schedule PTI In Schedule PTI, Col. 9 should be equal to Col. 7-8
662.
Schedule PTI In Schedule PTI, Sl. No. iia Short Term should be equal to sum
of ai + aii
663.
Schedule PTI In Schedule PTI, Sl. No. iib Long Term should be equal to sum
of bi + bii
664.
Schedule PTI In Schedule PTI, Sl. No. iii Other Sources should be equal to
sum of a + b
665.
Schedule PTI In Schedule PTI, Sl. No. iv Income claimed to be exempt should
be equal to sum of a+b+c
666.
Schedule MAT In Schedule MAT, Whether the financial statements of the
company are drawn up in compliance to the Indian Accounting
Standards (Ind-AS) specified in Annexure to the companies
(Indian Accounting Standards) Rules, 2015. If Flag is "No"
then Sl. No. 8a & 8b should be greyed off and not allowed be
filled
667.
Schedule MAT The value at field (7) of schedule MAT should be equal to sum
of Sl. No. (4+ 5n - 6l).
668.
Schedule MAT In Schedule MAT, Sl. No. 9. Deemed total income under section
115JB should be sum of (7 + 8e - 8j)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 49
669. Schedule MAT In Schedule MAT, Sl. No. 5n should be sum of Sl. No. 5a to
5m
670. Schedule MAT In Schedule MAT, Sl. No. 6l should be sum of Sl. No. 6a to 6k
671.
Schedule MAT In Schedule MAT, Sl. No. 5a should be minimum of Sl. No. 54
& 55 of Schedule P&L and value entered at Sl. No. 5a of
schedule MAT
672.
Schedule MAT in Schedule MAT Sl. No. 8A. e should be sum of Sl. No. 8Aa
to 8Ad
673.
Schedule MAT in Schedule MAT Sl. No. 8B. j should be sum of Sl. No. 8f to
8i
674.
Schedule MAT As per section 115JB assessee is not liable to compute MAT, if
opting for tax regime under section 115BAA or 115BAB
675.
Schedule MAT in Schedule MAT Sl. No. 9b should be equal to Sl. No. (9- 9a)
676.
Schedule MAT In Schedule MAT, SL. No. 4 - "Profit after tax as shown in the
Profit and Loss Account" should be equal to Sl. No. 56 - "Part
A-P&L / Part A-P&L-Ind AS
677.
Schedule MATC In Schedule MATC Sl.No. 1, Tax under section 115JB in
assessment year 2025-26 should be equal to 1d of PART B-TTI
678.
Schedule MATC In Schedule MATC, Sl. No. 2 should be equal to Sl. No. 2f of
Part BTTI
679.
Schedule MATC In Schedule MATC, Sl. No. 3 should be equal to Sl. No. 2-1.
This rule is applicable only if 2 is greater than 1, otherwise Sl.
No. 3 = 0
680.
Schedule MATC In Schedule MATC, Sl. No. 3 should be equal to zero when Sl.
No. 2 is less than or equal to 1
681.
Schedule MATC In Schedule MATC, Sl.No. 5 Amount of tax credit under
section 115JAA utilized during the year should be equal to
Total of item no. 4c(xvii)
682.
Schedule MATC In Schedule MATC, Sl.No. 6 Amount of MAT liability
available for credit in subsequent assessment years should be
equal to Total of item no. 4Dxviii
683.
Schedule MATC If taxpayer is opting for tax regime under section 115BAA or
115BAB, then MATC should not be filled
684.
Schedule MATC In Schedule MATC, sum of individual row should match with
value at total fields for all columns i.e. (i) Col. B1
(ii) Col. B2
(iii) Col. B3
(iv) Col. C
(v) Col. D
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 50
685.
Schedule MATC In Part-AGeneral, if Type of Company is selected as "Domestic
company" then Schedule MAT/MATC are to be filled
686.
Schedule MATC Schedule MAT/MATC is applicable if Type of company
selected as "Foreign Company" and "Yes" is selected for "In the
case of non-resident, is there a Permanent Establishment (PE)
in India" or "Yes" is selected for "Whether assessee is required
to seek registration under any law for the time being in
force relating to companies? in Part A General 1
687.
Schedule TPSA In Schedule TPSA, Income tax payable should be 18% of
amount of primary adjustment
688.
Schedule TPSA In Schedule TPSA, Surcharge should be 12% of amount of
Additional income tax payable
689.
Schedule TPSA In Schedule TPSA, Health & Education cess should be 4% of
amount of Additional income tax payable + Surcharge
690.
Schedule TPSA In Schedule TPSA, total additional tax payable should be sum
of Additional income tax payable + Surcharge + Health &
education cess
691.
Schedule TPSA In Schedule TPSA, the amount in taxes paid should be equal to
the sum of amount deposited
692.
Schedule TPSA In Schedule TPSA, the net tax payable should be equal to the
difference of total additional tax payable and taxes paid
693.
Schedule TPSA In Part A-OI, field "Whether the assessee has entered into an
impermissible avoidance arrangement, as referred to in section
96, during the previous year" is selected as "yes" schedule
TPSA cannot be blank
694.
Schedule TPSA In schedule TPSA, Date at which tax is deposit cannot be after
System Date
695.
Schedule 115TD In "Schedule 115TD", value at field '3' "Net value of assets"
should be equal to the value of Sl.No.1 - Sl.No.2u
696.
Schedule 115TD In "Schedule 115TD", value at field '4(iv)' "Total " should be
equal to sum of values at Sl.No. 4i + 4ii + 4iii
697.
Schedule 115TD In "Schedule 115TD", value at field '6' "Accreted income as per
section 115TD " should be equal to values at Sl.No. [3 - (4 - 5)]
698.
Schedule 115TD In "Schedule 115TD", value at field '12' "Net
payable/refundable " should be equal to values at Sl.No. [10 -
11]
699.
Schedule 115TD In Schedule 115TD, assessee has entered Accreted income u/s
115TD and field Sl.No. 9 "Specified date u/s 115TD" is blank
700.
Schedule 115TD Income entered in return and tax is not computed on the same
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 51
701.
Schedule FSI In schedule FSI, Tax relief available (Column e) should be
lower of tax paid outside India (column c) or Tax payable on
such income under normal provisions in India (Column d)
702. Schedule FSI Schedule FSI is not applicable for non-residents
703.
Schedule FSI In Schedule FSI, Total should be equal to sum of Sl. No.
(i+ii+iii+iv)
704.
Schedule FSI If tax relief is claimed against House Property in Schedule FSI
then amount shown in House property in Sl. No. 1k+2 should
not be less than the amount of income shown under House
property in Schedule FSI
705.
Schedule FSI If tax relief is claimed against Business or Profession in
Schedule FSI then amount shown in Business Income in Sl.
No. D of Trading Account + Positive values of Sl. No. 14 of
schedule Profit and loss should not be less than the amount of
income shown under Business or Profession in Schedule FSI
706.
Schedule FSI If tax relief is claimed against Capital Gains in Schedule FSI
then amount of Income shown in Capital gains should not be
less than the amount of income shown under Capital gains in
Schedule FSI
707.
Schedule FSI If tax relief is claimed against other sources in Schedule FSI
then amount of Income shown in other sources should not be
less than the amount of income shown under the head other
sources
708.
Schedule TR In schedule TR, Sl. No. 2 "Total Tax relief available in respect
of country where DTAAis applicable (section 90/90A)" should
be equal to total of column d "Total tax relief available"
wherever section 90/90A is selected in column e "Section
under which relief claimed"
709.
Schedule TR In schedule TR, Sl. No. 3, Total Tax relief available in respect
of country where DTAA is not applicable should be equal to
total of column d "Total tax relief available" wherever section
"91" is selected in column e "Section under which relief
claimed"
710.
Schedule TR In schedule TR, Sl. No. 2+3 is should be equal to sum total of
column 1d
711. Schedule TR Schedule TR is not applicable for non residents
712.
Schedule TR In Schedule TR, Col C "Total taxes paid outside India should
be equal to total of Col. C of Schedule FSI in respect of each
country
713.
Schedule TR In Schedule TR, Col d Total tax relief available should be equal
to total of Col. E of Schedule FSI in respect of each country
714.
Schedule GST If "GSTIN No." is filled then "Annual Value of Outward
Supplies as per the GST Return Filed" is to be mandatorily
filled.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 52
715.
Schedule GST If "Annual Value of Outward Supplies as per the GST Return
Filed" is filled then "GSTIN No." is to be mandatorily filled.
716.
Part B - TI In "Schedule PART B - TI", value of `2v' "Total" should be
equal to the sum of (2i + 2ia + 2ii + 2iii + 2iv)
717.
Part B - TI In "Schedule PART B - TI" , value of '3a(v)' "Total Short-term"
should be equal to the sum of (ai + aii + aiii + aiv) .
718.
Part B - TI In "Schedule PART B - TI", value of '3b(iii )' Total Long-term
should be equal to the sum of (bi + bii )
719.
Part B - TI In "Schedule PART B - TI" , value of '3c' "Total capital gains"
should be equal to the sum of (3av + 3biii )
720.
Part B - TI In "Schedule PART B - TI", value of `4d' "Total" should be
equal to the sum of (4a + 4b + 4c)
721.
Part B - TI In schedule -Part B TI the value in pt. 5 should be EQUAL TO
total of pt. (1 + 2v + 3e+ 4d)
722.
Part B - TI In "Schedule PART B - TI", value of `2i'Profits and gains from
business other than speculative business and specified business
should be equal to "A38 of Schedule-BP"
723.
Part B - TI In schedule Part B-TI, Sl. No. 3ai "Income claimed in Short
term chargeable @20%" >0 , then it is mandatory to fill Table
E in Sch CG and amount in part B TI should be equal to 8ii of
item E of schedule CG
724.
Part B - TI In schedule Part B-TI, Sl. No. 3aii Income claimed in Short term
chargeable @30% >0 , then it is mandatory to fill Table E in
Sch CG and amount in part B TI should be equal to 8iii of item
E of schedule CG
725.
Part B - TI In schedule Part B-TI, Sl. No. 3aiii , Income claimed in STCG
chargeable at applicable rate, >0 , then it is mandatory to fill
Table E in Sch CG and amount in part B TI should be equal to
8iv of item E of schedule CG
726.
Part B - TI In schedule Part B-TI, Sl. No. 3aiv- Income claimed in STCG
chargeable at special rates in India as per DTAA>0 , then it is
mandatory to fill Table E in Sch CG and amount in part B TI
should be equal to 8v of item E of schedule CG
727.
Part B - TI In schedule Part B-TI, Sl. No. 3bi - Income claimed in Long
term chargeable @12.5% > 0 , then it is mandatory to fill Table
E in Sch CG and amount in part B TI should be equal to equal
to 8vi of item E of schedule CG
728.
Part B - TI In schedule Part B-TI, Sl. No. 3biii- Income claimed in LTCG
chargeable at special rates in India as per DTAA>0 , then it is
mandatory to fill Table E in Sch CG and amount in part B TI
should be equal to equal to 8vii of item E of schedule CG
729.
Part B - TI If Sl. No. 4a of Sch-Part B TI >0, then it is mandatory to fill
schedule OS or amount at Sl. No. 4a of schedule -Part B TI
should be equal to Sl. No. 6 of Sch OS
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 53
730.
Part B - TI If Sl. No. 4b of Sch-Part B TI >0, then it is mandatory to fill
schedule OS or amount at Sl. No. 4b of schedule -Part B TI
should be equal to Sl. No. 2 of Sch OS
731.
Part B - TI If Sl. No. 4c of Sch-Part B TI >0, then it is mandatory to fill
schedule OS or amount at Sl. No. 4c of schedule -Part B TI
should be equal to Sl. No. 8e of Sch OS
732.
Part B - TI In Part B-TI Sl. No. 6 Losses of current year set off against
income from all the heads should be equal to total of "2xvi" ,
"3xvi " and "4xvi of Schedule CYLA
733.
Part B - TI The value in Pt 8- Brought forward losses set off against 7 of
Part B TI should be equal to total value in field 2xv, 3xv and
4xv of Schedule BFLA
734.
Part B - TI Gross Total Income(Sl. No 9) is not equal to Total of head wise
income(Sl. No.5) - Losses of current year set off against 5(Sl.
No.6) - Brought forward losses set off (Sl. No. 8) in Schedule
Part B TI. If negative, GTI to be restricted to Zero
735.
Part B - TI If Deduction u/s 10AA is claimed in Part B TI, Schedule
10AA shall be filled
736.
Part B - TI In schedule Part B -TI, Total Income" should be same "Total
of (GTI minus Chapter VI-A deductions & deduction u/s
10AA) after considering rounding-off"
737.
Part B - TI If Deductions claimed at Point No. 11b of "Part B TI" then
"Schedule VI-A Part C" should be filled!
738.
Part B - TI In schedule part BTI- Deduction u/s 10AAshould be consistent
with the deduction mentioned in schedule 10AA'but cannot
exceed Sl. No. 9-10-11c of Part B TI
739.
Part B - TI In Part B-TI, Sl. No. 16 .Net agricultural income/ any other
income for rate purpose should be equal to Sl. No 2v of
schedule EI
740.
Part B - TI In schedule part B TI, deduction under chapter VI-A, Part-C
should be equal to Sl.No. 2 of schedule VI-A but cannot exceed
ii5 of schedule BFLA as reduced by presumptive income u/s
44AE "36 (i) of schedule BP
741.
Part B - TI In "Schedule PART B - TI", value at field `11(c)' "Total (11a +
11b)" should be equal to "11a + 11b" (limited to 9-10).
742.
Part B - TI In "Schedule PART B - TI", value of `2ii' Profits and gains
from speculative business should be equal to "E3(ii)" at table
"E of Schedule BP."
743.
Part B - TI In "Schedule PART B - TI", value of `2iii' Profits and gains
from specified business should be equal to "E3(iii)" at table "E
of Schedule BP."
744.
Part B - TI Income offered u/s 115BBF, 115BBG, 115BBH & 115B in Sl.
No. 2(iv) of Part B TI should be equal to sum total of value at
field (A3d), (A3e), (A3f) & 3iv of Table E of schedule BP.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 54
745.
Part B - TI In Part BTI, deemed income under section 115JB should be
equal to Sl. No. 9 of Schedule MAT
746.
Part B - TI In schedule part B TI, deduction under chapter VI-A, Part B
should be equal to Sl. No. 1 of schedule VI-A
747.
Part B - TI In Part B TI, the value in Pt 17-Losses of current year to be
carried forward should be equal to sum total of row xxi of
Schedule CFL or If the return is filed u/s 139(4) - after due date,
carry forward of current year losses other than HP loss will not
be allowed.
748.
Part B - TI In Schedule part B TI, Sl. No. 14 Income chargeable to tax at
special rate under section 111A, 112, 112A etc, should be
consistent with sum total of special incomes of Schedule SI
749.
Part B - TI In schedule Part B -TI, Sl. No. 15 "Income chargeable to tax at
normal rates" is not matching with the difference of Sl. No. 13-
Sl. No. 14 after considering rounding-off"
750.
Part B - TI In "Schedule PART B - TI", value of `1' `Income from house
property' should be equal to value at "Sl. No. 3 of Schedule-
HP"
751.
Part B - TI In Part B-TI, SL. No. 10 - Income chargeable to tax at special
rate under section 111A, 112,112A etc. included in 9 should be
equal to total of Sl. No. (i) of schedule SI
752.
Part B - TI In schedule Part B-TI, Income offered in Capital gain
chargeable @ 30% u/s 115BBH, is not matching with Sl. No.
C2 of Sch CG
753.
Part B - TI Amount of "Total Capital Gains" is not equal to sum of Sl. No.
3c 'Sum of Short-term/Long-term capital gains' & 3d 'Capital
gain chargeable @ 30% u/s 115BBH'.
754.
Part B - TI In "Schedule PART B - TI" , value of '2ia' "Income of Foreign
company from eligible business of selling raw diamonds (refer
rule 10TIA)" should be equal to "E3(iva)" at table "E of
Schedule BP."
755.
Part B - TTI In Part B TTI Sl. No. 2b should be equal to total of Col.(ii) of
Schedule SI
756.
Part B - TTI Tax credit shown by assessee in Part B-TTI/ Tax Paid schedule
shall be consistent with the claims made in schedules IT
757.
Part B - TTI In Part B TTI, the value in pt. 2c should be equal to the total of
(2a + 2b )
758.
Part B - TTI In Part B TTI, the value in pt. 2f should be equal to total of (2c
+ 2diii +2e)
759.
Part B - TTI Tax Relief claimed under Section 90/90A in Part B TTI at Sl.
No. 6a should be equal to amount entered in Sl. No 2 of
Schedule TR.
760.
Part B - TTI Tax Relief claimed under Section 91 in Part B TTI at Sl. No. 6b
should be equal to amount entered in Sl. No 3 of Schedule TR.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 55
761.
Part B - TTI "Total Tax Relief" in Part B TTI at Sl. No. 6c should be same
as the sum of (Relief u/s 90/90A at Sl. No. 6a and Relief u/s 91
at Sl. No. 6b ).
762.
Part B - TTI In Part B TTI , the value in pt. 8e should be equal to total of
(8a + 8b + 8c+8d+8da) .
763.
Part B - TTI In Part B TTI, the value in pt. 9 should be equal to the total of
(7 + 8e)
764.
Part B - TTI In Part B TTI, the value in point 10e should be equal to (10a
+10b + 10c + 10d).
765. Part B - TTI IFSC under "Bank Details" should tallied with the RBI
database
766.
Part B - TTI Schedule Part-B TTI, Sl. No. 12 should be equal to the sum of
Sl. No. 10e - 9 (only if the difference is positive)
767.
Part B - TTI If in Schedule Part-B TTI, Sl. No. 11 should be equal to the
sum of Sl. No. 9 - 10e (only if the difference is positive)
768.
Part B - TTI In "PART B- TTI", value at Sl. No. `3' "Gross tax payable"
should be equal to higher of value at Sl. No. 1d "Total Tax
Payable on deemed total income u/s 115JB" or value at Sl. No.
2f "Gross tax liability"
769.
Part B - TTI In Schedule Part BTTI, Tax payable after credit u/s 115JAA at
Sl. No. 5, should be equal to sum of Sl. No. 3 -4
770.
Part B - TTI In "PART B- TTI", value at Sl. No. `7'"Net tax liability" should
be equal to value of Sl. No. 5 - Sl. No. 6c
771.
Part B - TTI The value in pt. 1a -Tax payable on deemed total income under
section 115JB should be equal to Value at Sl. No. 10 of
Schedule
MAT
772.
Part B - TTI In Part B TTI, Sl. No. 4 "Credit under section 115JAA of tax
paid in earlier years" should be equal to Sl. No. 5 of Schedule
MATC
773.
Part B - TTI In Part B TTI, the value in pt. 4-Credit under section 115JAA
of tax paid in earlier years cannot be claimed if Sl. No. 2f is
less than Sl. No. 1d
774.
Part B - TTI "Total Tax Payable on Deemed Total Income u/s 115JB"
should be equal to sum of (Tax Payable on Deemed Income
plus Surcharge plus Cess).
775.
Part B - TTI In "Schedule Part B TTI" point "Advance Tax" paid should be
equal to the sum of total Tax Paid in schedule IT where date of
deposit is between 01/04/2025 and 31/03/2026 .
776.
Part B - TTI In "Schedule Part B TTI" Self-Assessment Tax should be equal
to the sum of total Tax Paid in schedule IT where date of
deposit is after 31/03/2026 for A.Y. 2026-27
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 56
777.
Part B - TTI In Schedule Part B-TTI, Sl. No. 10c "TCS" should be equal to
the sum of column 7(i) of Schedule TCS
778. Part B - TTI In Schedule Part B-TTI, Sl. No. 10b "TDS" should be equal to
the sum of column 9 of Schedule TDS 1 & Schedule TDS 2
779. Part B - TTI In Schedule Part B-TTI, Sl.No. 13 - "Net tax payable on 115TD
income including interest u/s 115TE " should match with Sl. No.
12 of Schedule 115TD.
780. Part B - TTI In schedule Part B-TTI, Tax payable u/s 115TD after adjustment
of refund if any at Sl. No. 14 should be Sl. No. 13 less Sl. No.
12
781. Part B - TTI In schedule Part B-TTI, Sl. No. 15 Net refund after adjustment
as per Sl. No. 14 should be Sl. No. 12 less Sl. No. 13
782. Part B - TTI Schedule FAhas to be filled if Sl.No.17 of Part B-TTI is selected
as "Yes"
783. Part B - TTI Fees for furnishing revised return under 234-I shall be equal to
Rs. 1000 if ITR is filed after 31/12/2026 and filing section is
139(5) and total income does not exceed Rs. 5lakh.
784. Part B - TTI Fees for furnishing revised return under 234-I shall be equal to
Rs. 5000 if ITR is filed after 31/12/2026 and filing section is
139(5) and total income exceeds Rs.5lakh.
785. Schedule IT In Schedule IT, Total of col 5 Tax Paid/Amount should be equal
to sum of individual values
786. Schedule FA If any field at Sl. No. A1, A2, A3, A4, B, C, D, E, F or G of
Schedule FA is filled and any of the remaining fields of that
particular entry of respective Sl. No. is not filled
787. Schedule TDS In Schedule TDS (As per Form 16A/16B/16C/16D)/TCS, year
of tax deduction cannot be `0'/ `null'if there is a claim brought
forward of TDS
788. Schedule TDS In Schedule TDS -1 or TDS 2 total of "TDS Credit claimed this
year" should be equal to sum of individual values
789. Schedule TDS In Schedule TDS -1 or TDS-2, Unclaimed TDS brought forward
& details of TDS of current FY should be provided in different
rows
790. Schedule TDS In Schedule TDS, 18B1, Details of TDS on Income (As per
16A furnished by Deductor) or Schedule TDS, 18B2, Details
of TDS on Income (As per 16B/16C/16D furnished by
Deductor), TDS credit claimed this year in col. No. 9 cannot be
more than Gross amount disclosed in col.no.11
791. Schedule TDS In Schedule TDS, 18B1, Details of TDS on Income (As per
16A furnished by Deductor), if TDS is claimed then
Corresponding Income/ withdrawals offered - "Gross Amount
" and "Head of Income" is to be mandatorily filled.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 57
792. Schedule TDS In Schedule TDS, 18B2, Details of TDS on Income (As per
16B/16C/16D furnished by Deductor),, if TDS is claimed then
Corresponding Income offered - "Gross Amount " and "Head
of Income" is to be mandatorily filled.
793. Schedule TDS TDS Claimed from the other person, shall not exceed TDS
deducted on such person in schedule TDS on Income (As per
16A furnished by Deductor)
794. Schedule TDS In Schedule TDS 1 & TDS 2, TDS credit relating to other
person is selected but the PAN of other person is not provided
or TDS credit is claimed in other person's hand but PAN of
other person is not provided
795. Schedule TDS In Schedule TDS, 15B1, Details of TDS on Income (As per
16A furnished by Deductor) or Schedule TDS, 15B2, Details
of TDS on Income (As per 16B/16C/16D furnished by
Deductor), if TDS credit relating to other person is selected
then TAN of the Deductor/ PAN of Tenant/ Buyer should be
filled
796. Schedule TDS In Schedule TDS, applicable dropdown in column 2 should be
selected
797. Schedule TDS In Schedule TDS, applicable dropdown in column 4a should be
selected
798. Schedule TDS In Schedule TDS, column 13, 'TDS credit being carried
forward' should be equal to column 6 + 7 + 8 - 9 - 10
799. Schedule TCS In Schedule TCS total of col 7(i) "Claimed in own hands"
should be equal to sum of individual values
800. Schedule TCS In Schedule TCS, Unclaimed TCS brought forward & details of
TCS of current FY cannot be entered in same rows
801. Schedule TCS TCS Claimed in own hands & in hands of any other person,
shall not exceed TCS brought forward, TCS collected in own
hands & TCS collected in hands of any other person in
schedule TCS
802. Schedule TCS In Schedule TCS, TCS credit relating to other person is
selected but the PAN of other person is not provided or TCS
credit is claimed in other person's hand but PAN of other person
is not provided
803. Schedule TCS In Schedule TCS, applicable dropdown in column 2(i) should
be selected
804. Schedule TCS In schedule TCS, Tax deduction and Tax collection account no.
of the collector should be provided
805. Schedule TCS In Schedule TCS, column 8, 'TCS credit being carried forward'
should be equal to column 5 + column 6 - column 7
806. Schedule 80G If deduction under section 80G claimed in Sl. No (a) of Sch VI
A then its mandatory to fill details in Schedule 80G
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 58
807. Schedule 80G In Sch 80G Donee PAN cannot be same as "Assessee PAN" or
"PAN at Verification"
808. Schedule 80G In Schedule 80G if value at field Total field of "Eligible
amount of Donations" (E in Schedule 80G) cannot be more
than value at field "Total Donations"(E in Schedule 80G)
809. Schedule 80G In Sch 80G, Sl. No. A, B, C & D Amount donated in cash should
not exceed Rs. 2000
810. Schedule 80G In Sch 80G, Total Donation at pointA, B, C & D should be equal
to the sum of Donation in Cash and Donation in other mode.
811. Schedule 80G In Sch 80G, Total Donation at point E should be equal to the
sum of (Aix+Bix+Cix+Dx)
812. Schedule 80G Assessee is claiming deduction u/s 80G more than qualifying
limit.
813. Schedule 80G In schedule 80G, If PAN is already entered in anyone of the set
of blocks (i.e 100%, 50%, with Qualifying limit, without
Qualifying limit) then same PAN cannot be entered in any
other block
814. Schedule 80G In Schedule VIA, value at Sl. No. 1a of system calculated
value of 80G should match with value at eligible donation at
Sl. No. E in Schedule 80G
815. Schedule 80G Deduction under Part B cannot be claimed if New tax regime is
selected (115BAA or 115BAB)
816. Schedule 80G In schedule 80G, If "contribution in other mode" is > 0, then
"Transaction Reference number for UPI transfer / Cheque
number/IMPS/NEFT/RTGS" and "IFSC code of Bank" is
mandatory
817. Schedule 80G PAN of donee shall be mandatory in case donation amount is
more than Zero in schedule 80G
818. Schedule 80GGA In Sch 80GGA, Total Donation should be equal to the sum of
Donation in Cash and Donation in other mode.
819. Schedule 80GGA In Sch 80GGA, Total Donation should be equal to the sum of
(i+ ii)
820. Schedule 80GGA In Sch 80GGA, Amount donated in cash should not exceed Rs.
2000
821. Schedule 80GGA In Sch 80GGA Donee PAN should not be same as "Assessee
PAN" or "PAN at Verification"
822. Schedule 80GGA If deduction u/s 80GGA is claimed in Sch VI A, details shall be
provided in Schedule 80GGA
823. Schedule 80-IA In "Schedule 80-IA" Total deductions under section 80-IA
should be equal to the value entered in (a + b + c)
824.
Schedule 80-IB Total of Schedule 80-IB should be equal to sum of all individual
line items i.e. (Total of a to d)
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 59
825. Schedule 80IE Schedule 80- 80IE Sl. No. ai should be equal to sum of Sl. No.
(aa + ab + ac + ad + ae + af + ag + ah)
826. Schedule 10AA Schedule 10AA value at field "Total deduction under section
10AA" in schedule 10AA should be equal to sum of "amount
of deduction"
827. Schedule IF In Schedule BP, Sl. No. A5a -Share of income from firm(s) or
Sl. No. A5b - Share of income from AOP/ BOI cannot be more
than the "Amount of share in the profits" column of schedule
IF.
828. Schedule VI-A Value claimed in 80-IA field in sch VI A at Sl. No. 2e cannot be
higher than the value in Sch 80-IA at Sl. No. 2d
829.
Schedule VI-A Assessee cannot claim deduction u/s 80IA in Sl. No. 2e of
schedule VI-A without filling Schedule 80IA
830. Schedule VI-A Value claimed in 80-IB at Sl. No. 2h of Sch VI A cannot be
higher than the value in Sch 80-IB at "Sl. No. e"
831. Schedule VI-A In schedule VI-A, Sl. No. 2h - Deduction u/s 80-IB cannot be
claimed unless schedule 80-IB is filled
832. Schedule VI-A Value claimed in 80 80IE at Sl. No. 2j in Sch VI A cannot be
higher than the value in Sch 80-80IE (Sl. No. b)
833. Schedule VI-A In schedule VI-A, Sl. No. 2j, Deduction u/s 80- IE cannot be
claimed unless schedule 80- IE is filled.
834. Schedule VI-A In Schedule VI-A Sl. No. 3 should be equal to total of Sl. No.
1 & 2
835. Schedule VI-A In Schedule VI-A Sl. No. 1 "Total Deduction under Part B (a +
b + c + d)" should be equal to sum of Sl. No. a "80G" + b
"section 80GGB" + Sl. No. c "section 80GGA" + Sl. No. d
"section 80GGC"
836. Schedule VI-A Sl. No.1(c) of Part B in Schedule VI-A: 80GGA is only allowed
to assessee having no Business Income.
837. Schedule VI-A In schedule VIA, date of distribution of dividend cannot be
after "one month prior to the date for furnishing the return of
income under sub-section (1) of section 139" for deduction
claimed under section 80M
838. Schedule VI-A In Schedule VIA, both 80LA(1) and 80LA(1A) cannot be
claimed together
839. Schedule VI-A In Sch VIA 80LA(1A) can be claimed only if in Part A
General, "Whether assessee is located in an International
Financial Services Centre and derives income solely in
convertible foreign exchange?" is selected as "Yes"
840. Schedule VI-A In Sch VIA 80LA(1) can be claimed only if in Part A General,
"Whether assessee is located in an International Financial
Services Centre and derives income solely in convertible
foreign exchange?" is selected as "No"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 60
841. Schedule VI-A Deduction claimed u/s 80M cannot exceed dividend income
offered in schedule OS and schedule BP subject to maximum
of balance income at Sl. no. xiii(5) and ii(5) of schedule BFLA
842. Schedule VI-A Foreign company cannot claim deduction u/s 80M
843. Schedule VI-A Deduction u/s 80PA shall not be allowed if the nature of
business code is selected other than 1001 to 1018 from
schedule nature of business
844. Schedule VI-A In schedule VI-A if deduction u/s section 80M is claimed then
it is mandatory to select one of the options from dropdown as
Schedule OS or Schedule BP as applicable
845. Schedule VI-A In Schedule VI-A, to claim Deduction u/s 80PA, "Yes" should
be selected to question "Whether the company is a producer
company as defined in Sec.581A of Companies Act, 1956?" in
Part A-General
846. Schedule VI-A In Schedule VI-A, Deduction u/s 80GGB is not allowed if type
of company is selected as foreign company.
847. Schedule VI-A If opting for lower taxation under section 115BA, following
deductions cannot be claimed:
(i) Schedule 10AA or
(ii) Schedule 80 or
(iii) Part C deductions under chapter VI-A other than 80JJAA
848. Schedule VI-A If opting for lower taxation under section 115BAB, following
deductions cannot be claimed:
(i) Schedule 10AA or
(ii) Schedule 80 or
(iii) Part B & C deductions under chapter VI-A other than
80JJAA or 80M
849. Schedule VI-A If opting for lower taxation under section 115BAA, following
deductions cannot be claimed:
(i) Schedule 10AA or
(ii) Schedule 80 or
(iii) Part B & C deductions under chapter VI-A other than
80JJAA and 80LA(1A) or 80M.
850. Schedule VI-A In Schedule VI-A Sl. No. 2"Part C - Deduction in respect of
certain incomes" should be equal to total of Sl. No. e "section
80-IA" to Sl. No. p "section 80PA"
851. Schedule VI-A Eligible amount of deduction claimed u/s 80G should not be
more than user entered amount
852. Schedule VI-A Eligible amount of deduction claimed u/s 80GGB should not be
more than user entered amount
853. Schedule VI-A Eligible amount of deduction claimed u/s 80GGA should not be
more than user entered amount
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 61
854. Schedule VI-A Eligible amount of deduction claimed u/s 80GGC should not be
more than user entered amount
855. Schedule VI-A Eligible amount of deduction claimed u/s 80IAB should not be
more than user enterable amount
856. Schedule VI-A Eligible amount of deduction claimed u/s 80IAC should not be
more than user enterable amount
857. Schedule VI-A Eligible amount of deduction claimed u/s 80IB should not be
more than user enterable amount
858. Schedule VI-A Eligible amount of deduction claimed u/s 80IBA should not be
more than user enterable amount
859. Schedule VI-A Eligible amount of deduction claimed u/s 80IE should not be
more than user enterable amount
860. Schedule VI-A Eligible amount of deduction claimed u/s 80JJA should not be
more than user enterable amount
861. Schedule VI-A Eligible amount of deduction claimed u/s 80JJAA should not be
more than user enterable amount
862. Schedule VI-A Eligible amount of deduction claimed u/s 80LA should not be
more than user enterable amount
863. Schedule VI-A Eligible amount of deduction claimed u/s 80LA (Certain
income of International Financial Services Unit ) should not be
more than user enterable amount
864. Schedule VI-A Eligible amount of deduction claimed u/s 80M should not be
more than user enterable amount
865. Schedule VI-A Eligible amount of deduction claimed u/s 80PA should not be
more than user enterable amount
866. Schedule VI-A Eligible amount of deduction claimed u/s 80-IA should not be
more than user entered amount
867. Verification In Part A General "Name of the representative, Capacity of the
representative, Address of the representative and Permanent
Account Number (PAN)/ Aadhaar of the representative" is
mandatory if in schedule "Verification" Verification capacity is
selected as "Representative" from drop down
868. Verification In case of domestic company, PAN entered at "Verification"
should match with any of the PAN entered at "Key persons"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 62
2.2 Category B:
Table 3: Category B Rules
S. No. Schedule Scenarios
1.
Part A - General
Information
If assessee is liable to audit u/s 44AB, then it is mandatory to file
tax audit report u/s 3CA-3CD / Form 3CB-3CD online.
2.
Part A - General
Information
if income declared in section 44AD then it is mandatory to upload
Audit report u/s 44DA in Form 3CE on or before due date.
3.
Part A - General
Information
If 115BAis selected from "Have you opted for taxation under section
115BA/115BAA/115BAB?" then "Date of filing" and
"Acknowledgement number" should match with Date and Ack in DB
of form 10IB from AY 2017-18 to AY 2025-26
or
If 115BA is selected from "If yes, Please provide the date of filing of
relevant form (10-IB/10-IC/10-ID) & acknowledgment number"
then "Date of filing" and "Acknowledgement number" should match
with Date and Ack in DB of form 10IB filed in AY 2026-27.
Note: Ack & Date combination should match with any of the valid
form available in the back end
4.
Part A - General
Information
If 115BAA is selected from "Have you opted for taxation under
section 115BA/115BAA/115BAB?" then "Date of filing" and
"Acknowledgement number" should match with Date and Ack in DB
of form 10IC from AY 2020-21 to AY 2025-26
or
If 115BAA is selected from "If yes, Please provide the date of filing
of relevant form (10-IB/10-IC/10-ID) & acknowledgment number"
then "Date of filing" and "Acknowledgement number" should match
with Date and Ack in DB of form 10IC filed in AY 2026-27
Note: Ack & Date combination should match with any of the valid
form available in the back end
5.
Part A - General
Information
If 115BAB is selected from "Have you opted for taxation under
section 115BA/115BAA/115BAB?" then "Date of filing" and
"Acknowledgement number" should match with Date and Ack in DB
for form 10ID from AY 2020-21 to AY 2025-26
or
If 115BAB is selected from "If yes, Please provide the date of filing
of relevant form (10-IB/10-IC/10-ID) & acknowledgment number"
then "Date of filing" and "Acknowledgement number" should match
with Date and Ack in DB of form 10ID filed in AY 2026-27
Note: Ack & Date combination should match with any of the valid
form available in the back end
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 63
6.
Part A - General
Information
If deduction under subsection (2AB) of section 35 of the Act relating
to in-house scientific research and development facility then Form
3CLA-Report from an accountant is required to be filed
7.
Part A - General
Information
Since you have selected a2i as "More than Rs. 1 crore and up to Rs.
10 crores" and either of a2ii or a2iii is selected as "More than 5%"
in Schedule Part A General Information, you are liable to audit u/s
44AB.
8.
Part A - General
Information
If "None of the above" is selected from "Have you opted for taxation
under section 115BA/115BAA/115BAB?" or from "If yes, Please
provide the date of filing of relevant form (10-IB/10-IC/10-ID) &
acknowledgment number" and valid Form 10-IB /Form 10-IC/ Form
10-ID is available
9.
Part A - General
Information
If "No" is selected for "If no, whether you are choosing to opt for
taxation under section 115BA/115BAA/115BAB this year? and
Valid Form 10-IB /Form 10-IC/ Form 10-ID is available at the
backend for current year
10.
Schedule IF In "Schedule IF", Total of Col "Amount of interest due or received"
should be equal to 14xi(b) of statement of profit and loss
11.
Schedule BP Dividend income mentioned in Schedule OS is more than income
reduced from schedule BP
12.
Schedule CG For Resident taxpayers, DTAA benefit is not available in rate of
taxation, and the claim may not be allowed. Please re-check the
claims made. Residents may claim DTAAbenefit under Schedule TR
and FSI
13.
Schedule CG In Schedule CG, Table E, entire loss should be set off with gains
available for set off.
14.
Schedule CFL Current year losses should not be more than ZERO if return is filed
under 139(4)
15.
Schedule CYLA In Schedule CYLA, income is available for setoff of losses but
business loss is not fully get setoff
16.
Schedule CYLA In Schedule CYLA, income is available for setoff of losses but OS
loss is not fully setoff
17.
Schedule TDS TDS made under the section quoted that income in the nature of
VDA (Virtual Digital Assets) is derived by you in FY concerned.
Must however it is seen from the content of return that income
correspondent to VDA is either not offered to tax or is not offered to
tax completely.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 64
18.
Schedule TDS TDS made under the section quoted that income in the nature of
Winnings from lotteries, crossword puzzles, races, card games etc.
chargeable u/s 115BB is derived by you in FY concerned. Must
however it is seen from the content of return that income
correspondent to Winnings from lotteries, crossword puzzles, races,
card games etc. chargeable u/s 115BB is either not offered to tax or
is not offered to tax completely.
19.
Schedule TDS TDS made under the section quoted that income in the nature of
Income from the activity of owning and maintaining race horse is
derived by you in FY concerned. Must however it is seen from the
content of return that income correspondent to Income from the
activity of owning and maintaining race horse is either not offered to
tax or is not offered to tax completely.
20.
Schedule TDS TDS made under the section quoted that income in the nature of
winnings from online games chargeable u/s 115BBJ is derived by
you in FY concerned. Must however it is seen from the content of
return that income correspondent to winnings from online games
chargeable u/s 115BBJ is either not offered to tax or is not offered to
tax completely.
21.
Schedule TDS TDS claimed in hands of "Other person" will be allowed, only when
such other person has disclosed the same in their respective ITR and
transfers the TDS.
22.
Schedule MAT Kindly file Form 29B, filing which the deductions which are not
certified through Form 29B will not be allowed
23.
Schedule VIA Deduction u/s 80PA at Sl.No. 2p of Schedule VIA cannot be claimed
if turnover is more than 100 crores
24.
Schedule VIA Deduction u/s 80PA in Schedule VIA should be limited to Sl.No.. 2i
of Part B-TI
25.
Schedule OS Interest expenditure u/s 57(1) should not be more than 20% of the
dividend income at Sl. No. 1ai + Sl. No. 1aii in Schedule OS.
26.
Part B - TI Taxpayer filing Nil return is requested to check AIS / 26AS before
proceeding further
27.
Part B - TTI In Part A general , Sl. No. r - "Legal Entity Identifier (LEI) details"
is mandatory if amount in Part B-TTI at Sl. No. 12 'Refund' is 50
crores or more
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 65
2.3 Category D:
Table 4: Category D Rules
S. No. Schedule Scenarios
1
Part A - General
Information
If assessee is liable to audit u/s 92E as per the Income Tax Return, then
Form 3CEB is required to be uploaded on or before due date.
2
Schedule BP If assessee showed income under tonnage scheme but form 66 is not
yet filed.
3
Schedule BP In schedule BP, income offered u/s 44DA at Sl. No. 36(viii) should be
equal to income as per form 3CE (Income will be increased if amount
is more in Form 44DA)
4
Schedule BP In schedule BP, income offered u/s "Chapter-XII-G (tonnage)" should
be equal to income as per form 66 (Income will be increased if amount
is more in Form 66)
5
Schedule OS in schedule OS, Income offered u/s 115BBF have to mandatorily
accompanied with form 3CFA, otherwise income will be chargeable
at Normal rates
6
Schedule MAT In schedule MAT Sl. No. 9 "Book Profits" should be equal to book
profits at per Form 29B" Report under section 115JB of the Income-
tax Act, 1961 for computing Book profits and Minimum
Alternate Tax "(Income will be increased if amount is more in Form
29B)
7
Part B - TI In Part BTI Part C - Deduction can be claimed if the return is filed on
or before the due date specified u/s 139(1)
8
Part B -TI In Part BTI, Sl. No.12 "Deduction u/s 10AA" can be claimed only if
the return is filed or is being filed on or before the due date specified
u/s 139(1)
9
Part B -TI In Part B TI, Sl. No. 11B>0 and Value at field (l) of Part C -Deduction
in Schedule VI-A is greater than ZERO and Form 10DA has not been
filed
10
Part B -TTI If assessed claiming relief u/s 90 & 91 then it is mandatory to file form
67
11
Part B -TTI It is mandatory to file form 29B if tax as per MAT is more than tax as
per Normal provisions of the act.
12
Schedule 80 Deduction u/s 80-IA or u/s 80-IB or u/s 80IE or U/s 80IAC or 80IAB
or 80IBA is claimed but Form 10CCB is not filed / 10CCB is not filed
within due date for the current AY or date as extended
13
Schedule 10AA Deduction u/s 10AA can be claimed only if Form 56F is filed within
due date or extended due date
14
Schedule 10AA In schedule 10AA there is an inconsistency in the deduction claimed
u/s 10AA and amount mentioned in Form 56F (deduction will be
reduced based on the entries in the form)
15
Schedule VI-A Ensure filing of form 10CCF within due date or extended due date in
order to claim benefit of section 80LA/80lA(1A)"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 66
16
Schedule VI-A In schedule VI_A, deduction claimed u/s 80JJAA at Sl. No. 2l should
be equal to amount mentioned in Form 10DA
17
Schedule VI-A In schedule VI_A, deduction claimed u/s 80LA(1)/80LA(1A) at Sl.
No. 2m/n should be equal to amount mentioned in Form 10CCF
(Deduction will be reduced based on the entries in the form)
18
Schedule VI-A In schedule VI_A, deduction claimed u/s 80IA at Sl. No. 2e should be
equal to sum of amount mentioned in Form 10CCB
19
Schedule VI-A In schedule VI_A, deduction claimed u/s 80IB at Sl. No. 2h should be
equal to sum of amount mentioned in Form 10CCB
20 Schedule VI-A In schedule VI_A, deduction claimed u/s 80IAB at Sl. No. 2f should
be equal to sum of amount mentioned in Form 10CCB
21 Schedule VI-A In schedule VI_A, deduction claimed u/s 80IAC at Sl. No. 2g should
be equal to sum of amount mentioned in Form 10CCB
22 Schedule VI-A In schedule VI_A, deduction claimed u/s 80IE at Sl. No. 2j should be
equal to sum of amount mentioned in Form 10CCB
23 - All the effects reported in the audit reports Form 3CD are expected to
be routed through Schedule OI and Schedule BP, based on the
mappings provided. Mapping related to these rules are provided in
Annexure 1 below
Possibilities of ITR getting defective:
1. Taxpayer claimed loss under head "PGBP" but not filled Part A - Balance Sheet and Part A
- Profit and Loss Account
2. Receipts offered ITR are more than 10 Crores, but audit report is not filed.
3. Audit report is required to be filed for a Resident Company, if a2(ii)/a2(iii) in part A general
is selected as "No"
4. For other than resident Company, audit report is required to file if Receipts offered in ITR is
more than 1 Crores and a2(ii)/a2(iii) selected as "No" in Part A General
5. Special rate incomes are not disclosed in the respective schedule though income is
appearing in 26AS/AIS.
6. Income is disclosed in Part BTI but not disclosed in the respective schedule.
7. Tax payments are claimed in ITR, but gross receipts are not disclosed.
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 67
Annexure 1
Following fields of ITR should be tallied with corresponding amount mentioned in Tax Audit report
i.e., Form 3CD.
Schedule
Name in ITR
Field Name in ITR
Field in
ITR
Field in Form 3CD
Schedule Part
A-OI
Section 28
the items falling within the
scope of section 28
Sl. No.
5(a)
Form 3CD clause 16 (a)
The proforma credits,
drawbacks, refund of duty of
customs or excise or service
tax, or refund of sales tax or
value added tax, or refund of
GST, where such credits,
drawbacks or refunds are
admitted as due by the
authorities concerned.
Sl. No.
5(b)
Form 3CD clause 16 (b)
escalation claims accepted
during the previous year
Sl. No.
5(c)
Form 3CD clause 16 (c)
Any other item of income Sl. No.
5(d)
Form 3CD clause 16 (d)
Section 36
Any sum paid to an employee
as bonus or commission for
services rendered, where such
sum was otherwise payable to
him as profits or
dividend.[36(1)(ii)]
Sl. No.
6(c)
Form 3CD clause 20(a)
Any amount of interest paid in
respect of borrowed
capital[36(1)(iii)]
Sl. No.
6(d)
Form 3CD clause 21(i)
Any sum received from
employees as contribution to
any provident fund or
superannuation fund or any
fund set up under ESI Act or
any other fund for the welfare
of employees to the extent not
credited to the employees
account on or before the due
date
[36(1)(va)]
Sl. No.
6(k)
Form 3CD clause 20(b)
Sum of (1+2+3+4+5) as
mentioned below:
1) if Actual date or due date or
both are blank or null or 0 then
sum received from employees
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 68
Schedule Part
A-OI
2) if Actual date is before FY
(1st April 2025), then sum
received from employees
3) if Actual date & due date
are beyond the due date of filing
of return then sum received from
employees
4) If amount is paid after due
date of payment or due date of
payment of date of payment is
blank/null/invalid then sum
received from employees
5) If actual amount paid is
within the due date of payment,
then difference of sum received
from employees as reduced by
actual amount paid if the
difference is positive and sum
received from employees is
greater than 'zero'
Section 37
Expenditure of
nature [37(1)]
capital Sl. No.
7(a)
Form 3CD, Clause 21 (a) "field
Capital Expenditure" Column
"Amount"
Expenditure of
nature;[37(1)]
personal Sl. No.
7(b)
Form 3CD, Clause 21 (a) "field
Personal Expenditure" Column
"Amount"
Expenditure on advertisement
in any souvenir, brochure,
tract, pamphlet or the like,
published by a political
party;[37(2B)]
Sl. No.
7(d)
Form 3CD, Clause 21 (a) "field
Advertisement expenditure"
column "Amount"
Expenditure by way of penalty
or fine for violation of any law
for the time being in force;
Sl. No.
7(e) +
Sl.No.
7(g)
Form 3CD, Clause 21(a) field
"Expenditure for any purpose
which is an offence or is
prohibited by law or expenditure
by way of penalty or fine for
violation of any law (enacted in
India or outside India)" column
"Amount"
Any other penalty or fine; Sl. No.
7(f)
Form 3CD, Clause 21(a)
"Expenditure by way of any other
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 69
penalty or fine not covered above"
column "Amount"
Schedule Part
A-OI
Amount of any liability of a
contingent nature
Sl. No.
7(i)
From Form 3CD, Clause 21 (g)
"Particulars of any liability
contingent in nature" column
"Amount"
Section 40
Amount disallowable under
section 40 (a)(i), on account of
non-compliance with
provisions of Chapter XVII-B
Sl. No.
8A(a)
Form 3CD, clause 21(b)(i) sum of
21(b)(i)(A) field "Amount of
payment " and 21(b)(i)(B) field
"amount of payment"
Amount disallowable under
section 40(a)(ia) on account of
non-compliance with the
provisions of Chapter XVII-B
Sl. No.
8A(b)
30% of Form 3CD, clause
21(b)(ii) sum of 21(b)(ii)(A) field
"Amount of payment " and
21(b)(ii)(B) field "{(amount of tax
deducted - amount of tax
deposited)/Amount of tax
deducted}* amount of
payment"
Amount disallowable under
section 40(a)(ib) on account of
non-compliance with the
provisions of Chapter VIII of
the Finance Act, 2016
Sl. No.
8A(c)
Cause 21(b)(iii) sum of
21(b)(iii)(A) field "amount of
payment" and 21(b)(iii)(B) field
"{(amount of tax deducted
amount of tax deposited)/Amount
of tax deducted}* amount of
payment"
Amount disallowable under
section 40(a)(iii) on account
of non-compliance with the
provisions of Chapter XVII-B
Sl. No.
8A(d)
Form 3CD, clause 21(b)(vii) field
"Amount of payment"
Amount paid as wealth
tax[40(a)(iia)]
Sl. No.
8A(f)
Form 3CD, clause 21(b)(v)
Amount paid by way of
royalty, license fee, service fee
etc. as per section
40(a)(iib)
Sl. No.
8A(g)
Form 3CD, clause 21(b)(vi)
Amount of interest, salary,
bonus, commission or
remuneration paid to any
partner or member
inadmissible under section
[40(b)/40(ba)]
Sl. No.
8A(h)
From Form 3CD,"Total of column
"Amount Inadmissible" as per Sl.
No. 21(c) of form 3CD
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 70
Section 40A
Amount paid, otherwise than
by account payee cheque or
account payee bank draft or
use of electronic clearing
system
Sl. No.
9(b)
Form 3CD, clause 21(d)(A) field
"Amount"
through a bank account or
through such electronic mode
as may be prescribed,
disallowable under section
40A(3)
Provision for payment of
gratuity[40A(7)]
Sl. No.
9(c)
Form 3CD, clause 21(e)
any sum paid by the assessee
as an employer for setting up
or as contribution to any fund,
trust, company, AOP, or BOI
or society or any
other institution;[40A(9)]
Sl. No.
9(d)
Form 3CD, clause 21(f)
Section 43B (Allowable)
Any sum in the nature of tax,
duty, cess or fee under any law
Sl. No.
10(a)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(a) is selected
Any sum payable by way of
contribution to any provident
fund or superannuation fund
or gratuity fund or any other
fund for the welfare of
employees
Sl. No
10(b)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(b) is selected
Any sum payable to an
employee as bonus or
commission for
services rendered
Sl. No.
10(c)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(c) is selected
Any sum payable as interest
on any loan or borrowing from
any public financial institution
or a State financial
corporation or a State
Industrial investment
corporation
Sl. No.
10(d)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(d) is selected
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 71
Any sum payable as interest
on any loan or borrowing from
any scheduled bank or a co-
operative bank other than a
primary agricultural credit
society or a primary
Sl. No.
10(e)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(e) is selected
co-operative agricultural and
rural development bank
Any sum payable towards
leave encashment
Sl. No.
10(f)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(f) is selected
Any sum payable to the
Indian Railways for the use of
railway assets
Sl. No.
10(g)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(g) is selected
Any sum payable to a micro
or small enterprise beyond the
time limit specified in section
15 of the Micro, Small and
Medium Enterprises
Development Act, 2006
Sl. No.
10(h)
Form 3CD "Clause 26(A)(a)"
Sum of figure mentioned at
column "Amount" if clause
43B(h) is selected
Section 43B (Disallowable)
Any sum in the nature of tax,
duty, cess or fee under any
law
Sl. No.
11(a)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(a) is selected
Any sum payable by way of
contribution to any provident
fund or superannuation fund
or gratuity fund or any other
fund for the welfare of
employees
Sl. No.
11(b)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(b) is selected
Any sum payable to an
employee as bonus or
commission for services
rendered
Sl. No.
11(c)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(c) is selected
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 72
Any sum payable as interest
on any loan or borrowing
from any public financial
institution or a State financial
corporation or a State
Industrial investment
corporation
Sl. No.
11(d)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(d) is selected
Any sum payable by the
assessee as interest on any
loan or borrowing from a
deposit taking non-banking
financial company or
systemically important non
deposit taking non-banking
financial company, in
accordance with the terms and
conditions of the agreement
governing such loan or
borrowing
Sl. No.
11(da)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(da) is selected
Schedule Part
A-OI
any sum payable by the
assessee as interest on any
loan or borrowing from a
scheduled bank or a
cooperative bank other than a
primary agricultural credit
society or a primary
cooperative agricultural and
rural development bank
Sl. No.
11(e)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(e) is selected
Any sum payable towards
leave encashment
Sl. No.
11(f)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(f) is selected
Any sum payable to the
Indian Railways for the use of
railway assets
Sl. No.
11(g)
Form 3CD "Clause 26(B)(b)"
Sum of figure mentioned at
column "Amount" if clause
43B(g) is selected
Any sum payable to a micro
or small enterprise beyond the
time limit specified in section
15 of the Micro, Small and
Medium Enterprises
Development Act, 2006
Sl. No.
11(h)
Form 3CD clause 22(iii)(b)
Any amount of profit
chargeable to tax under
section 41
Sl. No. 14 Form 3CD, Clause 25
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 73
Amount of expenditure
disallowed u/s 14A
Sl. No. 16 Form 3CD clause 21(h)
Schedule
Part A-OI
Interest disallowable under
section 23 of the Micro,
Small and Medium
Enterprises Development
Act,2006
Sl. No. 17 Form 3CD clause 22(i)
Schedule
Part A-OI
Increase or Decrease in
profit/loss because of
deviation, if any, as per
Income Computation
Disclosure Standards notified
under section 145(2) or from
the method of valuation
specified under section 145A
Sl. No. 3(a)
+ 3(b) + 4d
+ 4e
Form 3CD clause 13(e) - Total of
Column "Increase in Profit" +
clause 13(e) - Total of Column
"Decrease in Profit" + clause
14(b) - Total of Column
"Increase in Profit" + clause 14(b
) - Total of Column "Decrease in
Profit"
Schedule
Part A-OI
Amounts deemed to be profits
and gains under section 33AB
or 33ABA or 33AC
Sl. No. 13 Form 3CD clause 24 -total of
"33AB" dropdown values or total
of "33ABA" dropdown values or
total of "33AC" dropdown values
Schedule BP Absolute value of sum of
negative difference between
Amount admissible and
Amount debited at Clause 19
of Form 3CD for Sl. Nos. (i to
ix) should not be higher than
amount mentioned at Sl. No.
24(c) of Schedule BP
Sl. No.
24(c)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act,1961 for
all sl. no.
Schedule OS Income of nature referred to
in section 56(2)(x) which is
chargeable to tax
Sl. No. 1D Form 3CD clause 29B(b)-total
Dividend income as referred
to in section 2(22)(e)
Sl. No.
1a(ii)
Form 3CD clause 36A
Schedule ESR Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)" Section "
35(1)(i)"
Col. 4 of
schedule
ESR,
Section
35(1)(i)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(1)(i)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(1)(ii)"
Col. 4 of
schedule
ESR ,
Section
35(1)(ii)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 74
of the Income Tax Act, 1961" in
"section 35(1)(ii)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(1)(iia)"
col. 4 of
schedule
ESR ,
Section
35(1)(iia)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(1)(iia)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(1)(iii)"
col. 4 of
schedule
ESR ,
Section
35(1)(iii)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(1)(iii)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(1)(iv)"
col. 4 of
schedule
ESR ,
Section
35(1)(iv)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(1)(iv)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(2AA)"
col. 4 of
schedule
ESR ,
Section
35(2AA)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(2AA)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35(2AB)"
col. 4 of
schedule
ESR ,
Section
35(2AB)
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35(2AB)"
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35CCC"
col. 4 of
schedule
ESR ,
Section
35CCC
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35CCC"
CBDT_e-Filing_ITR 6_Validation Rules for AY 2026-27 V 1.0
Confidential Page 75
Col 4 " Amount of deduction
in excess of the amount
debited to statement of profit
and loss (4)"
Section " 35CCD"
col. 4 of
schedule
ESR ,
Section
35CCD
Clause 19 of form 3CD amount
mentioned at Column "Amount
debited to profit & loss account"
as reduced from "Amounts
admissible as per the provisions
of the Income Tax Act, 1961" in
"section 35CCD"
Annexure 2
Applicable Tax rates
Type of
company
Tax base rates Remarks Surcharge Cess
Total
Income
exceeds 1
Crore
Total
income
exceeds Rs.
10 cores
I. Domestic
Company
Section 115BA 25% (other than
covered in
Schedule SI)
7% 12% 4%
Section 115BAA 22% (other than
covered in
Schedule SI)
Surcharge is applicable
on entire income
without any minimum
threshold (Even if
income is Rs, 100 then
surcharge will be
applicable if taxpayer
selects section
115BAA or 115BAB)
10% 10% 4%
Section 115BAB 22% or 15% as
applicable
10% 10% 4%
If not covered
above,
Gross receipt in
the previous year
2023-24 does not
exceed 400
crores is flagged
as "yes"
25% or rates
applicable when
section 115BA/
115BAA/
115BAB is
opted in
7% 12% 4%
Gross receipt in
the previous year
2023 - 24 does
not exceed 400
crores is flagged
as "NO"
30% or rates
applicable when
section 115BA/
115BAA/
115BAB is
opted in
7% 12% 4%
II. Foreign
Company
35% 2% 5% 4%
