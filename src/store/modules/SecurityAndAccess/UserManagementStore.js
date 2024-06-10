import api from '@/store/api';
import { defineStore } from 'pinia';

export const UserManagementStore = defineStore('userManagement', {
  namespaced: true,
  state: () => {
    return {
      allUsers: [],
    };
  },
  getters: {
    allUsers(state) {
      return state.allUsers;
    },
  },
  actions: {
    async getUsers() {
      return await api
        .get('/redfish/v1/AccountService/Accounts')
        .then((response) => response.data.Members.map((user) => user['@odata.id']))
        .then((userIds) => api.all(userIds.map((user) => api.get(user))))
        .then((users) => {
          const userData = users.map((user) => user.data);
          this.allUsers = userData;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
});

export default UserManagementStore;
