export const NUM_CAB_FUNCTIONS = 29;

export type CabDirection = 'forward' | 'reverse';

export interface CabState {
  dccAddress: number;
  /** Legacy, no longer used */
  slot: number;
  isEmergencyStopped: boolean;
  direction: CabDirection;
  speed: number;
  functionStates: Array<boolean>;
}
