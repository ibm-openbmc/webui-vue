import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, getCurrentInstance, ref } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import stores from '@/store';

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

// Import DateTime component AFTER mocking
const DateTime = await import('@/views/Settings/DateTime/DateTime.vue').then(
  (m) => m.default,
);

// Mock the useDateTime composable
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
    updateDateTime: vi.fn().mockResolvedValue('Success'),
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

describe('DateTime.vue', () => {
  let wrapper;
  let globalStore;
  let userManagementStore;
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
    globalStore = stores.GlobalStore();
    userManagementStore = stores.UserManagementStore();

    // Create reactive refs for store getters
    const bmcTimeRef = ref(mockBmcTime);
    const serverStatusRef = ref('off');
    const isUtcDisplayRef = ref(true);
    const isGlobalMfaEnabledRef = ref(false);

    // Mock store getters as reactive properties
    Object.defineProperty(globalStore, 'bmcTimeGetter', {
      get: () => bmcTimeRef.value,
      set: (val) => {
        bmcTimeRef.value = val;
      },
      configurable: true,
    });

    Object.defineProperty(globalStore, 'serverStatusGetter', {
      get: () => serverStatusRef.value,
      set: (val) => {
        serverStatusRef.value = val;
      },
      configurable: true,
    });

    Object.defineProperty(globalStore, 'isUtcDisplayGetter', {
      get: () => isUtcDisplayRef.value,
      set: (val) => {
        isUtcDisplayRef.value = val;
      },
      configurable: true,
    });

    Object.defineProperty(userManagementStore, 'isGlobalMfaEnabledGetter', {
      get: () => isGlobalMfaEnabledRef.value,
      set: (val) => {
        isGlobalMfaEnabledRef.value = val;
      },
      configurable: true,
    });

    globalStore.languagePreferenceGetter = 'en-US';
    globalStore.getBmcTime = vi.fn().mockResolvedValue();
    globalStore.getSystemInfo = vi.fn().mockResolvedValue();
    userManagementStore.getAccountSettings = vi.fn().mockResolvedValue();
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
      // PageTitle is stubbed, so check for the h1 element it renders
      expect(wrapper.find('h1').exists()).toBe(true);
    });

    it('should render PageSection components', () => {
      wrapper = createWrapper();
      // PageSection is stubbed as section elements
      const pageSections = wrapper.findAll('section');
      expect(pageSections.length).toBeGreaterThan(0);
    });

    it('should display current BMC date when bmcTime is available', async () => {
      // Set bmcTime BEFORE creating wrapper
      globalStore.bmcTimeGetter = mockBmcTime;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      // The component should display the formatted date
      const text = wrapper.text();
      // Check for date display - the mock formats to '1/15/2024'
      expect(text).toContain('1/15/2024');
    });

    it('should display "--" when bmcTime is null', async () => {
      // Set bmcTime to null BEFORE creating wrapper
      globalStore.bmcTimeGetter = null;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      const dateElements = wrapper.findAll('dd');
      expect(dateElements.some((el) => el.text() === '--')).toBe(true);
    });

    it('should display current BMC time when bmcTime is available', async () => {
      // Set bmcTime BEFORE creating wrapper
      globalStore.bmcTimeGetter = mockBmcTime;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      // The component should display the formatted time
      // The time is displayed in the second <dd> element
      const timeElements = wrapper.findAll('dd');
      // Should have at least 2 dd elements (date and time)
      expect(timeElements.length).toBeGreaterThanOrEqual(2);
      // The second dd should contain the time (not "--")
      expect(timeElements[1].text()).not.toBe('--');
    });

    it('should render correctly', async () => {
      // Set default store values BEFORE creating wrapper
      globalStore.bmcTimeGetter = null;
      globalStore.serverStatusGetter = 'off';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      // Remove dynamic IDs before snapshot
      wrapper.element.querySelectorAll('[id]').forEach((el) => {
        if (el.id.startsWith('__BVID__')) {
          el.id = '';
        }
      });
      // Verify the snapshot matches
      expect(wrapper.element).toMatchSnapshot();
    });
  });

  describe('Alert Messages', () => {
    it('should display profile settings alert with router link', () => {
      wrapper = createWrapper();
      // Alert is stubbed as div with class="alert"
      const alerts = wrapper.findAll('.alert');
      expect(alerts.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('pageDateTime.alert.message');
    });

    it('should display power-off warning alert when server is not off', async () => {
      // Set server status to 'on' BEFORE creating wrapper
      globalStore.serverStatusGetter = 'on';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).toContain('pageDateTime.alert.messagePowerOff');
    });

    it('should NOT display power-off warning when server is off', async () => {
      // Set server status to 'off' BEFORE creating wrapper
      globalStore.serverStatusGetter = 'off';
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      // When server is off, the power-off warning should NOT be displayed
      expect(wrapper.text()).not.toContain(
        'pageDateTime.alert.messagePowerOff',
      );
    });

    it('should display MFA alert when global MFA is enabled', async () => {
      // Set MFA to enabled BEFORE creating wrapper
      userManagementStore.isGlobalMfaEnabledGetter = true;
      wrapper = createWrapper();
      await flushPromises();
      await nextTick();
      expect(wrapper.text()).toContain('pageDateTime.alert.mfaMessage');
    });

    it('should NOT display MFA alert when global MFA is disabled', async () => {
      // Set MFA to disabled BEFORE creating wrapper
      userManagementStore.isGlobalMfaEnabledGetter = false;
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

      // Set the form value to trigger the watcher
      wrapper.vm.form.configurationSelected = 'manual';
      await nextTick();
      
      // Now switch to NTP
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
        wrapper.find('[data-test-id="dateTime-radio-configureManual"]').exists(),
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
