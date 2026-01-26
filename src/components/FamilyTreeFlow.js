import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import './FamilyTreeFlow.css';

const FamilyTreeFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Register custom node types
  const nodeTypes = useMemo(
    () => ({
      person: (props) => (
        <>
          <PersonNode {...props} />
          <Handle type="target" position={Position.Top} id="top" />
          <Handle type="source" position={Position.Bottom} id="bottom" />
          <Handle type="source" position={Position.Left} id="left" />
          <Handle type="target" position={Position.Right} id="right" />
        </>
      ),
    }),
    []
  );

  // Fit view when nodes are loaded
  const onInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      instance.fitView({ padding: 0.2, duration: 800 });
    }, 100);
  }, []);

  // Fetch data and build graph - only run once on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchAndBuildGraph = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/person');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const people = await response.json();

        if (!isMounted) return;

        // Build graph from people data
        const { nodes: graphNodes, edges: graphEdges } = buildGraphFromPeople(people);
        
        setNodes(graphNodes);
        setEdges(graphEdges);
        setError(null);
        
        // Fit view after nodes are set - use a ref to avoid dependency issues
        setTimeout(() => {
          if (reactFlowInstance && isMounted) {
            reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
          }
        }, 300);
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load family tree: ${err.message}`);
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAndBuildGraph();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Separate effect to fit view when instance becomes available
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reactFlowInstance, nodes.length]);

  // Handle fit view button
  const onFitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
    }
  }, [reactFlowInstance]);

  // Memoize node types to prevent re-renders
  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  // Get generation statistics
  const generationStats = useMemo(() => {
    const stats = {};
    nodes.forEach(node => {
      const gen = node.data?.generationLevel || 0;
      stats[gen] = (stats[gen] || 0) + 1;
    });
    return stats;
  }, [nodes]);

  if (loading) return <div className="tree-loading">Loading family tree...</div>;
  if (error) return <div className="tree-error">{error}</div>;

  return (
    <div className="family-tree-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypesMemo}
        onInit={onInit}
        fitView={false}
        attributionPosition="bottom-right"
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={2}
        connectionLineStyle={{ stroke: '#6b7280', strokeWidth: 2 }}
        snapToGrid={false}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#aaa" 
          gap={20}
          size={2}
          variant="dots"
        />
        <Controls 
          position="top-left"
          showFitView={true}
          showInteractive={true}
          showZoom={true}
        />
        <MiniMap 
          position="bottom-right"
          width={220}
          height={160}
          nodeColor={(node) => {
            const gender = node.data?.gender || 'other';
            return gender === 'male' ? '#3b82f6' : gender === 'female' ? '#ec4899' : '#9ca3af';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-right" className="tree-info-panel">
          <div className="tree-stats">
            <div className="stat-item">
              <span className="stat-label">People:</span>
              <span className="stat-value">{nodes.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Relationships:</span>
              <span className="stat-value">{edges.length}</span>
            </div>
            {Object.keys(generationStats).length > 0 && (
              <div className="stat-item">
                <span className="stat-label">Generations:</span>
                <span className="stat-value">{Object.keys(generationStats).length}</span>
              </div>
            )}
          </div>
        </Panel>
        <Panel position="bottom-left" className="tree-legend-panel">
          <div className="tree-legend">
            <div className="legend-title">Legend</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-line parent-line"></div>
                <span>Parent-Child</span>
              </div>
              <div className="legend-item">
                <div className="legend-line spouse-line"></div>
                <span>Spouse</span>
              </div>
              <div className="legend-item">
                <div className="legend-badge">G0</div>
                <span>Generation Level</span>
              </div>
              <div className="legend-item">
                <div className="legend-duplicate-box"></div>
                <span>Duplicate Person*</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FamilyTreeFlow;
