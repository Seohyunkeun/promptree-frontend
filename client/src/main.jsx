import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css"; // Tailwind v4: @import "tailwindcss";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import Generator from "./pages/Generator.jsx";
import Board from "./pages/Board.jsx";
import Policy from "./pages/Policy.jsx";
import Privacy from "./pages/Privacy.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "generator", element: <Generator /> },
      { path: "board", element: <Board /> },
      { path: "policy", element: <Policy /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
