import api from '@/store/api';
import i18n from '@/i18n';
import { find } from 'lodash';
import { defineStore } from 'pinia';

export const LdapStore = defineStore('ldapStore', {
  namespaced: true,
  state: () => ({
    isServiceEnabled: null,
    ldap: {
      serviceEnabled: null,
      serviceAddress: null,
      bindDn: null,
      baseDn: null,
      userAttribute: null,
      groupsAttribute: null,
      roleGroups: [],
    },
    activeDirectory: {
      serviceEnabled: null,
      serviceAddress: null,
      bindDn: null,
      baseDn: null,
      userAttribute: null,
      groupsAttribute: null,
      roleGroups: [],
    },
  }),
  getters: {
    isServiceEnabledGetter: (state) => state.isServiceEnabled,
    ldapGetter: (state) => state.ldap,
    activeDirectoryGetter: (state) => state.activeDirectory,
    isActiveDirectoryEnabledGetter: (state) => {
      return state.activeDirectory.serviceEnabled;
    },
    enabledRoleGroups: (state) => {
      const serviceType = state.isActiveDirectoryEnabledGetter
        ? 'activeDirectory'
        : 'ldap';
      return state[serviceType].roleGroups;
    },
  },

  actions: {
    setServiceEnabled(serviceEnabled) {
      this.isServiceEnabled = serviceEnabled;
    },
    setLdapProperties({
      ServiceEnabled,
      ServiceAddresses = [],
      Authentication = {},
      LDAPService: {
        SearchSettings: {
          BaseDistinguishedNames = [],
          UsernameAttribute,
          GroupsAttribute,
        } = {},
      } = {},
      RemoteRoleMapping = [],
    }) {
      this.ldap.serviceAddress = ServiceAddresses[0];
      this.ldap.serviceEnabled = ServiceEnabled;
      this.ldap.baseDn = BaseDistinguishedNames[0];
      this.ldap.bindDn = Authentication.Username;
      this.ldap.userAttribute = UsernameAttribute;
      this.ldap.groupsAttribute = GroupsAttribute;
      this.ldap.roleGroups = RemoteRoleMapping;
    },
    setActiveDirectoryProperties({
      ServiceEnabled,
      ServiceAddresses = [],
      Authentication = {},
      LDAPService: {
        SearchSettings: {
          BaseDistinguishedNames = [],
          UsernameAttribute,
          GroupsAttribute,
        } = {},
      } = {},
      RemoteRoleMapping = [],
    }) {
      this.activeDirectory.serviceEnabled = ServiceEnabled;
      this.activeDirectory.serviceAddress = ServiceAddresses[0];
      this.activeDirectory.bindDn = Authentication.Username;
      this.activeDirectory.baseDn = BaseDistinguishedNames[0];
      this.activeDirectory.userAttribute = UsernameAttribute;
      this.activeDirectory.groupsAttribute = GroupsAttribute;
      this.activeDirectory.roleGroups = RemoteRoleMapping;
    },
    async getAccountSettings() {
      return await api
        .get('/redfish/v1/AccountService')
        .then(({ data: { LDAP = {}, ActiveDirectory = {} } }) => {
          const ldapEnabled = LDAP.ServiceEnabled;
          const activeDirectoryEnabled = ActiveDirectory.ServiceEnabled;

          this.setServiceEnabled(ldapEnabled || activeDirectoryEnabled);
          this.setLdapProperties(LDAP);
          this.setActiveDirectoryProperties(ActiveDirectory);
        })
        .catch((error) => console.log(error));
    },
    async saveLdapSettings(properties) {
      const data = { LDAP: properties };
      if (this.activeDirectory.serviceEnabled) {
        // Disable Active Directory service if enabled
        await api.patch('/redfish/v1/AccountService', {
          ActiveDirectory: { ServiceEnabled: false },
        });
      }
      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() => i18n.global.t('pageLdap.toast.successSaveLdapSettings'))
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageLdap.toast.errorSaveLdapSettings'),
          );
        });
    },
    async saveActiveDirectorySettings(properties) {
      const data = { ActiveDirectory: properties };

      if (this.ldap.serviceEnabled) {
        // Disable LDAP service if enabled
        await api.patch('/redfish/v1/AccountService', {
          LDAP: { ServiceEnabled: false },
        });
      }
      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() =>
          i18n.global.t('pageLdap.toast.successSaveActiveDirectorySettings'),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageLdap.toast.errorSaveActiveDirectorySettings'),
          );
        });
    },
    async saveAccountSettings({
      serviceEnabled,
      serviceAddress,
      activeDirectoryEnabled,
      bindDn,
      bindPassword,
      baseDn,
      userIdAttribute,
      groupIdAttribute,
    }) {
      const data = {
        ServiceEnabled: serviceEnabled,
        ServiceAddresses: [serviceAddress],
        Authentication: {
          Username: bindDn,
          Password: bindPassword,
        },
        LDAPService: {
          SearchSettings: {
            BaseDistinguishedNames: [baseDn],
            GroupsAttribute: groupIdAttribute,
            UsernameAttribute: userIdAttribute,
          },
        },
      };

      if (activeDirectoryEnabled) {
        return await this.saveActiveDirectorySettings(data);
      } else {
        return await this.saveLdapSettings(data);
      }
    },
    async addNewRoleGroup({ groupName, groupPrivilege }) {
      const data = {};
      const enabledRoleGroups = this.enabledRoleGroups;
      const isActiveDirectoryEnabled = this.isActiveDirectoryEnabledGetter;
      const RemoteRoleMapping = [
        ...enabledRoleGroups,
        {
          LocalRole: groupPrivilege,
          RemoteGroup: groupName,
        },
      ];
      if (isActiveDirectoryEnabled) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }
      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() =>
          i18n.global.t('pageLdap.toast.successAddRoleGroup', {
            groupName,
          }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.global.t('pageLdap.toast.errorAddRoleGroup'));
        });
    },
    async saveRoleGroup({ groupNamePreviously, groupName, groupPrivilege }) {
      const data = {};
      const enabledRoleGroups = this.enabledRoleGroups;
      const isActiveDirectoryEnabled = this.isActiveDirectoryEnabledGetter;
      const RemoteRoleMapping = enabledRoleGroups.map((group) => {
        if (group.RemoteGroup === groupNamePreviously) {
          return {
            RemoteGroup: groupName,
            LocalRole: groupPrivilege,
          };
        } else {
          return {};
        }
      });
      if (isActiveDirectoryEnabled) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }
      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() =>
          i18n.global.t('pageLdap.toast.successSaveRoleGroup', { groupName }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.global.t('pageLdap.toast.errorSaveRoleGroup'));
        });
    },
    async deleteRoleGroup({ roleGroups = [] }) {
      const data = {};
      const enabledRoleGroups = this.enabledRoleGroups;
      const isActiveDirectoryEnabled = this.isActiveDirectoryEnabledGetter;
      const RemoteRoleMapping = enabledRoleGroups.map((group) => {
        if (find(roleGroups, { groupName: group.RemoteGroup })) {
          return null;
        } else {
          return {};
        }
      });
      if (isActiveDirectoryEnabled) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }
      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() =>
          i18n.global.t(
            'pageLdap.toast.successDeleteRoleGroup',
            roleGroups.length,
          ),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t(
              'pageLdap.toast.errorDeleteRoleGroup',
              roleGroups.length,
            ),
          );
        });
    },
  },
});

export default LdapStore;
