import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Static imports (required before vi.mock hoisting) ─────────────────────────
// These are loaded after mocks are set up, but must be declared at top-level
// to avoid timeout from dynamic imports inside beforeEach.

// ── Shared mock state ──────────────────────────────────────────────────────────

const mockNetworkSettings = ref([]);
const mockLldpEnabledState = ref([]);
const mockIsLoading = ref(false);
const mockIsTableBusy = ref(false);
const mockSelectedInterfaceIndex = ref(0);
const mockSelectedInterfaceId = ref('');

const mockSetSelectedTabIndex = vi.fn();
const mockSetSelectedTabId = vi.fn();
const mockRefetchEthernet = vi.fn();
const mockRefetchLldp = vi.fn();
const mockSaveLLDPState = vi.fn();
const mockUpdateIpv4Address = vi.fn();
const mockUpdateIpv6Address = vi.fn();
const mockUpdateIpv6StaticDefaultGatewayAddress = vi.fn();
const mockSaveDnsAddress = vi.fn();
const mockSaveHostname = vi.fn();
const mockSaveDomainNameState = vi.fn();
const mockSaveDnsState = vi.fn();
const mockSaveNtpState = vi.fn();
const mockEditDnsAddress = vi.fn();

// ── Composable mocks ──────────────────────────────────────────────────────────

vi.mock('@/api/composables/useNetwork', () => ({
  useNetwork: () => ({
    networkSettings: computed(() => mockNetworkSettings.value),
    lldpEnabledState: computed(() => mockLldpEnabledState.value),
    isLoading: computed(() => mockIsLoading.value),
    isTableBusy: computed(() => mockIsTableBusy.value),
    selectedInterfaceIndex: computed(() => mockSelectedInterfaceIndex.value),
    selectedInterfaceId: computed(() => mockSelectedInterfaceId.value),
    setSelectedTabIndex: mockSetSelectedTabIndex,
    setSelectedTabId: mockSetSelectedTabId,
    refetchEthernet: mockRefetchEthernet,
    refetchLldp: mockRefetchLldp,
    saveLLDPState: mockSaveLLDPState,
    updateIpv4Address: mockUpdateIpv4Address,
    updateIpv6Address: mockUpdateIpv6Address,
    updateIpv6StaticDefaultGatewayAddress:
      mockUpdateIpv6StaticDefaultGatewayAddress,
    saveDnsAddress: mockSaveDnsAddress,
    saveHostname: mockSaveHostname,
    saveDomainNameState: mockSaveDomainNameState,
    saveDnsState: mockSaveDnsState,
    saveNtpState: mockSaveNtpState,
    editDnsAddress: mockEditDnsAddress,
    isSavingDomainName: ref(false),
    isSavingDns: ref(false),
    isSavingNtp: ref(false),
    isSavingDhcp: ref(false),
  }),
}));

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    startLoader: vi.fn(),
    endLoader: vi.fn(),
    hideLoader: vi.fn(),
  }),
}));

vi.mock('@/components/Composables/useDataFormatterGlobal', () => ({
  default: () => ({
    dataFormatter: (val) =>
      val === undefined || val === null || val === '' ? '--' : val,
  }),
}));

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({ successToast: vi.fn(), errorToast: vi.fn() }),
}));

vi.mock('@/store', () => ({
  default: {
    AuthenticationStore: () => ({ logout: vi.fn() }),
  },
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return { ...actual, onBeforeRouteLeave: vi.fn() };
});

vi.mock('@/eventBus', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

import eventBus from '@/eventBus';

// ── Static component imports (after vi.mock) ──────────────────────────────────

import NetworkComponent from '@/views/Settings/Network/Network.vue';
import NetworkGlobalSettingsComponent from '@/views/Settings/Network/NetworkGlobalSettings.vue';
import NetworkInterfaceSettingsComponent from '@/views/Settings/Network/NetworkInterfaceSettings.vue';
import TableDnsComponent from '@/views/Settings/Network/TableDns.vue';

// ── Common stubs ──────────────────────────────────────────────────────────────

const commonStubs = {
  BContainer: { template: '<div><slot /></div>' },
  BRow: { template: '<div class="b-row"><slot /></div>' },
  BCol: { props: ['lg', 'md'], template: '<div class="b-col"><slot /></div>' },
  BCard: { template: '<div class="b-card"><slot /></div>' },
  BTabs: { template: '<div class="b-tabs"><slot /></div>' },
  BTab: {
    props: ['title'],
    emits: ['click'],
    template:
      '<div class="b-tab" :data-title="title" @click="$emit(\'click\')"><slot /></div>',
  },
  BFormCheckbox: {
    props: ['modelValue', 'disabled', 'switch'],
    emits: ['update:modelValue'],
    template:
      '<label class="b-form-checkbox">' +
      '<input type="checkbox" :checked="modelValue" :disabled="disabled" ' +
      '@change="$emit(\'update:modelValue\', $event.target.checked)" />' +
      '<slot /></label>',
  },
  BButton: {
    props: ['variant', 'disabled'],
    emits: ['click'],
    template:
      '<button class="b-button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
  BTable: {
    props: ['fields', 'items', 'busy'],
    template:
      '<table class="b-table">' +
      '<thead><tr><th v-for="f in fields" :key="f.key">{{ f.label }}</th></tr></thead>' +
      '<tbody>' +
      '<tr v-for="(item, idx) in items" :key="idx" class="b-table-row">' +
      '<td v-for="f in fields" :key="f.key">{{ item[f.key] }}</td>' +
      '</tr>' +
      '</tbody>' +
      '</table>',
  },
  PageTitle: {
    props: ['title', 'description'],
    template: '<h1 class="page-title">{{ title }}</h1>',
  },
  PageSection: {
    props: ['sectionTitle'],
    template: '<section :data-title="sectionTitle"><slot /></section>',
  },
  // Network sub-component stubs — named so findComponent({ name }) works
  NetworkGlobalSettings: {
    name: 'NetworkGlobalSettings',
    template: '<div class="network-global-settings"></div>',
  },
  NetworkInterfaceSettings: {
    name: 'NetworkInterfaceSettings',
    props: ['tabIndex'],
    template: '<div class="network-interface-settings"></div>',
  },
  TableIpv4: {
    name: 'TableIpv4',
    props: ['tabIndex'],
    template: '<div class="table-ipv4"></div>',
  },
  TableIpv6: {
    name: 'TableIpv6',
    props: ['tabIndex'],
    template: '<div class="table-ipv6"></div>',
  },
  TableIpv6StaticDefaultGateway: {
    name: 'TableIpv6StaticDefaultGateway',
    props: ['tabIndex'],
    template: '<div class="table-ipv6-static-default-gateway"></div>',
  },
  TableDns: {
    name: 'TableDns',
    props: ['tabIndex'],
    template: '<div class="table-dns"></div>',
  },
  // Modal stubs with names so findComponent({ name }) works
  ModalHostname: {
    name: 'ModalHostname',
    props: ['hostname'],
    emits: ['ok'],
    template: '<div class="modal-hostname"></div>',
  },
  ModalIpv4: {
    name: 'ModalIpv4',
    props: ['defaultGateway', 'subnet', 'ipAddress', 'editModal'],
    emits: ['ok'],
    template: '<div class="modal-ipv4"></div>',
  },
  ModalIpv6: {
    name: 'ModalIpv6',
    props: ['prefixLength', 'ipAddress', 'editModal'],
    emits: ['ok'],
    template: '<div class="modal-ipv6"></div>',
  },
  ModalIpv6StaticDefaultGateway: {
    name: 'ModalIpv6StaticDefaultGateway',
    props: ['ipAddress', 'editModal'],
    emits: ['ok'],
    template: '<div class="modal-ipv6-static-default-gateway"></div>',
  },
  ModalDns: {
    name: 'ModalDns',
    emits: ['ok'],
    template: '<div class="modal-dns"></div>',
  },
  IconEdit: { template: '<svg class="icon-edit"></svg>' },
  // TableRowAction: emits clickTableAction with the action value on click
  TableRowAction: {
    name: 'TableRowAction',
    props: ['value', 'title', 'enabled'],
    emits: ['clickTableAction'],
    template:
      '<button class="table-row-action" :data-value="value" ' +
      '@click="$emit(\'clickTableAction\', value)"><slot name="icon" /></button>',
  },
  IconAdd: { template: '<svg class="icon-add"></svg>' },
  IconTrashcan: { template: '<svg class="icon-trashcan"></svg>' },
};

const globalMocks = { $t: (key) => key };

// ── Sample data ───────────────────────────────────────────────────────────────

const makeInterface = (overrides = {}) => ({
  id: 'eth0',
  hostname: 'bmc-host',
  macAddress: 'aa:bb:cc:dd:ee:ff',
  dhcpEnabled: false,
  useDomainNameEnabled: true,
  useDnsEnabled: true,
  useNtpEnabled: true,
  ipv6OperatingMode: 'Disabled',
  ipv6: [],
  staticNameServers: ['8.8.8.8'],
  staticIpv4Addresses: [
    {
      Address: '192.168.1.10',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
    },
  ],
  defaultGateway: '192.168.1.1',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// Network.vue
// ═══════════════════════════════════════════════════════════════════════════════

describe('Network.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkSettings.value = [];
    mockLldpEnabledState.value = [];
    mockIsLoading.value = false;
    mockIsTableBusy.value = false;
    mockSaveLLDPState.mockResolvedValue(undefined);
    mockUpdateIpv4Address.mockResolvedValue(undefined);
    mockUpdateIpv6Address.mockResolvedValue(undefined);
    mockUpdateIpv6StaticDefaultGatewayAddress.mockResolvedValue(undefined);
    mockSaveDnsAddress.mockResolvedValue(undefined);
    mockSaveHostname.mockResolvedValue(undefined);
  });

  const factory = async (overrides = {}) => {
    const wrapper = mount(NetworkComponent, {
      global: { stubs: commonStubs, mocks: globalMocks },
      ...overrides,
    });
    await flushPromises();
    return wrapper;
  };

  it('renders without errors', async () => {
    const wrapper = await factory();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders page title', async () => {
    const wrapper = await factory();
    expect(wrapper.find('.page-title').text()).toBe('appPageTitle.network');
  });

  it('renders NetworkGlobalSettings component', async () => {
    const wrapper = await factory();
    expect(wrapper.find('.network-global-settings').exists()).toBe(true);
  });

  it('renders one tab per network interface', async () => {
    mockNetworkSettings.value = [
      makeInterface({ id: 'eth0' }),
      makeInterface({ id: 'eth1' }),
    ];
    const wrapper = await factory();
    expect(wrapper.findAll('.b-tab')).toHaveLength(2);
  });

  it('calls refetchEthernet and refetchLldp on mount', async () => {
    await factory();
    expect(mockRefetchEthernet).toHaveBeenCalled();
    expect(mockRefetchLldp).toHaveBeenCalled();
  });

  it('calls setSelectedTabIndex(0) on mount', async () => {
    await factory();
    expect(mockSetSelectedTabIndex).toHaveBeenCalledWith(0);
  });

  it('shows IPv6 table only when interface has IPv6 addresses', async () => {
    mockNetworkSettings.value = [
      makeInterface({
        ipv6: [{ Address: '::1', PrefixLength: 128, AddressOrigin: 'Static' }],
      }),
    ];
    const wrapper = await factory();
    expect(wrapper.find('.table-ipv6').exists()).toBe(true);
  });

  it('hides IPv6 table when interface has no IPv6 addresses', async () => {
    mockNetworkSettings.value = [makeInterface({ ipv6: [] })];
    const wrapper = await factory();
    expect(wrapper.find('.table-ipv6').exists()).toBe(false);
  });

  it('shows LLDP checkbox reflecting lldpEnabled=true', async () => {
    mockNetworkSettings.value = [makeInterface()];
    mockLldpEnabledState.value = [{ lldpEnabled: true }];
    const wrapper = await factory();
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.element.checked).toBe(true);
  });

  it('shows LLDP checkbox reflecting lldpEnabled=false', async () => {
    mockNetworkSettings.value = [makeInterface()];
    mockLldpEnabledState.value = [{ lldpEnabled: false }];
    const wrapper = await factory();
    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(false);
  });

  it('calls saveLLDPState when LLDP checkbox is toggled', async () => {
    mockNetworkSettings.value = [makeInterface()];
    mockLldpEnabledState.value = [{ lldpEnabled: false }];
    const wrapper = await factory();
    await wrapper.find('input[type="checkbox"]').trigger('change');
    expect(mockSaveLLDPState).toHaveBeenCalled();
  });

  it('calls updateIpv4Address when ModalIpv4 emits ok', async () => {
    mockNetworkSettings.value = [makeInterface()];
    const wrapper = await factory();
    wrapper.findComponent({ name: 'ModalIpv4' }).vm.$emit('ok', {
      Address: '192.168.1.20',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
    });
    await flushPromises();
    expect(mockUpdateIpv4Address).toHaveBeenCalled();
  });

  it('calls updateIpv6Address when ModalIpv6 emits ok', async () => {
    mockNetworkSettings.value = [makeInterface()];
    const wrapper = await factory();
    wrapper
      .findComponent({ name: 'ModalIpv6' })
      .vm.$emit('ok', { Address: '::1', PrefixLength: 64 });
    await flushPromises();
    expect(mockUpdateIpv6Address).toHaveBeenCalled();
  });

  it('calls saveDnsAddress when ModalDns emits ok', async () => {
    const wrapper = await factory();
    wrapper.findComponent({ name: 'ModalDns' }).vm.$emit('ok', ['1.1.1.1']);
    await flushPromises();
    expect(mockSaveDnsAddress).toHaveBeenCalledWith(['1.1.1.1']);
  });

  it('calls saveHostname when ModalHostname emits ok', async () => {
    const wrapper = await factory();
    wrapper
      .findComponent({ name: 'ModalHostname' })
      .vm.$emit('ok', { HostName: 'new-host' });
    await flushPromises();
    expect(mockSaveHostname).toHaveBeenCalledWith({ HostName: 'new-host' });
  });

  it('populates ipAddress from edit-address event bus event', async () => {
    const wrapper = await factory();
    // Find the registered event bus callback
    const call = eventBus.on.mock.calls.find((c) => c[0] === 'edit-address');
    expect(call).toBeDefined();
    call[1]({
      Address: '192.168.1.5',
      SubnetMask: '255.255.255.0',
      PrefixLength: 64,
    });
    await flushPromises();
    // ModalIpv4 should receive the updated ipAddress prop
    expect(
      wrapper.findComponent({ name: 'ModalIpv4' }).props('ipAddress'),
    ).toBe('192.168.1.5');
  });

  it('passes tabIndex=0 to sub-components initially', async () => {
    mockNetworkSettings.value = [makeInterface()];
    const wrapper = await factory();
    expect(wrapper.findComponent({ name: 'TableIpv4' }).props('tabIndex')).toBe(
      0,
    );
    expect(wrapper.findComponent({ name: 'TableDns' }).props('tabIndex')).toBe(
      0,
    );
  });

  it('updates tabIndex and calls setSelectedTabIndex/setSelectedTabId on tab click', async () => {
    mockNetworkSettings.value = [
      makeInterface({ id: 'eth0' }),
      makeInterface({ id: 'eth1' }),
    ];
    const wrapper = await factory();
    const tabs = wrapper.findAll('.b-tab');
    await tabs[1].trigger('click');
    expect(mockSetSelectedTabIndex).toHaveBeenCalledWith(1);
    expect(mockSetSelectedTabId).toHaveBeenCalledWith('eth1');
  });

  it('passes defaultGateway from current interface to ModalIpv4', async () => {
    mockNetworkSettings.value = [makeInterface({ defaultGateway: '10.0.0.1' })];
    const wrapper = await factory();
    // Trigger networkSettings watcher by re-setting (the watcher fires on networkSettings change)
    // defaultGateway is populated via getModalInfo() called in the watcher
    mockNetworkSettings.value = [...mockNetworkSettings.value];
    await flushPromises();
    expect(
      wrapper.findComponent({ name: 'ModalIpv4' }).props('defaultGateway'),
    ).toBe('10.0.0.1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NetworkGlobalSettings.vue
// ═══════════════════════════════════════════════════════════════════════════════

describe('NetworkGlobalSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkSettings.value = [];
  });

  const factory = async () => {
    const wrapper = mount(NetworkGlobalSettingsComponent, {
      global: { stubs: commonStubs, mocks: globalMocks },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders without errors', async () => {
    expect((await factory()).exists()).toBe(true);
  });

  it('renders section with pageNetwork.networkSettings title', async () => {
    const wrapper = await factory();
    expect(wrapper.find('section').attributes('data-title')).toBe(
      'pageNetwork.networkSettings',
    );
  });

  it('displays hostname from first network interface', async () => {
    mockNetworkSettings.value = [makeInterface({ hostname: 'bmc-test-host' })];
    const wrapper = await factory();
    expect(wrapper.text()).toContain('bmc-test-host');
  });

  it('displays "--" when network settings are empty', async () => {
    mockNetworkSettings.value = [];
    const wrapper = await factory();
    expect(wrapper.text()).toContain('--');
  });

  it('shows edit button for hostname', async () => {
    const wrapper = await factory();
    expect(wrapper.find('.b-button').exists()).toBe(true);
  });

  it('emits modal-hostname event when edit button is clicked', async () => {
    const wrapper = await factory();
    await wrapper.find('.b-button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('modal-hostname');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NetworkInterfaceSettings.vue
// ═══════════════════════════════════════════════════════════════════════════════

describe('NetworkInterfaceSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkSettings.value = [makeInterface()];
    mockIsTableBusy.value = false;
    mockSaveDomainNameState.mockResolvedValue(undefined);
    mockSaveDnsState.mockResolvedValue(undefined);
    mockSaveNtpState.mockResolvedValue(undefined);
  });

  const factory = async (props = {}) => {
    const wrapper = mount(NetworkInterfaceSettingsComponent, {
      props: { tabIndex: 0, ...props },
      global: { stubs: commonStubs, mocks: globalMocks },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders without errors', async () => {
    expect((await factory()).exists()).toBe(true);
  });

  it('displays MAC address from current interface', async () => {
    mockNetworkSettings.value = [
      makeInterface({ macAddress: 'ff:ee:dd:cc:bb:aa' }),
    ];
    const wrapper = await factory();
    expect(wrapper.text()).toContain('ff:ee:dd:cc:bb:aa');
  });

  it('shows "--" for MAC address when network settings are empty', async () => {
    mockNetworkSettings.value = [];
    const wrapper = await factory();
    expect(wrapper.text()).toContain('--');
  });

  it('shows useDomainName checkbox checked when enabled', async () => {
    mockNetworkSettings.value = [
      makeInterface({ useDomainNameEnabled: true, dhcpEnabled: true }),
    ];
    const wrapper = await factory();
    expect(wrapper.findAll('input[type="checkbox"]')[0].element.checked).toBe(
      true,
    );
  });

  it('shows useDns checkbox checked when enabled', async () => {
    mockNetworkSettings.value = [
      makeInterface({ useDnsEnabled: true, dhcpEnabled: true }),
    ];
    const wrapper = await factory();
    expect(wrapper.findAll('input[type="checkbox"]')[1].element.checked).toBe(
      true,
    );
  });

  it('shows useNtp checkbox checked when enabled', async () => {
    mockNetworkSettings.value = [
      makeInterface({ useNtpEnabled: true, dhcpEnabled: true }),
    ];
    const wrapper = await factory();
    expect(wrapper.findAll('input[type="checkbox"]')[2].element.checked).toBe(
      true,
    );
  });

  it('disables all checkboxes when DHCP (v4 and v6) is disabled', async () => {
    mockNetworkSettings.value = [
      makeInterface({ dhcpEnabled: false, ipv6OperatingMode: 'Disabled' }),
    ];
    const wrapper = await factory();
    wrapper.findAll('input[type="checkbox"]').forEach((cb) => {
      expect(cb.attributes('disabled')).toBeDefined();
    });
  });

  it('enables checkboxes when IPv4 DHCP is enabled', async () => {
    mockNetworkSettings.value = [makeInterface({ dhcpEnabled: true })];
    const wrapper = await factory();
    wrapper.findAll('input[type="checkbox"]').forEach((cb) => {
      expect(cb.attributes('disabled')).toBeUndefined();
    });
  });

  it('enables checkboxes when IPv6 DHCP is enabled', async () => {
    mockNetworkSettings.value = [
      makeInterface({ dhcpEnabled: false, ipv6OperatingMode: 'Enabled' }),
    ];
    const wrapper = await factory();
    wrapper.findAll('input[type="checkbox"]').forEach((cb) => {
      expect(cb.attributes('disabled')).toBeUndefined();
    });
  });

  it('disables all checkboxes when isTableBusy is true', async () => {
    mockIsTableBusy.value = true;
    mockNetworkSettings.value = [makeInterface({ dhcpEnabled: true })];
    const wrapper = await factory();
    wrapper.findAll('input[type="checkbox"]').forEach((cb) => {
      expect(cb.attributes('disabled')).toBeDefined();
    });
  });

  it('calls saveDomainNameState when first checkbox is toggled', async () => {
    mockNetworkSettings.value = [makeInterface({ dhcpEnabled: true })];
    const wrapper = await factory();
    await wrapper.findAll('input[type="checkbox"]')[0].trigger('change');
    expect(mockSaveDomainNameState).toHaveBeenCalled();
  });

  it('calls saveDnsState when second checkbox is toggled', async () => {
    mockNetworkSettings.value = [makeInterface({ dhcpEnabled: true })];
    const wrapper = await factory();
    await wrapper.findAll('input[type="checkbox"]')[1].trigger('change');
    expect(mockSaveDnsState).toHaveBeenCalled();
  });

  it('calls saveNtpState when third checkbox is toggled', async () => {
    mockNetworkSettings.value = [makeInterface({ dhcpEnabled: true })];
    const wrapper = await factory();
    await wrapper.findAll('input[type="checkbox"]')[2].trigger('change');
    expect(mockSaveNtpState).toHaveBeenCalled();
  });

  it('updates macAddress when tabIndex prop changes', async () => {
    mockNetworkSettings.value = [
      makeInterface({ macAddress: 'aa:00:00:00:00:01' }),
      makeInterface({ id: 'eth1', macAddress: 'bb:00:00:00:00:02' }),
    ];
    const wrapper = await factory({ tabIndex: 0 });
    expect(wrapper.text()).toContain('aa:00:00:00:00:01');

    await wrapper.setProps({ tabIndex: 1 });
    await flushPromises();
    expect(wrapper.text()).toContain('bb:00:00:00:00:02');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TableDns.vue
// ═══════════════════════════════════════════════════════════════════════════════

describe('TableDns.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkSettings.value = [
      makeInterface({ staticNameServers: ['8.8.8.8', '1.1.1.1'] }),
    ];
    mockIsTableBusy.value = false;
    mockEditDnsAddress.mockResolvedValue(undefined);
  });

  const factory = async (props = {}) => {
    const wrapper = mount(TableDnsComponent, {
      props: { tabIndex: 0, ...props },
      global: {
        stubs: {
          ...commonStubs,
          // BTable stub that renders the cell(actions) scoped slot for each item
          BTable: {
            props: ['fields', 'items', 'busy'],
            setup(slotProps, { slots }) {
              return () => {
                const { h } = require('vue');
                const rows = (slotProps.items || []).map((item, idx) => {
                  // Invoke the cell(actions) scoped slot to get TableRowAction nodes
                  const actionCell = slots['cell(actions)']
                    ? slots['cell(actions)']({ item, index: idx })
                    : null;
                  return h('tr', { class: 'b-table-row' }, [
                    h('td', { class: 'cell-actions' }, actionCell),
                  ]);
                });
                return h('table', { class: 'b-table' }, [h('tbody', rows)]);
              };
            },
          },
        },
        mocks: globalMocks,
      },
    });
    await flushPromises();
    return wrapper;
  };

  it('renders without errors', async () => {
    expect((await factory()).exists()).toBe(true);
  });

  it('renders section title for static DNS', async () => {
    const wrapper = await factory();
    expect(wrapper.find('section').attributes('data-title')).toBe(
      'pageNetwork.staticDns',
    );
  });

  it('renders add DNS button', async () => {
    const wrapper = await factory();
    expect(wrapper.find('.b-button').exists()).toBe(true);
  });

  it('emits modal-dns event when add button is clicked', async () => {
    const wrapper = await factory();
    await wrapper.find('.b-button').trigger('click');
    expect(eventBus.emit).toHaveBeenCalledWith('modal-dns');
  });

  it('renders correct number of DNS row entries', async () => {
    mockNetworkSettings.value = [
      makeInterface({ staticNameServers: ['8.8.8.8', '1.1.1.1'] }),
    ];
    const wrapper = await factory();
    expect(wrapper.findAll('.b-table-row')).toHaveLength(2);
  });

  it('renders empty table when no DNS servers exist', async () => {
    mockNetworkSettings.value = [makeInterface({ staticNameServers: [] })];
    const wrapper = await factory();
    expect(wrapper.findAll('.b-table-row')).toHaveLength(0);
  });

  it('calls editDnsAddress with filtered list when first row is deleted', async () => {
    mockNetworkSettings.value = [
      makeInterface({ staticNameServers: ['8.8.8.8', '1.1.1.1'] }),
    ];
    const wrapper = await factory();
    // TableRowAction stub emits clickTableAction → onDnsTableAction → deleteDnsTableRow
    const actions = wrapper.findAll('.table-row-action');
    await actions[0].trigger('click');
    await flushPromises();
    expect(mockEditDnsAddress).toHaveBeenCalledWith(['1.1.1.1']);
  });

  it('calls editDnsAddress removing correct entry when second row is deleted', async () => {
    mockNetworkSettings.value = [
      makeInterface({ staticNameServers: ['8.8.8.8', '1.1.1.1'] }),
    ];
    const wrapper = await factory();
    const actions = wrapper.findAll('.table-row-action');
    await actions[1].trigger('click');
    await flushPromises();
    expect(mockEditDnsAddress).toHaveBeenCalledWith(['8.8.8.8']);
  });

  it('uses tabIndex prop to read correct interface DNS entries', async () => {
    mockNetworkSettings.value = [
      makeInterface({ staticNameServers: ['8.8.8.8'] }),
      makeInterface({ id: 'eth1', staticNameServers: ['9.9.9.9', '4.4.4.4'] }),
    ];
    const wrapper = await factory({ tabIndex: 1 });
    expect(wrapper.findAll('.b-table-row')).toHaveLength(2);
  });
});
