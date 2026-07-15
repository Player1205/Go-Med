/* 
   app.js - GoMed Interactive Operations
   ------------------------------------------------------------
   This file manages the interactive logic for the GoMed website. 
   It handles:
   1. Medicine Catalog (Mock inventory database & rendering cards)
   2. Search & Filtering (Filtering items based on category tabs or keywords)
   3. Request Cart (Adding items, modifying quantities, and calculating totals)
   4. 912 Emergency Dialer (Simulating phone calls, operators, speaker status)
   5. Local Order Checkout & Realtime Progress Stepper (Simulating deliveries)
   6. Data Persistence (Using Browser LocalStorage to save cart and orders)
*/

// ==========================================
// 1. MOCK MEDICINE DATABASE
// ==========================================
// This array contains list of available medicines. Each item has details like
// name, category, price, short description, category tag, and stock status.
const MEDICINE_DATABASE = [
    { id: 1, name: "Amoxicillin 500mg", category: "antibiotics", price: 14.50, description: "Broad-spectrum penicillin antibiotic used for various bacterial infections.", type: "rx", inStock: true },
    { id: 2, name: "Paracetamol 650mg", category: "painrelievers", price: 3.20, description: "Commonly used for fever reduction and fast relief of mild-to-moderate pain.", type: "otc", inStock: true },
    { id: 3, name: "Ibuprofen 400mg", category: "painrelievers", price: 4.80, description: "Nonsteroidal anti-inflammatory drug (NSAID) to ease swelling and pain.", type: "otc", inStock: true },
    { id: 4, name: "Azithromycin 250mg", category: "antibiotics", price: 18.90, description: "Macrolide-type antibiotic for respiratory, skin, and ear infections.", type: "rx", inStock: true },
    { id: 5, name: "Premium First Aid Kit", category: "firstaid", price: 29.99, description: "Complete medical responder kit with bandages, antiseptic wipes, scissors, and tapes.", type: "otc", inStock: true },
    { id: 6, name: "Sterile Gauze Pads (x50)", category: "firstaid", price: 6.50, description: "100% sterile cotton pads for wound dressings and cleaning.", type: "otc", inStock: true },
    { id: 7, name: "Metformin 500mg", category: "chronic", price: 12.00, description: "Oral diabetes medicine that helps control blood sugar levels for Type 2 diabetes.", type: "rx", inStock: true },
    { id: 8, name: "Atorvastatin 20mg", category: "chronic", price: 22.50, description: "Statin medication used to prevent cardiovascular disease and lower lipids.", type: "rx", inStock: false }, // "inStock: false" disables adding this to cart
    { id: 9, name: "Antiseptic Spray 100ml", category: "firstaid", price: 5.40, description: "Instant pain relief spray that kills germs and cleans scrapes/burns.", type: "otc", inStock: true },
    { id: 10, name: "Aspirin 81mg (Low Dose)", category: "painrelievers", price: 3.99, description: "Cardio-protective low dose aspirin tablets for daily therapeutic use.", type: "otc", inStock: true }
];

// ==========================================
// 2. STATE VARIABLES (Variables that store data while using the app)
// ==========================================
let cart = [];                   // Stores items requested by user (e.g., name, price, quantity)
let dialedNumber = "";           // Stores digits typed on the helpline dial pad modal
let callInterval = null;         // Timer interval for updating call duration (00:01, 00:02...)
let callDurationSeconds = 0;     // Total duration of active phone call in seconds
let currentTrackingOrder = null; // Stores currently tracked order details
let trackingInterval = null;     // Interval that advances delivery steps over time

// ==========================================
// 3. INITIALIZATION ON PAGE LOAD
// ==========================================
// Runs automatically when HTML page finishes loading. Ensures saved state is pulled,
// event listeners are bound, and initial medicine list is displayed.
document.addEventListener("DOMContentLoaded", () => {
    // 1. Try loading previously saved cart list from user's browser memory
    loadCartFromStorage();
    
    // 2. Try loading ongoing delivery orders to see if we should show tracking timeline
    checkActiveTrackingOrder();
    
    // 3. Render all medicine items with empty search filter
    renderCatalog("all", "");
    
    // 4. Update cart slide bar and header badge
    renderCart();
    
    // 5. Connect keyboard typing, click handlers, and forms
    setupEventListeners();
});

// ==========================================
// 4. BINDING EVENT LISTENERS (Attaching actions to page elements)
// ==========================================
function setupEventListeners() {
    // Search Bar Input Listener (triggers every time user types a character)
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            // Find which category tab is highlighted (active)
            const activeTab = document.querySelector(".filter-tab.active");
            const category = activeTab ? activeTab.dataset.category : "all";
            // Re-render matching items
            renderCatalog(category, e.target.value);
        });
    }

    // Category Filter Tabs Click Listeners (All, Pain Relievers, First Aid, etc)
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            // Remove active color styles from other tabs and add to clicked tab
            tabs.forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            // Get category name from tab's data-category attribute
            const category = e.currentTarget.dataset.category;
            // Get current value from search box
            const searchVal = document.getElementById("search-input").value;
            // Filter and render items matching both category and search keyword
            renderCatalog(category, searchVal);
        });
    });

    // Cart Sidebar Drawer Toggle Logic
    const cartToggleBtn = document.getElementById("cart-toggle");
    const cartDrawer = document.getElementById("cart-drawer");
    const closeCartBtn = document.getElementById("close-cart");

    // Open Cart Drawer when cart icon is clicked (adds active CSS class that slides drawer in)
    if (cartToggleBtn && cartDrawer) {
        cartToggleBtn.addEventListener("click", () => {
            cartDrawer.classList.add("active");
        });
    }

    // Close Cart Drawer when close button (x) is clicked (removes active CSS class)
    if (closeCartBtn && cartDrawer) {
        closeCartBtn.addEventListener("click", () => {
            cartDrawer.classList.remove("active");
        });
    }

    // Close Phone Dialer Modal Overlay
    const closeDialerBtn = document.getElementById("close-dialer");
    if (closeDialerBtn) {
        closeDialerBtn.addEventListener("click", closeDialer);
    }

    // Connect Dialer Digit buttons (0-9, *, #)
    const keypadButtons = document.querySelectorAll(".keypad-btn");
    keypadButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const digit = btn.dataset.digit;
            if (digit !== undefined) pressDialDigit(digit);
        });
    });

    // Backspace button inside Dialer modal
    const backspaceBtn = document.getElementById("dial-backspace");
    if (backspaceBtn) {
        backspaceBtn.addEventListener("click", deleteDialDigit);
    }

    // Red Hang Up Phone Call button
    const endCallBtn = document.getElementById("btn-call-end");
    if (endCallBtn) {
        endCallBtn.addEventListener("click", endHelplineCall);
    }

    // Patient checkout form submission event
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }
}

// ==========================================
// 5. MEDICINE CATALOG OPERATIONS
// ==========================================
// This function checks database, applies active filters/searches, and builds
// HTML medicine cards dynamically, placing them inside '#catalog-grid'.
function renderCatalog(category = "all", query = "") {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    grid.innerHTML = ""; // Clear existing cards in HTML
    const cleanQuery = query.toLowerCase().trim();

    // Filter array items matching both selected category and query text
    const filtered = MEDICINE_DATABASE.filter(item => {
        const matchesCategory = (category === "all" || item.category === category);
        const matchesSearch = (item.name.toLowerCase().includes(cleanQuery) || 
                               item.description.toLowerCase().includes(cleanQuery));
        return matchesCategory && matchesSearch;
    });

    // If no medicines match, display a fallback message
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-search-minus" style="font-size: 2.5em; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
                <p>No medical supplies found matching those criteria.</p>
            </div>
        `;
        return;
    }

    // Build card structure for each matched item and append to the grid
    filtered.forEach(med => {
        // Check if item is already added to cart array
        const isInCart = cart.some(item => item.id === med.id);
        
        // Define stock status color classes
        const stockStatusClass = med.inStock ? "status-instock" : "status-outstock";
        const stockStatusText = med.inStock ? "In Stock" : "Out of Stock";
        
        // Define prescription status styles
        const tagClass = med.type === "rx" ? "tag-rx" : "tag-otc";
        const tagText = med.type === "rx" ? "Prescription (Rx)" : "Over the Counter";

        const card = document.createElement("div");
        card.className = "medicine-card";
        card.innerHTML = `
            <div>
                <div class="medicine-header">
                    <span class="medicine-tag ${tagClass}">${tagText}</span>
                    <span class="medicine-status ${stockStatusClass}">
                        <i class="fas ${med.inStock ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${stockStatusText}
                    </span>
                </div>
                <h4>${med.name}</h4>
                <p class="description">${med.description}</p>
            </div>
            <div class="medicine-footer">
                <div class="medicine-price">$${med.price.toFixed(2)}<span> / unit</span></div>
                <!-- This button calls toggleCartItem(id) on click. Disables if item is out of stock -->
                <button 
                    class="btn-add-cart ${isInCart ? 'added' : ''}" 
                    onclick="toggleCartItem(${med.id})"
                    ${!med.inStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
                    title="${!med.inStock ? 'Item Unavailable' : isInCart ? 'Remove from Request' : 'Add to Request'}"
                >
                    <i class="fas ${isInCart ? 'fa-minus' : 'fa-plus'}"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// 6. REQUEST CART OPERATIONS
// ==========================================

// Adds an item to the cart or removes it if already present (acts like a toggle switch)
function toggleCartItem(id) {
    const itemIdx = cart.findIndex(item => item.id === id);
    if (itemIdx > -1) {
        // If item exists in cart, remove it
        cart.splice(itemIdx, 1);
    } else {
        // Otherwise search database and add to cart array with quantity = 1
        const med = MEDICINE_DATABASE.find(m => m.id === id);
        if (med && med.inStock) {
            cart.push({
                id: med.id,
                name: med.name,
                price: med.price,
                quantity: 1
            });
        }
    }
    // Update changes in memory and update display panels
    saveCartToStorage();
    renderCart();
    
    // Refresh active catalog grid cards to update '+' or '-' icon colors
    const activeTab = document.querySelector(".filter-tab.active");
    const category = activeTab ? activeTab.dataset.category : "all";
    const searchVal = document.getElementById("search-input").value;
    renderCatalog(category, searchVal);
}

// Adjusts the quantity of a specific item in the cart
function updateCartQty(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        // If quantity drops to 0 or less, remove item from cart completely
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCartToStorage();
        renderCart();
        
        // Refresh catalog cards state
        const activeTab = document.querySelector(".filter-tab.active");
        const category = activeTab ? activeTab.dataset.category : "all";
        const searchVal = document.getElementById("search-input").value;
        renderCatalog(category, searchVal);
    }
}

// Calculates total value of all items in cart
function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Renders list inside Cart side-drawer panel and updates header badge counts
function renderCart() {
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const cartBadge = document.getElementById("cart-badge");
    const checkoutForm = document.getElementById("checkout-form-container");

    if (!cartContainer) return;

    // Calculate total quantity of items to show in the small red navigation badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        // Hide badge if cart is empty
        cartBadge.style.display = totalItems > 0 ? "block" : "none";
    }

    // If cart is empty, show empty state message and hide checkout form
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="cart-empty-state">
                <i class="fas fa-shopping-basket"></i>
                <p>Your delivery request is empty.</p>
                <p style="font-size: 0.8em; margin-top: 6px; color: var(--text-muted);">Browse our directory to add medical items.</p>
            </div>
        `;
        if (cartTotalPrice) cartTotalPrice.textContent = "$0.00";
        if (checkoutForm) checkoutForm.classList.remove("active");
        return;
    }

    // Build cart items rows
    cartContainer.innerHTML = "";
    cart.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "cart-item";
        itemRow.innerHTML = `
            <div class="cart-item-info">
                <h5>${item.name}</h5>
                <p>$${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                <button class="btn-remove-item" onclick="toggleCartItem(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartContainer.appendChild(itemRow);
    });

    // Update total price display
    if (cartTotalPrice) {
        cartTotalPrice.textContent = `$${getCartTotal().toFixed(2)}`;
    }
    
    // Show checkout form details
    if (checkoutForm) {
        checkoutForm.classList.add("active");
    }
}

// Saves cart items to localStorage so items stay when page is refreshed
function saveCartToStorage() {
    localStorage.setItem("gomed_cart", JSON.stringify(cart));
}

// Loads cart array from localStorage when the web page starts up
function loadCartFromStorage() {
    const saved = localStorage.getItem("gomed_cart");
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            cart = []; // clear cart if JSON parsing fails
        }
    }
}

// ==========================================
// 7. 912 HELPLINE DIALER SIMULATOR
// ==========================================

// Opens dial pad modal (adds active CSS class that makes overlay overlay visible)
function openDialer() {
    const dialerModal = document.getElementById("dialer-modal");
    if (dialerModal) {
        dialerModal.classList.add("active");
        dialedNumber = "";
        updateDialerDisplay();
        switchDialerScreen("keypad"); // display numeric keys screen first
    }
}

// Closes dialer modal overlay
function closeDialer() {
    const dialerModal = document.getElementById("dialer-modal");
    if (dialerModal) {
        dialerModal.classList.remove("active");
    }
    endHelplineCall(); // end call timers
}

// Appends pressed digit to phone number string
function pressDialDigit(digit) {
    if (dialedNumber.length < 10) {
        dialedNumber += digit;
        updateDialerDisplay();
    }
}

// Deletes last typed digit (backspace)
function deleteDialDigit() {
    dialedNumber = dialedNumber.slice(0, -1);
    updateDialerDisplay();
}

// Updates dial pad display box text
function updateDialerDisplay() {
    const display = document.getElementById("dial-number-display");
    if (display) {
        display.textContent = dialedNumber || "---";
    }
}

// Switches dialer modal screens between keypad dialer and active phone call screen
function switchDialerScreen(screenName) {
    const keypadScreen = document.getElementById("dialer-screen-keypad");
    const callingScreen = document.getElementById("dialer-screen-calling");
    
    if (screenName === "keypad") {
        if (keypadScreen) keypadScreen.classList.add("active");
        if (callingScreen) callingScreen.classList.remove("active");
    } else if (screenName === "calling") {
        if (keypadScreen) keypadScreen.classList.remove("active");
        if (callingScreen) callingScreen.classList.add("active");
    }
}

// Automated dial action triggered from quick call buttons
function triggerQuickDial(number) {
    openDialer();
    dialedNumber = number;
    updateDialerDisplay();
    // Simulate slight call dialing delay
    setTimeout(startHelplineCall, 300);
}

// Starts the simulated helpline calling timeline
function startHelplineCall() {
    if (!dialedNumber) return;
    
    switchDialerScreen("calling"); // switch to calling screen with avatar
    
    // Reset call duration timer and display
    callDurationSeconds = 0;
    const callTimerEl = document.getElementById("call-timer");
    if (callTimerEl) callTimerEl.textContent = "00:00";
    
    // Clear any previous interval and start counting duration seconds
    clearInterval(callInterval);
    callInterval = setInterval(() => {
        callDurationSeconds++;
        const minutes = Math.floor(callDurationSeconds / 60).toString().padStart(2, "0");
        const seconds = (callDurationSeconds % 60).toString().padStart(2, "0");
        if (callTimerEl) callTimerEl.textContent = `${minutes}:${seconds}`;
    }, 1000);

    const dialogBubble = document.getElementById("agent-dialogue");
    const menuOptions = document.getElementById("call-menu-options");
    
    if (dialogBubble) {
        dialogBubble.innerHTML = "<strong>GoMed Network</strong>Connecting helpline call to nearby agent...";
    }
    if (menuOptions) menuOptions.innerHTML = "";

    // Simulated speech timelines (Simulates response lags)
    setTimeout(() => {
        if (dialedNumber === "912") {
            dialogBubble.innerHTML = "<strong>GoMed Operator</strong>Welcome to GoMed Emergency Helpline. Setting up direct channel with emergency responder Sarah...";
            
            setTimeout(() => {
                dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Hello! I am Agent Sarah. I see your call coming from local network. How can I help you today? Do you need a critical medicine delivery from stores nearby?";
                
                // Render call selection choices
                if (menuOptions) {
                    menuOptions.innerHTML = `
                        <button class="call-option-btn" onclick="selectCallOption('delivery')">
                            <i class="fas fa-shipping-fast" style="color: var(--primary); margin-right: 8px;"></i>
                            Option 1: Request Medicine Delivery
                        </button>
                        <button class="call-option-btn" onclick="selectCallOption('doctor')">
                            <i class="fas fa-user-md" style="color: var(--secondary); margin-right: 8px;"></i>
                            Option 2: Speak to Doctor on Duty
                        </button>
                        <button class="call-option-btn" onclick="endHelplineCall()">
                            <i class="fas fa-phone-slash" style="color: var(--danger); margin-right: 8px;"></i>
                            Option 3: Hang up Call
                        </button>
                    `;
                }
            }, 2500);

        } else {
            // Display error if anything else other than 912 is typed
            dialogBubble.innerHTML = `<strong>Automated System</strong>The number <strong>${dialedNumber}</strong> is not recognized. Please dial <strong>912</strong> for the official GoMed helpline.`;
            if (menuOptions) {
                menuOptions.innerHTML = `
                    <button class="call-option-btn" onclick="triggerQuickDial('912')">
                        <i class="fas fa-ambulance" style="color: var(--accent); margin-right: 8px;"></i>
                        Redial Helpline (912)
                    </button>
                    <button class="call-option-btn" onclick="endHelplineCall()">
                        <i class="fas fa-times-circle" style="color: var(--danger); margin-right: 8px;"></i>
                        Close Call
                    </button>
                `;
            }
        }
    }, 1200);
}

// Coordinates option clicks inside simulated call dialogue bubbles
function selectCallOption(option) {
    const dialogBubble = document.getElementById("agent-dialogue");
    const menuOptions = document.getElementById("call-menu-options");
    
    if (option === 'delivery') {
        dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Understood. I have unlocked the delivery catalog for you in this browser. You can select the items, fill out your name/address, and we will package them immediately. Closing helpline channel now. Rest well!";
        if (menuOptions) menuOptions.innerHTML = "";
        
        // Auto hang up and scroll user to catalog cards after 3 seconds
        setTimeout(() => {
            closeDialer();
            const catalogSection = document.getElementById("catalog");
            if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
        }, 3000);
        
    } else if (option === 'doctor') {
        dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Got it. Routing your line to our active emergency physician. This is free under the GoMed initiative. Please hold, dialing doctor Dr. James...";
        if (menuOptions) menuOptions.innerHTML = "";
        
        // Simulates doctor pick-up response bubble
        setTimeout(() => {
            dialogBubble.innerHTML = "<strong>Dr. James (GoMed Doctor)</strong>Hello, this is Dr. James. I am here. Tell me, what symptoms are you experiencing? We can prescribe and push immediate deliveries to you.";
            if (menuOptions) {
                menuOptions.innerHTML = `
                    <button class="call-option-btn" onclick="selectCallOption('delivery')">
                        <i class="fas fa-prescription-bottle-alt" style="color: var(--primary); margin-right: 8px;"></i>
                        Dr. James: Send prescribed medicines
                    </button>
                    <button class="call-option-btn" onclick="endHelplineCall()">
                        <i class="fas fa-check" style="color: var(--secondary); margin-right: 8px;"></i>
                        Thank you, doctor. Hang up.
                    </button>
                `;
            }
        }, 3000);
    }
}

// Ends helpline calling counters and timers
function endHelplineCall() {
    clearInterval(callInterval);
    callInterval = null;
    callDurationSeconds = 0;
    switchDialerScreen("keypad"); // reset back to dial keypad screen
}

// ==========================================
// 8. SIMULATED CHECKOUT & DELIVERY TRACKING
// ==========================================

// Triggered when patient details form is submitted
function handleCheckoutSubmit(e) {
    e.preventDefault(); // prevents page reload

    // Grab form values
    const name = document.getElementById("cust-name").value;
    const phone = document.getElementById("cust-phone").value;
    const address = document.getElementById("cust-address").value;

    if (!name || !phone || !address) {
        alert("Please fill in all the details for medical delivery.");
        return;
    }

    if (cart.length === 0) {
        alert("Your request is empty. Please select medicine supplies first.");
        return;
    }

    // Create a mock tracking order object structure
    const newOrder = {
        orderId: "GOMED-" + Math.floor(100000 + Math.random() * 900000), // Random 6 digit tag
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        items: [...cart],
        totalAmount: getCartTotal(),
        statusStep: 1, // Start with Step 1: Placed
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Save active tracking order data structure inside LocalStorage
    currentTrackingOrder = newOrder;
    localStorage.setItem("gomed_tracking_order", JSON.stringify(newOrder));
    
    // Clear active cart array and details
    cart = [];
    saveCartToStorage();
    renderCart();

    // Re-render inventory cards so + buttons reset to original state
    const searchVal = document.getElementById("search-input").value;
    renderCatalog("all", searchVal);

    // Close sliding Cart drawer layout
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) cartDrawer.classList.remove("active");

    // Clear input fields inside patient form
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";

    // Show and scroll to the tracking timeline section
    launchOrderTracking(newOrder);
}

// Renders order metadata, displays summary columns, and starts tracking stepper interval
function launchOrderTracking(order) {
    const trackerSec = document.getElementById("tracker-section");
    if (!trackerSec) return;

    // Show section and scroll browser page smoothly
    trackerSec.classList.add("active");
    trackerSec.scrollIntoView({ behavior: 'smooth' });

    // Populate order ID text nodes
    document.getElementById("tracking-id").textContent = order.orderId;
    document.getElementById("tracking-time").textContent = order.timestamp;
    document.getElementById("tracking-badge-text").textContent = "Preparing Order";

    // Populate order manifest summary list
    const summaryItems = document.getElementById("tracking-summary-items");
    if (summaryItems) {
        summaryItems.innerHTML = `<h5>Delivery Manifest</h5>`;
        order.items.forEach(item => {
            const row = document.createElement("div");
            row.className = "tracker-summary-row";
            row.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            summaryItems.appendChild(row);
        });

        // Add final totals layout
        const totalRow = document.createElement("div");
        totalRow.className = "tracker-summary-row total";
        totalRow.innerHTML = `
            <span>Total amount due (Upon Delivery)</span>
            <span>$${order.totalAmount.toFixed(2)}</span>
        `;
        summaryItems.appendChild(totalRow);
    }

    // Draw active stepper timeline colors and connections
    updateTrackingTimelineUI(order.statusStep);

    // Clear any active tracking simulators
    clearInterval(trackingInterval);
    
    // Simulate progress changes every 8 seconds
    trackingInterval = setInterval(() => {
        if (!currentTrackingOrder) {
            clearInterval(trackingInterval);
            return;
        }

        // If step is less than 4 (Delivered), increment and update layout
        if (currentTrackingOrder.statusStep < 4) {
            currentTrackingOrder.statusStep++;
            localStorage.setItem("gomed_tracking_order", JSON.stringify(currentTrackingOrder));
            updateTrackingTimelineUI(currentTrackingOrder.statusStep);
        } else {
            clearInterval(trackingInterval); // Stop simulation once step is 4 (Delivered)
            document.getElementById("tracking-badge-text").textContent = "Successfully Delivered";
        }
    }, 8000);
}

// Updates colors and highlights of order timeline tracker steps in HTML
function updateTrackingTimelineUI(step) {
    const steps = document.querySelectorAll(".tracker-step");
    const progressLine = document.getElementById("tracker-progress-line");
    const badgeText = document.getElementById("tracking-badge-text");

    // Loop through timeline steps to apply active/completed highlight classes
    steps.forEach((s, idx) => {
        s.classList.remove("active", "completed");
        
        const stepNum = idx + 1;
        if (stepNum < step) {
            s.classList.add("completed"); // Past steps get green background
        } else if (stepNum === step) {
            s.classList.add("active");    // Current step gets glowing blue borders
        }
    });

    // Check if user is viewing on mobile layout
    const isMobile = window.innerWidth <= 768;
    
    // Map status values to horizontal timeline line percentages
    let progressPercentage = 0;
    if (step === 2) progressPercentage = 33;
    else if (step === 3) progressPercentage = 66;
    else if (step === 4) progressPercentage = 100;

    // Set timeline connectors length
    if (progressLine) {
        if (isMobile) {
            // Vertical stepper line for mobile phones
            progressLine.style.width = "4px";
            progressLine.style.height = `${progressPercentage}%`;
        } else {
            // Horizontal stepper line for laptops
            progressLine.style.height = "4px";
            progressLine.style.width = `${progressPercentage}%`;
        }
    }

    // Set textual status badges
    if (step === 1) badgeText.textContent = "Order Placed";
    else if (step === 2) badgeText.textContent = "Packing Supplies";
    else if (step === 3) badgeText.textContent = "Out for Delivery";
    else if (step === 4) badgeText.textContent = "Delivered";
}

// Checks if order was previously placed and is still progressing
function checkActiveTrackingOrder() {
    const savedOrder = localStorage.getItem("gomed_tracking_order");
    if (savedOrder) {
        try {
            const order = JSON.parse(savedOrder);
            currentTrackingOrder = order;
            launchOrderTracking(order);
        } catch (e) {
            localStorage.removeItem("gomed_tracking_order");
        }
    }
}

// Clears order tracking display, stops simulation loops, and clears browser local memory
function resetMockOrder() {
    localStorage.removeItem("gomed_tracking_order");
    currentTrackingOrder = null;
    clearInterval(trackingInterval);
    
    const trackerSec = document.getElementById("tracker-section");
    if (trackerSec) {
        trackerSec.classList.remove("active");
    }
}
