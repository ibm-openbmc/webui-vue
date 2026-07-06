import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PowerRestorePolicy from '@/views/Settings/PowerRestorePolicy/PowerRestorePolicy.vue';

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();
const mockStartLoader = vi.fn();
const mockEndLoader = vi.fn();
const mockHideLoader = vi.fn();
const mockFetchBiosAttributes = vi.fn();
const mockSetPowerRestorePolicy = vi.fn();

const mockBootSettingsStore = {
  biosAttributes: {
    pvm_system_operating_mode: 'Normal',
  },
  fetchBiosAttributes: mockFetchBiosAttributes,
};

const mockPolicies = ref([
  { state: 'AlwaysOff', desc: 'Always off' },
  { state: 'AlwaysOn', desc: 'Always on' },
  { state: 'LastState', desc: 'Restore last state' },
]);
const mockCurrentPolicy = ref('AlwaysOn');
const mockIsLoading = ref(false);

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({
    successToast: mockSuccessToast,
    errorToast: mockErrorToast,
  }),
}));

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    startLoader: mockStartLoader,
    endLoader: mockEndLoader,
    hideLoader: mockHideLoader,
  }),
}));

vi.mock('@/store', () => ({
  default: {
    BootSettingsStore: () => mockBootSettingsStore,
  },
}));

vi.mock('@/api/composables/usePowerRestorePolicy', () => ({
  usePowerRestorePolicy: () => ({
    powerRestorePolicies: computed(() => mockPolicies.value),
    powerRestoreCurrentPolicy: computed(() => mockCurrentPolicy.value),
    isLoading: computed(() => mockIsLoading.value),
    setPowerRestorePolicy: mockSetPowerRestorePolicy,
  }),
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    onBeforeRouteLeave: vi.fn(),
    RouterLink: {
      name: 'RouterLink',
      props: ['to'],
      template: '<a :href="to"><slot /></a>',
    },
  };
});

const globalStubs = {
  PageTitle: {
    name: 'PageTitle',
    props: ['title', 'description'],
    template: '<div class="page-title">{{ title }} {{ description }}</div>',
  },
  Alert: {
    name: 'Alert',
    props: ['variant'],
    template: '<div class="alert"><slot /></div>',
  },
  BContainer: {
    template: '<div><slot /></div>',
  },
  BRow: {
    template: '<div><slot /></div>',
  },
  BCol: {
    template: '<div><slot /></div>',
  },
  BFormGroup: {
    props: ['label'],
    template: '<div><label>{{ label }}</label><slot /></div>',
  },
  BFormRadioGroup: {
    props: ['modelValue', 'options', 'disabled', 'name', 'stacked'],
    emits: ['update:modelValue'],
    template:
      '<div class="radio-group" :data-disabled="disabled">' +
      '<button v-for="option in options" :key="option.value" class="radio-option" type="button" @click="$emit(\'update:modelValue\', option.value)">{{ option.text }}</button>' +
      '</div>',
  },
  BButton: {
    props: ['disabled', 'variant', 'type'],
    emits: ['click'],
    template:
      '<button class="save-button" :disabled="disabled" :type="type" @click="$emit(\'click\')"><slot /></button>',
  },
};

const factory = async () => {
  const wrapper = mount(PowerRestorePolicy, {
    global: {
      stubs: globalStubs,
      mocks: {
        $t: (key) => key,
      },
    },
  });

  await flushPromises();
  return wrapper;
};

describe('PowerRestorePolicy.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBootSettingsStore.biosAttributes = {
      pvm_system_operating_mode: 'Normal',
    };
    mockPolicies.value = [
      { state: 'AlwaysOff', desc: 'Always off' },
      { state: 'AlwaysOn', desc: 'Always on' },
      { state: 'LastState', desc: 'Restore last state' },
    ];
    mockCurrentPolicy.value = 'AlwaysOn';
    mockIsLoading.value = false;
    mockFetchBiosAttributes.mockResolvedValue();
    mockSetPowerRestorePolicy.mockResolvedValue();
  });

  it('should exist', async () => {
    const wrapper = await factory();
    expect(wrapper.exists()).toBe(true);
  });

  it('should fetch bios attributes and toggle loader on mount', async () => {
    await factory();

    expect(mockStartLoader).toHaveBeenCalled();
    expect(mockFetchBiosAttributes).toHaveBeenCalledTimes(1);
    expect(mockEndLoader).toHaveBeenCalled();
  });

  it('should render radio options from available policies', async () => {
    const wrapper = await factory();

    const radioOptions = wrapper.findAll('.radio-option');
    expect(radioOptions).toHaveLength(3);
    expect(radioOptions[0].text()).toBe(
      'Always off - The system always remains powered off when power is applied.',
    );
    expect(radioOptions[1].text()).toBe(
      'Always on - The system always powers on when power is applied.',
    );
    expect(radioOptions[2].text()).toBe(
      'Last state - The system returns to its last on or off power state when power is applied.',
    );
  });

  it('should use current policy when no new selection is made and save successfully', async () => {
    const wrapper = await factory();

    await wrapper.find('.save-button').trigger('click');

    expect(mockSetPowerRestorePolicy).toHaveBeenCalledWith('AlwaysOn');
    expect(mockSuccessToast).toHaveBeenCalledWith(
      'Power restore policy updated successfully.',
    );
    expect(mockErrorToast).not.toHaveBeenCalled();
  });

  it('should save selected policy when user changes the radio selection', async () => {
    const wrapper = await factory();

    await wrapper.findAll('.radio-option')[0].trigger('click');
    await wrapper.find('.save-button').trigger('click');

    expect(mockSetPowerRestorePolicy).toHaveBeenCalledWith('AlwaysOff');
    expect(mockSuccessToast).toHaveBeenCalledWith(
      'Power restore policy updated successfully.',
    );
  });

  it('should show warning alert and disable controls when operating mode is manual', async () => {
    mockBootSettingsStore.biosAttributes = {
      pvm_system_operating_mode: 'Manual',
    };

    const wrapper = await factory();

    expect(wrapper.text()).toContain(
      'pagePowerRestorePolicy.alert.manualOperatingMode',
    );
    expect(wrapper.text()).toContain(
      'pagePowerRestorePolicy.alert.changeServerOpMode',
    );
    expect(wrapper.find('.radio-group').attributes('data-disabled')).toBe(
      'true',
    );
    expect(wrapper.find('.save-button').attributes('disabled')).toBeDefined();
  });

  it('should disable controls when operating mode is unavailable', async () => {
    mockBootSettingsStore.biosAttributes = {};

    const wrapper = await factory();

    expect(wrapper.find('.radio-group').attributes('data-disabled')).toBe(
      'true',
    );
    expect(wrapper.find('.save-button').attributes('disabled')).toBeDefined();
  });

  it('should reset selection and show error toast when save fails', async () => {
    mockSetPowerRestorePolicy.mockRejectedValue(new Error('Save failed'));
    const wrapper = await factory();

    await wrapper.findAll('.radio-option')[0].trigger('click');
    await wrapper.find('.save-button').trigger('click');
    await flushPromises();

    expect(mockErrorToast).toHaveBeenCalledWith('Save failed');
    expect(mockSuccessToast).not.toHaveBeenCalled();

    await wrapper.find('.save-button').trigger('click');

    expect(mockSetPowerRestorePolicy).toHaveBeenLastCalledWith('AlwaysOn');
  });

  it('should react to loading state changes', async () => {
    await factory();

    mockIsLoading.value = true;
    await flushPromises();
    expect(mockStartLoader).toHaveBeenCalled();

    mockIsLoading.value = false;
    await flushPromises();
    expect(mockEndLoader).toHaveBeenCalled();
  });
});

// Made with Bob
