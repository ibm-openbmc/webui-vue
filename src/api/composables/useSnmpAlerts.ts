import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { useNavigatedCollection, navigateToCollection } from './useAllSubResources';
import type { Resource } from '@/types/redfish';

interface SnmpSubscription extends Resource {
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
 * Composable for fetching and managing SNMP alert destinations
 * Replaces SnmpAlertsStore with TanStack Query
 */
export function useSnmpAlerts() {
  const queryClient = useQueryClient();

  // Fetch all SNMP subscriptions using the navigated collection helper
  const subscriptionsQuery = useNavigatedCollection<SnmpSubscription>(
    ['EventService', 'Subscriptions'],
    {
      // Filter only SNMP subscriptions
      filter: (item) => item.SubscriptionType === 'SNMPTrap',
    }
  );

  // Transform subscriptions to table format
  const snmpSubscriptions = computed<SnmpAlertData[]>(() => {
    if (!subscriptionsQuery.data.value) {
      return [];
    }

    return subscriptionsQuery.data.value.map((subscription: SnmpSubscription) => {
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
  });

  // Add destination mutation
  const addDestinationMutation = useMutation({
    mutationFn: async (payload: AddDestinationPayload): Promise<void> => {
      try {
        const snmpAlertUrl = await navigateToCollection(['EventService', 'Subscriptions']);
        await api.post(snmpAlertUrl, payload);
      } catch (error) {
        console.error('Error adding SNMP destination:', error);
        throw new Error(i18n.global.t('pageSnmpAlerts.toast.errorAddDestination'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'navigatedCollection', 'EventService', 'Subscriptions'],
      });
    },
  });

  // Delete single destination mutation
  const deleteDestinationMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const snmpAlertUrl = await navigateToCollection(['EventService', 'Subscriptions']);
        await api.delete(`${snmpAlertUrl}/${id}`);
      } catch (error) {
        console.error('Error deleting SNMP destination:', error);
        throw new Error(i18n.global.t('pageSnmpAlerts.toast.errorDeleteDestination', { id }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'navigatedCollection', 'EventService', 'Subscriptions'],
      });
    },
  });

  // Delete multiple destinations mutation
  const deleteMultipleDestinationsMutation = useMutation({
    mutationFn: async (
      destinations: SnmpAlertData[]
    ): Promise<{ successCount: number; errorCount: number }> => {
      const snmpAlertUrl = await navigateToCollection(['EventService', 'Subscriptions']);
      
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
        queryKey: ['redfish', 'navigatedCollection', 'EventService', 'Subscriptions'],
      });
    },
  });

  return {
    // Data
    snmpAlerts: snmpSubscriptions,
    isLoading: subscriptionsQuery.isLoading,
    isError: subscriptionsQuery.isError,
    error: subscriptionsQuery.error,
    
    // Actions
    refetch: subscriptionsQuery.refetch,
    addDestination: addDestinationMutation.mutateAsync,
    deleteDestination: deleteDestinationMutation.mutateAsync,
    deleteMultipleDestinations: deleteMultipleDestinationsMutation.mutateAsync,
    
    // Mutation states
    isAddingDestination: addDestinationMutation.isPending,
    isDeletingDestination: deleteDestinationMutation.isPending,
    isDeletingMultiple: deleteMultipleDestinationsMutation.isPending,
  };
}