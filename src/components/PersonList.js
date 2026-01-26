import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import RelationshipManager from './RelationshipManager';
import './PersonList.css';

function PersonList({ openPersonForm, people, refreshPeople }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRelationshipManager, setShowRelationshipManager] = useState(null);

  const deletePerson = async (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        setLoading(true);
        await apiService.deletePerson(id);
        refreshPeople(); // Refresh people list after successful delete
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddRelationship = async (relationship) => {
    try {
      setLoading(true);
      await apiService.addRelationship(showRelationshipManager, relationship);
      refreshPeople(); // Refresh people list after successful operation
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelationship = async (targetId) => {
    try {
      setLoading(true);
      await apiService.removeRelationship(showRelationshipManager, targetId);
      refreshPeople(); // Refresh people list after successful operation
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRelationshipManager = (personId) => {
    setShowRelationshipManager(personId);
  };

  const closeRelationshipManager = () => {
    setShowRelationshipManager(null);
    refreshPeople(); // Refresh people list to show updated relationships
  };

  return (
    <div className="person-list-container">
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
                        onClick={() => deletePerson(person.id)}
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

                    {person.comment && (
                      <div className="person-detail">
                        <span className="label">Comment:</span>
                        <span className="value">{person.comment}</span>
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
