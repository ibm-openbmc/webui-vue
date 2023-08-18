<template>
  <b-row class="section-divider">
    <b-col class="d-flex align-items-center justify-content-between">
      <dl class="mt-3 mr-3 w-75">
        <dt id="aggressive-prefetch-label">
          {{ $t('pageSystemParameters.aggressivePrefetch') }}
          <info-tooltip :title="$t('pageSystemParameters.parametersInfo')" />
        </dt>
        <dd id="aggressive-prefetch-description">
          {{ $t('pageSystemParameters.aggressivePrefetchDescription') }}
        </dd>
      </dl>
      <b-form-checkbox
        id="aggressivePrefetchSwitch"
        v-model="aggressivePrefetchState"
        aria-labelledby="aggressive-prefetch-label"
        aria-describedby="aggressive-prefetch-description"
        switch
        @change="changeAggressivePrefetchState"
      >
        <span v-if="aggressivePrefetchState">
          {{ $t('global.status.enabled') }}
        </span>
        <span v-else>{{ $t('global.status.disabled') }}</span>
      </b-form-checkbox>
    </b-col>
  </b-row>
</template>

<script>
import InfoTooltip from '@/components/Global/InfoTooltip';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';

export default {
  name: 'AggressivePrefetch',
  components: { InfoTooltip },
  mixins: [LoadingBarMixin, BVToastMixin],
  props: {
    safeMode: {
      type: Boolean,
      default: null,
    },
  },
  computed: {
    aggressivePrefetchState: {
      get() {
        return this.$store.getters['systemParameters/aggressivePrefetch'];
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  methods: {
    changeAggressivePrefetchState(state) {
      this.$store
        .dispatch('systemParameters/saveAggressivePrefetch', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
