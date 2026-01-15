import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import './FamilyTree.css';

const FamilyTree = ({ personId = null }) => {
  const [selectedPerson, setSelectedPerson] = useState(personId);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);

  // Fetch all people for dropdown
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const data = await apiService.listPeople();
        setPeople(data);
        if (personId && !selectedPerson) {
          setSelectedPerson(personId);
        }
      } catch (err) {
        console.error('Error loading people:', err);
        setError('Failed to load people');
      }
    };
    loadPeople();
  }, [personId]);

  // Build tree structure with ancestors and descendants - no depth limit for ancestors
  const buildTreeStructure = (rootId, nodes) => {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return null;
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const buildNode = (personId, path = [], isAncestor = false) => {
      // Prevent cycles - if person is already in the current path, stop
      if (!personId || path.includes(personId)) {
        return null;
      }

      const person = nodeMap.get(personId);
      if (!person) return null;

      // Add current person to path to prevent cycles
      const newPath = [...path, personId];

      const node = {
        id: person.id,
        name: person.name,
        gender: person.gender || 'other',
        alive: person.alive,
        imageUrl: person.imageUrl,
        parents: [],
        children: [],
        spouses: []
      };

      // Add spouse (lateral connection - no path penalty)
      if (person.spouseId && person.spouseId.trim() && person.spouseId !== personId) {
        const spouse = nodeMap.get(person.spouseId);
        if (spouse && !newPath.includes(spouse.id)) {
          node.spouses.push({
            id: spouse.id,
            name: spouse.name,
            gender: spouse.gender || 'other',
            alive: spouse.alive,
            imageUrl: spouse.imageUrl
          });
        }
      }

      // Always add parents (no depth limit for ancestors)
      if (person.fatherId && person.fatherId.trim()) {
        const fatherNode = buildNode(person.fatherId, newPath, true);
        if (fatherNode) {
          node.parents.push(fatherNode);
        }
      }

      if (person.motherId && person.motherId.trim()) {
        const motherNode = buildNode(person.motherId, newPath, true);
        if (motherNode) {
          node.parents.push(motherNode);
        }
      }

      // Only add children if not going too deep (limit descendants)
      if (!isAncestor || path.length < 3) {
        nodes.forEach(potentialChild => {
          if ((potentialChild.fatherId === person.id || potentialChild.motherId === person.id) && 
              potentialChild.id !== personId &&
              !newPath.includes(potentialChild.id)) {
            const childNode = buildNode(potentialChild.id, newPath, false);
            if (childNode) {
              node.children.push(childNode);
            }
          }
        });
      }

      return node;
    };

    return buildNode(rootId);
  };

  // Render tree structure with SVG - new design with merged parent arrows
  const TreeNode = ({ node, x, y, offsetX = 300, offsetY = 250 }) => {
    if (!node) return null;

    const nodeWidth = 120;
    const nodeHeight = 120;
    const spouseGap = 40; // Gap between person and spouse
    
    const elements = [];

    // Render parents first (above current node)
    if (node.parents.length > 0) {
      const parentsWidth = node.parents.length * offsetX;
      const startParentX = x - parentsWidth / 2 + offsetX / 2;

      node.parents.forEach((parent, idx) => {
        const parentX = startParentX + idx * offsetX;
        const parentY = y - offsetY;

        // Parent nodes
        const parentNode = <TreeNode key={`tree-parent-${parent.id}`} node={parent} x={parentX} y={parentY} offsetX={offsetX} offsetY={offsetY} />;
        elements.push(parentNode);
      });

      // Merge point - center between parents and above current node
      const mergeX = x;
      const mergeY = y - offsetY / 2;

      // Lines from each parent to merge point
      node.parents.forEach((parent, idx) => {
        const parentX = startParentX + idx * offsetX;
        const parentY = y - offsetY;
        const parentRectY = parentY + nodeHeight / 2;

        // Vertical line down from parent
        elements.push(
          <line
            key={`parent-down-${parent.id}`}
            x1={parentX}
            y1={parentRectY}
            x2={parentX}
            y2={mergeY}
            className="parent-line"
          />
        );

        // Horizontal line to merge point
        elements.push(
          <line
            key={`parent-merge-${parent.id}`}
            x1={parentX}
            y1={mergeY}
            x2={mergeX}
            y2={mergeY}
            className="parent-line"
          />
        );
      });

      // Line from merge point to child
      elements.push(
        <line
          key={`merge-to-child`}
          x1={mergeX}
          y1={mergeY}
          x2={x}
          y2={y - nodeHeight / 2}
          className="parent-line"
        />
      );
    }

    // Main person rectangle with avatar
    elements.push(
      <g key={`node-${node.id}`} className="tree-node main-node">
        <rect
          x={x - nodeWidth / 2}
          y={y - nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          className={`node-rect ${node.gender === 'M' ? 'male' : node.gender === 'F' ? 'female' : 'other'} ${node.alive ? '' : 'deceased'}`}
          rx="8"
        />
        <foreignObject
          x={x - nodeWidth / 2 + 5}
          y={y - nodeHeight / 2 + 5}
          width={nodeWidth - 10}
          height={nodeHeight - 10}
          className="node-content"
        >
          <div className="node-text-main">
            <img
              src={node.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=random&color=fff&size=120`}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=random&color=fff&size=120`;
              }}
              alt={node.name}
              className="node-avatar-main"
            />
            <span className="node-name-main">{node.name || 'Unknown'}</span>
            {!node.alive && <span className="deceased-badge-main">†</span>}
          </div>
        </foreignObject>
      </g>
    );

    // Partner rectangle - placed to the right
    node.spouses.forEach((spouse, idx) => {
      const spouseX = x + nodeWidth / 2 + spouseGap + 60;
      const spouseY = y;
      const spouseWidth = 100;
      const spouseHeight = 100;

      elements.push(
        <g key={`spouse-${spouse.id}`} className="tree-node spouse">
          <rect
            x={spouseX - spouseWidth / 2}
            y={spouseY - spouseHeight / 2}
            width={spouseWidth}
            height={spouseHeight}
            className={`node-rect spouse ${spouse.gender === 'M' ? 'male' : spouse.gender === 'F' ? 'female' : 'other'} ${spouse.alive ? '' : 'deceased'}`}
            rx="6"
          />
          <foreignObject
            x={spouseX - spouseWidth / 2 + 3}
            y={spouseY - spouseHeight / 2 + 3}
            width={spouseWidth - 6}
            height={spouseHeight - 6}
            className="node-content"
          >
            <div className="node-text-spouse">
              <img
                src={spouse.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(spouse.name)}&background=random&color=fff&size=100`}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(spouse.name)}&background=random&color=fff&size=100`;
                }}
                alt={spouse.name}
                className="node-avatar-spouse"
              />
              <span className="node-name-spouse">{spouse.name}</span>
              {!spouse.alive && <span className="deceased-badge-spouse">†</span>}
            </div>
          </foreignObject>
        </g>
      );

      // Line connecting main person to spouse
      elements.push(
        <line
          key={`spouse-line-${spouse.id}`}
          x1={x + nodeWidth / 2}
          y1={y}
          x2={spouseX - spouseWidth / 2}
          y2={spouseY}
          className="spouse-line"
        />
      );
    });

    // Children
    if (node.children.length > 0) {
      const childrenWidth = node.children.length * offsetX;
      const startChildX = x - childrenWidth / 2 + offsetX / 2;

      node.children.forEach((child, idx) => {
        const childX = startChildX + idx * offsetX;
        const childY = y + offsetY;

        // Merge point for this parent (or parents if there are multiple)
        const mergeX = childX;
        const mergeY = y + offsetY / 2;

        // Line from main person down to merge point
        elements.push(
          <line
            key={`to-child-merge-${child.id}`}
            x1={x}
            y1={y + nodeHeight / 2}
            x2={mergeX}
            y2={mergeY}
            className="parent-line"
          />
        );

        // Line from merge point to child
        elements.push(
          <line
            key={`child-connect-${child.id}`}
            x1={mergeX}
            y1={mergeY}
            x2={childX}
            y2={childY - nodeHeight / 2}
            className="parent-line"
          />
        );

        const childNode = <TreeNode key={`tree-child-${child.id}`} node={child} x={childX} y={childY} offsetX={offsetX} offsetY={offsetY} />;
        elements.push(childNode);
      });
    }

    return <g>{elements}</g>;
  };

  const renderTree = () => {
    if (!selectedPerson || people.length === 0) {
      return <text x="100" y="100" className="no-data-text">Select a person to view their family tree</text>;
    }

    const treeNode = buildTreeStructure(selectedPerson, people);
    if (!treeNode) {
      return <text x="100" y="100" className="no-data-text">No family data for selected person</text>;
    }

    return <TreeNode node={treeNode} x={800} y={80} />;
  };

  if (people.length === 0 && !loading) {
    return (
      <div className="family-tree-container">
        <div className="tree-header">
          <h2>Family Tree</h2>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
        <div className="no-selection">
          <p>Loading people...</p>
        </div>
      </div>
    );
  }

  const selectedPersonName = people.find(p => p.id === selectedPerson)?.name || 'Family Tree';

  return (
    <div className="family-tree-container">
      <div className="tree-header">
        <h2>Family Tree{selectedPerson ? `: ${selectedPersonName}` : ''}</h2>
        <div className="tree-controls">
          <select
            value={selectedPerson || ''}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="person-select"
          >
            <option value="">Select a person...</option>
            {people.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="zoom-controls">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="zoom-btn">−</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="zoom-btn">+</button>
            <button onClick={() => setZoom(1)} className="zoom-btn">Reset</button>
          </div>
        </div>
      </div>

      <div className="tree-canvas-container">
        <svg
          ref={svgRef}
          className="tree-canvas"
          width="2000"
          height="1400"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center'
          }}
        >
          {renderTree()}
        </svg>
      </div>

      <div className="tree-legend">
        <div className="legend-item">
          <div className="legend-color male"></div>
          <span>Male</span>
        </div>
        <div className="legend-item">
          <div className="legend-color female"></div>
          <span>Female</span>
        </div>
        <div className="legend-item">
          <div className="legend-color deceased"></div>
          <span>Deceased (†)</span>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;
