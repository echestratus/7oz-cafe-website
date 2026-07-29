export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  permissions: string[];
};

export type AuthSession = {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
};
