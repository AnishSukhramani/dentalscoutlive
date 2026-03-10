# Product Roadmap & To-Do List

Meeting notes and feature requirements to pick up soon.

---

## 1. Templates Component — Campaign-Centric Redesign

**Current state:** Templates tab shows individual templates with basic CRUD. Touchpoints are created in Campaigns tab, then templates are attached in Templates tab — two separate flows.

**Goal:** Make templates campaign-centric. Manage campaigns, touchpoints, and templates in one place.

- [ ] **Show campaigns first, not individual templates** — In Templates tab, display campaigns as the primary view. No standalone template list.
- [ ] **Campaign as clickable tab/section** — When a campaign is created (from Campaigns tab), it appears in Templates tab. Clicking a campaign opens its templates.
- [ ] **Create template → auto-attach to first touchpoint** — When creating a template for a campaign, it is automatically attached to the first touchpoint. No manual attachment step.
- [ ] **"+" button: create template + touchpoint together** — A small plus button that, when clicked, creates both a new template AND a new touchpoint at the same time, and attaches the new template to the new touchpoint.
- [ ] **Remove the two-step flow** — Eliminate: create touchpoint in Campaigns → go to Templates → attach template. Everything managed in Templates.

---

## 2. Customizable Touchpoint Frequency ✅ DONE

**Current state:** ~~Hardcoded intervals~~ Now date-based.

**Implemented:**
- [x] **Date picker per touchpoint** — Touchpoint 1 = Manual. Touchpoint 2+ = date picker in Templates tab.
- [x] **scheduled_date** stored in campaign touchpoints (JSON, no migration needed).
- [x] **Campaign progression cron** — Uses scheduled_date (IST). Queues when today >= touchpoint's scheduled_date.

---

## 3. Pause & Terminate Campaign

**Goal:** Easier control over campaign lifecycle.

- [ ] **Pause campaign** — Temporarily stop sending touchpoints. Can be resumed later.
- [ ] **Terminate campaign** — Permanently stop a campaign. No further touchpoints sent.
- [ ] **UI controls** — Add pause/terminate buttons in campaign management.
- [ ] **Cron logic** — Campaign progression should skip paused/terminated campaigns.

---

## 4. App-Wide Polish & UX

**Goal:** Iron out wrinkles and make CRUD operations easier for users.

- [ ] **Inspect entire app** — Review all flows for friction points.
- [ ] **Simplify CRUD operations** — Reduce steps, improve feedback, clearer navigation.
- [ ] **General UX improvements** — Consistency, error handling, loading states, etc.

---

## Notes

- Do not implement these changes yet. Use this as a reference when picking up work.
- Order of implementation can be adjusted based on priority.
