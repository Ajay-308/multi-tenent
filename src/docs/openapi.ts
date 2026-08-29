export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "TaskFlow API",
    version: "1.0.0",
    description: "Multi-tenant project and task management API.",
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [
    { name: "Authentication" },
    { name: "Organizations" },
    { name: "Projects" },
    { name: "Tasks" },
    { name: "Jobs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error", "code", "details"],
        properties: {
          error: { type: "string" },
          code: { type: "string" },
          details: { type: "object" },
        },
      },
      Tokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          org_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          project_id: { type: "string", format: "uuid" },
          title: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          due_date: { type: "string", format: "date", nullable: true },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UserInput" } } } },
        responses: { "201": { description: "Registered user and tokens" }, "400": { description: "Validation error" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } } },
        responses: { "200": { description: "Authenticated user and tokens" }, "401": { description: "Invalid credentials" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } } } } },
        responses: { "200": { description: "Rotated tokens" }, "401": { description: "Invalid refresh token" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } } } } },
        responses: { "204": { description: "Logged out" } },
      },
    },
    "/organizations/{orgId}/members": {
      parameters: [{ name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Organizations"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Paginated organization members" }, "403": { description: "Forbidden" } },
      },
      post: {
        tags: ["Organizations"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddMemberInput" },
            },
          },
        },
        responses: {
          "201": { description: "Member added" },
          "200": { description: "User was already a member" },
          "403": { description: "Admin required" },
          "404": { description: "User not found" },
        },
      },
    },
    "/organizations/{orgId}/projects": {
      parameters: [{ name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Projects"], security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Paginated projects" }, "403": { description: "Forbidden" } },
      },
      post: {
        tags: ["Projects"], security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectInput" } } } },
        responses: { "201": { description: "Created project" }, "400": { description: "Validation error" } },
      },
    },
    "/organizations/{orgId}/projects/{projectId}": {
      parameters: [
        { name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "projectId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: { tags: ["Projects"], security: [{ bearerAuth: [] }], responses: { "200": { description: "Project" }, "403": { description: "Forbidden" } } },
      patch: { tags: ["Projects"], security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated project" } } },
      delete: { tags: ["Projects"], security: [{ bearerAuth: [] }], responses: { "204": { description: "Deleted project" }, "403": { description: "Admin required" } } },
    },
    "/organizations/{orgId}/projects/{projectId}/tasks": {
      parameters: [
        { name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "projectId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: { tags: ["Tasks"], security: [{ bearerAuth: [] }], responses: { "200": { description: "Paginated tasks" } } },
      post: { tags: ["Tasks"], security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TaskInput" } } } }, responses: { "201": { description: "Created task" } } },
    },
    "/organizations/{orgId}/projects/{projectId}/tasks/{taskId}/assign": {
      post: { tags: ["Tasks"], security: [{ bearerAuth: [] }], parameters: [{ name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } }, { name: "projectId", in: "path", required: true, schema: { type: "string", format: "uuid" } }, { name: "taskId", in: "path", required: true, schema: { type: "string", format: "uuid" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["userId"], properties: { userId: { type: "string", format: "uuid" } } } } } }, responses: { "200": { description: "Assignment and notification status" }, "403": { description: "Forbidden" } } },
    },
    "/jobs/{id}": {
      get: { tags: ["Jobs"], security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }], responses: { "200": { description: "Job status" }, "404": { description: "Job not found" } } },
    },
  },
} as const;

(openapi.components.schemas as Record<string, unknown>).UserInput = {
  type: "object",
  required: ["name", "email", "password"],
  properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 } },
};
(openapi.components.schemas as Record<string, unknown>).LoginInput = {
  type: "object",
  required: ["email", "password"],
  properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
};
(openapi.components.schemas as Record<string, unknown>).ProjectInput = {
  type: "object",
  required: ["name"],
  properties: { name: { type: "string" }, description: { type: "string" } },
};
(openapi.components.schemas as Record<string, unknown>).TaskInput = {
  type: "object",
  required: ["title"],
  properties: { title: { type: "string" }, description: { type: "string" }, status: { type: "string" }, priority: { type: "string" }, due_date: { type: "string", format: "date" } },
};
(openapi.components.schemas as Record<string, unknown>).AddMemberInput = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    role: { type: "string", enum: ["org_admin", "member"], default: "member" },
  },
};
