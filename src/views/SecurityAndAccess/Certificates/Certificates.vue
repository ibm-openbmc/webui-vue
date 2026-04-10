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
          :fields="fields"
          :items="tableItems"
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
            {{ $filters.formatDate(value) }}
          </template>
          <template #cell(validUntil)="{ value }">
            <status-icon
              v-if="getDaysUntilExpired(value) < 31"
              :status="getIconStatus(value)"
            />
            {{ $filters.formatDate(value) }}
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
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else>
              {{ $t('global.table.emptyMessage') }}
            </span>
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

<script setup lang="ts">
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconReplace from '@carbon/icons-vue/es/renew/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import ModalGenerateCsr from './ModalGenerateCsr.vue';
import ModalUploadCertificate from './ModalUploadCertificate.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { ref, onMounted, computed, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import { useCertificates } from '@/api/composables/useCertificates';
import type { Certificate } from '@/api/composables/useCertificates';

const { hideLoader, startLoader, endLoader } = useLoadingBar();
const toast = useToastComposable();

const userManagement = stores.UserManagementStore();
const global = stores.GlobalStore();

// Use the new VueQuery composable
const {
  certificates: certificatesData,
  availableUploadTypes,
  isFetching,
  addNewACFCertificate: addNewACFCertificateAction,
  addNewCertificate: addNewCertificateAction,
  replaceACFCertificate: replaceACFCertificateAction,
  replaceCertificate: replaceCertificateAction,
  deleteACFCertificate: deleteACFCertificateAction,
  deleteCertificate: deleteCertificateAction,
  refetchAcf,
  refetchCertificates,
} = useCertificates();

const modal = ref(false);
const modalContent = ref('');
const userRoleId = ref<string | null>(null);
const isBusy = ref(true);
const modalCertificate = ref<Certificate | null>(null);
const fields = ref([
  {
    key: 'certificate',
    label: i18n.global.t('pageCertificates.table.certificate'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'issuedBy',
    label: i18n.global.t('pageCertificates.table.issuedBy'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'issuedTo',
    label: i18n.global.t('pageCertificates.table.issuedTo'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'validFrom',
    label: i18n.global.t('pageCertificates.table.validFrom'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'validUntil',
    label: i18n.global.t('pageCertificates.table.validUntil'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    label: '',
    tdClass: 'text-right text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

// Manage loading bar for query fetching state
watch(
  isFetching,
  (fetching) => {
    if (fetching) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

onBeforeRouteLeave(() => {
  hideLoader();
});

onMounted(() => {
  startLoader();
  Promise.all([
    global.getBmcTime(),
    refetchAcf(),
    refetchCertificates(),
    userManagement.getUsers(),
  ]).finally(() => {
    endLoader();
    isBusy.value = false;
    userRoleId.value = global.currentUser?.RoleId;
  });
});

const certificates = computed(() => certificatesData.value);

const tableItems = computed(() => {
  return certificates.value.map((cert) => {
    return {
      ...cert,
      actions: [
        {
          value: 'replace',
        },
        {
          value: 'delete',
          enabled:
            cert.type === 'TrustStore Certificate' ||
            cert.certificate === 'ServiceLogin Certificate' ||
            cert.certificate === 'CA Certificate',
        },
      ],
    };
  });
});

const certificatesForUpload = computed(() => availableUploadTypes.value);
const bmcTime = computed(() => {
  return global.bmcTime;
});
const expiredCertificateTypes = computed(() => {
  return certificates.value.reduce((acc: string[], val) => {
    const daysUntilExpired = getDaysUntilExpired(val.validUntil);
    if (daysUntilExpired < 0) {
      acc.push(val.certificate);
    }
    return acc;
  }, [] as string[]);
});

const expiringCertificateTypes = computed(() => {
  return certificates.value.reduce((acc: string[], val) => {
    const daysUntilExpired = getDaysUntilExpired(val.validUntil);
    if (daysUntilExpired < 31 && daysUntilExpired >= 0) {
      acc.push(val.certificate);
    }
    return acc;
  }, [] as string[]);
});

const onTableRowAction = (event: string, rowItem: any) => {
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

const initModalUploadCertificate = (cert: Certificate | null = null) => {
  modalCertificate.value = cert;
  eventBus.emit('upload-certificate');
};

const initModalDeleteCertificate = (cert: any) => {
  modalContent.value = cert.certificate;
  modalCertificate.value = cert;
  cert.actions.forEach((action: any) => {
    if (action.enabled !== undefined) {
      modal.value = action.enabled;
    }
  });
};

const onModalCancel = () => {
  modal.value = false;
};

const onModalHide = () => {
  modal.value = false;
};

const onModalDelete = () => {
  const cert = modalCertificate.value;
  if (cert) {
    deleteCertificate({
      type: cert.certificate,
      location: cert.location,
    });
  }
};

const onModalOk = ({
  addNew,
  file,
  type,
  location,
}: {
  addNew: boolean;
  file: File;
  type: string;
  location?: string;
}) => {
  if (addNew) {
    // Upload a new certificate
    addNewCertificate(file, type);
  } else {
    // Replace an existing certificate
    replaceCertificate(file, type, location!);
  }
};

const addNewCertificate = (file: File, type: string) => {
  startLoader();
  if (
    type === 'ServiceLogin Certificate' ||
    type === 'BMC shell ACF certificate' ||
    type === 'Resource dump ACF certificate'
  ) {
    addNewACFCertificateAction({ file, type })
      .then((success) => toast.successToast(success))
      .catch(({ message }: { message: string }) => toast.errorToast(message))
      .finally(() => endLoader());
  } else {
    addNewCertificateAction({ file, type })
      .then((success) => toast.successToast(success))
      .catch(({ message }: { message: string }) => toast.errorToast(message))
      .finally(() => endLoader());
  }
};

const replaceCertificate = (file: File, type: string, location: string) => {
  startLoader();
  if (type === 'ServiceLogin Certificate') {
    return replaceACFCertificateAction({
      file,
      type,
      location,
    })
      .then((success) => toast.successToast(success))
      .catch(({ message }: { message: string }) => toast.errorToast(message))
      .finally(() => endLoader());
  } else {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onloadend = (event: ProgressEvent<FileReader>) => {
      const certificateString = event.target?.result as string;
      return replaceCertificateAction({
        certificateString,
        type,
        location,
      })
        .then((success) => toast.successToast(success))
        .catch(({ message }: { message: string }) => toast.errorToast(message))
        .finally(() => endLoader());
    };
  }
};

const deleteCertificate = ({
  type,
  location,
}: {
  type: string;
  location: string;
}) => {
  startLoader();
  Promise.all([deleteCertificateChecker(type, location)])
    .then((success) => {
      toast.successToast(success[0]);
      refetchAcf();
      refetchCertificates();
    })
    .catch(({ message }: { message: string }) => toast.errorToast(message))
    .finally(() => endLoader());
};

const deleteCertificateChecker = (type: string, location: string) => {
  if (type === 'ServiceLogin Certificate') {
    return deleteACFCertificateAction({
      type,
      location,
    });
  } else {
    return deleteCertificateAction({
      type,
      location,
    });
  }
};

const getDaysUntilExpired = (date: Date): number => {
  if (bmcTime.value) {
    const validUntilMs = date.getTime();
    const currentBmcTimeMs = bmcTime.value.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Math.round((validUntilMs - currentBmcTimeMs) / oneDayInMs);
  }
  return 0;
};

const getIconStatus = (date: Date): string => {
  const daysUntilExpired = getDaysUntilExpired(date);
  if (daysUntilExpired < 0) {
    return 'danger';
  } else if (daysUntilExpired < 31) {
    return 'warning';
  }
  return '';
};
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
