import AppLayout from '@/layouts/AppLayout.vue';
import AuditLogs from '@/views/Logs/AuditLogs';
import ChangePassword from '@/views/ChangePassword';
import ConcurrentMaintenance from '@/views/HardwareStatus/ConcurrentMaintenance';
import Sessions from '@/views/SecurityAndAccess/Sessions';
import ConsoleLayout from '@/layouts/ConsoleLayout.vue';
import DateTime from '@/views/Settings/DateTime';
import EventLogs from '@/views/Logs/EventLogs';
import FactoryReset from '@/views/Operations/FactoryReset';
import Firmware from '@/views/Operations/Firmware';
import Inventory from '@/views/HardwareStatus/Inventory';
import Ldap from '@/views/SecurityAndAccess/Ldap';
import UserManagement from '@/views/SecurityAndAccess/UserManagement';
import Login from '@/views/Login';
import LoginLayout from '@/layouts/LoginLayout';
import Network from '@/views/Settings/Network';
import Notices from '@/views/Notices';
import HardwareDeconfiguration from '@/views/Settings/HardwareDeconfiguration';
import Overview from '@/views/Overview';
import PageNotFound from '@/views/PageNotFound';
import PostCodeLogs from '@/views/Logs/PostCodeLogs';
import PostCodes from '@/views/Logs/PostCodeLogs/PostCodes';
import PowerRestorePolicy from '@/views/Settings/PowerRestorePolicy';
import ProfileSettings from '@/views/ProfileSettings';
import RebootBmc from '@/views/Operations/RebootBmc';
import Policies from '@/views/SecurityAndAccess/Policies';
import KeyClear from '@/views/Operations/KeyClear';
import Sensors from '@/views/HardwareStatus/Sensors';
import PcieTopology from '@/views/HardwareStatus/PcieTopology';
import ServiceLogin from '@/views/Operations/ServiceLoginConsoles/ServiceLogin';
import ServiceLoginConsoles from '@/views/Operations/ServiceLoginConsoles/ServiceLoginConsoles';
import HostConsole from '@/views/Operations/HostConsole';
import HostConsoleConsole from '@/views/Operations/HostConsole/HostConsoleConsole';
import ServerPowerOperations from '@/views/Operations/ServerPowerOperations';
import Certificates from '@/views/SecurityAndAccess/Certificates';
import Memory from '@/views/ResourceManagement/Memory';
import Power from '@/views/ResourceManagement/Power';
import SystemParameters from '@/views/ResourceManagement/SystemParameters';
import SnmpAlerts from '@/views/Settings/SnmpAlerts';
import CapacityOnDemand from '@/views/ResourceManagement/CapacityOnDemand';
import FieldCoreOverride from '@/views/ResourceManagement/FieldCoreOverride';
import DeconfigurationRecords from '@/views/Logs/DeconfigurationRecords';
import IBMiServiceFunctions from '@/views/Logs/IBMiServiceFunctions';

import i18n from '@/i18n';

// Custom components
import Dumps from '@/views/Logs/Dumps';

const routes = [
  {
    path: '/login',
    component: LoginLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: Login,
        meta: {
          title: i18n.t('appPageTitle.login'),
        },
      },
      {
        path: '/change-password',
        name: 'change-password',
        component: ChangePassword,
        meta: {
          title: i18n.t('appPageTitle.changePassword'),
          requiresAuth: true,
        },
      },
    ],
  },
  {
    path: '/console',
    component: ConsoleLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'service-login-consoles',
        name: 'service-login-consoles',
        component: ServiceLoginConsoles,
        meta: {
          title: i18n.t('appPageTitle.serviceLogin'),
        },
      },
      {
        path: 'host-console-console',
        name: 'host-console-console',
        component: HostConsoleConsole,
        meta: {
          title: i18n.t('appPageTitle.hostConsole'),
        },
      },
      {
        path: 'post-codes',
        name: 'post-codes',
        component: PostCodes,
        meta: {
          title: i18n.t('appPageTitle.postCodes'),
        },
      },
    ],
  },
  {
    path: '/',
    meta: {
      requiresAuth: true,
    },
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'overview',
        component: Overview,
        meta: {
          title: i18n.t('appPageTitle.overview'),
        },
      },
      {
        path: 'notices',
        name: 'notices',
        component: Notices,
        meta: {
          title: i18n.t('appPageTitle.notices'),
        },
      },
      {
        path: '/profile-settings',
        name: 'profile-settings',
        component: ProfileSettings,
        meta: {
          title: i18n.t('appPageTitle.profileSettings'),
        },
      },
      {
        path: '/logs/deconfiguration-records',
        name: 'deconfiguration-records',
        component: DeconfigurationRecords,
        meta: {
          title: i18n.t('appPageTitle.deconfigurationRecords'),
        },
      },
      {
        path: '/logs/dumps',
        name: 'dumps',
        component: Dumps,
        meta: {
          title: i18n.t('appPageTitle.dumps'),
        },
      },
      {
        path: '/logs/ibmi-service-functions',
        name: 'ibmiServiceFunctions',
        component: IBMiServiceFunctions,
        meta: {
          title: i18n.t('appPageTitle.ibmiServiceFunctions'),
        },
      },
      {
        path: '/logs/event-logs',
        name: 'event-logs',
        component: EventLogs,
        meta: {
          title: i18n.t('appPageTitle.eventLogs'),
        },
      },
      {
        path: '/logs/audit-logs',
        name: 'audit-logs',
        component: AuditLogs,
        meta: {
          title: i18n.t('appPageTitle.auditLogs'),
        },
      },
      {
        path: '/logs/post-code-logs',
        name: 'post-code-logs',
        component: PostCodeLogs,
        meta: {
          title: i18n.t('appPageTitle.postCodeLogs'),
        },
      },
      {
        path: '/hardware-status/inventory',
        name: 'inventory',
        component: Inventory,
        meta: {
          title: i18n.t('appPageTitle.inventory'),
        },
      },
      {
        path: '/hardware-status/sensors',
        name: 'sensors',
        component: Sensors,
        meta: {
          title: i18n.t('appPageTitle.sensors'),
        },
      },
      {
        path: '/hardware-status/pcie-topology',
        name: 'pcie-topology',
        component: PcieTopology,
        meta: {
          title: i18n.t('appPageTitle.pcieTopology'),
        },
      },
      {
        path: '/hardware-status/concurrent-maintenance',
        name: 'concurrent-maintenance',
        component: ConcurrentMaintenance,
        meta: {
          title: i18n.t('appPageTitle.concurrentMaintenance'),
        },
      },
      {
        path: '/security-and-access/sessions',
        name: 'sessions',
        component: Sessions,
        meta: {
          title: i18n.t('appPageTitle.sessions'),
        },
      },
      {
        path: '/security-and-access/ldap',
        name: 'ldap',
        component: Ldap,
        meta: {
          title: i18n.t('appPageTitle.ldap'),
        },
      },
      {
        path: '/security-and-access/user-management',
        name: 'user-management',
        component: UserManagement,
        meta: {
          title: i18n.t('appPageTitle.userManagement'),
        },
      },
      {
        path: '/security-and-access/policies',
        name: 'policies',
        component: Policies,
        meta: {
          title: i18n.t('appPageTitle.policies'),
        },
      },
      {
        path: '/security-and-access/certificates',
        name: 'certificates',
        component: Certificates,
        meta: {
          title: i18n.t('appPageTitle.certificates'),
        },
      },
      {
        path: '/settings/date-time',
        name: 'date-time',
        component: DateTime,
        meta: {
          title: i18n.t('appPageTitle.dateTime'),
        },
      },
      {
        path: '/operations/firmware',
        name: 'firmware',
        component: Firmware,
        meta: {
          title: i18n.t('appPageTitle.firmware'),
        },
      },
      {
        path: '/settings/hardware-deconfiguration',
        name: 'hardware-deconfiguration',
        component: HardwareDeconfiguration,
        meta: {
          title: i18n.t('appPageTitle.deconfigurationHardware'),
        },
      },
      {
        path: '/settings/network',
        name: 'network',
        component: Network,
        meta: {
          title: i18n.t('appPageTitle.network'),
        },
      },
      {
        path: '/settings/power-restore-policy',
        name: 'power-restore-policy',
        component: PowerRestorePolicy,
        meta: {
          title: i18n.t('appPageTitle.powerRestorePolicy'),
        },
      },
      {
        path: '/settings/snmp-alerts',
        name: 'snmp-alerts',
        component: SnmpAlerts,
        meta: {
          title: i18n.t('appPageTitle.snmpAlerts'),
        },
      },
      {
        path: '/resource-management/system-parameters',
        name: 'system-parameters',
        component: SystemParameters,
        meta: {
          title: i18n.t('appPageTitle.systemParameters'),
        },
      },
      {
        path: '/resource-management/memory',
        name: 'memory',
        component: Memory,
        meta: {
          title: i18n.t('appPageTitle.memory'),
        },
      },
      {
        path: '/resource-management/power',
        name: 'power',
        component: Power,
        meta: {
          title: i18n.t('appPageTitle.power'),
        },
      },
      {
        path: '/resource-management/capacity-on-demand',
        name: 'capacity-on-demand',
        component: CapacityOnDemand,
        meta: {
          title: i18n.t('appPageTitle.capacityOnDemand'),
        },
      },
      {
        path: '/resource-management/field-core-override',
        name: 'field-core-override',
        component: FieldCoreOverride,
        meta: {
          title: i18n.t('appPageTitle.fieldCoreOverride'),
        },
      },
      {
        path: '/operations/factory-reset',
        name: 'factory-reset',
        component: FactoryReset,
        meta: {
          title: i18n.t('appPageTitle.factoryReset'),
        },
      },
      {
        path: '/operations/key-clear',
        name: 'key-clear',
        component: KeyClear,
        meta: {
          title: i18n.t('appPageTitle.keyClear'),
        },
      },
      {
        path: '/operations/reboot-bmc',
        name: 'reboot-bmc',
        component: RebootBmc,
        meta: {
          title: i18n.t('appPageTitle.rebootBmc'),
        },
      },
      {
        path: '/operations/service-login',
        name: 'service-login',
        component: ServiceLogin,
        meta: {
          title: i18n.t('appPageTitle.serviceLogin'),
        },
      },
      {
        path: '/operations/host-console',
        name: 'host-console',
        component: HostConsole,
        meta: {
          title: i18n.t('appPageTitle.hostConsole'),
        },
      },
      {
        path: '/operations/server-power-operations',
        name: 'server-power-operations',
        component: ServerPowerOperations,
        meta: {
          title: i18n.t('appPageTitle.serverPowerOperations'),
        },
      },
      {
        path: '*',
        name: 'page-not-found',
        component: PageNotFound,
        meta: {
          title: i18n.t('appPageTitle.pageNotFound'),
        },
      },
    ],
  },
];

export default routes;
