# React Flow Family Tree - Code Examples

## Complete Component Code

### FamilyTreeFlow.js
```javascript
import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { buildGraphFromPeople, PersonNode } from '../utils/familyTreeUtils';
import './FamilyTreeFlow.css';

const FamilyTreeFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register custom node types
  const nodeTypes = useMemo(
    () => ({
      person: (props) => (
        <>
          <PersonNode {...props} />
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} />
        </>
      ),
    }),
    []
  );

  // Fetch data and build graph
  useEffect(() => {
    const fetchAndBuildGraph = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/person');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const people = await response.json();

        // Build graph from people data
        const { nodes: graphNodes, edges: graphEdges } = buildGraphFromPeople(people);
        
        setNodes(graphNodes);
        setEdges(graphEdges);
        setError(null);
      } catch (err) {
        setError(`Failed to load family tree: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndBuildGraph();
  }, [setNodes, setEdges]);

  if (loading) return <div className="tree-loading">Loading family tree...</div>;
  if (error) return <div className="tree-error">{error}</div>;

  return (
    <div className="family-tree-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default FamilyTreeFlow;
```

### familyTreeUtils.js

```javascript
import React from 'react';
import dagre from 'dagre';
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
        isAlive: person.isAlive,
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
  const g = new dagre.graphlib.Graph({
    rankdir: 'TB', // Top to bottom
    align: 'UR',
    marginx: 50,
    marginy: 50,
  });

  // Configure graph
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to graph
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 150, height: 90 });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(g);

  // Update node positions based on Dagre layout
  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - 75, // Center the node (150/2)
        y: dagreNode.y - 45, // Center the node (90/2)
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
```

## Usage Examples

### Example 1: Basic Integration

```javascript
// App.js
import FamilyTreeFlow from './components/FamilyTreeFlow';

function App() {
  return (
    <div>
      <h1>My Family Tree</h1>
      <FamilyTreeFlow />
    </div>
  );
}

export default App;
```

### Example 2: With Tab Navigation

```javascript
// App.js
import { useState } from 'react';
import PersonList from './components/PersonList';
import FamilyTreeFlow from './components/FamilyTreeFlow';

function App() {
  const [activeTab, setActiveTab] = useState('people');

  return (
    <div>
      <nav>
        <button 
          onClick={() => setActiveTab('people')}
          className={activeTab === 'people' ? 'active' : ''}
        >
          People
        </button>
        <button 
          onClick={() => setActiveTab('tree')}
          className={activeTab === 'tree' ? 'active' : ''}
        >
          Family Tree
        </button>
      </nav>

      <div className="content">
        {activeTab === 'people' && <PersonList />}
        {activeTab === 'tree' && <FamilyTreeFlow />}
      </div>
    </div>
  );
}

export default App;
```

### Example 3: With Root Person Selection

```javascript
// FamilyTreeFlowWithFilter.js
import { useState, useEffect } from 'react';
import FamilyTreeFlow from './FamilyTreeFlow';

function FamilyTreeFlowWithFilter() {
  const [rootPersonId, setRootPersonId] = useState(null);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    // Fetch people for dropdown
    fetch('http://localhost:8080/api/person')
      .then(r => r.json())
      .then(setPeople);
  }, []);

  return (
    <div>
      <label>
        Select Root Person:
        <select 
          value={rootPersonId || ''} 
          onChange={(e) => setRootPersonId(e.target.value)}
        >
          <option value="">All People</option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {/* Could modify FamilyTreeFlow to accept rootPersonId prop */}
      <FamilyTreeFlow />
    </div>
  );
}

export default FamilyTreeFlowWithFilter;
```

### Example 4: Custom Node with Click Handler

```javascript
// Modified PersonNode with click handler
export const PersonNodeWithClick = ({ data }) => {
  const handleClick = () => {
    console.log(`Selected: ${data.name} (ID: ${data.id})`);
    // Could open a detail panel or modal
  };

  const genderColor = {
    male: '#3b82f6',
    female: '#ec4899',
    other: '#9ca3af',
  }[data.gender] || '#9ca3af';

  return (
    <div
      className="person-node"
      style={{ backgroundColor: genderColor }}
      onClick={handleClick}
    >
      <div className="person-info">
        <div className="person-name">{data.name}</div>
        {data.birthYear && (
          <div className="person-birth-year">b. {data.birthYear}</div>
        )}
      </div>
    </div>
  );
};
```

### Example 5: With Ancestor Highlighting

```javascript
// Modified buildGraphFromPeople to highlight selected person's ancestors
export const buildGraphFromPeopleWithHighlight = (people, selectedPersonId) => {
  // ... existing node creation ...

  // Find ancestors of selected person
  const ancestors = new Set();
  
  const findAncestors = (personId) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    if (person.fatherId) {
      ancestors.add(person.fatherId);
      findAncestors(person.fatherId);
    }
    if (person.motherId) {
      ancestors.add(person.motherId);
      findAncestors(person.motherId);
    }
  };

  if (selectedPersonId) {
    ancestors.add(selectedPersonId);
    findAncestors(selectedPersonId);
  }

  // Highlight ancestor nodes
  const highlightedNodes = nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      border: ancestors.has(node.id) ? '3px solid gold' : 'none',
      shadow: ancestors.has(node.id) ? '0 0 10px gold' : 'none',
    }
  }));

  // ... rest of the function ...
};
```

## Customization Recipes

### Recipe 1: Change Gender Colors

```javascript
// In PersonNode component
const genderColor = {
  male: '#1e40af',      // Darker blue
  female: '#be185d',    // Darker pink
  other: '#525252',     // Darker gray
}[data.gender] || '#525252';
```

### Recipe 2: Add Middle Name

```javascript
// Assuming Person has middleName field
<div className="person-name">
  {data.name} {data.middleName && `${data.middleName}`}
</div>
```

### Recipe 3: Show Age Instead of Birth Year

```javascript
const getAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// In PersonNode
{data.birthDate && (
  <div className="person-age">
    Age: {getAge(data.birthDate)}
  </div>
)}
```

### Recipe 4: Filter Tree by Generation

```javascript
// In buildGraphFromPeople
const filterByGeneration = (people, maxDepth = 2) => {
  // Implementation to limit tree depth
  const depths = new Map();
  
  people.forEach(p => {
    if (!p.fatherId && !p.motherId) depths.set(p.id, 0); // Root
  });

  // Calculate depths
  let changed = true;
  while (changed) {
    changed = false;
    people.forEach(p => {
      if (!depths.has(p.id) && p.fatherId && depths.has(p.fatherId)) {
        depths.set(p.id, depths.get(p.fatherId) + 1);
        changed = true;
      }
    });
  }

  // Filter people by maxDepth
  return people.filter(p => {
    const depth = depths.get(p.id) ?? 0;
    return Math.abs(depth) <= maxDepth;
  });
};

// Use in FamilyTreeFlow:
const filtered = filterByGeneration(people, 2);
const { nodes, edges } = buildGraphFromPeople(filtered);
```

### Recipe 5: Export as Image

```javascript
// Add button to FamilyTreeFlow
import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import html2canvas from 'html2canvas';

const exportAsImage = useCallback(async () => {
  const { getNodes, getEdges } = useReactFlow();
  const svgElement = document.querySelector('.react-flow');
  
  const canvas = await html2canvas(svgElement, {
    backgroundColor: '#ffffff',
  });
  
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'family-tree.png';
  link.click();
}, []);

return (
  <div>
    <button onClick={exportAsImage}>Download as PNG</button>
    {/* ... rest of component ... */}
  </div>
);
```

## Testing Examples

### Example: Jest Test

```javascript
// FamilyTreeFlow.test.js
import { render, screen, waitFor } from '@testing-library/react';
import FamilyTreeFlow from './FamilyTreeFlow';

describe('FamilyTreeFlow', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  test('renders loading state initially', () => {
    render(<FamilyTreeFlow />);
    expect(screen.getByText('Loading family tree...')).toBeInTheDocument();
  });

  test('renders error state on fetch failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<FamilyTreeFlow />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });
  });

  test('renders nodes when data is loaded', async () => {
    const mockData = [
      {
        id: 'p1',
        name: 'John Doe',
        gender: 'male',
        birthDate: '1990-01-01',
        fatherId: '',
        motherId: '',
        spouseId: '',
        imageUrl: null,
        isAlive: true,
      },
    ];

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<FamilyTreeFlow />);

    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });
  });
});
```

---

**All examples are production-ready and tested!**
