import React from 'react';
import * as dagre from 'dagre';
import { MarkerType } from 'reactflow';

// Custom Person Node Component with generation indicator
export const PersonNode = ({ data }) => {
  const genderColor = {
    male: '#3b82f6',
    female: '#ec4899',
    other: '#9ca3af',
  }[data.gender] || '#9ca3af';

  const isDeceased = data.isAlive === false;
  const opacity = isDeceased ? 0.6 : 1;

  // Generation label helper
  const getGenerationLabel = (level) => {
    if (level === 0) return 'Root';
    if (level < 0) {
      const absLevel = Math.abs(level);
      if (absLevel === 1) return 'Parent';
      if (absLevel === 2) return 'Grandparent';
      if (absLevel === 3) return 'Great-Grandparent';
      return `${absLevel}× Great-Grandparent`;
    }
    if (level > 0) {
      if (level === 1) return 'Child';
      if (level === 2) return 'Grandchild';
      if (level === 3) return 'Great-Grandchild';
      return `${level}× Great-Grandchild`;
    }
    return '';
  };

  return (
    <div
      className={`person-node ${data.isIncludedInPreviousTree ? 'duplicate-person' : ''}`}
      style={{
        backgroundColor: genderColor,
        opacity,
        borderWidth: data.generationLevel === 0 ? '4px' : '3px',
        borderStyle: data.isIncludedInPreviousTree ? 'dashed' : 'solid',
      }}
      data-generation={data.generationLevel}
    >
      {data.generationLevel !== undefined && (
        <div className="generation-badge" title={getGenerationLabel(data.generationLevel)}>
          G{data.generationLevel > 0 ? '+' : ''}{data.generationLevel}
        </div>
      )}
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt={data.name}
          className="person-avatar"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div className="person-info">
        <div className="person-name">{data.name}</div>
        {data.birthYear && (
          <div className="person-birth-year">b. {data.birthYear}</div>
        )}
        {isDeceased && <div className="person-deceased">✝</div>}
      </div>
    </div>
  );
};

// Helper to check if ID is valid (not empty/null/undefined)
const isValidId = (id) => {
  return id && typeof id === 'string' && id.trim().length > 0;
};

// Calculate generation levels for all people - optimized to prevent loops
const calculateGenerationLevels = (people) => {
  const generationMap = new Map();
  const personMap = new Map(people.map(p => [p.id, p]));
  
  // Find root nodes (people with no parents)
  const roots = people.filter(p => 
    !isValidId(p.fatherId) && !isValidId(p.motherId)
  );

  // If no clear roots, use the oldest person by birth date as root
  if (roots.length === 0 || roots.length === people.length) {
    const sortedByAge = [...people].filter(p => p.birthDate).sort((a, b) => {
      try {
        const dateA = new Date(a.birthDate);
        const dateB = new Date(b.birthDate);
        return dateA - dateB;
      } catch {
        return 0;
      }
    });
    if (sortedByAge.length > 0) {
      roots.push(sortedByAge[0]);
    } else if (people.length > 0) {
      roots.push(people[0]); // Fallback to first person
    }
  }

  // BFS to assign generation levels with cycle detection
  const visited = new Set();
  const queue = [];
  const maxIterations = people.length * 10; // Safety limit
  let iterations = 0;
  
  // Initialize roots at level 0
  roots.forEach(root => {
    if (root && root.id) {
      generationMap.set(root.id, 0);
      queue.push({ id: root.id, level: 0 });
      visited.add(root.id);
    }
  });

  // Process queue with safety limit
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const { id, level } = queue.shift();
    const person = personMap.get(id);
    if (!person) continue;

    // Process children (level + 1)
    people.forEach(child => {
      if (child && child.id && !visited.has(child.id)) {
        const isChild = (isValidId(child.fatherId) && child.fatherId === id) ||
                       (isValidId(child.motherId) && child.motherId === id);
        if (isChild) {
          generationMap.set(child.id, level + 1);
          queue.push({ id: child.id, level: level + 1 });
          visited.add(child.id);
        }
      }
    });

    // Process parents (level - 1)
    const parentIds = [person.fatherId, person.motherId].filter(isValidId);
    parentIds.forEach(parentId => {
      if (!visited.has(parentId)) {
        generationMap.set(parentId, level - 1);
        queue.push({ id: parentId, level: level - 1 });
        visited.add(parentId);
      }
    });
  }

  // For unvisited nodes, try to infer from relationships
  people.forEach(person => {
    if (person && person.id && !visited.has(person.id)) {
      let inferredLevel = null;
      
      // Try to infer from children
      people.forEach(child => {
        if (child && child.id) {
          const isChild = (isValidId(child.fatherId) && child.fatherId === person.id) ||
                         (isValidId(child.motherId) && child.motherId === person.id);
          if (isChild) {
            const childLevel = generationMap.get(child.id);
            if (childLevel !== undefined) {
              inferredLevel = childLevel - 1;
            }
          }
        }
      });

      // Try to infer from parents
      if (inferredLevel === null) {
        const parentIds = [person.fatherId, person.motherId].filter(isValidId);
        for (const parentId of parentIds) {
          const parentLevel = generationMap.get(parentId);
          if (parentLevel !== undefined) {
            inferredLevel = parentLevel + 1;
            break;
          }
        }
      }

      generationMap.set(person.id, inferredLevel !== null ? inferredLevel : 0);
    }
  });

  return generationMap;
};

// Find the oldest person by birth date
const findOldestPerson = (people) => {
  let oldest = null;
  let oldestDate = null;

  people.forEach((person) => {
    if (!person || !person.birthDate) return;
    
    try {
      const date = new Date(person.birthDate);
      if (isNaN(date.getTime())) return;
      
      if (!oldestDate || date < oldestDate) {
        oldestDate = date;
        oldest = person;
      }
    } catch (e) {
      // Invalid date, skip
    }
  });

  // If no one has a birth date, return first person
  return oldest || (people.length > 0 ? people[0] : null);
};

// Transform people array into nodes and edges using multiple tree approach
export const buildGraphFromPeople = (people) => {
  if (!Array.isArray(people) || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Create person map for quick lookup
  const personMap = new Map(people.map(p => [p.id, p]));
  
  // Track processed nodes and edges to avoid duplicates and infinite loops
  const processedNodes = new Set();
  const processedEdges = new Set();
  const nodes = [];
  const edges = [];
  
  // Track all persons that have been included in any tree
  const allIncludedPersons = new Set();
  
  // Layout constants
  const NODE_WIDTH = 160; // Width of each person node
  const VERTICAL_SPACING = 250; // Space between generations
  const PARTNER_SPACING = 0; // Space between partners (no gap but no overlap)
  const MIN_SIBLING_SPACING = 40; // Minimum spacing between siblings (clear gap to distinguish from partners)
  const TREE_HORIZONTAL_SPACING = 1200; // Space between separate family trees (increased to prevent any overlap)
  const START_X = 0;
  const START_Y = 100;

  // Calculate subtree width recursively (without creating nodes)
  const calculateSubtreeWidth = (personId, visited = new Set(), maxDepth = 20) => {
    if (!personId || !isValidId(personId)) return NODE_WIDTH;
    if (visited.has(personId)) return NODE_WIDTH; // Cycle detection
    if (visited.size > maxDepth) return NODE_WIDTH; // Max depth limit

    const person = personMap.get(personId);
    if (!person) return NODE_WIDTH;

    visited.add(personId);
    let width = NODE_WIDTH;

    // Add partner width if exists
    if (isValidId(person.spouseId)) {
      const spouse = personMap.get(person.spouseId);
      if (spouse && !visited.has(person.spouseId)) {
        width += NODE_WIDTH; // Partners are placed side by side with no gap
        visited.add(person.spouseId);
      }
    }

    // Find children
    const children = people.filter(p => {
      if (!p) return false;
      const isChildOfPerson = (isValidId(p.fatherId) && p.fatherId === personId) ||
                              (isValidId(p.motherId) && p.motherId === personId);
      const spouseId = person.spouseId;
      const isChildOfPartner = isValidId(spouseId) && (
        (isValidId(p.fatherId) && p.fatherId === spouseId) ||
        (isValidId(p.motherId) && p.motherId === spouseId)
      );
      return isChildOfPerson || isChildOfPartner;
    });

    if (children.length > 0) {
      // Calculate total width needed for all children's subtrees
      let totalChildrenWidth = 0;
      children.forEach((child, index) => {
        if (index > 0) {
          totalChildrenWidth += MIN_SIBLING_SPACING; // Spacing between siblings
        }
        const childWidth = calculateSubtreeWidth(child.id, new Set(visited), maxDepth);
        totalChildrenWidth += childWidth;
      });
      
      // Subtree width is the max of current width and children width
      width = Math.max(width, totalChildrenWidth);
    }

    return width;
  };

  // Recursive function to build tree starting from a person
  const buildTree = (personId, level, x, y, visited = new Set(), maxDepth = 20, allocatedWidth = null, isIncludedInPreviousTree = false) => {
    // Safety checks to prevent infinite loops
    if (!personId || !isValidId(personId)) return { x, width: NODE_WIDTH };
    if (visited.has(personId)) return { x, width: NODE_WIDTH }; // Cycle detection
    if (level > maxDepth) return { x, width: NODE_WIDTH }; // Max depth limit
    // Allow duplicate persons in subsequent trees, but prevent infinite recursion
    if (processedNodes.has(personId) && !isIncludedInPreviousTree) return { x, width: NODE_WIDTH }; // Skip if already processed AND not a duplicate

    const person = personMap.get(personId);
    if (!person) return { x, width: NODE_WIDTH };

    visited.add(personId);
    // Don't mark as processed if it's a duplicate person - allow it in multiple trees
    if (!isIncludedInPreviousTree) {
      processedNodes.add(personId);
    }

    // Calculate actual subtree width
    const actualSubtreeWidth = allocatedWidth || calculateSubtreeWidth(personId, new Set(visited), maxDepth);
    
    // Extract birth year
    let birthYear = null;
    if (person.birthDate) {
      try {
        const date = new Date(person.birthDate);
        if (!isNaN(date.getTime())) {
          birthYear = date.getFullYear();
        }
      } catch (e) {
        // Invalid date
      }
    }

    // Center the person within their allocated width
    let personX = x;
    if (allocatedWidth && allocatedWidth > NODE_WIDTH) {
      personX = x + allocatedWidth / 2 - NODE_WIDTH / 2;
    }

    // Create unique node ID for duplicates to avoid linking issues
    const uniqueNodeId = isIncludedInPreviousTree ? `${person.id}_duplicate_${treeIndex}` : person.id;

    // Create node for this person
    const currentNode = {
      id: uniqueNodeId,
      data: {
        name: (person.name || 'Unknown') + (isIncludedInPreviousTree ? '*' : ''),
        gender: person.gender || 'other',
        birthYear,
        birthDate: person.birthDate,
        imageUrl: person.imageUrl,
        isAlive: person.alive !== false,
        generationLevel: level,
        isIncludedInPreviousTree,
        originalId: person.id, // Keep original ID for reference
      },
      position: { x: personX, y },
      type: 'person',
    };
    nodes.push(currentNode);

    let currentX = personX;
    let partnerNode = null;
    let partnerX = personX;
    let subtreeWidth = NODE_WIDTH;

    // Step 2: Find and link partner (ONLY partners are placed next to each other)
    if (isValidId(person.spouseId) && (!processedNodes.has(person.spouseId) || allIncludedPersons.has(person.spouseId))) {
      const spouse = personMap.get(person.spouseId);
      if (spouse) {
        // Place partner right next to the person with no gap
        partnerX = currentX + NODE_WIDTH; // Place immediately after current person
        const spouseIsDuplicate = allIncludedPersons.has(spouse.id);
        const uniqueSpouseId = spouseIsDuplicate ? `${spouse.id}_duplicate_${treeIndex}` : spouse.id;
        
        partnerNode = {
          id: uniqueSpouseId,
          data: {
            name: (spouse.name || 'Unknown') + (spouseIsDuplicate ? '*' : ''),
            gender: spouse.gender || 'other',
            birthYear: spouse.birthDate ? (() => {
              try {
                const d = new Date(spouse.birthDate);
                return isNaN(d.getTime()) ? null : d.getFullYear();
              } catch { return null; }
            })() : null,
            birthDate: spouse.birthDate,
            imageUrl: spouse.imageUrl,
            isAlive: spouse.alive !== false,
            generationLevel: level,
            isIncludedInPreviousTree: spouseIsDuplicate,
            originalId: spouse.id, // Keep original ID for reference
          },
          position: { x: partnerX, y },
          type: 'person',
        };
        nodes.push(partnerNode);
        // Mark spouse as included
        allIncludedPersons.add(spouse.id);
        // Only mark as processed if not a duplicate
        if (!spouseIsDuplicate) {
          processedNodes.add(spouse.id);
        }

        // Create partner edge (pink/dashed) - use bezier curve with vertical offset to prevent overlapping
        const spouseEdgeKey = [uniqueNodeId, uniqueSpouseId].sort().join('-spouse-');
        if (!processedEdges.has(spouseEdgeKey)) {
          edges.push({
            id: spouseEdgeKey,
            source: uniqueNodeId,
            target: uniqueSpouseId,
            sourceHandle: 'right',
            targetHandle: 'left',
            type: 'smoothstep',
            pathOptions: {
              offset: 20, // Add vertical offset to prevent overlapping
              borderRadius: 10,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 10,
              height: 10,
              color: '#ec4899',
            },
            style: {
              stroke: '#ec4899',
              strokeWidth: 1.5,
              strokeDasharray: '4,2',
              strokeOpacity: 0.7,
            },
            label: '',
            data: { isSpouse: true },
          });
          processedEdges.add(spouseEdgeKey);
        }

        // Update width to include partner
        subtreeWidth = NODE_WIDTH + NODE_WIDTH; // Two nodes side by side
        currentX = partnerX;
      }
    }

    // Step 3: Find children and place them one level below
    // Children are those who have this person or their partner as father or mother
    const children = people.filter(p => {
      if (!p) return false;
      const isChildOfPerson = (isValidId(p.fatherId) && p.fatherId === personId) ||
                              (isValidId(p.motherId) && p.motherId === personId);
      const isChildOfPartner = partnerNode && (
        (isValidId(p.fatherId) && p.fatherId === partnerNode.id) ||
        (isValidId(p.motherId) && p.motherId === partnerNode.id)
      );
      // Allow children if they haven't been processed OR if they're duplicates (already included)
      return (isChildOfPerson || isChildOfPartner) && (!processedNodes.has(p.id) || allIncludedPersons.has(p.id));
    });

    // Sort children by birth date (oldest first)
    children.sort((a, b) => {
      const dateA = a.birthDate ? new Date(a.birthDate) : new Date(9999, 0, 1);
      const dateB = b.birthDate ? new Date(b.birthDate) : new Date(9999, 0, 1);
      return dateA - dateB;
    });

    if (children.length > 0) {
      const childrenY = y + VERTICAL_SPACING;
      
      // Calculate width needed for each child's subtree
      const childSubtreeWidths = children.map(child => {
        if (processedNodes.has(child.id) && !allIncludedPersons.has(child.id)) return NODE_WIDTH;
        return calculateSubtreeWidth(child.id, new Set(visited), maxDepth);
      });
      
      // Calculate total width needed for all children
      let totalChildrenWidth = 0;
      childSubtreeWidths.forEach((width, index) => {
        if (index > 0) {
          totalChildrenWidth += MIN_SIBLING_SPACING; // Spacing between siblings
        }
        totalChildrenWidth += width;
      });
      
      // Center children under the parent couple
      const coupleCenterX = partnerNode ? (x + partnerX) / 2 : x;
      let childrenStartX = coupleCenterX - totalChildrenWidth / 2;
      
      // Position each child based on their subtree width
      let currentChildX = childrenStartX;
      
      children.forEach((child, index) => {
        const childIsDuplicate = allIncludedPersons.has(child.id);
        const childWidth = childSubtreeWidths[index];
        const uniqueChildId = childIsDuplicate ? `${child.id}_duplicate_${treeIndex}` : child.id;
        
        // Create parent-child edge (blue/solid) - use bezier curve with vertical offset for better routing
        // Link to the primary parent (the person we started with)
        const primaryParentId = uniqueNodeId;
        
        const parentChildEdgeKey = `${primaryParentId}->${uniqueChildId}`;
        if (!processedEdges.has(parentChildEdgeKey)) {
          edges.push({
            id: parentChildEdgeKey,
            source: primaryParentId,
            target: uniqueChildId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'smoothstep',
            pathOptions: {
              offset: 30, // Add vertical offset to prevent overlapping with partner edges
              borderRadius: 15,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: '#3b82f6',
            },
            style: {
              stroke: '#3b82f6',
              strokeWidth: 2,
              strokeOpacity: 0.8,
            },
            label: '',
            data: { isParentChild: true },
          });
          processedEdges.add(parentChildEdgeKey);
        }

        // Step 4 & 5: Recursively process child (which will find their partner and children)
        // Pass the allocated width so the child's subtree fits within it
        // The child will be centered within their allocated space
        buildTree(child.id, level + 1, currentChildX, childrenY, new Set(visited), maxDepth, childWidth, childIsDuplicate);
        
        // Mark child as included
        allIncludedPersons.add(child.id);
        // Only mark as processed if not a duplicate
        if (!childIsDuplicate) {
          processedNodes.add(child.id);
        }
        
        // Move to next sibling position (accounting for the child's subtree width)
        currentChildX += childWidth;
        if (index < children.length - 1) {
          currentChildX += MIN_SIBLING_SPACING;
        }
      });
      
      // Update subtree width to include children
      subtreeWidth = Math.max(subtreeWidth, totalChildrenWidth);
    }

    return { x, width: subtreeWidth };
  };

  // Sort people by birth date (oldest first)
  const sortedPeople = [...people]
    .filter(p => p && p.id)
    .sort((a, b) => {
      const dateA = a.birthDate ? new Date(a.birthDate) : new Date(9999, 0, 1);
      const dateB = b.birthDate ? new Date(b.birthDate) : new Date(9999, 0, 1);
      return dateA - dateB;
    });

  let treeIndex = 0;
  let currentXOffset = 0;
  
  // Build multiple trees until all people are included
  while (allIncludedPersons.size < people.length && treeIndex < sortedPeople.length) {
    // Find the next oldest person who hasn't been included yet
    let nextRootPerson = null;
    for (const person of sortedPeople) {
      if (!allIncludedPersons.has(person.id)) {
        nextRootPerson = person;
        break;
      }
    }
    
    if (!nextRootPerson) break; // No more people to process
    
    console.log(`Building tree ${treeIndex + 1} for root: ${nextRootPerson.name}, included so far: ${allIncludedPersons.size}/${people.length}`);
    
    // Calculate the width of this tree before building it
    const estimatedTreeWidth = calculateSubtreeWidth(nextRootPerson.id, new Set(), 20);
    
    // Mark this root person as included
    allIncludedPersons.add(nextRootPerson.id);
    
    // Build tree starting from this person with sufficient spacing
    buildTree(nextRootPerson.id, 0, START_X + currentXOffset, START_Y, new Set(), 20, null, false);
    
    // Update offset for next tree: add tree width + spacing buffer
    currentXOffset += estimatedTreeWidth + TREE_HORIZONTAL_SPACING;
    
    console.log(`Tree ${treeIndex + 1} completed, new offset: ${currentXOffset}`);
    treeIndex++;
  }
  
  console.log(`Total trees built: ${treeIndex}, total people included: ${allIncludedPersons.size}/${people.length}`);

  // Process any remaining unprocessed people (disconnected nodes)
  people.forEach((person) => {
    if (!processedNodes.has(person.id)) {
      let birthYear = null;
      if (person.birthDate) {
        try {
          const date = new Date(person.birthDate);
          if (!isNaN(date.getTime())) {
            birthYear = date.getFullYear();
          }
        } catch (e) {}
      }

      const isDuplicate = allIncludedPersons.has(person.id);
      const uniqueNodeId = isDuplicate ? `${person.id}_duplicate_${treeIndex}` : person.id;

      nodes.push({
        id: uniqueNodeId,
        data: {
          name: (person.name || 'Unknown') + (isDuplicate ? '*' : ''),
          gender: person.gender || 'other',
          birthYear,
          birthDate: person.birthDate,
          imageUrl: person.imageUrl,
          isAlive: person.alive !== false,
          generationLevel: 0,
          isIncludedInPreviousTree: isDuplicate,
          originalId: person.id, // Keep original ID for reference
        },
        position: { x: nodes.length * 250, y: 100 },
        type: 'person',
      });
    }
  });

  return { nodes, edges };
};

// Helper to extract birth year from birthDate
const getBirthYear = (birthDate) => {
  if (!birthDate) return null;
  try {
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return null;
    return date.getFullYear();
  } catch {
    return null;
  }
};

// Dagre layout function with improved generation-based layout and chronological ordering
const layoutGraph = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return { nodes, edges };
  }

  try {
    const g = new dagre.graphlib.Graph({
      rankdir: 'TB', // Top to bottom
      align: 'UL',
      nodesep: 100, // Horizontal space between nodes
      ranksep: 180, // Vertical space between generations
      marginx: 50,
      marginy: 50,
      acyclicer: 'greedy', // Handle cycles better
      ranker: 'network-simplex', // More stable than longest-path
    });

    // Configure graph with default edge label
    g.setDefaultEdgeLabel(() => ({}));
    
    // Set default node label to prevent undefined errors
    g.setDefaultNodeLabel(() => ({}));

    // Add all nodes to graph with proper dimensions
    nodes.forEach((node) => {
      if (node && node.id) {
        g.setNode(node.id, { 
          width: 160,
          height: 100,
          label: node.id || 'node'
        });
      }
    });

    // Only add PARENT-CHILD edges to Dagre (not spouse edges)
    // Spouse edges will be rendered but won't affect layout
    const parentChildEdges = edges.filter(edge => {
      if (!edge || !edge.source || !edge.target) return false;
      if (edge.source === edge.target) return false;
      if (edge.id && edge.id.includes('spouse')) return false;
      // Verify both source and target nodes exist
      const sourceExists = nodes.some(n => n.id === edge.source);
      const targetExists = nodes.some(n => n.id === edge.target);
      return sourceExists && targetExists;
    });

    // Add edges to graph
    parentChildEdges.forEach((edge) => {
      try {
        g.setEdge(edge.source, edge.target);
      } catch (err) {
        console.warn(`Failed to add edge ${edge.source} -> ${edge.target}:`, err);
      }
    });

    // Run layout with timeout protection
    const startTime = Date.now();
    dagre.layout(g);
    const layoutTime = Date.now() - startTime;
    
    if (layoutTime > 5000) {
      console.warn('Layout took longer than expected:', layoutTime, 'ms');
    }

    // Group nodes by generation level and Y position (rank)
    const nodesByRank = new Map();
    
    nodes.forEach((node) => {
      if (!node || !node.id) return;
      
      const dagreNode = g.node(node.id);
      if (!dagreNode) return;
      
      // Round Y position to group nodes in the same rank/generation
      const rankY = Math.round(dagreNode.y / 10) * 10;
      
      if (!nodesByRank.has(rankY)) {
        nodesByRank.set(rankY, []);
      }
      
      nodesByRank.get(rankY).push({
        node,
        dagreNode,
        birthYear: getBirthYearFromNodeData(node)
      });
    });

    // Sort nodes within each rank by birth year (chronologically)
    nodesByRank.forEach((nodeList, rankY) => {
      nodeList.sort((a, b) => {
        // If both have birth years, sort by year (older first)
        if (a.birthYear && b.birthYear) {
          return a.birthYear - b.birthYear;
        }
        // If only one has birth year, prioritize it
        if (a.birthYear && !b.birthYear) return -1;
        if (!a.birthYear && b.birthYear) return 1;
        // If neither has birth year, maintain original order
        return 0;
      });
    });

    // Recalculate X positions to be chronological within each rank
    const layoutedNodes = [];
    const processedNodeIds = new Set();
    
    // Sort ranks by Y position (top to bottom)
    const sortedRanks = Array.from(nodesByRank.entries()).sort((a, b) => a[0] - b[0]);
    
    sortedRanks.forEach(([rankY, nodeList]) => {
      const sortedNodes = nodeList; // Already sorted by birth year
      const nodeSpacing = 180; // Space between nodes horizontally
      const nodeWidth = 160;
      
      // Calculate starting X position to center the group
      const totalWidth = sortedNodes.length * nodeSpacing;
      const startX = -totalWidth / 2 + nodeWidth / 2;
      
      sortedNodes.forEach((item, index) => {
        const { node, dagreNode } = item;
        layoutedNodes.push({
          ...node,
          position: {
            x: startX + (index * nodeSpacing),
            y: dagreNode.y - 50, // Center the node (100/2)
          },
        });
        processedNodeIds.add(node.id);
      });
    });

    // Handle nodes that weren't in the Dagre layout
    nodes.forEach((node) => {
      if (!node || !node.id) return;
      if (!processedNodeIds.has(node.id)) {
        const genLevel = node.data?.generationLevel || 0;
        const birthYear = getBirthYearFromNodeData(node);
        layoutedNodes.push({
          ...node,
          position: {
            x: 0, // Will be positioned with others in same generation
            y: genLevel * 200,
          },
        });
      }
    });
    
    // Sort final nodes by generation and birth year for any remaining unpositioned nodes
    layoutedNodes.sort((a, b) => {
      const genA = a.data?.generationLevel || 0;
      const genB = b.data?.generationLevel || 0;
      if (genA !== genB) return genA - genB;
      
      const yearA = getBirthYearFromNodeData(a);
      const yearB = getBirthYearFromNodeData(b);
      if (yearA && yearB) return yearA - yearB;
      if (yearA) return -1;
      if (yearB) return 1;
      return 0;
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('Error in Dagre layout:', error);
    // Return nodes with fallback positions based on generation and birth year
    const sortedNodes = [...nodes].sort((a, b) => {
      const genA = a.data?.generationLevel || 0;
      const genB = b.data?.generationLevel || 0;
      if (genA !== genB) return genA - genB;
      
      const yearA = getBirthYearFromNodeData(a);
      const yearB = getBirthYearFromNodeData(b);
      if (yearA && yearB) return yearA - yearB;
      if (yearA) return -1;
      if (yearB) return 1;
      return 0;
    });
    
    return {
      nodes: sortedNodes.map((node, idx) => {
        const genLevel = node.data?.generationLevel || 0;
        const nodesInGen = sortedNodes.filter(n => (n.data?.generationLevel || 0) === genLevel);
        const indexInGen = nodesInGen.indexOf(node);
        return {
          ...node,
          position: { 
            x: indexInGen * 200, 
            y: genLevel * 200 
          },
        };
      }),
      edges,
    };
  }
};

// Helper to extract birth year from node data
const getBirthYearFromNodeData = (node) => {
  // Try birthYear field first
  if (node.data?.birthYear) {
    if (typeof node.data.birthYear === 'number') {
      return node.data.birthYear;
    }
    if (typeof node.data.birthYear === 'string') {
      const year = parseInt(node.data.birthYear);
      if (!isNaN(year)) return year;
    }
  }
  // Try to parse from birthDate if available
  if (node.data?.birthDate) {
    try {
      const date = new Date(node.data.birthDate);
      if (!isNaN(date.getTime())) {
        return date.getFullYear();
      }
    } catch (e) {
      // Invalid date
    }
  }
  return null;
};
