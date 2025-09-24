<template>
  <b-modal
    id="modal-reset"
    ref="modal"
    v-model="openResetLinkModal"
    :title="
      i18n.global.t('pagePcieTopology.modal.resetLinkHeader', {
        id: resetType,
      })
    "
    title-tag="h2"
    @hidden="resetConfirm"
  >
    <p class="mb-2">
      <strong>{{
        i18n.global.t('pagePcieTopology.modal.resetConfirm')
      }}</strong>
    </p>
    <div>
      {{ i18n.global.t('pagePcieTopology.modal.resetLinkDescription') }}
    </div>

    <template #footer="{ cancel }">
      <b-button
        variant="secondary"
        data-test-id="factoryReset-button-cancel"
        @click="cancel()"
      >
        {{ i18n.global.t('global.action.cancel') }}
      </b-button>
      <b-button
        type="sumbit"
        variant="danger"
        data-test-id="factoryReset-button-confirm"
        @click="handleConfirm"
      >
        {{
          i18n.global.t('pagePcieTopology.modal.resetLinkHeader', {
            id: resetType,
          })
        }}
      </b-button>
    </template>
  </b-modal>
</template>

<script setup>
import stores from '../../../store';
import useVuelidate from '@vuelidate/core';
import useToast from '@/components/Composables/useToastComposable';
import { ref, computed, nextTick } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';

const { successToast, errorToast } = useToast();
const pcieTopologyStore = stores.PcieTopologyStore();
const globalStore = stores.GlobalStore();
const props = defineProps({
  resetType: {
    type: Number,
    default: null,
  },
  resetUri: {
    type: String,
    default: '',
  },
});
const openResetLinkModal = ref(false);
const confirm = ref(false);
const modal = ref(null);

eventBus.on('modal-reset', () => {
  openResetLinkModal.value = true;
});

const serverStatus = computed(() => {
  return globalStore.serverStatus;
});

const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});

function mustBeTrue(value) {
  return isServerOff.value || value === true;
}

//Validation Rules
const rules = computed(() => ({
  confirm: {
    mustBeTrue,
  },
}));
const v$ = useVuelidate(rules, { confirm });

function handleConfirm() {
  resetLink();
  v$.value.$touch();
  if (v$.value.$invalid) return;
  nextTick(() => modal.value.hide());
  resetConfirm();
}
function resetConfirm() {
  confirm.value = false;
  v$.value.$reset();
  nextTick(() => {
    openResetLinkModal.value = false;
  });
}
function resetLink() {
  pcieTopologyStore
    .resetTheLink({ uri: props.resetUri })
    .then(() => {
      successToast(
        i18n.global.t('pagePcieTopology.toast.successReset', {
          id: props.resetType,
        }),
      );
    })
    .catch(() => {
      errorToast(
        i18n.global.t('pagePcieTopology.toast.errorReset', {
          id: props.resetType,
        }),
      );
    });
  nextTick(() => modal.value.hide());
}
</script>
