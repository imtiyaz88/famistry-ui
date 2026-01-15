import React, { useState, useEffect } from 'react';
import './PersonForm.css';

function PersonForm({ person, onSave, onCancel, allPeople }) {
  const [formData, setFormData] = useState(
    person || {
      name: '',
      gender: 'male',
      birthDate: '',
      fatherId: '',
      motherId: '',
      spouseId: '',
      alive: true,
      imageUrl: '',
      attributes: {},
    }
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="person-form-overlay" onClick={onCancel}>
      <form className="person-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{person ? 'Edit Person' : 'Add Person'}</h2>
          <button type="button" className="close-btn" onClick={onCancel} title="Close">✕</button>
        </div>

        {formData.name && (
          <div className="form-group">
            <label>Avatar Preview</label>
            <div className="avatar-preview">
              <img src={formData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=120`} alt="Avatar preview" onError={(e) => {e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=666&color=fff&size=120`}} />
              {formData.imageUrl && <p className="custom-image">Custom Image</p>}
              {!formData.imageUrl && <p className="default-avatar">Default Avatar</p>}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Birth Date</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Father</label>
          <select
            name="fatherId"
            value={formData.fatherId || ''}
            onChange={handleChange}
            disabled={!!person}
          >
            <option value="">None</option>
            {allPeople
              .filter((p) => p.gender === 'male' && p.id !== person?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Mother</label>
          <select
            name="motherId"
            value={formData.motherId || ''}
            onChange={handleChange}
            disabled={!!person}
          >
            <option value="">None</option>
            {allPeople
              .filter((p) => p.gender === 'female' && p.id !== person?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Spouse</label>
          <select
            name="spouseId"
            value={formData.spouseId || ''}
            onChange={handleChange}
            disabled={!!person}
          >
            <option value="">None</option>
            {allPeople
              .filter((p) => p.id !== person?.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="alive"
              checked={formData.alive}
              onChange={handleChange}
            />
            {' '}Is Alive
          </label>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl || ''}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PersonForm;
