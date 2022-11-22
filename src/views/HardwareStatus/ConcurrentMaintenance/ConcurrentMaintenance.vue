<template>
  <b-container fluid="xl">
    <b-row>
      <b-col md="8" xl="8">
        <page-title :title="$t('appPageTitle.concurrentMaintenance')" />
      </b-col>
    </b-row>
    <b-row>
      <b-col md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div class="font-weight-bold">
            {{ $t('pageConcurrentMaintenance.alert.title') }}
          </div>
          <div>
            {{ $t('pageConcurrentMaintenance.alert.message') }}
          </div>
        </alert>
      </b-col>
    </b-row>
    <b-row>
      <b-col md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.tod') }}
          </dt>
          <dd>
            <b-form-checkbox
              id="battery"
              v-model="readyToRemoveState"
              switch
              @change="changeReadyToRemoveState"
            >
              <span v-if="readyToRemoveState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </dd>
        </dl>
      </b-col>
    </b-row>
    <b-row>
      <b-col md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.opPanelBase') }}
          </dt>
          <dd>
            <b-form-checkbox
              id="base"
              v-model="readyToRemoveOpPanelBaseState"
              switch
              @change="changeOpPanelBaseState"
            >
              <span v-if="readyToRemoveOpPanelBaseState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </dd>
        </dl>
      </b-col>
    </b-row>
    <b-row>
      <b-col md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.opPanelLcd') }}
          </dt>
          <dd>
            <b-form-checkbox
              id="lcd"
              v-model="readyToRemoveStateOpPanelLcd"
              switch
              @change="changeOpPanelLcdState"
            >
              <span v-if="readyToRemoveStateOpPanelLcd">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </dd>
        </dl>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import Alert from '@/components/Global/Alert';

export default {
  name: 'ConcurrentMaintenance',
  components: { PageTitle, Alert },
  mixins: [LoadingBarMixin, BVToastMixin],
  computed: {
    readyToRemoveState: {
      get() {
        return this.$store.getters['concurrent/readyToRemove'];
      },
      set(newValue) {
        return newValue;
      },
    },
    readyToRemoveOpPanelBaseState: {
      get() {
        return this.$store.getters['concurrent/readyToRemoveOpPanelBase'];
      },
      set(newValue) {
        return newValue;
      },
    },
    readyToRemoveStateOpPanelLcd: {
      get() {
        return this.$store.getters['concurrent/readyToRemoveOpPanelLcd'];
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('concurrent/getReadyToRemove'),
      this.$store.dispatch('concurrent/getOpPanelBase'),
      this.$store.dispatch('concurrent/getOpPanelLcd'),
    ]).finally(() => {
      this.endLoader();
    });
  },
  methods: {
    changeReadyToRemoveState(state) {
      this.$store
        .dispatch('concurrent/saveReadyToRemoveState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeOpPanelBaseState(state) {
      this.$store
        .dispatch('concurrent/saveReadyToRemoveOpPanelBase', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeOpPanelLcdState(state) {
      this.$store
        .dispatch('concurrent/saveReadyToRemoveOpPanelLcd', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
