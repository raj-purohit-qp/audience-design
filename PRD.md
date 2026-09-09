# PRD — Audience Design

## Overview

**Product:** Audience Design
**What it does:** Frontend/UX prototype for QuestionPro Audience — create and manage Specialized sample, B2B, and Instant answers projects, including organization-level panel pricing defaults.
**Primary users:** UX, Uber admins, Admins, Primary user

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
- manage organization access and member permissions
- submit pricing changes for approval (Admin)
- approve or reject pricing changes (Uber admin)

---

## Screens & Flows

### Home

**URL:** `/home`
**Nav label:** Home (top of sidebar)
**Page heading:** Audience

Home has two states:

#### Empty state (no projects yet)
**Purpose:** First-time choice screen before any project exists — pick Audience or Synthetic Data.
**Visibility:** Only when the account has **no created projects**.
**Layout:** Two product cards (Specialized sample / Instant answers / Explore Synthetic Data).

#### Dashboard (has projects)
**Purpose:** Unified landing with entry points, recent projects, and a combined projects feed.
**Visibility:** When the account has **any created projects** (seed mock list counts in the prototype).
**Layout:**
- Page header: *Your research hub — real respondents & synthetic data in one place*
- Two entry cards: **Audience** (+ Create project, active projects chip) and **Synthetic Data** (Explore Synthetic, datasets chip)
- **Recent Projects** row of quick-access cards
- Tabs: **Audience · Real Responses** | **Synthetic Data** with a projects table (Solution, Project name, Status, Progress, Completes, Total cost, Last active)
- Footer with credit balance

**Demo:** Force empty chooser with `sessionStorage.setItem('audience-empty-home','1')` then reload `/home`.

### Specialized sample

**URL:** `/projects`
**Nav label:** Specialized sample (Audience group in sidebar)
**Page heading:** Specialized sample
**Purpose:** List and manage Specialized sample projects (formerly labeled Projects).
**Layout:** Page header with **Create project**; search; projects table with status, progress, cost columns, and row actions.

### Organization panel settings

**URL:** `/admin/panel-settings`
**Nav label:** Panel settings (sidebar footer, above Admin and Settings)
**Purpose:** Configure organization-level pricing, vendor, and integration defaults for Audience projects.
**Layout:** Full-width content header bar (same pattern as Projects): left-aligned **Panel settings** title; top-right WickUI actions — **Reset** / **Cancel** (`variant="secondary"`), **Submit for approval** or **Save changes** (`variant="primary"`), **Reject request** (`variant="outline"` `color="error"`). Use WuButton `loading` for in-progress states. Compact **Demo role** selector sits inline next to the page title. Dropdowns are sized to their longest option. All UI labels use **sentence case**.
**Data shown:**
- **Search organization** (Admin and Uber admin).
- **Admin home:** Search, then **Organization detail** for the AM’s own account.
- **Uber admin home:** **Pending requests** table first, then Search, then **Organization detail** for the Uber admin’s own account.
- **Other org / View request:** Full org Panel settings with proposed draft values, comment/docs, and Request log.
- **Organization detail** table (Users-style): Org ID, Org name, User email, License, Account manager.
- **Settings tabs (in order):** Specialized sample → **B2B** → Instant answers → **Multi-source launch**.
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
- Approval drafts include **Specialized sample**, **B2B**, **Instant answers**, and **Multi-source launch** settings together.

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

#### Multi-source launch

Fourth settings tab. Account managers configure multi-source launch capability for the organization.

| Field | Behavior |
|------|----------|
| **Launch with community** | WuToggle. When on, the account can launch Audience projects using community as an additional sample source. Default is off. |

Edits follow the same Admin submit-for-approval / Uber admin approve-or-reject rules as other panel settings.

#### Pricing preview

A compact calculator beside the settings form on each tab. Preview values seed from the org settings; editable inputs recalculate dependent values. Edits in the preview do not write back to the form until the form fields themselves are changed.

### Organization access

**URL:** `/admin/organization-access`
**Nav label:** Organization access (workspace switcher, third option — primary user only)
**Page heading:** Organization access
**Purpose:** Primary user administers what other organization members can create and which workspaces they can access.
**Visibility:** Only the primary user. Regular users do not see this option in the workspace dropdown or any permission controls.
**Layout:** Page header with supporting text *Manage what members of your organization can create and which workspaces they can access.* Compact prototype Demo role / Demo org / Demo save selectors sit in the header. Organization users table: User, Project creation, Workspace access, Actions.

#### Primary user vs regular user

- There is exactly **one primary user** per organization. That row is labeled **Primary user** and cannot have administrative access removed.
- **View access** on the primary user opens a read-only configuration panel.
- **Manage** on any other member opens a right-side drawer to edit that member only.

#### User permission configuration

Drawer sections, in order:

1. **Project creation** — *Choose which Audience products this user can create.* Independent toggles for Specialized sample, Instant answers, and Synthetic.
2. **Workspace access** — *Choose which users' workspaces this user can access.* **Accessible workspaces** is a searchable multi-select of every organization member, including the primary user. Default for a first-time configuration: all members selected.
3. **Access level** — For each selected workspace, **Read** or **Read & write**. Default is **Read & write**. Ownership does not change.

**Read:** view projects, project details, monitoring, and reports — no edits.
**Read & write:** view, edit, manage, and take owner-like actions on projects in that workspace.

#### Actions & feedback

- **Update permissions** saves the member. Success toast: *Permissions updated successfully.* Failure toast: *Unable to update permissions. Please try again.*
- Unsaved changes warn before closing the drawer, switching members, or leaving the page.
- Removing a workspace from Accessible workspaces confirms that the user will lose access to that workspace.
- Changing Read & write → Read confirms that the user will lose the ability to modify projects in that workspace.

#### Empty / edge states

- Solo organization (only the primary user): info message that there are no other members to manage yet.
- Large organization: search and a virtualized workspace picker.
- Member with no accessible workspaces: warning in the drawer and **No workspaces** in the table.
- Regular-user demo role: locked empty state — only the primary user can manage organization access.

### My Workspace and Shared Workspaces

**Purpose:** Users switch between their own projects and other organization members’ workspaces they have been granted access to.
**Default:** My Workspace is selected at the start of every session. Shared workspace selection is kept in `sessionStorage` for the rest of the login session only.
**Nav:** Workspace switcher at the top of the sidebar (LivePolls-style dropdown). Trigger shows the active context: *My workspace* / *Private*, *Shared workspace* / owner name, or *Organization access* / *Admin*. Menu items: **My workspace**, then a **Shared workspace** section listing granted users in the same menu, and **Organization access** as the third option for the primary user only. Regular users see only the first two. Empty shared state shows *No shared workspaces*. Long names truncate with a tooltip.
**Project list:** Specialized sample shows only the active workspace’s projects. Header uses *My Workspace* / *Your projects*, or *{Name}'s workspace* / *Projects created by {Name}*, plus a Read or Read & write chip on shared workspaces.
**Create project:** Shown only in My Workspace when the user can create Specialized sample. Creating from a shared workspace returns the user to My Workspace.
**Read:** View projects and details; hide write actions (status change, push, edit, pause, resume, close).
**Read & write:** Existing project actions remain available. Ownership does not change.
**Empty:** My Workspace — *No projects yet* / *Projects you create will appear here.* plus Create when allowed. Shared — *No projects available* / *There are currently no projects in this workspace.*
**Access revoked:** *Access unavailable* / *You no longer have access to {Name}'s workspace.* with **Go to My Workspace**.
**Prototype demo (Specialized sample header):** Typical, Primary user, Empty mine, No shared, Large org, Access revoked. Typical logs in as Sarah Chen (no Organization access option). Primary user logs in as John Smith and shows Organization access in the workspace dropdown.

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
| Primary user | The single organization member who can administer Organization access. Administrative access cannot be removed. |
| Organization access | Primary user settings for project creation rights and workspace access of other members |
| Project creation | Whether a member can create Specialized sample, Instant answers, and/or Synthetic projects |
| Accessible workspaces | The organization members whose workspaces another member can open |
| My Workspace | The logged-in user's own workspace — projects they created |
| Shared workspace | Another organization member's workspace the logged-in user has been granted access to |
| Read | View projects, details, monitoring, and reports in a workspace — no edits |
| Read & write | View and edit projects in a workspace. Project ownership does not change |

---

## Create project

**URL:** `/projects/create`
**Purpose:** Configure a new Audience project and review pricing before create.
**Layout:** Two-column — scrollable form (left) + sticky **Your estimate** panel (right).

**Form sections (top → bottom)**
1. **Project name** — WuInput title field, 100-character limit
2. **Source** — Country (WuSelect), Language (WuSelect), Survey (WuMenu + WuButton “Select survey”)
3. **How many responses do you need?** — WuStepper + response preset WuChips (and range control for quick scrubbing)
4. **What are the key parameters for survey fielding?** — Incidence rate (WuStepper + Check with AI), Completion date (WuDatePicker), Survey length (WuStepper)
5. **Countries** — WuButton country tabs + Add country (WuMenu); per-country qualifications shown in a WuCard
6. **Select your audience** — Custom audience (WuButton) + My templates / Default templates as selectable WuCards

**Your estimate**
- Respondents, Cost per completion, Est. completion date, Total
- Feasibility WuChip
- **Create project** primary action
- Self-service vs managed service pricing note

**Actions:** Back → projects list; Create project → saves mock project and opens detail.


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

---

## Top-up — Closed project

**Purpose:** After a project is **Closed**, collect additional responses on the same project instead of creating a new one.

**Availability**
- **Project detail** only, when status is **Closed** and the user can write.
- Action sits in the existing header action area as **Top-up** (outlined, plus icon). Tooltip: *Collect additional responses for this project.*

**Flow**
1. User clicks **Top-up**.
2. A small modal asks **How many additional responses do you need?**
3. Numeric field **Additional responses**, with **Cancel** and **Launch**.
4. Default quantity:
   - If reconciled responses > 0: default = reconciled responses.
   - Otherwise: default = 20% of original required responses (the required count when the project closed).
5. The user can edit the value. **Launch** adds that quantity to required responses, reopens the project as **Live**, and shows a success toast.

**Demo seeding**
- **US Customer Experience Study Q2 2026** (`ap-001`) is Closed with 50 reconciled responses — default Top-up is **50**.
- **Gamers — Xbox UK** (`ap-006`) is Closed with no reconciliation — default Top-up is **10** (20% of 50).

---

## Multi-country Overview — country view

**Purpose:** On a multi-country project **Overview**, switch between aggregate (**All**) and a single country to inspect metrics and collection progress.

**Availability:** Multi-country project detail → **Overview** tab.

**Country dropdown**
- Default selection: **All**
- Options: **All**, then each launched country (flag + label)
- Changing the selection updates metric cards and **Collection progress** for that scope

**When All is selected**
- Metrics and Collection progress are project-wide aggregates
- An additional **Countries** container appears above **Launch criteria & audience configuration**, listing each launched country with status and collection progress

**When a country is selected**
- Metrics and Collection progress reflect that country’s child project only
- The **Countries** progress container is hidden
- Launch criteria reflect that country’s geography and any country overrides
