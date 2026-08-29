import { describe, expect, it } from 'vitest';
import { tRotate, tTranslate } from 'brepjs-families';
import { placement } from '../src/placement.ts';

describe('civil pose authoring', () => {
  it('authors rotate then translate for a plan bearing and origin', () => {
    expect(placement([-4_795.5, 0, 0], 90)).toEqual([
      tRotate(90),
      tTranslate([-4_795.5, 0, 0]),
    ]);
  });

  it('omits a zero bearing and a zero origin', () => {
    expect(placement([0, 0, 0])).toEqual([]);
    expect(placement([100, 0, 0])).toEqual([tTranslate([100, 0, 0])]);
    expect(placement([0, 0, 0], -90)).toEqual([tRotate(-90)]);
  });
});
