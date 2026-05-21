import nlp from 'compromise';

/**
 * Composable for parsing natural language queries
 * Uses Compromise.js for NLP understanding with enhanced synonym support
 */
export function useNLPParser() {
  /**
   * Synonym dictionary for expanding search terms
   */
  const synonymMap = {
    // Temperature related
    temperature: [
      'temp',
      'thermal',
      'heat',
      'hot',
      'cold',
      'degrees',
      'celsius',
    ],

    // Logs related
    logs: [
      'log',
      'events',
      'event',
      'entries',
      'records',
      'history',
      'logging',
    ],

    // Status related
    status: ['state', 'condition', 'health', 'situation'],

    // Severity related
    critical: ['severe', 'urgent', 'emergency', 'serious', 'high priority'],
    warning: ['warn', 'caution', 'alert', 'attention', 'moderate'],

    // Actions
    delete: ['remove', 'erase', 'clear', 'purge', 'clean', 'wipe'],
    download: ['export', 'save', 'get', 'extract', 'backup', 'retrieve'],
    filter: ['narrow', 'refine', 'select', 'choose', 'sort', 'search'],
    view: ['see', 'show', 'display', 'look', 'check', 'browse', 'list'],
    monitor: ['watch', 'track', 'observe', 'follow', 'supervise'],
    configure: ['setup', 'set up', 'customize', 'adjust', 'config'],
    manage: ['control', 'handle', 'administer', 'maintain', 'oversee'],

    // Hardware
    sensor: ['sensors', 'reading', 'readings', 'measurement', 'measurements'],
    fan: ['fans', 'cooling', 'cooler', 'blower'],
    power: ['psu', 'supply', 'supplies', 'wattage', 'watts'],
    voltage: ['volts', 'volt', 'electrical'],

    // Network
    network: ['networking', 'net', 'connection', 'connectivity'],

    // User management
    user: ['users', 'account', 'accounts', 'login', 'credentials'],

    // System
    system: ['sys', 'machine', 'server', 'host'],
  };

  /**
   * Expand a term with its synonyms
   * @param {string} term - Term to expand
   * @returns {Array} Array of term and its synonyms
   */
  function expandWithSynonyms(term) {
    const termLower = term.toLowerCase();

    // Check if term is a key or synonym
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (synonyms.includes(termLower) || key === termLower) {
        return [key, ...synonyms];
      }
    }

    return [term];
  }

  /**
   * Enhanced action mapping with more categories
   */
  const actionMap = {
    // Viewing/Reading
    view: [
      'see',
      'show',
      'display',
      'look',
      'check',
      'open',
      'list',
      'browse',
      'view',
      'viewing',
    ],

    // Searching/Finding
    search: ['find', 'locate', 'lookup', 'query', 'search for', 'searching'],
    filter: ['filter', 'narrow', 'refine', 'select', 'choose', 'filtering'],

    // Creating/Adding
    create: ['add', 'make', 'new', 'generate', 'create', 'insert', 'creating'],

    // Modifying
    edit: [
      'change',
      'modify',
      'update',
      'alter',
      'configure',
      'set',
      'adjust',
      'editing',
    ],

    // Deleting/Removing
    delete: [
      'delete',
      'remove',
      'clear',
      'erase',
      'purge',
      'clean',
      'deleting',
    ],

    // Downloading/Exporting
    download: [
      'download',
      'export',
      'save',
      'backup',
      'get',
      'extract',
      'downloading',
    ],

    // Monitoring
    monitor: ['monitor', 'watch', 'track', 'observe', 'follow', 'monitoring'],

    // Resolving/Fixing
    resolve: [
      'resolve',
      'fix',
      'mark',
      'close',
      'complete',
      'address',
      'resolving',
    ],

    // Managing
    manage: [
      'manage',
      'control',
      'handle',
      'administer',
      'maintain',
      'managing',
    ],

    // Configuring
    configure: [
      'configure',
      'setup',
      'set up',
      'customize',
      'adjust settings',
      'configuring',
    ],
  };

  /**
   * Parse natural language query to extract intent
   * @param {string} query - User's natural language query
   * @returns {Object} Parsed intent with action, target, and context
   */
  const parseQuery = (query) => {
    if (!query || typeof query !== 'string') {
      return null;
    }

    const queryLower = query.toLowerCase();
    const doc = nlp(query);

    // Detect common query patterns
    const patterns = {
      howTo: /^how (do i|to|can i)/i,
      whatIs: /^what (is|are|does)/i,
      whereIs: /^where (is|are|can i)/i,
      canI: /^can i/i,
      showMe: /^show (me|all)/i,
      findAll: /^(find|get|list) (all|my)/i,
    };

    let queryType = 'general';
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(queryLower)) {
        queryType = type;
        break;
      }
    }

    // Extract verbs (actions)
    const verbs = doc.verbs().out('array');
    const action = verbs[0]?.toLowerCase() || '';

    // Extract nouns (targets)
    const nouns = doc.nouns().out('array');
    const target = nouns.map((n) => n.toLowerCase());

    // Extract adjectives (modifiers)
    const adjectives = doc.adjectives().out('array');
    const modifiers = adjectives.map((a) => a.toLowerCase());

    // Expand terms with synonyms
    const expandedNouns = nouns.flatMap((noun) => expandWithSynonyms(noun));
    const expandedVerbs = verbs.flatMap((verb) => expandWithSynonyms(verb));

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

    // Find matching action category with better matching
    let actionCategory = action;
    for (const [category, synonyms] of Object.entries(actionMap)) {
      if (synonyms.includes(action) || action === category) {
        actionCategory = category;
        break;
      }
    }

    // Extract key phrases (2-3 word combinations)
    const keyPhrases = extractKeyPhrases(query);

    return {
      original: query,
      action: actionCategory,
      target: expandedNouns,
      modifiers,
      isQuestion,
      queryType,
      verbs: expandedVerbs,
      nouns: expandedNouns,
      adjectives,
      keyPhrases,
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
