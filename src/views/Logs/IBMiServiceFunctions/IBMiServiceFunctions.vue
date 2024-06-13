<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.ibmiServiceFunctions')" />
    <b-row>
      <b-col v-if="isIBMi && !isLoading" md="8">
        <b-row>
          <b-col>
            <alert variant="info" class="mb-4">
              <span>
                {{
                  $t(
                    'pageIbmiServiceFunctions.alert.osRunningIbmiServiceFunctions',
                  )
                }}
              </span>
            </alert>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="activateDST-label">
                {{
                  $t('pageIbmiServiceFunctions.activateDedicatedServiceTool')
                }}
              </dt>
              <dd id="activateDST-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.activateDedicatedServiceToolDesc',
                  )
                }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(21)"
              @click="exceuteFunction(21)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="disableRemoteService-label">
                {{ $t('pageIbmiServiceFunctions.disableRemoteService') }}
              </dt>
              <dd id="disableRemoteService-description">
                {{ $t('pageIbmiServiceFunctions.disableRemoteServiceDesc') }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(65)"
              @click="exceuteFunction(65)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="enableRemoteService-label">
                {{ $t('pageIbmiServiceFunctions.enableRemoteService') }}
              </dt>
              <dd id="enableRemoteService-description">
                {{ $t('pageIbmiServiceFunctions.enableRemoteServiceDesc') }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(66)"
              @click="exceuteFunction(66)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="diskUnitIOP-label">
                {{ $t('pageIbmiServiceFunctions.diskUnitIOP') }}
              </dt>
              <dd id="diskUnitIOP-description">
                {{ $t('pageIbmiServiceFunctions.diskUnitIOPDesc') }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(67)"
              @click="exceuteFunction(67)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="concurrentMaintenancePowerOff-label">
                {{
                  $t('pageIbmiServiceFunctions.concurrentMaintenancePowerOff')
                }}
              </dt>
              <dd id="concurrentMaintenancePowerOff-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.concurrentMaintenancePowerOffDesc',
                  )
                }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(68)"
              @click="exceuteFunction(68)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="concurrentMaintenancePowerOn-label">
                {{
                  $t('pageIbmiServiceFunctions.concurrentMaintenancePowerOn')
                }}
              </dt>
              <dd id="concurrentMaintenancePowerOn-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.concurrentMaintenancePowerOnDesc',
                  )
                }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(69)"
              @click="exceuteFunction(69)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="iopControlStorageDump-label">
                {{ $t('pageIbmiServiceFunctions.iopControlStorageDump') }}
              </dt>
              <dd id="iopControlStorageDump-description">
                {{ $t('pageIbmiServiceFunctions.iopControlStorageDumpDesc') }}
              </dd>
            </dl>
            <b-button
              variant="primary"
              :disabled="isFunctionDisabled(70)"
              @click="exceuteFunction(70)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </b-button>
          </b-col>
        </b-row>
      </b-col>
      <b-col v-else-if="!isLoading">
        <b-row>
          <b-col>
            <alert variant="danger" class="mb-4">
              <span>
                {{ $t('pageIbmiServiceFunctions.alert.notIBMi') }}
              </span>
            </alert>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import Alert from '@/components/Global/Alert';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
export default {
  name: 'IBMiServiceFunctions',
  components: { PageTitle, Alert },
  mixins: [LoadingBarMixin, BVToastMixin],
  data() {
    return {
      isLoading: false,
    };
  },
  computed: {
    isOSRunning() {
      return this.$store.getters['global/isOSRunning'];
    },
    availableFunctions() {
      return this.$store.getters['ibmiServiceFunctions/serviceFunctions'];
    },
    isIBMi() {
      if (
        this.attributeKeys?.pvm_default_os_type === 'Default' ||
        this.attributeKeys?.pvm_default_os_type === 'IBM I'
      ) {
        return true;
      } else {
        return false;
      }
    },
    attributeKeys() {
      return this.$store.getters['serverBootSettings/biosAttributes'];
    },
  },
  created() {
    this.startLoader();
    this.isLoading = true;
    Promise.all([
      this.$store.dispatch('global/getBootProgress'),
      this.$store.dispatch('ibmiServiceFunctions/getAvailableServiceFunctions'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
    ]).finally(() => {
      this.isLoading = false;
      this.endLoader();
    });
  },
  methods: {
    exceuteFunction(value) {
      this.$store
        .dispatch('ibmiServiceFunctions/executeServiceFunction', value)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    isFunctionDisabled(value) {
      if (!this.isOSRunning) {
        return true;
      } else if (this.availableFunctions.includes(value)) {
        return false;
      } else {
        return true;
      }
    },
  },
};
</script>
