### Data flow Diagram

User Input (Mouse Events)
        │
        ▼
Client (React)
  ├─ Local Preview Stroke (Canvas)
  ├─ Emit strokePreview (WebSocket)
  │
  ▼
Socket.IO Server
  ├─ Broadcast strokePreview to others
  │
  ▼
Other Clients
  ├─ Render Remote Preview Stroke
  │
  ▼
Mouse Release
  ├─ Emit strokeComplete
  │
  ▼
Server
  ├─ Persist stroke
  ├─ Broadcast strokesUpdate
  │
  ▼
All Clients
  ├─ Clear previews
  ├─ Redraw canvas from authoritative state

### WebSocket Protocol

Core Socket Events

| Event              | Direction        | Purpose                              |
| ------------------ | ---------------- | ------------------------------------ |
| `strokePreview`    | Client → Server  | Live drawing preview (not persisted) |
| `strokePreview`    | Server → Clients | Broadcast preview to others          |
| `strokePreviewEnd` | Client → Server  | Clear preview after stroke ends      |
| `strokeComplete`   | Client → Server  | Persist completed stroke             |
| `strokesUpdate`    | Server → Clients | Broadcast authoritative stroke list  |

Cursor Tracking

| Event         | Purpose                             |
| ------------- | ----------------------------------- |
| `cursorMove`  | Broadcast real-time cursor position |
| `cursorLeave` | Remove cursor on disconnect         |

Undo/Redo

| Event  | Purpose                    |
| ------ | -------------------------- |
| `undo` | Remove last stroke by user |
| `redo` | Restore last undone stroke |

### Undo/Redo Strategy

Undo and redo are implemented using a server-authoritative model.

Key Principles
-Undo/redo operations are global
-Each user can undo only their own strokes
-The server maintains:
  A global strokes[] array
  A per-user redoStack[]

Undo Flow
-User emits undo
-Server finds the most recent stroke by that user
-Stroke is removed from strokes[]
-Stroke is pushed to the user’s redo stack
-Updated state is broadcast via strokesUpdate

Redo Flow
-User emits redo
-Server restores the last stroke from redo stack
-Stroke is reinserted into strokes[]
-All clients re-render from updated state

This guarantees consistent undo/redo across all users.

### Performance Decisions

Canvas Rendering
-HTML Canvas API chosen for high-performance drawing
-Canvas is redrawn from state instead of incremental mutations

State Management
-useRef used for mutable drawing data to avoid unnecessary re-renders
-useCallback used to stabilize rendering functions
-Canvas state isolated per stroke using ctx.save() / ctx.restore()

Network Optimization
-Only completed strokes are persisted
-Live previews are transient and never stored
-Cursor updates are lightweight and event-based

### Conflict Resolution

The system avoids conflicts by design
-Each stroke is treated as an atomic unit
-Strokes are appended in the order received by the server
-No stroke overwrites another stroke
-Live previews are visually layered but never persisted

