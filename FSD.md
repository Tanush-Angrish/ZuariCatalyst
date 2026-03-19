# Functional Specification Document (FSD)
**Project:** Zuari Catalyst (Idea Ticketing System)

## 1. Project Overview
**Purpose of the application:** 
Zuari Catalyst is a comprehensive, centralized idea management and ticketing platform. It empowers employees to submit innovative ideas and improvements, which are then systematically reviewed, refined, and converted into actionable projects by organizational leaders. 

**Problem it solves:**
Historically, tracking and managing employee suggestions across different departments or organizations within an enterprise can be disjointed, leading to lost ideas, poor visibility, and slow implementations. Zuari Catalyst centralizes this workflow, providing transparency, clear accountability, and AI-assisted data entry to streamline the innovation pipeline.

**Key features:**
- User-friendly idea submission with AI assistance (autofill, summarization, tagging)
- Real-time voice note and file attachment capabilities
- Dynamic Master Template management for administrators
- Distinct review workflows for Central Team (Superadmin) and Org Admins
- Comprehensive project lifecycle management (status, deadlines, tasks)
- Built-in chat and communication system on projects with @mentions
- Cross-platform notification system (In-app Bell, local toasts, email notifications)

## 2. Scope & Objectives
**System Goals:**
The primary goal is to foster an innovation culture by making it simple for employees to submit ideas while providing administrators the necessary workflow tools to evaluate, assign, and approve those ideas. Once approved, the system goals shift to tracking the realization of the idea through an integrated project management view.

**Included in Scope:**
- Role-based Access Control (Employee, Org Admin, Central Team).
- AI integration to reduce friction during idea submission.
- Complete Idea Lifecycle: Submission → Pending Review → Assigned → Approved/Rejected.
- Complete Project Lifecycle: Idea Approved → Project Created → Steps/Tasks Managed → Completion.
- Notifications via Email integration (Outlook/SMTP) and Database-backed in-app alerts.

**Excluded from Scope:**
- Deep enterprise ERP integration (e.g., SAP, Oracle backend processing), beyond single sign-on or basic sync if needed later.
- Budgeting or direct financial tracking of the project costs.

## 3. User Roles
The application operates on a strict Role-Based Access Control (RBAC) model.

**1. Employee:**
- Can access the Employee Dashboard to submit new ideas.
- Can use Gemini AI for autofilling idea forms.
- Can view their own submitted ideas and track their specific status.
- Receives notifications regarding their idea's progress.
- Can participate in project chats if they are the author.

**2. Org Admin:**
- Inherits all Employee permissions.
- Has an "Assigned to Me" dashboard view where they manage ideas delegated to their specific Organization by the Central Team.
- Can view "My Team Ideas" to see all ideas submitted by employees in their organization.
- Can Review, Approve, or Reject assigned ideas. (Approving an idea automatically converts it into a tracked Project).

**3. Central Team (Super Admin):**
- Has global visibility and control over all submitted ideas across all organizations.
- Dashboard features three distinct views: Ideas to Review, Assigned to Org Admin, and Approved by Me.
- Can assign pending ideas to specific Org Admins.
- Can directly approve or reject any idea.
- Can manage standard Form Fields and construct dynamic Idea Templates.
- Has access to the Global Settings and User Management dashboard (changing roles, creating users, assigning organizations).

## 4. User Flows / Workflows

**Idea submission:**
1. Employee navigates to "Submit Idea".
2. Employee selects a Category/Template (e.g., HR, Tech, Master Template).
3. Employee fills out the dynamic fields, problem description, expected impact, and optionally uploads files or records a voice note.
4. Submission creates an Idea record in `Pending Review` status.

**AI-assisted submission (Gemini):**
1. Employee types a rough paragraph into the "AI Autofill Bar".
2. Clicks "Autofill". The system sends the prompt to Gemini.
3. Gemini parses the intent and maps the information to the specific required fields on the active form.
4. The form is populated automatically; the user reviews and submits.

**Idea review (Central Team):**
1. Idea lands in Central Team's "Ideas to Review" tab.
2. Central admin views the AI-generated summary and tags to quickly grasp the context.
3. Central admin decides to either approve/reject immediately OR assign it to a specific Org Admin for evaluation.

**Assignment to Org Admin:**
1. Central admin selects an Org Admin from a dropdown and assigns the idea.
2. The idea status changes to `Assigned to Org Admin`.
3. An email and in-app notification are triggered for the selected Org Admin.
4. The idea moves to the "Assigned to Org Admin" tab for the Central Admin, and appears in the Org Admin's "Assigned to Me" view.

**Approval / Rejection:**
1. Either Central Team or the Assigned Org Admin clicks "Approve" or "Reject".
2. If Rejected, the idea state is closed.
3. If Approved, the backend transitions the idea to `Approved` and automatically creates an associated `Project` record. 
4. The author is notified of the outcome.

**Project lifecycle (steps, status, deadline):**
1. An approved idea becomes a Project, accessible in the "Projects" tab.
2. The project has a status pipeline (Initiated, In Progress, Overdue, Completed).
3. Admins can add "Steps" (tasks) to the project, complete with descriptions and deadlines.
4. An AI can optionally generate a step-by-step implementation plan (Gemini Plan).
5. The project deadline is tracked.

**Chat & @mention flow:**
1. Inside a Project Modal, a "Discussion" tab exists.
2. Users (Author, Admins) can send chat messages.
3. Standard `@` typing opens a dropdown of relevant users. Mentioning a user stores their ID.
4. An in-app notification is triggered specifically targeting the mentioned user.

**Notifications (in-app + email):**
- **In-App:** Uses a Bell icon. Polling/syncing fetches unread notifications. Users can single-tap to mark read, and triple-tap to delete. Database-backed to persist across sessions.
- **Email:** Nodemailer sends robust HTML emails via an SMTP connection (e.g., Outlook) when critical events occur (Idea submitted, Idea assigned, Idea approved/rejected).

## 5. Features Breakdown

- **Template system (including Master Template):** Superadmins can define global custom fields via the Master Template. These fields appear globally on all idea cards and forms. Furthermore, category-specific templates can add modular fields on top of the master structure.
- **Dynamic forms:** Forms render dynamically based on JSON definitions in the database, supporting text, textarea, select, file, and voice types.
- **AI summary + tags:** Upon submission, Gemini asynchronously generates a concise summary and tags, saving reviewers time.
- **AI autofill:** A top-level input allowing users to dump unstructured thoughts that AI parses into structured form fields.
- **File upload + voice note:** Built-in audio recorder via browser MediaRecorder API and standard file pickup. Managed via `api.getFileUrl` to map accurately to server static folders.
- **Card UI system:** High-end, premium UI utilizing TailwindCSS, featuring glassmorphism, subtle hover states, and responsive grids. 
- **Community Hub:** A feed showing all globally Approved Ideas/Projects, fostering transparency and inspiration across the company.
- **Notification system:** Dual-layered—Toast messages for instant frontend feedback, and persistent Bell dropdown for long-term tracking.
- **Project management:** Mini-task tracker tied directly to approved ideas, linking the innovation to real-world execution.

## 6. UI/UX Overview

- **Card-based layout:** Ideas and Projects are primarily displayed in grid masonry or standard grid cards, making scanning dense information easy.
- **Popup system:** Instead of deeply nested pages, the system uses large, responsive Modals (`IdeaDetailModal`, `ProjectModal`) to maintain context (dashboard background remains visible).
- **Mobile responsiveness:** Written tailwind classes ensure sidebars retract, grids stack accurately, and Modals shift to full-screen on mobile devices for ease of tap interaction.
- **AI input bar:** Placed prominently like a search bar, indicating it's the fastest, most modern way to interact with the submission form.
- **Notification UX:** Toast popups slide in natively, while the bell uses badge counters. Triple-tap to delete is a modern, fast micro-interaction specifically included to speed up triage.

## 7. Acceptance Criteria

**Idea Submission:**
- *Expected Behavior:* User fills out required fields and hits submit. System generates idea, calls AI for summary, and shows success toast.
- *Success Condition:* Idea appears in Central Team dashboard. Author sees it in "My Ideas". Email triggered to Central Team.

**AI Autofill:**
- *Expected Behavior:* User pastes text. AI maps to matched form field inputs dynamically.
- *Success Condition:* Form input fields populate accurately without overriding explicitly locked data.

**Idea Assignment:**
- *Expected Behavior:* Central Team assigns an idea to an Org Admin.
- *Success Condition:* Idea status drops from "Pending Review" to "Assigned to Org Admin". Target Admin receives an email and sees it in their assigned view.

**Project Tracking:**
- *Expected Behavior:* Admins approve an idea. 
- *Success Condition:* A Project entity is created in the database. It appears in the "Projects" tab. Users can access the Chat and Steps panels for that project.
