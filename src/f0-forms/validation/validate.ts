// F0 Forms — Pure validation utilities
// Each validator returns null on success, or an error message string on failure.

export type Validator = (value: string) => string | null;

/** Fails if the value is empty or whitespace-only. */
export function required(value: string): string | null {
  if (value == null) value = '';
  return value.trim().length === 0 ? 'This field is required' : null;
}

/** Returns a validator that fails if value length is below `min`. */
export function minLength(min: number): Validator {
  return (value: string) => {
    if (value == null) value = '';
    return value.length < min ? `Must be at least ${min} characters` : null;
  };
}

/** Returns a validator that fails if value length exceeds `max`. */
export function maxLength(max: number): Validator {
  return (value: string) => {
    if (value == null) value = '';
    return value.length > max ? `Must be at most ${max} characters` : null;
  };
}

/** Returns a validator that fails if value does not match the given regex. */
export function pattern(regex: RegExp, message: string): Validator {
  return (value: string) => {
    if (value == null) value = '';
    return regex.test(value) ? null : message;
  };
}

/** Composes multiple validators, returning the first error encountered or null. */
export function compose(...validators: Validator[]): Validator {
  return (value: string) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error !== null) {
        return error;
      }
    }
    return null;
  };
}
