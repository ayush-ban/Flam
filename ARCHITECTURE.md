
All clients connect to the same Socket.IO server and share a synchronized canvas state.

## Frontend Architecture

### Key Components

- DrawPage.jsx
  - Main drawing surface
- DrawingTools.jsx
  - Tool selection (brush / eraser)
- UseSocket.js
  - Manages connection to backend

---

### Canvas Rendering Strategy

The canvas rendering is divided into **three logical layers** (rendered sequentially):

1. **Committed Strokes**
   - Fully completed strokes
   - Received from server
   - Used for undo/redo

2. **Local Preview Stroke**
   - Stroke currently being drawn by the local user
   - Rendered immediately for responsiveness

3. **Remote Preview Strokes**
   - Strokes currently being drawn by other users
   - Broadcast live via WebSockets
   - Not persisted

This layered approach ensures smooth real-time collaboration while preserving correctness.

##  State Management (Frontend)

State- Purpose
 `strokes` | Server-authoritative stroke history 
 `remotePreviews` | Live strokes from other users 
 `currentStrokeRef` | Stroke being built locally 
 `previewStrokeRef` | Live preview of local stroke 
 `cursors` | Real-time cursor positions 
 `onlineUsers` | List of connected users 

React `useRef` is used for mutable drawing data to avoid unnecessary re-renders.

---

## Backend Architecture (Socket.IO Server)

### Responsibilities

- Maintain list of connected users
- Assign unique colors to users
- Store committed strokes in memory
- Handle global undo/redo
- Broadcast real-time cursor and preview events

---

### Core Server Data Structures

Variable- Description

 `strokes[]` | Global list of completed strokes 
 `onlineUsers{}` | Connected users and colors 
 `redoStacks{}` | Per-user redo history 

---

### Socket Events

### Drawing Events
- `strokePreview` → Live stroke preview (not stored)
- `strokePreviewEnd` → Clear preview
- `strokeComplete` → Persist stroke
- `strokesUpdate` → Broadcast authoritative state

### Cursor Events
- `cursorMove` → Broadcast cursor position
- `cursorLeave` → Remove cursor

### Undo / Redo
- `undo` → Removes last stroke by the user
- `redo` → Restores last undone stroke

---

##  Undo / Redo Design

Undo and redo are **global but user-scoped**:

- A user can undo **only their own strokes**
- Undo updates the global stroke list
- All clients re-render from server state
- Redo stacks are maintained per user

This ensures consistency across all connected clients.

---

##  Real-Time Synchronization Strategy

- WebSockets are used for low-latency updates
- Only completed strokes are persisted
- Preview strokes are transient
- All clients re-render from the same authoritative state

This prevents desynchronization and visual glitches.

##  Failure & Edge Case Handling

- New clients receive the full canvas state on connect
- Disconnected users are removed from:
  - Cursor list
  - Online users list
  - Redo stacks
- Server restart resets state (known limitation)

##  Scalability Considerations

Current architecture is suitable for:
- Small to medium groups
- Real-time collaboration demos
- Educational and prototype use cases

Future scalability improvements:
- Persistent storage (database)
- Room-based isolation
- Throttling / batching socket events
- Server-side stroke compression



