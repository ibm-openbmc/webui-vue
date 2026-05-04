import { ref, computed } from 'vue';
import Fuse from 'fuse.js';

/**
 * Composable for searching help content using Fuse.js
 * Provides fuzzy search with typo tolerance and relevance scoring
 */
export function useHelpSearch(helpContent) {
  const searchQuery = ref('');

  // Configure Fuse.js for optimal help content search
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'content', weight: 2 },
      { name: 'keywords', weight: 2.5 },
      { name: 'steps', weight: 1.5 },
      { name: 'question', weight: 3 },
      { name: 'answer', weight: 2 },
    ],
    threshold: 0.3, // 0 = perfect match, 1 = match anything
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true,
    useExtendedSearch: false,
  };

  /**
   * Create searchable help index from help content
   * Combines sections and FAQs into a flat searchable structure
   */
  const helpIndex = computed(() => {
    if (!helpContent?.help) return [];

    const searchableContent = [];

    // Add help sections
    if (helpContent.help.sections) {
      helpContent.help.sections.forEach((section) => {
        searchableContent.push({
          type: 'section',
          id: section.id,
          title: section.title,
          content: section.content,
          keywords: section.keywords || [],
          steps: section.steps || [],
          warning: section.warning,
          note: section.note,
        });
      });
    }

    // Add FAQs
    if (helpContent.help.faqs) {
      helpContent.help.faqs.forEach((faq, index) => {
        searchableContent.push({
          type: 'faq',
          id: `faq-${index}`,
          question: faq.question,
          answer: faq.answer,
          keywords: faq.keywords || [],
        });
      });
    }

    return searchableContent;
  });

  // Create Fuse instance
  const fuse = computed(() => new Fuse(helpIndex.value, fuseOptions));

  /**
   * Search results with relevance scoring
   */
  const searchResults = computed(() => {
    if (!searchQuery.value || searchQuery.value.trim().length < 2) {
      return [];
    }

    const results = fuse.value.search(searchQuery.value);

    return results.map((result) => ({
      ...result.item,
      score: result.score,
      relevance: getRelevanceLevel(result.score),
    }));
  });

  /**
   * Separate section results
   */
  const sectionResults = computed(() => {
    return searchResults.value.filter((r) => r.type === 'section');
  });

  /**
   * Separate FAQ results
   */
  const faqResults = computed(() => {
    return searchResults.value.filter((r) => r.type === 'faq');
  });

  /**
   * Determine relevance level based on Fuse.js score
   * Lower score = better match
   */
  function getRelevanceLevel(score) {
    if (score < 0.2) return 'high';
    if (score < 0.4) return 'medium';
    return 'low';
  }

  /**
   * Clear search query
   */
  function clearSearch() {
    searchQuery.value = '';
  }

  /**
   * Set search query programmatically
   */
  function setSearchQuery(query) {
    searchQuery.value = query;
  }

  return {
    searchQuery,
    searchResults,
    sectionResults,
    faqResults,
    helpIndex,
    clearSearch,
    setSearchQuery,
  };
}

export default useHelpSearch;

// Made with Bob
