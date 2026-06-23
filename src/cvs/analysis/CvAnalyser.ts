import { manifacturerIds } from './manifacturerIds';

export class CvAnalyser {
  getShortAnalysis(address: number, value: number): string | null {
    switch (address) {
      case 8:
        return manifacturerIds.find((m) => m.id === value)?.name ?? null;
    }
    return null;
  }
}

export const cvAnalyser = new CvAnalyser();
