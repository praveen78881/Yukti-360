# GSTN GSTR-1 SAVE schema — field specs (from Sandbox save-v4.1.xlsx workbook)


## Save GSTR1
Save GSTR1  - Request (URL parameters other than action)
Sl No | Parameter Name | Description | Field Specification | Mandatory | Sample Value
1 | data | GSTR1 data grouped into different sections (b2b,b2ba,b2c etc) | GSTR1 data
GSTR1 Data
S No | JSON attribute | Description | Format | Sample Value
1 | gstin | GSTIN of the Tax Payer | Alphanumeric with 15 characters | 07CQZCD1111I4Z7
2 | fp | Return period | String (MMYYYY) | 082016
3 | gt | Gross Turnover in the preceding Financial Year | Decimal(15, 2) | 1000.00
4 | cur_gt | Gross Turnover - April to June, 2017 | Decimal(15, 2) | 1000.00
5 | b2b | B2B Invoices | B2B Invoice Data
6 | b2bA | Ammended B2B Invoices | B2BA Invoice Data
7 | b2cl | B2C Large Invoices | B2CL Invoice data
8 | b2cla | Ammended B2C Large Invoices | B2CLA Invoice data
9 | b2cs | B2C Small Invoices | B2CS Invoice Data
10 | b2csa | Ammended B2C Small Invoices | B2CSA Invoice Data
11 | nil | Nil Supplies | Nil Rated Invoice Data
12 | exp | Exports | Exp Invoice Data
13 | expa | Ammended  Exports | Expa Invoice Data
14 | at | Advance Tax | AT Invoice data
15 | ata | Ammended Advance Tax | ATA Invoice data
16 | txpd | Advance Adjusted Detail | Advance Tax paid details
17 | txpda | Advance Adjusted Detail Ammendment | Advance Tax paid details Ammendment
17 | hsn | hsn_summary_details | HSNSUM
18 | cdnr | Credit and Debit Note | CDNR
19 | cdnra | Ammended Credit and Debit Note | CDNRA
18 | cdnur | Credit and Debit Note for Unregistered Taxpayers | CDNUR
19 | cdnura | Credit and Debit Note for Unregistered Taxpayers Ammendment | CDNURA
20 | doc_Issue | Document Issue | Documents Issue
21 | supeco | Supeco Details | SUPECO
22 | supecoa | Supecoa Details | SUPECOA
23 | ecom | E-Commerce details | ECOM
24 | ecoma | E-Commerce details for Amendment | ECOMA
| GSTR-1 Save Validations Rule |  | Validation Sheet
Save GSTR1  - Response (data)
Sl No | Parameter Name | Description | Field Specifications | Sample Value
1 | reference_id | Reference ID | Alphanumeric 15 characters | LAPN24235325555

## B2B Invoice Data
Note: For Flag D-  ctin,  inum , idt  will be sufficient.
B2B Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2b} | B2B Invoices | Refer A 1.1 |  |  | Back to API LIST
| A 1.1           B2B Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ctin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
2 | List{inv} | Invoice Details | Refer to B2B Invoice Data
| B2B Invoice Data
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) - Optional | D-Delete | When supplier uploads new invoice/modifies his own invoice, flag is not required
2 | chksum | Invoice Check sum value | string(Max length:64) | AflJufPlFStqKBZ
3 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
4 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
5 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
6 | pos | Place of supply | String(Max length:2) | 04
7 | rchrg | Reverse Charge | Character | Y/N
8 | etin | EcomOperator | Alphanumeric with 15 characters | 06ADECO9084R5Z5
9 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP/SEWOP/DE/CBW) | R- Regular B2B Invoices,  DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
CBW - Custom Bonded Warehouse
10 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
11 | List {itms} | Items | Refer  A 1.1.2
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2 | Integer value should be 1 or above.
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65

## B2BA Invoice Data
Note: For Flag D-  ctin,  inum , idt, oinum  will be sufficient.
B2BA Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2ba} | B2BA Invoices | Refer A 1.1 |  |  | Back to API LIST
A 1.1           B2BA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ctin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
2 | List{inv} | Invoice Details | Refer to B2B Invoice Data
| B2BA Invoice Data
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) - Optional | D-Delete | When supplier uploads new invoice/modifies his own invoice, flag is not required
2 | chksum | Invoice Check sum value | string(Max length:64) | AflJufPlFStqKBZ
3 | oinum | Original Supplier Invoice Number | String (Max length : 16) | S008400
4 | oidt | Original Supplier Invoice Date | string (DD-MM-YYYY) | 42403
5 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
6 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
7 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
8 | pos | Place of supply | String(Max length:2) | 04
9 | rchrg | Reverse Charge | Character | Y/N
10 | etin | EcomOperator | Alphanumeric with 15 characters | 06ADECO9084R5Z5
11 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP/SEWOP/DE/CBW) | R- Regular B2B Invoices,  DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
CBW - Custom Bonded Warehouse
12 | diff_percent | Differential percentage | Decimal (3,2) |  | If the attribute is present then the value should be only 0.65
13 | List {itms} | Items | Refer  A 1.1.2
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2 | Integer value should be 1 or above.
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65

## B2CL Invoice Data
Note: For Flag D- pos,  inum, idt  will be sufficient.
B2CL Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2cl} | List of B2C Large Invoices | Refer A 1.1 |  |  |  | Back to API LIST
| A 1.1           B2CL Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | pos | Place of Supply | String(Max length:2) | 04
2 | List{inv} | Invoice Details | B2CL Invoice Data
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
3 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
4 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
5 | etin | Ecommerce Gstin | Alphanumeric with 15 characters | 29HJKPS9689A8Z4
6 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
7 | List{itms} | Items | Refer  A 1.1.2
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2 | Integer value should be 1 or above.
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3, 2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 650
4 | csamt | cess Amount as per invoice | Decimal(11, 2) | 65

## B2CLA Invoice Data 
Note: For Flag D- pos,  inum, idt  will be sufficient.
B2CLA Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2cla} | List of Ammended B2C Large Invoices | Refer A 1.1 |  |  | Back to API LIST
A 1.1           B2CLA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | pos | Place of Supply | String(Max length:2) | 04
2 | List{inv} | Invoice Details | B2CL Invoice Data
A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | oinum | Original Supplier Invoice Number | String (Max length : 16) | S008400
3 | oidt | Original Supplier Invoice Date | string (DD-MM-YYYY) | 42403
4 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
5 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
6 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
7 | etin | Ecommerce Gstin | Alphanumeric with 15 characters | 29HJKPS9689A8Z4
8 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
9 | List{itms} | Items | Refer  A 1.1.2
A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value | Integer value should be 1 or above.
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.1.2.1
A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3, 2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
4 | csamt | cess Amount as per invoice | Decimal(11, 2) | 100

## B2CS Invoice Data
Note: For Flag D- sply_ty, typ, pos, rt  will be required. Please note that out of these 3 attributes, pos is only required if the original b2cs payload was saved with pos.
B2CS Response Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List<b2cs> | b2cs Details | Refer A 1.1 |  |  | Back to API LIST
| A 1.1           B2CS Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
3 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
4 | typ | Type | string(Max length:2) | E/OE (Ecom/Other than Ecom)
5 | etin | Ecom Operator Gstin | Alphanumeric (Max length:15) | 27AHQPA7588L1ZJ
6 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
7 | pos | Place of Supply | String(Max length:2) | 04
8 | rt | Rate as per invoice | Decimal(3, 2) | 10
9 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
10 | camt | CGST Amount as per invoice | Decimal(11, 2) | 1000
11 | samt | SGST Amount as per invoice | Decimal(11, 2) | 1000
12 | csamt | Cess Amount as per invoice | Decimal(11, 2) | 1000

## B2CSA Invoice Data
Note: For Flag D- sply_ty, typ, pos, omon will be required
B2CSA Response Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List<b2csa> | b2csa Details | Refer A 1.1 |  | Back to API LIST
A 1.1           B2CSA Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | omon | Original Month of Invoice | String(MMYYYY) | 102016
3 | pos | Place of Supply | String(Max length:2) | 04
4 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
5 | typ | Type | string(Max length:2) | E/OE (Ecom/Other than Ecom)
6 | etin | Ecom Operator Gstin | Alphanumeric (Max length:15) | 27AHQPA7588L1ZJ
7 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
8 | List {itms} | Items | Refer  A 1.1.2
A 1.1.2          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 1000
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 1000
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 100

## Nil Data
Note: For Delete-Flag D will be required
NIL Rated  Response Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | nil | Nil Supplies | Refer A 1.1 |  |  | Back to API LIST
| A 1.1 Nil Supplies
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List<inv> | Nil Invoices | Refer A 1.2
2 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
| A 1.2           Nil Invoices
S No | Parameter Name | Description | Field Specifications
1 | nil_amt | Total Nil rated outward supplies | Decimal(11, 2) | 1000
2 | expt_amt | Total Exempted outward supplies | Decimal(11, 2) | 1100
3 | ngsup_amt | Total Non GST outward supplies | Decimal(11, 2) | 1000
4 | sply_ty | Supply Type | String (Length - 8) | INTRB2B/ INTRB2C/ INTRAB2B/ INTRAB2C

## EXP Data
Note: For Flag D-  exp_typ, inum, idt will be sufficient.
A 1.1           EXP Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value | Remarks
1 | exp_typ | Export Type : With / Without payment of GST | String with 5 characters | WPAY / WOPAY |  | Back to API LIST
2 | List{inv} | Invoice Details | Refer A 1.1.1
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
3 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
4 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
5 | sbpcode | Shipping Bill Port Code | Alphanumeric (Max length:6) | SB1249
6 | sbnum | Shipping Bill No. or Bill of Export No | String(Min length:3)(Max Length:7) | 2425321
7 | sbdt | Shipping Bill Date. or Bill of Export Date | string (DD-MM-YYYY) | 42433
9 | List {itms} | Item Details | Refer  A 1.1.2
| A 1.1.2           Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
2 | rt | Rate as per invoice | Decimal(3, 2) | 10
3 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
4 | csamt | Cess amount as per invoice | Decimal(11,2) | 100

## EXPA Data
Note: For Flag D-  exp_typ, inum, idt will be sufficient.
A 1.1           EXPA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value | Remarks
1 | exp_typ | Export Type : With / Without payment of GST | String with 5 characters | WPAY / WOPAY |  | Back to API LIST
2 | List{inv} | Invoice Details | Refer A 1.1.1
A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | oinum | Original Supplier Invoice Number | String (Max length : 16) | S008400
3 | oidt | Original Supplier Invoice Date | string (DD-MM-YYYY) | 42403
4 | inum | Supplier Invoice Number | String (Max length : 16) | S008400
5 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 42403
6 | val | Supplier Invoice Value | Decimal(13, 2) | 10000
5 | sbpcode | Shipping Bill Port Code | Alphanumeric (Max length:6) | SB1249
6 | sbnum | Shipping Bill No. or Bill of Export No | String(Min length:3)(Max Length:7) | 1234567
7 | sbdt | Shipping Bill Date. or Bill of Export Date | string (DD-MM-YYYY) | 42433
8 | List {itms} | Item Details | Refer  A 1.1.2
A 1.1.2           Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
2 | rt | Rate as per invoice | Decimal(3, 2) | 10
3 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
4 | csamt | Cess amount as per invoice | Decimal(11,2) | 100

## AT Data
Note: For Flag D-  pos, sply_ty will be required. Please note that out of these 2 attributes, pos is only required if the original at payload was saved with pos.
AT  Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{at} | AT Invoices | Refer A 1.1 |  |  | Back to API LIST
| A 1.1          AT Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | pos | Place of Supply | String(Max length:2) | 04
3 | sply_ty | Supply Type | String (Length - 5) | INTER / INTRA
4 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
5 | List {itms} | Item Details | Refer  A 1.1.2
| A 1.1.2          Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate of Invoice | Decimal(3, 2) | 10000
2 | ad_amt | Advance received | Decimal(11, 2) | 10001
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11, 2) | 10001
5 | samt | SGST Amount as per invoice | Decimal(11, 2) | 10002
6 | csamt | Cess  Amount as per invoice | Decimal(11, 2) | 10003

## ATA Data
Note: For Flag D- pos, sply_ty will be required
ATA  Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{ata} | ATA Invoices | Refer A 1.1 |  |  | Back to API LIST
A 1.1          ATA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | omon | Original Month | String(MMYYYY) | 032017
3 | pos | Original Place of Supply | String(Max length:2) | 04
4 | sply_ty | Original Supply Type | String (Length - 5) | INTER / INTRA
5 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
6 | List {itms} | Item Details | Refer  A 1.1.2
A 1.1.2          Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate of Invoice | Decimal(3, 2) | 10000
2 | ad_amt | Advance received | Decimal(11, 2) | 10001
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11, 2) | 10001
5 | samt | SGST Amount as per invoice | Decimal(11, 2) | 10002
6 | csamt | Cess  Amount as per invoice | Decimal(11, 2) | 10003

## HSN Summary details
Note: For Delete-Flag D will be required
HSN Response Data |  |  |  |  | Remarks
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{hsn} | HSN summary of outward supplies | Refer A 1.1
A1.1 HSN DATA
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | List{data} | HSN summary of outward supplies | Refer A 1.1
3 | List{hsn_b2b} | HSN summary of outward supplies | Refer A 1.1 |  |  | Back to API LIST
4 | List{hsn_b2c} | HSN summary of outward supplies | Refer A 1.1
| A 1.1  HSN summary of outward supplies
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial Number | Integer | 1 | Integer value should be 1 or above.
2 | hsn_sc | HSN of Goods or Services as per Invoice line items | Numeric (Min length:2 Max length:8) | 19059020 | If return period is after April 2021 its mandatory  parameter
3 | desc | Description of goods sold | string(Max length:30) | Gold | If return period is after April 2021  its optional  parameter and length check not applicable.
4 | uqc | UQC (Unit of Measure) of goods sold | string(Max length:30) | KGS | If return period is after April 2021 its mandatory  parameter. Allowed values [BAG,BAL,BDL,BKL,BOU,BOX,BTL,BUN,CAN,CBM,CCM,CMS,CTN,DOZ,DRM,GGK,GMS,GRS,GYD,KGS,KLR,KME,LTR,MLT,MTR,MTS,NOS,OTH,PAC,PCS,PRS,QTL,ROL,SET,SQF,SQM,SQY,TBS,TGM,THD,TON,TUB,UGS,UNT,YDS,LTR,NA]
5 | qty | Quantity of goods sold | Decimal(15, 2) | 10
6 | val | Total Value | Decimal(13, 2) | 10000 | If return period is after April 2021 this parameter not required
If present should be 0
7 | txval | Taxable value of Goods or Service as per invoice | Decimal(13, 2) | 10000
8 | iamt | IGST Amount as per invoice | Decimal(13, 2) | 1000
9 | camt | CGST Amount as per invoice | Decimal(13, 2) | 1000
10 | samt | SGST Amount as per invoice | Decimal(13, 2) | 1000
11 | csamt | Cess Amount as per invoice | Decimal(13, 2) | 1000
12 | user_desc | Description provided by user | String | Gold | Optional field introduced from October 2024
Attributes for Post May 2021 periods
13 | rt | Tax Rate | Decimal(3,2) | 5 | If return period is after April 2021 its mandatory  parameter
Allowed value [0,0.1,0.25,1,1.5,3,5,7.5,12,18,28]
Error Scenario in case of Post May 2021 Periods
13 | error_report | Error Report | JSON |  | In case of PE error status for HSN section no record will be saved in HSN table and only record with error will be returned in RETSTATUS API  response. One has to correct the error record and upload complete HSN payload again.
Note :
If return period is before April 2021 
     a. Mandatory request parameter combination is ["hsn_sc","uqc","qty","val","num","txval"] or ["desc","uqc","qty","val","num","txval"]
     b. ["hsn_sc","desc","uqc"] combination is unique key. If present duplicate combination will  treat as duplicate record.

 If return period is post Mar 2021 
     a. Mandatory request parameter combination is  ["hsn_sc","uqc","qty","rt","num","txval"]
     b. ["hsn_sc","uqc","rt"] combination is unique key. If present duplicate combination will  treat as duplicate record.
     c. "val" parameter not require. If present in request then payload should be 0.

This above mentioned period is configurable and can be changed according to Govt notification

## TXP
Note: For Flag D- pos, sply_ty will be required.Please note that out of these 2 attributes, pos is only required if the original txpd payload was saved with pos.
TXP  Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{txpd} | TXP Invoices | Refer A 1.1 |  |  | Back to API LIST
| A 1.1          TXP Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | pos | Place of Supply | String(Max length:2) | 04
3 | sply_ty | Supply Type | String (Length - 5) | INTER / INTRA
4 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
5 | List {itms} | Item Details | Refer  A 1.1.2
| A 1.1.2          Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate of Invoice | Decimal(3, 2) | 10000
2 | ad_amt | Advance to be adjusted | Decimal(11, 2) | 10001
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11, 2) | 10001
5 | samt | SGST Amount as per invoice | Decimal(11, 2) | 10002
6 | csamt | Cess  Amount as per invoice | Decimal(11, 2) | 10003

## TXPA
Note: For Flag D- pos, sply_ty will be required
TXPA  Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{txpda} | TXPA Invoices | Refer A 1.1 |  |  | Back to API LIST
A 1.1          TXPA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | omon | Original Month | String(MMYYYY) | 032017
3 | pos | Original Place of Supply | String(Max length:2) | 04
4 | sply_ty | Original Supply Type | String (Length - 5) | INTER / INTRA
5 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
6 | List {itms} | Item Details | Refer  A 1.1.2
A 1.1.2          Item Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate of Invoice | Decimal(3, 2) | 10000
2 | ad_amt | Advance to be adjusted | Decimal(11, 2) | 10001
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11, 2) | 10001
5 | samt | SGST Amount as per invoice | Decimal(11, 2) | 10002
6 | csamt | Cess  Amount as per invoice | Decimal(11, 2) | 10003

## CDNR
Note: For Flag D-  ctin,nt_num and nt_dt will be sufficient.
CDN Data
|  | 1.CDNR
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ctin | Counter party GSTIN | Alphanumeric with 15 characters | 20GRRHF2562D3A3 | Back to API LIST
2 | List<nt> | Credit Debit Note details | Refer to Credit/Debit Notes
| A 1.1         Credit/Debit Notes
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | chksum | Check sum value | String (Max length:64) | AflJufPlFStqKBZ
3 | ntty | Credit/debit note type | One character | C/ D
4 | nt_num | Credit note/debit note | String(Max length : 16) | NT100001
5 | nt_dt | Credit Note/Debit Note | string (DD-MM-YYYY) | 42431 | This attribute is added for CDN delinking
6 | pos | Place of supply | String(Max length:2) | 04 | This attribute is added for CDN delinking
7 | rchrg | Reverse Charge | Character | Y/N | This attribute is added for CDN delinking
8 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP/SEWOP/DE/CBW) | R- Regular B2B Invoices,  DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
CBW - Custom Bonded Warehouse
9 | val | Total Note Value | Decimal(13, 2) | 10000 | If the attribute is present then the value should be only 0.65
10 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%)
11 | List {itms} | Items | Refer  A 1.1.2
| A 1.1.2           Items |  |  |  | Integer value should be 1 or above.
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 1000
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 1000
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 100

## CDNRA
Note: For Flag D-  ctin,nt_num and nt_dt will be sufficient.
CDNRA Data
|  | 1.CDNRA
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ctin | Counter party GSTIN | Alphanumeric with 15 characters | 20GRRHF2562D3A3 | Back to API LIST
2 | List<nt> | Credit Debit Note details | Refer to Credit/Debit Notes
A 1.1         Credit/Debit Notes
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | chksum | Check sum value | String (Max length:64) | AflJufPlFStqKBZ
3 | ont_num | Original Credit note/debit note | String(Max length : 16) | NT100001
4 | ont_dt | OriginalCredit Note/Debit Note | string (DD-MM-YYYY) | 42431
5 | ntty | Credit/debit note type/ Refund Voucher | One character | C/ D
6 | nt_num | Credit note/debit note | String(Max length : 16) | NT100001
7 | nt_dt | Credit Note/Debit Note | string (DD-MM-YYYY) | 42431 | This attribute is added for CDN delinking
8 | pos | Place of supply | String(Max length:2) | 04 | This attribute is added for CDN delinking
9 | rchrg | Reverse Charge | Character | Y/N | This attribute is added for CDN delinking
10 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP/SEWOP/DE/CBW) | R- Regular B2B Invoices,  DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
CBW -  Intra state supplies attracting igst
11 | val | Differential value | Decimal(13, 2) | 10000 | If the attribute is present then the value should be only 0.65
12 | diff_percent | Differential percentage | Decimal (3,2)
13 | List {itms} | Items | Refer  A 1.1.2
A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value | Integer value should be 1 or above.
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.1.2.1
A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 1000
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 1000
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 100

## CDNUR Invoices
Note: For Flag D- typ, nt_num, nt_dt will be sufficient.
CDNUR  Data
|  | 1.CDNUR
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices) | Back to API LIST
2 | typ | EXPWP/ EXPWOP/ B2CL | String (Max length:6) | B2CL
3 | ntty | Credit/debit note type | One character | C/ D
4 | nt_num | Credit note/debit note | String(Max length:16) | NT100001
5 | nt_dt | Credit Note/Debit Note | string (DD-MM-YYYY) | 42431
6 | val | Total Note Value | Decimal(13, 2) | 10000
7 | pos | Place of supply | String(Max length:2) | 04 | This attribute is added for CDN delinking.This attribute will be present if typ=B2CL, otherwise it should not be there.
8 | diff_percent | Differential percentage | Decimal (3,2) | Sample Value | This attribute will be present if typ=B2CL, otherwise it should not be there.
If the attribute is present then the value should be only 0.65
w
9 | List {itms} | Items | Refer  A 1.1.2
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2 | Integer value should be 1 or above.
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | csamt | cess Amount as per invoice | Decimal(11,2) | 100

## CDNURA Invoices
Note: For Flag D- typ, nt_num, nt_dt  will be sufficient.
CDNURA  Data
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | typ | EXPWP/ EXPWOP/ B2CL | String (Max length:6) | B2CL | Back to API LIST
3 | ont_num | Original Credit note/debit note Number | String(Max length : 16) | NT100001
4 | ont_dt | OriginalCredit Note/Debit Note/  Refund Voucher date | string (DD-MM-YYYY) | 42431
3 | ntty | Credit/debit note type | One character | C/ D
4 | nt_num | Credit note/debit note Number | String(Max length:16) | NT100001
5 | nt_dt | Credit Note/Debit Note date | string (DD-MM-YYYY) | 42431
6 | pos | Place of supply | String(Max length:2) | 04 | This attribute will be present if typ=B2CL, otherwise it should not be there.
7 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | This attribute will be present if typ=B2CL, otherwise it should not be there.
If the attribute is present then the value should be only 0.65
w
8 | val | Differential value | Decimal(13, 2) | 10000
9 | diff_percent | Differential percentage | Decimal (3,2) | .65 (65%) | If the attribute is present then the value should be only 0.65
10 | List {itms} | Items | Refer  A 1.1.2
A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2 | Integer value should be 1 or above.
2 | itm_det | Item Details | Refer to A 1.1.2.1
A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 1000
4 | csamt | cess Amount as per invoice | Decimal(11,2) | 100

## SUPECOA
SUPECOA Details
Get SUPECOA Details Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{SUPECOA} | SUPECOA Details : object of SUPECOA contains both sections "clttxa" and "paytxa" which will contain ecom operator details. | Refer A 1.1 | List of clttxa or paytxa or both sub sections.
| A 1.1           SUPECOA Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | supecoa{clttxa[{}],paytxa[{}]} | SUPECOA Details | Refer to SUPECOA Data
Section wise details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | clttxa[{}] | contains supecoa details for section 9(5) | List<SUPECOA>    clttxa | "clttxa":[{
        "oetin": "20ALYPD6528PQC5",
        "etin": "20ALYPD6528PQC5",
        "suppval": 10000,
        "igst": 1000,
        "cgst": 0,
        "sgst": 0,
        "cess": 0,
        "flag": N,
        "omon": "052023"
        }]
2 | paytxa[{}] | contains supecoa details for section 52 | List<SUPECOA>    paytxa | "paytxa":[{
        "oetin": "20ALYPD6528PQC5",
        "etin": "20ALYPD6528PQC5",
        "suppval": 10000,
        "igst": 1000,
        "cgst": 0,
        "sgst": 0,
        "cess": 0,
        "flag": N,
        "omon": "052023"
        }]
| SUPECOA Details Data
| A 1.1.1           SUPECOA Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | oetin | Original Ecom Operator | Alphanumeric with 15 characters | 06ADECO9084R5Z5
2 | etin | Ecom Operator | Alphanumeric with 15 characters | 06ADECO9084R5Z5
3 | suppval | Supplier Value | Decimal (11,2) | 111111
4 | igst | IGST amount | Decimal (3,2) | 123
5 | cgst | CGST amount | Decimal (3,2) | 123
6 | sgst | SGST amount | Decimal (3,2) | 123
7 | cess | Cess Amount | Decimal (3,2) | 123
8 | flag | Tax payer action | String enum('N','E','D') | N
9 | omon | Original Month | String{Max Length:6) | 052023
Get SUPECOA Token Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | token | Token | String | XYZABC
2 | est | Estimated Time in minutes | String | 30

## SUPECO
SUPECO Details
Get SUPECO Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | {supeco} | SUPECO Details : object of SUPECO contains both sections "clttx" and "paytx" which will contain ecom operator details. | Refer A 1.1 | List of clttx or paytx or both sub sections.
| A 1.1           SUPECO Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | supeco{clttx[{}],paytx[{}]} | Invoice Details | Refer to SUPECO Details Data
Section wise details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | clttx[{}] | contains supeco details for section 52 | List<SUPECO>    clttx | "clttx":[{
        "etin": "20ALYPD6528PQC5",
        "suppval": 10000,
        "igst": 1000,
        "cgst": 0,
        "sgst": 0,
        "cess": 0,
        "flag": "E"
}]
2 | paytx[{}] | contains supeco details for section 9(5) | List<SUPECO>    paytx | "paytx":[{
        "etin": "20ALYPD6528PQC5",
        "suppval": 10000,
        "igst": 1000,
        "cgst": 0,
        "sgst": 0,
        "cess": 0,
        "flag": "E"
        }]
| SUPECO Details Data
| A 1.1.1           SUPECO Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | etin | EcomOperator | Alphanumeric with 15 characters | 06ADECO9084R5Z5
2 | suppval | Supplier Value | Decimal (11,2) | 111111
3 | igst | IGST amount | Decimal (11,2) | 123
4 | cgst | CGST amount | Decimal (11,2) | 123
5 | sgst | SGST amount | Decimal (11,2) | 123
6 | cess | Cess Amount | Decimal (11,2) | 123
7 | flag | Tax payer action | String enum('N','E','D') | N

## ECOM
ECOM Request
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ecom{} | This object has objects of all sections | Refer A 1 | Sections will be present based on the data to be saved.
| A 1 - Ecom Object
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2b} | B2B Invoices | Refer A 1.1 | The list will contain invoices for B2B section
2 | List{b2c} | B2C Invoices | Refer A 1.3 | The list will contain invoices for B2C Section
3 | List{urp2b} | URP2B Invoices | Refer A 1.2 | The list will contain invoices for URP2B section
4 | List{urp2c} | URP2C Invoices | Refer A 1.4 | The list will contain invoices fpr URP2C
| A 1.1           B2B Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rtin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
2 | stin | GSTIN/UID of the Supplier taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 27ANTCS1234F1ZI
3 | List{inv} | Invoice Details | Refer to B2B Invoice Data A 1.1.1
| B2B Invoice Data
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete | The flag shows the the type of action user wants to perform
2 | inum | Supplier Invoice Number | String (Max length:16) | S008400
3 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 45143
4 | val | Supplier Invoice Value | Decimal(13,2) | 10000
5 | pos | Place of supply | String(Max length:2) | 04
6 | inv_typ | Invoice type | String (Max length: 5) (SEWP/SEWOP/DE) | DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
7 | List {itms} | Items | Refer  A 1.1.2
8 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65
Get B2B Token Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | token | Token | String | XYZABC
2 | est | Estimated Time in minutes | String | 30
A 1.2 URP2B Section
| A 1.1           URP2B Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rtin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
2 | List{inv} | Invoice Details | Refer to URP2B Invoice Data A 1.2.1
| URP2B Invoice Data
| A 1.2.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
2 | inum | Supplier Invoice Number | String (Max length:16) | S008400
3 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 45143
4 | val | Supplier Invoice Value | Decimal(15,2) | 10000
5 | pos | Place of supply | String(Max length:2) | 04
6 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP) | R- Regular, SEWP – SEZ Exports with payment
7 | List {itms} | Items | Refer  A 1.2.2
8 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
| A 1.2.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.2.2.1
| A 1.2.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65
Get B2B Token Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | token | Token | String | XYZABC
2 | est | Estimated Time in minutes | String | 30
A 1.3         B2C Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
2 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
3 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
4 | rt | Rate as per invoice | Decimal(3, 2) | 10
5 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
6 | camt | CGST Amount as per invoice | Decimal(11, 2) | 1000
7 | samt | SGST Amount as per invoice | Decimal(11, 2) | 1000
8 | csamt | Cess Amount as per invoice | Decimal(11, 2) | 1000
9 | stin | Supplier GSTIN | Alphanumeric (Max length:15) | 27AHQPA7588L1ZJ
10 | pos | Place of Supply | String(Max length:2) | 04
A 1.4         URP2C Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
2 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
3 | txval | Taxable value of Goods or Service as per invoice | Decimal(11, 2) | 10000
4 | rt | Rate as per invoice | Decimal(3, 2) | 10
5 | iamt | IGST Amount as per invoice | Decimal(11, 2) | 1000
6 | camt | CGST Amount as per invoice | Decimal(11, 2) | 1000
7 | samt | SGST Amount as per invoice | Decimal(11, 2) | 1000
8 | csamt | Cess Amount as per invoice | Decimal(11, 2) | 1000
9 | pos | Place of Supply | String(Max length:2) | 04

## ECOMA
ECOMA Request
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | ecoma{} | This object has objects of all sections | Refer A 1 | Sections will be present based on the data to be saved.
| A 1 - Ecoma Object
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | List{b2ba} | B2BA Invoices | Refer A 1.1 | The list will contain invoices for B2BA section
2 | List{b2ca} | B2CA Invoices | Refer A 1.3 | The list will contain invoices for B2CA Section
3 | List{urp2ba} | URP2BA Invoices | Refer A 1.2 | The list will contain invoices for URP2BA section
4 | List{urp2ca} | URP2CA Invoices | Refer A 1.4 | The list will contain invoices fpr URP2CA
| A 1.1           B2BA Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rtin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
2 | stin | GSTIN/UID of the Supplier taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 27ANTCS1234F1ZI
3 | List{inv} | Invoice Details | Refer to B2B Invoice Data A 1.1.1
| B2BA Invoice Data
| A 1.1.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete | The flag shows the invoice status from the supplier perspective
2 | inum | Supplier Invoice Number | String (Max length:16) | S008400
3 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 45143
4 | val | Supplier Invoice Value | Decimal(13,2) | 10000
5 | pos | Place of supply | String(Max length:2) | 04
6 | inv_typ | Invoice type | String (Max length: 5) (SEWP/SEWOP/DE) | DE – Deemed Exports, SEWP – SEZ Exports with payment,
SEWOP – SEZ exports without payment
7 | oinum | Original invoice number | String (Max length:16) | S008400
8 | oidt | Original invoice date | string (DD-MM-YYYY) | 45143
9 | List {itms} | Items | Refer  A 1.1.2
10 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
| A 1.1.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.1.2.1
| A 1.1.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65
Get B2BA Token Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | token | Token | String | XYZABC
2 | est | Estimated Time in minutes | String | 30
A 1.2 URP2BA Section
| A 1.1           URP2B Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rtin | GSTIN/UID of the Receiver taxpayer/UN, Govt Bodies | Alphanumeric with 15 characters | 06ADECO9084R5Z4
3 | List{inv} | Invoice Details | Refer to URP2B Invoice Data A 1.2.1
| URP2BA Invoice Data
| A 1.2.1           Invoice Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
3 | inum | Supplier Invoice Number | String (Max length:16) | S008400
4 | idt | Supplier Invoice Date | string (DD-MM-YYYY) | 45143
5 | val | Supplier Invoice Value | Decimal(13,2) | 10000
6 | oinum | Original invoice number | String (Max length:16) | S008400
7 | oidt | Original invoice date | string (DD-MM-YYYY) | 45143
8 | List {itms} | Items | Refer  A 1.2.2
9 | pos | Place of Supply | String(Max length:2) | 04
10 | inv_typ | Invoice type | String (Max length: 5) (R/SEWP) | R- Regular, SEWP – SEZ Exports with payment
11 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
| A 1.2.2           Items
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | num | Serial no | Integer | 2
2 | itm_det | Item Details | Refer to A 1.2.2.1
| A 1.2.2.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65
Get URP2BA Token Response
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | token | Token | String | XYZABC
2 | est | Estimated Time in minutes | String | 30
A 1.3         B2CA Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | pos | Place of Supply | String(Max length:2) | 04
2 | posItms | Pos item details | Refer to A 1.3.1
| A 1.3.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
2 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
3 | itms | Item Details | Refer to A 1.3.2
4 | stin | Supplier Gstin | Alphanumeric (Max length:15) | 27AHQPA7588L1ZJ
5 | ostin | Original Supplier Gstin | Alphanumeric (Max length:15) | 27AHQPA7588L1ZJ
6 | omon | Original Month | String(Max length:6) | 62023
| A 1.3.2         Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65
A 1.4         URP2CA Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | Tax payer action | One Character(N/E/D) | N - New save, E - Edit, D - Delete
2 | sply_ty | Supply Type | String(Max length:5) | INTER/INTRA
3 | itms | Item Details | Refer to A 1.4.1
4 | pos | Place of Supply | String(Max length:2) | 04
5 | omon | Original Month | String(Max length:6) | 62023
| A 1.4.1          Items Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | rt | Rate | Decimal(3,2) | 10
2 | txval | Taxable value of Goods or Service as per invoice | Decimal(11,2) | 10000
3 | iamt | IGST Amount as per invoice | Decimal(11,2) | 650
4 | camt | CGST Amount as per invoice | Decimal(11,2) | 650
5 | samt | SGST Amount as per invoice | Decimal(11,2) | 650
6 | csamt | cess Amount as per invoice | Decimal(11,2) | 65

## Doc Issued
Note: For Delete-Flag D will be required
Document Issue Data |  |  |  |  | Remarks
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | doc_issue | Document issued during the tax period | Refer A 1.1
|  |  |  |  |  | Back to API LIST
A 1.1           Doc Issue Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | flag | tax payer action | One Character(D) | D-Delete (For deleting invoices)
2 | chksum | Invoice Check sum value | string(Max length:64) | AflJufPlFStqKBZ
3 | List{ doc_det } | Document issued Details | Refer A 1.1.2
A 1.1.2    Document issued Details
S No | Parameter Name | Description | Field Specifications | Sample Value
1 | doc_num | Document Number (Refer Table 1.1.2 A ) | Integer | 1
2 | List{docs} | Documents List | Refer A 1.2
A 1.2           Doc Issue Invoices
S No | Parameter Name | Description | Field Specifications | Sample Value |  | Table 1.1.2 A : Document Table
1 | num | Serial Number | Integer | 1 | Integer value should be 1 or above. | Doc Num. | Nature of document
2 | from | From serial number | String(Max length: 16) | 25
3 | to | To serial number | String(Max length: 16) | 29 |  | 1 | Invoices for outward supply
4 | totnum | Total Number | Integer | 20 |  | 2 | Invoices for inward supply from unregistered person
5 | cancel | Cancelled | Integer | 3 |  | 3 | Revised Invoice
6 | net_issue | Net issued | Integer | 17 |  | 4 | Debit Note
|  |  |  |  |  | 5 | Credit Note
|  |  |  |  |  | 6 | Receipt voucher
|  |  |  |  |  | 7 | Payment Voucher
|  |  |  |  |  | 8 | Refund voucher
|  |  |  |  |  | 9 | Delivery Challan for job work
|  |  |  |  |  | 10 | Delivery Challan for supply on approval
|  |  |  |  |  | 11 | Delivery Challan in case of liquid gas
|  |  |  |  |  | 12 | Delivery Challan in cases other than by way of supply (excluding at S no. 9 to 11)

## Validation Rules
GSTR-1 Save Validations Rule
Sl No | Return Type | Section | Validation Rules | Description | Impact
1 | GSTR1 | General | Supplier GSTIN validity- Header | Valid registered user. | Return Rejection
2 | GSTR1 | General | Return period validtiy- Header | Return period should not be more than the current period. | Return Rejection | Back to API LIST
3 | GSTR1 | General | GSTR1 submission/filing check | Supplier GSTIN should not have already submitted/filed the GSTR1 for the current period. | Return Rejection
4 | GSTR1 | B2B | Invoice Duplication Check1 | In the same FY, there should not be any duplicate invoice number | Invoice Rejection
5 | GSTR1 | B2B | Counter Party Check | Receiver GSTIN should be valid registered user | Invoice Rejection
6 | GSTR1 | B2B | Invoice Date Validation -1 | Invoice Date should not greater than return period | Invoice Rejection
7 | GSTR1 | B2B | Invoice Date Validation -2 | Invoice Date should not be 18 months older. | Invoice Rejection
8 | GSTR1 | B2B | Invoice Date Validation -3 | Validation on invoice date is after Registration Date of the specific Supplier Tin | Invoice Rejection
9 | GSTR1 | B2BA | Invoice check | Old Invoice number should exist in the system. | Invoice Rejection
10 | GSTR1 | B2BA | Invoice Amendable Check | Invoice should be amendable state. (Already amended/modified invoices cannot be amended, Accepted invoice cannot be amended) | Invoice Rejection
11 | GSTR1 | B2BA | new invoice number check | if the invoice number is amended, need to perform the duplication check for the new invoice number | Invoice Rejection
12 | GSTR1 | B2BA | new invoice date check | If the invoice date is amended,need to perform the Invoice date validation check s (Sl no 7 & 8) | Invoice Rejection
13 | GSTR1 | B2BA | Counter party check | If the original invoice number belongs to same counter party | Invoice Rejection
14 | GSTR1 | B2CL | Invoice Duplication Check | In the same FY, there should not be any duplicate invoice number | Invoice Rejection
15 | GSTR1 | B2CL | State code validty | Valid State Code | Invoice Rejection
16 | GSTR1 | B2CL | Invoice Date Validation -1 | Invoice Date should not greater than return period | Invoice Rejection
17 | GSTR1 | B2CL | Invoice Date Validation -2 | Invoice Date should not be 18 months older. | Invoice Rejection
18 | GSTR1 | B2CL | Invoice Date Validation -3 | Validation on invoice date is after Registration Date of the specific Supplier Tin | Invoice Rejection
19 | GSTR1 | CDNR | Duplicate note number | In the same FY, there should not be any duplicate credit/debit note number | Note Rejection
20 | GSTR1 | CDNR | Invoice number validation | Original Invoice should be present for which credit note/debit note to be issued | Note Rejection
21 | GSTR1 | CDNR | Receiver GSTIN validation | GSTIN of invoice and GSTIN of Credit/debit note issued should be same | Note Rejection
22 | GSTR1 | CDNR | Credit Note Value validation | Differential value and differential tax should be <= the invoice value. If there are multiple Credit notes against one invoice then sum(differential value of all credit notes) <= invoice value | Note Rejection
23 | GSTR1 | CDNR | Note Date validation -1 | Credit/Debit note date should not be greater then the return period | Note Rejection
24 | GSTR1 | CDNR | Note Date validation -2 | Credit/Debit note Date should be after the invoice date | Note Rejection
25 | GSTR1 | CDNR | Tax rate validation (Credit note) | Tax rate of invoice should be same as Differential tax rate of credit note | Note Rejection
26 | GSTR1 | CDNRA(A)(Ammendable check ) |  | Same ammendable check as B2BA
27 | GSTR1 | EXP | Invoice Date Validation -1 | Invoice Date should not greater than return period | Invoice Rejection
28 | GSTR1 | EXP | Invoice Date Validation -2 | Invoice Date should not be 18 months older. | Invoice Rejection
29 | GSTR1 | EXP | Invoice Date Validation -3 | Validation on invoice date is after Registration Date of the specific Supplier Tin | Invoice Rejection
30 | GSTR1 | EXP | Invoice Duplication Check | In the same FY, there should not be any duplicate invoice number | Invoice Rejection
31 | GSTR1 | EXPA | Ammendable check
32 | GSTR1 | AT,B2B,B2CL,B2CS,CDNR,CDNUR,EXP,TXPD | Rate amount validation check | 1. If diff_percent is not present then iamt or camt and samt should be rt%*taxval
2. If diff-percent is not null then iamt or camt and samt should be rt%*taxval*0.65 | Invoice Rejection
|  | ATA,B2BA,B2CLA,B2CSA,CDNRA,CDNURA,EXPA,TXPDA
33 | GSTR1 | B2B,B2BA,CDNR,CDNRA,CDNUR,CDNURA,EXP,EXPA | CESS check for without payment of tax | for supplies to sez units and exports without payment of tax cess should not be present | Invoice Rejection
34 | GSTR1 | B2B,B2BA,CDNR,CDNRA,CDNUR,CDNURA,EXP,EXPA | IGST check for with payment of tax | for supplies to sez units and exports with payment of tax IGST must be present | Invoice Rejection
