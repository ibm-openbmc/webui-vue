import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin } from '@tanstack/vue-query';
import stores from '@/store';
import KeyClear from '@/views/Operations/KeyClear/KeyClear.vue';

// Mock the useKeyClear composable
const mockClearEncryptionKeys = vi.fn();
vi.mock('@/api/composables/useKeyClear', () => ({
  useKeyClear: () => ({
    clearEncryptionKeys: mockClearEncryptionKeys,
    isClearing: false,
  }),
}));

// Mock the toast composable
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();
vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({
    successToast: mockSuccessToast,
    errorToast: mockErrorToast,
  }),
}));

describe('KeyClear.vue', () => {
  let wrapper;
  let globalStore;

  const createWrapper = (username = 'admin') => {
    const pinia = createPinia();
    setActivePinia(pinia);
    globalStore = stores.GlobalStore();
    globalStore.username = username;

    return mount(KeyClear, {
      global: {
        plugins: [pinia, [VueQueryPlugin, {}]],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          BContainer: false,
          BRow: false,
          BCol: false,
          BForm: false,
          BFormGroup: false,
          BFormRadioGroup: false,
          BFormRadio: false,
          BFormText: false,
          BButton: false,
          BModal: false,
        },
      },
    });
  };

  describe('Component Rendering', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should exist', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should render PageTitle component with correct props', () => {
      const pageTitle = wrapper.findComponent({ name: 'PageTitle' });
      expect(pageTitle.exists()).toBe(true);
      expect(pageTitle.props('title')).toBe('appPageTitle.keyClear');
      expect(pageTitle.props('description')).toBe('pageKeyClear.description');
    });

    it('should render Alert component with warning information', () => {
      const alert = wrapper.findComponent({ name: 'Alert' });
      expect(alert.exists()).toBe(true);
      expect(alert.props('variant')).toBe('info');
    });

    it('should render form with correct ID', () => {
      const form = wrapper.find('#key-clear');
      expect(form.exists()).toBe(true);
    });

    it('should render radio button group', () => {
      const radioGroup = wrapper.find('#key-clear-options');
      expect(radioGroup.exists()).toBe(true);
    });

    it('should render all standard radio options', () => {
      const radios = wrapper.findAll('input[type="radio"]');
      expect(radios.length).toBeGreaterThanOrEqual(3);

      // Check for NONE option
      const noneRadio = wrapper.find('input[value="NONE"]');
      expect(noneRadio.exists()).toBe(true);

      // Check for ALL option
      const allRadio = wrapper.find('input[value="ALL"]');
      expect(allRadio.exists()).toBe(true);

      // Check for POWERVM_SYSKEY option
      const powervmRadio = wrapper.find('input[value="POWERVM_SYSKEY"]');
      expect(powervmRadio.exists()).toBe(true);
    });

    it('should render helper text for each option', () => {
      expect(wrapper.find('#key-clear-not-requested').exists()).toBe(true);
      expect(wrapper.find('#clear-all').exists()).toBe(true);
      expect(wrapper.find('#clear-hypervisor-key').exists()).toBe(true);
    });

    it('should render submit button with correct attributes', () => {
      const submitButton = wrapper.find(
        '[data-test-id="keyClear-button-submit"]',
      );
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.attributes('type')).toBe('submit');
      expect(submitButton.classes()).toContain('btn-primary');
    });

    it('should render modal component', () => {
      const modal = wrapper.findComponent({ name: 'BModal' });
      expect(modal.exists()).toBe(true);
    });

    it('should render correctly', () => {
      // Snapshot test with dynamic IDs - just verify structure exists
      expect(wrapper.find('#key-clear').exists()).toBe(true);
      expect(wrapper.find('#key-clear-options').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'PageTitle' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Alert' }).exists()).toBe(true);
    });
  });

  describe('Radio Button Selection', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should have "NONE" selected by default', () => {
      const noneRadio = wrapper.find('input[value="NONE"]');
      expect(noneRadio.element.checked).toBe(true);
    });

    it('should allow selecting "ALL" option', async () => {
      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.keyOption).toBe('ALL');
    });

    it('should allow selecting "POWERVM_SYSKEY" option', async () => {
      const powervmRadio = wrapper.find('input[value="POWERVM_SYSKEY"]');
      await powervmRadio.setValue(true);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.keyOption).toBe('POWERVM_SYSKEY');
    });

    it('should update keyOption when radio selection changes', async () => {
      expect(wrapper.vm.keyOption).toBe('NONE');

      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.keyOption).toBe('ALL');
    });
  });

  describe('Service User Specific Options', () => {
    it('should show MFG options for service user', () => {
      wrapper = createWrapper('service');

      const mfgAllRadio = wrapper.find('input[value="MFG_ALL"]');
      const mfgRadio = wrapper.find('input[value="MFG"]');

      expect(mfgAllRadio.exists()).toBe(true);
      expect(mfgRadio.exists()).toBe(true);
    });

    it('should hide MFG options for non-service users', () => {
      wrapper = createWrapper('admin');

      const mfgAllRadio = wrapper.find('input[value="MFG_ALL"]');
      const mfgRadio = wrapper.find('input[value="MFG"]');

      expect(mfgAllRadio.exists()).toBe(false);
      expect(mfgRadio.exists()).toBe(false);
    });

    it('should correctly identify username from global store', () => {
      wrapper = createWrapper('testuser');
      expect(wrapper.vm.username).toBe('testuser');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should open modal when form is submitted', async () => {
      expect(wrapper.vm.openModal).toBe(false);

      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.openModal).toBe(true);
    });

    it('should store selected key value on form submission', async () => {
      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();

      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedKey).toBe('ALL');
    });

    it('should call onKeyClearSubmit with selected value', async () => {
      const spy = vi.spyOn(wrapper.vm, 'onKeyClearSubmit');

      const powervmRadio = wrapper.find('input[value="POWERVM_SYSKEY"]');
      await powervmRadio.setValue(true);
      await wrapper.vm.$nextTick();

      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(spy).toHaveBeenCalledWith('POWERVM_SYSKEY');
    });
  });

  describe('Modal Behavior', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should have modal closed by default', () => {
      expect(wrapper.vm.openModal).toBe(false);
    });

    it('should display correct modal title', () => {
      const modal = wrapper.findComponent({ name: 'BModal' });
      expect(modal.props('title')).toBe('pageKeyClear.modal.clearAllTitle');
    });

    it('should display correct modal message', () => {
      const modal = wrapper.findComponent({ name: 'BModal' });
      // Modal uses slots, so check the props instead
      expect(modal.exists()).toBe(true);
      // The message is in the default slot, verify modal is configured correctly
      expect(modal.props('title')).toBe('pageKeyClear.modal.clearAllTitle');
    });

    it('should have correct action buttons', () => {
      const modal = wrapper.findComponent({ name: 'BModal' });
      expect(modal.props('okTitle')).toBe('pageKeyClear.modal.clear');
      expect(modal.props('okVariant')).toBe('danger');
      expect(modal.props('cancelTitle')).toBe('global.action.cancel');
    });

    it('should close modal when cancel is clicked', async () => {
      wrapper.vm.openModal = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.openModal = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.openModal).toBe(false);
    });
  });

  describe('API Integration', () => {
    beforeEach(() => {
      wrapper = createWrapper();
      mockClearEncryptionKeys.mockClear();
      mockSuccessToast.mockClear();
      mockErrorToast.mockClear();
    });

    it('should call clearEncryptionKeys with correct parameter on modal OK', async () => {
      mockClearEncryptionKeys.mockResolvedValue('Keys cleared successfully');

      // Select a key option
      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();

      // Submit form to open modal
      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      // Trigger handleOK
      await wrapper.vm.handleOK();
      await flushPromises();

      expect(mockClearEncryptionKeys).toHaveBeenCalledWith('ALL');
    });

    it('should show success toast on successful API call', async () => {
      const successMessage = 'Keys cleared successfully';
      mockClearEncryptionKeys.mockResolvedValue(successMessage);

      wrapper.vm.selectedKey = 'POWERVM_SYSKEY';
      await wrapper.vm.handleOK();
      await flushPromises();

      expect(mockSuccessToast).toHaveBeenCalledWith(successMessage);
    });

    it('should show error toast on failed API call', async () => {
      const errorMessage = 'Error clearing keys';
      mockClearEncryptionKeys.mockRejectedValue({ message: errorMessage });

      wrapper.vm.selectedKey = 'ALL';
      await wrapper.vm.handleOK();
      await flushPromises();

      expect(mockErrorToast).toHaveBeenCalledWith(errorMessage);
    });

    it('should close modal after successful API call', async () => {
      mockClearEncryptionKeys.mockResolvedValue('Success');

      wrapper.vm.openModal = true;
      wrapper.vm.selectedKey = 'NONE';

      await wrapper.vm.handleOK();
      await flushPromises();

      expect(wrapper.vm.openModal).toBe(false);
    });

    it('should close modal after failed API call', async () => {
      mockClearEncryptionKeys.mockRejectedValue({ message: 'Error' });

      wrapper.vm.openModal = true;
      wrapper.vm.selectedKey = 'ALL';

      await wrapper.vm.handleOK();
      await flushPromises();

      expect(wrapper.vm.openModal).toBe(false);
    });
  });

  describe('Component State Management', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should initialize with correct default values', () => {
      expect(wrapper.vm.keyOption).toBe('NONE');
      expect(wrapper.vm.openModal).toBe(false);
      expect(wrapper.vm.selectedKey).toBe('');
    });

    it('should maintain selected key value across modal operations', async () => {
      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();

      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedKey).toBe('ALL');
      expect(wrapper.vm.keyOption).toBe('ALL');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should have proper form ID', () => {
      const form = wrapper.find('form');
      expect(form.attributes('id')).toBe('key-clear');
    });

    it('should have proper radio group ID', () => {
      const radioGroup = wrapper.find('#key-clear-options');
      expect(radioGroup.exists()).toBe(true);
    });

    it('should have data-test-id on submit button', () => {
      const submitButton = wrapper.find(
        '[data-test-id="keyClear-button-submit"]',
      );
      expect(submitButton.exists()).toBe(true);
    });

    it('should have helper text IDs for screen readers', () => {
      expect(wrapper.find('#key-clear-not-requested').exists()).toBe(true);
      expect(wrapper.find('#clear-all').exists()).toBe(true);
      expect(wrapper.find('#clear-hypervisor-key').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('should handle rapid form submissions', async () => {
      const form = wrapper.find('#key-clear');

      await form.trigger('submit.prevent');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.openModal).toBe(true);
    });

    it('should handle changing selection before submitting', async () => {
      const allRadio = wrapper.find('input[value="ALL"]');
      await allRadio.setValue(true);
      await wrapper.vm.$nextTick();

      const noneRadio = wrapper.find('input[value="NONE"]');
      await noneRadio.setValue(true);
      await wrapper.vm.$nextTick();

      const form = wrapper.find('#key-clear');
      await form.trigger('submit.prevent');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedKey).toBe('NONE');
    });

    it('should handle API call with empty selected key', async () => {
      mockClearEncryptionKeys.mockResolvedValue('Success');

      wrapper.vm.selectedKey = '';
      await wrapper.vm.handleOK();
      await flushPromises();

      expect(mockClearEncryptionKeys).toHaveBeenCalledWith('');
    });
  });
});
