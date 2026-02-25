<template>
  <b-modal
    id="modal-role-group"
    v-model="modal"
    :title="
      roleGroup
        ? $t('pageLdap.modal.editRoleGroup')
        : $t('pageLdap.modal.addNewRoleGroup')
    "
    @ok="onOk"
    @hidden="resetForm"
  >
    <b-container>
      <b-row>
        <b-col sm="8">
          <b-form id="role-group" @submit.prevent="handleSubmit">
            <b-form-group
              :label="$t('pageLdap.modal.groupName')"
              label-for="role-group-name"
            >
              <b-form-input
                id="role-group-name"
                v-model="form.groupName"
                :state="getValidationState(vv$.form.groupName)"
                @input="vv$.form.groupName.$touch()"
              />
              <b-form-invalid-feedback role="alert">
                {{ $t('global.form.fieldRequired') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              :label="$t('pageLdap.modal.groupPrivilege')"
              label-for="privilege"
            >
              <b-form-select
                id="privilege"
                v-model="form.groupPrivilege"
                :options="accountRoles"
                :state="getValidationState(vv$.form.groupPrivilege)"
                @change="vv$.form.groupPrivilege.$touch()"
              >
                <template v-if="!roleGroup" #first>
                  <b-form-select-option :value="null" disabled>
                    {{ $t('global.form.selectAnOption') }}
                  </b-form-select-option>
                </template>
              </b-form-select>
              <b-form-invalid-feedback role="alert">
                {{ $t('global.form.fieldRequired') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </b-container>
    <template #footer="{ cancel }">
      <b-button variant="secondary" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </b-button>
      <b-button form="role-group" type="submit" variant="primary" @click="onOk">
        <template v-if="roleGroup">
          {{ $t('global.action.save') }}
        </template>
        <template v-else>
          {{ $t('global.action.add') }}
        </template>
      </b-button>
    </template>
  </b-modal>
</template>

<script setup>
import { computed, ref, reactive, watch, nextTick } from 'vue';
import { required, requiredIf } from '@vuelidate/validators';
import stores from '../../../store';
import useVuelidate from '@vuelidate/core';
import eventBus from '@/eventBus';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import useLoadingBar from '../../../components/Composables/useLoadingBarComposable';

const { getValidationState } = useVuelidateComposable();
const { hideLoader, startLoader, endLoader, loading } = useLoadingBar();

const userManagementStore = stores.UserManagementStore();

const modal = ref(false);

eventBus.on('modal-role-group', () => {
  modal.value = true;
});

const props = defineProps({
  roleGroup: {
    type: Object,
    default: null,
    validator: (prop) => {
      if (prop === null) return true;
      return (
        Object.prototype.hasOwnProperty.call(prop, 'groupName') &&
        Object.prototype.hasOwnProperty.call(prop, 'groupPrivilege')
      );
    },
  },
});

const form = reactive({
  groupName: null,
  groupPrivilege: null,
});

const accountRoles = computed(() => {
  return userManagementStore.filteredAccountRoles.filter(
    (role) => role !== 'ServiceAgent' && role !== 'Operator',
  );
});

watch(
  () => props.roleGroup,
  (value) => {
    if (value === null) return;
    form.groupName = value.groupName;
    form.groupPrivilege = value.groupPrivilege;
  },
);

const ruless = computed(() => ({
  form: {
    groupName: modal.value
      ? { required: requiredIf(() => !props.roleGroup) }
      : {},
    groupPrivilege: modal.value ? { required } : {},
  },
}));
const vv$ = useVuelidate(ruless, { form });

const emit = defineEmits(['ok']);
function handleSubmit() {
  vv$.value.$touch();
  if (vv$.value.$invalid) return;
  emit('ok', {
    addNew: !props.roleGroup,
    groupNamePreviously: props.roleGroup?.groupName
      ? props.roleGroup?.groupName
      : null,
    groupName: form.groupName,
    groupPrivilege: form.groupPrivilege,
  });
  closeModal();
}

function closeModal() {
  nextTick(() => {
    modal.value = false;
  });
}

function resetForm() {
  form.groupName = null;
  form.groupPrivilege = null;
  vv$.value.$reset();
  eventBus.emit('hidden');
}
function onOk(bvModalEvt) {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
}
</script>
