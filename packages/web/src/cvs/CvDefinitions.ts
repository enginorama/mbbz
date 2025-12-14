export interface CvInfo {
  address: number;
  title: string;
  value: number | undefined;
}

// https://www.nmra.org/index-nmra-standards-and-recommended-practices
// https://www.nmra.org/sites/default/files/standards/sandrp/DCC/S/appendix_a_s-9_2_2.pdf

export interface CvManifacturerInfo {
  id: number;
  name: string;
  countryCode: string;
}

export const CvTest = {
  1: {
    title: 'Short Address',
    description: 'Sets the short address of the locomotive.',
  },
  8: {
    title: 'Manifacturer ID',
    description: '',
  },
} as const;
