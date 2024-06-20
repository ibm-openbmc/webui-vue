<template>
  <b-modal id="modal-pel-info" scrollable size="lg" hide-footer>
    <template #modal-title> PEL Information</template>
    <pre>{{ pelData.toString() }}</pre>
  </b-modal>
</template>

<script>
export default {
  props: {
    pelData: {
      type: Array,
      default() {
        return [];
      },
    },
  },
};
</script>
