import { describe, it, expect } from 'vitest';
import { isMessage } from '../src/shared/messages';

describe('isMessage', () => { it('validates', () => expect(isMessage({ type:'PING' })).toBe(true)); });
