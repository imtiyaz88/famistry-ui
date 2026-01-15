import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import PersonForm from './PersonForm';
import RelationshipManager from './RelationshipManager';
import './PersonList.css';

function PersonList() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [showRelationshipManager, setShowRelationshipManager] = useState(null);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const data = await apiService.listPeople();
      setPeople(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async (personData) => {
    try {
      await apiService.createPerson(personData);
      loadPeople();
      setShowPersonForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditPerson = async (personData) => {
    try {
      await apiService.updatePerson(editingPerson.id, personData);
      loadPeople();
      setEditingPerson(null);
      setShowPersonForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return;
    }
    try {
      await apiService.deletePerson(id);
      loadPeople();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddRelationship = async (relationship) => {
    try {
      await apiService.addRelationship(showRelationshipManager, relationship);
      loadPeople();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveRelationship = async (targetId) => {
    try {
      await apiService.removeRelationship(showRelationshipManager, targetId);
      loadPeople();
    } catch (err) {
      setError(err.message);
    }
  };

  const openPersonForm = (person = null) => {
    setEditingPerson(person);
    setShowPersonForm(true);
  };

  const closePersonForm = () => {
    setShowPersonForm(false);
    setEditingPerson(null);
  };

  return (
    <div className="person-list-container">
      <header className="app-header">
        <h1>Famistry - Family Tree Manager</h1>
        <button
          className="btn-primary"
          onClick={() => openPersonForm()}
        >
          + Add Person
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          {people.length === 0 ? (
            <div className="empty-state">
              <p>No people added yet. Click "Add Person" to get started.</p>
            </div>
          ) : (
            <div className="people-grid">
              {people.map((person) => {
                const imageUrl = person.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random&color=fff&size=200`;
                return (
                <div key={person.id} className="person-card">
                  <div className="card-image">
                    <img src={imageUrl} alt={person.name} onError={(e) => {e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=666&color=fff&size=200`}} />
                  </div>
                  <div className="card-header">
                    <h3>{person.name}</h3>
                    <div className="card-actions">
                      <button
                        className="btn-icon edit"
                        onClick={() => openPersonForm(person)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDeletePerson(person.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="person-detail">
                      <span className="label">Gender:</span>
                      <span className="value">{person.gender}</span>
                    </div>

                    {!person.alive && (
                      <div className="person-detail">
                        <span className="label">Status:</span>
                        <span className="value deceased">Deceased</span>
                      </div>
                    )}

                    {person.birthDate && (
                      <div className="person-detail">
                        <span className="label">Birth Date:</span>
                        <span className="value">{person.birthDate}</span>
                      </div>
                    )}

                    {person.fatherId && (
                      <div className="person-detail">
                        <span className="label">Father:</span>
                        <span className="value">
                          {people.find((p) => p.id === person.fatherId)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {person.motherId && (
                      <div className="person-detail">
                        <span className="label">Mother:</span>
                        <span className="value">
                          {people.find((p) => p.id === person.motherId)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {person.spouseId && (
                      <div className="person-detail">
                        <span className="label">Spouse:</span>
                        <span className="value">
                          {people.find((p) => p.id === person.spouseId)?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {person.relationships && person.relationships.length > 0 && (
                      <div className="relationships-count">
                        {person.relationships.length} relationship(s)
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn-relationships"
                      onClick={() => setShowRelationshipManager(person.id)}
                    >
                      Manage Relationships
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </>
      )}

      {showPersonForm && (
        <PersonForm
          person={editingPerson}
          onSave={editingPerson ? handleEditPerson : handleAddPerson}
          onCancel={closePersonForm}
          allPeople={people}
        />
      )}

      {showRelationshipManager && (
        <RelationshipManager
          personId={showRelationshipManager}
          person={people.find((p) => p.id === showRelationshipManager)}
          allPeople={people}
          onAdd={handleAddRelationship}
          onRemove={handleRemoveRelationship}
          onClose={() => setShowRelationshipManager(null)}
        />
      )}
    </div>
  );
}

export default PersonList;
