## Context

The current application relies on a legacy tenant-level RBAC system which cannot accommodate the nuanced needs of a multi-tenant School Management SaaS. We need distinct access tiers for Super Admins (system-wide control and tenant feature gating), School Admins (tenant-level control for employees), Employees (custom roles within tenant), and Students/Parents (predefined tenant-scoped access). The new architecture will centralize permission enforcement across the API and frontend to handle this hierarchy securely and efficiently.

## Goals / Non-Goals

**Goals:**
- Design a scalable, database-driven multi-tiered RBAC system.
- Enable Super Admins to allocate modules to tenants (Schools) and manage predefined student/parent menus.
- Enable School Admins to create custom employee roles restricted to the modules allocated by the Super Admin.
- Ensure API endpoints correctly validate both the user's role and the tenant's allocated features.

**Non-Goals:**
- Completely rewriting business logic within individual modules (only authorization checks will be modified).
- Changing the authentication mechanism (login, token generation).

## Decisions

1. **Role Hierarchy & Categorization**: Implement a `RoleType` enum (e.g., SUPER_ADMIN, SCHOOL_ADMIN, EMPLOYEE, STUDENT, PARENT) to quickly distinguish system-level capabilities.
2. **Module Allocation (Super Admin to Tenant)**: Introduce a `TenantModule` mapping table to track which administrative modules a tenant (School) is permitted to use.
3. **Granular Permissions (School Admin to Employee)**: Introduce `RolePermission` and `MenuPermission` tables. School Admins can only assign permissions to custom roles if the underlying module is present in the `TenantModule` mapping.
4. **Predefined Menus**: Student and Parent menus will be configured by Super Admins and linked directly to the tenant, bypassing the granular employee role engine, to ensure standard experiences across schools.
5. **Middleware Enforcement**: Build unified backend authorization middleware that checks (1) if the tenant has access to the module, and (2) if the user has the required action-level permission.

## Risks / Trade-offs

- **Risk: Migration Complexity**: Transitioning from legacy RBAC to the new schema may leave existing users without access if not mapped correctly.
  - *Mitigation*: Develop a robust, automated database migration script that safely translates existing tenant access into the new `TenantModule` and default `RolePermission` structures. Test heavily on staging.
- **Risk: Performance Overhead**: Evaluating permissions on every API request could introduce latency.
  - *Mitigation*: Cache user permissions and tenant modules in memory (e.g., Redis) or use JWT claims to store permission fingerprints.
