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
  accessTokenExpiresAt?: string | null;
  user: AuthUser;
  verificationToken?: string;
};

export type RegisterResult = {
  user: AuthUser;
  verificationToken?: string;
};

export type ForgotPasswordResult = {
  message: string;
  passwordResetToken?: string;
};
