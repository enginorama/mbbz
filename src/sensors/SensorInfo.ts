export type SensorInfo = {
  id: number;
  value?: boolean;
  config: {
    vPin?: number;
    pullUp?: boolean;
  };
};
