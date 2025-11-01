import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

import Home from "./pages/Home.jsx";
import Generator from "./pages/Generator.jsx";
import Board from "./pages/Board.jsx";
import Policy from "./pages/Policy.jsx";   // 대소문자 주의
import Privacy from "./pages/Privacy.jsx"; // 대소문자 주의

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <div style={{ padding: 16 }}>라우팅 에러</div>,
    children: [
      { index: true, element: <Home /> },
      { path: "generator", element: <Generator /> },
      { path: "board", element: <Board /> },
      { path: "policy", element: <Policy /> },
      { path: "privacy", element: <Privacy /> },
      { path: "*", element: <div style={{ padding: 16 }}>404 Not Found</div> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
