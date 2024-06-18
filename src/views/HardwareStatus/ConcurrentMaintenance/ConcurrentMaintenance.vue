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
            {{ $t('pageConcurrentMaintenance.controlPanel') }}
          </dt>
          <dd>
            <b-form-checkbox
              id="base"
              v-model="readyToRemoveControlPanelState"
              switch
              @change="changeControlPanelState"
            >
              <span v-if="readyToRemoveControlPanelState">
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
            {{ $t('pageConcurrentMaintenance.controlPanelDisp') }}
          </dt>
          <dd>
            <b-form-checkbox
              id="lcd"
              v-model="readyToRemoveControlPanelDispState"
              switch
              @change="changeControlPanelDispState"
            >
              <span v-if="readyToRemoveControlPanelDispState">
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
    readyToRemoveControlPanelState: {
      get() {
        return this.$store.getters['concurrent/readyToRemoveControlPanel'];
      },
      set(newValue) {
        return newValue;
      },
    },
    readyToRemoveControlPanelDispState: {
      get() {
        return this.$store.getters['concurrent/readyToRemoveControlPanelDisp'];
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
      this.$store.dispatch('concurrent/getControlPanel'),
      this.$store.dispatch('concurrent/getControlPanelDisp'),
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
    changeControlPanelState(state) {
      this.$store
        .dispatch('concurrent/saveReadyToRemoveControlPanel', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeControlPanelDispState(state) {
      this.$store
        .dispatch('concurrent/saveReadyToRemoveControlPanelDisp', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
