import AppLayout from '@/layouts/AppLayout.vue';
import AuditLogs from '@/views/Logs/AuditLogs';
import ChangePassword from '@/views/ChangePassword';
import ConsoleLayout from '@/layouts/ConsoleLayout.vue';
import ConcurrentMaintenance from '../views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenance.vue';
import DateTime from '@/views/Settings/DateTime/DateTime.vue';
import EventLogs from '@/views/Logs/EventLogs';
import FactoryReset from '@/views/Operations/FactoryReset';
import Firmware from '@/views/Operations/Firmware';
import Inventory from '../views/HardwareStatus/Inventory/Inventory.vue';
import Kvm from '@/views/Operations/Kvm';
import KvmConsole from '@/views/Operations/Kvm/KvmConsole';
import Sessions from '@/views/SecurityAndAccess/Sessions';
import Ldap from '../views/SecurityAndAccess/Ldap/Ldap.vue';
import UserManagement from '@/views/SecurityAndAccess/UserManagement';
import LoginPage from '@/views/Login/Login.vue';
import LoginLayout from '@/layouts/LoginLayout.vue';
import HardwareDeconfiguration from '../views/Settings/HardwareDeconfiguration/HardwareDeconfiguration.vue';
import Network from '@/views/Settings/Network';
import Overview from '@/views/Overview/Overview.vue';
import PageNotFound from '@/views/PageNotFound/PageNotFound.vue';
import PostCodes from '@/views/Logs/PostCodeLogs/PostCodes.vue';
import PostCodeLogs from '@/views/Logs/PostCodeLogs/PostCodeLogs.vue';
import PowerRestorePolicy from '@/views/Settings/PowerRestorePolicy';
import ProfileSettings from '@/views/ProfileSettings';
import RebootBmc from '@/views/Operations/RebootBmc';
import Policies from '@/views/SecurityAndAccess/Policies';
import KeyClear from '@/views/Operations/KeyClear/KeyClear.vue';
import PcieTopology from '../views/HardwareStatus/PcieTopology/PcieTopology.vue';
import Sensors from '@/views/HardwareStatus/Sensors';
import HostConsole from '@/views/Operations/HostConsole';
import HostConsoleConsole from '@/views/Operations/HostConsole/HostConsoleConsole.vue';
import ServerPowerOperations from '@/views/Operations/ServerPowerOperations';
import Certificates from '@/views/SecurityAndAccess/Certificates';
import VirtualMedia from '@/views/Operations/VirtualMedia/VirtualMedia.vue';
import Memory from '@/views/ResourceManagement/Memory';
import Power from '@/views/ResourceManagement/Power';
import SystemParameters from '@/views/ResourceManagement/SystemParameters';
import SnmpAlerts from '@/views/Settings/SnmpAlerts';
import i18n from '@/i18n';

export const routes = [
  {
    path: '/login',
    component: LoginLayout,
    children: [
      {
        path: '',
        name: 'LoginPage',
        component: LoginPage,
        meta: {
          title: i18n.t('appPageTitle.login'),
        },
      },
      {
        path: '/change-password',
        name: 'change-password',
        component: ChangePassword,
        meta: {
          title: i18n.global.t('appPageTitle.changePassword'),
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
        path: 'host-console-console',
        name: 'host-console-console',
        component: HostConsoleConsole,
        meta: {
          title: i18n.global.t('appPageTitle.hostConsole'),
        },
      },
      {
        path: 'post-codes',
        name: 'post-codes',
        component: PostCodes,
        meta: {
          title: i18n.global.t('appPageTitle.postCodes'),
        },
      },
      {
        path: 'kvm',
        name: 'kvm-console',
        component: KvmConsole,
        meta: {
          title: i18n.global.t('appPageTitle.kvm'),
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
          title: i18n.global.t('appPageTitle.overview'),
        },
      },
      {
        path: '/profile-settings',
        name: 'profile-settings',
        component: ProfileSettings,
        meta: {
          title: i18n.global.t('appPageTitle.profileSettings'),
        },
      },
      {
        path: '/logs/event-logs',
        name: 'event-logs',
        component: EventLogs,
        meta: {
          title: i18n.global.t('appPageTitle.eventLogs'),
        },
      },
      {
        path: '/logs/audit-logs',
        name: 'audit-logs',
        component: AuditLogs,
        meta: {
          title: i18n.global.t('appPageTitle.auditLogs'),
        },
      },
      {
        path: '/logs/post-code-logs',
        name: 'post-code-logs',
        component: PostCodeLogs,
        meta: {
          title: i18n.global.t('appPageTitle.postCodeLogs'),
        },
      },
      {
        path: '/hardware-status/inventory',
        name: 'inventory',
        component: Inventory,
        meta: {
          title: i18n.global.t('appPageTitle.inventory'),
        },
      },
      {
        path: '/hardware-status/sensors',
        name: 'sensors',
        component: Sensors,
        meta: {
          title: i18n.global.t('appPageTitle.sensors'),
        },
      },
      {
        path: '/hardware-status/pcie-topology',
        name: 'pcie-topology',
        component: PcieTopology,
        meta: {
          title: i18n.global.t('appPageTitle.pcieTopology'),
        },
      },
      {
        path: '/hardware-status/concurrent-maintenance',
        name: 'concurrent-maintenance',
        component: ConcurrentMaintenance,
        meta: {
          title: i18n.global.t('appPageTitle.concurrentMaintenance'),
        },
      },
      {
        path: '/security-and-access/sessions',
        name: 'sessions',
        component: Sessions,
        meta: {
          title: i18n.global.t('appPageTitle.sessions'),
        },
      },
      {
        path: '/security-and-access/ldap',
        name: 'ldap',
        component: Ldap,
        meta: {
          title: i18n.global.t('appPageTitle.ldap'),
        },
      },
      {
        path: '/security-and-access/user-management',
        name: 'local-users',
        component: UserManagement,
        meta: {
          title: i18n.global.t('appPageTitle.userManagement'),
        },
      },
      {
        path: '/security-and-access/policies',
        name: 'policies',
        component: Policies,
        meta: {
          title: i18n.global.t('appPageTitle.policies'),
        },
      },
      {
        path: '/security-and-access/certificates',
        name: 'certificates',
        component: Certificates,
        meta: {
          title: i18n.global.t('appPageTitle.certificates'),
        },
      },
      {
        path: '/settings/date-time',
        name: 'date-time',
        component: DateTime,
        meta: {
          title: i18n.global.t('appPageTitle.dateTime'),
        },
      },
      {
        path: '/settings/snmp-alerts',
        name: 'snmp-alerts',
        component: SnmpAlerts,
        meta: {
          title: i18n.global.t('appPageTitle.snmpAlerts'),
        },
      },
      {
        path: '/operations/factory-reset',
        name: 'factory-reset',
        component: FactoryReset,
        meta: {
          title: i18n.global.t('appPageTitle.factoryReset'),
        },
      },
      {
        path: '/security-and-access/key-clear',
        name: 'key-clear',
        component: KeyClear,
        meta: {
          title: i18n.global.t('appPageTitle.keyClear'),
        },
      },
      {
        path: '/operations/kvm',
        name: 'kvm',
        component: Kvm,
        meta: {
          title: i18n.global.t('appPageTitle.kvm'),
        },
      },
      {
        path: '/operations/firmware',
        name: 'firmware',
        component: Firmware,
        meta: {
          title: i18n.global.t('appPageTitle.firmware'),
        },
      },
      {
        path: '/settings/hardware-deconfiguration',
        name: 'hardware-deconfiguration',
        component: HardwareDeconfiguration,
        meta: {
          title: i18n.global.t('appPageTitle.deconfigurationHardware'),
        },
      },
      {
        path: '/settings/network',
        name: 'network',
        component: Network,
        meta: {
          title: i18n.global.t('appPageTitle.network'),
        },
      },
      {
        path: '/settings/power-restore-policy',
        name: 'power-restore-policy',
        component: PowerRestorePolicy,
        meta: {
          title: i18n.global.t('appPageTitle.powerRestorePolicy'),
        },
      },
      {
        path: '/resource-management/system-parameters',
        name: 'system-parameters',
        component: SystemParameters,
        meta: {
          title: i18n.global.t('appPageTitle.systemParameters'),
        },
      },
      {
        path: '/resource-management/memory',
        name: 'memory',
        component: Memory,
        meta: {
          title: i18n.global.t('appPageTitle.memory'),
        },
      },
      {
        path: '/resource-management/power',
        name: 'power',
        component: Power,
        meta: {
          title: i18n.global.t('appPageTitle.power'),
        },
      },
      {
        path: '/operations/reboot-bmc',
        name: 'reboot-bmc',
        component: RebootBmc,
        meta: {
          title: i18n.global.t('appPageTitle.rebootBmc'),
        },
      },
      {
        path: '/operations/host-console',
        name: 'host-console',
        component: HostConsole,
        meta: {
          title: i18n.global.t('appPageTitle.hostConsole'),
        },
      },
      {
        path: '/operations/server-power-operations',
        name: 'server-power-operations',
        component: ServerPowerOperations,
        meta: {
          title: i18n.global.t('appPageTitle.serverPowerOperations'),
        },
      },
      {
        path: '/operations/virtual-media',
        name: 'virtual-media',
        component: VirtualMedia,
        meta: {
          title: i18n.global.t('appPageTitle.virtualMedia'),
        },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'page-not-found',
        component: PageNotFound,
        meta: {
          title: i18n.global.t('appPageTitle.pageNotFound'),
        },
      },
    ],
  },
];

export default routes;
