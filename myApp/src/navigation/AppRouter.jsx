import { BrowserRouter, Route, Routes } from "react-router-dom";
import DrawPage from "../pages/DrawPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DrawPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
