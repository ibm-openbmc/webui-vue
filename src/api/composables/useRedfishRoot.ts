import { useQuery } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
import type { ServiceRoot } from '@/types/redfish';

/**
 * Composable to fetch and cache the Redfish ServiceRoot
 * Detects OData support capabilities for optimization
 */
export function useRedfishRoot() {
  return useQuery({
    queryKey: ['redfish', 'root'],
    queryFn: async (): Promise<ServiceRoot> => {
      const response = await api.get<ServiceRoot>('/redfish/v1/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - ServiceRoot rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Helper to check if OData $expand is supported
 */
export function useODataExpandSupport() {
  const { data: serviceRoot } = useRedfishRoot();
  
  const isExpandSupported = () => {
    return (
      serviceRoot.value?.ProtocolFeaturesSupported?.ExpandQuery?.ExpandAll ??
      false
    );
  };

  const getMaxExpandLevels = () => {
    return (
      serviceRoot.value?.ProtocolFeaturesSupported?.ExpandQuery?.MaxLevels ?? 1
    );
  };

  const isSelectSupported = () => {
    return serviceRoot.value?.ProtocolFeaturesSupported?.SelectQuery ?? false;
  };

  return {
    isExpandSupported,
    getMaxExpandLevels,
    isSelectSupported,
  };
}
