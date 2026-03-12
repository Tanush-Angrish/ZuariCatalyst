# BUILD TASK — ZUARI HIVE MVP DEMO

You are a senior full-stack software engineer working inside an autonomous coding environment.

Your goal is to build a **fully functional MVP prototype** of a web application called **Zuari Hive**.

This version is a **demo prototype** designed to demonstrate the product workflow and UI.

Focus on:
- modern UI
- clean UX
- role-based dashboards
- working idea workflow

Avoid unnecessary complexity.

Use **JavaScript only**.  
Do NOT use TypeScript anywhere in this project.

---

# TECH STACK

Frontend
- React
- Vite
- JavaScript
- TailwindCSS
- React Router

Backend
- Node.js
- Express

Database
- SQLite (for simplicity)

State
- React Query or basic React state

---

# DESIGN REQUIREMENTS

The UI must look like **modern SaaS dashboards similar to Linear, Notion, or modern iOS apps**.

Focus on:

- large clean dashboards
- rounded cards
- subtle shadows
- smooth hover effects
- minimal clutter
- strong visual hierarchy
- beautiful typography
- intuitive UX

The website must be **fully responsive**.

Mobile and desktop layouts must work perfectly.

---

# BRAND COLORS

Use these colors for the theme.

Primary Blue
#003580

Accent Red
#DE0F17

Accent Green
#99CC33

Black
#000000

Blue should be the dominant accent across UI elements.

---

# LANDING PAGE

Create a modern landing page explaining the product.

Sections:

Hero Section
Product name: Zuari Hive  
Short tagline explaining innovation platform.

Buttons:
Login
Try Demo

---

Features Section

Display three main features:

Idea Submission  
Review Workflow  
Community Innovation Hub

Use modern feature cards with icons.

---

Workflow Section

Visual explanation of the product flow:

Employee submits idea  
→ Superadmin reviews idea  
→ Assigns to Org Admin  
→ Org Admin approves idea  
→ Approved idea appears in Community Hub

Use clean visual step cards.

---

Call To Action Section

Buttons:

Login as Employee  
Login as Org Admin  
Login as Superadmin

---

Footer

Simple footer with product name.

---

# DEMO LOGIN SYSTEM

Do NOT implement real authentication.

Create **demo login buttons** that simulate login.

Demo accounts:

Superadmin
superadmin@demo.com

Org Admin
orgadmin@demo.com

Employee
employee@demo.com

Clicking login sets the user role in session or local storage.

---

# USER ROLES

Three roles exist:

Employee  
Org Admin  
Superadmin

Each role must have **its own dashboard view**.

---

# EMPLOYEE EXPERIENCE

Employee dashboard contains three sections.

Submit Idea  
My Ideas  
Community Hub

---

## Submit Idea

Create a form with fields:

Idea Title  
Idea Description  
Department  
Expected Impact  
Supporting Link (optional)

When submitted:

Idea status = **Pending Review**

---

## My Ideas

Employees see ideas they submitted.

Each idea card shows:

Title  
Description  
Status badge

Statuses:

Pending Review  
Assigned to Org Admin  
Approved  
Rejected

---

## Community Hub

This shows **approved ideas only**.

Visible to all users.

Display ideas as modern cards.

Each card shows:

Title  
Description  
Author

---

# SUPERADMIN EXPERIENCE

Superadmin dashboard contains:

Idea Review Queue.

List all ideas with status:

Pending Review

Superadmin actions:

Assign to Org Admin

When assigned:

Idea status becomes **Assigned to Org Admin**

---

# ORG ADMIN EXPERIENCE

Org Admin dashboard shows:

Ideas assigned to them.

Actions:

Approve Idea  
Reject Idea

If approved:

Status becomes **Approved**

Idea appears in Community Hub.

If rejected:

Status becomes **Rejected**

---

# COMMUNITY HUB

Accessible to all roles.

Shows only ideas where:

status = Approved

Display them as modern responsive cards.

---

# UI COMPONENTS

Create reusable components:

Buttons  
Cards  
Forms  
Tables  
Modals  
Navbar  
Sidebar

---

# PROJECT STRUCTURE

Create a clean project structure.

frontend/
components/
pages/
layouts/
hooks/
styles/

backend/
routes/
controllers/
models/

---

# USER JOURNEY

The demo flow should be:

1 User opens landing page
2 User clicks demo login
3 Dashboard opens
4 Employee submits idea
5 Superadmin assigns idea
6 Org Admin approves idea
7 Idea appears in Community Hub

---

# IMPORTANT

Prioritize:

1 Beautiful UI
2 Smooth UX
3 Clean workflow

Do not add unnecessary complexity.

This is a **demo prototype for product validation**.

---

# TASKS

1 Build landing page
2 Build demo login system
3 Implement role dashboards
4 Implement idea submission
5 Implement idea review workflow
6 Implement community hub
7 Ensure responsive UI
8 Ensure modern design
9 Start development server