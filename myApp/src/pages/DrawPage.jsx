import { useEffect, useRef, useState } from "react";
import DrawingTools from "../components/DrawingTools";
import socket from "../hooks/UseSocket";
import "../styles/DrawPage.css";

function DrawPage() {
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [cursors, setCursors] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("onlineUsers");
  }, []);

  /* Disable scroll only on this page */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, []);

  /* Resize canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  /* 🔴 Remote drawing */
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    socket.on("drawStart", ({ x, y }) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
    });

    socket.on("draw", (data) => {
      ctx.lineWidth = data.strokeWidth;

      if (data.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = data.color; // ✅ server color
      }

      ctx.lineTo(data.x, data.y);
      ctx.stroke();
    });

    return () => {
      socket.off("drawStart");
      socket.off("draw");
    };
  }, []);

  /* 🔵 Remote cursors */
  useEffect(() => {
    socket.on("cursorMove", ({ socketId, x, y, color }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, color },
      }));
    });

    socket.on("cursorLeave", (socketId) => {
      setCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    return () => {
      socket.off("cursorMove");
      socket.off("cursorLeave");
    };
  }, []);

  /* 🟢 Local draw start */
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);

    socket.emit("drawStart", { x, y });
  };

  /* 🟢 Local draw + cursor */
  const draw = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("cursorMove", { x, y }); // ✅ no color sent

    if (!isDrawing) return;

    ctx.lineWidth = strokeWidth;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("draw", {
      x,
      y,
      tool,
      strokeWidth,
      color,
    });
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    setIsDrawing(false);
  };

  return (
    <div className="draw-page">
      <h1 className="draw-title">Drawing Board</h1>

      <DrawingTools
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />

      <div className="online-users">
        <strong>Online Users ({onlineUsers.length})</strong>

        <ul>
          {onlineUsers.map((user) => (
            <li key={user.id}>
              <span
                className="user-dot"
                style={{ backgroundColor: user.color }}
              />
              User {user.id.slice(0, 4)}
            </li>
          ))}
        </ul>
      </div>

      <div className="canvas-wrapper">
        {Object.entries(cursors).map(([id, cursor]) => (
          <div
            key={id}
            className="remote-cursor"
            style={{
              left: cursor.x,
              top: cursor.y,
              backgroundColor: cursor.color,
            }}
          />
        ))}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="drawing-canvas"
        />
      </div>
    </div>
  );
}

export default DrawPage;
