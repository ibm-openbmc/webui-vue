<template>
  <b-modal
    id="modal-network-settings"
    ref="modal"
    size="xl"
    :title="$t('pageServerPowerOperations.modal.networkSettings')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
  >
    Network settings
    <template #modal-footer>
      <div class="w-100">
        <b-button variant="light" size="sm">{{
          $t('pageServerPowerOperations.modal.cancel')
        }}</b-button>
        <b-button variant="primary" size="sm">{{
          $t('pageServerPowerOperations.modal.submit')
        }}</b-button>
      </div>
    </template>
  </b-modal>
</template>
<script>
export default {
  data() {
    return {};
  },
  watch: {},
  methods: {},
};
</script>
