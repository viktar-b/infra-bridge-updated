/** Human-authored civil control points and bearings, in millimetres and degrees. */
export const ROAD_SITE_SET_OUT = {
  origin: [17_320.508, 30_000, 0] as const,
  bearingDegrees: 120,
} as const;

export interface EmptyCivilSiteSetOut {
  readonly key: 'road-parking' | 'road';
  readonly name: string;
  readonly origin: readonly [number, number, number];
  readonly bearingDegrees: number;
}

export const EMPTY_CIVIL_SITES = {
  parking: {
    key: 'road-parking',
    name: 'road parking - site',
    origin: [0, 20_000, 0],
    bearingDegrees: 120,
  },
  road: {
    key: 'road',
    name: 'road - site',
    origin: [-17_320.508, 10_000, 0],
    bearingDegrees: 120,
  },
} as const satisfies Record<'parking' | 'road', EmptyCivilSiteSetOut>;

export const ROAD_BRIDGE_SET_OUT = {
  datum: {
    origin: [0, 0, 242.321] as const,
    bearingFromSiteDegrees: -90,
  },
  approaches: {
    occurrences: [
      {
        key: 'approach-01',
        side: 'start',
        origin: [-4_945.5, -1_684, 0] as const,
        bearingDegrees: 90,
      },
      {
        key: 'approach-02',
        side: 'end',
        origin: [4_945.5, -1_684, 0] as const,
        bearingDegrees: 90,
      },
    ],
    slopeDegrees: 5.710593,
    dimensions: { length: 2_435.296, width: 3_600, thickness: 200 },
    slab: { xOffset: -116, runFromDeckEnd: 2_443.111, elevation: -242.321 },
    abutment: { xOffset: -116, runFromDeckEnd: 175, elevation: -756 },
  },
  abutment: {
    length: 3_600,
    section: {
      width: 195,
      toeInset: 20,
      toeHeight: 20,
      bearingSeatHeight: 556.993,
      backHeight: 539.493,
    },
  },
  piers: {
    occurrences: [
      {
        key: 'pier-01',
        origin: [-4_795.5, 0, 0] as const,
        bearingDegrees: 90,
        crossGirderSide: 'negative',
      },
      {
        key: 'pier-02',
        origin: [0, 0, 0] as const,
        bearingDegrees: -90,
        crossGirderSide: 'positive',
      },
      {
        key: 'pier-03',
        origin: [4_845.5, 0, 0] as const,
        bearingDegrees: -90,
        crossGirderSide: 'negative',
      },
    ],
    footing: { length: 5_000, width: 2_100, thickness: 700 },
    stem: { length: 3_600, width: 550, height: 2_286.321, capOffset: 756 },
    crossGirder: {
      length: 4_000,
      width: 300,
      depth: 400,
      setout: 2_000,
      inset: 150,
    },
  },
  mainGirders: {
    dimensions: { length: 9_891, width: 250, depth: 300 },
    occurrences: [
      {
        key: 'main-girder-01',
        origin: [4_945.5, 1_675, -356] as const,
        bearingDegrees: 0,
      },
      {
        key: 'main-girder-02',
        origin: [4_945.5, 0, -356] as const,
        bearingDegrees: 0,
      },
      {
        key: 'main-girder-03',
        origin: [4_945.5, -1_675, -356] as const,
        bearingDegrees: 0,
      },
    ],
  },
  deck: {
    dimensions: { length: 9_909, width: 3_368, slabThickness: 56, setoutInset: 9 },
    railing: {
      railWidth: 96,
      railHeight: 196,
      upperRailBase: 404,
      postPitch: 900,
      postThickness: 96,
      postRunIn: 847.5,
      postRunOut: 114,
      postProfile: {
        toeWidth: 290.055,
        toeBase: -317.801,
        baseWidth: 116,
        base: -336,
        transitionBase: -56,
        shaftWidth: 96,
        top: 620,
        capWidth: 192,
      },
    },
  },
} as const;

export const ROAD_BRIDGE_DATUM = ROAD_BRIDGE_SET_OUT.datum;

export interface RoadDeckSetOutDimensions {
  readonly length: number;
  readonly width: number;
  readonly slabThickness: number;
  readonly setoutInset: number;
}

/** Derive deck and edge-railing control points from the bridge-centre Datum. */
export function roadDeckSetOut({
  length,
  width,
  slabThickness,
  setoutInset,
}: RoadDeckSetOutDimensions) {
  const longitudinalControl = length / 2 - setoutInset;
  const transverseEdge = width / 2;

  return {
    slab: {
      origin: [longitudinalControl, -(transverseEdge - setoutInset), -slabThickness] as const,
      bearingDegrees: 180,
    },
    railingOccurrences: [
      {
        key: 'railing-01',
        origin: [longitudinalControl, transverseEdge, 0] as const,
        bearingDegrees: 0,
        longitudinalSide: 'negative',
      },
      {
        key: 'railing-02',
        origin: [longitudinalControl, -transverseEdge, 0] as const,
        bearingDegrees: 180,
        longitudinalSide: 'positive',
      },
    ],
  } as const;
}

export const RAIL_SITE_OCCURRENCES = [
  {
    occurrenceKey: '01',
    siteName: 'Rail bridge site 01',
    bridgeName: 'Rail bridge',
    origin: [17_320.508, 50_000, 0] as const,
    bearingDegrees: 60,
  },
  {
    occurrenceKey: '02',
    siteName: 'Rail bridge site 02',
    bridgeName: 'Rail bridge',
    origin: [34_641.016, 40_000, 0] as const,
    bearingDegrees: 60,
  },
] as const;

export type RailSiteOccurrenceKey = (typeof RAIL_SITE_OCCURRENCES)[number]['occurrenceKey'];

export function railSiteKey(occurrenceKey: RailSiteOccurrenceKey) {
  return `rail-site-${occurrenceKey}` as const;
}

export function railBridgeKey(occurrenceKey: RailSiteOccurrenceKey) {
  return `rail-bridge-${occurrenceKey}` as const;
}

/** Shared job set-out for both occurrences of the rail-arch Bridge definition. */
export const RAIL_BRIDGE_SET_OUT = {
  componentBearingDegrees: -90,
  superstructure: {
    halfSpan: 5_000,
    halfWidth: 1_750,
    outerRise: 4_084.236,
    innerRun: 4_250,
    innerRise: 3_333.333,
    archBandThickness: 750,
    baseElevation: 3_290.346,
    wallOffset: 2_200,
    wallThickness: 450,
    wallHeight: 4_484.236,
    wallBayCount: 2,
    signElevation: 7_024.582,
    sign: { width: 1_600, height: 400, plateDepth: 30, reliefDepth: 20 },
  },
  piers: {
    occurrences: [
      { key: 'pier-01', origin: [-5_000, -2_200, -490] as const },
      { key: 'pier-02', origin: [5_000, -2_200, -490] as const },
    ],
    stem: { longitudinalWidth: 1_500, transverseLength: 4_400, height: 3_780.346 },
    footing: {
      length: 6_400,
      width: 3_500,
      thickness: 1_000,
      bearingFromStemDegrees: -90,
    },
  },
} as const;

export interface RailArchSuperstructureSetOutDimensions {
  readonly halfSpan: number;
  readonly innerRun: number;
  readonly archBandThickness: number;
  readonly baseElevation: number;
  readonly wallOffset: number;
  readonly signElevation: number;
}

/** Derive repeated rail-arch product Occurrences from the bridge set-out dimensions. */
export function railArchSuperstructureSetOut({
  halfSpan,
  innerRun,
  archBandThickness,
  baseElevation,
  wallOffset,
  signElevation,
}: RailArchSuperstructureSetOutDimensions) {
  return {
    fillOccurrences: [
      { key: 'filler-01', origin: [-halfSpan, 0, baseElevation] as const },
      { key: 'filler-02', origin: [halfSpan, 0, baseElevation] as const },
    ],
    archOccurrences: [
      {
        key: 'arch-segment-01',
        origin: [-halfSpan - archBandThickness, 0, baseElevation] as const,
        bearingDegrees: 180,
      },
      {
        key: 'arch-segment-02',
        origin: [-innerRun, 0, baseElevation] as const,
        bearingDegrees: 0,
      },
      {
        key: 'arch-segment-03',
        origin: [innerRun, 0, baseElevation] as const,
        bearingDegrees: 180,
      },
      {
        key: 'arch-segment-04',
        origin: [halfSpan + archBandThickness, 0, baseElevation] as const,
        bearingDegrees: 0,
      },
    ],
    signOccurrences: [
      {
        key: 'name-sign-01',
        origin: [0, -wallOffset, signElevation] as const,
        bearingDegrees: 0,
      },
      {
        key: 'name-sign-02',
        origin: [0, wallOffset, signElevation] as const,
        bearingDegrees: 180,
      },
    ],
    wallOccurrences: [
      {
        key: 'spandrel-wall-01',
        origin: [-halfSpan * 2, -wallOffset, baseElevation] as const,
        bearingDegrees: 0,
      },
      {
        key: 'spandrel-wall-02',
        origin: [halfSpan * 2, wallOffset, baseElevation] as const,
        bearingDegrees: 180,
      },
    ],
  } as const;
}
