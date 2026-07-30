import { Routes, Route, BrowserRouter } from "react-router-dom";
import './App.css';
import HomePage from './HomePage.jsx';
import Auth from "./components/Auth.jsx";

import WomensPage from "./Categories/WomensPage.jsx";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category-women" element={<WomensPage />}/>
          <Route path="/intentCart-auth" element={<Auth />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;