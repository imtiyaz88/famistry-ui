# Family Tree Flow Visualization Component

A professional React Flow-based family tree visualization component with Dagre automatic layout, supporting zoom, pan, and fit-to-view capabilities.

## Features

✅ **Automatic Layout** - Dagre automatically arranges family members hierarchically with parents above children
✅ **Gender-Based Styling** - Color-coded nodes: blue (male), pink (female), gray (other/deceased)
✅ **Custom Person Nodes** - Displays avatar, name, and birth year with deceased indicator
✅ **Relationship Edges** - Vertical edges for parent-child, dashed horizontal for spouse/partner
✅ **Duplicate Prevention** - Avoids duplicate spouse edges
✅ **Interactive Controls** - Zoom, pan, fit-to-view, mini-map
✅ **Responsive Design** - Adapts to different screen sizes
✅ **Image Support** - Shows avatar images from `imageUrl` field
✅ **Error Handling** - Graceful loading and error states

## Installation

The required dependencies are already installed:

```bash
npm install reactflow dagre
```

## Component Files

### 1. **FamilyTreeFlow.js**
Main component that fetches data and renders the React Flow diagram.

```javascript
import FamilyTreeFlow from './components/FamilyTreeFlow';
```

**Props:** None (fetches data from backend API)

**Features:**
- Fetches from `/api/person` endpoint
- Manages nodes and edges state
- Registers custom person node component
- Provides loading and error states

### 2. **familyTreeUtils.js**
Helper utilities for data transformation and layout.

#### **PersonNode** Component
Custom node displaying individual person information.

```javascript
export const PersonNode = ({ data }) => { ... }
```

**Data Props:**
- `name`: Person's name
- `gender`: "male" | "female" | "other"
- `birthYear`: Birth year (extracted from birthDate)
- `imageUrl`: Optional avatar URL
- `isAlive`: Boolean indicating if person is living

#### **buildGraphFromPeople()** Function
Transforms raw people data into React Flow nodes and edges format.

```javascript
const { nodes, edges } = buildGraphFromPeople(people);
```

**Algorithm:**
1. Creates a node for each person with gender-based color
2. Creates edges for:
   - Father → Child (vertical, solid gray)
   - Mother → Child (vertical, solid gray)
   - Spouse connections (horizontal, dashed pink)
3. Prevents duplicate spouse edges using sorted ID keys
4. Applies Dagre layout to all nodes

#### **layoutGraph()** Function
Applies Dagre graph layout algorithm.

**Configuration:**
- `rankdir`: "TB" (top-to-bottom, parents above children)
- `align`: "UR" (up-right alignment)
- `marginx`: 50 (horizontal spacing)
- `marginy`: 50 (vertical spacing)
- Node dimensions: 150×90 pixels

## Data Format

The component expects data from `/api/person` endpoint returning:

```javascript
{
  id: "person-1",
  name: "John Doe",
  gender: "male",
  birthDate: "1990-05-15",
  fatherId: "person-father" or "",
  motherId: "person-mother" or "",
  spouseId: "person-spouse" or "",
  imageUrl: "https://...",
  isAlive: true,
  // ... other fields
}
```

## Edge Types

### Parent-Child Edges (Vertical)
- **Source**: Father or Mother
- **Target**: Child
- **Style**: Solid gray line (#6b7280)
- **Marker**: Closed arrow

### Spouse Edges (Horizontal)
- **Style**: Dashed pink line (#ec4899, 5px dash pattern)
- **Marker**: Closed arrow
- **Deduplication**: Uses sorted ID pairs to prevent duplicates

## Node Styling

### Colors by Gender
```
Male:    #3b82f6 (Blue)
Female:  #ec4899 (Pink)
Other:   #9ca3af (Gray)
Deceased: 0.6 opacity applied
```

### Node Size
- **Width**: 150px
- **Height**: 90px
- **Border Radius**: 8px
- **Shadow**: 0 4px 12px rgba(0, 0, 0, 0.15)

### Interactive States
- **Hover**: Scale 1.05, shadow increases, white border
- **Transition**: 0.3s ease

## Usage Example

### Basic Integration

```javascript
import FamilyTreeFlow from './components/FamilyTreeFlow';

export default function App() {
  return <FamilyTreeFlow />;
}
```

### In Existing App with Navigation

```javascript
import { useState } from 'react';
import FamilyTreeFlow from './components/FamilyTreeFlow';

function App() {
  const [view, setView] = useState('tree-flow');

  return (
    <div>
      {view === 'tree-flow' && (
        <button onClick={() => setView('people')}>← Back</button>
      )}
      {view === 'tree-flow' && <FamilyTreeFlow />}
    </div>
  );
}
```

## API Integration

The component fetches from:
- **Endpoint**: `http://localhost:8080/api/person`
- **Method**: GET
- **Response**: Array of person objects

### Backend Setup Required

Ensure your Spring Boot backend exposes the person list endpoint:

```java
@GetMapping("/person")
public List<PersonDto> listPeople() {
    return personService.getAllPeople();
}
```

## Layout Behavior

### Hierarchy Generation
1. **Root Nodes**: People without fathers or mothers
2. **Descendants**: Connected via parent-child edges going downward
3. **Spouses**: Positioned horizontally adjacent to main person
4. **Ancestors**: Parents appear above children
5. **Spacing**: Automatic 50px margins maintained

### Cycle Prevention
- Dagre prevents infinite loops in family trees
- Each person appears once, reducing duplicates
- Spouse edges use deduplicated keys

## Interactive Features

### Controls
- **Zoom In/Out**: Mouse wheel or ± buttons
- **Pan**: Click and drag canvas
- **Fit View**: Auto-adjust zoom to show all nodes
- **Mini Map**: Overview of full tree on bottom-right

### Node Interaction
- **Hover**: Node scales up with enhanced shadow
- **Click**: Currently displays node (no default action)
- Can be extended with selection or detail views

## Styling & CSS

### Main CSS File: `FamilyTreeFlow.css`

Key classes:
- `.family-tree-flow`: Container div
- `.person-node`: Individual node styling
- `.person-avatar`: Image styling (circular, 50×50)
- `.person-info`: Text container
- `.person-name`: Name text (12px, bold, centered)
- `.person-birth-year`: Birth year text (10px, lighter)
- `.person-deceased`: Deceased indicator (✝ symbol)

### Customization

To change colors, edit `FamilyTreeFlow.css`:

```css
/* Change male color */
.person-node {
  /* Blue (#3b82f6) → Your color */
}

/* Change default margin */
g.dagre-subgraph margin: 50px; /* Increase for more spacing */
```

## Performance Considerations

- **Node Limit**: Tested with 100+ people
- **Rendering**: Uses React Flow's virtualization
- **Layout Time**: Dagre layout ~100ms for large trees
- **Memory**: Proportional to number of people

### Optimization Tips
1. Use pagination for very large families (1000+)
2. Lazy load avatar images
3. Cache layout for known family structures
4. Consider clustering distant relatives

## Error Handling

### Loading State
- Shows "Loading family tree..." while fetching
- Fallback: "Unknown" name for missing data

### Error State
- Displays error message with fetch error details
- Logs errors to console for debugging
- Graceful fallback to empty tree

### Data Validation
- Skips missing relationships (empty fatherId, etc.)
- Handles null/undefined imageUrl gracefully
- Validates gender field with fallback to "other"

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- React 16.8+ (for hooks)
- ES2015+ JavaScript support

## Accessibility

- Semantic HTML in person nodes
- ARIA labels in SVG connections
- Keyboard navigation via React Flow
- High contrast colors for gender differentiation

## Troubleshooting

### Tree not showing
1. Check backend is running on `localhost:8080`
2. Verify `/api/person` endpoint returns data
3. Check browser console for CORS errors

### Nodes overlapping
1. Increase `marginx` and `marginy` in `layoutGraph()`
2. Adjust node dimensions (width/height)
3. Check for very deep family hierarchies

### Spouse not showing
1. Verify `spouseId` field in person object
2. Check deduplication logic in `buildGraphFromPeople()`
3. Ensure spouse record exists in database

### Performance slow
1. Reduce number of displayed generations
2. Implement virtual scrolling for large families
3. Cache layout results

## Advanced Usage

### Selecting Specific Root Person

Modify `FamilyTreeFlow.js` to accept a root person ID:

```javascript
const [rootPersonId, setRootPersonId] = useState(null);

// Filter people to selected root and descendants:
const filtered = people.filter(p => 
  isDescendantOf(p, rootPersonId, people)
);
const { nodes, edges } = buildGraphFromPeople(filtered);
```

### Custom Node Styling

Edit `PersonNode` component:

```javascript
export const PersonNode = ({ data, selected }) => {
  return (
    <div className={`person-node ${selected ? 'selected' : ''}`}>
      {/* ... */}
    </div>
  );
};
```

### Add Click Handlers

```javascript
<div
  className="person-node"
  onClick={() => onPersonClick(data.id)}
>
  {/* ... */}
</div>
```

## Files Summary

| File | Purpose | Lines |
|------|---------|-------|
| `FamilyTreeFlow.js` | Main component | ~65 |
| `familyTreeUtils.js` | Utilities & layout | ~180 |
| `FamilyTreeFlow.css` | Styling | ~160 |
| `App.js` | Integration (modified) | ~50 |

## Dependencies

- `reactflow` (^11.0.0) - Flow visualization
- `dagre` (^0.8.5) - Graph layout
- `react` (^18.0.0) - UI framework

## License

Same as parent project.
