//TODO: Work Requird -->

import i18n from '@/i18n';
import LoginLayout from '@/layouts/LoginLayout.vue';
import LoginPage from '@/views/Login/Login.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import Overview from '@/views/Overview/Overview.vue';
import VirtualMedia from '@/views/Operations/VirtualMedia/VirtualMedia.vue';
import Kvm from '@/views/Operations/Kvm';
import Policies from '@/views/SecurityAndAccess/Policies';
import Sensors from '@/views/HardwareStatus/Sensors';
import AuditLogs from '@/views/Logs/AuditLogs';
import PageNotFound from '@/views/PageNotFound/PageNotFound.vue';
import KeyClear from '@/views/Operations/KeyClear/KeyClear.vue';
import RebootBmc from '@/views/Operations/RebootBmc';
import FactoryReset from '@/views/Operations/FactoryReset';
import Memory from '@/views/ResourceManagement/Memory';
import PostCodes from '@/views/Logs/PostCodeLogs/PostCodes.vue';
import PostCodeLogs from '@/views/Logs/PostCodeLogs/PostCodeLogs.vue';
import Power from '@/views/ResourceManagement/Power';
import PowerRestorePolicy from '@/views/Settings/PowerRestorePolicy';
import ConcurrentMaintenance from '../views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenance.vue';
import PcieTopology from '../views/HardwareStatus/PcieTopology/PcieTopology.vue';
import IBMiServiceFunctions from '@/views/Logs/IBMiServiceFunctions';
import Notices from '@/views/Notices/Notices.vue';
import Sessions from '@/views/SecurityAndAccess/Sessions';
import UserManagement from '@/views/SecurityAndAccess/UserManagement';
import Firmware from '@/views/Operations/Firmware';
import Certificates from '@/views/SecurityAndAccess/Certificates';
import Inventory from '../views/HardwareStatus/Inventory/Inventory.vue';
import SystemParameters from '@/views/ResourceManagement/SystemParameters';
import HardwareDeconfiguration from '../views/Settings/HardwareDeconfiguration/HardwareDeconfiguration.vue';
import HostConsole from '@/views/Operations/HostConsole';
import HostConsoleConsole from '@/views/Operations/HostConsole/HostConsoleConsole.vue';
import CapacityOnDemand from '../views/ResourceManagement/CapacityOnDemand/CapacityOnDemand.vue';
import DeconfigurationRecords from '../views/Logs/DeconfigurationRecords/DeconfigurationRecords.vue';
import ServerPowerOperations from '@/views/Operations/ServerPowerOperations';
import Ldap from '../views/SecurityAndAccess/Ldap/Ldap.vue';
import EventLogs from '@/views/Logs/EventLogs';
import FieldCoreOverride from '@/views/ResourceManagement/FieldCoreOverride';
import ServiceLoginConsoles from '@/views/Operations/ServiceLoginConsoles/ServiceLoginConsoles.vue';
import ServiceLogin from '@/views/Operations/ServiceLoginConsoles';
import ProfileSettings from '@/views/ProfileSettings';
import Network from '@/views/Settings/Network';
import Dumps from '@/views/Logs/Dumps';
import DateTime from '@/views/Settings/DateTime/DateTime.vue'

const roles = {
  administrator: 'Administrator',
  operator: 'Operator',
  readonly: 'ReadOnly',
  noaccess: 'NoAccess',
};
export const routes = [
  {
    path: '/login',
    component: LoginLayout,
    children: [
      {
        path: '',
        name: 'LoginPage',
        component: LoginPage,
      },
    ],
  },
  // Needs reimplementation once routes is implemented
  {
    path: '/console/host-console-console',
    meta: {
      requiresAuth: true,
      title: i18n.global.t('appPageTitle.hostConsole'),
    },
    component: HostConsoleConsole,
  },
  // Needs reimplementation once routes is implemented
  {
    path: '/console/service-login-consoles',
    meta: {
      requiresAuth: true,
      title: i18n.global.t('appPageTitle.serviceLogin'),
    },
    component: ServiceLoginConsoles,
  },
  // Needs reimplementation once routes is implemented
  {
    path: '/console/post-codes',
    name: 'post-codes',
    component: PostCodes,
    meta: {
      title: i18n.global.t('appPageTitle.postCodes'),
    },
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
        path: '/operations/virtual-media',
        name: 'virtual-media',
        component: VirtualMedia,
        meta: {
          title: i18n.global.t('appPageTitle.virtualMedia'),
          exclusiveToRoles: [roles.administrator],
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
        path: '/operations/service-login',
        name: 'service-login',
        component: ServiceLogin,
        meta: {
          title: i18n.global.t('appPageTitle.serviceLogin'),
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
        path: '/hardware-status/concurrent-maintenance',
        name: 'concurrent-maintenance',
        component: ConcurrentMaintenance,
        meta: {
          title: i18n.global.t('appPageTitle.concurrentMaintenance'),
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
        path: '/hardware-status/pcie-topology',
        name: 'pcie-topology',
        component: PcieTopology,
        meta: {
          title: i18n.global.t('appPageTitle.pcieTopology'),
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
        path: '/logs/ibmi-service-functions',
        name: 'ibmiServiceFunctions',
        component: IBMiServiceFunctions,
        meta: {
          title: i18n.global.t('appPageTitle.ibmiServiceFunctions'),
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
        path: '/logs/dumps',
        name: 'dumps',
        component: Dumps,
        meta: {
          title: i18n.global.t('appPageTitle.dumps'),
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
        path: '/operations/kvm',
        name: 'kvm',
        component: Kvm,
        meta: {
          title: i18n.global.t('appPageTitle.kvm'),
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
      { path: '/operations/key-clear', name: 'key-clear', component: KeyClear },
      {
        path: '/operations/reboot-bmc',
        name: 'reboot-bmc',
        component: RebootBmc,
        meta: {
          title: i18n.global.t('appPageTitle.rebootBmc'),
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
        path: '/operations/firmware',
        name: 'firmware',
        component: Firmware,
        meta: {
          title: i18n.global.t('appPageTitle.firmware'),
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
        path: '/logs/deconfiguration-records',
        name: 'deconfiguration-records',
        component: DeconfigurationRecords,
        meta: {
          title: i18n.global.t('appPageTitle.deconfigurationRecords'),
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
        path: '/settings/date-time',
        name: 'date-time',
        component: DateTime,
        meta: {
          title: i18n.global.t('appPageTitle.dateTime'),
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
        path: '/resource-management/power',
        name: 'power',
        component: Power,
        meta: {
          title: i18n.global.t('appPageTitle.power'),
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
        path: '/resource-management/capacity-on-demand',
        name: 'capacity-on-demand',
        component: CapacityOnDemand,
        meta: {
          title: i18n.global.t('appPageTitle.capacityOnDemand'),
        },
      },
      {
        path: '/resource-management/field-core-override',
        name: 'field-core-override',
        component: FieldCoreOverride,
        meta: {
          title: i18n.global.t('appPageTitle.fieldCoreOverride'),
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
        path: '/security-and-access/sessions',
        name: 'sessions',
        component: Sessions,
        meta: {
          title: i18n.global.t('appPageTitle.sessions'),
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
        path: '/security-and-access/certificates',
        name: 'certificates',
        component: Certificates,
        meta: {
          title: i18n.global.t('appPageTitle.certificates'),
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
      {
        path: '/security-and-access/ldap',
        name: 'ldap',
        component: Ldap,
        meta: {
          title: i18n.global.t('appPageTitle.ldap'),
        },
      },
      {
        path: '/notices',
        name: 'notices',
        component: Notices,
        meta: {
          title: i18n.global.t('appPageTitle.notices'),
        },
      },
    ],
  },
];

export default routes;
