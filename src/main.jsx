import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() { return this.state.err ? React.createElement("pre", { style: { color: "red", padding: 20 } }, String(this.state.err)) : this.props.children; }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);
