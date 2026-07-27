## Why

The current legacy RBAC system is limited to tenant-level controls and cannot properly fulfill the complex multi-tenant, multi-role requirements of our School Management SaaS. We need a robust RBAC system that allows Super Admins to control administrative modules and predefined menus per tenant, while empowering School Admins to manage granular role-based menu and action permissions for their employees.

## What Changes

- Implement a multi-tiered RBAC architecture supporting Super Admins, School Admins, Employees, Students, and Parents within a unified application.
- Super Admins will be able to control which administrative modules are available to each School Admin (tenant).
- Super Admins will manage predefined menus for Students and Parents on a per-tenant basis.
- School Admins will gain the ability to manage role-based menu and action permissions for their employees, restricted to the administrative modules enabled by the Super Admin.
- Migrate away from the legacy tenant-level RBAC system.

## Capabilities

### New Capabilities
- `multi-tenant-rbac`: Introduces multi-tiered role-based access control allowing Super Admins to manage tenant modules and predefined menus, and School Admins to manage employee permissions.

### Modified Capabilities

## Impact

- **Database**: Significant updates to permission, role, and menu-mapping tables to support hierarchical and tenant-scoped rules.
- **Backend APIs**: Overhaul of authorization middleware and access checks to enforce multi-tenant and multi-tier access rules.
- **Frontend**: Update UI to dynamically render menus and restrict actions based on the new granular permission system for all user roles.
- **Migration**: Data migration required from the legacy RBAC system to the new architecture.
