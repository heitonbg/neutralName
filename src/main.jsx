import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./App.css";
import { storage } from "./utils/storage.js";
import { StoreProvider } from "./store/StoreProvider.jsx";

document.body.dataset.theme = storage.getTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>,
);
