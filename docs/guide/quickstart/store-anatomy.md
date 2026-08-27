# Store Anatomy

## Store

A "store" is a container that holds the application's state.
[Learn more about Pinia.](https://pinia.vuejs.org/)

```sh
# Store structure
└── store
    ├── api.js                             # axios requests
    ├── index.js                           # import store modules
    ├── plugins
    └── modules
        └── FeatureName                    # feature module
            ├── FeatureStore.js            # feature store
            ├── AdditionalFeatureStore.js  # additional features per store
            ├── AnotherFeatureStore.js     # additional features per store
```

### Modules

The application store is divided into modules to prevent the store from getting
bloated. Each module contains its own state, mutations, actions, and getters.
[Learn more about Pinia modules.](https://pinia.vuejs.org/core-concepts/)

#### Module Anatomy

- **State:** You cannot directly mutate the store's state.
  [Learn more about state.](https://pinia.vuejs.org/core-concepts/state.html)
- **Getters:** Getters are used to compute derived state based on store state.
  [Learn more about getters.](https://pinia.vuejs.org/core-concepts/getters.html)
- **Actions:** Asynchronous logic should be encapsulated in, and can be composed
  with actions.
  [Learn more about actions.](https://pinia.vuejs.org/core-concepts/actions.html)

Import new store modules in `src/store/index.js`.

```js
// `src/store/index.js`

import FeatureNameStore from "./modules/FeatureNameStore";

export {
  FeatureNameStore, // store names can be renamed for brevity
};
```

## Complete store

A store module will look like this.

```js
import api from "@/store/api";
import i18n from "@/i18n";
import { defineStore } from "pinia";

export const FeatureNameStore = defineStore("featureName", {
  // getters, actions, and mutations will be namespaced
  // based on the path the module is registered at
  state: () => ({
    exampleValue: "Off",
  }),
  getters: {
    // namespace -> getters['featureNameStore/getExampleValue']
    getExampleValue: (state) => state.exampleValue,
  },
  actions: {
    // namespace -> dispatch('featureNameStore/getExampleValue')
    async getExampleValue({ commit }) {
      return await api
        .get("/redfish/v1/../..")
        .then((response) => {
          this.exampleValue = response.data.Value;
        })
        .catch((error) => console.log(error));
    },
    // namespace -> ('featureNameStore/saveExampleValue', payload)
    async saveExampleValue({ commit }, payload) {
      return await api
        .patch("/redfish/v1/../..", { Value: payload })
        .then(() => {
          this.exampleValue = payload;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});

export default FeatureNameStore;
```
