// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

import Home from "./pages/Home.jsx";
import Generator from "./pages/Generator.jsx";
import Board from "./pages/Board.jsx";
import Policy from "./pages/Policy.jsx";
import Privacy from "./pages/Privacy.jsx";
import NotFound from "./pages/NotFound.jsx";
import Auth from "./pages/Auth.jsx";

import { AuthProvider } from "./contexts/AuthContext";

// Vercel Analytics (설치되어 있으면 사용)
import { inject } from "@vercel/analytics";
if (import.meta.env.PROD) inject();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "generator", element: <Generator /> },
      { path: "board", element: <Board /> },
      { path: "policy", element: <Policy /> },
      { path: "privacy", element: <Privacy /> },
      { path: "auth", element: <Auth /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
