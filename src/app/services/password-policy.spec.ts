import { evaluatePasswordPolicy, isPasswordPolicySatisfied } from './password-policy';

describe('password policy', () => {
  it('accepts a password that satisfies all current backend rules', () => {
    expect(isPasswordPolicySatisfied('Password1!')).toBeTrue();
  });

  it('reports every current backend rule that is not met', () => {
    const requirements = evaluatePasswordPolicy('password1!');

    expect(requirements.map(rule => rule.satisfied)).toEqual([
      true,
      false,
      true,
      true,
      true,
      true
    ]);
    expect(isPasswordPolicySatisfied('Password 1!')).toBeFalse();
    expect(isPasswordPolicySatisfied('Pass1!')).toBeFalse();
  });
});
