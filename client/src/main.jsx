import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

/* 실제 존재하는 파일명을 정확히 맞추세요(대소문자/확장자 주의) */
import Home from "./pages/Home.jsx";
import Generator from "./pages/Generator.jsx";
import Board from "./pages/Board.jsx";
// 필요하면 아래 두 줄을 주석 해제하고 파일도 만들어두세요.
// import Policy from "./pages/Policy.jsx";
// import Privacy from "./pages/Privacy.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <div style={{ padding: 16 }}>라우팅 에러</div>,
    children: [
      { index: true, element: <Home /> },
      { path: "generator", element: <Generator /> },
      { path: "board", element: <Board /> },
      // { path: "policy", element: <Policy /> },
      // { path: "privacy", element: <Privacy /> },
      { path: "*", element: <div style={{ padding: 16 }}>404 Not Found</div> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
