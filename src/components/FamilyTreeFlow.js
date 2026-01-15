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
        attributionPosition="bottom-right"
      >
        <Background 
          color="#aaa" 
          gap={16}
          size={2}
        />
        <Controls 
          position="top-left"
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          position="bottom-right"
          width={200}
          height={150}
        />
      </ReactFlow>
    </div>
  );
};

export default FamilyTreeFlow;
