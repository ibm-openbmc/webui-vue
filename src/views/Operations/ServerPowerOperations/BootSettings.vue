<template>
  <b-form novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="form.attributes && form.attributeValues"
      :key="componentKey"
      :attribute-values="form.attributeValues"
      :disabled="disabled"
      :is-in-phyp-standby="isInPhypStandby"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
    />
    <b-button
      variant="primary"
      type="submit"
      class="mb-3"
      :disabled="
        !isLinuxKvmValid
          ? form.attributes.pvm_default_os_type === 'Linux KVM'
            ? true
            : false
          : false
      "
    >
      {{ $t('global.action.save') }}
    </b-button>
  </b-form>
</template>
<script>
import { mapState } from 'vuex';
import BiosSettings from './BiosSettings';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
export default {
  name: 'BootSettings',
  components: { BiosSettings },
  mixins: [BVToastMixin, LoadingBarMixin],
  props: {
    isInPhypStandby: {
      type: Boolean,
      default: false,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      componentKey: 0,
      isLinuxKvmValid: true,
      form: {
        attributes: this.$store.getters['serverBootSettings/biosAttributes'],
        attributeValues: this.$store.getters['serverBootSettings/attributeValues'],
      },
    };
  },
  computed: {
    ...mapState('serverBootSettings', ['attributeValues', 'biosAttributes']),
    disabled() {
      return this.$store.getters['serverBootSettings/disabled'];
    },
    isAtleastPhypInStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
  },
  watch: {
    attributeValues: function (value) {
      this.form.attributeValues = value;
    },
    biosAttributes: function (value) {
      this.form.attributes = value;
    },
    isUpdated: function (newValue) {
      if (newValue) {
        this.handleSubmit();
      }
    },
  },
  created() {
    Promise.all([
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('serverBootSettings/getAttributeValues'),
    ]).finally(this.$root.$emit('server-power-operations-boot-settings-complete'));
  },
  methods: {
    updateAttributeKeys(attributeKeys) {
      this.form.attributes = attributeKeys;
    },
    linuxKvmValue(value) {
      this.isLinuxKvmValid = value;
    },
    handleSubmit() {
      this.startLoader();
      let settings;
      let biosSettings = this.form.attributes;
      settings = { biosSettings };
      this.$store
        .dispatch('serverBootSettings/saveSettings', settings)
        .then((message) => {
          this.componentKey += 1;
          if (!this.isUpdated) {
            if (settings.biosSettings.pvm_default_os_type == 'Linux KVM') {
              this.successToast(
                this.$t('pageServerPowerOperations.toast.successSaveLinuxKvmSettings'),
              );
            } else if (
              (settings.biosSettings.pvm_default_os_type == 'IBM I' &&
                this.isAtleastPhypInStandby) ||
              (settings.biosSettings.pvm_default_os_type == 'Default' &&
                this.isAtleastPhypInStandby)
            ) {
              if (this.isInPhypStandby) {
                this.infoToast(this.$t('pageServerPowerOperations.toast.successSaveIBMiStandby')),
                  this.successToast(this.$t('pageServerPowerOperations.toast.successSaveSettings'));
              } else {
                this.infoToast(
                  this.$t('pageServerPowerOperations.toast.successSaveIbmiOsRunningInfo'),
                ),
                  this.successToast(this.$t('pageServerPowerOperations.toast.successSaveSettings'));
              }
            } else {
              this.successToast(message);
            }
          }
          this.$store
            .dispatch('serverBootSettings/getAttributeValues')
            .catch((error) => console.log(error));
        })
        .catch(({ message }) => {
          this.errorToast(message);
        })
        .finally(() => {
          if (this.isUpdated) {
            this.$emit('update-standby', this.isUpdated);
          }
          this.endLoader();
        });
    },
  },
};
</script>
