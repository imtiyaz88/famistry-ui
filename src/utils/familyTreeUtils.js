import React from 'react';
import * as dagre from 'dagre';
import { MarkerType } from 'reactflow';

// Custom Person Node Component
export const PersonNode = ({ data }) => {
  const genderColor = {
    male: '#3b82f6',
    female: '#ec4899',
    other: '#9ca3af',
  }[data.gender] || '#9ca3af';

  const isDeceased = data.isAlive === false;
  const opacity = isDeceased ? 0.6 : 1;

  return (
    <div
      className="person-node"
      style={{
        backgroundColor: genderColor,
        opacity,
      }}
    >
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

// Transform people array into nodes and edges
export const buildGraphFromPeople = (people) => {
  if (!Array.isArray(people) || people.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const edgeSet = new Set(); // Track edges to avoid duplicates

  // Create nodes
  people.forEach((person) => {
    const birthYear = person.birthDate
      ? new Date(person.birthDate).getFullYear()
      : null;

    nodes.push({
      id: person.id,
      data: {
        name: person.name || 'Unknown',
        gender: person.gender || 'other',
        birthYear,
        imageUrl: person.imageUrl,
        isAlive: person.alive !== false, // Handle both 'alive' and 'isAlive' field names
      },
      position: { x: 0, y: 0 }, // Will be set by Dagre layout
      type: 'person',
    });
  });

  // Create edges and handle parent-child relationships
  const processedSpouses = new Set();

  people.forEach((person) => {
    // Father → Child edge (vertical)
    if (person.fatherId && person.fatherId.trim()) {
      const edgeKey = `${person.fatherId}->${person.id}`;
      if (!edgeSet.has(edgeKey)) {
        edges.push({
          id: edgeKey,
          source: person.fatherId,
          target: person.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6b7280', strokeWidth: 2 },
        });
        edgeSet.add(edgeKey);
      }
    }

    // Mother → Child edge (vertical)
    if (person.motherId && person.motherId.trim()) {
      const edgeKey = `${person.motherId}->${person.id}`;
      if (!edgeSet.has(edgeKey)) {
        edges.push({
          id: edgeKey,
          source: person.motherId,
          target: person.id,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#6b7280', strokeWidth: 2 },
        });
        edgeSet.add(edgeKey);
      }
    }

    // Spouse edge (horizontal, avoid duplicates)
    if (person.spouseId && person.spouseId.trim()) {
      // Create a consistent edge key regardless of direction
      const edgeKey = [person.id, person.spouseId].sort().join('-spouse-');
      if (!edgeSet.has(edgeKey) && !processedSpouses.has(edgeKey)) {
        edges.push({
          id: edgeKey,
          source: person.id,
          target: person.spouseId,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' },
          data: { isSpouse: true },
        });
        edgeSet.add(edgeKey);
        processedSpouses.add(edgeKey);
      }
    }
  });

  // Apply Dagre layout
  const layoutedGraph = layoutGraph(nodes, edges);

  return {
    nodes: layoutedGraph.nodes,
    edges: layoutedGraph.edges,
  };
};

// Dagre layout function
const layoutGraph = (nodes, edges) => {
  if (!nodes || nodes.length === 0) {
    return { nodes, edges };
  }

  try {
    const g = new dagre.graphlib.Graph({
      rankdir: 'TB', // Top to bottom
      align: 'UL',
      nodesep: 100, // Horizontal space between nodes
      ranksep: 150, // Vertical space between generations
      marginx: 40,
      marginy: 40,
    });

    // Configure graph with default edge label
    g.setDefaultEdgeLabel(() => ({}));
    
    // Set default node label to prevent undefined errors
    g.setDefaultNodeLabel(() => ({}));

    // Add all nodes to graph
    nodes.forEach((node) => {
      if (node && node.id) {
        g.setNode(node.id, { 
          width: 150, 
          height: 90,
          label: node.id
        });
      }
    });

    // Only add PARENT-CHILD edges to Dagre (not spouse edges)
    // Spouse edges will be rendered but won't affect layout
    edges.forEach((edge) => {
      if (edge && edge.source && edge.target && 
          edge.source !== edge.target && 
          !edge.id.includes('spouse')) {  // Skip spouse edges for layout
        g.setEdge(edge.source, edge.target);
      }
    });

    // Run layout
    dagre.layout(g);

    console.log('Dagre layout completed. Node count:', nodes.length, 'Edge count:', edges.length);

    // Update node positions based on Dagre layout
    const layoutedNodes = nodes.map((node) => {
      const dagreNode = g.node(node.id);
      if (!dagreNode) {
        console.warn(`No Dagre node found for ${node.id}`);
        return node;
      }
      return {
        ...node,
        position: {
          x: dagreNode.x - 75, // Center the node (150/2)
          y: dagreNode.y - 45, // Center the node (90/2)
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  } catch (error) {
    console.error('Error in Dagre layout:', error);
    // Return nodes with default positions if layout fails
    return {
      nodes: nodes.map((node, idx) => ({
        ...node,
        position: { x: idx * 200, y: 0 },
      })),
      edges,
    };
  }
};
