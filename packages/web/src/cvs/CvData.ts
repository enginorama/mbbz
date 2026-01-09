export interface CvData {
  address: number;
  title: string;
  value?: {
    value?: number;
    fetching: boolean;
  };
}
