import nlp from 'compromise';

/**
 * Composable for parsing natural language queries
 * Uses Compromise.js for NLP understanding
 */
export function useNLPParser() {
  /**
   * Parse natural language query to extract intent
   * @param {string} query - User's natural language query
   * @returns {Object} Parsed intent with action, target, and context
   */
  const parseQuery = (query) => {
    if (!query || typeof query !== 'string') {
      return null;
    }

    const doc = nlp(query);

    // Extract verbs (actions)
    const verbs = doc.verbs().out('array');
    const action = verbs[0]?.toLowerCase() || '';

    // Extract nouns (targets)
    const nouns = doc.nouns().out('array');
    const target = nouns.map((n) => n.toLowerCase());

    // Extract adjectives (modifiers)
    const adjectives = doc.adjectives().out('array');
    const modifiers = adjectives.map((a) => a.toLowerCase());

    // Determine query type
    const isQuestion =
      query.includes('?') ||
      query.toLowerCase().startsWith('how') ||
      query.toLowerCase().startsWith('what') ||
      query.toLowerCase().startsWith('where') ||
      query.toLowerCase().startsWith('when') ||
      query.toLowerCase().startsWith('why') ||
      query.toLowerCase().startsWith('can i') ||
      query.toLowerCase().startsWith('do i');

    // Map common actions to help topics
    const actionMap = {
      delete: ['deleting', 'remove', 'clear', 'erase', 'purge'],
      download: ['export', 'save', 'backup', 'get'],
      filter: ['search', 'find', 'show', 'display', 'view', 'see'],
      resolve: ['fix', 'mark', 'set', 'close', 'complete'],
      view: ['see', 'show', 'display', 'look', 'check', 'open'],
      create: ['add', 'make', 'new', 'generate'],
      edit: ['change', 'modify', 'update', 'alter'],
    };

    // Find matching action category
    let actionCategory = action;
    for (const [category, synonyms] of Object.entries(actionMap)) {
      if (synonyms.includes(action) || action === category) {
        actionCategory = category;
        break;
      }
    }

    return {
      original: query,
      action: actionCategory,
      target,
      modifiers,
      isQuestion,
      verbs,
      nouns,
      adjectives,
    };
  };

  /**
   * Match parsed intent to help sections
   * @param {Object} intent - Parsed intent from parseQuery
   * @param {Object} helpContent - Help content object
   * @returns {Array} Matching help sections with relevance scores
   */
  const matchHelpSections = (intent, helpContent) => {
    const matches = [];

    if (!helpContent?.help?.sections || !intent) {
      return matches;
    }

    helpContent.help.sections.forEach((section) => {
      let score = 0;

      // Check if action matches section keywords
      if (intent.action) {
        if (
          section.keywords.some(
            (kw) => kw.includes(intent.action) || intent.action.includes(kw),
          )
        ) {
          score += 10;
        }
      }

      // Check if target matches section keywords
      intent.target.forEach((t) => {
        if (section.keywords.some((kw) => kw.includes(t) || t.includes(kw))) {
          score += 5;
        }
      });

      // Check if modifiers match
      intent.modifiers.forEach((m) => {
        if (section.keywords.some((kw) => kw.includes(m) || m.includes(kw))) {
          score += 3;
        }
      });

      // Boost score for questions
      if (intent.isQuestion) {
        score += 2;
      }

      // Check title match
      const titleWords = section.title.toLowerCase().split(/\s+/);
      if (intent.target.some((t) => titleWords.includes(t))) {
        score += 8;
      }

      if (score > 0) {
        matches.push({
          section,
          score,
          relevance: score > 10 ? 'high' : score > 5 ? 'medium' : 'low',
        });
      }
    });

    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score);
  };

  /**
   * Find relevant FAQs based on query
   * @param {Object} intent - Parsed intent
   * @param {Object} helpContent - Help content object
   * @returns {Array} Matching FAQs with relevance scores
   */
  const matchFAQs = (intent, helpContent) => {
    const matches = [];

    if (!helpContent?.help?.faqs || !intent) {
      return matches;
    }

    helpContent.help.faqs.forEach((faq) => {
      let score = 0;

      // Parse FAQ question for comparison
      const questionDoc = nlp(faq.question.toLowerCase());
      const questionVerbs = questionDoc.verbs().out('array');
      const questionNouns = questionDoc.nouns().out('array');

      // Match verbs
      if (questionVerbs.some((v) => intent.verbs.includes(v))) {
        score += 10;
      }

      // Match nouns
      intent.nouns.forEach((n) => {
        if (questionNouns.some((qn) => qn.toLowerCase().includes(n))) {
          score += 5;
        }
      });

      // Check keywords
      intent.target.forEach((t) => {
        if (faq.keywords.some((kw) => kw.includes(t) || t.includes(kw))) {
          score += 3;
        }
      });

      // Boost for questions
      if (intent.isQuestion) {
        score += 5;
      }

      // Check if question contains action
      if (intent.action && faq.question.toLowerCase().includes(intent.action)) {
        score += 8;
      }

      if (score > 0) {
        matches.push({
          faq,
          score,
          relevance: score > 10 ? 'high' : score > 5 ? 'medium' : 'low',
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  };

  /**
   * Get suggested queries based on common patterns
   * @param {string} partialQuery - Partial query string
   * @returns {Array} Array of suggested queries
   */
  const getSuggestions = (partialQuery) => {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const commonQueries = [
      'How do I delete logs?',
      'How do I filter by severity?',
      'How do I download logs?',
      'How do I resolve an event?',
      'How do I search logs?',
      'How do I filter by date?',
      'What do severity levels mean?',
      'Can I undo a deletion?',
      'How do I view log details?',
      'How do I delete all logs?',
    ];

    const query = partialQuery.toLowerCase();
    return commonQueries.filter((q) => q.toLowerCase().includes(query));
  };

  /**
   * Extract key phrases from query
   * @param {string} query - User query
   * @returns {Array} Array of key phrases
   */
  const extractKeyPhrases = (query) => {
    if (!query) return [];

    const doc = nlp(query);

    // Get noun phrases
    const nounPhrases = doc.match('#Noun+').out('array');

    // Get verb phrases
    const verbPhrases = doc.match('#Verb+ #Noun+').out('array');

    return [...new Set([...nounPhrases, ...verbPhrases])];
  };

  return {
    parseQuery,
    matchHelpSections,
    matchFAQs,
    getSuggestions,
    extractKeyPhrases,
  };
}

export default useNLPParser;

// Made with Bob
