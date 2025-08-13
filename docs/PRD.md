# Product Requirements Document (PRD)
## Project: Dental Scout Live

---

## 1. Document Control

- **Version:** 1.0  
- **Last Updated:** [Fill Date]  
- **Owner:** [Product Owner/Team]  
- **Contributors:** [List of contributors]

---

## 2. Purpose

Dental Scout Live is a web application designed to streamline the process of collecting, managing, and utilizing data about dental practices. The platform enables users to upload, map, and store practice data, and provides tools for efficient data management and future outbound communication.

---

## 3. Stakeholders

- **Product Owner:** [Name]
- **Development Team:** [Names]
- **End Users:** Data entry staff, marketing teams, business analysts

---

## 4. Goals & Objectives

- Simplify the ingestion of dental practice data from various file formats.
- Ensure data integrity through mapping and validation.
- Provide a robust interface for data review, editing, and management.
- Lay the groundwork for outbound communication features (e.g., email campaigns).

---

## 5. Features & Requirements

### 5.1 File Upload & Data Ingestion

**Requirements:**
- Support upload of Excel (`.xls`, `.xlsx`) and CSV files.
- Display file metrics: size, number of entries, column names.
- Preview the first 5 rows of uploaded data.
- Allow users to map file columns to required fields:
  - Practice Name
  - Practice Website URL
  - Owner Full Name
- Toggle for header row presence.
- Validate that all required fields are mapped and no two fields are mapped to the same column.
- Filter out rows missing a valid Practice Website URL.
- Insert mapped data into the `practices` table in Supabase.
- Provide clear feedback on upload success or failure.

**Acceptance Criteria:**
- Users cannot upload data unless all required fields are mapped.
- Upload fails gracefully with a clear error message if Supabase insert fails.

---

### 5.2 Data Table & Management

**Requirements:**
- Display all uploaded practices in a paginated, searchable table.
- Allow full-text search across all fields.
- Pagination controls (default 15 entries/page, adjustable up to 50).
- Row selection (individual, page, or all) for bulk actions.
- Inline editing of any row, with updates saved to Supabase.
- Row deletion with confirmation dialog.
- Copy selected rows as JSON to clipboard.
- Table columns: Practice Name, Domain URL, Owner Name, Email, Phone Number, First Name, Actions.

**Acceptance Criteria:**
- Table updates in real-time after edits or deletions.
- Search and pagination work together seamlessly.
- Bulk copy action copies only selected rows.

---

### 5.3 User Interface & Experience

**Requirements:**
- Sidebar navigation for Upload, Table, and Outbound sections.
- Responsive design for desktop and mobile.
- Consistent, modern UI using Tailwind CSS and Radix UI components.
- Toast notifications for user feedback.
- Modular, reusable UI components.

**Acceptance Criteria:**
- All features accessible on both desktop and mobile.
- UI components follow a consistent design language.

---

### 5.4 Outbound Communication (Planned)

**Requirements:**
- Placeholder for future outbound features (e.g., email campaigns, integrations).
- Design should allow for easy extension.

---

### 5.5 Email Management System (Implemented)

**Requirements:**
- ✅ List all email addresses and first names from the Supabase `practices` table in the Outbound section (primarily in `Outbound.jsx`).
- ✅ Display a column showing the number of emails sent to each email address (fetched from Supabase).
- ✅ For each row, provide a dropdown (using shadcn/ui select) to choose an email template (placeholder values: 1, 2, 3, 4, 5).
- ✅ Provide a dropdown to select the sender email ID (placeholder values: 1, 2, 3, 4, 5).
- ✅ Add a dropdown to choose between sending the email directly or creating a draft.
  - ✅ If 'Send Directly' is selected, allow scheduling via a date-time picker input or immediate send.
  - ✅ If 'Create Draft' is selected, save as draft without sending.
- [ ] Improve UI/UX for responsiveness and scheduling column (mobile-friendly, simpler scheduling UI)
- [ ] Add PST to IST converter above the table (desktop) or beside header (mobile), with live time and bidirectional input conversion
- [ ] Implement pagination and lazy loading (10 per page, up to 8000 entries, hybrid input/dropdown, custom footer, breadcrumbs, see SupabaseTable)
- [ ] Add search bar with highlighting (matches as you type, highlights across columns, see SupabaseTable)
- [ ] Add row selection and bulk actions bar (checkboxes, select menu bar, bulk template/email/send mode/scheduling, see SupabaseTable)

**Acceptance Criteria:**
- ✅ Emails and first names are listed from Supabase.
- ✅ Number of emails sent is accurately displayed per email address.
- ✅ Template and sender dropdowns function with placeholder values.
- ✅ Send/draft dropdown and scheduling/date-time picker work as described.
- [ ] UI is responsive and scheduling column is simple and clear on all devices
- [ ] PST/IST converter is visible and functional as described
- [ ] Pagination and lazy loading work efficiently for large datasets
- [ ] Search bar matches and highlights as you type
- [ ] Row selection and bulk actions bar work as described

---

## 6. Technical Architecture

- **Frontend:** Next.js (React 19), Tailwind CSS, Radix UI, Sonner (toasts)
- **Backend/Database:** Supabase (PostgreSQL)
- **File Parsing:** `xlsx` for Excel, `papaparse` for CSV
- **State Management:** React hooks

---

## 7. User Stories

1. **As a user,** I want to upload a file and map its columns, so I can import practice data accurately.
2. **As a user,** I want to preview my data before uploading, so I can verify correctness.
3. **As a user,** I want to search, edit, and delete practice records, so I can keep the database up to date.
4. **As a user,** I want to select multiple records and copy them, so I can use the data elsewhere.
5. **As a product owner,** I want the system to be extensible, so outbound features can be added later.

---

## 8. Known Limitations & Technical Debt

- Google Sheets integration not yet implemented.
- Row mapping validation needs to ensure no duplicate column assignments.
- File input reset and UI modularization improvements needed.
- Outbound section is a placeholder.
- No advanced error handling or logging.

---

## 9. Next Steps & Roadmap

- [ ] Implement Google Sheets integration.
- [ ] Add advanced validation and error handling.
- [ ] Expand outbound communication features.
- [ ] Further modularize and optimize UI components.
- [ ] Add user authentication and access control (future).
- [ ] Improve documentation and onboarding guides.
- [ ] Create a full-fledged email management system in the Outbound section, including email listing, sent count, template/sender selection, and scheduling/draft options.

---

## 10. Glossary

- **Supabase:** An open-source backend-as-a-service platform.
- **Practice:** A dental practice (business entity).
- **Outbound:** Features related to contacting or marketing to practices.

---

## 11. Appendix

- **App Title:** Neurality Health - Dental Scout
- **Description:** Dental Scout is a tool that helps you find emails of dental practice owners.

---

**Note:**  
This document is a living artifact. Please update it as features are added, changed, or clarified.