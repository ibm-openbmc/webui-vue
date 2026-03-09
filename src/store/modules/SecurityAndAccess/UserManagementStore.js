import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';
import { defineStore } from 'pinia';

export const UserManagementStore = defineStore('userManagment', {
  state: () => ({
    allUsers: [],
    accountRoles: [],
    accountLockoutDuration: null,
    accountLockoutThreshold: null,
    accountMinPasswordLength: null,
    accountMaxPasswordLength: null,
    isGlobalMfaEnabled: false,
    isCurrentUserMfaBypassed: false,
    secretKeyInfo: null,
  }),
  getters: {
    allUsersGetter(state) {
      return state.allUsers;
    },
    accountRolesGetter(state) {
      return state.accountRoles;
    },
    filteredAccountRoles(state) {
      return state.accountRoles.filter((role) => role !== 'OemIBMServiceAgent');
    },
    accountSettingsGetter(state) {
      return {
        lockoutDuration: state.accountLockoutDuration,
        lockoutThreshold: state.accountLockoutThreshold,
      };
    },
    accountPasswordRequirementsGetter(state) {
      return {
        minLength: state.accountMinPasswordLength,
        maxLength: state.accountMaxPasswordLength,
      };
    },
    isGlobalMfaEnabledGetter(state) {
      return state.isGlobalMfaEnabled;
    },
    isCurrentUserMfaBypassedGetter(state) {
      return state.isCurrentUserMfaBypassed;
    },
    secretKeyInfoGetter(state) {
      return state.secretKeyInfo;
    },
  },
  actions: {
    async getUsers() {
      return await api
        .get('/redfish/v1/AccountService/Accounts')
        .then((response) =>
          response.data.Members.map((user) => user['@odata.id']),
        )
        .then(async (userIds) => {
          return await api
            .all(userIds.map((user) => api.get(user)))
            .then((users) => {
              const userData = users.map((user) => user.data);
              this.allUsers = userData;
              this.allUsers.map((user) => {
                user.isSelected = false;
              });
            })
            .catch((error) => {
              console.log(error);
              const message = i18n.global.t(
                'pageUserManagement.toast.errorLoadUsers',
              );
              throw new Error(message);
            });
        })
        .catch((error) => {
          console.log(error);
          let message = '';
          if (
            error.response.data['@Message.ExtendedInfo'] &&
            error.response.data['@Message.ExtendedInfo'][0].MessageId.endsWith(
              'GenerateSecretKeyRequired',
            )
          ) {
            message = 'otpRequired';
          } else {
            message = i18n.global.t('pageUserManagement.toast.errorLoadUsers');
          }
          throw new Error(message);
        });
    },
    getAccountSettings() {
      api
        .get('/redfish/v1/AccountService')
        .then(({ data }) => {
          this.accountLockoutDuration = data.AccountLockoutDuration;
          this.accountLockoutThreshold = data.AccountLockoutThreshold;
          this.accountMinPasswordLength = data.MinPasswordLength;
          this.accountMaxPasswordLength = data.MaxPasswordLength;
          this.isGlobalMfaEnabled =
            data.MultiFactorAuth?.GoogleAuthenticator?.Enabled;
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageUserManagement.toast.errorLoadAccountSettings',
          );
          throw new Error(message);
        });
    },
    getAccountRoles() {
      return api
        .get('/redfish/v1/AccountService/Roles')
        .then(async ({ data: { Members = [] } = {} }) => {
          return await api.all(
            Members.map(async (member) => {
              return await api
                .get(member['@odata.id'])
                .then(async ({ data }) => {
                  return await data.Description;
                });
            }),
          );
        })
        .then((res) => {
          this.accountRoles = res;
        })
        .catch((error) => console.log(error));
    },
    async createUser({ username, password, privilege, status }) {
      const data = {
        UserName: username,
        Password: password,
        RoleId: privilege,
        Enabled: status,
      };
      return await api
        .post('/redfish/v1/AccountService/Accounts', data)
        .then(() => this.getUsers())
        .then(() =>
          i18n.global.t('pageUserManagement.toast.successCreateUser', {
            username,
          }),
        )
        .catch((error) => {
          console.log(error);

          const errorMsg = error.response?.data?.error?.code;

          switch (true) {
            case REGEX_MAPPINGS.propertyValueFormatError.test(errorMsg):
              throw new Error(
                i18n.global.t(
                  'pageUserManagement.toast.errorCreateUserPasswordNotAccepted',
                  {
                    username,
                  },
                ),
              );
            case REGEX_MAPPINGS.createLimitReachedForResource.test(errorMsg):
              throw new Error(
                i18n.global.t(
                  'pageUserManagement.toast.errorCreateUserMaxUsers',
                  {
                    username,
                  },
                ),
              );
            default:
              throw new Error(
                i18n.global.t('pageUserManagement.toast.errorCreateUser', {
                  username,
                }),
              );
          }
        });
    },
    async updateUserfromUserManagement({
      originalUsername,
      currentUser,
      username,
      password,
      privilege,
      status,
      locked,
    }) {
      const data = {};
      const notReadOnly =
        privilege !== 'ReadOnly' &&
        (currentUser ? currentUser.RoleId !== 'ReadOnly' : true);
      if (username) data.UserName = username;
      if (password) data.Password = password;
      if (privilege && notReadOnly) {
        data.RoleId = privilege;
      } else if (
        privilege &&
        privilege === 'ReadOnly' &&
        (currentUser ? currentUser.RoleId !== 'ReadOnly' : true)
      ) {
        data.RoleId = privilege;
      }
      if (status !== undefined) data.Enabled = status;
      if (locked !== undefined) data.Locked = locked;
      return await api
        .patch(`/redfish/v1/AccountService/Accounts/${originalUsername}`, data)
        .then(() => this.getUsers())
        .then(() =>
          i18n.global.t('pageUserManagement.toast.successUpdateUser', {
            username: originalUsername,
          }),
        )
        .catch((error) => {
          const messageId = error?.response?.data?.error?.code;
          const message = REGEX_MAPPINGS.propertyValueFormatError.test(
            messageId,
          )
            ? i18n.global.t(
                'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
                {
                  username: originalUsername,
                },
              )
            : i18n.global.t('pageUserManagement.toast.errorUpdateUser', {
                username: originalUsername,
              });
          throw new Error(message);
        });
    },
    async updateUser({
      originalUsername,
      username,
      password,
      privilege,
      status,
      locked,
    }) {
      const data = {};
      if (username) data.UserName = username;
      if (password) data.Password = password;
      if (privilege) data.RoleId = privilege;
      if (status !== undefined) data.Enabled = status;
      if (locked !== undefined) data.Locked = locked;
      return await api
        .patch(`/redfish/v1/AccountService/Accounts/${originalUsername}`, data)
        .then(() =>
          i18n.global.t('pageUserManagement.toast.successUpdateUser', {
            username: originalUsername,
          }),
        )
        .catch((error) => {
          console.log(error);

          const messageId =
            error.response.data['Password@Message.ExtendedInfo'][0].MessageId;

          const message = REGEX_MAPPINGS.propertyValueFormatError.test(
            messageId,
          )
            ? i18n.global.t(
                'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
                {
                  username: originalUsername,
                },
              )
            : i18n.global.t('pageUserManagement.toast.errorUpdateUser', {
                username: originalUsername,
              });
          throw new Error(message);
        });
    },
    async deleteUser(username) {
      return await api
        .delete(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(() => {
          this.getUsers();
          return i18n.global.t('pageUserManagement.toast.successDeleteUser', {
            username,
          });
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageUserManagement.toast.errorDeleteUser',
            {
              username,
            },
          );
          throw new Error(message);
        });
    },
    async deleteUsers(users) {
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
          this.getUsers();
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.successBatchDelete',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.errorBatchDelete',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          }),
        );
    },
    async enableUsers(users) {
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
          this.getUsers();
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.successBatchEnable',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.errorBatchEnable',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          }),
        );
    },
    async disableUsers(users) {
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
          this.getUsers();
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];

            if (successCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.successBatchDisable',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.global.t(
                'pageUserManagement.toast.errorBatchDisable',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          }),
        );
    },
    async saveAccountSettings({ lockoutThreshold, lockoutDuration }) {
      const data = {};
      if (lockoutThreshold !== undefined) {
        data.AccountLockoutThreshold = lockoutThreshold;
      }
      if (lockoutDuration !== undefined) {
        data.AccountLockoutDuration = lockoutDuration;
      }

      return await api
        .patch('/redfish/v1/AccountService', data)
        .then(() => this.getAccountSettings())
        .then(() =>
          i18n.global.t('pageUserManagement.toast.successSaveSettings'),
        )
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageUserManagement.toast.errorSaveSettings',
          );
          throw new Error(message);
        });
    },

    async updateGlobalMfa({ globalMfa }) {
      this.isGlobalMfaEnabled = globalMfa;
      const requestBody = {
        MultiFactorAuth: {
          GoogleAuthenticator: {
            Enabled: globalMfa,
          },
        },
      };
      return await api
        .patch('/redfish/v1/AccountService', requestBody)
        .then(() => {
          this.getUsers();
          if (globalMfa) {
            return i18n.global.t('pageUserManagement.toast.successEnableMfa');
          } else {
            return i18n.global.t('pageUserManagement.toast.successDisableMfa');
          }
        })
        .catch((error) => {
          this.isGlobalMfaEnabled = !globalMfa;
          console.log('error', error);
          this.getAccountSettings();
          if (globalMfa) {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorEnableMfa'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorDisableMfa'),
            );
          }
        });
    },

    async clearSetSecretKey(mfaObject) {
      return await api
        .post(mfaObject['@odata.id'] + '/Actions/ManagerAccount.ClearSecretKey')
        .then(() => {
          this.getUsers();
          return i18n.global.t(
            'pageUserManagement.toast.successClearSecretKey',
          );
        })
        .catch((error) => {
          this.getUsers();
          console.log('error', error);
          throw new Error(
            i18n.global.t('pageUserManagement.toast.errorClearSecretKey'),
          );
        });
    },
    async updateMfaBypass(mfaObject) {
      const requestBody = {
        MFABypass: {
          BypassTypes: mfaObject.mfa ? ['GoogleAuthenticator'] : [],
        },
      };
      return await api
        .patch(mfaObject['@odata.id'], requestBody)
        .then(() => {
          if (mfaObject.mfa) {
            return i18n.global.t(
              'pageUserManagement.toast.successEnableMfaBypass',
            );
          } else {
            return i18n.global.t(
              'pageUserManagement.toast.successDisableMfaBypass',
            );
          }
        })
        .catch((error) => {
          this.getUsers();
          console.log('error', error);
          if (mfaObject.mfa) {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorEnableMfaBypass'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorDisableMfaBypass'),
            );
          }
        });
    },
    async updateMfaBypassNewUser({ userData, mfaByPass }) {
      const requestBody = {
        MFABypass: {
          BypassTypes: mfaByPass ? ['GoogleAuthenticator'] : ['None'],
        },
      };
      return await api
        .patch(
          `/redfish/v1/AccountService/Accounts/${userData.username}`,
          requestBody,
        )
        .then(() => this.getUsers())
        .catch((error) => {
          console.log('error', error);
          if (mfaByPass) {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorEnableMfaBypass'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageUserManagement.toast.errorDisableMfaBypass'),
            );
          }
        });
    },
    async checkCurrentUserMfaBypassed({ uri }) {
      api.get(uri).then(({ data }) => {
        this.isCurrentUserMfaBypassed = data?.MFABypass?.BypassTypes.includes(
          'GoogleAuthenticator',
        );
      });
    },
    async clearSecretKey() {
      this.secretKeyInfo = null;
      return;
    },
    async generateSecretKey() {
      const currentUsername = localStorage.getItem('storedUsername');
      return api
        .post(
          `/redfish/v1/AccountService/Accounts/${currentUsername}/Actions/ManagerAccount.GenerateSecretKey`,
        )
        .then(({ data }) => {
          this.secretKeyInfo = data?.SecretKey;
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(error);
        });
    },

    async verifyRegisterTotp({ otpValue }) {
      const requestBody = {
        TimeBasedOneTimePassword: otpValue,
      };
      const currentUsername = localStorage.getItem('storedUsername');
      return await api
        .post(
          `/redfish/v1/AccountService/Accounts/${currentUsername}/Actions/ManagerAccount.VerifyTimeBasedOneTimePassword`,
          requestBody,
        )
        .then(() => {
          this.getUsers();
          return i18n.global.t('pageUserManagement.toast.successEnableMfa');
        })
        .catch(() => {
          throw new Error(i18n.global.t('pageUserManagement.toast.errorOtp'));
        });
    },
  },
});

export default UserManagementStore;
