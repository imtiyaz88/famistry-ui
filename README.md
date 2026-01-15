# Famistry UI

A React-based UI for managing family tree relationships. Allows CRUD operations on persons and relationships.

## Features

- **Person Management**: Add, edit, delete persons with details (name, gender, birth date, parents, spouse, alive status, profile image)
- **Relationship Management**: Add and remove relationships between persons (parent, father, mother, partner)
- **Status Tracking**: Mark persons as living or deceased
- **Profile Images**: Display profile pictures for each person
- **Grid View**: Display all persons in a card-based grid layout with thumbnails
- **Real-time Sync**: Automatic synchronization with backend API

## Setup

### Prerequisites

- Node.js 14+ and npm
- Backend API running at `http://localhost:8080`

### Installation

```bash
cd famistry-ui
npm install
```

### Development

```bash
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## API Integration

The UI communicates with the backend API at `http://localhost:8080/api/person` for:

- Create person: `POST /api/person`
- List persons: `GET /api/person`
- Get person: `GET /api/person/:id`
- Update person: `PUT /api/person/:id`
- Delete person: `DELETE /api/person/:id`
- Add relationship: `POST /api/person/:id/relationships`
- Remove relationship: `DELETE /api/person/:id/relationships/:targetId`

## Project Structure

```
src/
├── components/
│   ├── PersonList.js          # Main list view with CRUD
│   ├── PersonList.css
│   ├── PersonForm.js          # Form for add/edit person
│   ├── PersonForm.css
│   ├── RelationshipManager.js # Manage relationships for a person
│   └── RelationshipManager.css
├── services/
│   └── apiService.js          # API client
├── App.js
├── App.css
└── index.js
public/
└── index.html
```

## How to Use

1. **Add a Person**: Click "Add Person" button, fill in the details (including alive status and image URL), and save
2. **Edit a Person**: Click the edit icon (✎) on a person card
3. **Delete a Person**: Click the delete icon (✕) on a person card
4. **Manage Relationships**: Click "Manage Relationships" button on a person card
5. **Add Relationship**: In the relationship manager, select type and target person, then add
6. **Remove Relationship**: Click "Remove" button next to a relationship

## Person Fields

- **Name** (required): Full name of the person
- **Gender**: male, female, or other
- **Birth Date**: Date in `YYYY-MM-DD` format (optional)
- **Father**: Link to father person (optional)
- **Mother**: Link to mother person (optional)
- **Spouse**: Link to spouse person (optional)
- **Is Alive**: Checkbox indicating if person is living (default: true)
- **Image URL**: URL to person's profile image (optional)
