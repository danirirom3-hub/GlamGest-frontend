export const PASSWORD_POLICY_MESSAGE_KEYS = [
  'errors.passwordMin',
  'errors.passwordUpper',
  'errors.passwordLower',
  'errors.passwordNumber',
  'errors.passwordSpecial',
  'errors.passwordSpaces'
] as const;

export type PasswordPolicyMessageKey = typeof PASSWORD_POLICY_MESSAGE_KEYS[number];

export interface PasswordPolicyRequirement {
  key: PasswordPolicyMessageKey;
  satisfied: boolean;
}

export function evaluatePasswordPolicy(password: string): PasswordPolicyRequirement[] {
  return [
    { key: 'errors.passwordMin', satisfied: password.length >= 8 },
    { key: 'errors.passwordUpper', satisfied: /[A-Z]/.test(password) },
    { key: 'errors.passwordLower', satisfied: /[a-z]/.test(password) },
    { key: 'errors.passwordNumber', satisfied: /[0-9]/.test(password) },
    { key: 'errors.passwordSpecial', satisfied: /[^A-Za-z0-9\s]/.test(password) },
    { key: 'errors.passwordSpaces', satisfied: /^\S+$/.test(password) }
  ];
}

export function isPasswordPolicySatisfied(password: string): boolean {
  return evaluatePasswordPolicy(password).every(requirement => requirement.satisfied);
}
