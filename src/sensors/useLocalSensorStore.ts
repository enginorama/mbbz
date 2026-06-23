import { defineStore } from 'pinia';
import { shallowRef } from 'vue';

export type LocalSensorDefinition = {
  id: number;
  vPin?: number;
  pullUp?: boolean;
  description?: string;
};

export const useLocalSensorStore = defineStore(
  'sensors',
  () => {
    const sensors = shallowRef<Array<LocalSensorDefinition>>([]);

    const addSensor = (sensor: LocalSensorDefinition) => {
      const index = sensors.value.findIndex((existingSensor) => existingSensor.id === sensor.id);

      if (index === -1) {
        sensors.value = [...sensors.value, sensor];
        return;
      }

      sensors.value = sensors.value.map((existingSensor) =>
        existingSensor.id === sensor.id ? sensor : existingSensor,
      );
    };

    const removeSensor = (id: number) => {
      sensors.value = sensors.value.filter((sensor) => sensor.id !== id);
    };

    return {
      sensors,
      addSensor,
      removeSensor,
    };
  },
  {
    persist: {
      key: 'sensors',
    },
  },
);
