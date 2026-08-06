> Source: ITR 4_Schema change document_AY2025-26_V1.3_1.pdf · 6 pages · transcribed verbatim

Central Board of Direct Taxes,
e-Filing Project
AY 2025-26 - ITR 4 - Schema Change Document
Version 1.3
01 January 2026
Directorate of Income Tax (Systems)
E-2, A.R.A. Centre, Ground Floor
Jhandewalan Extension
New Delhi – 110055

---

## Document Revision List

Document Name: 'ITR 4 Schema Changes for AY 2025-26'
Version Number: 1.3

### Revision Details

| Version No. | Revision Date | Revision Description | Page Number |
|---|---|---|---|
| 1.3 | 01 January, 2026 | Refer Section 2.3 | 6 |
| 1.2 | 26 August,2025 | Refer Section 2.2 | 5 |
| 1.1 | 30 July,2025 | Refer Section 2.1 | 5 |
| 1.0 | 30 May,2025 | Initial Release | NA |

---

## Contents

1. Purpose ................................................................................................ 5
2. Release changes ................................................................................. 5
   2.1 Schema changes as on 30th July, 2025 to the Original Schema released on 30th May, 2025 .......................................... 5
   2.2 Schema changes as on 26th August, 2025 to the Last Schema released on 30th July, 2025 .......................................... 5
   2.3 Schema changes as on 01st January, 2026 to the Last Schema released on 26th August, 2025 ...................................... 6

## List of Tables

Table 1: 30 July, 2025 Changes ..................................................... 5
Table 2: 26 August, 2025 Changes ................................................. 5
Table 3: 01 January, 2026 Changes ................................................ 6

---

## 1. Purpose

The purpose of this document is to track the changes done in ITR 4 Schema post first release.

## 2. Release changes

Below section describes the list of JSON schema changes since the first production release of the schema for Assessment year 2025-26.

### 2.1 Schema changes as on 30th July, 2025 to the Original Schema released on 30th May, 2025

#### Table 1: 30 July, 2025 Changes

| S.N | JSON Root Element | JSON Element Name | Change | Change Description |
|---|---|---|---|---|
| 1. | UsrDeductUndChapVIA | PRANNum | Modified | Length updated |
| 2. | Sch80DInsDtls | InsurerName | Modified | Length updated |

### 2.2 Schema changes as on 26th August, 2025 to the Last Schema released on 30th July, 2025

#### Table 2: 26 August, 2025 Changes

| S.N | JSON Root Element | JSON Element Name | Change | Change Description |
|---|---|---|---|---|
| 1. | NatOfBus44ADCodeAD | — | Modified | Description and Enum updated |
| 2. | NatOfBus44ADACodeADA | — | Modified | Description and Enum updated |

### 2.3 Schema changes as on 01st January, 2026 to the Last Schema released on 26th August, 2025

#### Table 3: 01 January, 2026 Changes

| S.N | JSON Root Element | JSON Element Name | Change | Change Description |
|---|---|---|---|---|
| 1. | ReturnFileSec | FilingStatus | Modified | New enum "21" is added for Return filing u/s 139(8A) and maximum value is updated |
| 2. | ITR 4 | PartA_139_8A | Added | New schedule "PartA_139_8A" is added in definitions and applicable fields are added inside "PartA_139_8A" as per notified form |
| 3. | ITR 4 | PartB-ATI | Added | New schedule "PartB-ATI" is added in definitions and applicable fields are added inside "PartB-ATI" as per notified form |
