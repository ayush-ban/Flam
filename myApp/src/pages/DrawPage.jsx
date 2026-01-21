import { useEffect, useRef, useState } from "react";
import DrawingTools from "../components/DrawingTools";
import socket from "../hooks/UseSocket";
import "../styles/DrawPage.css";

function DrawPage() {
  const canvasRef = useRef(null);

  const currentStrokeRef = useRef(null); // stroke to commit
  const previewStrokeRef = useRef(null); // local preview

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

  const [strokes, setStrokes] = useState([]);
  const [remotePreviews, setRemotePreviews] = useState({});
  const [cursors, setCursors] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  /* ================= SOCKET LISTENERS ================= */

  useEffect(() => {
    socket.on("strokesUpdate", setStrokes);
    socket.on("onlineUsers", setOnlineUsers);

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

    // 🔥 remote live stroke preview
    socket.on("strokePreview", (stroke) => {
      setRemotePreviews((prev) => ({
        ...prev,
        [stroke.userId]: stroke,
      }));
    });

    socket.on("strokePreviewEnd", (userId) => {
      setRemotePreviews((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });

    return () => {
      socket.off("strokesUpdate");
      socket.off("onlineUsers");
      socket.off("cursorMove");
      socket.off("cursorLeave");
      socket.off("strokePreview");
      socket.off("strokePreviewEnd");
    };
  }, []);

  /* ================= CANVAS SETUP ================= */

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ================= DRAW HELPERS ================= */

  const drawStroke = (ctx, stroke) => {
    ctx.beginPath();
    ctx.lineWidth = stroke.strokeWidth;

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
    }

    stroke.points.forEach((p, i) =>
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
    );

    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // committed strokes
    strokes.forEach((s) => drawStroke(ctx, s));

    // local preview
    if (previewStrokeRef.current) {
      drawStroke(ctx, previewStrokeRef.current);
    }

    // remote previews
    Object.values(remotePreviews).forEach((s) => {
      drawStroke(ctx, s);
    });
  };

  useEffect(() => {
    redrawCanvas();
  }, [strokes, remotePreviews]);

  /* ================= DRAWING EVENTS ================= */

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stroke = {
      tool,
      color,
      strokeWidth,
      points: [{ x, y }],
    };

    previewStrokeRef.current = stroke;
    currentStrokeRef.current = structuredClone(stroke);

    setIsDrawing(true);
  };

  const draw = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("cursorMove", { x, y });

    if (!isDrawing || !previewStrokeRef.current) return;

    previewStrokeRef.current.points.push({ x, y });
    currentStrokeRef.current.points.push({ x, y });

    // 🔥 send live preview to others
    socket.emit("strokePreview", {
      tool,
      color,
      strokeWidth,
      points: previewStrokeRef.current.points,
    });

    redrawCanvas();
  };

  const stopDrawing = () => {
    if (!currentStrokeRef.current) return;

    socket.emit("strokeComplete", currentStrokeRef.current);

    socket.emit("strokePreviewEnd");

    previewStrokeRef.current = null;
    currentStrokeRef.current = null;
    setIsDrawing(false);
  };

  /* ================= UI ================= */

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
          {onlineUsers.map((u) => (
            <li key={u.id}>
              <span className="user-dot" style={{ backgroundColor: u.color }} />
              User {u.id.slice(0, 4)}
            </li>
          ))}
        </ul>
      </div>

      <div className="canvas-wrapper">
        {Object.entries(cursors).map(([id, c]) => (
          <div
            key={id}
            className="remote-cursor"
            style={{
              left: c.x,
              top: c.y,
              backgroundColor: c.color,
            }}
          />
        ))}

        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <div className="undo-redo">
        <button onClick={() => socket.emit("undo")}>Undo</button>
        <button onClick={() => socket.emit("redo")}>Redo</button>
      </div>
    </div>
  );
}

export default DrawPage;
