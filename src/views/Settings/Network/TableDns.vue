<template>
  <page-section :section-title="$t('pageNetwork.staticDns')">
    <BRow>
      <BCol lg="6">
        <div class="text-right">
          <BButton variant="primary" @click="initDnsModal()">
            <icon-add />
            {{ $t('pageNetwork.table.addDnsAddress') }}
          </BButton>
        </div>
        <BTable
          responsive="md"
          hover
          selectable
          no-select-on-click
          sort-icon-left
          sticky-header="75vh"
          :fields="dnsTableFields"
          :items="form.dnsStaticTableItems"
          :empty-text="$t('global.table.emptyMessage')"
          class="mb-0"
          show-empty
        >
          <template #cell(actions)="{ item, index }">
            <table-row-action
              v-for="(action, actionIndex) in item.actions"
              :key="actionIndex"
              :value="action.value"
              :title="action.title"
              :enabled="action.enabled"
              @click-table-action="onDnsTableAction(action, $event, index)"
            >
              <template #icon>
                <icon-edit v-if="action.value === 'edit'" />
                <icon-trashcan v-if="action.value === 'delete'" />
              </template>
            </table-row-action>
          </template>
        </BTable>
      </BCol>
    </BRow>
  </page-section>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import PageSection from '@/components/Global/PageSection.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import { NetworkStore } from '@/store';

const { successToast, errorToast } = useToast();

const networkStore = NetworkStore();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const form = ref({
  dnsStaticTableItems: [],
});

const actions = ref([
  {
    value: 'edit',
    title: i18n.global.t('global.action.edit'),
  },
  {
    value: 'delete',
    title: i18n.global.t('global.action.delete'),
  },
]);

const dnsTableFields = ref([
  {
    key: 'address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
  },
  { key: 'actions', label: '', tdClass: 'text-right' },
]);

onBeforeMount(() => {
  getStaticDnsItems();
});

const network = computed(() => {
  return networkStore.networkSettingsGetter;
});

// Watch for change in tab index
watch(
  () => props.tabIndex,
  () => {
    getStaticDnsItems();
  }
);

watch(network, () => {
  getStaticDnsItems();
});

const getStaticDnsItems = () => {
  const index = props.tabIndex;
  const dns = network.value[index].staticNameServers || [];
  form.value.dnsStaticTableItems = dns.map((server) => {
    return {
      address: server,
      actions: [
        {
          value: 'delete',
          title: i18n.global.t('pageNetwork.table.deleteDns'),
        },
      ],
    };
  });
};

const onDnsTableAction = (action, $event, index) => {
  if ($event === 'delete') {
    deleteDnsTableRow(index);
  }
};

const deleteDnsTableRow = (index) => {
  form.value.dnsStaticTableItems.splice(index, 1);
  const newDnsArray = form.value.dnsStaticTableItems.map((dns) => {
    return dns.address;
  });
  networkStore
    .editDnsAddress(newDnsArray)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
};

const initDnsModal = () => {
  eventBus.emit('modal-dns');
};
</script>
<style lang="scss" scoped>
:deep(.text-right) {
  text-align: right;
}
</style>
