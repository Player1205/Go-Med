# 🩺 GoMed — Bringing Health to Your Doorstep

[![Static HTML/CSS/JS](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue?style=for-the-badge)](file:///c:/Users/vansh/OneDrive/Desktop/GO-MED/index.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Helpline Status](https://img.shields.io/badge/Helpline-912--Active-red?style=for-the-badge)](file:///c:/Users/vansh/OneDrive/Desktop/GO-MED/app.js)

**GoMed** is a premium, patient-centric web portal designed to streamline access to emergency medical dispatchers and pharmacy logistics. Built with visual excellence in mind, it provides a gorgeous glassmorphic interface and a zero-upfront-payment delivery structure to prioritize human wellness over payment processing.

---

## 🚀 Key Features

*   **📞 Interactive 912 Helpline Dialer**: A simulated keypad and live active-calling overlay. Dial **912** to talk to a virtual operator or a doctor on duty to route your medical list.
*   **💊 Dynamic Supplies Directory**: Explore and search through an inventory catalog sorted by categories (Pain Relievers, Antibiotics, First Aid, Chronic Illnesses).
*   **🛒 Interactive Request Cart**: Select OTC or prescription medications, fill in patient coordinates, and queue up deliveries.
*   **📍 Real-Time Delivery Tracker**: Submit your request and watch a simulated stepper timeline (Placed ➔ Packaging ➔ Out for Delivery ➔ Doorstep) update live in the browser.
*   **🎨 Premium Glassmorphism UI**: Curated dark-slate color palette, Outfit & Poppins modern typography, smooth micro-animations, and full mobile responsiveness.

---

## 📁 Project Architecture

The codebase has been refactored from a monolithic template into a clean, modular structure:

```
GO-MED/
├── 📄 index.html      # Semantic HTML structure, font libraries, and icons
├── 🎨 style.css       # Premium CSS variables, glassmorphic styles, and layout grids
├── ⚡ app.js          # Main JS logic: local database, dialer system, and tracking
└── 📝 README.md       # Interactive project documentation (this file)
```

### Component Details

1.  **[index.html](file:///c:/Users/vansh/OneDrive/Desktop/GO-MED/index.html)**: Sets up semantic header/footer elements, links FontAwesome icon packs, and arranges the layouts for the Hero, Services, Catalog, Dialer modal, and tracking cards.
2.  **[style.css](file:///c:/Users/vansh/OneDrive/Desktop/GO-MED/style.css)**: Implements variable-based modern colors, smooth transition curves, glowing pulse indicators, and CSS grids that dynamically scale from a 320px mobile viewport up to wide screen monitors.
3.  **[app.js](file:///c:/Users/vansh/OneDrive/Desktop/GO-MED/app.js)**: Runs a client-side medication inventory catalog, handles input query listeners, handles custom dialer status changes, coordinates active phone-call timers, and syncs order status steps through client-side `localStorage`.

---

## 💻 Local Setup & Running Guide

Since the application uses vanilla web standard technologies, you do **not** need complex compiler build steps. You can run it locally in any web browser.

### Option A: Direct Open (Double Click)
Simply double-click the **`index.html`** file on your filesystem to open it directly in Chrome, Firefox, Safari, or Edge.

### Option B: Local HTTP Server (Recommended)
To fully enable local storage features and avoid file-protocol restrictions, serve it through a local host server:

*   **Using Python (Pre-installed on most systems)**:
    ```bash
    # Open terminal in the directory and run:
    python -m http.server 8000
    ```
    Then visit `http://localhost:8000` in your web browser.

*   **Using Node.js (`http-server` package)**:
    ```bash
    npx http-server -p 8080
    ```
    Then visit `http://localhost:8080` in your web browser.

*   **Using VS Code Extension**:
    Right-click `index.html` and choose **"Open with Live Server"**.

---

## 📖 Walkthrough User Guide

### 1. The Helpline Simulator
1.  Click the glowing **"Call Us Now: 912"** button in the hero area or the phone icon in the top right.
2.  The interactive dialer pad will slide open. Click `9`, `1`, `2` and click the green phone button (or dial any custom digits).
3.  Observe the calling screen: it triggers a mock microphone/speaker control and active call timer.
4.  Listen/read as the operator Sarah connects. Choose **Option 1 ("Request Medicine Delivery")** to automatically route yourself to the catalog.

### 2. Browsing and Filtering Medicines
1.  Scroll down to the **Medical Supplies Catalog**.
2.  Type any search query in the search bar (e.g. `"Aspirin"`, `"Amoxicillin"`, or `"Spray"`). The catalog updates as you type.
3.  Select category tabs like **"First Aid & Care"** or **"Pain Relievers"** to filter the inventory list instantly.

### 3. Placing a Cashless Delivery Request
1.  Click the **`+` (Add to Request)** button on any medicine card (note: out-of-stock items are disabled).
2.  Click the shopping cart icon in the navigation bar to slide out the **Request Manifest**.
3.  Adjust quantities or remove items using the controls inside the drawer.
4.  Fill out the patient form (Name, Contact Phone, Delivery Address).
5.  Click **"Confirm Delivery Request"**.

### 4. Tracking Your Live Order
1.  Once you submit, the cart drawer slides shut and the page scrolls to the **Track Your Request** card.
2.  Your delivery manifest items, custom time of submission, and generated order ID (e.g., `GOMED-349012`) will display.
3.  The stepper timeline will advance:
    *   **Order Placed** (Immediate)
    *   **Packing Supplies** (After 8 seconds)
    *   **Out for Delivery** (After 16 seconds)
    *   **Arrived at Doorstep** (After 24 seconds)
4.  If you reload the page, the order progress will persist from your `localStorage`! Click **"Clear Track History"** to reset.

---

## 📄 License

This project is licensed under the MIT License. Feel free to modify and expand the GoMed platform for your own local healthcare initiatives.

---
*GoMed – Bringing Health to Your Doorstep.*
