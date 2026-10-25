// -----------------------------------------------------------------------
// main.jsx
// WHAT: The very first file that runs. It finds the <div id="root">
//       in index.html and tells React to render our <App /> inside it.
// WHY:  Every React app needs exactly one "mount point" like this.
// -----------------------------------------------------------------------
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
