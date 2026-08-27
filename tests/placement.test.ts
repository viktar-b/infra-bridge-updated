import { describe, expect, it } from 'vitest';
import { tRotate, tTranslate } from 'brepjs-families';
import { foldPose, placement } from '../src/placement.ts';

describe('civil pose folding', () => {
  it('keeps an authored [rotate, translate] origin unrotated', () => {
    const pose = foldPose(placement([-4_795.5, 0, 0], 90));
    expect(pose.origin[0]).toBeCloseTo(-4_795.5, 6);
    expect(pose.origin[1]).toBeCloseTo(0, 6);
    expect(pose.origin[2]).toBeCloseTo(0, 6);
    expect(pose.axisX[0]).toBeCloseTo(0, 6);
    expect(pose.axisX[1]).toBeCloseTo(1, 6);
  });

  it('rotates a trailing yaw through an already translated origin', () => {
    const pose = foldPose([
      tTranslate([-5_000, -2_200, -490]),
      tRotate(-90),
    ]);
    expect(pose.origin[0]).toBeCloseTo(-2_200, 6);
    expect(pose.origin[1]).toBeCloseTo(5_000, 6);
    expect(pose.origin[2]).toBeCloseTo(-490, 6);
    expect(pose.axisX[0]).toBeCloseTo(0, 6);
    expect(pose.axisX[1]).toBeCloseTo(-1, 6);
  });
});
