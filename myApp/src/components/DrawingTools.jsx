import "../styles/DrawingTools.css";

function DrawingTools({
  tool,
  setTool,
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
}) {
  return (
    <div className="toolbar">
      <button
        className={tool === "brush" ? "active" : ""}
        onClick={() => setTool("brush")}
      >
        Brush
      </button>

      <button
        className={tool === "eraser" ? "active" : ""}
        onClick={() => setTool("eraser")}
      >
        Eraser
      </button>

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        // disabled={tool === "eraser"}
        title="Pick color"
      />

      <input
        type="range"
        min="1"
        max="20"
        value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        title="Stroke width"
      />
    </div>
  );
}

export default DrawingTools;
