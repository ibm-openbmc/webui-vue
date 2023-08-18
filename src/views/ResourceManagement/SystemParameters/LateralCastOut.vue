<template>
  <div>
    <b-row class="section-divider">
      <b-col class="d-flex align-items-center justify-content-between">
        <dl class="mr-3 w-75">
          <dt id="ateral-cast-out-label">
            {{ $t('pageSystemParameters.lateralCastOut') }}
            <info-tooltip :title="$t('pageSystemParameters.parametersInfo')" />
          </dt>
          <dd id="lateral-cast-out-description">
            {{ $t('pageSystemParameters.lateralCastOutDescription') }}
          </dd>
        </dl>
        <b-form-checkbox
          id="lateral-cast-out-switch"
          v-model="lateralCastOutModeState"
          aria-labelledby="lateral-cast-out-label"
          aria-describedby="lateral-cast-out-description"
          switch
          @change="changeLateralCastOutState"
        >
          <span v-if="lateralCastOutModeState">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </b-form-checkbox>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import InfoTooltip from '@/components/Global/InfoTooltip';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';

export default {
  name: 'LateralCastOut',
  components: { InfoTooltip },
  mixins: [LoadingBarMixin, BVToastMixin],
  props: {
    safeMode: {
      type: Boolean,
      default: null,
    },
  },
  computed: {
    lateralCastOutModeState: {
      get() {
        return this.$store.getters['systemParameters/lateralCastOutMode'];
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  methods: {
    changeLateralCastOutState(state) {
      this.$store
        .dispatch('systemParameters/saveLateralCastOutMode', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
