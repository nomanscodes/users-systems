const fs = require('fs');
const path = '/home/noman-hossain-x/Desktop/Development/user-system/postman-json/sms-saas-tenants.postman_collection.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const phase04B = {
  "name": "Phase 0.4B — Staff Management",
  "description": "Admin manages designations, invites staff, and assigns teachers.",
  "item": [
    {
      "name": "Designations",
      "item": [
        {
          "name": "Create Designation",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }, { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/designations",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Senior Science Teacher\",\n  \"category\": \"TEACHING\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Get All Designations",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/designations"
          }
        },
        {
          "name": "Update Designation",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }, { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/designations/<UUID>",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Senior Mathematics Teacher\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Delete Designation",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/designations/<UUID>"
          }
        }
      ]
    },
    {
      "name": "Staff Accounts",
      "item": [
        {
          "name": "Invite Staff",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }, { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/invite",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"ahmed@greenvalley.edu\",\n  \"firstName\": \"Ahmed\",\n  \"lastName\": \"Khan\",\n  \"phone\": \"+8801700000002\",\n  \"designationId\": \"<DESIGNATION_UUID>\",\n  \"department\": \"Science\",\n  \"roleIds\": [\"<ROLE_UUID>\"]\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Get All Staff",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff"
          }
        },
        {
          "name": "Get Staff Profile by ID",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>"
          }
        },
        {
          "name": "Update Staff Profile",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Content-Type", "value": "application/json" }, { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"qualification\": \"M.Sc in Physics\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Deactivate Staff",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>"
          }
        }
      ]
    },
    {
      "name": "Teacher Assignments",
      "item": [
        {
          "name": "Assign Teacher to Batch",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }, { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>/assignments",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"batchId\": \"<BATCH_UUID>\",\n  \"subjectId\": \"<SUBJECT_UUID>\"\n}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Get Staff Assignments",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>/assignments"
          }
        },
        {
          "name": "Get Teachers by Batch",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/batches/<BATCH_UUID>/teachers"
          }
        },
        {
          "name": "Remove Teacher Assignment",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }],
            "url": "{{BASE_URL}}/staff/<STAFF_PROFILE_UUID>/assignments/<ASSIGNMENT_UUID>"
          }
        }
      ]
    }
  ]
};

// Update description
data.info.description = data.info.description + "\nPhase 0.4B — Staff Management";

// Check if already added
if (!data.item.find(i => i.name.includes("Phase 0.4B"))) {
  data.item.push(phase04B);
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated Postman collection successfully.');
} else {
  console.log('Phase 0.4B already exists in Postman collection.');
}
