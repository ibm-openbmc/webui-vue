import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';

const UserManagementStore = {
  namespaced: true,
  state: {
    allUsers: [],
    accountRoles: [],
    accountLockoutDuration: null,
    accountLockoutThreshold: null,
    accountMinPasswordLength: null,
    accountMaxPasswordLength: null,
  },
  getters: {
    allUsers(state) {
      return state.allUsers;
    },
    accountRoles(state) {
      return state.accountRoles;
    },
    filteredAccountRoles(state) {
      return state.accountRoles.filter((role) => role !== 'OemIBMServiceAgent');
    },
    accountSettings(state) {
      return {
        lockoutDuration: state.accountLockoutDuration,
        lockoutThreshold: state.accountLockoutThreshold,
      };
    },
    accountPasswordRequirements(state) {
      return {
        minLength: state.accountMinPasswordLength,
        maxLength: state.accountMaxPasswordLength,
      };
    },
  },
  mutations: {
    setUsers(state, allUsers) {
      state.allUsers = allUsers;
    },
    setAccountRoles(state, accountRoles) {
      state.accountRoles = accountRoles;
    },
    setLockoutDuration(state, lockoutDuration) {
      state.accountLockoutDuration = lockoutDuration;
    },
    setLockoutThreshold(state, lockoutThreshold) {
      state.accountLockoutThreshold = lockoutThreshold;
    },
    setAccountMinPasswordLength(state, minPasswordLength) {
      state.accountMinPasswordLength = minPasswordLength;
    },
    setAccountMaxPasswordLength(state, maxPasswordLength) {
      state.accountMaxPasswordLength = maxPasswordLength;
    },
  },
  actions: {
    async getUsers({ commit }) {
      return await api
        .get('/redfish/v1/AccountService/Accounts')
        .then((response) =>
          response.data.Members.map((user) => user['@odata.id'])
        )
        .then((userIds) => api.all(userIds.map((user) => api.get(user))))
        .then((users) => {
          const userData = users.map((user) => user.data);
          commit('setUsers', userData);
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.t('pageUserManagement.toast.errorLoadUsers');
          throw new Error(message);
        });
    },
    getAccountSettings({ commit }) {
      api
        .get('/redfish/v1/AccountService')
        .then(({ data }) => {
          commit('setLockoutDuration', data.AccountLockoutDuration);
          commit('setLockoutThreshold', data.AccountLockoutThreshold);
          commit('setAccountMinPasswordLength', data.MinPasswordLength);
          commit('setAccountMaxPasswordLength', data.MaxPasswordLength);
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.t(
            'pageUserManagement.toast.errorLoadAccountSettings'
          );
          throw new Error(message);
        });
    },
    getAccountRoles({ commit }) {
      api
        .get('/redfish/v1/AccountService/Roles')
        .then(async ({ data: { Members = [] } = {} }) => {
          return await api.all(
            Members.map(async (member) => {
              return await api
                .get(member['@odata.id'])
                .then(async ({ data }) => {
                  return await data.Description;
                });
            })
          );
        })
        .then((res) => {
          commit('setAccountRoles', res);
        })
        .catch((error) => console.log(error));
    },
    async createUser({ dispatch }, { username, password, privilege, status }) {
      const data = {
        UserName: username,
        Password: password,
        RoleId: privilege,
        Enabled: status,
      };
      return await api
        .post('/redfish/v1/AccountService/Accounts', data)
        .then(() => dispatch('getUsers'))
        .then(() =>
          i18n.t('pageUserManagement.toast.successCreateUser', {
            username,
          })
        )
        .catch((error) => {
          console.log(error);

          const errorMsg = error.response?.data?.error?.code;

          switch (true) {
            case REGEX_MAPPINGS.propertyValueFormatError.test(errorMsg):
              throw new Error(
                i18n.t(
                  'pageUserManagement.toast.errorCreateUserPasswordNotAccepted',
                  {
                    username,
                  }
                )
              );
            case REGEX_MAPPINGS.createLimitReachedForResource.test(errorMsg):
              throw new Error(
                i18n.t('pageUserManagement.toast.errorCreateUserMaxUsers', {
                  username,
                })
              );
            default:
              throw new Error(
                i18n.t('pageUserManagement.toast.errorCreateUser', {
                  username,
                })
              );
          }
        });
    },
    async updateUserfromUserManagement(
      { dispatch },
      {
        originalUsername,
        currentUser,
        username,
        password,
        privilege,
        status,
        locked,
      }
    ) {
      const data = {};
      const notReadOnly =
        privilege !== 'ReadOnly' && currentUser.RoleId !== 'ReadOnly';
      if (username) data.UserName = username;
      if (password) data.Password = password;
      if (privilege && notReadOnly) {
        data.RoleId = privilege;
      } else if (
        privilege &&
        privilege === 'ReadOnly' &&
        currentUser.RoleId !== 'ReadOnly'
      ) {
        data.RoleId = privilege;
      }
      if (status !== undefined) data.Enabled = status;
      if (locked !== undefined) data.Locked = locked;
      return await api
        .patch(`/redfish/v1/AccountService/Accounts/${originalUsername}`, data)
        .then(() => dispatch('getUsers'))
        .then(() =>
          i18n.t('pageUserManagement.toast.successUpdateUser', {
            username: originalUsername,
          })
        )
        .catch((error) => {
          const messageId = error?.response?.data?.error?.code;
          const message = REGEX_MAPPINGS.propertyValueFormatError.test(
            messageId
          )
            ? i18n.t(
                'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
                {
                  username: originalUsername,
                }
              )
            : i18n.t('pageUserManagement.toast.errorUpdateUser', {
                username: originalUsername,
              });
          throw new Error(message);
        });
    },
    async updateUser(
      { dispatch },
      { originalUsername, username, password, privilege, status, locked }
    ) {
      const data = {};
      if (username) data.UserName = username;
      if (password) data.Password = password;
      if (privilege) data.RoleId = privilege;
      if (status !== undefined) data.Enabled = status;
      if (locked !== undefined) data.Locked = locked;
      return await api
        .patch(`/redfish/v1/AccountService/Accounts/${originalUsername}`, data)
        .then(() => dispatch('getUsers'))
        .then(() =>
          i18n.t('pageUserManagement.toast.successUpdateUser', {
            username: originalUsername,
          })
        )
        .catch((error) => {
          console.log(error);

          const messageId =
            error.response.data['Password@Message.ExtendedInfo'][0].MessageId;

          const message = REGEX_MAPPINGS.propertyValueFormatError.test(
            messageId
          )
            ? i18n.t(
                'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
                {
                  username: originalUsername,
                }
              )
            : i18n.t('pageUserManagement.toast.errorUpdateUser', {
                username: originalUsername,
              });
          throw new Error(message);
        });
    },
    async deleteUser({ dispatch }, username) {
      return await api
        .delete(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(() => dispatch('getUsers'))
        .then(() =>
          i18n.t('pageUserManagement.toast.successDeleteUser', {
            username,
          })
        )
        .catch((error) => {
          console.log(error);
          const message = i18n.t('pageUserManagement.toast.errorDeleteUser', {
            username,
          });
          throw new Error(message);
        });
    },
    async deleteUsers({ dispatch }, users) {
      const promises = users.map(({ username }) => {
        return api
          .delete(`/redfish/v1/AccountService/Accounts/${username}`)
          .catch((error) => {
            console.log(error);
            return error;
          });
      });
      return await api
        .all(promises)
        .then((response) => {
          dispatch('getUsers');
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.successBatchDelete',
                successCount
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.errorBatchDelete',
                errorCount
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          })
        );
    },
    async enableUsers({ dispatch }, users) {
      const data = {
        Enabled: true,
      };
      const promises = users.map(({ username }) => {
        return api
          .patch(`/redfish/v1/AccountService/Accounts/${username}`, data)
          .catch((error) => {
            console.log(error);
            return error;
          });
      });
      return await api
        .all(promises)
        .then((response) => {
          dispatch('getUsers');
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.successBatchEnable',
                successCount
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.errorBatchEnable',
                errorCount
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          })
        );
    },
    async disableUsers({ dispatch }, users) {
      const data = {
        Enabled: false,
      };
      const promises = users.map(({ username }) => {
        return api
          .patch(`/redfish/v1/AccountService/Accounts/${username}`, data)
          .catch((error) => {
            console.log(error);
            return error;
          });
      });
      return await api
        .all(promises)
        .then((response) => {
          dispatch('getUsers');
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.successBatchDisable',
                successCount
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.tc(
                'pageUserManagement.toast.errorBatchDisable',
                errorCount
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          })
        );
    },
    async saveAccountSettings(
      { dispatch },
      { lockoutThreshold, lockoutDuration }
    ) {
      const data = {};
      if (lockoutThreshold !== undefined) {
        data.AccountLockoutThreshold = lockoutThreshold;
      }
      if (lockoutDuration !== undefined) {
        data.AccountLockoutDuration = lockoutDuration;
      }

      return await api
        .patch('/redfish/v1/AccountService', data)
        //GET new settings to update view
        .then(() => dispatch('getAccountSettings'))
        .then(() => i18n.t('pageUserManagement.toast.successSaveSettings'))
        .catch((error) => {
          console.log(error);
          const message = i18n.t('pageUserManagement.toast.errorSaveSettings');
          throw new Error(message);
        });
    },
  },
};

export default UserManagementStore;
