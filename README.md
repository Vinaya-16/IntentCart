# IntentCart

> **Predict why customers abandon their cart and recover sales using personalized strategies.**

---

**Developer:** Vinaya Patole

**Organization:** Krewlancer

---

## Overview

**IntentCart** is an Intelligent Cart Recovery Platform designed to combat cart abandonment (a problem affecting 65%–80% of online retail). Moving beyond generic reminder emails, IntentCart utilizes a phased, event-driven architecture to capture user behaviors, compute purchase intent scores, predict specific abandonment reasons, and deploy personalized recovery strategies.

---

## Key Features

* **Real-time Event Tracking:** Captures fine-grained user actions (views, cart operations, checkout steps, search queries) to map out complete customer journeys.
* **Purchase Intent Engine:** Uses a rule-based scoring mechanism (scaling to ML) to classify users into low, medium, or high intent.
* **Abandonment Reason Prediction:** Automatically identifies why a customer left (e.g., price sensitivity, technical issues, comparison shopping, shipping costs, or delivery delays).
* **Role-Based Portals:** Dedicated dashboards for Customers, Merchants, Shipping Personnel, and Platform Admins.
* **Merchant Analytics & Campaign Manager:** Tracks recovered revenue, recovery rates, top abandoned products, and triggers targeted coupon/discount campaigns.
* **Logistics & Delivery Optimization:** Integrated shipping module handling shipment tracking, driver assignment, delay prediction, and reverse logistics.

---

## Technology Stack

| Domain | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React.js | Dynamic single-page UI |
|  | Tailwind CSS | Modern layout & responsive design |
|  | React Router | Client-side routing |
|  | Chart.js | Interactive dashboard analytics |
| **Backend** | Node.js & Express.js | Event pipeline, REST APIs, and core logic |
|  | JSON Web Tokens (JWT) | Secure authentication |
|  | bcrypt | Password hashing |
| **Database** | MongoDB | Transactional data & high-throughput event logging |

---

## System Architecture & Intent Engine

IntentCart follows a layered architecture (UI, Application, Event Collection, Intelligence Engine, Data Storage) designed to process user interaction data progressively.

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React.js)                    │
│    Customer Panel  │  Merchant Panel  │  Shipper  │  Admin  │
└──────────────────────────────┬──────────────────────────────┘
                               │ User Interactions
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Event Tracking Middleware                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Event Logs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Data Storage                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Raw Behavioral Data
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Intelligence Engine                     │
│  [ Intent Scoring Engine ]  │  [ Abandonment Predictor ]   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Actionable Insights
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Personalized Recovery & Analytics                │
└─────────────────────────────────────────────────────────────┘

```

### Purchase Intent Scoring Matrix

Intent scores range from **0 to 100**:

* **0–30:** Low Intent (Window Shopper)
* **31–70:** Medium Intent (Considering Purchase)
* **71–100:** High Intent (Ready to Buy)

| User Action | Score Addition |
| --- | --- |
| **View Product (first time)** | +5 |
| **View Product (multiple times)** | +15 |
| **Product Search** | +3 |
| **Wishlist Addition** | +8 |
| **Add to Cart** | +40 |
| **Start Checkout** | +20 |
| **Returning Customer** | +10 |
| **Previous Purchase** | +5 |

### Abandonment Reason Rules Matrix

| Behavior Pattern | Predicted Reason | Actionable Recovery Strategy |
| --- | --- | --- |
| **Payment Failed Event** | Technical Issue | Instant support check-in / Retry link |
| **Multiple views before checkout** | Comparing Products | Send feature matrix or limited-time nudge |
| **Left after shipping page** | Shipping Cost | Offer free or discounted shipping coupon |
| **Cart value decreased** | Price Sensitive | Trigger tiered quantity discount |
| **Repeated views without buying** | Waiting for Discount | Push personalized coupon notification |
| **Left after delivery estimate** | Delivery Delay | Offer priority/express delivery options |

---

## Role Modules

1. **Customer Panel:** Full shopping interface, campaign coupon usage, wishlist, COD checkout, and order history tracking.
2. **Merchant Panel:** Analytics on recovery rates, revenue recovered, intent distribution, product CRUD, inventory control, and business recommendations.
3. **Shipping Panel:** Order fulfillment, label generation, carrier assignment, reverse logistics, and delay prediction.
4. **Admin Panel:** User and merchant verification, product moderation, global platform statistics, and Merchant Risk Analysis.

---

## Implementation Roadmap

* **Phase 1: Foundation** — Authentication, user roles, product catalog, cart operations, basic COD checkout.
* **Phase 2: Event Tracking** — Middleware integration across all routes, event processing pipeline, and session tracking.
* **Phase 3: Intent & Recovery** — Real-time intent scoring algorithms, cart abandonment detection, and reason prediction rules.
* **Phase 4: Analytics** — Merchant dashboards, Admin oversight, shipping logistics flow, and reporting.
* **Phase 5: Polish & Deployment** — Optimization, performance tuning, and production readiness.

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

### Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/IntentCart.git
cd IntentCart

```


2. **Backend Setup**
```bash
cd backend
npm install

```


Create a `.env` file in the `backend` directory:
```env
PORT=*
MONGO_URI=mongodb://************
JWT_SECRET=y*********

```


Start the backend server:
```bash
npm start

```


3. **Frontend Setup**
```bash
cd ../frontend
npm install
npm start

```



---
