import { Routes, Route, BrowserRouter } from "react-router-dom";
import './App.css';
import HomePage from './HomePage.jsx';

import WomensPage from "./Categories/WomensPage.jsx";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category-women" element={<WomensPage/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;