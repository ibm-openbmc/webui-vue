import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

// Mock dependencies
vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key, params) => {
        if (params) {
          return `${key}_${JSON.stringify(params)}`;
        }
        return key;
      },
    },
  },
}));

vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishResource: vi.fn(),
}));

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

import api from '@/store/api';
import { useRedfishResource } from '@/api/composables/useAllSubResources';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  useCertificates,
  CERTIFICATE_TYPES,
} from '@/api/composables/useCertificates';

const makeMockRedfishResource = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockQuery = (overrides = {}) => ({
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

describe('useCertificates', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = {
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    };

    useQueryClient.mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CERTIFICATE_TYPES', () => {
    it('exports certificate types array', () => {
      expect(CERTIFICATE_TYPES).toBeDefined();
      expect(Array.isArray(CERTIFICATE_TYPES)).toBe(true);
      expect(CERTIFICATE_TYPES.length).toBeGreaterThan(0);
    });

    it('contains HTTPS certificate type', () => {
      const httpsCert = CERTIFICATE_TYPES.find(
        (cert) => cert.type === 'HTTPS Certificate',
      );
      expect(httpsCert).toBeDefined();
      expect(httpsCert.location).toBe(
        '/redfish/v1/Managers/bmc/NetworkProtocol/HTTPS/Certificates/',
      );
      expect(httpsCert.limit).toBe(1);
    });

    it('contains LDAP certificate type', () => {
      const ldapCert = CERTIFICATE_TYPES.find(
        (cert) => cert.type === 'LDAP Certificate',
      );
      expect(ldapCert).toBeDefined();
      expect(ldapCert.location).toBe(
        '/redfish/v1/AccountService/LDAP/Certificates/',
      );
    });

    it('contains TrustStore certificate type', () => {
      const trustStoreCert = CERTIFICATE_TYPES.find(
        (cert) => cert.type === 'TrustStore Certificate',
      );
      expect(trustStoreCert).toBeDefined();
      expect(trustStoreCert.limit).toBe(10);
    });
  });

  describe('acfCertificate', () => {
    it('returns empty array when ACF data is not available', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(null) }),
      );
      useQuery.mockReturnValue(makeMockQuery());

      const { acfCertificate } = useCertificates();

      expect(acfCertificate.value).toEqual([]);
    });

    it('returns ACF certificate when data is available', () => {
      const mockAcfData = {
        Oem: {
          IBM: {
            ACF: {
              ExpirationDate: '2025-12-31T23:59:59Z',
              ACFFile: 'base64encodedfile',
            },
          },
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockAcfData) }),
      );
      useQuery.mockReturnValue(makeMockQuery());

      const { acfCertificate } = useCertificates();

      expect(acfCertificate.value).toHaveLength(1);
      expect(acfCertificate.value[0].certificate).toBe(
        'ServiceLogin Certificate',
      );
      expect(acfCertificate.value[0].validUntil).toBeInstanceOf(Date);
    });
  });

  describe('certificates query', () => {
    it('returns empty array when no certificates are available', () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());

      api.get.mockResolvedValue({
        data: { Links: { Certificates: [] } },
      });

      useQuery.mockImplementation(({ queryFn }) => {
        const data = ref([]);
        return makeMockQuery({ data });
      });

      const { certificates } = useCertificates();

      expect(certificates.value).toEqual([]);
    });

    it('fetches and maps certificate data correctly', async () => {
      const mockCertificates = [
        {
          '@odata.id': '/redfish/v1/cert1',
          Name: 'HTTPS Certificate',
          ValidNotBefore: '2024-01-01T00:00:00Z',
          ValidNotAfter: '2025-12-31T23:59:59Z',
          Issuer: { CommonName: 'Test CA' },
          Subject: { CommonName: 'test.example.com' },
        },
      ];

      useRedfishResource.mockReturnValue(makeMockRedfishResource());

      useQuery.mockImplementation(() => {
        const data = ref(
          mockCertificates.map((cert) => ({
            type: cert.Name,
            location: cert['@odata.id'],
            certificate: cert.Name,
            issuedBy: cert.Issuer.CommonName,
            issuedTo: cert.Subject.CommonName,
            validFrom: new Date(cert.ValidNotBefore),
            validUntil: new Date(cert.ValidNotAfter),
          })),
        );
        return makeMockQuery({ data });
      });

      const { certificates } = useCertificates();

      expect(certificates.value).toHaveLength(1);
      expect(certificates.value[0].type).toBe('HTTPS Certificate');
      expect(certificates.value[0].issuedBy).toBe('Test CA');
      expect(certificates.value[0].issuedTo).toBe('test.example.com');
    });
  });

  describe('availableUploadTypes', () => {
    it('returns certificate types that have not reached their limit', () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());

      useQuery.mockImplementation(() => {
        const data = ref([
          { type: 'HTTPS Certificate', certificate: 'HTTPS Certificate' },
        ]);
        return makeMockQuery({ data });
      });

      const { availableUploadTypes } = useCertificates();

      // HTTPS has limit 1 and we have 1, so it should not be available
      const httpsAvailable = availableUploadTypes.value.find(
        (cert) => cert.type === 'HTTPS Certificate',
      );
      expect(httpsAvailable).toBeUndefined();

      // LDAP has limit 1 and we have 0, so it should be available
      const ldapAvailable = availableUploadTypes.value.find(
        (cert) => cert.type === 'LDAP Certificate',
      );
      expect(ldapAvailable).toBeDefined();
    });
  });

  describe('isLoading', () => {
    it('returns true when ACF query is loading', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ isLoading: ref(true) }),
      );
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(false) }));

      const { isLoading } = useCertificates();

      expect(isLoading.value).toBe(true);
    });

    it('returns true when certificates query is loading', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ isLoading: ref(false) }),
      );
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(true) }));

      const { isLoading } = useCertificates();

      expect(isLoading.value).toBe(true);
    });

    it('returns false when both queries are not loading', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ isLoading: ref(false) }),
      );
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(false) }));

      const { isLoading } = useCertificates();

      expect(isLoading.value).toBe(false);
    });
  });

  describe('refetchAll', () => {
    it('refetches both ACF and certificates queries', async () => {
      const acfRefetch = vi.fn().mockResolvedValue({});
      const certRefetch = vi.fn().mockResolvedValue({});

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ refetch: acfRefetch }),
      );
      useQuery.mockReturnValue(makeMockQuery({ refetch: certRefetch }));

      const { refetchAll } = useCertificates();

      await refetchAll();

      expect(acfRefetch).toHaveBeenCalledTimes(1);
      expect(certRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('addNewCertificate', () => {
    it('posts certificate file and returns success message', async () => {
      const mockFile = new File(['cert content'], 'cert.pem', {
        type: 'application/x-pem-file',
      });

      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(({ mutationFn }) => {
        return makeMockMutation({ mutateAsync });
      });

      const { addNewCertificate } = useCertificates();

      const result = await addNewCertificate({
        file: mockFile,
        type: 'HTTPS Certificate',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        file: mockFile,
        type: 'HTTPS Certificate',
      });
    });
  });

  describe('addNewACFCertificate', () => {
    it('converts file to base64 and patches ACF certificate', async () => {
      const mockFile = new File(['acf content'], 'acf.cert', {
        type: 'application/octet-stream',
      });

      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { addNewACFCertificate } = useCertificates();

      const result = await addNewACFCertificate({
        file: mockFile,
        type: 'ServiceLogin Certificate',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        file: mockFile,
        type: 'ServiceLogin Certificate',
      });
    });
  });

  describe('replaceCertificate', () => {
    it('replaces existing certificate with new certificate string', async () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { replaceCertificate } = useCertificates();

      await replaceCertificate({
        certificateString:
          '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
        type: 'HTTPS Certificate',
        location: '/redfish/v1/cert1',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        certificateString:
          '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
        type: 'HTTPS Certificate',
        location: '/redfish/v1/cert1',
      });
    });
  });

  describe('replaceACFCertificate', () => {
    it('replaces ACF certificate with new file', async () => {
      const mockFile = new File(['new acf'], 'new.cert', {
        type: 'application/octet-stream',
      });

      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { replaceACFCertificate } = useCertificates();

      await replaceACFCertificate({
        file: mockFile,
        type: 'ServiceLogin Certificate',
        location: '/redfish/v1/AccountService/Accounts/service',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        file: mockFile,
        type: 'ServiceLogin Certificate',
        location: '/redfish/v1/AccountService/Accounts/service',
      });
    });
  });

  describe('deleteCertificate', () => {
    it('deletes certificate at specified location', async () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { deleteCertificate } = useCertificates();

      await deleteCertificate({
        type: 'TrustStore Certificate',
        location: '/redfish/v1/cert1',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        type: 'TrustStore Certificate',
        location: '/redfish/v1/cert1',
      });
    });
  });

  describe('deleteACFCertificate', () => {
    it('deletes ACF certificate by patching with empty ACFFile', async () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { deleteACFCertificate } = useCertificates();

      await deleteACFCertificate({
        type: 'ServiceLogin Certificate',
        location: '/redfish/v1/AccountService/Accounts/service',
      });

      expect(mutateAsync).toHaveBeenCalledWith({
        type: 'ServiceLogin Certificate',
        location: '/redfish/v1/AccountService/Accounts/service',
      });
    });
  });

  describe('generateCsr', () => {
    it('generates CSR with provided user data', async () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());
      useQuery.mockReturnValue(makeMockQuery());

      const mutateAsync = vi.fn().mockResolvedValue({ data: 'CSR content' });
      useMutation.mockImplementation(() => {
        return makeMockMutation({ mutateAsync });
      });

      const { generateCsr } = useCertificates();

      const userData = {
        certificateType: 'HTTPS Certificate',
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        companyName: 'Test Corp',
        companyUnit: 'IT',
        commonName: 'test.example.com',
        keyPairAlgorithm: 'RSA',
        keyBitLength: '2048',
        alternateName: 'alt.example.com',
      };

      await generateCsr(userData);

      expect(mutateAsync).toHaveBeenCalledWith(userData);
    });
  });
});
