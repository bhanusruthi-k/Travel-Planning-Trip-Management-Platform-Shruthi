# TRIPNEST — Project Context & Working Rules

> **PERMANENT SPECIFICATION FOR THIS WORKSPACE**  
> Treat this document as the persistent project specification for the TripNest workspace.  
> Whenever working on this project, use this context together with the **CURRENT source code**.  
> The source code is always the final authority for what is actually implemented.  
> If this document says a feature should exist but the source code shows otherwise, **DO NOT** blindly invent or overwrite it. Inspect the source first and verify what currently exists.  
> **NEVER** recreate the project from scratch, reset the project, or delete existing work. **PRESERVE THE CURRENT TRIPNEST PROJECT.**

---

## 1. Project Purpose
TripNest is a full-stack Travel Planning & Trip Management Platform developed as an 8-week Springboard internship project.

Core capabilities:
- Discover destinations
- Create and manage trips
- Plan itineraries
- Add activities
- Manage budgets
- Track expenses
- Collaborate with other travelers
- Invite members to trips
- Receive notifications
- Manage profiles
- View analytics/reports
- Receive travel-related updates and reminders

*Note*: This is an internship project intended to be demonstrated to a mentor/interviewer. Stability, correctness, clean implementation, and preserving existing workflows are paramount.

---

## 2. Repository & Structure
- **GitHub Repository**: `https://github.com/springboardmentor903/Travel-Planning-Trip-Management-Platform-Shruthi`
- The project contains both backend and frontend:
  ```
  TripNest/
  ├── src/
  │   └── main/
  │       ├── java/
  │       │   └── com/tripnest/tripnest_backend/
  │       └── resources/
  ├── frontend/
  ├── .mvn/
  ├── mvnw
  ├── mvnw.cmd
  ├── pom.xml
  ├── README.md
  ├── .gitignore
  └── other existing project files
  ```
- **Do NOT delete existing files** simply because they appear unfamiliar.
- Treat `scratch/` as potentially temporary; do NOT delete it unless explicitly requested.

---

## 3. Backend Technology
- **Stack**: Java, Spring Boot 4.1.0, Spring Data JPA, Hibernate, Spring Security, JWT authentication, OAuth2, Maven, PostgreSQL, Bean Validation, REST APIs.
- **Java**: Targets Java 17 (Java 24 runtime environment).
- **Default Port**: 8080 (`http://localhost:8080`).
- **Main Class**: `com.tripnest.tripnest_backend.TripnestBackendApplication`.

---

## 4. Frontend Technology
- **Stack**: React, Vite, JavaScript, HTML, CSS, Tailwind CSS, React Router, Axios, Context API, Chart.js.
- **Dev Server**: `http://localhost:5173`.
- Communicates with Spring Boot backend at `http://localhost:8080`.
- **Do NOT replace React/Vite** with another framework.

---

## 5. Database
- **Engine**: PostgreSQL (`tripnest` database).
- **Development URL**: `jdbc:postgresql://localhost:5432/tripnest`.
- **Default Username**: `postgres`.
- Environment variables supported: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (with fallbacks).
- **Hibernate**: `spring.jpa.hibernate.ddl-auto=update`.
- Do NOT unnecessarily change database configuration.
- *Note*: Source code is in Git, but PostgreSQL database data is local and not automatically stored in Git.

---

## 6. Authentication Requirements
- **Single Common Login Screen**:
  - One common login screen for both Administrators and Travelers.
  - DO NOT create separate public login pages for Admin and Traveler.
- **Post-Authentication Routing**:
  - Traveler → Traveler Dashboard
  - Administrator → Admin Dashboard
- **Registration**:
  - Public registration is ONLY for new Travelers (role: `TRAVELER`).
  - There must NOT be public Administrator registration.
- **Roles**:
  - `TRAVELER`
  - `GROUP_ADMIN`
  - `ADMINISTRATOR`
- **Administrator Account**:
  - Email: `admin@tripnest.com`
  - Password: `Admin@123`
  - Only this account should have `ADMINISTRATOR` privileges unless instructed otherwise.
- **Protected Account**:
  - `bhanusruthi500@gmail.com` must remain a normal `TRAVELER`. Never assign `ADMINISTRATOR` to it.
- **Security & Hygiene**:
  - Do not hardcode administrator credentials in the frontend.
  - Do not expose passwords in the UI.
  - Preserve the existing JWT/security architecture.
  - If incorrect administrator users exist, change their role safely to `TRAVELER` without deleting their data.
  - Administrator seeding must be idempotent. Do not recreate old admin accounts or credentials.

---

## 7. Trip Management
- Features: Create, edit, view, delete/manage trips, trip status, details, members, itinerary, activities, budget, expenses, collaboration.
- Respect access permissions: Trip owner and authorized trip members.
- Preserve existing workflows.

---

## 8. Member and Invitation Workflow
**STRICT REQUIREMENT**:
When an owner/GROUP_ADMIN invites someone by email, the invited person **MUST NOT** immediately become a trip member.

Workflow:
1. **Send Invitation**:
   - Status = `PENDING`.
   - **NO MEMBERSHIP CREATED**.
   - Invited user receives notification.
2. **User Decision**:
   - **ACCEPT**:
     - Verify invitation belongs to logged-in user and status is `PENDING`.
     - Update invitation status to `ACCEPTED`.
     - Create trip membership with default member role.
     - Prevent duplicate membership.
     - Mark invitation notification handled/read.
     - Notify inviter/owner that the user accepted.
   - **REJECT**:
     - Verify invitation belongs to logged-in user and status is `PENDING`.
     - Update invitation status to `REJECTED`.
     - **DO NOT** create membership.
     - Mark notification handled/read.
     - Notify inviter/owner that the user rejected.

Summary:
- `SEND` → `PENDING` → **NO MEMBERSHIP**
- `REJECT` → `REJECTED` → **NO MEMBERSHIP + OWNER NOTIFICATION**
- `ACCEPT` → `ACCEPTED` → **MEMBERSHIP + OWNER NOTIFICATION**

- Duplicate acceptance must never create duplicate memberships.
- Only the invited user can accept/reject their own invitation.
- Reuse the existing invitation/join-request mechanism. Do NOT create a duplicate system.
- Use transactional logic. Existing memberships must NOT be deleted without checking relationships.

---

## 9. Role-Based Member Management (RBAC)
- **Owner & GROUP_ADMIN**:
  - Can invite members
  - Can change member roles
  - Can remove members
- **Normal Members**:
  - Can view member information
  - Cannot manage members, invite users, change roles, or remove other members.
- Preserve existing RBAC.

---

## 10. Destination Discovery
- Curated destination dataset in backend.
- Supports: Listing, search, category filtering, country filtering, destination details, attractions, popular destinations.
- Categories include: City, Beach, Nature, Adventure, Culture, Wildlife, Romantic, Food, Luxury, Mountains, Islands, Heritage, Winter, etc.
- **Card UI Requirements**:
  - Equal sizing
  - Continuous grid (no oversized featured card)
  - Correct image formats and useful images
  - Responsive layout
  - Destination details should support returning to previous page.

---

## 11. Destination Seeder History & Safety
- Previously had `NonUniqueResultException` due to duplicate destination records (`findByNameIgnoreCaseAndCountryIgnoreCase`).
- Fixed and successfully reached: `Destination Seeder finished: 0 new added, 88 updated, total destinations: 95`.
- **DO NOT casually rewrite or break `DataInitializer.java`**.
- If duplicates occur:
  1. Inspect DB first.
  2. Safely resolve duplicates while preserving foreign keys.
  3. Keep seeder idempotent.
  4. Never blindly delete destination records.

---

## 12. Budget and Expenses
- Backend monetary values must use `BigDecimal` (never float/double).
- Features: Trip budget, expense creation, expense categories, expense totals, budget utilization, category spending, analytics.
- Budget percentage must be calculated dynamically from backend expense totals.
- Category allocations should reflect actual spending.
- Remove the "Miscellaneous" expense category if it still exists.
- Pie/chart analytics must show category, amount, percentage, and trip context.

---

## 13. Itinerary and Activities
- Features: Activities, dates, times, activity info, trip itinerary display.
- Centered empty state when itinerary is empty.
- Major Trip Details sections:
  1. Trip Information
  2. Itinerary
  3. Budget
  4. Expenses
  5. Members
- Do NOT add a standalone "Full Dashboard" tab inside Trip Details.
- "Plan Trip" button must remain visible and not depend on hover.
- "New Trip" button should work consistently wherever available.

---

## 14. Notifications
- Includes: Trip invitations, invitation acceptance/rejection, budget alerts, reminders, travel updates, attraction updates.
- Dedicated notification page / bell icon.
- Do not create duplicate notification systems.

---

## 15. Profile
- Dedicated profile page with user information and profile functionality.
- Do not make profile dependent on dropdown-only workflows.
- Logout is accessible from profile workflow.
- No separate standalone "Sign Out" navigation item if design specifies logout inside Profile.

---

## 16. Navigation Requirements
- Authenticated users main navigation: `Dashboard`, `My Trips`, `Explore`.
- Post-login default: Redirect to `Dashboard` (not directly to `My Trips` unless requested).
- Unauthenticated users: `Explore` (publicly accessible), `Sign In`, `Register`.

---

## 17. UI & Design Requirements
- Travel-focused, modern, clean, human-designed (not generic AI SaaS, not magazine/editorial, no excessive whitespace, no oversized typography).
- **Theme**: **RED / WHITE / LIGHT THEME**. Do not globally replace the red TripNest theme.
- **Auth Screens**:
  - Split layout:
    - **Left**: Rich deep blue welcome/branding panel ("Welcome to TripNest", travel message).
    - **Right**: Login / register form.
  - One common Sign In screen.
  - Do not change unrelated pages when modifying auth UI.

---

## 18. Cards and Responsive Design
- Continuous grid, equal card sizes, no giant featured card.
- Breakpoints: ~4 columns on desktop, 2 columns on tablet, 1 column on mobile.

---

## 19. Image Galleries
- Clickable images, next/previous controls, swipe support, keyboard navigation (ESC to close).
- Clear, polished close button.

---

## 20. Toast Notifications
- Global top toasts:
  - Success: Green with tick icon
  - Error: Red with cross icon
- Never use browser `alert()`. Avoid duplicate toasts.

---

## 21. Modals and Scrolling
- Long pages and modals must remain fully scrollable and usable.
- Trip Details and long modals must scroll properly with visible close buttons.

---

## 22. External APIs & Services
- Google Maps, Places, Geocoding, OpenWeather, Google OAuth2, Firebase Cloud Messaging, JavaMailSender, Stripe/Razorpay.
- Do NOT remove integrations just because local credentials are missing. Keep secrets in environment variables/config fallbacks.

---

## 23. Backend Code Safety
1. Inspect existing class and callers.
2. Understand current implementation.
3. Make smallest necessary change.
4. Compile/test (`.\mvnw.cmd clean package -DskipTests`).
5. Verify unrelated features still work.
6. Never perform broad rewrites or delete files to pass compilation.
7. Never use `git reset --hard`, `git restore .`, `git clean -fd` unless explicitly asked.

---

## 24. Frontend Code Safety
1. Inspect existing component.
2. Preserve existing API calls, routes, workflows, and state.
3. Change only what is requested.
4. Do not redesign the entire application for a small request.

---

## 25. Build & Run Commands
- **Backend Build**: `.\mvnw.cmd clean package -DskipTests`
- **Backend Run**: `java -jar ".\target\tripnest-backend-0.0.1-SNAPSHOT.jar"`
- **Backend URL**: `http://localhost:8080`
- **Frontend Dev**:
  ```powershell
  cd frontend
  npm install
  npm run dev
  ```
- **Frontend URL**: `http://localhost:5173`

---

## 26. Git Safety
- Inspect `git status` and `git branch --show-current` before making large changes or pushing.
- Never assume branch. Never push to `main` if a personal branch is requested.
- Commit meaningful progress regularly.

---

## 27. README
- Keep README aligned with the actual project features, tech stack, and setup steps.
- Do not invent nonexistent features.

---

## 28. Historical Context & Restoration
- TripNest is being maintained/restored after data loss on the local laptop.
- GitHub is the source of truth for committed code.
- Backend previously compiled, connected to PostgreSQL, seeded destinations, and ran Tomcat on 8080.
- Frontend previously ran on 5173.
- If a local file appears missing, compare with Git repository before recreating.

---

## 29. Golden Rule: MINIMAL TARGETED CHANGES
When asked to fix one thing: **DO ONLY THAT THING.**
Workflow: **INSPECT → UNDERSTAND → CHANGE MINIMALLY → BUILD/TEST → VERIFY**

Never:
- Rewrite the whole project
- Replace working architecture
- Remove existing functionality
- Change unrelated UI or database structure
- Delete files or reset Git
- Invent new implementations when existing ones can be reused

If a requested change could break an existing workflow, communicate the impact first before proceeding.
