import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return React.createElement("div", { style: { padding: 40, color: "#F87171", fontFamily: "monospace", background: "#111", minHeight: "100vh" } },
        React.createElement("h2", null, "Erro de renderização"),
        React.createElement("pre", { style: { whiteSpace: "pre-wrap", fontSize: 13, color: "#ccc", marginTop: 16 } }, String(this.state.error?.message || this.state.error)),
        React.createElement("pre", { style: { whiteSpace: "pre-wrap", fontSize: 11, color: "#666", marginTop: 8 } }, String(this.state.error?.stack || ""))
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(ErrorBoundary, null, React.createElement(App)));
