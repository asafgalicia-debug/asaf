export type UserDocumentSeed = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
};

const USER_REPOSITORY: UserDocumentSeed[] = [
  {
    id: 'user-admin-demo',
    email: 'admin@erp.local',
    passwordHash: '$2a$10$0h7zvBOWkWJ/erzJnkflgO9O2Nf3Twch5KI1vOczJ5NoMFGja91Na',
    name: 'Administrador demo',
    companyId: 'company-demo-01',
    branchId: 'branch-demo-01',
    roleId: 'role-admin-demo',
    permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'auth.profile'],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export function getUserRepository(): UserDocumentSeed[] {
  return USER_REPOSITORY;
}

export function findUserByEmail(email: string): UserDocumentSeed | undefined {
  return USER_REPOSITORY.find((user) => user.email.toLowerCase() === email.toLowerCase());
}
