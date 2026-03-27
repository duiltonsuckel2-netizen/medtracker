import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() { return this.state.err ? React.createElement("pre", { style: { color: "red", padding: 20 } }, String(this.state.err)) : this.props.children; }
}

// Remove splash screen after app mounts
function removeSplash() {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 400);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);

// Give the app a moment to render, then fade out splash
requestAnimationFrame(() => setTimeout(removeSplash, 600));
