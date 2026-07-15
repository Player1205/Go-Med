/* app.js - GoMed Interactive Operations */

// 1. Mock Medicine Database
const MEDICINE_DATABASE = [
    { id: 1, name: "Amoxicillin 500mg", category: "antibiotics", price: 14.50, description: "Broad-spectrum penicillin antibiotic used for various bacterial infections.", type: "rx", inStock: true },
    { id: 2, name: "Paracetamol 650mg", category: "painrelievers", price: 3.20, description: "Commonly used for fever reduction and fast relief of mild-to-moderate pain.", type: "otc", inStock: true },
    { id: 3, name: "Ibuprofen 400mg", category: "painrelievers", price: 4.80, description: "Nonsteroidal anti-inflammatory drug (NSAID) to ease swelling and pain.", type: "otc", inStock: true },
    { id: 4, name: "Azithromycin 250mg", category: "antibiotics", price: 18.90, description: "Macrolide-type antibiotic for respiratory, skin, and ear infections.", type: "rx", inStock: true },
    { id: 5, name: "Premium First Aid Kit", category: "firstaid", price: 29.99, description: "Complete medical responder kit with bandages, antiseptic wipes, scissors, and tapes.", type: "otc", inStock: true },
    { id: 6, name: "Sterile Gauze Pads (x50)", category: "firstaid", price: 6.50, description: "100% sterile cotton pads for wound dressings and cleaning.", type: "otc", inStock: true },
    { id: 7, name: "Metformin 500mg", category: "chronic", price: 12.00, description: "Oral diabetes medicine that helps control blood sugar levels for Type 2 diabetes.", type: "rx", inStock: true },
    { id: 8, name: "Atorvastatin 20mg", category: "chronic", price: 22.50, description: "Statin medication used to prevent cardiovascular disease and lower lipids.", type: "rx", inStock: false },
    { id: 9, name: "Antiseptic Spray 100ml", category: "firstaid", price: 5.40, description: "Instant pain relief spray that kills germs and cleans scrapes/burns.", type: "otc", inStock: true },
    { id: 10, name: "Aspirin 81mg (Low Dose)", category: "painrelievers", price: 3.99, description: "Cardio-protective low dose aspirin tablets for daily therapeutic use.", type: "otc", inStock: true }
];

// 2. State Variables
let cart = [];
let dialedNumber = "";
let callInterval = null;
let callDurationSeconds = 0;
let currentTrackingOrder = null;
let trackingInterval = null;

// DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    // Load local storage items
    loadCartFromStorage();
    checkActiveTrackingOrder();
    
    // Render catalogs and UI elements
    renderCatalog("all", "");
    renderCart();
    
    // Bind Event Listeners
    setupEventListeners();
});

// 3. Event Listeners setup
function setupEventListeners() {
    // Search Bar
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const activeTab = document.querySelector(".filter-tab.active");
            const category = activeTab ? activeTab.dataset.category : "all";
            renderCatalog(category, e.target.value);
        });
    }

    // Filter Tabs
    const tabs = document.querySelectorAll(".filter-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            tabs.forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            
            const category = e.currentTarget.dataset.category;
            const searchVal = document.getElementById("search-input").value;
            renderCatalog(category, searchVal);
        });
    });

    // Cart Sidebar Toggle
    const cartToggleBtn = document.getElementById("cart-toggle");
    const cartDrawer = document.getElementById("cart-drawer");
    const closeCartBtn = document.getElementById("close-cart");

    if (cartToggleBtn && cartDrawer) {
        cartToggleBtn.addEventListener("click", () => {
            cartDrawer.classList.add("active");
        });
    }

    if (closeCartBtn && cartDrawer) {
        closeCartBtn.addEventListener("click", () => {
            cartDrawer.classList.remove("active");
        });
    }

    // Call Modal / Dialer triggers
    const dialerModal = document.getElementById("dialer-modal");
    const closeDialerBtn = document.getElementById("close-dialer");
    
    if (closeDialerBtn) {
        closeDialerBtn.addEventListener("click", closeDialer);
    }

    // Keypad numeric presses
    const keypadButtons = document.querySelectorAll(".keypad-btn");
    keypadButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const digit = btn.dataset.digit;
            if (digit !== undefined) pressDialDigit(digit);
        });
    });

    // Backspace dialer
    const backspaceBtn = document.getElementById("dial-backspace");
    if (backspaceBtn) {
        backspaceBtn.addEventListener("click", deleteDialDigit);
    }

    // Call End Button
    const endCallBtn = document.getElementById("btn-call-end");
    if (endCallBtn) {
        endCallBtn.addEventListener("click", endHelplineCall);
    }

    // Order Submission Form
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }
}

// 4. Catalog Operations
function renderCatalog(category = "all", query = "") {
    const grid = document.getElementById("catalog-grid");
    if (!grid) return;

    grid.innerHTML = "";
    const cleanQuery = query.toLowerCase().trim();

    const filtered = MEDICINE_DATABASE.filter(item => {
        const matchesCategory = (category === "all" || item.category === category);
        const matchesSearch = (item.name.toLowerCase().includes(cleanQuery) || 
                               item.description.toLowerCase().includes(cleanQuery));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-search-minus" style="font-size: 2.5em; margin-bottom: 12px; display: block; color: var(--text-muted);"></i>
                <p>No medical supplies found matching those criteria.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(med => {
        const isInCart = cart.some(item => item.id === med.id);
        const stockStatusClass = med.inStock ? "status-instock" : "status-outstock";
        const stockStatusText = med.inStock ? "In Stock" : "Out of Stock";
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

// 5. Cart Operations
function toggleCartItem(id) {
    const itemIdx = cart.findIndex(item => item.id === id);
    if (itemIdx > -1) {
        cart.splice(itemIdx, 1);
    } else {
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
    saveCartToStorage();
    renderCart();
    const activeTab = document.querySelector(".filter-tab.active");
    const category = activeTab ? activeTab.dataset.category : "all";
    const searchVal = document.getElementById("search-input").value;
    renderCatalog(category, searchVal);
}

function updateCartQty(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCartToStorage();
        renderCart();
        
        // Refresh catalog to update +/- buttons if item removed entirely
        const activeTab = document.querySelector(".filter-tab.active");
        const category = activeTab ? activeTab.dataset.category : "all";
        const searchVal = document.getElementById("search-input").value;
        renderCatalog(category, searchVal);
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function renderCart() {
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const cartBadge = document.getElementById("cart-badge");
    const checkoutForm = document.getElementById("checkout-form-container");

    if (!cartContainer) return;

    // Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? "block" : "none";
    }

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

    if (cartTotalPrice) {
        cartTotalPrice.textContent = `$${getCartTotal().toFixed(2)}`;
    }
    
    if (checkoutForm) {
        checkoutForm.classList.add("active");
    }
}

function saveCartToStorage() {
    localStorage.setItem("gomed_cart", JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem("gomed_cart");
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            cart = [];
        }
    }
}

// 6. 912 Helpline Dialer Simulator
function openDialer() {
    const dialerModal = document.getElementById("dialer-modal");
    if (dialerModal) {
        dialerModal.classList.add("active");
        dialedNumber = "";
        updateDialerDisplay();
        switchDialerScreen("keypad");
    }
}

function closeDialer() {
    const dialerModal = document.getElementById("dialer-modal");
    if (dialerModal) {
        dialerModal.classList.remove("active");
    }
    endHelplineCall();
}

function pressDialDigit(digit) {
    if (dialedNumber.length < 10) {
        dialedNumber += digit;
        updateDialerDisplay();
    }
}

function deleteDialDigit() {
    dialedNumber = dialedNumber.slice(0, -1);
    updateDialerDisplay();
}

function updateDialerDisplay() {
    const display = document.getElementById("dial-number-display");
    if (display) {
        display.textContent = dialedNumber || "---";
    }
}

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

function triggerQuickDial(number) {
    openDialer();
    dialedNumber = number;
    updateDialerDisplay();
    // Auto initiate call
    setTimeout(startHelplineCall, 300);
}

function startHelplineCall() {
    if (!dialedNumber) return;
    
    switchDialerScreen("calling");
    
    // Init state
    callDurationSeconds = 0;
    const callTimerEl = document.getElementById("call-timer");
    if (callTimerEl) callTimerEl.textContent = "00:00";
    
    // Start duration counter
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

    // Simulated speech timeline
    setTimeout(() => {
        if (dialedNumber === "912") {
            dialogBubble.innerHTML = "<strong>GoMed Operator</strong>Welcome to GoMed Emergency Helpline. Setting up direct channel with emergency responder Sarah...";
            
            setTimeout(() => {
                dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Hello! I am Agent Sarah. I see your call coming from local network. How can I help you today? Do you need a critical medicine delivery from stores nearby?";
                
                // Render call menus
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

function selectCallOption(option) {
    const dialogBubble = document.getElementById("agent-dialogue");
    const menuOptions = document.getElementById("call-menu-options");
    
    if (option === 'delivery') {
        dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Understood. I have unlocked the delivery catalog for you in this browser. You can select the items, fill out your name/address, and we will package them immediately. Closing helpline channel now. Rest well!";
        if (menuOptions) menuOptions.innerHTML = "";
        
        setTimeout(() => {
            closeDialer();
            // Scroll to catalog section
            const catalogSection = document.getElementById("catalog");
            if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth' });
        }, 3000);
        
    } else if (option === 'doctor') {
        dialogBubble.innerHTML = "<strong>Sarah (GoMed Agent)</strong>Got it. Routing your line to our active emergency physician. This is free under the GoMed initiative. Please hold, dialing doctor Dr. James...";
        if (menuOptions) menuOptions.innerHTML = "";
        
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

function endHelplineCall() {
    clearInterval(callInterval);
    callInterval = null;
    callDurationSeconds = 0;
    switchDialerScreen("keypad");
}

// 7. Simulated Checkouts and Order Tracking
function handleCheckoutSubmit(e) {
    e.preventDefault();

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

    // Mock an order object
    const newOrder = {
        orderId: "GOMED-" + Math.floor(100000 + Math.random() * 900000),
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        items: [...cart],
        totalAmount: getCartTotal(),
        statusStep: 1, // Start with Step 1: Placed
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Save order status & clear cart
    currentTrackingOrder = newOrder;
    localStorage.setItem("gomed_tracking_order", JSON.stringify(newOrder));
    
    // Clear cart
    cart = [];
    saveCartToStorage();
    renderCart();

    // Re-render inventory cards so + buttons reset to original state
    const searchVal = document.getElementById("search-input").value;
    renderCatalog("all", searchVal);

    // Close Cart drawer if open
    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) cartDrawer.classList.remove("active");

    // Clear checkout fields
    document.getElementById("cust-name").value = "";
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";

    // Launch tracking screen animations
    launchOrderTracking(newOrder);
}

function launchOrderTracking(order) {
    const trackerSec = document.getElementById("tracker-section");
    if (!trackerSec) return;

    trackerSec.classList.add("active");
    trackerSec.scrollIntoView({ behavior: 'smooth' });

    // Populate order info
    document.getElementById("tracking-id").textContent = order.orderId;
    document.getElementById("tracking-time").textContent = order.timestamp;
    document.getElementById("tracking-badge-text").textContent = "Preparing Order";

    // Populate list summary items
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

        // Totals
        const totalRow = document.createElement("div");
        totalRow.className = "tracker-summary-row total";
        totalRow.innerHTML = `
            <span>Total amount due (Upon Delivery)</span>
            <span>$${order.totalAmount.toFixed(2)}</span>
        `;
        summaryItems.appendChild(totalRow);
    }

    // Reset tracking indicators
    updateTrackingTimelineUI(order.statusStep);

    // Start simulation steps progress
    clearInterval(trackingInterval);
    
    // Simulating updates over time
    trackingInterval = setInterval(() => {
        if (!currentTrackingOrder) {
            clearInterval(trackingInterval);
            return;
        }

        if (currentTrackingOrder.statusStep < 4) {
            currentTrackingOrder.statusStep++;
            localStorage.setItem("gomed_tracking_order", JSON.stringify(currentTrackingOrder));
            updateTrackingTimelineUI(currentTrackingOrder.statusStep);
        } else {
            clearInterval(trackingInterval);
            document.getElementById("tracking-badge-text").textContent = "Successfully Delivered";
        }
    }, 8000); // changes phase every 8 seconds
}

function updateTrackingTimelineUI(step) {
    const steps = document.querySelectorAll(".tracker-step");
    const progressLine = document.getElementById("tracker-progress-line");
    const badgeText = document.getElementById("tracking-badge-text");

    // Reset styles
    steps.forEach((s, idx) => {
        s.classList.remove("active", "completed");
        
        const stepNum = idx + 1;
        if (stepNum < step) {
            s.classList.add("completed");
        } else if (stepNum === step) {
            s.classList.add("active");
        }
    });

    // Update horizontal line width or vertical height based on window size
    const isMobile = window.innerWidth <= 768;
    
    let progressPercentage = 0;
    if (step === 2) progressPercentage = 33;
    else if (step === 3) progressPercentage = 66;
    else if (step === 4) progressPercentage = 100;

    if (progressLine) {
        if (isMobile) {
            progressLine.style.width = "4px";
            progressLine.style.height = `${progressPercentage}%`;
        } else {
            progressLine.style.height = "4px";
            progressLine.style.width = `${progressPercentage}%`;
        }
    }

    // Set badge message
    if (step === 1) badgeText.textContent = "Order Placed";
    else if (step === 2) badgeText.textContent = "Packing Supplies";
    else if (step === 3) badgeText.textContent = "Out for Delivery";
    else if (step === 4) badgeText.textContent = "Delivered";
}

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

function resetMockOrder() {
    localStorage.removeItem("gomed_tracking_order");
    currentTrackingOrder = null;
    clearInterval(trackingInterval);
    
    const trackerSec = document.getElementById("tracker-section");
    if (trackerSec) {
        trackerSec.classList.remove("active");
    }
}
