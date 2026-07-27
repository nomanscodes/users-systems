## ADDED Requirements

### Requirement: Super Admin manages modules per tenant
The system SHALL allow Super Admins to allocate or deallocate administrative modules for each tenant (School).

#### Scenario: Allocating a module to a tenant
- **WHEN** a Super Admin enables a specific administrative module for a tenant
- **THEN** the tenant's School Admin and users gain access to that module's functionality, and it appears as an option for role assignment

#### Scenario: Deallocating a module from a tenant
- **WHEN** a Super Admin disables a specific administrative module for a tenant
- **THEN** the tenant immediately loses access to that module, and it is removed from any custom roles within that tenant

### Requirement: Super Admin configures Student and Parent menus
The system SHALL allow Super Admins to define standard menu structures and permissions for Students and Parents on a per-tenant basis.

#### Scenario: Updating the Student menu
- **WHEN** a Super Admin modifies the predefined Student menu for a tenant
- **THEN** all Students within that tenant immediately see the updated menu structure upon their next navigation or reload

### Requirement: School Admin manages employee roles
The system SHALL allow School Admins to create, modify, and delete custom roles for their employees, restricted to the administrative modules enabled for their tenant.

#### Scenario: Creating a custom employee role
- **WHEN** a School Admin creates a new role and assigns menu/action permissions
- **THEN** they can only select from menus and actions that are part of the modules allocated to their tenant by the Super Admin

#### Scenario: Assigning a custom role to an employee
- **WHEN** a School Admin assigns a custom role to an employee
- **THEN** the employee is granted access strictly to the menus and actions defined in that role

### Requirement: Granular API Authorization
The system SHALL enforce granular authorization on all backend endpoints, verifying both the tenant's module allocation and the user's specific role permissions.

#### Scenario: Unauthorized access attempt by an employee
- **WHEN** an employee attempts to access an endpoint for a menu/action they do not have permission for
- **THEN** the system denies access with a 403 Forbidden response

#### Scenario: Accessing a deallocated module
- **WHEN** any user attempts to access an endpoint for a module that has been deallocated from their tenant
- **THEN** the system denies access with a 403 Forbidden response, regardless of their role permissions
