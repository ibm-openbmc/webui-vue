import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock dependencies
vi.mock('@/store/api', () => ({
  default: {
    patch: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishResource: vi.fn(),
}));

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

import { useRedfishResource } from '@/api/composables/useAllSubResources';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { usePolicies } from '@/api/composables/usePolicies';
import api from '@/store/api';

const makeMockRedfishResource = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  ...overrides,
});

const makeMockQueryClient = () => ({
  cancelQueries: vi.fn(),
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
});

describe('usePolicies', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = makeMockQueryClient();
    useQueryClient.mockReturnValue(mockQueryClient);

    // Default mock implementations for all queries
    useRedfishResource.mockImplementation((path) => {
      return makeMockRedfishResource();
    });

    // Default mock implementations for all mutations
    useMutation.mockImplementation(() => makeMockMutation());
  });

  describe('Network Protocol - SSH', () => {
    it('returns false for sshProtocolEnabled when data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { sshProtocolEnabled } = usePolicies();

      expect(sshProtocolEnabled.value).toBe(false);
    });

    it('returns correct sshProtocolEnabled value from NetworkProtocol data', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({
            data: ref({
              SSH: { ProtocolEnabled: true },
              IPMI: { ProtocolEnabled: false },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { sshProtocolEnabled } = usePolicies();

      expect(sshProtocolEnabled.value).toBe(true);
    });

    it('returns false when SSH property is missing', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({
            data: ref({ IPMI: { ProtocolEnabled: true } }),
          });
        }
        return makeMockRedfishResource();
      });

      const { sshProtocolEnabled } = usePolicies();

      expect(sshProtocolEnabled.value).toBe(false);
    });
  });

  describe('Network Protocol - IPMI', () => {
    it('returns false for ipmiProtocolEnabled when data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { ipmiProtocolEnabled } = usePolicies();

      expect(ipmiProtocolEnabled.value).toBe(false);
    });

    it('returns correct ipmiProtocolEnabled value from NetworkProtocol data', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({
            data: ref({
              SSH: { ProtocolEnabled: false },
              IPMI: { ProtocolEnabled: true },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { ipmiProtocolEnabled } = usePolicies();

      expect(ipmiProtocolEnabled.value).toBe(true);
    });
  });

  describe('BIOS Attributes', () => {
    it('returns false for rtadEnabled when BIOS data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { rtadEnabled } = usePolicies();

      expect(rtadEnabled.value).toBe(false);
    });

    it('returns true when pvm_rtad is Enabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: { pvm_rtad: 'Enabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { rtadEnabled } = usePolicies();

      expect(rtadEnabled.value).toBe(true);
    });

    it('returns false when pvm_rtad is Disabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: { pvm_rtad: 'Disabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { rtadEnabled } = usePolicies();

      expect(rtadEnabled.value).toBe(false);
    });

    it('returns true when pvm_vtpm is Enabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: { pvm_vtpm: 'Enabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { vtpmEnabled } = usePolicies();

      expect(vtpmEnabled.value).toBe(true);
    });

    it('returns true when hb_secure_ver_lockin_enabled is Enabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: { hb_secure_ver_lockin_enabled: 'Enabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { svleEnabled } = usePolicies();

      expect(svleEnabled.value).toBe(true);
    });

    it('returns true when hb_host_usb_enablement is Enabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: { hb_host_usb_enablement: 'Enabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { hostUsbEnabled } = usePolicies();

      expect(hostUsbEnabled.value).toBe(true);
    });
  });

  describe('TPM Policy', () => {
    it('returns false for tpmPolicyEnabled when system data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { tpmPolicyEnabled } = usePolicies();

      expect(tpmPolicyEnabled.value).toBe(false);
    });

    it('returns true when TrustedModuleRequiredToBoot is Required', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({
            data: ref({
              Boot: { TrustedModuleRequiredToBoot: 'Required' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { tpmPolicyEnabled } = usePolicies();

      expect(tpmPolicyEnabled.value).toBe(true);
    });

    it('returns false when TrustedModuleRequiredToBoot is not Required', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({
            data: ref({
              Boot: { TrustedModuleRequiredToBoot: 'Disabled' },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { tpmPolicyEnabled } = usePolicies();

      expect(tpmPolicyEnabled.value).toBe(false);
    });
  });

  describe('USB Firmware Update Policy', () => {
    it('returns false for usbFirmwareUpdatePolicyEnabled when manager data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { usbFirmwareUpdatePolicyEnabled } = usePolicies();

      expect(usbFirmwareUpdatePolicyEnabled.value).toBe(false);
    });

    it('returns correct value from USBCodeUpdateEnabled', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc') {
          return makeMockRedfishResource({
            data: ref({
              Oem: { IBM: { USBCodeUpdateEnabled: true } },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { usbFirmwareUpdatePolicyEnabled } = usePolicies();

      expect(usbFirmwareUpdatePolicyEnabled.value).toBe(true);
    });
  });

  describe('ACF Upload Enablement', () => {
    it('returns false for acfUploadEnablement when service account data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/AccountService/Accounts/service') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { acfUploadEnablement } = usePolicies();

      expect(acfUploadEnablement.value).toBe(false);
    });

    it('returns correct value from AllowUnauthACFUpload', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/AccountService/Accounts/service') {
          return makeMockRedfishResource({
            data: ref({
              Oem: { IBM: { ACF: { AllowUnauthACFUpload: true } } },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { acfUploadEnablement } = usePolicies();

      expect(acfUploadEnablement.value).toBe(true);
    });
  });

  describe('Basic Auth', () => {
    it('returns true for basicAuthEnabled when account service data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/AccountService') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { basicAuthEnabled } = usePolicies();

      expect(basicAuthEnabled.value).toBe(true);
    });

    it('returns correct value from BasicAuth', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/AccountService') {
          return makeMockRedfishResource({
            data: ref({
              Oem: { OpenBMC: { AuthMethods: { BasicAuth: false } } },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { basicAuthEnabled } = usePolicies();

      expect(basicAuthEnabled.value).toBe(false);
    });
  });

  describe('Send Service Alerts', () => {
    it('returns false for sendServiceAlertsEnabled when system data is null', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({ data: ref(null) });
        }
        return makeMockRedfishResource();
      });

      const { sendServiceAlertsEnabled } = usePolicies();

      expect(sendServiceAlertsEnabled.value).toBe(false);
    });

    it('returns correct value from SendServiceAlerts', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({
            data: ref({
              Oem: { IBM: { SendServiceAlerts: true } },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const { sendServiceAlertsEnabled } = usePolicies();

      expect(sendServiceAlertsEnabled.value).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('returns true when any query is loading', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({ isLoading: ref(true) });
        }
        return makeMockRedfishResource();
      });

      const { isLoading } = usePolicies();

      expect(isLoading.value).toBe(true);
    });

    it('returns false when all queries are not loading', () => {
      useRedfishResource.mockImplementation(() => {
        return makeMockRedfishResource({ isLoading: ref(false) });
      });

      const { isLoading } = usePolicies();

      expect(isLoading.value).toBe(false);
    });

    it('returns true when multiple queries are loading', () => {
      useRedfishResource.mockImplementation((path) => {
        if (
          path === '/redfish/v1/Managers/bmc/NetworkProtocol' ||
          path === '/redfish/v1/Systems/system/Bios'
        ) {
          return makeMockRedfishResource({ isLoading: ref(true) });
        }
        return makeMockRedfishResource({ isLoading: ref(false) });
      });

      const { isLoading } = usePolicies();

      expect(isLoading.value).toBe(true);
    });
  });

  describe('loadAllPolicies', () => {
    it('calls refetch on all queries', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({});
      useRedfishResource.mockImplementation(() => {
        return makeMockRedfishResource({ refetch: mockRefetch });
      });

      const { loadAllPolicies } = usePolicies();
      await loadAllPolicies();

      // Should be called 6 times (one for each query)
      expect(mockRefetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('Save Functions', () => {
    it('saveSshProtocolState calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('SSH')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveSshProtocolState } = usePolicies();
      await saveSshProtocolState(true);

      expect(mockMutateAsync).toHaveBeenCalledWith(true);
    });

    it('saveIpmiProtocolState calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('IPMI')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveIpmiProtocolState } = usePolicies();
      await saveIpmiProtocolState(false);

      expect(mockMutateAsync).toHaveBeenCalledWith(false);
    });

    it('saveTpmPolicy calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('TrustedModule')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveTpmPolicy } = usePolicies();
      await saveTpmPolicy(true);

      expect(mockMutateAsync).toHaveBeenCalledWith(true);
    });

    it('saveVtpmState calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('pvm_vtpm')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveVtpmState } = usePolicies();
      await saveVtpmState('Enabled');

      expect(mockMutateAsync).toHaveBeenCalledWith('Enabled');
    });

    it('saveRtadState calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('pvm_rtad')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveRtadState } = usePolicies();
      await saveRtadState('Disabled');

      expect(mockMutateAsync).toHaveBeenCalledWith('Disabled');
    });

    it('saveSvleState calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('hb_secure_ver_lockin')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveSvleState } = usePolicies();
      await saveSvleState('Enabled');

      expect(mockMutateAsync).toHaveBeenCalledWith('Enabled');
    });

    it('saveHostUsbEnabled calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('hb_host_usb_enablement')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveHostUsbEnabled } = usePolicies();
      await saveHostUsbEnabled('Enabled');

      expect(mockMutateAsync).toHaveBeenCalledWith('Enabled');
    });

    it('saveUsbFirmwareUpdatePolicyEnabled calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('USBCodeUpdateEnabled')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveUsbFirmwareUpdatePolicyEnabled } = usePolicies();
      await saveUsbFirmwareUpdatePolicyEnabled(true);

      expect(mockMutateAsync).toHaveBeenCalledWith(true);
    });

    it('saveUnauthenticatedACFUploadEnablement calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('AllowUnauthACFUpload')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveUnauthenticatedACFUploadEnablement } = usePolicies();
      await saveUnauthenticatedACFUploadEnablement(false);

      expect(mockMutateAsync).toHaveBeenCalledWith(false);
    });

    it('saveBasicAuthEnabled calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('BasicAuth')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveBasicAuthEnabled } = usePolicies();
      await saveBasicAuthEnabled(true);

      expect(mockMutateAsync).toHaveBeenCalledWith(true);
    });

    it('saveSendServiceAlertsEnabled calls mutation with correct parameter', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success');
      useMutation.mockImplementation((config) => {
        if (config.mutationFn.toString().includes('SendServiceAlerts')) {
          return makeMockMutation({ mutateAsync: mockMutateAsync });
        }
        return makeMockMutation();
      });

      const { saveSendServiceAlertsEnabled } = usePolicies();
      await saveSendServiceAlertsEnabled(true);

      expect(mockMutateAsync).toHaveBeenCalledWith(true);
    });
  });

  describe('Multiple Policies Integration', () => {
    it('handles multiple policies with different states correctly', () => {
      useRedfishResource.mockImplementation((path) => {
        if (path === '/redfish/v1/Managers/bmc/NetworkProtocol') {
          return makeMockRedfishResource({
            data: ref({
              SSH: { ProtocolEnabled: true },
              IPMI: { ProtocolEnabled: false },
            }),
          });
        }
        if (path === '/redfish/v1/Systems/system/Bios') {
          return makeMockRedfishResource({
            data: ref({
              Attributes: {
                pvm_rtad: 'Enabled',
                pvm_vtpm: 'Disabled',
                hb_secure_ver_lockin_enabled: 'Enabled',
                hb_host_usb_enablement: 'Disabled',
              },
            }),
          });
        }
        if (path === '/redfish/v1/Systems/system') {
          return makeMockRedfishResource({
            data: ref({
              Boot: { TrustedModuleRequiredToBoot: 'Required' },
              Oem: { IBM: { SendServiceAlerts: true } },
            }),
          });
        }
        return makeMockRedfishResource();
      });

      const {
        sshProtocolEnabled,
        ipmiProtocolEnabled,
        rtadEnabled,
        vtpmEnabled,
        svleEnabled,
        hostUsbEnabled,
        tpmPolicyEnabled,
        sendServiceAlertsEnabled,
      } = usePolicies();

      expect(sshProtocolEnabled.value).toBe(true);
      expect(ipmiProtocolEnabled.value).toBe(false);
      expect(rtadEnabled.value).toBe(true);
      expect(vtpmEnabled.value).toBe(false);
      expect(svleEnabled.value).toBe(true);
      expect(hostUsbEnabled.value).toBe(false);
      expect(tpmPolicyEnabled.value).toBe(true);
      expect(sendServiceAlertsEnabled.value).toBe(true);
    });
  });
});
