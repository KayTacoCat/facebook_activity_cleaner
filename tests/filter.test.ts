import { describe, it, expect } from 'vitest';
import { matchItem } from '../src/shared/filters';

const base = { id:'1', snippet:'Comment about cats', activityType:'comments', actionLabels:['Delete'], fingerprint:'x', matched:false, keep:false, state:'discovered' } as const;

describe('matchItem', () => {
  it('matches include/exclude', () => {
    expect(matchItem(base as any, { includeTypes:['comments'], contains:['cats'], excludes:['dogs'], onlyActionable:true, excludeUnknown:true })).toBe(true);
  });
});
