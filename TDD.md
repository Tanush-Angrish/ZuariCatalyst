# Technical Design Document (TDD)
**Project:** Zuari Catalyst (Idea Ticketing System)

## 1. System Architecture
**Frontend Tech Stack:**
- React.js (Vite bundler) for fast, component-based UI rendering.
- Tailwind CSS for responsive, utility-first styling.
- Context API (e.g., AuthContext, NotificationContext) for state management.
- React Router DOM for client-side routing.

**Backend Tech Stack:**
- Node.js runtime executing an Express.js server.
- Express handles RESTful API routes, middleware, and static file serving (`/uploads` and `/dist` in production).

**ORM & Database:**
- Prisma ORM is used for strictly-typed, scalable database schema definitions and querying.
- PostgreSQL database stores persistent relational data.
- Multer is used for disk-based or S3 file buffering/storing.

**Hosting:**
- AWS Lightsail deployment (Node.js environment).
- Backend node process manages both the Express API and static serving of the React built files.

## 2. Architecture Diagram (Textual)
- **Client layer:** React SPA running in the web browser. The user authenticates (JWT stored in `localStorage` or memory).
- **API layer:** Client sends a `fetch` request using a central `api.js` interceptor carrying the Bearer token. Express receives the request.
- **Service layer:** Authentication middleware (`authMiddleware`) decodes the token. The Express router passes handling to specific controllers (e.g., `ideas.js`, `projects.js`). External service integrations (e.g., `geminiService.js`, `emailService.js`) are triggered.
- **Data layer:** Prisma acts as the interface. It translates JS operations into SQL queries sent to PostgreSQL. The resulting data is returned through Express JSON responses back to the React UI.

**Data Flow for Idea Submission:**
1. Frontend forms serialize a JSON object + `FormData` if files/voice recordings are involved.
2. The `api.uploadFile` method pushes the `FormData` to the `/api/upload` endpoint, which returns relative paths.
3. The UI attaches these paths into the main Idea metadata.
4. The `api.submitIdea` method transmits the complete payload to `POST /api/ideas`.
5. The backend Prisma client creates an `Idea` record.
6. The backend asynchronous Gemini module (`geminiService.js`) automatically summarizes the submitted idea and generates tags, updating the record post-creation.
7. An email triggers via Outlook SMTP.

## 3. Database Schema

1. **`users` (User):** Stores `email`, `role`, `name`, `password`, and `organization`. Central identity provider.
2. **`ideas` (Idea):** Core module. Stores `title`, `description`, `department`, `expectedImpact`, `status`, `files`, `aiSummary`, and dynamic `extraFields`. Links via `authorId` to the creator and optionally `assignedToId` to a specific Org Admin.
3. **`idea_templates` (IdeaTemplate):** Defines category-specific structures and `fieldOrder`.
4. **`form_fields` (FormField):** Defines the atomic UI components (e.g., text, select) that make up a template or the master form layout. 
5. **`projects` (Project):** Generated only post-approval of an Idea. Stores `projectId`, `title`, `status`, `deadline`. Links uniquely to an `ideaId`.
6. **`project_steps` (ProjectStep):** Child entries for a specific project containing `description`, `status`, and `deadline`. 
7. **`notifications` (Notification):** Central tracking table storing `userId`, `message`, `type`, `referenceId`, and an `isRead` boolean tracker.

Relationships are robustly tracked using Prisma `@relation` tags to enforce referential integrity and cascading deletes where appropriate.

## 4. API Documentation

**Auth APIs:**
- `POST /api/auth/login` → Expects JSON credentials, returns JWT & user object.
- `POST /api/auth/ms-login` → Extensible SSO endpoint for Microsoft OAuth.

**Idea APIs:**
- `GET /api/ideas` → Fetches all ideas.
- `GET /api/ideas/pending`, `/central/assigned`, `/central/approved` → Role-specific fetching endpoints for Superadmin.
- `POST /api/ideas` → Creates a new Idea.
- `PUT /api/ideas/:id/status` → Approves, Rejects, or queues an Idea.
- `POST /api/ideas/autofill` → Reaches out to Gemini to autofill JSON inputs.

**Template APIs:**
- `GET /api/templates`, `POST /api/templates` → Manages JSON structure representations.
- `GET /api/form-fields/:type` → Gets form field layouts (global/master).

**Project APIs:**
- `GET /api/projects/:id` → Fetches specific active project metrics.
- `POST /api/projects/:id/steps` → Assigns tasks (ProjectSteps).
- `POST /api/projects/:id/messages` → Publishes project chat messages.

**Notification APIs:**
- `GET /api/notifications/:userId` → Fetches paginated unread and read alerts.
- `PUT /api/notifications/:id/read` → Flags the unread tracker.
- `DELETE /api/notifications/:userId` → Clears history.

## 5. AI Integration (Gemini)
Gemini is heavily integrated in three core paths handled via the `@google/generative-ai` SDK (`geminiService.js`):
1. **Autofill System**: React UI traps a monolithic text string and POSTs it to the `/autofill` endpoint alongside the expected JSON form schema. The prompt strictly instructs Gemini to return JSON mapped exactly to those keys.
2. **AI Summary Generation**: Tied directly to final submission. The backend transparently extracts the `description` and runs a summarization task, updating the Idea record with concise bullet points (`aiSummary` column) to save Central Admin time.
3. **Tag Generation**: Part of the same background hook as the summary. Evaluates domain constraints to return JSON stringified arrays of keyword markers.
4. **Gemini Project Plan Generation**: In the Project Details view, an AI context-aware prompt evaluates an Approved Idea's goals and returns `ProjectSteps` representing an initial skeleton project plan.

## 6. File Handling
- Disk-based buffer via `multer`.
- Endpoints: `POST /api/upload/file` and `POST /api/upload/voice`.
- The Express static server points to `path.join(__dirname, 'uploads')`. 
- React constructs `api.getFileUrl(url)` combining the build-time env `VITE_API_URL` (or current origin) + the backend relative path `/uploads/ideas/files/X.png` to map consistently across dynamic AWS environments.

## 7. Notification System
- **Database Notifications (`NotificationContext.jsx`)**: The frontend sets a `setInterval` (15s polling) to query `/api/notifications/user` to refresh the Bell dropdown counter. All user-interactions (e.g. clicking approve on an idea) insert records into the `notifications` table on the backend, targeting the relevant `userId`.
- **Toast Overlays**: A decoupled purely front-end UI array rendered natively above the view layer to give users immediate feedback (`notify()` in Context).
- **Email Triggers**: NodeMailer instances configured with SMTP (`EMAIL_USER`, `EMAIL_PASS`) execute synchronously alongside critical database transitions (like Status updates or Assignments).

## 8. Security
- **Authentication**: JWT driven. Express middleware blocks unauthorized execution on all `/api/*` endpoints except basic Auth or healthchecks.
- **RBAC**: Handled largely in specialized backend endpoints or frontend conditional rendering blocking non-admins from specific routes/buttons.
- **API Validation**: Route handlers parse stringified JSON limits using `express.json({ limit: '10mb' })` to prevent overload vectors. 

## 9. Deployment
**AWS Lightsail Setup:**
- Requires a standard Node.js blueprint runtime.
- Environment variables (`.env`) must contain `PORT=5000`, `DATABASE_URL=postgresql://...`, `NODE_ENV=production`.
- **Database Strategy**: Production schema propagation relies safely on `npx prisma db push`.
- **Hosting Strategy**: A specialized block within `server.js` serves the build output natively:
   ```javascript
   if (process.env.NODE_ENV === 'production') {
      const distPath = path.join(__dirname, '../frontend/dist');
      app.use(express.static(distPath));
   }
   ```
- Front-end is pre-compiled via `npm run build --prefix frontend`.
- PM2 (Process Manager) is recommended on Lightsail to keep `node backend/server.js` running persistently across reboots.

## 10. Non-Functional Requirements
- **Performance**: Polling frequency must be capped properly or converted to WebSockets at hyper-scale. Current 15s interval allows near-realtime UX for standard organizational volumes. Using memoization internally in React context.
- **Scalability**: PostgreSQL handles concurrent schema row locking natively. React artifacts deploy seamlessly over an AWS CDN or directly. 
- **Usability**: Requires sub-3 click processes to action ideas. Unified master template access limits fragmentation and cognitive load on System Administrators.
