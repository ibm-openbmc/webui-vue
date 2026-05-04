import enUS from '@/locales/en-US.json';
import { useNLPParser } from '@/components/Composables/useNLPParser';
import { hostConsoleSearchContent } from '@/views/Operations/HostConsole/HostConsoleSearchContent.js';
import { firmwareSearchContent } from '@/views/Operations/Firmware/FirmwareSearchContent.js';
import { ldapSearchContent } from '@/views/SecurityAndAccess/Ldap/LdapSearchContent.js';
import { rebootBmcSearchContent } from '@/views/Operations/RebootBmc/RebootBmcSearchContent.js';
import { serverPowerOperationsSearchContent } from '@/views/Operations/ServerPowerOperations/ServerPowerOperationsSearchContent.js';
import { serviceLoginConsolesSearchContent } from '@/views/Operations/ServiceLoginConsoles/ServiceLoginConsolesSearchContent.js';
import { memorySearchContent } from '@/views/ResourceManagement/Memory/MemorySearchContent.js';
import { powerSearchContent } from '@/views/ResourceManagement/Power/PowerSearchContent.js';
import { capacityOnDemandSearchContent } from '@/views/ResourceManagement/CapacityOnDemand/CapacityOnDemandSearchContent.js';
import { fieldCoreOverrideSearchContent } from '@/views/ResourceManagement/FieldCoreOverride/FieldCoreOverrideSearchContent.js';
import { systemParametersSearchContent } from '@/views/ResourceManagement/SystemParameters/SystemParametersSearchContent.js';
import { inventorySearchContent } from '@/views/HardwareStatus/Inventory/InventorySearchContent.js';
import { sensorsSearchContent } from '@/views/HardwareStatus/Sensors/SensorsSearchContent.js';
import { hardwareDeconfigurationSearchContent } from '@/views/Settings/HardwareDeconfiguration/HardwareDeconfigurationSearchContent.js';
import { pcieTopologySearchContent } from '@/views/HardwareStatus/PcieTopology/PcieTopologySearchContent.js';
import { postCodeLogsSearchContent } from '@/views/Logs/PostCodeLogs/PostCodeLogsSearchContent.js';
import { eventLogsSearchContent } from '@/views/Logs/EventLogs/EventLogsSearchContent.js';
import { auditLogsSearchContent } from '@/views/Logs/AuditLogs/AuditLogsSearchContent.js';
import { dumpsSearchContent } from '@/views/Logs/Dumps/DumpsSearchContent.js';
import { deconfigurationRecordsSearchContent } from '@/views/Logs/DeconfigurationRecords/DeconfigurationRecordsSearchContent.js';
import { dateTimeSearchContent } from '@/views/Settings/DateTime/DateTimeSearchContent.js';
import { networkSearchContent } from '@/views/Settings/Network/NetworkSearchContent.js';
import { powerRestorePolicySearchContent } from '@/views/Settings/PowerRestorePolicy/PowerRestorePolicySearchContent.js';
import { snmpAlertsSearchContent } from '@/views/Settings/SnmpAlerts/SnmpAlertsSearchContent.js';
import { factoryResetSearchContent } from '@/views/Operations/FactoryReset/FactoryResetSearchContent.js';
import { sessionsSearchContent } from '@/views/SecurityAndAccess/Sessions/SessionsSearchContent.js';
import { userManagementSearchContent } from '@/views/SecurityAndAccess/UserManagement/UserManagementSearchContent.js';
import { certificatesSearchContent } from '@/views/SecurityAndAccess/Certificates/CertificatesSearchContent.js';
import { policiesSearchContent } from '@/views/SecurityAndAccess/Policies/PoliciesSearchContent.js';
import { keyClearSearchContent } from '@/views/Operations/KeyClear/KeyClearSearchContent.js';
import { noticesSearchContent } from '@/views/Notices/NoticesSearchContent.js';
import { profileSettingsSearchContent } from '@/views/ProfileSettings/ProfileSettingsSearchContent.js';
import { concurrentMaintenanceSearchContent } from '@/views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenanceSearchContent.js';
import { ibmiServiceFunctionsSearchContent } from '@/views/Logs/IBMiServiceFunctions/IBMiServiceFunctionsSearchContent.js';

/**
 * Determine machine model type from model string
 * @param {string} modelType - Model type string from store
 * @returns {string} Machine type category (Everest, NotEverest, etc.)
 */
function getMachineType(modelType) {
  if (!modelType || modelType === '--') {
    return 'Unknown';
  }
  // Everest machines: 9043* or 8860*
  if (modelType.startsWith('9043') || modelType.startsWith('8860')) {
    return 'Everest';
  }
  return 'NotEverest';
}

/**
 * Determine HMC management status
 * @param {string} hmcManaged - HMC managed value from store
 * @returns {string} HMC management status
 */
function getHmcStatus(hmcManaged) {
  return hmcManaged === 'Enabled' ? 'HMCManaged' : 'NonHMCManaged';
}

/**
 * Check if a route is accessible based on restrictions
 * @param {Array} restrictTo - Array of restrictions from navigation config
 * @param {string} roleId - Current user's role ID
 * @param {string} machineType - Current machine type
 * @param {string} hmcStatus - Current HMC management status
 * @returns {boolean} True if route is accessible
 */
function isRouteAccessible(restrictTo, roleId, machineType, hmcStatus) {
  // If no restrictions, route is accessible to all
  if (!restrictTo || restrictTo.length === 0) {
    return true;
  }

  // Check if any restriction matches current context
  return restrictTo.some((restriction) => {
    // Check role-based restrictions
    if (restriction === roleId) return true;
    // Check machine type restrictions
    if (restriction === machineType) return true;
    // Check HMC status restrictions
    if (restriction === hmcStatus) return true;
    return false;
  });
}

/**
 * Get base navigation structure with restrictions
 * This accesses the raw navigation data before filtering
 * @returns {Array} Base navigation array
 */
function getBaseNavigation() {
  // Define base navigation inline for IBM environment
  // This is a simplified version - in production, you might want to import this
  const baseNavigation = [
    {
      id: 'overview',
      children: [],
    },
    {
      id: 'operations',
      children: [
        { id: 'server-power-operations', restrictTo: [] },
        {
          id: 'host-console',
          restrictTo: ['Administrator', 'OemIBMServiceAgent'],
        },
        { id: 'service-login', restrictTo: ['OemIBMServiceAgent'] },
        { id: 'firmware', restrictTo: [] },
        { id: 'reboot-bmc', restrictTo: [] },
      ],
    },
    {
      id: 'resource-management',
      children: [
        { id: 'memory', restrictTo: [] },
        { id: 'power', restrictTo: [] },
        { id: 'capacity-on-demand', restrictTo: [] },
        { id: 'field-core-override', restrictTo: [] },
        { id: 'system-parameters', restrictTo: [] },
      ],
    },
    {
      id: 'hardware-status',
      children: [
        { id: 'inventory', restrictTo: [] },
        { id: 'sensors', restrictTo: [] },
        { id: 'hardware-deconfiguration', restrictTo: [] },
        { id: 'pcie-topology', restrictTo: [] },
        { id: 'concurrent-maintenance', restrictTo: ['Everest'] },
      ],
    },
    {
      id: 'logs',
      children: [
        { id: 'post-code-logs', restrictTo: [] },
        { id: 'event-logs', restrictTo: [] },
        { id: 'audit-logs', restrictTo: [] },
        { id: 'dumps', restrictTo: [] },
        { id: 'ibmi-service-functions', restrictTo: ['NonHMCManaged'] },
        { id: 'deconfiguration-records', restrictTo: [] },
      ],
    },
    {
      id: 'settings',
      children: [
        { id: 'date-time', restrictTo: [] },
        { id: 'network', restrictTo: [] },
        { id: 'power-restore-policy', restrictTo: [] },
        { id: 'snmp-alerts', restrictTo: [] },
        { id: 'factory-reset', restrictTo: [] },
      ],
    },
    {
      id: 'security-and-access',
      children: [
        { id: 'sessions', restrictTo: [] },
        { id: 'user-management', restrictTo: [] },
        { id: 'ldap', restrictTo: [] },
        { id: 'certificates', restrictTo: [] },
        { id: 'policies', restrictTo: [] },
        {
          id: 'key-clear',
          restrictTo: ['Administrator', 'OemIBMServiceAgent'],
        },
      ],
    },
    {
      id: 'notices',
      children: [],
    },
  ];

  return baseNavigation;
}

/**
 * Get navigation item restrictions from navigation data
 * @param {string} routeName - Route name to look up
 * @returns {Array|null} Array of restrictions or null if not found
 */
function getRouteRestrictions(routeName) {
  const baseNavigation = getBaseNavigation();

  // Normalize route name for comparison
  const normalizedRouteName = routeName.toLowerCase().replace(/_/g, '-');

  // Search through navigation items
  for (const section of baseNavigation) {
    if (section.children && section.children.length > 0) {
      for (const child of section.children) {
        // Normalize child id for comparison
        const normalizedChildId = child.id?.toLowerCase().replace(/_/g, '-');

        // Match by route id
        if (normalizedChildId === normalizedRouteName) {
          return child.restrictTo || [];
        }
      }
    } else if (
      section.id?.toLowerCase().replace(/_/g, '-') === normalizedRouteName
    ) {
      return section.restrictTo || [];
    }
  }

  return null;
}

/**
 * Extract all text values from a nested object
 * @param {Object} obj - Object to extract text from
 * @param {Array} results - Array to store results
 * @returns {Array} Array of text values
 */
function extractTextValues(obj, results = []) {
  if (typeof obj === 'string') {
    // Skip references (strings starting with @:)
    if (!obj.startsWith('@:')) {
      results.push(obj.toLowerCase());
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach((value) => {
      extractTextValues(value, results);
    });
  }
  return results;
}

/**
 * Build search index from router routes and locale messages
 * @param {Array} routes - Array of route objects from the router
 * @returns {Object} Search index mapping route names to searchable content
 */
function buildSearchIndex(routes) {
  const searchIndex = {};
  const messages = enUS;

  // Process each route from the router
  routes.forEach((route) => {
    // Skip routes without names or titles, and special routes
    if (
      !route.name ||
      !route.meta?.title ||
      route.path === '/:pathMatch(.*)*' ||
      route.path.includes('/login') ||
      route.path.includes('/console') ||
      route.path.includes('/change-password')
    ) {
      return;
    }

    const routeName = route.name;
    const pageTitle = route.meta.title;
    const searchableContent = new Set();

    // Add the page title - this is the most important searchable content
    if (pageTitle && typeof pageTitle === 'string') {
      // Add the full title
      searchableContent.add(pageTitle.toLowerCase());
      // Also add individual words from the title for better matching
      pageTitle
        .toLowerCase()
        .split(/\s+/)
        .forEach((word) => {
          if (word.length > 2) {
            searchableContent.add(word);
          }
        });
    }

    // Add the route path segments as searchable content
    route.path
      .split('/')
      .filter((segment) => segment && !segment.startsWith(':'))
      .forEach((segment) => {
        searchableContent.add(segment.toLowerCase().replace(/-/g, ' '));
      });

    // Helper function to add search content
    const addSearchContent = (content) => {
      if (content.description) {
        searchableContent.add(content.description.toLowerCase());
      }
      if (content.features) {
        content.features.forEach((feature) => {
          searchableContent.add(feature.toLowerCase());
        });
      }
      if (content.keywords) {
        content.keywords.forEach((keyword) => {
          searchableContent.add(keyword.toLowerCase());
        });
      }
      if (content.relatedTerms) {
        content.relatedTerms.forEach((term) => {
          searchableContent.add(term.toLowerCase());
        });
      }
    };

    // Map of route names to their search content
    const routeSearchContentMap = {
      'host-console': hostConsoleSearchContent,
      firmware: firmwareSearchContent,
      ldap: ldapSearchContent,
      'reboot-bmc': rebootBmcSearchContent,
      'server-power-operations': serverPowerOperationsSearchContent,
      'service-login': serviceLoginConsolesSearchContent,
      memory: memorySearchContent,
      power: powerSearchContent,
      'capacity-on-demand': capacityOnDemandSearchContent,
      'field-core-override': fieldCoreOverrideSearchContent,
      'system-parameters': systemParametersSearchContent,
      inventory: inventorySearchContent,
      sensors: sensorsSearchContent,
      'hardware-deconfiguration': hardwareDeconfigurationSearchContent,
      'pcie-topology': pcieTopologySearchContent,
      'post-code-logs': postCodeLogsSearchContent,
      'event-logs': eventLogsSearchContent,
      'audit-logs': auditLogsSearchContent,
      dumps: dumpsSearchContent,
      'deconfiguration-records': deconfigurationRecordsSearchContent,
      'date-time': dateTimeSearchContent,
      network: networkSearchContent,
      'power-restore-policy': powerRestorePolicySearchContent,
      'snmp-alerts': snmpAlertsSearchContent,
      'factory-reset': factoryResetSearchContent,
      sessions: sessionsSearchContent,
      'local-users': userManagementSearchContent,
      certificates: certificatesSearchContent,
      policies: policiesSearchContent,
      'key-clear': keyClearSearchContent,
      notices: noticesSearchContent,
      'profile-settings': profileSettingsSearchContent,
      'concurrent-maintenance': concurrentMaintenanceSearchContent,
      'ibmi-service-functions': ibmiServiceFunctionsSearchContent,
    };

    // Add custom search content if available for this route
    if (routeSearchContentMap[routeName]) {
      addSearchContent(routeSearchContentMap[routeName]);
    }

    // Try to find related content in the localization file
    const possibleSections = [
      routeName.replace(/-/g, ''),
      routeName.replace(/-/g, ' '),
    ];

    // Search through the entire localization file for related content
    Object.entries(messages).forEach(([sectionKey, sectionValue]) => {
      const sectionKeyLower = sectionKey.toLowerCase();

      // Check if this section might be related to the route
      const isRelated = possibleSections.some((term) =>
        sectionKeyLower.includes(term.toLowerCase()),
      );

      if (isRelated && typeof sectionValue === 'object') {
        // Extract all text from this section
        const texts = extractTextValues(sectionValue);
        texts.forEach((text) => searchableContent.add(text));
      }
    });

    // Also search for the route name in page-specific sections
    const pageSpecificSections = [
      'pageDescription',
      'pageTitle',
      'appPageTitle',
      'appNavigation',
    ];

    pageSpecificSections.forEach((section) => {
      if (messages[section]) {
        Object.entries(messages[section]).forEach(([key, value]) => {
          if (
            typeof value === 'string' &&
            key.toLowerCase().includes(routeName.replace(/-/g, ''))
          ) {
            searchableContent.add(value.toLowerCase());
          }
        });
      }
    });

    // Add navigation category names (Hardware status, Operations, etc.)
    if (messages.appNavigation) {
      const navCategories = [
        'hardwareStatus',
        'logs',
        'operations',
        'resourceManagement',
        'securityAndAccess',
        'settings',
      ];

      navCategories.forEach((category) => {
        if (messages.appNavigation[category]) {
          searchableContent.add(messages.appNavigation[category].toLowerCase());
        }
      });
    }

    searchIndex[routeName] = Array.from(searchableContent);
  });

  return searchIndex;
}

/**
 * Calculate match score based on the number of matched words and match quality
 * @param {Array} searchTerms - Array of search terms from the query
 * @param {Array} contentArray - Array of searchable content for a route
 * @returns {Object} Object containing score, matched terms count, and matched terms
 */
function calculateMatchScore(searchTerms, contentArray) {
  const matchedTerms = new Set();
  let exactMatchScore = 0;
  let partialMatchScore = 0;
  let phraseMatchBonus = 0;

  // Join content array to check for phrase matches
  const fullContent = contentArray.join(' ');
  const searchPhrase = searchTerms.join(' ');

  // Check if the entire search phrase exists in content (highest priority)
  if (fullContent.includes(searchPhrase)) {
    phraseMatchBonus = 1000 * searchTerms.length;
  }

  // Check each search term
  searchTerms.forEach((term) => {
    let termMatched = false;

    contentArray.forEach((content) => {
      if (content.includes(term)) {
        termMatched = true;
        const words = content.split(/\s+/);

        // Exact word match (highest score per term)
        if (words.includes(term)) {
          exactMatchScore += 100;
        }
        // Starts with term (medium-high score)
        else if (content.startsWith(term)) {
          exactMatchScore += 50;
        }
        // Contains term anywhere (lower score)
        else {
          partialMatchScore += 20;
        }
      }
    });

    if (termMatched) {
      matchedTerms.add(term);
    }
  });

  // Calculate final score with word count multiplier
  const matchedCount = matchedTerms.size;
  const totalTerms = searchTerms.length;

  // Base score from matches
  const baseScore = exactMatchScore + partialMatchScore + phraseMatchBonus;

  // Multiplier based on percentage of matched terms
  // All terms matched = 10x multiplier
  // Most terms matched = progressively lower multiplier
  const matchPercentage = matchedCount / totalTerms;
  const matchMultiplier = Math.pow(matchPercentage, 0.5) * 10;

  // Final score prioritizes entries with more matched terms
  const finalScore = baseScore * matchMultiplier + matchedCount * 500;

  return {
    score: finalScore,
    matchedCount,
    matchedTerms: Array.from(matchedTerms),
    matchPercentage,
  };
}

/**
 * Enhance search terms with NLP-parsed intent
 * @param {string} query - Original search query
 * @param {Array} searchTerms - Basic search terms
 * @returns {Object} Enhanced search context with NLP insights
 */
function enhanceSearchWithNLP(query, searchTerms) {
  const { parseQuery } = useNLPParser();
  const parsedIntent = parseQuery(query);

  if (!parsedIntent) {
    return { searchTerms, intent: null };
  }

  // Extract additional search terms from NLP parsing
  const enhancedTerms = new Set(searchTerms);

  // Add action-related terms
  if (parsedIntent.action) {
    enhancedTerms.add(parsedIntent.action);
  }

  // Add target nouns
  if (parsedIntent.target && parsedIntent.target.length > 0) {
    parsedIntent.target.forEach((noun) => enhancedTerms.add(noun));
  }

  // Add modifiers
  if (parsedIntent.modifiers && parsedIntent.modifiers.length > 0) {
    parsedIntent.modifiers.forEach((mod) => enhancedTerms.add(mod));
  }

  return {
    searchTerms: Array.from(enhancedTerms),
    intent: parsedIntent,
  };
}

/**
 * Calculate NLP-enhanced match score
 * @param {Array} searchTerms - Array of search terms
 * @param {Array} contentArray - Array of searchable content
 * @param {Object} intent - Parsed NLP intent
 * @returns {Object} Match result with enhanced scoring
 */
function calculateNLPEnhancedScore(searchTerms, contentArray, intent) {
  // Get base match score
  const baseMatch = calculateMatchScore(searchTerms, contentArray);

  if (!intent) {
    return baseMatch;
  }

  let nlpBonus = 0;

  // Boost score if action matches content
  if (intent.action) {
    const actionMatches = contentArray.some((content) =>
      content.includes(intent.action),
    );
    if (actionMatches) {
      nlpBonus += 200;
    }
  }

  // Boost score if target nouns match
  if (intent.target && intent.target.length > 0) {
    intent.target.forEach((noun) => {
      const nounMatches = contentArray.some((content) =>
        content.includes(noun),
      );
      if (nounMatches) {
        nlpBonus += 150;
      }
    });
  }

  // Extra boost for questions
  if (intent.isQuestion) {
    nlpBonus += 100;
  }

  return {
    ...baseMatch,
    score: baseMatch.score + nlpBonus,
    nlpEnhanced: true,
    nlpBonus,
  };
}

/**
 * Search through the index for matching pages with prioritization based on word matches
 * Enhanced with NLP for better natural language understanding
 * Filters results based on machine type, HMC status, and user role
 * @param {string} query - Search query
 * @param {Array} routes - Array of route objects from the router
 * @param {Object} filterContext - Context for filtering (optional)
 * @param {string} filterContext.modelType - Current machine model type
 * @param {string} filterContext.hmcManaged - HMC management status
 * @param {string} filterContext.roleId - Current user's role ID
 * @returns {Array} Array of matching route names with relevance scores, sorted by match quality
 */
export function searchContent(query, routes, filterContext = {}) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Build search index from current routes
  const searchIndex = buildSearchIndex(routes);

  // Normalize and split search query into terms
  const basicSearchTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  // Enhance search with NLP parsing
  const { searchTerms, intent } = enhanceSearchWithNLP(query, basicSearchTerms);

  const results = [];

  // Determine machine type and HMC status
  const machineType = getMachineType(filterContext.modelType);
  const hmcStatus = getHmcStatus(filterContext.hmcManaged);
  const roleId = filterContext.roleId;

  // Debug logging (can be removed in production)
  if (import.meta.env.DEV) {
    console.log('Search Filter Context:', {
      modelType: filterContext.modelType,
      machineType,
      hmcStatus,
      roleId,
    });
  }

  // Calculate scores for each route with NLP enhancement
  Object.entries(searchIndex).forEach(([routeName, contentArray]) => {
    const matchResult = calculateNLPEnhancedScore(
      searchTerms,
      contentArray,
      intent,
    );

    // Only include results that have at least one matched term
    if (matchResult.matchedCount > 0) {
      // Check if route is accessible based on restrictions
      const restrictions = getRouteRestrictions(routeName);
      let isAccessible = true;

      if (restrictions !== null) {
        isAccessible = isRouteAccessible(
          restrictions,
          roleId,
          machineType,
          hmcStatus,
        );

        // Debug logging for filtered routes
        if (import.meta.env.DEV && !isAccessible) {
          console.log(`Route "${routeName}" filtered out:`, {
            restrictions,
            machineType,
            hmcStatus,
            roleId,
          });
        }
      }

      // Only add to results if accessible
      if (isAccessible) {
        results.push({
          routeName,
          score: matchResult.score,
          matchedTerms: matchResult.matchedTerms,
          matchedCount: matchResult.matchedCount,
          totalTerms: searchTerms.length,
          matchPercentage: matchResult.matchPercentage,
        });
      }
    }
  });

  // Sort results by multiple criteria:
  // 1. Primary: Number of matched terms (descending)
  // 2. Secondary: Match score (descending)
  // 3. Tertiary: Route name (alphabetically for consistency)
  return results.sort((a, b) => {
    // First, prioritize by number of matched terms
    if (b.matchedCount !== a.matchedCount) {
      return b.matchedCount - a.matchedCount;
    }
    // If same number of matches, sort by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // If same score, sort alphabetically by route name
    return a.routeName.localeCompare(b.routeName);
  });
}
