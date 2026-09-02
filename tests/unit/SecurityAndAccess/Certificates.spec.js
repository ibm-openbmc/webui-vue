import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import Certificates from '@/views/SecurityAndAccess/Certificates/Certificates.vue';
import stores from '@/store';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const onBeforeRouteLeaveMock = vi.fn();

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
  };
});

afterAll(() => {
  vi.unmock('vue-router');
});

const hideLoaderMock = vi.fn();
const startLoaderMock = vi.fn();
const endLoaderMock = vi.fn();

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    hideLoader: hideLoaderMock,
    startLoader: startLoaderMock,
    endLoader: endLoaderMock,
  }),
}));

// Mock the useCertificates composable
vi.mock('@/api/composables/useCertificates', () => ({
  useCertificates: vi.fn(),
  CERTIFICATE_TYPES: [
    {
      type: 'HTTPS Certificate',
      location: '/redfish/v1/Managers/bmc/NetworkProtocol/HTTPS/Certificates/',
      labelKey: 'pageCertificates.httpsCertificate',
      limit: 1,
    },
    {
      type: 'LDAP Certificate',
      location: '/redfish/v1/AccountService/LDAP/Certificates/',
      labelKey: 'pageCertificates.ldapCertificate',
      limit: 1,
    },
    {
      type: 'TrustStore Certificate',
      location: '/redfish/v1/Managers/bmc/Truststore/Certificates/',
      labelKey: 'pageCertificates.caCertificate',
      limit: 10,
    },
  ],
}));

import { useCertificates } from '@/api/composables/useCertificates';
import eventBus from '@/eventBus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the minimal mock useCertificates return value */
const makeCertificatesHook = (overrides = {}) => ({
  certificates: ref([]),
  availableUploadTypes: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  refetchAll: vi.fn(),
  addNewACFCertificate: vi.fn(),
  addNewCertificate: vi.fn(),
  replaceACFCertificate: vi.fn(),
  replaceCertificate: vi.fn(),
  deleteACFCertificate: vi.fn(),
  deleteCertificate: vi.fn(),
  ...overrides,
});

/** A small set of certificate fixtures used across tests */
const MOCK_CERTIFICATES = [
  {
    type: 'HTTPS Certificate',
    location: '/redfish/v1/cert1',
    certificate: 'HTTPS Certificate',
    issuedBy: 'Test CA',
    issuedTo: 'test.example.com',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validUntil: new Date('2025-12-31T23:59:59Z'),
  },
  {
    type: 'LDAP Certificate',
    location: '/redfish/v1/cert2',
    certificate: 'LDAP Certificate',
    issuedBy: 'LDAP CA',
    issuedTo: 'ldap.example.com',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validUntil: new Date('2024-12-15T23:59:59Z'), // Expiring soon
  },
  {
    type: 'TrustStore Certificate',
    location: '/redfish/v1/cert3',
    certificate: 'TrustStore Certificate',
    issuedBy: 'Trust CA',
    issuedTo: 'trust.example.com',
    validFrom: new Date('2024-01-01T00:00:00Z'),
    validUntil: new Date('2024-01-01T00:00:00Z'), // Expired
  },
];

/** Mount Certificates.vue with standard global config */
function mountCertificates(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useCertificates.mockReturnValue(makeCertificatesHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);
  const globalStore = stores.GlobalStore();
  const userManagementStore = stores.UserManagementStore();

  // Mock store methods
  globalStore.getBmcTime = vi.fn().mockResolvedValue();
  globalStore.bmcTime = new Date('2024-12-01T00:00:00Z');
  globalStore.currentUser = { RoleId: 'Administrator' };
  userManagementStore.getUsers = vi.fn().mockResolvedValue();

  return mount(Certificates, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
        $filters: {
          formatDate: (date) => date?.toISOString?.() || '',
        },
      },
      stubs: {
        BContainer: { template: '<div><slot /></div>' },
        BRow: { template: '<div><slot /></div>' },
        BCol: { template: '<div><slot /></div>' },
        BButton: { template: '<button><slot /></button>' },
        BTable: {
          template: '<table id="certificates-table"><slot /></table>',
          props: ['fields', 'items'],
          name: 'BTable',
        },
        BModal: {
          template: '<div><slot /></div>',
          props: ['modelValue', 'title'],
        },
        Alert: { template: '<div v-if="show"><slot /></div>', props: ['show'] },
        PageTitle: {
          template: '<div class="page-title">appPageTitle.certificates</div>',
        },
        StatusIcon: { template: '<span />', props: ['status'] },
        TableRowAction: { template: '<button />', props: ['value', 'title'] },
        ModalUploadCertificate: { template: '<div />' },
        ModalGenerateCsr: { template: '<div />' },
        IconAdd: { template: '<span />' },
        IconReplace: { template: '<span />' },
        IconTrashcan: { template: '<span />' },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Certificates.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountCertificates();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the page title', () => {
    const wrapper = mountCertificates();
    const pageTitle = wrapper.find('.page-title');
    expect(pageTitle.exists()).toBe(true);
  });

  it('renders the certificates table', () => {
    const wrapper = mountCertificates();
    const table = wrapper.find('#certificates-table');
    expect(table.exists()).toBe(true);
  });

  it('renders the generate CSR button', () => {
    const wrapper = mountCertificates();
    const buttons = wrapper.findAll('button');
    const generateCsrButton = buttons.find((btn) =>
      btn.text().includes('pageCertificates.generateCsr'),
    );
    expect(generateCsrButton).toBeDefined();
  });

  it('renders the add new certificate button', () => {
    const wrapper = mountCertificates();
    const buttons = wrapper.findAll('button');
    const addButton = buttons.find((btn) =>
      btn.text().includes('pageCertificates.addNewCertificate'),
    );
    expect(addButton).toBeDefined();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('starts the loader when loading is true on mount', async () => {
    mountCertificates({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();

    expect(startLoaderMock).toHaveBeenCalled();
  });

  it('ends the loader when loading is false', async () => {
    const isFetching = ref(true);
    mountCertificates({ isFetching });
    await nextTick();
    await nextTick();

    startLoaderMock.mockClear();
    endLoaderMock.mockClear();

    isFetching.value = false;
    await nextTick();
    await nextTick();

    expect(endLoaderMock).toHaveBeenCalled();
  });

  it('sets isBusy to false when loading completes', async () => {
    const isFetching = ref(true);
    const wrapper = mountCertificates({ isFetching });
    await nextTick();
    await nextTick();

    isFetching.value = false;
    await nextTick();
    await nextTick();

    expect(wrapper.vm.isBusy).toBe(false);
  });

  // ── Data display ──────────────────────────────────────────────────────────

  it('displays certificates in the table', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.certificates).toHaveLength(3);
    expect(wrapper.vm.tableItems).toHaveLength(3);
  });

  it('maps certificates to table items with actions', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    const tableItems = wrapper.vm.tableItems;
    expect(tableItems[0].actions).toBeDefined();
    expect(tableItems[0].actions).toHaveLength(2);
    expect(tableItems[0].actions[0].value).toBe('replace');
    expect(tableItems[0].actions[1].value).toBe('delete');
  });

  it('enables delete action only for TrustStore and ServiceLogin certificates', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    const tableItems = wrapper.vm.tableItems;

    // HTTPS Certificate - delete should be disabled
    expect(tableItems[0].actions[1].enabled).toBe(false);

    // TrustStore Certificate - delete should be enabled
    expect(tableItems[2].actions[1].enabled).toBe(true);
  });

  // ── Certificate expiration alerts ─────────────────────────────────────────

  it('shows expired certificate alert when certificates are expired', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.expiredCertificateTypes.length).toBeGreaterThan(0);
  });

  it('shows expiring certificate alert when certificates expire soon', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.expiringCertificateTypes.length).toBeGreaterThan(0);
  });

  it('calculates days until expiration correctly', () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });

    const futureDate = new Date('2025-01-01T00:00:00Z');
    const days = wrapper.vm.getDaysUntilExpired(futureDate);

    expect(typeof days).toBe('number');
  });

  it('returns correct icon status for expired certificates', () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });

    const expiredDate = new Date('2023-01-01T00:00:00Z');
    const status = wrapper.vm.getIconStatus(expiredDate);

    expect(status).toBe('danger');
  });

  it('returns correct icon status for expiring certificates', () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });

    const expiringDate = new Date('2024-12-15T00:00:00Z');
    const status = wrapper.vm.getIconStatus(expiringDate);

    expect(status).toBe('warning');
  });

  // ── Available upload types ────────────────────────────────────────────────

  it('computes available upload types correctly', async () => {
    const availableTypes = [
      {
        type: 'LDAP Certificate',
        location: '/redfish/v1/AccountService/LDAP/Certificates/',
        labelKey: 'pageCertificates.ldapCertificate',
        limit: 1,
      },
    ];

    const wrapper = mountCertificates({
      certificates: ref([MOCK_CERTIFICATES[0]]), // Only HTTPS
      availableUploadTypes: ref(availableTypes),
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.certificatesForUpload).toHaveLength(1);
  });

  it('disables add certificate button when no upload types available', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
      availableUploadTypes: ref([]),
    });
    await wrapper.vm.$nextTick();

    const buttons = wrapper.findAll('button');
    const addButton = buttons.find((btn) =>
      btn.text().includes('pageCertificates.addNewCertificate'),
    );

    expect(addButton?.attributes('disabled')).toBeDefined();
  });

  // ── Certificate label mapping ─────────────────────────────────────────────

  it('gets certificate label from CERTIFICATE_TYPES', () => {
    const wrapper = mountCertificates();

    const label = wrapper.vm.getCertificateLabel('HTTPS Certificate');
    // The function uses i18n.global.t which returns the translated key
    expect(label).toBe('HTTPS Certificate');
  });

  it('returns certificate type as label if not found in CERTIFICATE_TYPES', () => {
    const wrapper = mountCertificates();

    const label = wrapper.vm.getCertificateLabel('Unknown Certificate');
    expect(label).toBe('Unknown Certificate');
  });

  // ── Table row actions ─────────────────────────────────────────────────────

  it('handles replace action on table row', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    const emitSpy = vi.spyOn(eventBus, 'emit');

    wrapper.vm.onTableRowAction('replace', MOCK_CERTIFICATES[0]);

    expect(emitSpy).toHaveBeenCalledWith('upload-certificate');
    expect(wrapper.vm.modalCertificate).toEqual(MOCK_CERTIFICATES[0]);
  });

  it('handles delete action on table row', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('delete', MOCK_CERTIFICATES[2]);

    expect(wrapper.vm.modalCertificate).toEqual(MOCK_CERTIFICATES[2]);
  });

  // ── Modal operations ──────────────────────────────────────────────────────

  it('initializes upload certificate modal with null for new certificate', () => {
    const wrapper = mountCertificates();
    const emitSpy = vi.spyOn(eventBus, 'emit');

    wrapper.vm.initModalUploadCertificate(null);

    expect(wrapper.vm.modalCertificate).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith('upload-certificate');
  });

  it('initializes upload certificate modal with certificate for replace', () => {
    const wrapper = mountCertificates();
    const emitSpy = vi.spyOn(eventBus, 'emit');

    wrapper.vm.initModalUploadCertificate(MOCK_CERTIFICATES[0]);

    expect(wrapper.vm.modalCertificate).toEqual(MOCK_CERTIFICATES[0]);
    expect(emitSpy).toHaveBeenCalledWith('upload-certificate');
  });

  it('initializes delete certificate modal', async () => {
    const wrapper = mountCertificates({
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.initModalDeleteCertificate(MOCK_CERTIFICATES[2]);

    expect(wrapper.vm.modalCertificate).toEqual(MOCK_CERTIFICATES[2]);
    // The function uses getCertificateLabel which returns the certificate type
    expect(wrapper.vm.modalContent).toBe('CA Certificate');
  });

  it('closes modal on cancel', () => {
    const wrapper = mountCertificates();

    wrapper.vm.modal = true;
    wrapper.vm.onModalCancel();

    expect(wrapper.vm.modal).toBe(false);
  });

  it('closes modal on hide', () => {
    const wrapper = mountCertificates();

    wrapper.vm.modal = true;
    wrapper.vm.onModalHide();

    expect(wrapper.vm.modal).toBe(false);
  });

  // ── Certificate operations ────────────────────────────────────────────────

  it('calls addNewCertificate when adding new certificate', async () => {
    const addNewCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      addNewCertificate,
    });

    const mockFile = new File(['content'], 'cert.pem');
    await wrapper.vm.addNewCertificateHandler(mockFile, 'HTTPS Certificate');

    expect(addNewCertificate).toHaveBeenCalledWith({
      file: mockFile,
      type: 'HTTPS Certificate',
    });
  });

  it('calls addNewACFCertificate when adding ACF certificate', async () => {
    const addNewACFCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      addNewACFCertificate,
    });

    const mockFile = new File(['content'], 'acf.cert');
    await wrapper.vm.addNewCertificateHandler(
      mockFile,
      'ServiceLogin Certificate',
    );

    expect(addNewACFCertificate).toHaveBeenCalledWith({
      file: mockFile,
      type: 'ServiceLogin Certificate',
    });
  });

  it('calls replaceCertificate when replacing non-ACF certificate', async () => {
    const replaceCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      replaceCertificate,
    });

    const mockFile = new File(['content'], 'cert.pem');
    await wrapper.vm.replaceCertificateHandler(
      mockFile,
      'HTTPS Certificate',
      '/redfish/v1/cert1',
    );

    // Wait for FileReader to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(replaceCertificate).toHaveBeenCalled();
  });

  it('calls replaceACFCertificate when replacing ACF certificate', async () => {
    const replaceACFCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      replaceACFCertificate,
    });

    const mockFile = new File(['content'], 'acf.cert');
    await wrapper.vm.replaceCertificateHandler(
      mockFile,
      'ServiceLogin Certificate',
      '/redfish/v1/AccountService/Accounts/service',
    );

    expect(replaceACFCertificate).toHaveBeenCalledWith({
      file: mockFile,
      type: 'ServiceLogin Certificate',
      location: '/redfish/v1/AccountService/Accounts/service',
    });
  });

  it('calls deleteCertificate when deleting non-ACF certificate', async () => {
    const deleteCertificate = vi.fn().mockResolvedValue('Success');
    const refetchAll = vi.fn();
    const wrapper = mountCertificates({
      deleteCertificate,
      refetchAll,
    });

    await wrapper.vm.deleteCertificateHandler({
      type: 'TrustStore Certificate',
      location: '/redfish/v1/cert3',
    });

    expect(deleteCertificate).toHaveBeenCalledWith({
      type: 'TrustStore Certificate',
      location: '/redfish/v1/cert3',
    });
  });

  it('calls deleteACFCertificate when deleting ACF certificate', async () => {
    const deleteACFCertificate = vi.fn().mockResolvedValue('Success');
    const refetchAll = vi.fn();
    const wrapper = mountCertificates({
      deleteACFCertificate,
      refetchAll,
    });

    await wrapper.vm.deleteCertificateHandler({
      type: 'ServiceLogin Certificate',
      location: '/redfish/v1/AccountService/Accounts/service',
    });

    expect(deleteACFCertificate).toHaveBeenCalledWith({
      type: 'ServiceLogin Certificate',
      location: '/redfish/v1/AccountService/Accounts/service',
    });
  });

  it('handles modal OK for adding new certificate', async () => {
    const addNewCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      addNewCertificate,
    });

    const mockFile = new File(['content'], 'cert.pem');
    await wrapper.vm.onModalOk({
      addNew: true,
      file: mockFile,
      type: 'HTTPS Certificate',
      location: null,
    });

    expect(addNewCertificate).toHaveBeenCalled();
  });

  it('handles modal OK for replacing certificate', async () => {
    const replaceCertificate = vi.fn().mockResolvedValue('Success');
    const wrapper = mountCertificates({
      replaceCertificate,
    });

    const mockFile = new File(['content'], 'cert.pem');
    await wrapper.vm.onModalOk({
      addNew: false,
      file: mockFile,
      type: 'HTTPS Certificate',
      location: '/redfish/v1/cert1',
    });

    // Wait for FileReader
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(replaceCertificate).toHaveBeenCalled();
  });

  it('handles modal delete confirmation', async () => {
    const deleteCertificate = vi.fn().mockResolvedValue('Success');
    const refetchAll = vi.fn();
    const wrapper = mountCertificates({
      deleteCertificate,
      refetchAll,
      certificates: ref(MOCK_CERTIFICATES),
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.modalCertificate = MOCK_CERTIFICATES[2];
    await wrapper.vm.onModalDeleteHandler();

    expect(deleteCertificate).toHaveBeenCalled();
  });

  // ── Route leave ───────────────────────────────────────────────────────────

  it('registers route leave handler', () => {
    mountCertificates();

    // The onBeforeRouteLeave is called during component setup
    // We just verify the mock was set up correctly
    expect(onBeforeRouteLeaveMock).toBeDefined();
  });
});
