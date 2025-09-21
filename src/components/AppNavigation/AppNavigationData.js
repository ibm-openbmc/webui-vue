import IconDashboard from '@carbon/icons-vue/es/dashboard/16';
import IconTextLinkAnalysis from '@carbon/icons-vue/es/text-link--analysis/16';
import IconDataCheck from '@carbon/icons-vue/es/data--check/16';
import IconSettingsAdjust from '@carbon/icons-vue/es/settings--adjust/16';
import IconSettings from '@carbon/icons-vue/es/settings/16';
import IconSecurity from '@carbon/icons-vue/es/security/16';
import IconDataBase from '@carbon/icons-vue/es/data--base--alt/16';
import i18n from '@/i18n';

const AppNavigationData = () => {
  const navigationItems = [
    {
      id: 'overview',
      label: i18n.global.t('appNavigation.overview'),
      route: '/',
      icon: IconDashboard,
    },
    {
      id: 'logs',
      label: i18n.global.t('appNavigation.logs'),
      icon: IconTextLinkAnalysis,
      children: [
        {
          id: 'event-logs',
          label: i18n.global.t('appNavigation.eventLogs'),
          route: '/logs/event-logs',
        },
        {
          id: 'audit-logs',
          label: i18n.global.t('appNavigation.auditLogs'),
          route: '/logs/audit-logs',
        },
        {
          id: 'post-code-logs',
          label: i18n.global.t('appNavigation.postCodeLogs'),
          route: '/logs/post-code-logs',
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
        },
        {
          id: 'sensors',
          label: i18n.global.t('appNavigation.sensors'),
          route: '/hardware-status/sensors',
        },
        {
          id: 'pcie-topology',
          label: i18n.global.t('appNavigation.pcieTopology'),
          route: '/hardware-status/pcie-topology',
        },
        {
          id: 'concurrent-maintenance',
          label: i18n.global.t('appNavigation.concurrentMaintenance'),
          route: '/hardware-status/concurrent-maintenance',
        },
      ],
    },
    {
      id: 'operations',
      label: i18n.global.t('appNavigation.operations'),
      icon: IconSettingsAdjust,
      children: [
        {
          id: 'factory-reset',
          label: i18n.global.t('appNavigation.factoryReset'),
          route: '/operations/factory-reset',
        },
        {
          id: 'kvm',
          label: i18n.global.t('appNavigation.kvm'),
          route: '/operations/kvm',
        },
        {
          id: 'key-clear',
          label: i18n.global.t('appNavigation.keyClear'),
          route: '/operations/key-clear',
        },
        {
          id: 'firmware',
          label: i18n.global.t('appNavigation.firmware'),
          route: '/operations/firmware',
        },
        {
          id: 'reboot-bmc',
          label: i18n.global.t('appNavigation.rebootBmc'),
          route: '/operations/reboot-bmc',
        },
        {
          id: 'service-login',
          label: i18n.global.t('appNavigation.serviceLogin'),
          route: '/operations/service-login',
        },
        {
          id: 'host-console',
          label: i18n.global.t('appNavigation.hostConsole'),
          route: '/operations/host-console',
        },
        {
          id: 'server-power-operations',
          label: i18n.global.t('appNavigation.serverPowerOperations'),
          route: '/operations/server-power-operations',
        },
        {
          id: 'virtual-media',
          label: i18n.global.t('appNavigation.virtualMedia'),
          route: '/operations/virtual-media',
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
        },
        {
          id: 'hardware-deconfiguration',
          label: i18n.global.t('appNavigation.deconfigurationHardware'),
          route: '/settings/hardware-deconfiguration',
        },
        {
          id: 'network',
          label: i18n.global.t('appNavigation.network'),
          route: '/settings/network',
        },
        {
          id: 'power-restore-policy',
          label: i18n.global.t('appNavigation.powerRestorePolicy'),
          route: '/settings/power-restore-policy',
        },
        {
          id: 'snmp-alerts',
          label: i18n.global.t('appNavigation.snmpAlerts'),
          route: '/settings/snmp-alerts',
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
        },
        {
          id: 'ldap',
          label: i18n.global.t('appNavigation.ldap'),
          route: '/security-and-access/ldap',
        },
        {
          id: 'user-management',
          label: i18n.global.t('appNavigation.userManagement'),
          route: '/security-and-access/user-management',
        },
        {
          id: 'policies',
          label: i18n.global.t('appNavigation.policies'),
          route: '/security-and-access/policies',
        },
        {
          id: 'certificates',
          label: i18n.global.t('appNavigation.certificates'),
          route: '/security-and-access/certificates',
        },
      ],
    },
    {
      id: 'resource-management',
      label: i18n.global.t('appNavigation.resourceManagement'),
      icon: IconDataBase,
      children: [
        {
          id: 'system-parameters',
          label: i18n.global.t('appNavigation.systemParameters'),
          route: '/resource-management/system-parameters',
        },
        {
          id: 'memory',
          label: i18n.global.t('appNavigation.memory'),
          route: '/resource-management/memory',
        },
        {
          id: 'power',
          label: i18n.global.t('appNavigation.power'),
          route: '/resource-management/power',
        },
      ],
    },
  ];
  return {
    navigationItems,
  };
};
export default AppNavigationData;
