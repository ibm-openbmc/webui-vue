<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.certificates')" />
    <BRow>
      <BCol xl="11">
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
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="11" class="text-right">
        <BButton
          v-b-modal.generate-csr
          data-test-id="certificates-button-generateCsr"
          variant="link"
        >
          <icon-add />
          {{ $t('pageCertificates.generateCsr') }}
        </BButton>
        <BButton
          variant="primary"
          :disabled="certificatesForUpload.length === 0"
          @click="initModalUploadCertificate(null)"
        >
          <icon-add />
          {{ $t('pageCertificates.addNewCertificate') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="11">
        <BTable
          responsive="xl"
          show-empty
          sticky-header="75vh"
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
            {{ value }}
          </template>
          <template #cell(validUntil)="{ value }">
            <status-icon
              v-if="getDaysUntilExpired(value) < 31"
              :status="getIconStatus(value)"
            />
            {{ value }}
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
                <icon-replace
                  v-if="action.value === 'replace'"
                  :title="$t('pageCertificates.replaceCertificate')"
                />
                <icon-trashcan
                  v-if="action.value === 'delete'"
                  :title="$t('pageCertificates.deleteCertificate')"
                />
              </template>
            </table-row-action>
          </template>
        </BTable>
      </BCol>
    </BRow>
    <!-- Modals -->
    <modal-upload-certificate
      :certificate="modalCertificate"
      :user-role-id="userRoleId"
      @ok="onModalOk"
    />

    <BModal
      ref="myModalRef"
      v-model="modal"
      :title="$t('pageCertificates.deleteCertificate')"
      :cancel-title="$t('global.action.cancel')"
      :ok-title="$t('global.action.delete')"
      @cancel="onModalCancel"
      @ok="onModalDelete"
      @hide="onModalHide"
    >
      {{
        $t('pageCertificates.modal.deleteConfirmMessage', {
          certificate: modalContent,
        })
      }}
    </BModal>

    <modal-generate-csr />
  </BContainer>
</template>
<script setup>
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconReplace from '@carbon/icons-vue/es/renew/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import ModalGenerateCsr from './ModalGenerateCsr.vue';
import ModalUploadCertificate from './ModalUploadCertificate.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import Alert from '@/components/Global/Alert.vue';
import { CertificatesStore, UserManagementStore, GlobalStore } from '@/store';
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
// import BVToastMixin from '@/components/Mixins/BVToastMixin';
// import CurrentUserMixin from '@/components/Mixins/CurrentUserMixin';
// import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin'

// export default {
// name: 'Certificates',
// components: {
//   Alert,
//   IconAdd,
//   IconReplace,
//   IconTrashcan,
//   ModalGenerateCsr,
//   ModalUploadCertificate,
//   PageTitle,
//   StatusIcon,
//   TableRowAction,
// },
const certificate = CertificatesStore();
const userManagement = UserManagementStore();
const global = GlobalStore();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const toast = useToastComposable();
const modal = ref(false);
const modalContent = ref('');
// mixins: [BVToastMixin, CurrentUserMixin, LoadingBarMixin],
onBeforeRouteLeave(() => {
  hideLoader();
});
const userRoleId = ref(null);
const isBusy = ref(true);
const modalCertificate = ref(null);
const fields = ref([
  {
    key: 'certificate',
    label: i18n.global.t('pageCertificates.table.certificate'),
  },
  {
    key: 'issuedBy',
    label: i18n.global.t('pageCertificates.table.issuedBy'),
  },
  {
    key: 'issuedTo',
    label: i18n.global.t('pageCertificates.table.issuedTo'),
  },
  {
    key: 'validFrom',
    label: i18n.global.t('pageCertificates.table.validFrom'),
  },
  {
    key: 'validUntil',
    label: i18n.global.t('pageCertificates.table.validUntil'),
  },
  {
    key: 'actions',
    label: '',
    tdClass: 'text-right text-nowrap',
  },
]);
// computed: {
const certificates = computed(() => {
  const acfCertificate = certificate.acfCertificate;
  const certificates = certificate.allCertificates;
  const allCertificates = [...acfCertificate, ...certificates];
  return allCertificates;
});

// certificates() {
//   const acfCertificate =
//     certificate.acfCertificateGetter();
//   const certificates =
//     certificate.allCertificatesGetter()
//   const allCertificates = [...acfCertificate, ...certificates];
//   return allCertificates;
// },
const tableItems = computed(() => {
  return certificates.value.map((certificate) => {
    return {
      ...certificate,
      actions: [
        {
          value: 'replace',
          // title: i18n.global.t('pageCertificates.replaceCertificate'),
        },
        {
          value: 'delete',
          // title: i18n.global.t('pageCertificates.deleteCertificate'),
          enabled:
            certificate.type === 'TrustStore Certificate' ||
            certificate.certificate === 'ServiceLogin Certificate' ||
            certificate.certificate === 'CA Certificate',
        },
      ],
    };
  });
});
const certificatesForUpload = computed(() => {
  return certificate.availableUploadTypes;
});
const bmcTime = computed(() => {
  return global.bmcTime;
});
const expiredCertificateTypes = computed(() => {
  return certificates.value.reduce((acc, val) => {
    const daysUntilExpired = getDaysUntilExpired(val.validUntil);
    if (daysUntilExpired < 1) {
      acc.push(val.certificate);
    }
    return acc;
  }, []);
});
const expiringCertificateTypes = computed(() => {
  return certificates.value.reduce((acc, val) => {
    const daysUntilExpired = getDaysUntilExpired(val.validUntil);
    if (daysUntilExpired < 31 && daysUntilExpired > 0) {
      acc.push(val.certificate);
    }
    return acc;
  }, []);
});
// };
onMounted(() => {
  startLoader();
  Promise.all([
    global.getBmcTime(),
    certificate.getAcfCertificate(),
    certificate.getCertificates(),
    userManagement.getUsers(),
  ]).finally(() => {
    endLoader();
    isBusy.value = false;
    userRoleId.value = ref(global.username);
  });
});
// methods: {
const onTableRowAction = (event, rowItem) => {
  switch (event) {
    case 'replace':
      initModalUploadCertificate(rowItem);
      break;
    case 'delete':
      initModalDeleteCertificate(rowItem);
      break;
    default:
      break;
  }
};
const initModalUploadCertificate = (certificate = null) => {
  modalCertificate.value = certificate;
  // this.$bvModal.show('upload-certificate');
  eventBus.emit('upload-certificate');
};
const initModalDeleteCertificate = (certificate) => {
  modalContent.value = certificate.certificate;
  certificate.actions.forEach((action) => {
    if (action.enabled !== undefined) {
      modal.value = action.enabled;
    }
  });
  // if (modalValue) {
  //   console.log('modalValue', modalValue);
  //   modal.value = modalValue;
  // }
  // console.log('delete icon pressed', certificate);
  // this.$bvModal
  //   .msgBoxConfirm(
  //     i18n.global.t('pageCertificates.modal.deleteConfirmMessage', {
  //       certificate: certificate.certificate,
  //     }),
  //     {
  //       title: i18n.global.t('pageCertificates.deleteCertificate'),
  //       okTitle: i18n.global.t('global.action.delete'),
  //       cancelTitle: i18n.global.t('global.action.cancel'),
  //     },
  //   )
  // .then((deleteConfirmed) => {
  // if (deleteConfirmed)
  //   deleteCertificate({
  //     type: certificate.certificate,
  //     location: certificate.location,
  //   });
  // });
};
const onModalDelete = (deleteConfirmed) => {
  if (deleteConfirmed)
    deleteCertificate({
      type: certificate.certificate,
      location: certificate.location,
    });
  // const stateOk = modal.value;
  // enableUpload(stateOk);
};
const onModalOk = ({ addNew, file, type, location }) => {
  if (addNew) {
    // Upload a new certificate
    addNewCertificate(file, type);
  } else {
    // Replace an existing certificate
    replaceCertificate(file, type, location);
  }
};
const addNewCertificate = (file, type) => {
  startLoader();
  if (type === 'ServiceLogin Certificate') {
    certificate.addNewACFCertificate(),
      { file, type }
        .then((success) => toast.successToast(success))
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
  } else {
    certificate.addNewCertificate(),
      { file, type }
        .then((success) => toast.successToast(success))
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
  }
};
const replaceCertificate = (file, type, location) => {
  startLoader();
  if (type === 'ServiceLogin Certificate') {
    return (
      certificate.replaceACFCertificate(),
      {
        file,
        type,
        location,
      }
        .then((success) => toast.successToast(success))
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader())
    );
  } else {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onloadend = (event) => {
      const certificateString = event.target.result;
      return (
        certificate.replaceCertificate(),
        {
          certificateString,
          type,
          location,
        }
          .then((success) => toast.successToast(success))
          .catch(({ message }) => toast.errorToast(message))
          .finally(() => endLoader())
      );
    };
  }
};
const deleteCertificate = ({ type, location }) => {
  startLoader();
  Promise.all([deleteCertificateChecker(type, location)])
    .then((success) => {
      toast.successToast(success);
      certificate.getAcfCertificate();
      certificate.getCertificates();
    })
    .catch(({ message }) => toast.errorToast(message))
    .finally(() => endLoader());
};
const deleteCertificateChecker = (type, location) => {
  if (type === 'ServiceLogin Certificate') {
    return (
      certificates.value.deleteACFCertificate(),
      {
        type,
        location,
      }
    );
  } else {
    return (
      certificate.deleteCertificate(),
      {
        type,
        location,
      }
    );
  }
};
const getDaysUntilExpired = (date) => {
  if (bmcTime.value) {
    const validUntilMs = date.getTime();
    const currentBmcTimeMs = bmcTime.value.toLocaleDateString();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Math.round((validUntilMs - currentBmcTimeMs.value) / oneDayInMs);
  }
  return new Date();
};
const getIconStatus = (date) => {
  const daysUntilExpired = getDaysUntilExpired(date);
  if (daysUntilExpired < 1) {
    return 'danger';
  } else if (daysUntilExpired < 31) {
    return 'warning';
  }
};
// },
// };
</script>
<style scoped>
.text-right {
  text-align: right !important;
}
.b-table-sticky-header .table.b-table thead tr th {
  vertical-align: middle;
  border-top: 1px solid #d8d8d8;
  border-bottom: 1px solid #d8d8d8;
  color: #161616;
  background: #e6e6e6;
}
</style>
