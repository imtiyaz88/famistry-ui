import React, { useState } from 'react';
import PersonList from './components/PersonList';
import FamilyTree from './components/FamilyTree';
import FamilyTreeFlow from './components/FamilyTreeFlow';
import './App.css';

function App() {
  const [view, setView] = useState('people'); // 'people', 'tree', or 'tree-flow'

  return (
    <div className="App">
      {view !== 'tree-flow' && (
        <nav className="app-nav">
          <div className="nav-container">
            <h1 className="app-title">Famistry</h1>
            <div className="nav-buttons">
              <button
                className={`nav-btn ${view === 'people' ? 'active' : ''}`}
                onClick={() => setView('people')}
              >
                👥 People
              </button>
              <button
                className={`nav-btn ${view === 'tree' ? 'active' : ''}`}
                onClick={() => setView('tree')}
              >
                🌳 Family Tree
              </button>
              <button
                className={`nav-btn ${view === 'tree-flow' ? 'active' : ''}`}
                onClick={() => setView('tree-flow')}
              >
                📊 Flow Diagram
              </button>
            </div>
          </div>
        </nav>
      )}
      {view === 'tree-flow' && (
        <button
          className="back-btn"
          onClick={() => setView('people')}
          title="Back to People"
        >
          ← Back
        </button>
      )}
      <div className="app-content">
        {view === 'people' && <PersonList />}
        {view === 'tree' && <FamilyTree />}
        {view === 'tree-flow' && <FamilyTreeFlow />}
      </div>
    </div>
  );
}

export default App;
