<template>
  <overview-card
    :title="$t('pageOverview.serverInformation')"
    :to="`/hardware-status/inventory`"
  >
    <b-row class="mt-3">
      <b-col sm="6" lg="6">
        <dl>
          <dt>{{ $t('pageOverview.model') }}</dt>
          <dd>{{ dataFormatter(serverModel) }}</dd>
          <dt>{{ $t('pageOverview.serialNumber') }}</dt>
          <dd>{{ dataFormatter(serverSerialNumber) }}</dd>
          <dt>
            {{ $t('pageOverview.assetTag') }}
            <b-button variant="link" class="p-1" @click="initAssetTagModal()">
              <icon-edit :title="$t('pageOverview.modal.editAssetTag')" />
            </b-button>
          </dt>
          <dd>{{ dataFormatter(assetTag) }}</dd>
        </dl>
      </b-col>
      <b-col sm="6" lg="6">
        <dl>
          <dt>{{ $t('pageOverview.operatingMode') }}</dt>
          <dd v-if="operatingMode === 'Manual'">
            {{ $t('pageOverview.manual') }}
          </dd>
          <dd v-else-if="operatingMode === 'Normal'">
            {{ $t('pageOverview.normal') }}
          </dd>
          <div v-if="!isReadOnlyUser">
            <dt>{{ $t('pageOverview.serviceLogin') }}</dt>
            <dd>
              <status-icon :status="serviceLoginStatusIcon" />
              {{ dataFormatter(serviceLogin) }}
            </dd>
          </div>
        </dl>
      </b-col>
    </b-row>
    <modal-asset-tag :tag="assetTag" @ok="saveAssetTag" />
  </overview-card>
</template>

<script>
import OverviewCard from './OverviewCard';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import { mapState } from 'vuex';
import StatusIcon from '@/components/Global/StatusIcon';
import IconEdit from '@carbon/icons-vue/es/edit/16';
import ModalAssetTag from './ModalAssetTag.vue';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  name: 'Server',
  components: {
    OverviewCard,
    StatusIcon,
    IconEdit,
    ModalAssetTag,
  },
  mixins: [BVToastMixin, DataFormatterMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      serviceLoginStatus: null,
      loading,
    };
  },
  computed: {
    ...mapState({
      server: (state) => state.system.systems[0],
      serviceLoginInfo: (state) => state.global,
      biosAttributes: (state) => state.serverBootSettings.biosAttributes,
      serverModel() {
        return this.server?.model;
      },
      serverSerialNumber() {
        return this.server?.serialNumber;
      },
      serviceLogin() {
        const date = new Date(this.serviceLoginInfo?.bmcTime);
        const expirationDate = new Date(this.serviceLoginInfo?.expirationDate);
        const dateTimeStamp = date.getTime();
        const expirationDateTimeStamp = expirationDate.getTime();

        if (
          this.serviceLoginInfo?.acfInstalled &&
          expirationDateTimeStamp >= dateTimeStamp &&
          this.serviceLoginInfo?.isServiceLoginEnabled
        ) {
          this.serviceLoginStatus = this.$t('global.status.enabled');
        } else {
          this.serviceLoginStatus = this.$t('global.status.disabled');
        }
        return this.serviceLoginStatus;
      },
      operatingMode() {
        return this.biosAttributes?.pvm_system_operating_mode;
      },
      assetTag() {
        return this.$store.getters['global/assetTag'];
      },
      isReadOnlyUser() {
        return this.$store.getters['global/isReadOnlyUser'];
      },
    }),
    serviceLoginStatusIcon() {
      switch (this.serviceLoginStatus) {
        case this.$t('global.status.enabled'):
          return 'success';
        case this.$t('global.status.disabled'):
          return 'danger';
        default:
          return 'secondary';
      }
    },
  },
  created() {
    Promise.all([
      this.$store.dispatch('global/getServiceLogin'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('system/getSystem'),
      this.$store.dispatch('global/getServiceLogin'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('system/getSystem'),
      this.$store.dispatch('global/getServiceLogin'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('system/getSystem'),
      this.$store.dispatch('global/getServiceLogin'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
      this.$store.dispatch('system/getSystem'),
    ]).finally(() => {
      this.$root.$emit('overview-server-complete');
    });
  },
  methods: {
    initAssetTagModal() {
      this.$bvModal.show('modal-asset-tag');
    },
    saveAssetTag(modalFormData) {
      this.startLoader();
      this.$store
        .dispatch('system/saveAssetTag', modalFormData)
        .then(this.$store.dispatch('global/getSystemInfo'))
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
  },
};
</script>
