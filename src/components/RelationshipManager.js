import React, { useState, useEffect } from 'react';
import './RelationshipManager.css';

const RELATIONSHIP_TYPES = ['parent', 'father', 'mother', 'partner'];

function RelationshipManager({ personId, person, allPeople, onAdd, onRemove, onClose }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetId: '',
    type: 'parent',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.targetId) {
      alert('Please select a person');
      return;
    }
    onAdd(formData);
    setFormData({ targetId: '', type: 'parent' });
    setShowForm(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const availablePeople = allPeople.filter((p) => p.id !== personId);

  return (
    <div className="relationship-manager-overlay" onClick={onClose}>
      <div className="relationship-manager" onClick={(e) => e.stopPropagation()}>
        <div className="rm-header">
          <h2>Manage Relationships</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Current Relationships */}
        <div className="relationships-list">
          <h3>Current Relationships</h3>
          {person?.relationships && person.relationships.length > 0 ? (
            <ul>
              {person.relationships.map((rel, idx) => {
                const targetPerson = allPeople.find((p) => p.id === rel.targetId);
                return (
                  <li key={idx} className="relationship-item">
                    <span className="rel-info">
                      <strong>{rel.type}</strong>: {targetPerson?.name || 'Unknown'}
                    </span>
                    <button
                      className="btn-remove"
                      onClick={() => onRemove(rel.targetId)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty-state">No relationships yet</p>
          )}
        </div>

        {/* Add Relationship Form */}
        {showForm ? (
          <form className="add-relationship-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Person *</label>
              <select
                name="targetId"
                value={formData.targetId}
                onChange={handleChange}
              >
                <option value="">Select a person</option>
                {availablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Add
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="btn-add-relationship"
            onClick={() => setShowForm(true)}
          >
            + Add Relationship
          </button>
        )}
      </div>
    </div>
  );
}

export default RelationshipManager;
