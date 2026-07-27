const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, 'sms-saas-tenants.postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Filter out old role/permission folders
collection.item = collection.item.filter(item => 
  !item.name.includes('Permissions (System)') &&
  !item.name.includes('Roles (CRUD)') &&
  !item.name.includes('Role Permissions')
);

// Helper to create request items
const createRequest = (name, method, urlPath, body = null) => {
  const req = {
    name,
    request: {
      method,
      header: [
        { key: "Authorization", value: "Bearer {{token}}", type: "text" }
      ],
      url: {
        raw: `{{baseUrl}}${urlPath}`,
        host: ["{{baseUrl}}"],
        path: urlPath.split('/').filter(Boolean)
      }
    },
    response: []
  };

  if (body) {
    req.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } }
    };
  }

  return req;
};

// Create Super Admin Folder
const superAdminFolder = {
  name: "Multi-Tenant RBAC - Super Admin",
  item: [
    createRequest("Get Platform Menus", "GET", "/api/v1/super-admin/menus"),
    createRequest("Create Platform Menu", "POST", "/api/v1/super-admin/menus", {
      name: "Dashboard",
      path: "/dashboard",
      icon: "Home",
      sortOrder: 1,
      isActive: true,
      isForSuperAdmin: false,
      allowedActions: ["canView"]
    }),
    
    // Tenant Menus
    createRequest("Get Tenant (Employee) Menus", "GET", "/api/v1/super-admin/tenant-menus/{{tenantId}}"),
    createRequest("Assign Menu to Tenant", "POST", "/api/v1/super-admin/tenant-menus/{{tenantId}}", {
      menuId: "{{menuId}}"
    }),
    createRequest("Remove Menu from Tenant", "DELETE", "/api/v1/super-admin/tenant-menus/{{tenantId}}/{{menuId}}"),
    
    // Student Menus
    createRequest("Get Student Menus", "GET", "/api/v1/super-admin/student-menus/{{tenantId}}"),
    createRequest("Assign Menu to Student", "POST", "/api/v1/super-admin/student-menus/{{tenantId}}", {
      menuId: "{{menuId}}"
    }),
    createRequest("Remove Menu from Student", "DELETE", "/api/v1/super-admin/student-menus/{{tenantId}}/{{menuId}}"),
    
    // Parent Menus
    createRequest("Get Parent Menus", "GET", "/api/v1/super-admin/parent-menus/{{tenantId}}"),
    createRequest("Assign Menu to Parent", "POST", "/api/v1/super-admin/parent-menus/{{tenantId}}", {
      menuId: "{{menuId}}"
    }),
    createRequest("Remove Menu from Parent", "DELETE", "/api/v1/super-admin/parent-menus/{{tenantId}}/{{menuId}}")
  ]
};

// Create Tenant Admin Folder
const tenantAdminFolder = {
  name: "Multi-Tenant RBAC - Tenant Admin",
  item: [
    createRequest("Get My Menus (Auth Me)", "GET", "/api/v1/auth/me/menus"),
    createRequest("Get Tenant Admin Menus", "GET", "/api/v1/tenant-admin/menus"),
    createRequest("Get Roles", "GET", "/api/v1/roles"),
    createRequest("Create Role", "POST", "/api/v1/roles", {
      name: "Teacher",
      description: "Teaching Staff Role"
    }),
    createRequest("Get Role by ID", "GET", "/api/v1/roles/{{roleId}}"),
    createRequest("Update Role", "PATCH", "/api/v1/roles/{{roleId}}", {
      name: "Senior Teacher"
    }),
    createRequest("Delete Role", "DELETE", "/api/v1/roles/{{roleId}}"),
    createRequest("Assign Menu Permission to Role", "POST", "/api/v1/roles/{{roleId}}/permissions", {
      menuId: "{{menuId}}",
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false
    }),
    createRequest("Remove Menu Permission from Role", "DELETE", "/api/v1/roles/{{roleId}}/permissions/{{menuId}}")
  ]
};

collection.item.push(superAdminFolder);
collection.item.push(tenantAdminFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Collection updated successfully.');
