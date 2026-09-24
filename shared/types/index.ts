export type TenantContext = {
  companyId?: string;
  branchId?: string;
  userId?: string;
  roleId?: string;
};

export type ApiResponse<T> = {
  ok: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
  error?: {
    code: string;
    message: string;
    errorId?: string;
  };
};
