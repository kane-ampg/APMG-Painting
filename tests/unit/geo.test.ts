import { describe, expect, it } from 'vitest';
import { bearingDeg, distanceKm } from '@/lib/geo/haversine';
import { ANCHORS, nearestAnchor } from '@/lib/geo/anchors';

const BAYSWATER_NORTH = { lat: -37.845116, lng: 145.270141 };
const MELBOURNE_CBD = { lat: -37.8136, lng: 144.9631 };
const BRISBANE_CBD = { lat: -27.4698, lng: 153.0251 };

describe('distanceKm', () => {
  it('is zero for a point against itself', () => {
    expect(distanceKm(BAYSWATER_NORTH, BAYSWATER_NORTH)).toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeCloseTo(
      distanceKm(MELBOURNE_CBD, BAYSWATER_NORTH),
      9,
    );
  });

  it('measures Bayswater North to the Melbourne CBD at about 27km', () => {
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeGreaterThan(26);
    expect(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD)).toBeLessThan(29);
  });

  it('measures Melbourne to Brisbane at about 1370km', () => {
    expect(distanceKm(MELBOURNE_CBD, BRISBANE_CBD)).toBeGreaterThan(1300);
    expect(distanceKm(MELBOURNE_CBD, BRISBANE_CBD)).toBeLessThan(1450);
  });
});

describe('bearingDeg', () => {
  it('reports north as 0', () => {
    expect(bearingDeg({ lat: -27, lng: 153 }, { lat: -26, lng: 153 })).toBeCloseTo(0, 3);
  });

  it('reports east as 90', () => {
    expect(bearingDeg({ lat: 0, lng: 153 }, { lat: 0, lng: 154 })).toBeCloseTo(90, 3);
  });

  it('reports south as 180', () => {
    expect(bearingDeg({ lat: -26, lng: 153 }, { lat: -27, lng: 153 })).toBeCloseTo(180, 3);
  });

  it('always returns 0-360, never negative', () => {
    const west = bearingDeg({ lat: 0, lng: 153 }, { lat: 0, lng: 152 });
    expect(west).toBeGreaterThanOrEqual(0);
    expect(west).toBeLessThan(360);
    expect(west).toBeCloseTo(270, 3);
  });
});

describe('ANCHORS', () => {
  it('holds exactly the four the spec names', () => {
    expect(ANCHORS.map((a) => a.key)).toEqual([
      'bayswater-north',
      'brisbane',
      'southport',
      'maroochydore',
    ]);
  });

  it('carries the coordinates unrounded', () => {
    const vic = ANCHORS.find((a) => a.key === 'bayswater-north');
    expect(vic?.coords).toEqual({ lat: -37.845116, lng: 145.270141 });
  });

  it('uses 50km for Victoria and 40km for the three Queensland anchors', () => {
    for (const anchor of ANCHORS) {
      expect(anchor.radiusKm).toBe(anchor.state === 'VIC' ? 50 : 40);
    }
  });
});

describe('nearestAnchor', () => {
  it('assigns a Melbourne suburb to Bayswater North', () => {
    expect(nearestAnchor(MELBOURNE_CBD, 'VIC')?.anchor.key).toBe('bayswater-north');
  });

  it('returns null outside every radius', () => {
    // Bendigo — well inside Victoria, well outside 50km of Bayswater North.
    expect(nearestAnchor({ lat: -36.757, lng: 144.2794 }, 'VIC')).toBeNull();
  });

  it('never assigns across a state line', () => {
    // Brisbane's coordinates, asked for as if Victorian: no VIC anchor covers it.
    expect(nearestAnchor(BRISBANE_CBD, 'VIC')).toBeNull();
  });

  it('picks the nearer of two overlapping radii', () => {
    // Caboolture sits inside both Brisbane's and the Sunshine Coast's 40km.
    const caboolture = { lat: -27.0839, lng: 152.9508 };
    const result = nearestAnchor(caboolture, 'QLD');
    expect(result?.anchor.key).toBe('brisbane');
  });

  it('reports the distance it measured', () => {
    const result = nearestAnchor(MELBOURNE_CBD, 'VIC');
    expect(result?.distanceKm).toBeCloseTo(distanceKm(BAYSWATER_NORTH, MELBOURNE_CBD), 6);
  });
});
