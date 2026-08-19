import { Routes, Route, BrowserRouter } from "react-router-dom";
import './App.css';

// Main Panel 
import HomePage from './mainPanel/HomePage.jsx';
import CategoryPage from "./mainPanel/CategoryPage.jsx";
import Auth from "./components/Auth.jsx";
import NotificationsPage from "./mainPanel/Notifications.jsx";
import WishlistPage from "./mainPanel/Wishlist.jsx";
import CartPage from "./mainPanel/cart.jsx";
import ProductDetail from "./mainPanel/productDetail.jsx";
import CustProfile from './mainPanel/Profile.jsx';
import CheckoutPage from "./mainPanel/Checkout.jsx";
import OrderSuccess from "./mainPanel/OrderSuccess.jsx";
import OrdersPage from './mainPanel/OrderPage.jsx';
import OrderDetailPage from './mainPanel/OrderDetailPage.jsx';
import CreateReturn from './mainPanel/ReturnPage.jsx';

// Admin Panel
import AdminDashboard from "./adminPanel/dashboard.jsx";
import UserM from "./adminPanel/userM.jsx";
import MerchantManagement from "./adminPanel/merchantM.jsx";
import ProductM from "./adminPanel/productM.jsx";
import Profile from "./adminPanel/profile.jsx";
import Notifications from "./adminPanel/notifications.jsx";
import MerchantRiskList from './adminPanel/MerchantRiskList.jsx';


// Merchant Panel 
import MerchantDashboard from "./merchantPanel/dashboard.jsx";
import MerchantProductM from "./merchantPanel/productM.jsx";
import MerchantOrderM from "./merchantPanel/orderM.jsx";
import MerchantCustomerA from "./merchantPanel/customerA.jsx";
import MerchantRecoveryD from "./merchantPanel/recoveryD.jsx";
import MerchantCampM from "./merchantPanel/campaignM.jsx";
import MerchantNotifications from "./merchantPanel/notifications.jsx";
import MerchantProfile from "./merchantPanel/profile.jsx";

import TrackingProvider from './components/TrackingProvider';

// Shipping Panel
import ShippingDashboard from "./shippingPanel/dashboard.jsx";
import ShippingOrderDetails from "./shippingPanel/OrderDetails.jsx";
import ShippingTracking from "./shippingPanel/Tracking.jsx";
import ShippingReturns from './shippingPanel/Returns.jsx';
import ShippingDrivers from "./shippingPanel/drivers.jsx";
import ShippingNotifications from "./shippingPanel/notifications.jsx";
import ShipperProfile from "./shippingPanel/profile.jsx";

function App() {

  return (
    <>
      <TrackingProvider>
        {/* Your existing routes */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/intentCart-auth" element={<Auth />} />

            {/* Admin Panel  */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-userM" element={<UserM />} />
            <Route path="/admin-merchantV" element={<MerchantManagement />} />
            <Route path="/admin-productM" element={<ProductM />} />
            <Route path="/admin-profile" element={<Profile />} />
            <Route path="/admin-notifications" element={<Notifications />} />

            {/* Risk Management Routes */}
            <Route path="/risk" element={<MerchantRiskList />} />

            {/* Merchant Panel  */}
            <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
            <Route path="/merchant-productM" element={<MerchantProductM />} />
            <Route path="/merchant-orderM" element={<MerchantOrderM />} />
            <Route path="/merchant-customerA" element={<MerchantCustomerA />} />
            <Route path="/merchant-recoveryD" element={<MerchantRecoveryD />} />
            <Route path="/merchant-campM" element={<MerchantCampM />} />
            <Route path="/merchant-notifications" element={<MerchantNotifications />} />
            <Route path="/merchant-profile" element={<MerchantProfile />} />

            {/* Main Panel Paths  */}
            <Route path="/category/:path/*" element={<CategoryPage />} />
            <Route path="/main-notifications" element={<NotificationsPage />} />
            <Route path="/main-wishlist" element={<WishlistPage />} />
            <Route path="/main-cart" element={<CartPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/main-profile" element={<CustProfile />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order/:id" element={<OrderDetailPage />} />
            <Route path="/returns/create/:orderId" element={<CreateReturn />} />

            {/* Shipping Panel Paths  */}
            <Route path="/shipping-dashboard" element={<ShippingDashboard />} />
            <Route path="/shipping-OrderM" element={<ShippingOrderDetails />} />
            <Route path="/shipping-tracking" element={<ShippingTracking />} />
            <Route path="/shipping/tracking/:id" element={<ShippingTracking />} />
            <Route path="/shipping-returns" element={<ShippingReturns />} />
            <Route path="/shipping-drivers" element={<ShippingDrivers />} />
            <Route path="/shipping-notifications" element={<ShippingNotifications />} />
            <Route path="/shipping-profile" element={<ShipperProfile />}/>

          </Routes>
        </BrowserRouter>
      </TrackingProvider>
    </>
  )
}

export default App;