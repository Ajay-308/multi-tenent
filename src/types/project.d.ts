declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string };
    org?: { id: string; role: "org_admin" | "member" };
    project?: {
      id: string;
      org_id: string;
      name: string;
      description: string | null;
      created_by: string | null;
      deleted_at: Date | null;
      created_at: Date;
      updated_at: Date;
    };
    task?: {
      id: string;
      project_id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      due_date: string | null;
      created_by: string | null;
      deleted_at: Date | null;
      created_at: Date;
      updated_at: Date;
    };
  }
}

export {};
