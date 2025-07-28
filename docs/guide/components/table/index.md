# Table

All tables in the application are using the [Boostrap-vue-next table
component](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html).

To use the component, include the `<BTable>` tag in the template. The component
is registered globally so does not need to be imported in each SFC.

## Basic table
There are a few required properties to maintain consistency across the
application. The full list of options can be viewed on the [Bootstrap-vue-next table
component's documentation
page](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html#table-helper-components).


### Required properties

- `items` - renders table items
- `fields` - renders table header
- `hover` - enables table row hover state
- `responsive` or `stacked` - makes the table responsive (enables horizontal
  scrolling or stacked view) at the defined breakpoint
- `show-empty` *(required if table data is generated dynamically)* - shows an
  empty message if there are no items in the table
- `empty-text` *(required if table data is generated dynamically)* - the
  translated empty message

![Basic table example](./table.png) ![Basic empty table
example](./table-empty.png)

```vue
<template>
  <BTable
    hover
    show-empty
    responsive="md"
    :items="items"
    :fields="fields"
    :empty-text="$t('global.table.emptyMessage')"
  />
</template>

<script setup>
import { ref } from 'vue';

const items = ref([
        {
          name: 'Babe',
          age: '3 years',
          color: 'white, orange, grey'
        },
        {
          name: 'Grey Boy',
          age: '4 months',
          color: 'grey'
        },
      ]);
const fields = ref([
        {
          key: 'name',
          label: i18n.global.t('table.name') //translated label
        },
        {
          key: 'age',
          label: i18n.global.t('table.age') //translated label
        },
        {
          key: 'color',
          label: i18n.global.t('table.color') // translated label
        }
      ]);
</script>
```

## Sort

To enable table sort, include `sortable: true` in the fields array for sortable
columns and add the following props to the `<BTable>` component:

- `sort-by`
- `no-sort-reset`
- `sort-icon-left`

![Table sort example](./table-sort.png)


```vue
<template>
  <BTable
    hover
    no-sort-reset
    sort-icon-left
    sort-by="rank"
    responsive="md"
    :items="items"
    :fields="fields"
  />
</template>
<script setup>
import { ref } from 'vue';

const items = ref([...]);
const fields = ref([
        {
          key: 'name',
          label: 'Name', //should be translated
          sortable: true
        },
        {
          key: 'rank',
          label: 'Rank', //should be translated
          sortable: true
        },
        {
          key: 'description',
          label: 'Description', //should be translated
          sortable: false
        }
      ]);
</script>
```

## Expandable rows

To add an expandable row in the table, add a column for the expand button in the
fields array. Include the tdClass `table-row-expand` to ensure icon rotation is
handled. Use the built in [cell
slot](https://bootstrap-vue.org/docs/components/table#comp-ref-BTable-slots) to
target the expand button column and add a button with the chevron icon.

Include the
[useTableRowExpandComposable](https://github.com/openbmc/webui-vue/blob/master/src/components/Mixins/TableRowExpandMixin.js).
The composable contains the dynamic `aria-label` and `title` attribute values that
need to be included with the expand button. The `toggleRowDetails` method should
be the button's click event callback. Be sure to pass the `row` object to the
function.

Use the [row-details
slot](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html#row-details-support) to
format the expanded row content. The slot has access to the row `item` property.

### Summary

1. Add a column for the expansion row button with the tdClass,
   `table-row-expand`
2. Include the `useTableRowExpandComposable` to handle the dynamic aria label, title,
   and row expansion toggling
3. Use the `#cell` slot to target the expandable row column and add the button
   with accessible markup and click handler
4. Use the `#row-details` slot to format expanded row content

![Table row expand example](./table-expand-row.png)

```vue
<template>
  <BTable
    hover
    responsive="md"
    :items="items"
    :fields="fields"
  >
    <template #cell(expandRow)="row">
      <BButton
        variant="link"
        :aria-label="expandRowLabel"
        :title="expandRowLabel"
        @click="toggleRowDetails(row)"
      >
        <icon-chevron />
      </BButton>
    </template>
    <template #row-details="row">
      <h3>Expanded row details</h3>
      {{ row.item }}
    </template>
  </BTable>
</template>
<script setup>
import { ref } from 'vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import useTableRowExpandComposable from "../../../components/Composables/useTableRowExpandComposable";

const { expandRowLabel } = useTableRowExpandComposable();

const items =ref([...]);
const fields = ref([
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
        },
        ...
      ])
</script>
```

## Search

The table is leveraging [BootstrapVue table
filtering](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html#filtering) for
search. Add the
[@filtered](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/table.html#filter-events) event
listener onto the `<BTable>` component. The event callback should track the
total filtered items count.

Import the `<search>` and `<table-cell-count>` components and include them in
the template above the `<BTable>` component.

Include the
[useSearchFilterComposable](https://github.com/openbmc/webui-vue/blob/master/src/components/Mixins/SearchFilterMixin.js).
Add the `@change-search` and `@clear-search` event listeners on the `<search>`
component and use the corresponding `onChangeSearchInput` and
`onClearSearchInput` methods as the event callbacks. The table should also
include the dynamic `:filter` prop with `searchFilter` set as the value.

The `<table-cell-count>` component requires two properties, total table item
count and total filtered items count.

Add the `:empty-filtered-text` prop to the table to show the translated message
if there are no search matches.

![Table search example](./table-search.png)

![Table search active example](./table-search-active.png)

![Table search empty example](./table-search-empty.png)

```vue
<template>
  <BContainer>
  <BRow>
    <BCol>
      <search
        @changeSearch="onChangeSearchInput"
        @clearSearch="onClearSearchInput"
      />
    </BCol>
    <BCol>
      <table-cell-count
        :filtered-items-count="filteredItemsCount"
        :total-number-of-cells="items.length"
      />
    </BCol>
  </BRow>
  <BTable
    hover
    responsive="md"
    :items="items"
    :fields="fields"
    :filter="searchFilter"
    :empty-filtered-text="$t('global.table.emptySearchMessage')"
    @filtered="onFiltered"
  />
  </BContainer>
</template>
<script setup>
import { ref, computed } from 'vue';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import useSearchFilterComposable from "../../../components/Composables/useSearchFilterComposable";

const { searchFilterInput } = useSearchFilterComposable();

const items = ref([...]);
const fields = ref([...]);
const filteredItems = ref([]);

const filteredItemsCount = computed(() => {
      return filteredItems.value.length;
    });

const onFiltered = (items) => {
      filteredItems.value = items.value;
    };
</script>
```

## Row actions

To add table row actions, add a column for the action buttons in the table. Then
in the array of table items, add a corresponding array of actions for each item.
The array should have each desired row action with a `value` and `title`
property.

Import the `<table-row-action>` component. Provide the `value` and `title` props
to the component and use the named `#icons` slot to include an icon. The
component will emit a `@click-table-action` with the event value.

![Table row actions example](./table-row-actions.png)

```vue
<template>
  <BTable
    hover
    responsive="md"
    :items="itemsWithActions"
    :fields="fields"
  >
    <template #cell(actions)="row">
      <table-row-action
        v-for="(action, index) in row.item.actions"
        :key="index"
        :value="action.value"
        :title="action.title"
        @click-table-action="onTableRowAction($event, row.item)"
      />
        <template #icon>
          <icon-edit v-if="action.value === 'edit'"/>
          <icon-delete v-if="action.value === 'delete'"/>
        </template>
      </table-row-action>
    </template>
  </BTable>
</template>
<script>
import { ref } from 'vue';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import TableRowAction from '@/components/Global/TableRowAction.vue';

const items = ref([...]);
const fields = ref([
        ...,
        {
          key: 'actions',
          label: '',
          tdClass: 'text-right text-nowrap',
        }
      ]);

const itemsWithActions = computed(() => {
      return items.value.map((item) => {
        return {
          ...item,
          actions: [
            {
              value: 'edit',
              title: i18n.global.t('global.action.edit'),
            },
            {
              value: 'delete',
              title: i18n.global.t('global.action.delete'),
            },
          ],
        };
      });
    });
const onTableRowAction = (event, row) => {
      // row action callback
    };
</script>
```

## Filters

To add a table dropdown filter:
1. Import the `<table-filter> `component and useTableFilterComposable.
1. Add a filters prop to the `<table-filters>` component. This prop should be an
   array of filter groups–each required to have a key, label, and values prop.

The `label` prop value should be the translated filter group label. The `key`
prop will usually match the filtered by table column key. The `values` prop
should be an array of filter values that will render as a list of checkbox items
in the dropdown.

The component will emit a `@filter-change` event that will provide the filter
group and all selected values in the group. Use the getFilteredTableData method
from the useTableFilterComposable to show the filtered table data.

![Table filter example](./table-filter.png)

![Table filter active example](./table-filter-active.png)

```vue
<template>
  <b-container>
    <BRow>
      <BCol class="text-right">
        <table-filter
          :filters="tableFilters"
          @filter-change="onTableFilterChange"
        />
      </BCol>
    </BRow>
    <BTable
      hover
      responsive="md"
      :items="filteredItems"
      :fields="fields"
    />
  </b-container>
</template>
<script setup>
import { ref, computed } from 'vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';

const { getFilteredTableData } = useTableFilterComposable();

const items = ref([...]);
const fields = ref([...]);
const tableFilters = ref([
        {
          label: i18n.global.t('table.status'),
          key: status,
          values: ['Open', 'Closed']
        }
      ]);
const activeFilters = ref([]);

const filteredItems = computed(() => {
      return getFilteredTableData(items.value, activeFilters.value);
    });

const onTableFilterChange = ({ activeFilters }) => {
      activeFilters.value = activeFilters;
    };
</script>
```


### Date filter

To add a date filter, import the `<table-date-filter>` component. It will emit a
`@change` event with the user input date values. There is a date filter method,
`getFilteredTableDataByDate`, in the `useTableFilterComposable`.


## Batch actions

Batch actions allow a user to take a single action on many items in a table at
once.

To add table batch actions:
1. Import the `<table-toolbar> `component and useTableSelectableComposable
1. Add the `selectable`, `no-select-on-click` props and a unique `ref` to the
   table. The table will emit a `@row-selected` event. Use the `onRowSelected`
   composable method as a callback and provide the `$event` as the first argument and
   the total table items count as the second argument.
1. Add a table column for checkboxes. The table header checkbox should use the
   `tableHeaderCheckboxModel` and `tableHeaderCheckboxIndeterminate` values
   provided by the composable. The table header checkbox should also use the
   `onChangeHeaderCheckbox` method as a callback for the `@change` event with
   the table `ref` passed as an argument. The table row checkboxes should use
   the `toggleSelectRow` method as a callback for the `@change` event with the
   table `ref` passed as the first argument and the row index passed as the
   second argument.
1. Add an actions prop to the `<table-toolbar>` component. This prop should be
   an array of toolbar actions–required to have a value and label prop. Add the
   `selected-items-count` prop to the `<table-toolbar>` component. The component
   will emit a `@batch-action` event that will provide the user selected action.
   It will also emit a `@clear-selected` event. Provide the `clearSelectedRows`
   as a callback with the table `ref` passed as an argument.

![Table batch action example](./table-batch-action.png)

![Table batch action active example](./table-batch-action-active.png)

```vue
<template>
  <b-container>
    <table-toolbar
      :selected-items-count="selectedRows.length"
      :actions="tableToolbarActions"
      @clear-selected="clearSelectedRows($refs.table)"
      @batch-action="onBatchAction"
    />
    <BTable
      ref="table"
      hover
      selectable
      no-select-on-click
      responsive="md"
      :items="filteredItems"
      :fields="fields"
      @row-selected="onRowSelected($event, items.length)"
    >
      <template #head(checkbox)>
        <BFormCheckbox
          v-model="tableHeaderCheckboxModel"
          :indeterminate="tableHeaderCheckboxIndeterminate"
          @change="onChangeHeaderCheckbox($refs.table)"
        />
      </template>
      <template #cell(checkbox)="row">
        <BFormCheckbox
          v-model="row.rowSelected"
          @change="toggleSelectRow($refs.table, row.index)"
        />
      </template>
    </BTable>
  </b-container>
</template>
<script>
import { ref } from 'vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';

const {
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();

const items = ref([...]);
const fields = ref([
        {
          key: 'checkbox'
        },
        ...
      ]);
const tableToolbarActions = ref([
        {
          value: 'edit',
          label: i18n.global.t('global.action.edit')
        },
        {
          value: 'delete',
          label: i18n.global.t('global.action.delete')
        }
      ])

const onBatchAction = (action) => {
      // Do something with selected batch action and selected rows
    };
</script>
```


## Pagination

To add table pagination:
1. Import the usePaginationComposable
1. Add the `per-page` and `current-page` props to the `<table>` component.
1. Add the below HTML snippet to the template. Make sure to update the
   `total-rows` prop.

```vue{21}
<BRow>
  <BCol sm="6">
    <BFormGroup
      class="table-pagination-select"
      :label="$t('global.table.itemsPerPage')"
      label-for="pagination-items-per-page"
    >
      <BFormSelect
        id="pagination-items-per-page"
        v-model="perPage"
        :options="itemsPerPageOptions"
      />
    </BFormGroup>
  </BCol>
  <BCol sm="6">
    <b-pagination
      v-model="currentPage"
      first-number
      last-number
      :per-page="perPage"
      :total-rows="getTotalRowCount(items.length)"
      aria-controls="table-event-logs"
    />
  </BCol>
</BRow>
```
![Table pagination example](./table-pagination.png)

```vue
<template>
  <BContainer>
    <BTable
      hover
      responsive="md"
      :items="filteredItems"
      :fields="fields"
      :per-page="perPage"
      :current-page="currentPage"
    />
    <BRow>
      <BCol sm="6">
        <BFormGroup
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <BFormSelect
            id="pagination-items-per-page"
            v-model="perPage"
            :options="itemsPerPageOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <b-pagination
          v-model="currentPage"
          first-number
          last-number
          :per-page="perPage"
          :total-rows="getTotalRowCount(items.length)"
          aria-controls="table-event-logs"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>
<script>
import { ref } from 'vue';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';

const { currentPage, perPage, itemsPerPageOptions } =
  usePaginationComposable();

const tems = ref([...]);
const fields = ref([..]);

</script>
```