declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        companyId?: string;
        branchId?: string;
        roleId?: string;
        permissions?: string[];
      };
      tenant?: {
        companyId?: string;
        branchId?: string;
        userId?: string;
      };
    }
  }
}

export {};
