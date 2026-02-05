/**
 * Utility functions
 */

/**
 * Safely extracts a string value from a potentially nullable Go type.
 * Go's sql.NullString serializes as {String: "value", Valid: true/false}
 * This helper handles both cases: plain strings and Go nullable objects.
 */
export function safeString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && 'String' in value && 'Valid' in value) {
    const nullableValue = value as { String: string; Valid: boolean };
    return nullableValue.Valid ? nullableValue.String : null;
  }
  return String(value);
}

/**
 * Safely extracts a number value from a potentially nullable Go type.
 * Go's sql.NullFloat64/sql.NullInt64 serializes as {Float64/Int64: value, Valid: true/false}
 */
export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object') {
    if ('Float64' in value && 'Valid' in value) {
      const nullableValue = value as { Float64: number; Valid: boolean };
      return nullableValue.Valid ? nullableValue.Float64 : null;
    }
    if ('Int64' in value && 'Valid' in value) {
      const nullableValue = value as { Int64: number; Valid: boolean };
      return nullableValue.Valid ? nullableValue.Int64 : null;
    }
  }
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/**
 * Safely extracts a boolean value from a potentially nullable Go type.
 */
export function safeBool(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object' && 'Bool' in value && 'Valid' in value) {
    const nullableValue = value as { Bool: boolean; Valid: boolean };
    return nullableValue.Valid ? nullableValue.Bool : null;
  }
  return Boolean(value);
}
