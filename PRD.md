# PRD — Audience Design

## Overview

**Product:** Audience Design
**What it does:** Frontend/UX prototype for QuestionPro Audience — create and manage Specialized sample, B2B, and Instant answers projects, including organization-level panel pricing defaults.
**Primary users:** UX, Uber admins, Admins

## Key Entities

- **Organization** — QuestionPro org with Audience panel settings
- **Specialized sample** — Panel projects with demographic targeting and vendor fulfillment
- **B2B** — Business-to-business project requirements with account-level Base CPI and Margin
- **Instant answers** — Lightweight surveys without demographic targeting
- **Pricing model** — How Selling/Buying CPI is determined for Specialized sample
- **Approval request** — Draft pricing changes submitted by Admin, awaiting Uber admin approval

## Primary User Actions

- create projects
- launch surveys
- monitor project status
- post survey launch actions
- configure organization panel settings
- submit pricing changes for approval (Admin)
- approve or reject pricing changes (Uber admin)

---

## Screens & Flows

### Organization panel settings

**URL:** `/admin/panel-settings`
**Nav label:** Panel settings (sidebar footer, directly above Trash)
**Purpose:** Configure organization-level pricing, vendor, and integration defaults for Audience projects.
**Layout:** Full-width content header bar (same pattern as Projects): left-aligned **Panel settings** title; top-right WickUI actions — **Reset** / **Cancel** (`variant="secondary"`), **Submit for approval** or **Save changes** (`variant="primary"`), **Reject request** (`variant="outline"` `color="error"`). Use WuButton `loading` for in-progress states. Compact **Demo role** selector sits inline next to the page title. Dropdowns are sized to their longest option. All UI labels use **sentence case**.
**Data shown:**
- **Search organization** (Admin and Uber admin).
- **Admin home:** Search, then **Organization detail** for the AM’s own account.
- **Uber admin home:** **Pending requests** table first, then Search, then **Organization detail** for the Uber admin’s own account.
- **Other org / View request:** Full org Panel settings with proposed draft values, comment/docs, and Request log.
- **Organization detail** table (Users-style): Org ID, Org name, User email, License, Account manager.
- **Settings tabs (in order):** Specialized sample → **B2B** → Instant answers.
**Actions:** Search by Organization ID (both roles), Submit for approval (Admin), View request / Approve from inbox (Uber admin), Save changes / Reject request with required reason (Uber admin on a pending request).

#### Access & approval

| Role | Edit pricing fields | Change pricing model | Persist changes |
|------|---------------------|----------------------|-----------------|
| **Admin** | Yes | Yes (Specialized sample only) | **Submit for approval** — sends draft to Uber admin; not live until approved |
| **Uber admin** | Yes (on View request or own org) | No | **Approve** from inbox or detail (**Save changes**); **Reject request** on detail (reason required) |

- Admins start with **Search organization**, then see their own account’s panel settings.
- Uber admins see **Pending requests** at the top, then **Search organization**, then their own account’s panel settings.
- **View request** opens the full organization Panel settings with all changes proposed by the Account manager applied in the form. **Back to organization detail** returns to the home layout.
- Before Submit for approval, Admins may optionally add a **Comment** and upload **supporting documents**. Both are optional and shown to the Uber admin on the pending request and in the inbox Comment column.
- While a request is pending, Admins cannot edit further until it is approved or rejected.
- Uber admins can adjust field values on a pending request before approving.
- Rejecting a request requires a **Reason** from the business owner (Uber admin). That reason is stored on the **Request log** so Admins can see why it was rejected.
- The **Request log** shows every request with Account manager, Date, Pricing model, Status (Pending / Approved / Rejected), and Reason (for rejections).
- Approval drafts include **Specialized sample**, **B2B**, and **Instant answers** settings together.

#### Specialized sample — Pricing models

Admin selects pricing model via **dropdown**. **Default variable** and **Vendor** appear for every model.

| Mode | Fields | Behavior |
|------|--------|----------|
| **Fixed price** | Selling CPI, Buying CPI, IR (%), Margin (%) | Fixed buy/sell rates apply up to the defined IR. Margin is applied when study IR is below the defined IR. Default Buying CPI is $0.50. Default Margin is 70%. |
| **Margin based** | Base CPI, Margin (%) | Selling CPI = Vendor CPI × (1 + Margin %). If the result is below Base CPI, Base CPI is used. Default Margin is 70%. |
| **Rate card** | IR × LOI WuTable — Selling CPI editable | Default grid from vendor Buying CPI table; Selling floored at $1.50; Buying derived at 150% markup (system-calculated, not shown in grid). |
| **Override pricing** | Base CPI, Margin (%) | At project time the user enters a Selling CPI that cannot be less than Base CPI. Buying CPI is calculated as Selling CPI ÷ (1 + Margin %). Default Margin is 70%. |

#### B2B

Second settings tab (after Specialized sample). Account-level pricing for B2B project requirements.

| Field | Behavior |
|-------|----------|
| **Base CPI** | Minimum / floor Selling CPI for B2B requirements on this account. Default is $5.00. |
| **Margin (%)** | Margin applied for B2B pricing on this account. Default is 70%. |

Pricing preview: Selling CPI = Base CPI × (1 + Margin %). Admins and Uber admins edit these fields under the same approval rules as other panel settings.

#### Instant answers

Third settings tab. Fields: Selling CPI, Default variable. Always uses the platform default panel vendor (no vendor selector).

#### Pricing preview

A compact calculator beside the settings form on each tab. Preview values seed from the org settings; editable inputs recalculate dependent values. Edits in the preview do not write back to the form until the form fields themselves are changed.

---

## Terminology

| Term | Definition |
|------|------------|
| Selling CPI | Cost per interview charged to the client |
| Buying CPI | Cost per interview paid to the panel vendor |
| Base CPI | Floor / minimum Selling CPI (Margin based, Override, and B2B) |
| Margin | Percentage markup or factor used to derive Selling/Buying CPI |
| IR | Incidence rate (%) |
| LOI | Length of interview (minutes) |
| Rate card | Matrix of IR/LOI ranges mapped to Selling and Buying CPI |
| Vendor | Panel supplier (e.g. PureSpectrum, Cint) |
| Default variable | Integration variable used during panel setup |
| B2B | Business-to-business project pricing for the account (Base CPI + Margin) |
| Submit for approval | Admin action that sends pricing draft to Uber admin |
| Pending requests | Uber admin inbox listing orgs awaiting approval (shown at the top, above Search and Organization detail) |
| Organization detail | Table of org metadata for the loaded org: Org ID, Org name, User email, License, Account manager |
| View request | Opens full Panel settings for an org with the AM’s proposed changes |
| Comment & supporting documents | Optional note and file uploads Admins can attach before Submit for approval |
| Request log | History of approval requests: Account manager, Date, Pricing model, Status, and Reason |
| Reason | Required explanation from the Uber admin when rejecting a request |
| Save changes | Uber admin action that applies the pending draft as live settings |

---

## Push project (Live)

**Purpose:** When a Live project is not gaining traffic as expected, users can **Push** the project to accelerate collection.

**Availability**
- **Projects table:** Hover a Live project row — **Push** appears on the right side of the row.
- **Project detail:** Top-right of the **Collection progress** card (Live projects only). **Push** has no icon.

**Flow**
1. User clicks **Push**.
2. Modal asks whether to push at the **Same CPI** or a **Higher CPI**.
3. **Same CPI:** Allowed only if the project has been pushed fewer than 2 times at the current CPI. After 2 same-CPI pushes, Same CPI is disabled.
4. **Higher CPI:** User enters a new CPI that must be at least **10% above** the current CPI.
5. Confirming updates the project CPI (and resets the same-CPI push count when pushing higher) and shows a success toast.

**Demo seeding**
- Some Live list projects start with 0, 1, or 2 same-CPI pushes so both allowed and locked Same CPI states are visible.
