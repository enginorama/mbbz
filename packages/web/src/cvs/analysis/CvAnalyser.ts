import { manifacturerIds } from './manifacturerIds';

export class CvAnalyer {
  getShortAnalysis(address: number, value: number): string | null {
    switch (address) {
      case 8:
        return manifacturerIds.find((m) => m.id === value)?.name ?? null;
    }
    return null;
  }
}

export const cvAnalyer = new CvAnalyer();
