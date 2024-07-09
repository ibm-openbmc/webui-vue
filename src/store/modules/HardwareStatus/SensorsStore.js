import { defineStore } from 'pinia';
import api from '@/store/api';

export const SensorsStore = defineStore('sensors', {
  state: () => ({
    sensors: [],
  }),
  getters: {
    sensorsGetter: (state) => state.sensors,
  },
  actions: {
    async getChassisCollection() {
      return await api
        .get('/redfish/v1/')
        .then((response) => api.get(response.data.Chassis['@odata.id']))
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id']),
        )
        .catch((error) => console.log(error));
    },
    async getAllSensors() {
      this.sensors = [];
      const collection = await this.getChassisCollection();
      if (!collection) return;
      return await api
        .all(collection.map((chassis) => this.getSensors(chassis)))
        .catch((error) => console.log(error));
    },
    async getSensors(id) {
      await api
        .get(`${id}/Sensors?$expand=.($levels=1)`)
        .then((response) => {
          let sensorData = [];
          response.data.Members.map((sensor) => {
            const oneSensordata = {
              isSelected: false,
              name: sensor.Name,
              status: sensor.Status.Health,
              currentValue: sensor.Reading,
              units: sensor.ReadingUnits,
            };
            sensorData.push(oneSensordata);
            this.sensors = sensorData;
          });
        })
        .then(() => {
          return;
        })
        .catch((error) => console.log(error));
    },
  },
});
