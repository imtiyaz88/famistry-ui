import React, { useState, useEffect } from 'react';
import PersonList from './components/PersonList';
import FamilyTreeFlow from './components/FamilyTreeFlow';
import FocusedFamilyTree from './components/FocusedFamilyTree';
import PersonForm from './components/PersonForm';
import { apiService } from './services/apiService';
import './App.css';

function App() {
  const [view, setView] = useState('people'); // 'people', 'tree-flow', or 'focused-tree'
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [people, setPeople] = useState([]);

  // Load people data for PersonForm
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const data = await apiService.listPeople();
        setPeople(data);
      } catch (err) {
        console.error('Error loading people:', err);
      }
    };
    loadPeople();
  }, []);

  const openPersonForm = (person = null) => {
    setEditingPerson(person);
    setShowPersonForm(true);
  };

  const closePersonForm = () => {
    setShowPersonForm(false);
    setEditingPerson(null);
  };

  const handleSavePerson = async (personData) => {
    try {
      if (editingPerson) {
        // Edit existing person
        await apiService.updatePerson(editingPerson.id, personData);
      } else {
        // Add new person
        await apiService.createPerson(personData);
      }
      closePersonForm();
      // Refresh people list
      refreshPeople();
    } catch (err) {
      console.error('Error saving person:', err);
      alert('Error saving person: ' + err.message);
    }
  };

  const refreshPeople = async () => {
    try {
      const data = await apiService.listPeople();
      setPeople(data);
    } catch (err) {
      console.error('Error refreshing people:', err);
    }
  };

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
                className={`nav-btn ${view === 'tree-flow' ? 'active' : ''}`}
                onClick={() => setView('tree-flow')}
              >
                📊 Flow Diagram
              </button>
              <button
                className={`nav-btn ${view === 'focused-tree' ? 'active' : ''}`}
                onClick={() => setView('focused-tree')}
              >
                🌲 Tree
              </button>
              <button
                className="nav-btn add-person-btn"
                onClick={() => openPersonForm()}
                title="Add a new person to the family tree"
              >
                ➕ Add Person
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
      {view === 'focused-tree' && (
        <button
          className="back-btn"
          onClick={() => setView('people')}
          title="Back to People"
        >
          ← Back
        </button>
      )}
      <div className="app-content">
        {view === 'people' && <PersonList openPersonForm={openPersonForm} people={people} refreshPeople={refreshPeople} />}
        {view === 'tree-flow' && <FamilyTreeFlow />}
        {view === 'focused-tree' && <FocusedFamilyTree />}
      </div>
      
      {/* Person Form Modal */}
      {showPersonForm && (
        <PersonForm
          person={editingPerson}
          onClose={closePersonForm}
          onSave={handleSavePerson}
          allPeople={people}
        />
      )}
    </div>
  );
}

export default App;
