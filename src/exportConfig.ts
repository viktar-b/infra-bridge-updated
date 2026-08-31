import type { ProjectSpec } from 'brepjs-bim';

/** Project identity and CRS shared by IFC export and full-model tests. */
export const PROJECT_SPEC = {
  name: 'infra-bridge',
  projectId: 'infra-bridge',
  crs: {
    name: 'EPSG:32760',
    description: 'EPSG:32760 - WGS 84 / UTM zone 60S',
    geodeticDatum: 'WGS 84',
    eastings: 729_011.226,
    northings: 9_063_960.608,
  },
} satisfies ProjectSpec;

/** Header metadata for `toIfc`. Application name is this repository, not the donor exporter. */
export const IFC_META = {
  applicationName: 'infra-bridge',
  applicationVersion: '0',
  ifcSchema: 'IFC4X3',
  mvdViewDefinition: 'ReferenceView',
} as const;
