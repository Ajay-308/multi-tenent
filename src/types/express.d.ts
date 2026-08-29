declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      org?: { id: string; role: "org_admin" | "member" };
    }
  }
}

export {};
