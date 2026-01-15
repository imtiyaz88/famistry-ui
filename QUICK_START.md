# Family Tree Flow - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Ensure Backend is Running

```bash
cd /Users/imtiyazmd/Documents/vscode_projects/famistry
./gradlew bootRun
# Backend will start on http://localhost:8080
```

### 2. Start React Development Server

```bash
cd /Users/imtiyazmd/Documents/vscode_projects/famistry-ui
npm start
# Frontend will open at http://localhost:3000
```

### 3. View the Family Tree

1. Open browser to `http://localhost:3000`
2. Click the **📊 Flow Diagram** button in the navigation
3. The family tree will load and auto-layout

## 🎨 What You'll See

```
          Grandfather          Grandmother
                    \            /
                     \          /
                        Father ━━━━━ Mother
                          │
                          │
                      ┌───┴───┐
                      │       │
                    Child   Spouse
```

**Features:**
- ✅ Auto-arranged hierarchy (parents above children)
- ✅ Color-coded by gender (blue = male, pink = female)
- ✅ Avatar images displayed in circles
- ✅ Birth year shown below name
- ✅ Zoom, pan, and fit-to-view controls
- ✅ Mini-map in corner
- ✅ Deceased indicator (✝)

## 📁 Files Created

```
famistry-ui/
├── src/
│   ├── components/
│   │   ├── FamilyTreeFlow.js          ← Main component
│   │   └── FamilyTreeFlow.css         ← Styling
│   ├── utils/
│   │   └── familyTreeUtils.js         ← Helper functions
│   └── App.js                         ← Updated with new view
├── FAMILY_TREE_FLOW_README.md         ← Full documentation
└── QUICK_START.md                     ← This file
```

## 🔧 How It Works

### Data Flow

```
Backend (/api/person)
    ↓
FamilyTreeFlow.js (fetch)
    ↓
buildGraphFromPeople() (transform)
    ↓
layoutGraph() (Dagre layout)
    ↓
ReactFlow (render)
    ↓
PersonNode (custom component)
    ↓
Browser Display
```

### Key Functions

#### `buildGraphFromPeople(people)`
- Creates nodes from person objects
- Creates edges for parent-child and spouse relationships
- Prevents duplicate edges
- Returns `{ nodes, edges }`

#### `layoutGraph(nodes, edges)`
- Uses Dagre to arrange nodes hierarchically
- Parents positioned above children
- 50px spacing between generations
- Returns nodes with calculated positions

#### `PersonNode({ data })`
- Renders individual person card
- Shows avatar, name, birth year
- Color-coded by gender
- Deceased indicator

## 📊 Data Structure

Expected from backend:

```javascript
[
  {
    id: "p1",
    name: "John Doe",
    gender: "male",
    birthDate: "1990-05-15",
    fatherId: "p2",
    motherId: "p3",
    spouseId: "p4",
    imageUrl: "https://...",
    isAlive: true
  },
  // ... more people
]
```

## 🎯 Common Tasks

### Change Node Colors

Edit `FamilyTreeFlow.css`:

```css
.person-node {
  /* Blue = #3b82f6 */
  /* Pink = #ec4899 */
  /* Gray = #9ca3af */
  background-color: #your-color;
}
```

### Add Click Handler

Edit `FamilyTreeFlow.js`, in the PersonNode component:

```javascript
const PersonNode = ({ data }) => (
  <div
    className="person-node"
    onClick={() => console.log('Clicked:', data.name)}
  >
    {/* ... */}
  </div>
);
```

### Filter by Root Person

Edit `buildGraphFromPeople()` to filter data before creating nodes.

### Change Node Size

Edit `layoutGraph()`:

```javascript
g.setNode(node.id, { 
  width: 200,  // Change from 150
  height: 120  // Change from 90
});
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tree not showing | Check backend running on 8080 |
| No relationships showing | Verify `fatherId`, `motherId`, `spouseId` populated |
| Nodes overlapping | Increase margin values in `layoutGraph()` |
| Images not loading | Check `imageUrl` is valid HTTPS |
| Slow performance | Reduce generations or people count |

## 📚 Full Documentation

See `FAMILY_TREE_FLOW_README.md` for:
- Complete API reference
- Styling customization
- Performance optimization
- Advanced usage examples
- Browser support
- Accessibility features

## 🔄 Switching Views

The app now has 3 views:

1. **👥 People** - List and manage people (existing)
2. **🌳 Family Tree** - Custom SVG visualization (existing)
3. **📊 Flow Diagram** - React Flow (new)

Click buttons to switch between views. Flow Diagram shows a back button since it takes full screen.

## 📦 Dependencies

Already installed:
- `reactflow@11.11.4` - Flow visualization library
- `dagre@0.8.5` - Graph layout algorithm

## 🚨 Common Errors

### "Cannot find module 'reactflow'"
```bash
cd /Users/imtiyazmd/Documents/vscode_projects/famistry-ui
npm install reactflow dagre --save
```

### CORS Error
Ensure Spring Boot has CORS enabled (should already be configured).

### Build fails with warnings
Safe to ignore ESLint warnings - build still succeeds.

## ✨ Next Steps

1. **Test with data** - Add some people with relationships via the People view
2. **Customize styling** - Edit `FamilyTreeFlow.css` to match your design
3. **Add features** - Click handlers, detail views, filtering
4. **Deploy** - `npm run build` creates production build

## 📞 Help

- Full docs: `FAMILY_TREE_FLOW_README.md`
- React Flow docs: https://reactflow.dev
- Dagre docs: https://github.com/dagrejs/dagre

---

**Enjoy your family tree visualization! 🌳**
