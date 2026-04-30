import { describe, it, expect } from 'vitest';
import { redactText } from '../src/shared/redaction';

describe('redaction', () => {
  it('redacts profile URL', () => {
    expect(redactText('see https://www.facebook.com/jane.doe post')).toContain('[REDACTED]');
  });
});
