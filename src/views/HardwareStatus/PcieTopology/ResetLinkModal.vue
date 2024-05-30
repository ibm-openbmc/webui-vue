<template>
  <b-modal
    id="modal-reset"
    ref="modal"
    :title="
      $t('pagePcieTopology.modal.resetLinkHeader', {
        id: resetType,
      })
    "
    title-tag="h2"
    @hidden="resetConfirm"
  >
    <p class="mb-2">
      <strong>{{ $t('pagePcieTopology.modal.resetConfirm') }}</strong>
    </p>
    <div>{{ $t('pagePcieTopology.modal.resetLinkDescription') }}</div>

    <template #modal-footer="{ cancel }">
      <b-button variant="secondary" data-test-id="factoryReset-button-cancel" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </b-button>
      <b-button
        type="sumbit"
        variant="danger"
        data-test-id="factoryReset-button-confirm"
        @click="handleConfirm"
      >
        {{
          $t('pagePcieTopology.modal.resetLinkHeader', {
            id: resetType,
          })
        }}
      </b-button>
    </template>
  </b-modal>
</template>
<script>
import VuelidateMixin from '@/components/Mixins/VuelidateMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  mixins: [VuelidateMixin, BVToastMixin],
  props: {
    resetType: {
      type: Number,
      default: null,
    },
    resetUri: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      confirm: false,
    };
  },
  computed: {
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
    isServerOff() {
      return this.serverStatus === 'off' ? true : false;
    },
  },
  validations: {
    confirm: {
      mustBeTrue: function (value) {
        return this.isServerOff || value === true;
      },
    },
  },
  methods: {
    handleConfirm() {
      this.resetLink();
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$nextTick(() => this.$refs.modal.hide());
      this.resetConfirm();
    },
    resetConfirm() {
      this.confirm = false;
      this.$v.$reset();
    },
    resetLink() {
      this.$store
        .dispatch('pcieTopology/resetTheLink', { uri: this.resetUri })
        .then(() => {
          this.successToast(
            this.$t('pagePcieTopology.toast.successReset', {
              id: this.resetType,
            }),
          );
        })
        .catch(() => {
          this.errorToast(
            this.$t('pagePcieTopology.toast.errorReset', {
              id: this.resetType,
            }),
          );
        });
      this.$nextTick(() => this.$refs.modal.hide());
    },
  },
};
</script>
