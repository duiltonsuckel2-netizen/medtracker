import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() { return this.state.err ? React.createElement("pre", { style: { color: "red", padding: 20 } }, String(this.state.err)) : this.props.children; }
}

// Remove splash screen with smooth fade
const splashStart = Date.now();
function removeSplash() {
  const splash = document.getElementById("splash");
  if (!splash) return;
  // Ensure minimum 1.8s so the animation plays fully
  const elapsed = Date.now() - splashStart;
  const remaining = Math.max(0, 1800 - elapsed);
  setTimeout(() => {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 600);
  }, remaining);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);

requestAnimationFrame(removeSplash);
