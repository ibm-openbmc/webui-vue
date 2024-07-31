import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { createBootstrap } from 'bootstrap-vue-next';
import { GlobalStore } from './store';
import { format } from 'date-fns-tz';
// Add the necessary CSSs
// import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';

import i18n from './i18n';
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.component('IconArrowRight', ArrowRight16);
app.use(createBootstrap({ components: true, directives: true })); // Change this line
app.use(i18n);

const globalStore = GlobalStore();

app.config.globalProperties.$filters = {
  shortTimeZone(value) {
    const longTZ = value
      .toString()
      .match(/\((.*)\)/)
      .pop();
    const regexNotUpper = /[*a-z ]/g;
    return longTZ.replace(regexNotUpper, '');
  },
  formatDate(value) {
    const isUtcDisplay = globalStore.isUtcDisplay;

    if (value instanceof Date) {
      if (isUtcDisplay) {
        return value.toISOString().substring(0, 10);
      }
      const pattern = `yyyy-MM-dd`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return format(value, pattern, { timezone });
    }
  },
  formatTime(value) {
    const isUtcDisplay = globalStore.getIsUtcDisplay;

    if (value instanceof Date) {
      if (isUtcDisplay) {
        let timeOptions = {
          timeZone: 'UTC',
          hourCycle: 'h23',
        };
        return `${value.toLocaleTimeString('default', timeOptions)} UTC`;
      }
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const shortTz = this.shortTimeZone(value);
      const pattern = `HH:mm:ss ('${shortTz}' O)`;
      return format(value, pattern, { timezone }).replace('GMT', 'UTC');
    }
  },
};

app.mount('#app');
