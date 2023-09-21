<template>
  <b-form novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="form.attributes && form.attributeValues"
      :key="componentKey"
      :attribute-values="form.attributeValues"
      :disabled="disabled"
      @updated-attributes="updateAttributeKeys"
    />
    <b-button variant="primary" type="submit" class="mb-3">
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
  data() {
    return {
      componentKey: 0,
      form: {
        attributes: this.$store.getters['serverBootSettings/biosAttributes'],
        attributeValues: this.$store.getters[
          'serverBootSettings/attributeValues'
        ],
      },
    };
  },
  computed: {
    ...mapState('serverBootSettings', ['attributeValues', 'biosAttributes']),
    disabled() {
      return this.$store.getters['serverBootSettings/disabled'];
    },
  },
  watch: {
    attributeValues: function (value) {
      this.form.attributeValues = value;
    },
    biosAttributes: function (value) {
      this.form.attributes = value;
    },
  },
  created() {
    Promise.all([
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('serverBootSettings/getAttributeValues'),
    ]).finally(
      this.$root.$emit('server-power-operations-boot-settings-complete')
    );
  },
  methods: {
    updateAttributeKeys(attributeKeys) {
      this.form.attributes = attributeKeys;
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
          this.successToast(message);
        })
        .catch(({ message }) => {
          this.errorToast(message);
        })
        .finally(() => {
          this.endLoader();
        });
    },
  },
};
</script>
