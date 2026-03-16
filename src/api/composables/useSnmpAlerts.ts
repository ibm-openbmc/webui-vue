import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

interface SnmpSubscription {
  '@odata.id': string;
  Id: string;
  Destination: string;
  SubscriptionType: string;
  Protocol: string;
}

interface SnmpAlertData {
  '@odata.id': string;
  id: string;
  ip: string;
  port: string;
  Destination: string;
  SubscriptionType: string;
  Protocol: string;
  isSelected: boolean;
}

interface AddDestinationPayload {
  Destination: string;
  SubscriptionType: string;
  Protocol: string;
}

/**
 * Get the SNMP alert subscription URL
 */
async function getSnmpAlertUrl(): Promise<string> {
  const rootResponse = await api.get('/redfish/v1/');
  const eventServiceUrl = rootResponse.data.EventService['@odata.id'];
  const eventServiceResponse = await api.get(eventServiceUrl);
  const subscriptionsUrl = eventServiceResponse.data.Subscriptions['@odata.id'];
  const subscriptionsResponse = await api.get(subscriptionsUrl);
  return subscriptionsResponse.data['@odata.id'];
}

/**
 * Composable for fetching and managing SNMP alert destinations
 * Replaces SnmpAlertsStore with TanStack Query
 */
export function useSnmpAlerts() {
  const queryClient = useQueryClient();

  // Fetch all SNMP subscriptions
  const {
    data: snmpSubscriptions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'snmp', 'subscriptions'],
    queryFn: async (): Promise<SnmpAlertData[]> => {
      const snmpAlertUrl = await getSnmpAlertUrl();
      const response = await api.get(snmpAlertUrl);
      
      const memberIds = response.data.Members.map(
        (member: any) => member['@odata.id']
      );

      if (memberIds.length === 0) {
        return [];
      }

      const memberResponses = await Promise.all(
        memberIds.map((id: string) => api.get(id))
      );

      const allSubscriptions = memberResponses.map((res) => res.data);
      
      // Filter only SNMP subscriptions
      const snmpSubscriptions = allSubscriptions.filter(
        (item: SnmpSubscription) => item.SubscriptionType === 'SNMPTrap'
      );

      // Transform to table format
      return snmpSubscriptions.map((subscription: SnmpSubscription) => {
        const destination = subscription.Destination;
        const hasProtocol = destination.includes('://');
        
        let ip: string;
        let port: string;
        
        if (hasProtocol) {
          const parts = destination.split('/')[2].split(':');
          ip = parts[0];
          port = parts[1] || '';
        } else {
          const parts = destination.split(':');
          ip = parts[0];
          port = parts[1] || '';
        }

        return {
          '@odata.id': subscription['@odata.id'],
          id: subscription.Id,
          ip,
          port,
          Destination: subscription.Destination,
          SubscriptionType: subscription.SubscriptionType,
          Protocol: subscription.Protocol,
          isSelected: false,
        };
      });
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Add destination mutation
  const addDestinationMutation = useMutation({
    mutationFn: async (payload: AddDestinationPayload): Promise<void> => {
      const snmpAlertUrl = await getSnmpAlertUrl();
      await api.post(snmpAlertUrl, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'snmp', 'subscriptions'],
      });
    },
    onError: (error: any) => {
      console.error('Error adding SNMP destination:', error);
      const message = i18n.global.t(
        'pageSnmpAlerts.toast.errorAddDestination'
      );
      throw new Error(message);
    },
  });

  // Delete single destination mutation
  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const snmpAlertUrl = await getSnmpAlertUrl();
      await api.delete(`${snmpAlertUrl}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'snmp', 'subscriptions'],
      });
    },
    onError: (error: any, id: string) => {
      console.error('Error deleting SNMP destination:', error);
      const message = i18n.global.t(
        'pageSnmpAlerts.toast.errorDeleteDestination',
        { id }
      );
      throw new Error(message);
    },
  });

  // Delete multiple destinations mutation
  const deleteMultipleDestinationsMutation = useMutation({
    mutationFn: async (
      destinations: SnmpAlertData[]
    ): Promise<{ successCount: number; errorCount: number }> => {
      const snmpAlertUrl = await getSnmpAlertUrl();
      
      const results = await Promise.allSettled(
        destinations.map(({ id }) => api.delete(`${snmpAlertUrl}/${id}`))
      );

      const successCount = results.filter(
        (result) => result.status === 'fulfilled'
      ).length;
      const errorCount = results.filter(
        (result) => result.status === 'rejected'
      ).length;

      return { successCount, errorCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'snmp', 'subscriptions'],
      });
    },
  });

  // Computed properties
  const snmpAlerts = computed(() => snmpSubscriptions.value || []);

  return {
    // Data
    snmpAlerts,
    isLoading,
    isError,
    error,
    
    // Actions
    refetch,
    addDestination: addDestinationMutation.mutateAsync,
    deleteDestination: deleteDestinationMutation.mutateAsync,
    deleteMultipleDestinations: deleteMultipleDestinationsMutation.mutateAsync,
    
    // Mutation states
    isAddingDestination: addDestinationMutation.isPending,
    isDeletingDestination: deleteDestinationMutation.isPending,
    isDeletingMultiple: deleteMultipleDestinationsMutation.isPending,
  };
}