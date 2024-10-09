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
import Power from '@/views/ResourceManagement/Power';
import PowerRestorePolicy from '@/views/Settings/PowerRestorePolicy';
import ConcurrentMaintenance from '../views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenance.vue';
import IBMiServiceFunctions from '@/views/Logs/IBMiServiceFunctions';
import Notices from '@/views/Notices/Notices.vue';
import Sessions from '@/views/SecurityAndAccess/Sessions';
import Firmware from '@/views/Operations/Firmware';
import Certificates from '@/views/SecurityAndAccess/Certificates';

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
        path: '/operations/virtual-media',
        name: 'virtual-media',
        component: VirtualMedia,
        meta: {
          title: i18n.global.t('appPageTitle.virtualMedia'),
          exclusiveToRoles: [roles.administrator],
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
        path: '/logs/ibmi-service-functions',
        name: 'ibmiServiceFunctions',
        component: IBMiServiceFunctions,
        meta: {
          title: i18n.global.t('appPageTitle.ibmiServiceFunctions'),
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
        path: '/settings/power-restore-policy',
        name: 'power-restore-policy',
        component: PowerRestorePolicy,
        meta: {
          title: i18n.global.t('appPageTitle.powerRestorePolicy'),
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
