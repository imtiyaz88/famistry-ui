import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { buildGraphFromPeople, PersonNode } from '../utils/familyTreeUtils';
import { apiService } from '../services/apiService';
import './FamilyTreeFlow.css';

const FocusedFamilyTree = () => {
  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingTree, setLoadingTree] = useState(false);
  const [error, setError] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Register custom node types - memoized to prevent re-renders
  const nodeTypes = useMemo(
    () => ({
      person: React.memo((props) => (
        <>
          <PersonNode {...props} />
          <Handle type="target" position={Position.Top} id="top" />
          <Handle type="source" position={Position.Bottom} id="bottom" />
          <Handle type="source" position={Position.Left} id="left" />
          <Handle type="target" position={Position.Right} id="right" />
        </>
      )),
    }),
    []
  );

  // Initialize React Flow instance
  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
  }, []);

  // Fetch people data
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoadingPeople(true);
        const data = await apiService.listPeople();
        setPeople(data);
        setLoadingPeople(false);
      } catch (err) {
        console.error('Error fetching people:', err);
        setError(err.message);
        setLoadingPeople(false);
      }
    };

    fetchPeople();
  }, []);

  // Build focused tree when person is selected
  useEffect(() => {
    if (selectedPersonId) {
      const fetchFamilyTree = async () => {
        try {
          setLoadingTree(true);
          setError(null);
          
          console.log('Fetching family tree for person:', selectedPersonId);
          
          // Try to fetch the family graph for the selected person
          let familyData;
          try {
            familyData = await apiService.getGraph(selectedPersonId, 3); // depth=3 to get grandparents to grandchildren
            console.log('Family data received from API:', familyData);
          } catch (apiError) {
            console.warn('API call failed, using fallback data:', apiError);
            // Fallback: use the existing people data
            familyData = people;
            console.log('Using fallback people data:', familyData);
          }
          
          // Build the family tree using the same logic as Flow Diagram
          const { nodes: treeNodes, edges: treeEdges } = buildGraphFromPeople(familyData);
          
          console.log('Tree nodes generated:', treeNodes.length);
          console.log('Tree edges generated:', treeEdges.length);
          
          setNodes(treeNodes);
          setEdges(treeEdges);
          
          // Fit view after a short delay to ensure nodes are rendered
          setTimeout(() => {
            if (reactFlowInstance) {
              reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
            }
          }, 200);
          
          setLoadingTree(false);
        } catch (err) {
          console.error('Error building family tree:', err);
          setError(err.message);
          setLoadingTree(false);
        }
      };

      fetchFamilyTree();
    } else {
      // Clear tree when no person is selected
      setNodes([]);
      setEdges([]);
      setLoadingTree(false);
    }
  }, [selectedPersonId, people]); // Add people dependency for fallback

  if (loadingPeople) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading people...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="focused-family-tree">
      <div className="tree-selector">
        <h2>Select a Person to View Their Family Tree</h2>
        <div className="selector-controls">
          <select
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
            className="person-select"
          >
            <option value="">Choose a person...</option>
            {people
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              .map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || 'Unknown'} {person.birthDate ? `(${new Date(person.birthDate).getFullYear()})` : ''}
                </option>
              ))}
          </select>
          {selectedPersonId && (
            <button
              onClick={() => setSelectedPersonId('')}
              className="clear-btn"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {selectedPersonId && (
        <div className="tree-container">
          <div className="tree-info">
            <h3>
              Family Tree for: {people.find(p => p.id === selectedPersonId)?.name || 'Unknown'}
            </h3>
            <p className="tree-description">
              Showing grandparents, parents, parent's siblings, siblings, children, and grandchildren
            </p>
          </div>
          
          {loadingTree && (
            <div className="tree-loading">
              <div className="loading-spinner">Loading family tree...</div>
            </div>
          )}
          
          {!loadingTree && (
            <div style={{ width: '100%', height: '600px' }}>
              <ReactFlow
                key={`tree-${selectedPersonId}`}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onInit={onInit}
                fitView={false}
                attributionPosition="bottom-left"
                preventScrolling={true}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
              >
                <MiniMap />
                <Controls />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>
          )}
        </div>
      )}

      {!selectedPersonId && (
        <div className="empty-state">
          <div className="empty-message">
            <h3>No Person Selected</h3>
            <p>Please select a person from the dropdown above to view their family tree.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusedFamilyTree;
