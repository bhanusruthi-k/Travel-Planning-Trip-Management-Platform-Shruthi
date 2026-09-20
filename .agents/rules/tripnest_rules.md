# TRIPNEST — Project Rules & Architecture Specification

Treat this document as the persistent project specification for the TripNest workspace.
Whenever working on this project, use this context together with the CURRENT source code.
The source code is always the final authority for what is actually implemented.
If this document says a feature should exist but the source code shows otherwise, DO NOT blindly invent or overwrite it. Inspect the source first and verify what currently exists.
NEVER recreate the project from scratch, reset the project, or delete existing work. PRESERVE THE CURRENT TRIPNEST PROJECT.

## Core Rules & Guardrails
1. **Single Common Login Screen**: One common login for Admin and Traveler. Public registration creates only `TRAVELER`.
2. **Admin Account**: `admin@tripnest.com` (`Admin@123`). `bhanusruthi500@gmail.com` must strictly remain `TRAVELER`.
3. **Invitation Workflow**: Send -> Pending -> No Membership. Accept -> Accepted -> Membership + Owner Notification. Reject -> Rejected -> No Membership + Owner Notification.
4. **RBAC**: Only Owner / `GROUP_ADMIN` manage members. Normal members can only view.
5. **Budget**: Backend monetary calculations strictly use `BigDecimal`. Dynamic budget percentages.
6. **UI Theme**: Red / White / Light theme. Auth screens use split layout with rich blue welcome panel on the left.
7. **Destination Seeder Safety**: Idempotent seeding, handle duplicates with care, preserve foreign key references. Do not break `DataInitializer.java`.
8. **Navigation**: Authenticated landing goes to `Dashboard`. Navigation includes `Dashboard`, `My Trips`, `Explore`.
9. **Code Modification Rule**: INSPECT -> UNDERSTAND -> CHANGE MINIMALLY -> BUILD/TEST -> VERIFY.
10. **Git Safety**: Check `git status` and `git branch --show-current`. Never run `git reset --hard`, `git restore .`, or `git clean -fd` unless explicitly commanded.
