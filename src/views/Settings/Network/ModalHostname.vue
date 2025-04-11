<template>
  <BModal
    v-model="modal"
    id="modal-hostname"
    :title="$t('pageNetwork.modal.editHostnameTitle')"
    :ok-title="$t('global.action.save')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="hostname-settings" @submit.prevent="handleSubmit">
      <BRow>
        <BCol>
          <alert variant="warning" class="mb-4">
            <span>
              {{ $t('pageNetwork.hostnameAlert') }}
            </span>
          </alert>
        </BCol>
      </BRow>
      <BRow>
        <BCol sm="6">
          <BFormGroup :label="$t('pageNetwork.hostname')" label-for="hostname">
            <BFormInput
              id="hostname"
              v-model="form.hostname"
              type="text"
              :state="getValidationState(v$.form.hostname)"
              @input="v$.form.hostname.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.hostname.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="v$.form.hostname.validateHostname.$invalid">
                {{ $t('global.form.lengthMustBeBetween', { min: 1, max: 64 }) }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
      </BRow>
    </BForm>
  </BModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers } from '@vuelidate/validators';
import eventBus from '@/eventBus';
import Alert from '@/components/Global/Alert.vue';

const validateHostname = helpers.regex(/^\S{0,64}$/);

const { getValidationState } = useVuelidateComposable();

const emit = defineEmits(['ok', 'hidden']);

const modal = ref(false);
eventBus.on('modal-hostname', () => {
  modal.value = true;
});

const props = defineProps({
  hostname: {
    type: String,
    default: '',
  },
});

const form = ref({
  hostname: '',
});

const rules = computed(() => ({
  form: {
    hostname: {
      required,
      validateHostname,
    },
  },
}));

const v$ = useVuelidate(rules, {
  form,
});

watch(
  () => props.hostname,
  () => {
    form.value.hostname = props.hostname;
  }
);

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', { HostName: form.value.hostname });
  closeModal();
};

const closeModal = () => {
  modal.value = false;
};

const resetForm = () => {
  form.value.hostname = props.hostname;
  v$.value.$reset();
  emit('hidden');
};

const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
