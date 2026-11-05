import { describe, it, expect } from 'vitest';
import { Math3D } from '../../src/core/utils/math3d.js';

describe('Math3D Utility', () => {
  it('snaps numbers and vectors to grid steps', () => {
    expect(Math3D.snap(4.2, 1)).toBe(4);
    expect(Math3D.snap(4.7, 1)).toBe(5);
    expect(Math3D.snap(4.25, 0.5)).toBe(4.5);
    expect(Math3D.snapVector3([1.2, 2.7, 3.4], 1)).toEqual([1, 3, 3]);
    expect(Math3D.snapUV([0.1, 1.9, 8.2, 15.8], 1)).toEqual([0, 2, 8, 16]);
  });

  it('calculates size and volume accurately', () => {
    const from = [0, 0, 0] as const;
    const to = [4, 8, 2] as const;
    expect(Math3D.getSize([...from], [...to])).toEqual([4, 8, 2]);
    expect(Math3D.getVolume([...from], [...to])).toBe(64);
    expect(Math3D.getCenter([...from], [...to])).toEqual([2, 4, 1]);
  });

  it('mirrors a box across the X axis around a pivot', () => {
    // Left arm: from: [4, 12, -2], to: [8, 24, 2]
    // Pivot at origin X=0
    // Mirrored right arm should be: from: [-8, 12, -2], to: [-4, 24, 2]
    const leftArm = { from: [4, 12, -2] as [number, number, number], to: [8, 24, 2] as [number, number, number] };
    const mirrored = Math3D.mirrorBox(leftArm.from, leftArm.to, 'x', [0, 0, 0]);

    expect(mirrored.from).toEqual([-8, 12, -2]);
    expect(mirrored.to).toEqual([-4, 24, 2]);
  });

  it('detects touching coplanar faces between two adjacent cubes', () => {
    // Cube A: [0, 0, 0] to [4, 4, 4]
    // Cube B: touches east face (+X) of Cube A -> [4, 0, 0] to [8, 4, 4]
    const boxA = { from: [0, 0, 0] as [number, number, number], to: [4, 4, 4] as [number, number, number] };
    const boxB = { from: [4, 0, 0] as [number, number, number], to: [8, 4, 4] as [number, number, number] };

    const touchEast = Math3D.checkFaceTouch(boxA, boxB, 'east');
    expect(touchEast.touches).toBe(true);
    expect(touchEast.fullCover).toBe(true);
    expect(touchEast.overlapArea).toBe(16);

    // Cube A west face should NOT touch
    const touchWest = Math3D.checkFaceTouch(boxA, boxB, 'west');
    expect(touchWest.touches).toBe(false);
  });
});
