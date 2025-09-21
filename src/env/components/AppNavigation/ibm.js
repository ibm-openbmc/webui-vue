import IconDashboard from '@carbon/icons-vue/es/dashboard/16';
import IconTextLinkAnalysis from '@carbon/icons-vue/es/text-link--analysis/16';
import IconDataCheck from '@carbon/icons-vue/es/data--check/16';
import IconSettingsAdjust from '@carbon/icons-vue/es/settings--adjust/16';
import IconSettings from '@carbon/icons-vue/es/settings/16';
import IconSecurity from '@carbon/icons-vue/es/security/16';
import IconDataBase from '@carbon/icons-vue/es/data--base--alt/16';
import IconDocument from '@carbon/icons-vue/es/document/16';
import i18n from '@/i18n';
import stores from '@/store';

import { ref, computed, onMounted } from 'vue';

const AppNavigationData = () => {
  const globalStore = stores.GlobalStore();
  const isReady = ref(false);

  const roleId = computed(() => globalStore.currentUserGetter?.RoleId);
  const systemInfo = computed(() => globalStore.modelTypeGetter);
  const hmcInfo = computed(() => globalStore.hmcManagedGetter);

  const model = computed(() =>
    systemInfo.value?.startsWith('9043') || systemInfo.value?.startsWith('8860')
      ? 'Everest'
      : 'NotEverest',
  );
  const isHmcManged = computed(() =>
    hmcInfo.value === 'Enabled' ? 'HMCManaged' : 'NonHMCManaged',
  );

  const baseNavigation = [
    {
      id: 'overview',
      label: i18n.global.t('appNavigation.overview'),
      route: '/',
      icon: IconDashboard,
    },
    {
      id: 'operations',
      label: i18n.global.t('appNavigation.operations'),
      icon: IconSettingsAdjust,
      children: [
        {
          id: 'server-power-operations',
          label: i18n.global.t('appNavigation.serverPowerOperations'),
          route: '/operations/server-power-operations',
          restrictTo: [],
        },
        {
          id: 'host-console',
          label: i18n.global.t('appNavigation.hostConsole'),
          route: '/operations/host-console',
          restrictTo: ['Administrator', 'OemIBMServiceAgent'],
        },
        {
          id: 'service-login',
          label: i18n.global.t('appPageTitle.serviceLogin'),
          route: '/operations/service-login',
          restrictTo: ['OemIBMServiceAgent'],
        },
        {
          id: 'firmware',
          label: i18n.global.t('appNavigation.firmware'),
          route: '/operations/firmware',
          restrictTo: [],
        },
        {
          id: 'reboot-bmc',
          label: i18n.global.t('appNavigation.rebootBmc'),
          route: '/operations/reboot-bmc',
          restrictTo: [],
        },
      ],
    },
    {
      id: 'resource-management',
      label: i18n.global.t('appNavigation.resourceManagement'),
      icon: IconDataBase,
      children: [
        {
          id: 'memory',
          label: i18n.global.t('appNavigation.memory'),
          route: '/resource-management/memory',
          restrictTo: [],
        },
        {
          id: 'power',
          label: i18n.global.t('appNavigation.power'),
          route: '/resource-management/power',
          restrictTo: [],
        },
        {
          id: 'capacity-on-demand',
          label: i18n.global.t('appNavigation.capacityOnDemand'),
          route: '/resource-management/capacity-on-demand',
          restrictTo: [],
        },
        {
          id: 'field-core-override',
          label: i18n.global.t('appNavigation.fieldCoreOverride'),
          route: '/resource-management/field-core-override',
          restrictTo: [],
        },
        {
          id: 'system-parameters',
          label: i18n.global.t('appNavigation.systemParameters'),
          route: '/resource-management/system-parameters',
          restrictTo: [],
        },
      ],
    },
    {
      id: 'hardware-status',
      label: i18n.global.t('appNavigation.hardwareStatus'),
      icon: IconDataCheck,
      children: [
        {
          id: 'inventory',
          label: i18n.global.t('appNavigation.inventory'),
          route: '/hardware-status/inventory',
          restrictTo: [],
        },
        {
          id: 'sensors',
          label: i18n.global.t('appNavigation.sensors'),
          route: '/hardware-status/sensors',
          restrictTo: [],
        },
        {
          id: 'hardware-deconfiguration',
          label: i18n.global.t('appNavigation.deconfigurationHardware'),
          route: '/settings/hardware-deconfiguration',
          restrictTo: [],
        },
        {
          id: 'pcie-topology',
          label: i18n.global.t('appNavigation.pcieTopology'),
          route: '/hardware-status/pcie-topology',
          restrictTo: [],
        },
        {
          id: 'concurrent-maintenance',
          label: i18n.global.t('appNavigation.concurrentMaintenance'),
          route: '/hardware-status/concurrent-maintenance',
          restrictTo: ['Everest'],
        },
      ],
    },
    {
      id: 'logs',
      label: i18n.global.t('appNavigation.logs'),
      icon: IconTextLinkAnalysis,
      children: [
        {
          id: 'post-code-logs',
          label: i18n.global.t('appNavigation.postCodeLogs'),
          route: '/logs/post-code-logs',
          restrictTo: [],
        },
        {
          id: 'event-logs',
          label: i18n.global.t('appNavigation.eventLogs'),
          route: '/logs/event-logs',
          restrictTo: [],
        },
        {
          id: 'audit-logs',
          label: i18n.global.t('appNavigation.auditLogs'),
          route: '/logs/audit-logs',
          restrictTo: [],
        },
        {
          id: 'dumps',
          label: i18n.global.t('appNavigation.dumps'),
          route: '/logs/dumps',
          restrictTo: [],
        },
        {
          id: 'ibmi-service-functions',
          label: i18n.global.t('appNavigation.ibmiServiceFunctions'),
          route: '/logs/ibmi-service-functions',
          restrictTo: ['NonHMCManaged'],
        },
        {
          id: 'deconfiguration-records',
          label: i18n.global.t('appNavigation.deconfigurationRecords'),
          route: '/logs/deconfiguration-records',
          restrictTo: [],
        },
      ],
    },
    {
      id: 'settings',
      label: i18n.global.t('appNavigation.settings'),
      icon: IconSettings,
      children: [
        {
          id: 'date-time',
          label: i18n.global.t('appNavigation.dateTime'),
          route: '/settings/date-time',
          restrictTo: [],
        },
        {
          id: 'network',
          label: i18n.global.t('appNavigation.network'),
          route: '/settings/network',
          restrictTo: [],
        },
        {
          id: 'power-restore-policy',
          label: i18n.global.t('appNavigation.powerRestorePolicy'),
          route: '/settings/power-restore-policy',
          restrictTo: [],
        },
        {
          id: 'snmp-alerts',
          label: i18n.global.t('appNavigation.snmpAlerts'),
          route: '/settings/snmp-alerts',
          restrictTo: [],
        },
        {
          id: 'factory-reset',
          label: i18n.global.t('appNavigation.factoryReset'),
          route: '/operations/factory-reset',
          restrictTo: [],
        },
      ],
    },
    {
      id: 'security-and-access',
      label: i18n.global.t('appNavigation.securityAndAccess'),
      icon: IconSecurity,
      children: [
        {
          id: 'sessions',
          label: i18n.global.t('appNavigation.sessions'),
          route: '/security-and-access/sessions',
          restrictTo: [],
        },
        {
          id: 'user-management',
          label: i18n.global.t('appNavigation.userManagement'),
          route: '/security-and-access/user-management',
          restrictTo: [],
        },
        {
          id: 'ldap',
          label: i18n.global.t('appNavigation.ldap'),
          route: '/security-and-access/ldap',
          restrictTo: [],
        },
        {
          id: 'certificates',
          label: i18n.global.t('appNavigation.certificates'),
          route: '/security-and-access/certificates',
          restrictTo: [],
        },
        {
          id: 'policies',
          label: i18n.global.t('appNavigation.policies'),
          route: '/security-and-access/policies',
          restrictTo: [],
        },
        {
          id: 'key-clear',
          label: i18n.global.t('appNavigation.keyClear'),
          route: '/operations/key-clear',
          restrictTo: ['Administrator', 'OemIBMServiceAgent'],
        },
      ],
    },
    {
      id: 'notices',
      label: i18n.global.t('appNavigation.notices'),
      route: '/notices',
      icon: IconDocument,
    },
  ];

  const navigationData = ref([]);

  const navigationItems = computed(() => {
    if (!isReady.value) return [];
    return navigationData.value.map((section) => {
      if (!section.children || section.children.length === 0) {
        return section;
      }
      const filteredChildren = section.children.filter((page) => {
        if (!page.restrictTo || page.restrictTo.length === 0) return true;
        return page.restrictTo.some(
          (requiredRole) =>
            requiredRole === roleId.value ||
            requiredRole === model.value ||
            requiredRole === isHmcManged.value,
        );
      });
      if (filteredChildren.length === section.children.length) {
        return section;
      }
      return {
        ...section,
        children: filteredChildren,
      };
    });
  });

  onMounted(async () => {
    await globalStore.getHmcManaged();
    navigationData.value = baseNavigation;
    isReady.value = true;
  });

  return {
    navigationItems,
    roleId,
    model,
    systemInfo,
    isHmcManged,
    isReady,
  };
};
export default AppNavigationData;
