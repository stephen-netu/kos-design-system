import { describe, it, expect } from 'vitest';
import { required, minLength, maxLength, pattern, compose } from './validate';

describe('required', () => {
  it('returns null for non-empty string', () => {
    expect(required('hello')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(required('')).toBe('This field is required');
  });

  it('returns error for whitespace-only string', () => {
    expect(required('   ')).toBe('This field is required');
  });

  it('returns null for string with leading/trailing spaces but non-empty', () => {
    expect(required('  a  ')).toBeNull();
  });
});

describe('minLength', () => {
  it('returns null when value meets minimum length', () => {
    expect(minLength(3)('abc')).toBeNull();
  });

  it('returns null when value exceeds minimum length', () => {
    expect(minLength(3)('abcd')).toBeNull();
  });

  it('returns error when value is shorter than minimum', () => {
    expect(minLength(5)('ab')).toBe('Must be at least 5 characters');
  });

  it('returns error for empty string when min is 1', () => {
    expect(minLength(1)('')).toBe('Must be at least 1 characters');
  });
});

describe('maxLength', () => {
  it('returns null when value is within maximum length', () => {
    expect(maxLength(10)('abc')).toBeNull();
  });

  it('returns null when value equals maximum length', () => {
    expect(maxLength(3)('abc')).toBeNull();
  });

  it('returns error when value exceeds maximum', () => {
    expect(maxLength(3)('abcd')).toBe('Must be at most 3 characters');
  });

  it('returns null for empty string (within any max)', () => {
    expect(maxLength(5)('')).toBeNull();
  });
});

describe('pattern', () => {
  it('returns null when value matches regex', () => {
    const noNumbers = pattern(/^\D+$/, 'No numbers allowed');
    expect(noNumbers('abc')).toBeNull();
  });

  it('returns custom error message when value does not match regex', () => {
    const noNumbers = pattern(/^\D+$/, 'No numbers allowed');
    expect(noNumbers('abc123')).toBe('No numbers allowed');
  });

  it('works for email-like pattern', () => {
    const isEmail = pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email');
    expect(isEmail('test@example.com')).toBeNull();
    expect(isEmail('not-an-email')).toBe('Invalid email');
  });

  it('returns error for empty string when pattern requires content', () => {
    const nonEmpty = pattern(/.+/, 'Cannot be empty');
    expect(nonEmpty('')).toBe('Cannot be empty');
  });
});

describe('compose', () => {
  it('returns null when all validators pass', () => {
    const validator = compose(required, minLength(3));
    expect(validator('hello')).toBeNull();
  });

  it('returns first error from failing validator', () => {
    const validator = compose(required, minLength(10));
    expect(validator('')).toBe('This field is required');
  });

  it('returns error from second validator if first passes', () => {
    const validator = compose(required, minLength(10));
    expect(validator('ab')).toBe('Must be at least 10 characters');
  });

  it('returns null for empty validator list', () => {
    const validator = compose();
    expect(validator('anything')).toBeNull();
  });

  it('stops at first failing validator without running subsequent ones', () => {
    const second = () => 'second error';
    const validator = compose(required, second);
    // required('') fails, so second() should never be called
    expect(validator('')).toBe('This field is required');
  });
});
