import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import stores from '@/store';
import ServerPowerOperations from '@/views/Operations/ServerPowerOperations/ServerPowerOperations.vue';

// ── Mock composable ───────────────────────────────────────────────────────────

const mockRefetchBios = vi.fn().mockResolvedValue({});
const mockRefetchBiosOnly = vi.fn().mockResolvedValue({});
const mockRefetchSystem = vi.fn().mockResolvedValue({});
const mockRefetchBmc = vi.fn().mockResolvedValue({});
const mockRefetchLocationCodes = vi.fn().mockResolvedValue({});
const mockSaveBiosSettings = vi.fn().mockResolvedValue('');
const mockSaveOperatingModeSettings = vi.fn().mockResolvedValue(undefined);
const mockStandbyToRuntimeMutation = vi.fn().mockResolvedValue('pageServerPowerOperations.toast.successSaveSettings');
const mockServerPowerOn = vi.fn().mockResolvedValue(true);
const mockServerSoftReboot = vi.fn().mockResolvedValue(true);
const mockServerHardReboot = vi.fn().mockResolvedValue(true);
const mockServerSoftPowerOff = vi.fn().mockResolvedValue(true);
const mockServerHardPowerOff = vi.fn().mockResolvedValue(true);

// Reactive mock state — tests mutate these to drive component behaviour
const mockBiosAttributes = ref({ pvm_default_os_type: 'AIX', pvm_sys_dump_active: 'Disabled' });
const mockAttributeValues = ref({ pvm_default_os_type: [{ value: 'AIX', text: 'AIX' }] });
const mockIsBiosLoading = ref(false);
const mockHmcManaged = ref(null);
const mockServerStatus = ref('on');
const mockBootProgressGetter = ref('');
const mockIsSystemLoading = ref(false);
const mockPowerRestorePolicy = ref('LastState');
const mockLastPowerOperationTime = ref(null);
const mockBmc = ref({ powerState: 'On', statusState: 'Enabled', health: 'OK' });
const mockIsBmcLoading = ref(false);
const mockLocationCodes = ref([]);
const mockIsOperationInProgress = ref(false);

vi.mock('@/api/composables/useServerPowerOperations', () => ({
  useBootBiosAttributes: () => ({
    biosAttributes: computed(() => mockBiosAttributes.value),
    attributeValues: computed(() => mockAttributeValues.value),
    isLoading: computed(() => mockIsBiosLoading.value),
    refetch: mockRefetchBios,
    refetchBios: mockRefetchBiosOnly,
    standbyToRuntime: mockStandbyToRuntimeMutation,
    hmcManaged: computed(() => mockHmcManaged.value),
    ibmiLoadSourceValue: computed(() => 'Current configuration'),
    ibmiAltLoadSourceValue: computed(() => 'Current configuration'),
    ibmiConsoleValue: computed(() => 'Current configuration'),
    linuxKvmPercentageValue: computed(() => null),
    linuxKvmPercentageInitialValue: computed(() => null),
    linuxKvmPercentageCurrentValue: computed(() => null),
    saveBiosSettings: mockSaveBiosSettings,
    saveOperatingModeSettings: mockSaveOperatingModeSettings,
    isSavingBios: computed(() => false),
  }),
  useServerSystemInfo: () => ({
    serverStatus: computed(() => mockServerStatus.value),
    isSystemLoading: computed(() => mockIsSystemLoading.value),
    refetchSystem: mockRefetchSystem,
    powerRestorePolicy: computed(() => mockPowerRestorePolicy.value),
    lastPowerOperationTime: computed(() => mockLastPowerOperationTime.value),
  }),
  useServerBmcInfo: () => ({
    bmc: computed(() => mockBmc.value),
    isLoading: computed(() => mockIsBmcLoading.value),
    refetch: mockRefetchBmc,
  }),
  useLocationCodes: () => ({
    locationCodes: computed(() => mockLocationCodes.value),
    refetch: mockRefetchLocationCodes,
  }),
  useServerPowerControl: () => ({
    isOperationInProgress: computed(() => mockIsOperationInProgress.value),
    serverPowerOn: mockServerPowerOn,
    serverSoftReboot: mockServerSoftReboot,
    serverHardReboot: mockServerHardReboot,
    serverSoftPowerOff: mockServerSoftPowerOff,
    serverHardPowerOff: mockServerHardPowerOff,
  }),
}));

// ── Mock supporting composables ───────────────────────────────────────────────

const mockSuccessToast = vi.fn();
const mockInfoToast = vi.fn();
const mockErrorToast = vi.fn();
const mockStartLoader = vi.fn();
const mockEndLoader = vi.fn();
const mockHideLoader = vi.fn();

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({ successToast: mockSuccessToast, infoToast: mockInfoToast, errorToast: mockErrorToast }),
}));

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({ startLoader: mockStartLoader, endLoader: mockEndLoader, hideLoader: mockHideLoader }),
}));

vi.mock('@/i18n', () => ({
  default: { global: { t: vi.fn((key) => key) } },
}));

vi.mock('@/eventBus', () => ({
  default: { emit: vi.fn(), on: vi.fn() },
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    onBeforeRouteLeave: vi.fn(),
  };
});

// ── Stubs for child components ────────────────────────────────────────────────

const globalStubs = {
  PageTitle: { name: 'PageTitle', props: ['title'], template: '<div />' },
  PageSection: { name: 'PageSection', props: ['sectionTitle'], template: '<div><slot /></div>' },
  Alert: { name: 'Alert', props: ['variant'], template: '<div class="alert"><slot /><slot name="action" /></div>' },
  BootSettings: { name: 'BootSettings', props: ['isInPhypStandby', 'isUpdated', 'isAtleastPhypInStandby', 'attributeValues', 'biosAttributes', 'hmcManaged', 'ibmiLoadSourceValue', 'ibmiAltLoadSourceValue', 'ibmiConsoleValue', 'linuxKvmPercentageValue', 'linuxKvmPercentageInitialValue', 'linuxKvmPercentageCurrentValue', 'powerRestorePolicy', 'locationCodes', 'saveBiosSettings', 'saveOperatingModeSettings', 'refetch', 'isSavingBios'], emits: ['update-standby'], template: '<div />' },
  NetworkSettingsModal: { name: 'NetworkSettingsModal', template: '<div />' },
  BContainer: { template: '<div><slot /></div>' },
  BRow: { template: '<div><slot /></div>' },
  BCol: { template: '<div><slot /></div>' },
  BForm: { template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>', emits: ['submit'] },
  BFormGroup: { props: ['label'], template: '<div><slot /></div>' },
  BFormRadio: { props: ['modelValue', 'value'], emits: ['update:modelValue'], template: '<input type="radio" :value="value" @change="$emit(\'update:modelValue\', value)" />' },
  BButton: { props: ['variant', 'type', 'disabled'], emits: ['click'], template: '<button :type="type || \'button\'" @click="$emit(\'click\')"><slot /></button>' },
  BModal: {
    name: 'BModal',
    props: ['modelValue', 'title', 'okTitle', 'okVariant', 'cancelTitle', 'hideHeaderClose'],
    emits: ['update:modelValue', 'ok'],
    template: '<div v-if="modelValue" class="modal"><slot /><button class="ok-btn" @click="$emit(\'ok\')">OK</button></div>',
  },
  IconArrowRight: { template: '<span />' },
};

// ── Factory ───────────────────────────────────────────────────────────────────

let pinia;
let globalStore;

const factory = async () => {
  const wrapper = mount(ServerPowerOperations, {
    global: {
      plugins: [pinia],
      stubs: globalStubs,
      mocks: {
        $t: (key) => key,
        $filters: { formatDate: () => '2024-01-15', formatTime: () => '12:00:00' },
      },
    },
  });
  await flushPromises();
  return wrapper;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ServerPowerOperations.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up Pinia and mock GlobalStore getter
    pinia = createPinia();
    setActivePinia(pinia);
    globalStore = stores.GlobalStore();
    Object.defineProperty(globalStore, 'bootProgressGetter', {
      get: () => mockBootProgressGetter.value,
      configurable: true,
    });
    // Reset all reactive state to defaults
    mockBiosAttributes.value = { pvm_default_os_type: 'AIX', pvm_sys_dump_active: 'Disabled' };
    mockAttributeValues.value = {};
    mockIsBiosLoading.value = false;
    mockHmcManaged.value = null;
    mockServerStatus.value = 'on';
    mockBootProgressGetter.value = '';
    mockIsSystemLoading.value = false;
    mockPowerRestorePolicy.value = 'LastState';
    mockLastPowerOperationTime.value = null;
    mockBmc.value = { powerState: 'On', statusState: 'Enabled', health: 'OK' };
    mockIsBmcLoading.value = false;
    mockLocationCodes.value = [];
    mockIsOperationInProgress.value = false;
    mockRefetchBiosOnly.mockResolvedValue({});
  });

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('Component rendering', () => {
    it('mounts successfully', async () => {
      const wrapper = await factory();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders PageTitle with server power operations title', async () => {
      const wrapper = await factory();
      const title = wrapper.findComponent({ name: 'PageTitle' });
      expect(title.exists()).toBe(true);
      expect(title.props('title')).toBe('appPageTitle.serverPowerOperations');
    });

    it('renders BootSettings component', async () => {
      const wrapper = await factory();
      expect(wrapper.findComponent({ name: 'BootSettings' }).exists()).toBe(true);
    });

    it('renders NetworkSettingsModal', async () => {
      const wrapper = await factory();
      expect(wrapper.findComponent({ name: 'NetworkSettingsModal' }).exists()).toBe(true);
    });
  });

  // ── Loading bar ─────────────────────────────────────────────────────────────

  describe('Loading bar management', () => {
    it('calls startLoader when bios is loading on mount', async () => {
      mockIsBiosLoading.value = true;
      await factory();
      expect(mockStartLoader).toHaveBeenCalled();
    });

    it('calls endLoader when nothing is loading', async () => {
      mockIsBiosLoading.value = false;
      mockIsSystemLoading.value = false;
      mockIsBmcLoading.value = false;
      await factory();
      await flushPromises();
      expect(mockEndLoader).toHaveBeenCalled();
    });
  });

  // ── Server status display ────────────────────────────────────────────────────

  describe('Server status display', () => {
    it('shows "on" status text when server is on', async () => {
      mockServerStatus.value = 'on';
      const wrapper = await factory();
      const statusEl = wrapper.find('[data-test-id="powerServerOps-text-hostStatus"]');
      expect(statusEl.exists()).toBe(true);
      expect(statusEl.text()).toBe('global.status.on');
    });

    it('shows "off" status text when server is off', async () => {
      mockServerStatus.value = 'off';
      const wrapper = await factory();
      const statusEl = wrapper.find('[data-test-id="powerServerOps-text-hostStatus"]');
      expect(statusEl.text()).toBe('global.status.off');
    });

    it('shows last power operation time when available', async () => {
      mockLastPowerOperationTime.value = new Date('2024-01-15T12:00:00Z');
      const wrapper = await factory();
      const lastOpEl = wrapper.find('[data-test-id="powerServerOps-text-lastPowerOp"]');
      expect(lastOpEl.exists()).toBe(true);
    });

    it('shows "--" when no last power operation time', async () => {
      mockLastPowerOperationTime.value = null;
      const wrapper = await factory();
      expect(wrapper.text()).toContain('--');
    });
  });

  // ── PHYP Standby banner ──────────────────────────────────────────────────────

  describe('PHYP Standby banner', () => {
    it('shows standby banner when bootProgress is SystemHardwareInitializationComplete', async () => {
      mockBootProgressGetter.value = 'SystemHardwareInitializationComplete';
      const wrapper = await factory();
      expect(wrapper.text()).toContain('pageServerPowerOperations.phypStandby');
    });

    it('hides standby banner when not in standby', async () => {
      mockBootProgressGetter.value = '';
      const wrapper = await factory();
      expect(wrapper.text()).not.toContain('pageServerPowerOperations.phypStandby');
    });

    it('hides banner after standbyToRuntime succeeds (phypStandby = true)', async () => {
      mockBootProgressGetter.value = 'SystemHardwareInitializationComplete';
      const wrapper = await factory();
      // Trigger standbyToRuntime via "OS Runtime" button click
      await wrapper.vm.standbyToRuntime();
      await flushPromises();
      expect(wrapper.vm.phypStandby).toBe(true);
      // isInPhypStandby computed returns false when phypStandby is true
      expect(wrapper.vm.isInPhypStandby).toBe(false);
    });

    it('isInPhypStandby is false when phypStandby flag is set', async () => {
      mockBootProgressGetter.value = 'SystemHardwareInitializationComplete';
      const wrapper = await factory();
      // phypStandby flag overrides bootProgress — once set, isInPhypStandby returns false
      wrapper.vm.phypStandby = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isInPhypStandby).toBe(false);
    });
  });

  // ── Power operations section ─────────────────────────────────────────────────

  describe('Power operations section', () => {
    it('shows operation in progress alert when isOperationInProgress is true', async () => {
      mockIsOperationInProgress.value = true;
      const wrapper = await factory();
      expect(wrapper.text()).toContain('pageServerPowerOperations.operationInProgress');
    });

    it('shows power on button when server is off', async () => {
      mockServerStatus.value = 'off';
      const wrapper = await factory();
      const powerOnBtn = wrapper.find('[data-test-id="serverPowerOperations-button-powerOn"]');
      expect(powerOnBtn.exists()).toBe(true);
    });

    it('hides power on button when server is on', async () => {
      mockServerStatus.value = 'on';
      const wrapper = await factory();
      const powerOnBtn = wrapper.find('[data-test-id="serverPowerOperations-button-powerOn"]');
      expect(powerOnBtn.exists()).toBe(false);
    });

    it('shows reboot and shutdown forms when server is on', async () => {
      mockServerStatus.value = 'on';
      const wrapper = await factory();
      expect(wrapper.find('[data-test-id="serverPowerOperations-button-reboot"]').exists()).toBe(true);
      expect(wrapper.find('[data-test-id="serverPowerOperations-button-shutDown"]').exists()).toBe(true);
    });
  });

  // ── Power On ──────────────────────────────────────────────────────────────────

  describe('powerOn()', () => {
    it('calls serverPowerOn when BMC is healthy', async () => {
      mockServerStatus.value = 'off';
      mockBmc.value = { powerState: 'On', statusState: 'Enabled', health: 'OK' };
      const wrapper = await factory();
      await wrapper.vm.powerOn();
      await flushPromises();
      expect(mockServerPowerOn).toHaveBeenCalled();
    });

    it('shows error toast when BMC is not healthy', async () => {
      mockServerStatus.value = 'off';
      mockBmc.value = { powerState: 'Off', statusState: 'Disabled', health: 'Warning' };
      const wrapper = await factory();
      await wrapper.vm.powerOn();
      expect(mockErrorToast).toHaveBeenCalledWith('pageServerPowerOperations.toast.errorPowerOn');
      expect(mockServerPowerOn).not.toHaveBeenCalled();
    });

    it('shows info toast when serverPowerOn returns true', async () => {
      mockBmc.value = { powerState: 'On', statusState: 'Enabled', health: 'OK' };
      mockServerPowerOn.mockResolvedValue(true);
      const wrapper = await factory();
      await wrapper.vm.powerOn();
      await flushPromises();
      expect(mockInfoToast).toHaveBeenCalledWith('pageServerPowerOperations.userRefresh');
    });
  });

  // ── Reboot modal ──────────────────────────────────────────────────────────────

  describe('rebootServer()', () => {
    it('opens the confirm modal after refetching BIOS', async () => {
      const wrapper = await factory();
      expect(wrapper.vm.openModal).toBe(false);
      await wrapper.vm.rebootServer();
      await flushPromises();
      expect(mockRefetchBiosOnly).toHaveBeenCalled();
      expect(wrapper.vm.openModal).toBe(true);
    });

    it('sets modalOption to "reboot"', async () => {
      const wrapper = await factory();
      await wrapper.vm.rebootServer();
      await flushPromises();
      expect(wrapper.vm.modalOption).toBe('reboot');
    });

    it('sets danger variant when system dump is active', async () => {
      mockBiosAttributes.value = { pvm_sys_dump_active: 'Enabled' };
      const wrapper = await factory();
      await wrapper.vm.rebootServer();
      await flushPromises();
      expect(wrapper.vm.modalOptions.okVariant).toBe('danger');
    });

    it('sets primary variant when system dump is not active', async () => {
      mockBiosAttributes.value = { pvm_sys_dump_active: 'Disabled' };
      const wrapper = await factory();
      await wrapper.vm.rebootServer();
      await flushPromises();
      expect(wrapper.vm.modalOptions.okVariant).toBe('primary');
    });
  });

  // ── Shutdown modal ────────────────────────────────────────────────────────────

  describe('shutdownServer()', () => {
    it('opens the confirm modal', async () => {
      const wrapper = await factory();
      wrapper.vm.shutdownServer();
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.openModal).toBe(true);
      expect(wrapper.vm.modalOption).toBe('shutdown');
    });

    it('sets danger variant when system dump is active', async () => {
      mockBiosAttributes.value = { pvm_sys_dump_active: 'Enabled' };
      const wrapper = await factory();
      wrapper.vm.shutdownServer();
      expect(wrapper.vm.modalOptions.okVariant).toBe('danger');
    });
  });

  // ── operationConfirm ──────────────────────────────────────────────────────────

  describe('operationConfirm()', () => {
    it('calls serverSoftReboot for orderly reboot', async () => {
      const wrapper = await factory();
      wrapper.vm.modalOption = 'reboot';
      wrapper.vm.form.rebootOption = 'orderly';
      await wrapper.vm.operationConfirm();
      await flushPromises();
      expect(mockServerSoftReboot).toHaveBeenCalled();
    });

    it('calls serverHardReboot for immediate reboot', async () => {
      const wrapper = await factory();
      wrapper.vm.modalOption = 'reboot';
      wrapper.vm.form.rebootOption = 'immediate';
      await wrapper.vm.operationConfirm();
      await flushPromises();
      expect(mockServerHardReboot).toHaveBeenCalled();
    });

    it('calls serverSoftPowerOff for orderly shutdown', async () => {
      const wrapper = await factory();
      wrapper.vm.modalOption = 'shutdown';
      wrapper.vm.form.shutdownOption = 'orderly';
      await wrapper.vm.operationConfirm();
      await flushPromises();
      expect(mockServerSoftPowerOff).toHaveBeenCalled();
    });

    it('calls serverHardPowerOff for immediate shutdown', async () => {
      const wrapper = await factory();
      wrapper.vm.modalOption = 'shutdown';
      wrapper.vm.form.shutdownOption = 'immediate';
      await wrapper.vm.operationConfirm();
      await flushPromises();
      expect(mockServerHardPowerOff).toHaveBeenCalled();
    });
  });

  // ── Standby-to-runtime flow ───────────────────────────────────────────────────

  describe('standbyToRuntime()', () => {
    it('sets phypStandby to true and shows success toast on success', async () => {
      const wrapper = await factory();
      await wrapper.vm.standbyToRuntime();
      await flushPromises();
      expect(wrapper.vm.phypStandby).toBe(true);
      expect(mockSuccessToast).toHaveBeenCalledWith(
        'pageServerPowerOperations.toast.successSaveSettings',
      );
    });

    it('shows error toast when mutation fails', async () => {
      mockStandbyToRuntimeMutation.mockRejectedValueOnce({ message: 'Server error' });
      const wrapper = await factory();
      await wrapper.vm.standbyToRuntime();
      await flushPromises();
      expect(mockErrorToast).toHaveBeenCalledWith('Server error');
      expect(wrapper.vm.phypStandby).toBe(false);
    });
  });

  // ── Save standby to runtime flow ──────────────────────────────────────────────

  describe('saveStandbyToRuntime()', () => {
    it('sets isUpdated to true', async () => {
      const wrapper = await factory();
      wrapper.vm.saveStandbyToRuntime();
      expect(wrapper.vm.isUpdated).toBe(true);
    });
  });

  describe('updateToRuntime()', () => {
    it('resets isUpdated and calls standbyToRuntime', async () => {
      const wrapper = await factory();
      wrapper.vm.isUpdated = true;
      await wrapper.vm.updateToRuntime();
      await flushPromises();
      expect(wrapper.vm.isUpdated).toBe(false);
      expect(mockStandbyToRuntimeMutation).toHaveBeenCalled();
    });
  });

  // ── Computed properties ───────────────────────────────────────────────────────

  describe('Computed properties', () => {
    it('isIBMi is true when pvm_default_os_type is "IBM I"', async () => {
      mockBiosAttributes.value = { pvm_default_os_type: 'IBM I' };
      const wrapper = await factory();
      expect(wrapper.vm.isIBMi).toBe(true);
    });

    it('isIBMi is true when pvm_default_os_type is "Default"', async () => {
      mockBiosAttributes.value = { pvm_default_os_type: 'Default' };
      const wrapper = await factory();
      expect(wrapper.vm.isIBMi).toBe(true);
    });

    it('isIBMi is false for other OS types', async () => {
      mockBiosAttributes.value = { pvm_default_os_type: 'AIX' };
      const wrapper = await factory();
      expect(wrapper.vm.isIBMi).toBe(false);
    });

    it('systemDumpActive is true when pvm_sys_dump_active is "Enabled"', async () => {
      mockBiosAttributes.value = { pvm_sys_dump_active: 'Enabled' };
      const wrapper = await factory();
      expect(wrapper.vm.systemDumpActive).toBe(true);
    });

    it('hmcInfo reflects hmcManaged value', async () => {
      mockHmcManaged.value = 'Enabled';
      const wrapper = await factory();
      expect(wrapper.vm.hmcInfo).toBe('Enabled');
    });
  });

  // ── Default state ─────────────────────────────────────────────────────────────

  describe('Default state', () => {
    it('initialises with correct defaults', async () => {
      const wrapper = await factory();
      expect(wrapper.vm.openModal).toBe(false);
      expect(wrapper.vm.phypStandby).toBe(false);
      expect(wrapper.vm.isUpdated).toBe(false);
      expect(wrapper.vm.form.rebootOption).toBe('orderly');
      expect(wrapper.vm.form.shutdownOption).toBe('orderly');
    });
  });
});
