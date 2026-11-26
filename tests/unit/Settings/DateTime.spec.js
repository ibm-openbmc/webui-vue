import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// Mock getCurrentInstance before importing the component
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    getCurrentInstance: vi.fn(() => ({
      proxy: {
        $filters: {
          formatDate: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('en-US');
          },
          formatTime: (date) => {
            if (!date) return '';
            return new Date(date).toLocaleTimeString('en-US', {
              hour12: false,
            });
          },
        },
      },
    })),
  };
});

// Mock vue-router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
    onBeforeRouteLeave: vi.fn((callback) => {
      callback();
    }),
  };
});

// Mock @/store to avoid real pinia store instantiation
const mockGlobalStore = {
  bmcTimeGetter: null,
  serverStatusGetter: 'off',
  isUtcDisplayGetter: true,
  languagePreferenceGetter: 'en-US',
  getBmcTime: vi.fn().mockResolvedValue(undefined),
  getSystemInfo: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store', () => ({
  default: {
    GlobalStore: () => mockGlobalStore,
  },
}));

// UserManagementStore is imported directly in the component (not via stores index)
const mockUserManagementStore = {
  isGlobalMfaEnabledGetter: false,
  getAccountSettings: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store/modules/SecurityAndAccess/UserManagementStore', () => ({
  default: () => mockUserManagementStore,
}));

// Mock the useDateTime composable
const { mockUpdateDateTime } = vi.hoisted(() => ({
  mockUpdateDateTime: vi.fn(),
}));

vi.mock('@/api/composables/useDateTime', () => ({
  useDateTime: vi.fn(() => ({
    ntpServers: { value: ['ntp1.example.com', 'ntp2.example.com', ''] },
    isNtpProtocolEnabled: { value: false },
    networkSuppliedServers: { value: [] },
    isLoading: { value: false },
    isFetching: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn(),
    updateDateTime: mockUpdateDateTime,
    isUpdating: { value: false },
  })),
}));

// Mock composables
vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    startLoader: vi.fn(),
    hideLoader: vi.fn(),
    endLoader: vi.fn(),
  }),
}));

vi.mock('@/components/Composables/useLocalTimezoneLabelComposable', () => ({
  default: () => ({
    localOffset: vi.fn(() => 'UTC+5:30'),
  }),
}));

vi.mock('@/components/Composables/useVuelidateComposable', () => ({
  default: () => ({
    getValidationState: vi.fn((validation) => {
      if (!validation) return null;
      return validation.$error ? false : null;
    }),
  }),
}));

// Import DateTime component AFTER mocking
const DateTime = await import('@/views/Settings/DateTime/DateTime.vue').then(
  (m) => m.default,
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DateTime.vue', () => {
  let wrapper;
  let pinia;

  const mockBmcTime = new Date('2024-01-15T10:30:00Z');

  const createWrapper = (options = {}) => {
    return mount(DateTime, {
      global: {
        plugins: [
          pinia,
          [
            VueQueryPlugin,
            {
              queryClientConfig: {
                defaultOptions: {
                  queries: { retry: false },
                },
              },
            },
          ],
        ],
        mocks: {
          $t: (key) => key,
          $filters: {
            formatDate: (date) => {
              if (!date) return '';
              return new Date(date).toLocaleDateString('en-US');
            },
            formatTime: (date) => {
              if (!date) return '';
              return new Date(date).toLocaleTimeString('en-US', {
                hour12: false,
              });
            },
          },
        },
        stubs: {
          BContainer: { template: '<div><slot /></div>' },
          BRow: { template: '<div><slot /></div>' },
          BCol: { template: '<div><slot /></div>' },
          BForm: {
            template: '<form @submit="$attrs.onSubmit"><slot /></form>',
          },
          BFormGroup: { template: '<div><slot /></div>' },
          BFormInput: {
            template: '<input v-bind="$attrs" @blur="$attrs.onBlur" />',
            props: ['modelValue', 'state', 'disabled'],
          },
          BFormRadio: {
            template:
              '<input type="radio" v-bind="$attrs" @change="$emit(\'update:modelValue\', $attrs.value)" />',
            props: ['modelValue', 'value'],
          },
          BInputGroup: { template: '<div><slot /></div>' },
          BFormText: { template: '<small><slot /></small>' },
          BFormInvalidFeedback: {
            template: '<div role="alert"><slot /></div>',
          },
          BButton: {
            template:
              '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
            props: ['variant', 'type'],
            emits: ['click'],
          },
          BCollapse: { template: '<div><slot /></div>' },
          Alert: { template: '<div class="alert"><slot /></div>' },
          PageTitle: { template: '<h1><slot /></h1>' },
          PageSection: { template: '<section><slot /></section>' },
          InfoTooltip: { template: '<span class="info-tooltip"></span>' },
          IconChevron: { template: '<svg></svg>' },
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
        directives: {
          'b-toggle': {},
        },
      },
      ...options,
    });
  };

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);

    // Reset mock store state to defaults before each test
    mockGlobalStore.bmcTimeGetter = mockBmcTime;
    mockGlobalStore.serverStatusGetter = 'off';
    mockGlobalStore.isUtcDisplayGetter = true;
    mockGlobalStore.languagePreferenceGetter = 'en-US';
    mockGlobalStore.getBmcTime.mockResolvedValue(undefined);
    mockGlobalStore.getSystemInfo.mockResolvedValue(undefined);

    mockUserManagementStore.isGlobalMfaEnabledGetter = false;
    mockUserManagementStore.getAccountSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Component Rendering & Initialization', () => {
    it('should exist', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should render PageTitle component', () => {
      wrapper = createWrapper();
      expect(wrapper.find('h1').exists()).toBe(true);
    });

    it('should render PageSection components', () => {
      wrapper = createWrapper();
      const pageSections = wrapper.findAll('section');
      expect(pageSections.length).toBeGreaterThan(0);
    });

    it('should display current BMC date when bmcTime is available', async () => {
      mockGlobalStore.bmcTimeGetter = mockBmcTime;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).toContain('1/15/2024');
    });

    it('should display "--" when bmcTime is null', async () => {
      mockGlobalStore.bmcTimeGetter = null;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      const dateElements = wrapper.findAll('dd');
      expect(dateElements.some((el) => el.text() === '--')).toBe(true);
    });

    it('should display current BMC time when bmcTime is available', async () => {
      mockGlobalStore.bmcTimeGetter = mockBmcTime;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      const timeElements = wrapper.findAll('dd');
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
      expect(timeElements[1].text()).not.toBe('--');
    });

    it('should render correctly', async () => {
      mockGlobalStore.bmcTimeGetter = null;
      mockGlobalStore.serverStatusGetter = 'off';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      wrapper.element.querySelectorAll('[id]').forEach((el) => {
        if (el.id.startsWith('__BVID__')) {
          el.id = '';
        }
      });
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe('Alert Messages', () => {
    it('should display profile settings alert with router link', () => {
      wrapper = createWrapper();
      const alerts = wrapper.findAll('.alert');
      expect(alerts.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('pageDateTime.alert.message');
    });

    it('should display power-off warning alert when server is not off', async () => {
      mockGlobalStore.serverStatusGetter = 'on';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).toContain('pageDateTime.alert.messagePowerOff');
    });

    it('should NOT display power-off warning when server is off', async () => {
      mockGlobalStore.serverStatusGetter = 'off';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).not.toContain(
        'pageDateTime.alert.messagePowerOff',
      );
    });

    it('should display MFA alert when global MFA is enabled', async () => {
      mockUserManagementStore.isGlobalMfaEnabledGetter = true;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).toContain('pageDateTime.alert.mfaMessage');
    });

    it('should NOT display MFA alert when global MFA is disabled', async () => {
      mockUserManagementStore.isGlobalMfaEnabledGetter = false;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).not.toContain('pageDateTime.alert.mfaMessage');
    });

    it('should display NTP configuration info alert', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('pageDateTime.alert.messageNtp');
    });

    it('should display NTP warning alert when switching to NTP mode', async () => {
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();

      wrapper.vm.form.configurationSelected = 'manual';
      await nextTick();

      wrapper.vm.form.configurationSelected = 'ntp';
      await nextTick();

      expect(wrapper.text()).toContain('pageDateTime.alert.alertNtp');
    });

    it('should NOT display NTP warning alert in manual mode', async () => {
      wrapper = createWrapper();
      await nextTick();

      const manualRadio = wrapper.find(
        '[data-test-id="dateTime-radio-configureManual"]',
      );
      await manualRadio.trigger('change');
      await nextTick();

      expect(wrapper.text()).not.toContain('pageDateTime.alert.alertNtp');
    });
  });

  describe('Form Configuration - Manual Mode', () => {
    it('should select manual radio button when manual mode is chosen', async () => {
      wrapper = createWrapper();
      await nextTick();

      const manualRadio = wrapper.find(
        '[data-test-id="dateTime-radio-configureManual"]',
      );
      expect(manualRadio.exists()).toBe(true);
    });

    it('should enable manual date input when manual mode is selected', async () => {
      wrapper = createWrapper();
      await nextTick();

      const dateInput = wrapper.find(
        '[data-test-id="dateTime-input-manualDate"]',
      );
      expect(dateInput.attributes('disabled')).toBeUndefined();
    });

    it('should enable manual time input when manual mode is selected', async () => {
      wrapper = createWrapper();
      await nextTick();

      const timeInput = wrapper.find(
        '[data-test-id="dateTime-input-manualTime"]',
      );
      expect(timeInput.attributes('disabled')).toBeUndefined();
    });

    it('should display date format help text', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('global.calendar.dateFormat');
    });

    it('should display time format help text', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('HH:MM');
    });

    it('should show timezone label', async () => {
      wrapper = createWrapper();
      await nextTick();
      expect(wrapper.text()).toContain('pageDateTime.form.time.timezone');
    });
  });

  describe('Form Configuration - NTP Mode', () => {
    it('should render 3 NTP server input fields', () => {
      wrapper = createWrapper();

      const ntp1 = wrapper.find('[data-test-id="dateTime-input-ntpServer1"]');
      const ntp2 = wrapper.find('[data-test-id="dateTime-input-ntpServer2"]');
      const ntp3 = wrapper.find('[data-test-id="dateTime-input-ntpServer3"]');

      expect(ntp1.exists()).toBe(true);
      expect(ntp2.exists()).toBe(true);
      expect(ntp3.exists()).toBe(true);
    });

    it('should add an input box each time Add server is clicked', async () => {
      wrapper = createWrapper();
      await flushPromises();
      wrapper.vm.form.configurationSelected = 'ntp';
      await nextTick();

      const inputs = () =>
        wrapper.findAll('[data-test-id^="dateTime-input-ntpServer"]');
      expect(inputs()).toHaveLength(3);

      await wrapper
        .find('[data-test-id="dateTime-button-addNtpServer"]')
        .trigger('click');
      expect(inputs()).toHaveLength(4);
      expect(
        wrapper.find('[data-test-id="dateTime-input-ntpServer4"]').exists(),
      ).toBe(true);
    });

    it('should pad the saved servers with empty inputs up to 3', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.vm.form.ntp.servers).toEqual([
        'ntp1.example.com',
        'ntp2.example.com',
        '',
      ]);
    });
  });

  describe('Form Submission - Redfish payload', () => {
    beforeEach(() => {
      mockUpdateDateTime.mockReset();
      mockUpdateDateTime.mockResolvedValue('Success');
    });

    it('should send only non-empty NTP servers, including added ones', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'ntp';
      await wrapper
        .find('[data-test-id="dateTime-button-addNtpServer"]')
        .trigger('click');
      wrapper.vm.form.ntp.servers = [
        'ntp1.example.com',
        '',
        'ntp3.example.com',
        'ntp4.example.com',
      ];
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(mockUpdateDateTime).toHaveBeenCalledTimes(1);
      expect(mockUpdateDateTime).toHaveBeenCalledWith({
        ntpProtocolEnabled: true,
        ntpServersArray: [
          'ntp1.example.com',
          'ntp3.example.com',
          'ntp4.example.com',
        ],
      });
    });

    it('should not submit when a server is duplicated', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'ntp';
      wrapper.vm.form.ntp.servers = [
        'ntp1.example.com',
        'ntp2.example.com',
        'ntp1.example.com',
      ];
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(mockUpdateDateTime).not.toHaveBeenCalled();
    });

    it('should not submit in NTP mode when server 1 is empty', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'ntp';
      wrapper.vm.form.ntp.servers = ['', 'ntp2.example.com', ''];
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(mockUpdateDateTime).not.toHaveBeenCalled();
    });

    it('should drop empty extra inputs once the save completes', async () => {
      vi.useFakeTimers();
      try {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.form.configurationSelected = 'ntp';
        wrapper.vm.form.ntp.servers = [
          'ntp1.example.com',
          'ntp2.example.com',
          'ntp3.example.com',
          '',
        ];
        await nextTick();

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Progress bar still running: form stays as entered (4 inputs)
        expect(wrapper.vm.form.ntp.servers).toHaveLength(4);

        await vi.advanceTimersByTimeAsync(20000);
        await flushPromises();

        expect(wrapper.vm.form.ntp.servers).toEqual([
          'ntp1.example.com',
          'ntp2.example.com',
          'ntp3.example.com',
        ]);
        expect(
          wrapper.find('[data-test-id="dateTime-input-ntpServer4"]').exists(),
        ).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should pad back to 3 inputs after save when fewer than 3 servers remain', async () => {
      vi.useFakeTimers();
      try {
        wrapper = createWrapper();
        await flushPromises();

        wrapper.vm.form.configurationSelected = 'ntp';
        wrapper.vm.form.ntp.servers = ['ntp1.example.com', '', '', ''];
        await nextTick();

        await wrapper.find('form').trigger('submit');
        await flushPromises();
        await vi.advanceTimersByTimeAsync(20000);
        await flushPromises();

        expect(wrapper.vm.form.ntp.servers).toEqual([
          'ntp1.example.com',
          '',
          '',
        ]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('should keep the entered NTP servers in the form after a successful save', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'ntp';
      const entered = [
        'a.example.com',
        'b.example.com',
        'c.example.com',
        'd.example.com',
      ];
      wrapper.vm.form.ntp.servers = [...entered];
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(mockUpdateDateTime).toHaveBeenCalledTimes(1);
      expect(wrapper.vm.form.ntp.servers).toEqual(entered);
    });

    it('should revert the form to the fetched values when the save fails', async () => {
      mockUpdateDateTime.mockRejectedValue(new Error('save failed'));
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'ntp';
      wrapper.vm.form.ntp.servers = [
        'x.example.com',
        'y.example.com',
        'z.example.com',
        'w.example.com',
      ];
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(wrapper.vm.form.ntp.servers).toEqual([
        'ntp1.example.com',
        'ntp2.example.com',
        '',
      ]);
      expect(wrapper.vm.form.configurationSelected).toBe('manual');
    });

    it('should send manual date/time without NTP servers in manual mode', async () => {
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.form.configurationSelected = 'manual';
      wrapper.vm.form.manual.date = '2024-01-15';
      wrapper.vm.form.manual.time = '10:30';
      await nextTick();

      await wrapper.find('form').trigger('submit');
      await flushPromises();

      expect(mockUpdateDateTime).toHaveBeenCalledWith({
        ntpProtocolEnabled: false,
        updatedDateTime: '2024-01-15T10:30:00.000Z',
      });
    });
  });

  describe('Accessibility & Data Attributes', () => {
    it('should have proper aria-labels on form groups', () => {
      wrapper = createWrapper();

      const formGroup = wrapper.find(
        '[aria-label="configure-date-time-settings"]',
      );
      expect(formGroup.exists()).toBe(true);
    });

    it('should have data-test-id attributes on interactive elements', () => {
      wrapper = createWrapper();

      expect(
        wrapper
          .find('[data-test-id="dateTime-radio-configureManual"]')
          .exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-test-id="dateTime-radio-configureNTP"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-test-id="dateTime-input-manualDate"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-test-id="dateTime-input-manualTime"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-test-id="dateTime-input-ntpServer1"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-test-id="dateTime-button-saveSettings"]').exists(),
      ).toBe(true);
    });

    it('should have role="alert" on form validation feedback', () => {
      wrapper = createWrapper();

      const feedbacks = wrapper.findAllComponents({
        name: 'BFormInvalidFeedback',
      });
      feedbacks.forEach((feedback) => {
        expect(feedback.attributes('role')).toBe('alert');
      });
    });
  });
});
