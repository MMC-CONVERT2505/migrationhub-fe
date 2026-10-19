import { describe, expect, it } from 'vitest';
import {
  buildUserUpdate, fieldForServerError, nationalNumber, toFormValues, validateUserEdit, type EditableUser,
} from '../userForm';

const user: EditableUser = {
  firstname: 'Rahul', lastname: 'Gour', email: 'rahul.gour@mmcconvert.com',
  username: 'Rahul.Gour@mmcconvert.com', mobile: '+61412345678', dialCode: '+61',
};

describe('nationalNumber / toFormValues', () => {
  it('strips the dial code', () => {
    expect(nationalNumber('+61412345678', '+61')).toBe('412345678');
    expect(nationalNumber('+61 412 345 678', '+61')).toBe('412345678');
    expect(nationalNumber('412345678', null)).toBe('412345678');
    expect(nationalNumber(null, '+61')).toBe('');
  });
  it('prefills the form from a user', () => {
    expect(toFormValues(user)).toMatchObject({ dialCode: '+61', mobile: '412345678', username: 'Rahul.Gour@mmcconvert.com' });
    expect(toFormValues({ ...user, mobile: null, dialCode: null }).dialCode).toBe('+61');
  });
});

describe('validateUserEdit', () => {
  it('accepts an untouched user — including a bulk-created username that is really an email', () => {
    expect(validateUserEdit(toFormValues(user), user)).toEqual({});
  });
  it('requires 2–50 character names and a valid email', () => {
    const e = validateUserEdit({ ...toFormValues(user), firstname: 'R', lastname: '', email: 'nope' }, user);
    expect(e.firstname).toBeTruthy(); expect(e.lastname).toBeTruthy(); expect(e.email).toBeTruthy();
  });
  it('checks the username only when it was changed', () => {
    expect(validateUserEdit({ ...toFormValues(user), username: 'a b' }, user).username).toBeTruthy();
    expect(validateUserEdit({ ...toFormValues(user), username: 'rahul_g' }, user).username).toBeUndefined();
    expect(validateUserEdit({ ...toFormValues(user), username: '' }, user).username).toMatch(/can’t be cleared/);
  });
  it('checks the mobile digits', () => {
    expect(validateUserEdit({ ...toFormValues(user), mobile: '12' }, user).mobile).toBeTruthy();
    expect(validateUserEdit({ ...toFormValues(user), mobile: '' }, user).mobile).toBeUndefined();
  });
});

describe('buildUserUpdate', () => {
  it('returns null when nothing changed', () => {
    expect(buildUserUpdate(toFormValues(user), user)).toBeNull();
    expect(buildUserUpdate({ ...toFormValues(user), email: '  RAHUL.GOUR@mmcconvert.com ' }, user)).toBeNull();
  });
  it('always sends the three required fields but only the extras that changed', () => {
    const p = buildUserUpdate({ ...toFormValues(user), firstname: 'Rahul K' }, user)!;
    expect(p).toEqual({ firstname: 'Rahul K', lastname: 'Gour', email: 'rahul.gour@mmcconvert.com' });
    expect('username' in p).toBe(false); expect('mobile' in p).toBe(false);
  });
  it('lowercases a changed email and sends a changed username', () => {
    expect(buildUserUpdate({ ...toFormValues(user), email: 'New@X.com', username: 'new_name' }, user))
      .toMatchObject({ email: 'new@x.com', username: 'new_name' });
  });
  it('composes a changed mobile with its dial code, and clears with an empty string', () => {
    expect(buildUserUpdate({ ...toFormValues(user), dialCode: '+44', mobile: '7700 900123' }, user))
      .toMatchObject({ mobile: '+447700900123', dialCode: '+44' });
    const cleared = buildUserUpdate({ ...toFormValues(user), mobile: '' }, user)!;
    expect(cleared.mobile).toBe(''); expect('dialCode' in cleared).toBe(false);
  });
});

describe('fieldForServerError', () => {
  it('maps API messages to fields', () => {
    expect(fieldForServerError('Email already exists')).toBe('email');
    expect(fieldForServerError('Username already exists')).toBe('username');
    expect(fieldForServerError('Mobile already exists')).toBe('mobile');
    expect(fieldForServerError('A dial code is required with a mobile number.')).toBe('mobile');
    expect(fieldForServerError('Something else')).toBeNull();
  });
});
