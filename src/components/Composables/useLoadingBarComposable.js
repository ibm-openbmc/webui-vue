import event from '../../eventBus';

export default {
  data() {
    return {
      loading: true,
    };
  },
  methods: {
    startLoader() {
      event.emit('loader-start');
      this.loading = true;
    },
    endLoader() {
      event.emit('loader-end');
      this.loading = false;
    },
    hideLoader() {
      event.emit('loader-hide');
    },
  },
};
