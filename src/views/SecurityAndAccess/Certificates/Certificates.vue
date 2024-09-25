<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.certificates')" />
    <b-row>
      <b-col xl="11">
        <!-- Expired certificates banner -->
        <alert :show="expiredCertificateTypes.length > 0" variant="danger">
          <template v-if="expiredCertificateTypes.length > 1">
            {{ $t('pageCertificates.alert.certificatesExpiredMessage') }}
          </template>
          <template v-else>
            {{
              $t('pageCertificates.alert.certificateExpiredMessage', {
                certificate: expiredCertificateTypes[0],
              })
            }}
          </template>
        </alert>
        <!-- Expiring certificates banner -->
        <alert :show="expiringCertificateTypes.length > 0" variant="warning">
          <template v-if="expiringCertificateTypes.length > 1">
            {{ $t('pageCertificates.alert.certificatesExpiringMessage') }}
          </template>
          <template v-else>
            {{
              $t('pageCertificates.alert.certificateExpiringMessage', {
                certificate: expiringCertificateTypes[0],
              })
            }}
          </template>
        </alert>
      </b-col>
    </b-row>
    <b-row>
      <b-col xl="11" class="text-right">
        <b-button
          v-b-modal.generate-csr
          data-test-id="certificates-button-generateCsr"
          variant="link"
        >
          <icon-add />
          {{ $t('pageCertificates.generateCsr') }}
        </b-button>
        <b-button
          variant="primary"
          :disabled="certificatesForUpload.length === 0"
          @click="initModalUploadCertificate(null)"
        >
          <icon-add />
          {{ $t('pageCertificates.addNewCertificate') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col xl="11">
        <b-table
          responsive="xl"
          show-empty
          hover
          :busy="isBusy"
          :fields="fields"
          :items="tableItems"
          :empty-text="$t('global.table.emptyMessage')"
        >
          <!-- Certificate -->
          <template #cell(certificate)="row">
            {{
              row.item.certificate === 'ServiceLogin Certificate'
                ? $t('pageCertificates.serviceLoginCertificate')
                : row.item.certificate
            }}
          </template>
          <template #cell(validFrom)="{ value }">
            {{ value | formatDate }}
          </template>
          <template #cell(validUntil)="{ value }">
            <status-icon
              v-if="getDaysUntilExpired(value) < 31"
              :status="getIconStatus(value)"
            />
            {{ value | formatDate }}
          </template>
          <template #cell(actions)="{ value, item }">
            <table-row-action
              v-for="(action, index) in value"
              :key="index"
              :value="action.value"
              :title="action.title"
              :enabled="action.enabled"
              @click-table-action="onTableRowAction($event, item)"
            >
              <template #icon>
                <icon-replace v-if="action.value === 'replace'" />
                <icon-trashcan v-if="action.value === 'delete'" />
              </template>
            </table-row-action>
          </template>
        </b-table>
      </b-col>
    </b-row>
    <!-- Modals -->
    <modal-upload-certificate
      :certificate="modalCertificate"
      :user-role-id="userRoleId"
      @ok="onModalOk"
    />
    <modal-generate-csr />
  </b-container>
</template>
<script>
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconReplace from '@carbon/icons-vue/es/renew/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import ModalGenerateCsr from './ModalGenerateCsr';
import ModalUploadCertificate from './ModalUploadCertificate';
import PageTitle from '@/components/Global/PageTitle';
import TableRowAction from '@/components/Global/TableRowAction';
import StatusIcon from '@/components/Global/StatusIcon';
import Alert from '@/components/Global/Alert';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import CurrentUserMixin from '@/components/Mixins/CurrentUserMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
export default {
  name: 'Certificates',
  components: {
    Alert,
    IconAdd,
    IconReplace,
    IconTrashcan,
    ModalGenerateCsr,
    ModalUploadCertificate,
    PageTitle,
    StatusIcon,
    TableRowAction,
  },
  mixins: [BVToastMixin, CurrentUserMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      userRoleId: null,
      isBusy: true,
      modalCertificate: null,
      fields: [
        {
          key: 'certificate',
          label: this.$t('pageCertificates.table.certificate'),
        },
        {
          key: 'issuedBy',
          label: this.$t('pageCertificates.table.issuedBy'),
        },
        {
          key: 'issuedTo',
          label: this.$t('pageCertificates.table.issuedTo'),
        },
        {
          key: 'validFrom',
          label: this.$t('pageCertificates.table.validFrom'),
        },
        {
          key: 'validUntil',
          label: this.$t('pageCertificates.table.validUntil'),
        },
        {
          key: 'actions',
          label: '',
          tdClass: 'text-right text-nowrap',
        },
      ],
    };
  },
  computed: {
    certificates() {
      const acfCertificate = this.$store.getters['certificates/acfCertificate'];
      const certificates = this.$store.getters['certificates/allCertificates'];
      const allCertificates = [...acfCertificate, ...certificates];
      return allCertificates;
    },
    tableItems() {
      return this.certificates.map((certificate) => {
        return {
          ...certificate,
          actions: [
            {
              value: 'replace',
              title: this.$t('pageCertificates.replaceCertificate'),
            },
            {
              value: 'delete',
              title: this.$t('pageCertificates.deleteCertificate'),
              enabled:
                certificate.type === 'TrustStore Certificate' ||
                certificate.certificate === 'ServiceLogin Certificate' ||
                certificate.certificate === 'CA Certificate',
            },
          ],
        };
      });
    },
    certificatesForUpload() {
      return this.$store.getters['certificates/availableUploadTypes'];
    },
    bmcTime() {
      return this.$store.getters['global/bmcTime'];
    },
    expiredCertificateTypes() {
      return this.certificates.reduce((acc, val) => {
        const daysUntilExpired = this.getDaysUntilExpired(val.validUntil);
        if (daysUntilExpired < 0) {
          acc.push(val.certificate);
        }
        return acc;
      }, []);
    },
    expiringCertificateTypes() {
      return this.certificates.reduce((acc, val) => {
        const daysUntilExpired = this.getDaysUntilExpired(val.validUntil);
        if (daysUntilExpired < 31 && daysUntilExpired >= 0) {
          acc.push(val.certificate);
        }
        return acc;
      }, []);
    },
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('global/getBmcTime'),
      this.$store.dispatch('certificates/getAcfCertificate'),
      this.$store.dispatch('certificates/getCertificates'),
      this.$store.dispatch('userManagement/getUsers'),
    ]).finally(() => {
      this.endLoader();
      this.isBusy = false;
      this.userRoleId = this.currentUser.RoleId;
    });
  },
  methods: {
    onTableRowAction(event, rowItem) {
      switch (event) {
        case 'replace':
          this.initModalUploadCertificate(rowItem);
          break;
        case 'delete':
          this.initModalDeleteCertificate(rowItem);
          break;
        default:
          break;
      }
    },
    initModalUploadCertificate(certificate = null) {
      this.modalCertificate = certificate;
      this.$bvModal.show('upload-certificate');
    },
    initModalDeleteCertificate(certificate) {
      this.$bvModal
        .msgBoxConfirm(
          this.$t('pageCertificates.modal.deleteConfirmMessage', {
            certificate: certificate.certificate,
          }),
          {
            title: this.$t('pageCertificates.deleteCertificate'),
            okTitle: this.$t('global.action.delete'),
            cancelTitle: this.$t('global.action.cancel'),
          }
        )
        .then((deleteConfirmed) => {
          if (deleteConfirmed)
            this.deleteCertificate({
              type: certificate.certificate,
              location: certificate.location,
            });
        });
    },
    onModalOk({ addNew, file, type, location }) {
      if (addNew) {
        // Upload a new certificate
        this.addNewCertificate(file, type);
      } else {
        // Replace an existing certificate
        this.replaceCertificate(file, type, location);
      }
    },
    addNewCertificate(file, type) {
      this.startLoader();
      if (type === 'ServiceLogin Certificate') {
        this.$store
          .dispatch('certificates/addNewACFCertificate', { file, type })
          .then((success) => this.successToast(success))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      } else {
        this.$store
          .dispatch('certificates/addNewCertificate', { file, type })
          .then((success) => this.successToast(success))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      }
    },
    replaceCertificate(file, type, location) {
      this.startLoader();
      if (type === 'ServiceLogin Certificate') {
        return this.$store
          .dispatch('certificates/replaceACFCertificate', {
            file,
            type,
            location,
          })
          .then((success) => this.successToast(success))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      } else {
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = (event) => {
          const certificateString = event.target.result;
          return this.$store
            .dispatch('certificates/replaceCertificate', {
              certificateString,
              type,
              location,
            })
            .then((success) => this.successToast(success))
            .catch(({ message }) => this.errorToast(message))
            .finally(() => this.endLoader());
        };
      }
    },
    deleteCertificate({ type, location }) {
      this.startLoader();
      Promise.all([this.deleteCertificateChecker(type, location)])
        .then((success) => {
          this.successToast(success);
          this.$store.dispatch('certificates/getAcfCertificate');
          this.$store.dispatch('certificates/getCertificates');
        })
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
    deleteCertificateChecker(type, location) {
      if (type === 'ServiceLogin Certificate') {
        return this.$store.dispatch('certificates/deleteACFCertificate', {
          type,
          location,
        });
      } else {
        return this.$store.dispatch('certificates/deleteCertificate', {
          type,
          location,
        });
      }
    },
    getDaysUntilExpired(date) {
      if (this.bmcTime) {
        const validUntilMs = date.getTime();
        const currentBmcTimeMs = this.bmcTime.getTime();
        const oneDayInMs = 24 * 60 * 60 * 1000;
        return Math.round((validUntilMs - currentBmcTimeMs) / oneDayInMs);
      }
      return new Date();
    },
    getIconStatus(date) {
      const daysUntilExpired = this.getDaysUntilExpired(date);
      if (daysUntilExpired < 0) {
        return 'danger';
      } else if (daysUntilExpired < 31) {
        return 'warning';
      }
    },
  },
};
</script>
