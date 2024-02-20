import IconDashboard from '@carbon/icons-vue/es/dashboard/16';
import IconTextLinkAnalysis from '@carbon/icons-vue/es/text-link--analysis/16';
import IconDataCheck from '@carbon/icons-vue/es/data--check/16';
import IconSettingsAdjust from '@carbon/icons-vue/es/settings--adjust/16';
import IconSettings from '@carbon/icons-vue/es/settings/16';
import IconSecurity from '@carbon/icons-vue/es/security/16';
import IconChevronUp from '@carbon/icons-vue/es/chevron--up/16';
import IconDataBase from '@carbon/icons-vue/es/data--base--alt/16';
import IconDocument from '@carbon/icons-vue/es/document/16';

const AppNavigationMixin = {
  components: {
    iconOverview: IconDashboard,
    iconLogs: IconTextLinkAnalysis,
    iconHealth: IconDataCheck,
    iconControl: IconSettingsAdjust,
    iconSettings: IconSettings,
    iconSecurityAndAccess: IconSecurity,
    iconExpand: IconChevronUp,
    iconResourceManagement: IconDataBase,
    iconDocument: IconDocument,
  },
  data() {
    return {
      navigationData: [
        {
          id: 'overview',
          label: this.$t('appNavigation.overview'),
          route: '/',
          icon: 'iconOverview',
        },
        {
          id: 'operations',
          label: this.$t('appNavigation.operations'),
          icon: 'iconControl',
          children: [
            {
              id: 'server-power-operations',
              label: this.$t('appNavigation.serverPowerOperations'),
              route: '/operations/server-power-operations',
              restrictTo: [],
            },
            {
              id: 'host-console',
              label: this.$t('appNavigation.hostConsole'),
              route: '/operations/host-console',
              restrictTo: ['Administrator', 'OemIBMServiceAgent'],
            },
            {
              id: 'service-login',
              label: this.$t('appPageTitle.serviceLogin'),
              route: '/operations/service-login',
              restrictTo: ['OemIBMServiceAgent'],
            },
            {
              id: 'firmware',
              label: this.$t('appNavigation.firmware'),
              route: '/operations/firmware',
              restrictTo: [],
            },
            {
              id: 'reboot-bmc',
              label: this.$t('appNavigation.rebootBmc'),
              route: '/operations/reboot-bmc',
              restrictTo: [],
            },
          ],
        },
        {
          id: 'resource-management',
          label: this.$t('appNavigation.resourceManagement'),
          icon: 'iconResourceManagement',
          children: [
            {
              id: 'memory',
              label: this.$t('appNavigation.memory'),
              route: '/resource-management/memory',
              restrictTo: [],
            },
            {
              id: 'power',
              label: this.$t('appNavigation.power'),
              route: '/resource-management/power',
              restrictTo: [],
            },
            {
              id: 'capacity-on-demand',
              label: this.$t('appNavigation.capacityOnDemand'),
              route: '/resource-management/capacity-on-demand',
              restrictTo: [],
            },
            {
              id: 'field-core-override',
              label: this.$t('appNavigation.fieldCoreOverride'),
              route: '/resource-management/field-core-override',
              restrictTo: [],
            },
            {
              id: 'system-parameters',
              label: this.$t('appNavigation.systemParameters'),
              route: '/resource-management/system-parameters',
              restrictTo: [],
            },
          ],
        },
        {
          id: 'hardware-status',
          label: this.$t('appNavigation.hardwareStatus'),
          icon: 'iconHealth',
          children: [
            {
              id: 'inventory',
              label: this.$t('appNavigation.inventory'),
              route: '/hardware-status/inventory',
              restrictTo: [],
            },
            {
              id: 'sensors',
              label: this.$t('appNavigation.sensors'),
              route: '/hardware-status/sensors',
              restrictTo: [],
            },
            {
              id: 'hardware-deconfiguration',
              label: this.$t('appNavigation.deconfigurationHardware'),
              route: '/settings/hardware-deconfiguration',
              restrictTo: [],
            },
            {
              id: 'pcie-topology',
              label: this.$t('appNavigation.pcieTopology'),
              route: '/hardware-status/pcie-topology',
              restrictTo: [],
            },
            {
              id: 'concurrent-maintenance',
              label: this.$t('appNavigation.concurrentMaintenance'),
              route: '/hardware-status/concurrent-maintenance',
              restrictTo: ['Everest'],
            },
          ],
        },
        {
          id: 'logs',
          label: this.$t('appNavigation.logs'),
          icon: 'iconLogs',
          children: [
            {
              id: 'post-code-logs',
              label: this.$t('appNavigation.postCodeLogs'),
              route: '/logs/post-code-logs',
              restrictTo: [],
            },
            {
              id: 'event-logs',
              label: this.$t('appNavigation.eventLogs'),
              route: '/logs/event-logs',
              restrictTo: [],
            },
            {
              id: 'audit-logs',
              label: this.$t('appNavigation.auditLogs'),
              route: '/logs/audit-logs',
              restrictTo: [],
            },
            {
              id: 'dumps',
              label: this.$t('appNavigation.dumps'),
              route: '/logs/dumps',
              restrictTo: [],
            },
            {
              id: 'ibmi-service-functions',
              label: this.$t('appNavigation.ibmiServiceFunctions'),
              route: '/logs/ibmi-service-functions',
              restrictTo: ['NonHMCManaged'],
            },
            {
              id: 'deconfiguration-records',
              label: this.$t('appNavigation.deconfigurationRecords'),
              route: '/logs/deconfiguration-records',
              restrictTo: [],
            },
          ],
        },
        {
          id: 'settings',
          label: this.$t('appNavigation.settings'),
          icon: 'iconSettings',
          children: [
            {
              id: 'date-time',
              label: this.$t('appNavigation.dateTime'),
              route: '/settings/date-time',
              restrictTo: [],
            },
            {
              id: 'network',
              label: this.$t('appNavigation.network'),
              route: '/settings/network',
              restrictTo: [],
            },
            {
              id: 'power-restore-policy',
              label: this.$t('appNavigation.powerRestorePolicy'),
              route: '/settings/power-restore-policy',
              restrictTo: [],
            },
            {
              id: 'snmp-alerts',
              label: this.$t('appNavigation.snmpAlerts'),
              route: '/settings/snmp-alerts',
              restrictTo: [],
            },
            {
              id: 'factory-reset',
              label: this.$t('appNavigation.factoryReset'),
              route: '/operations/factory-reset',
              restrictTo: [],
            },
          ],
        },
        {
          id: 'security-and-access',
          label: this.$t('appNavigation.securityAndAccess'),
          icon: 'iconSecurityAndAccess',
          children: [
            {
              id: 'sessions',
              label: this.$t('appNavigation.sessions'),
              route: '/security-and-access/sessions',
              restrictTo: [],
            },
            {
              id: 'user-management',
              label: this.$t('appNavigation.userManagement'),
              route: '/security-and-access/user-management',
              restrictTo: [],
            },
            {
              id: 'ldap',
              label: this.$t('appNavigation.ldap'),
              route: '/security-and-access/ldap',
              restrictTo: [],
            },
            {
              id: 'certificates',
              label: this.$t('appNavigation.certificates'),
              route: '/security-and-access/certificates',
              restrictTo: [],
            },
            {
              id: 'policies',
              label: this.$t('appNavigation.policies'),
              route: '/security-and-access/policies',
              restrictTo: [],
            },
            {
              id: 'key-clear',
              label: this.$t('appNavigation.keyClear'),
              route: '/operations/key-clear',
              restrictTo: ['Administrator', 'OemIBMServiceAgent'],
            },
          ],
        },
        {
          id: 'notices',
          label: this.$t('appNavigation.notices'),
          route: '/notices',
          icon: 'iconDocument',
        },
      ],
    };
  },
  computed: {
    roleId() {
      return this.$store?.getters?.['global/currentUser']?.RoleId;
    },
    model() {
      if (this.systemInfo?.startsWith('9043')) {
        return 'Everest';
      } else {
        return 'NotEverest';
      }
    },
    systemInfo() {
      return this.$store?.getters['global/modelType'];
    },
    isHmcManged() {
      if (this.hmcInfo === 'Enabled') {
        return 'HMCManaged';
      } else {
        return 'NonHMCManaged';
      }
    },
    hmcInfo() {
      return this.$store?.getters['global/hmcManaged'];
    },
    navigationItems() {
      return this.navigationData.map((section) => {
        let restrictedPages = [];
        section.children?.map((page) => {
          if (page.restrictTo.length > 0) {
            const isPageNeeded =
              page.restrictTo.filter(
                (requiredRole) =>
                  requiredRole === this.roleId ||
                  requiredRole === this.model ||
                  requiredRole === this.isHmcManged
              ).length > 0;
            if (!isPageNeeded) restrictedPages.push(page);
          }
        });
        if (section?.children && section?.children.length > 0) {
          let finalSection = section?.children.filter(
            (item) => !restrictedPages.includes(item)
          );
          section.children = finalSection;
        }
        return section;
      });
    },
  },
  created() {
    this.$store.dispatch('global/getHmcManaged');
  },
};

export default AppNavigationMixin;
