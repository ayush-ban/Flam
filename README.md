### Tech Stack

### Frontend
- React (Vite)
- HTML Canvas API
- Socket.IO Client
- CSS

### Backend
- Node.js
- Socket.IO
- HTTP Server

### Starting up the project

"Write this in the terminal"

cd myApp/server
npm install
node index.js

Let the server run on this terminal and open a new terminal.
In the new terminal --

cd myApp
npm install 
npm run dev 

Now you will see a link like this in the terminal "Local:   http://localhost:5173/"
Open it and you are ready to use it.

### Test Multiplayer

Open the app in two different browsers or incognito windows
Start drawing

You’ll see:
-Live strokes
-Cursor positions
-Online users
-Undo / redo synced globally

### Known Limitations

-No persistence after server restart
All drawings are stored in memory on the server. Restarting the server clears the canvas.

-No authentication
Users are identified only by socket connection. Refreshing the page assigns a new user identity.

-No private rooms
All connected users share the same drawing board.

### Time spent on the Project

Around 20-22 hours.