# OBE 360 - Database Dictionary & System Flow

## System Workflow (Admin Context)
The Admin panel acts as the master orchestrator for Outcome-Based Education (OBE) configurations. Here is the lifecycle flow:

1. **Authentication:** The `users` table handles identity. SuperAdmins manage structural creation.
2. **Structural Foundations:** Admins construct `programs` (e.g., Computer Science).
3. **Outcome Linking:** `plos` (Program Learning Outcomes) are exclusively nested under each Program.
4. **Curriculum Definition:** Admins specify generic global `courses` and store them in the database.
5. **Academic Sessions:** Admins govern the Global Session Configuration from the new Settings module, defining which `semesters` are "active".
6. **Deploying Classes (Assignments):** Using the Assignments panel, Admins map a global `course` to a target `semester` alongside specific `teacher_id` assignments. The database supports multiple instructors for the same course simultaneously.
7. **Granular Outcomes:** Teachers (or Admins mapping on their behalf) derive `course_learning_outcomes` (CLOs) specific to courses and link them definitively to the parent's `plos` using the `clo_plo_mapping` junction table.

---

## Database Table Audit (Active vs Inactive)

### Actively Exploited Tables
- **`users`**: Identity, credentials, and Role-Based Access Control (RBAC). 
- **`programs`**: University academic tracks (e.g., BSCS).
- **`plos`**: Higher-level graduation goals tied dynamically to `programs.id`.
- **`courses`**: Course catalog detailing credit hours and descriptions.
- **`program_courses`**: Associates global courses directly under specific academic tracks.
- **`semesters`**: Temporal governance—stores session identifiers like "Fall 2025" and global boolean `is_active` flags.
- **`semester_assignments`**: Connects `teachers`, `courses`, and `semesters` together allowing course deployment.
- **`course_learning_outcomes`**: Short-scoped (CLO) goals connected intimately to a specific course.
- **`clo_plo_mapping`**: Intersection table physically aligning granular CLOs to broader PLOs.

### Dormant or Unused Tables (Candidates for Pruning/Future Modules)
*Note: Due to our localized access to the SQL schema, some secondary tables generated early during scaffold building might be orphaned. If any user tables holding metadata like "notifications", "activities", "rubrics", or generic logs exist in your Supabase schema and are unused in the active backend code, they can be securely dropped.*
