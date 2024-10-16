export const loading = true;

const LoadingBarMixin = {
  methods: {
    startLoader() {
      this.$root.$emit('loader-start');
      this.loading = true;
    },
    endLoader() {
      this.$root.$emit('loader-end');
      this.$root.$emit('loading-bar-status', true);
      this.loading = false;
    },
    hideLoader() {
      this.$root.$emit('loader-hide');
    },
  },
};

export default LoadingBarMixin;
