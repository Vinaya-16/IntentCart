import { Routes, Route, BrowserRouter } from "react-router-dom";
import './App.css';
import HomePage from './HomePage.jsx';
import Auth from "./components/Auth.jsx";

import WomensPage from "./Categories/WomensPage.jsx";

// Admin Panel
import AdminDashboard from "./adminPanel/dashboard.jsx";
import UserM from "./adminPanel/userM.jsx";
import MerchantManagement from "./adminPanel/merchantM.jsx";
import ProductM from "./adminPanel/productM.jsx";
import Profile from "./adminPanel/profile.jsx";
import Notifications from "./adminPanel/notifications.jsx";

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category-women" element={<WomensPage />}/>
          <Route path="/intentCart-auth" element={<Auth />}/>

          {/* Admin Panel  */}
          <Route path="/admin-dashboard" element={<AdminDashboard />}/>
          <Route path="/admin-userM" element={<UserM />}/>
          <Route path="/admin-merchantV" element={<MerchantManagement />}/>
          <Route path="/admin-productM" element={<ProductM />}/>
          <Route path="/admin-profile" element={<Profile />}/>
          <Route path="/admin-notifications" element={<Notifications />}/>

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;