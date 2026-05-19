<template>
  <BModal
    v-model="showHelp"
    size="lg"
    :title="$t('global.help.title')"
    scrollable
    @hidden="onClose"
  >
    <!-- Search Input -->
    <div class="help-search mb-4">
      <BInputGroup>
        <BInputGroupText>
          <icon-search />
        </BInputGroupText>
        <BFormInput
          ref="searchInputRef"
          v-model="searchQuery"
          :placeholder="$t('global.help.searchPlaceholder')"
          @input="handleSearch"
        />
        <BButton
          v-if="searchQuery"
          variant="link"
          class="clear-button"
          @click="clearSearch"
        >
          <icon-close />
        </BButton>
      </BInputGroup>

      <!-- NLP Intent Display -->
      <div
        v-if="parsedIntent && searchQuery && parsedIntent.isQuestion"
        class="mt-2 text-muted small"
      >
        <icon-help-filled class="me-1" />
        {{ $t('global.help.questionDetected') }}
        <span v-if="parsedIntent.action" class="ms-2">
          {{ $t('global.help.action') }}:
          <strong>{{ parsedIntent.action }}</strong>
        </span>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchQuery && hasResults" class="search-results">
      <h6 class="mb-3">
        {{ $t('global.help.searchResults') }} ({{ totalResults }})
      </h6>

      <!-- Help Sections -->
      <div v-if="displaySectionResults.length > 0" class="mb-4">
        <h6 class="text-muted small mb-3">
          {{ $t('global.help.helpSections') }}
        </h6>
        <BCard
          v-for="result in displaySectionResults"
          :key="result.id"
          class="mb-2 help-result-card"
          @click="selectSection(result)"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-2">{{ result.title }}</h6>
              <p class="mb-2 text-muted small" style="white-space: pre-wrap">
                {{ result.content }}
              </p>
            </div>
            <icon-arrow-right class="ms-2 text-muted" />
          </div>
        </BCard>
      </div>

      <!-- FAQs -->
      <div v-if="displayFaqResults.length > 0">
        <h6 class="text-muted small mb-3">{{ $t('global.help.faqs') }}</h6>
        <BCard
          v-for="(result, index) in displayFaqResults"
          :key="`faq-${index}`"
          class="mb-2 help-result-card"
          @click="selectFAQ(result)"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-2">
                <icon-help class="me-2" />{{ result.question }}
              </h6>
              <p class="mb-2 text-muted small" style="white-space: pre-wrap">
                {{ result.answer }}
              </p>
            </div>
            <icon-arrow-right class="ms-2 text-muted" />
          </div>
        </BCard>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="searchQuery && !hasResults" class="text-center py-5">
      <icon-search :size="32" class="mb-3 text-muted" />
      <p class="text-muted mb-2">{{ $t('global.help.noResults') }}</p>
      <p class="small text-muted">{{ $t('global.help.tryDifferentSearch') }}</p>
    </div>

    <!-- Default Help Content (when no search) -->
    <div v-else class="help-content">
      <!-- Overview -->
      <BCard class="mb-3 bg-light">
        <h5 class="mb-3">{{ helpContent.help.title }}</h5>
        <p class="mb-0">{{ helpContent.help.overview }}</p>
      </BCard>

      <!-- Quick Actions -->
      <div v-if="helpContent.help.quickActions" class="mb-4">
        <h6 class="mb-3">{{ $t('global.help.quickActions') }}</h6>
        <div class="d-flex flex-wrap gap-2">
          <BButton
            v-for="action in helpContent.help.quickActions"
            :key="action.action"
            variant="outline-primary"
            size="sm"
            @click="executeQuickAction(action)"
          >
            {{ action.label }}
          </BButton>
        </div>
      </div>

      <!-- Tips -->
      <div v-if="helpContent.help.tips" class="mb-4">
        <h6 class="mb-3">{{ $t('global.help.tips') }}</h6>
        <BListGroup>
          <BListGroupItem
            v-for="(tip, index) in helpContent.help.tips"
            :key="index"
            class="border-0 ps-0"
          >
            <icon-lightbulb class="me-2 text-warning" />
            {{ tip }}
          </BListGroupItem>
        </BListGroup>
      </div>

      <!-- All Sections -->
      <div class="help-sections">
        <h6 class="mb-3">{{ $t('global.help.allTopics') }}</h6>
        <BAccordion>
          <BAccordionItem
            v-for="section in helpContent.help.sections"
            :key="section.id"
            :title="section.title"
          >
            <p>{{ section.content }}</p>

            <div v-if="section.steps && section.steps.length > 0" class="mt-3">
              <strong>{{ $t('global.help.steps') }}:</strong>
              <ol class="mt-2">
                <li
                  v-for="(step, index) in section.steps"
                  :key="index"
                  class="mb-1"
                >
                  {{ step }}
                </li>
              </ol>
            </div>

            <BAlert v-if="section.warning" variant="warning" show class="mt-3">
              <icon-warning class="me-2" />
              <strong>{{ $t('global.help.warning') }}:</strong>
              {{ section.warning }}
            </BAlert>

            <BAlert v-if="section.note" variant="info" show class="mt-3">
              <icon-information class="me-2" />
              <strong>{{ $t('global.help.note') }}:</strong> {{ section.note }}
            </BAlert>
          </BAccordionItem>
        </BAccordion>
      </div>
    </div>

    <template #footer>
      <BButton variant="secondary" @click="closeHelp">
        {{ $t('global.action.close') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
  BModal,
  BButton,
  BCard,
  BInputGroup,
  BInputGroupText,
  BFormInput,
  BBadge,
  BAlert,
  BAccordion,
  BAccordionItem,
  BListGroup,
  BListGroupItem,
} from 'bootstrap-vue-next';
import IconSearch from '@carbon/icons-vue/es/search/20';
import IconClose from '@carbon/icons-vue/es/close/20';
import IconHelp from '@carbon/icons-vue/es/help/20';
import IconHelpFilled from '@carbon/icons-vue/es/help--filled/20';
import IconLightbulb from '@carbon/icons-vue/es/light--filled/20';
import IconWarning from '@carbon/icons-vue/es/warning/20';
import IconInformation from '@carbon/icons-vue/es/information/20';
import IconArrowRight from '@carbon/icons-vue/es/arrow--right/20';
import { useHelpSearch } from '@/components/Composables/useHelpSearch';
import { useNLPParser } from '@/components/Composables/useNLPParser';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  helpContent: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'action']);

const showHelp = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const searchInputRef = ref(null);
const parsedIntent = ref(null);

// Initialize composables
const {
  searchQuery,
  sectionResults,
  faqResults,
  clearSearch: clearHelpSearch,
} = useHelpSearch(props.helpContent);

const { parseQuery, matchHelpSections, matchFAQs } = useNLPParser();

// Parse query with NLP when user types
watch(searchQuery, (newQuery) => {
  if (newQuery && newQuery.trim().length > 2) {
    parsedIntent.value = parseQuery(newQuery);
  } else {
    parsedIntent.value = null;
  }
});

// Get NLP-enhanced results when intent is parsed
const displaySectionResults = computed(() => {
  if (!parsedIntent.value) {
    return sectionResults.value;
  }

  const nlpMatches = matchHelpSections(parsedIntent.value, props.helpContent);
  if (nlpMatches.length > 0) {
    return nlpMatches.map((m) => ({ ...m.section, relevance: m.relevance }));
  }

  return sectionResults.value;
});

const displayFaqResults = computed(() => {
  if (!parsedIntent.value) {
    return faqResults.value;
  }

  const nlpMatches = matchFAQs(parsedIntent.value, props.helpContent);
  if (nlpMatches.length > 0) {
    return nlpMatches.map((m) => ({ ...m.faq, relevance: m.relevance }));
  }

  return faqResults.value;
});

const hasResults = computed(() => {
  return (
    displaySectionResults.value.length > 0 || displayFaqResults.value.length > 0
  );
});

const totalResults = computed(() => {
  return displaySectionResults.value.length + displayFaqResults.value.length;
});

// Focus search input when modal opens
watch(showHelp, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

const handleSearch = () => {
  // Search is reactive through computed properties
};

const clearSearch = () => {
  clearHelpSearch();
  parsedIntent.value = null;
};

const selectSection = (section) => {
  // Could expand the section in the accordion or show details
  clearSearch();
  // Scroll to section in the accordion
  const sectionIndex = props.helpContent.help.sections.findIndex(
    (s) => s.id === section.id,
  );
  if (sectionIndex !== -1) {
    // The accordion will handle the display
  }
};

const selectFAQ = (faq) => {
  // Could show FAQ details or copy answer
  console.log('Selected FAQ:', faq);
};

const executeQuickAction = (action) => {
  emit('action', action.action);
  closeHelp();
};

const closeHelp = () => {
  showHelp.value = false;
};

const onClose = () => {
  clearSearch();
};

const getRelevanceBadge = (relevance) => {
  const badges = {
    high: 'success',
    medium: 'warning',
    low: 'secondary',
  };
  return badges[relevance] || 'secondary';
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
</script>

<style lang="scss" scoped>
.help-search {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  padding-bottom: 0.5rem;

  :deep(.input-group) {
    border: 1px solid #8d8d8d;
    transition:
      border-color 0.11s,
      border-width 0.11s;

    &:focus-within {
      border: 2px solid #0f62fe;
      outline: none;
    }

    .input-group-text {
      background-color: #f4f4f4;
      border: 0 !important;
      padding: 0.75rem 1rem;
    }

    .form-control {
      border: 0 !important;
      background-color: #f4f4f4;
      padding: 0.75rem 1rem;
      font-size: 1rem;

      &:focus {
        box-shadow: none !important;
        background-color: #f4f4f4;
        outline: 0 !important;
        border: 0 !important;
      }

      &::placeholder {
        color: #6f6f6f;
      }
    }

    .btn {
      border: 0 !important;
      background-color: transparent;

      &:focus {
        box-shadow: none !important;
        outline: 0 !important;
        border: 0 !important;
      }
    }
  }
}

.clear-button {
  padding: 0.375rem 0.75rem;
  border: none;
  background-color: transparent;

  &:hover {
    background-color: transparent;
  }

  &:focus {
    box-shadow: none;
    outline: none;
  }
}

.help-result-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #dee2e6;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: #0066cc;
  }
}

.help-content {
  max-height: 60vh;
  overflow-y: auto;
}

.search-results {
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.accordion-button) {
  font-weight: 500;
}

:deep(.list-group-item) {
  background-color: transparent;
}
</style>
