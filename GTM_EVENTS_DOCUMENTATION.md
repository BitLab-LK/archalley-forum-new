# GTM E-commerce Events Documentation

This document lists all GTM e-commerce events, their firing occasions, and sample dataLayer push formats.

---

## 1. `view_item_list`

### **Firing Occasion:**
- Fires when the user lands on the competition registration page and the list of registration types is displayed
- Triggered in `RegistrationForm.tsx` when the component loads and registration types are available
- Fires once per page load when registration types are loaded

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'view_item_list',
  ecommerce: {
    currency: 'LKR',
    item_list_id: 'competition_registration_types',
    item_list_name: 'Competition Registration Types',
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0,
        item_list_id: 'competition_registration_types',
        item_list_name: 'Competition Registration Types'
      },
      {
        item_id: 'comp_123_regtype_2',
        item_name: 'Team Entry (2-5 members)',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Team Entry (2-5 members)',
        price: 15000,
        quantity: 1,
        currency: 'LKR',
        index: 1,
        item_list_id: 'competition_registration_types',
        item_list_name: 'Competition Registration Types'
      },
      {
        item_id: 'comp_123_regtype_3',
        item_name: 'Student Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Student Entry',
        price: 3000,
        quantity: 1,
        currency: 'LKR',
        index: 2,
        item_list_id: 'competition_registration_types',
        item_list_name: 'Competition Registration Types'
      }
    ]
  }
});
```

---

## 2. `view_item`

### **Firing Occasion:**
- Fires when a user selects/clicks on a registration type radio button
- Triggered in `RegistrationForm.tsx` when user changes the selected registration type
- Fires each time a different registration type is selected

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'view_item',
  ecommerce: {
    currency: 'LKR',
    value: 5000,  // Calculated from price * quantity
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR'
      }
    ]
  }
});
```

---

## 3. `select_item`

### **Firing Occasion:**
- Fires immediately after `view_item` when a user selects a registration type from the list
- Triggered in `RegistrationForm.tsx` when user clicks a registration type radio button
- Fires each time a registration type is selected (same trigger as `view_item`)

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'select_item',
  ecommerce: {
    item_list_id: 'competition_registration_types',
    item_list_name: 'Competition Registration Types',
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0,
        item_list_id: 'competition_registration_types',
        item_list_name: 'Competition Registration Types'
      }
    ]
  }
});
```

---

## 4. `add_to_cart`

### **Firing Occasion:**
- Fires when a user successfully submits the registration form and adds an item to the cart
- Triggered in `RegistrationForm.tsx` after successful API response from `/api/competitions/cart` POST request
- Fires once per successful "Add to Cart" action

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'add_to_cart',
  ecommerce: {
    currency: 'LKR',
    value: 5000,  // Calculated from sum of (price * quantity) for all items
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      }
    ]
  }
});
```

---

## 5. `view_cart`

### **Firing Occasion:**
- Fires when the cart sidebar component loads and fetches cart data
- Triggered in `RegistrationCartSidebar.tsx` when cart is successfully fetched from `/api/competitions/cart`
- Fires each time the cart is loaded/refreshed (when cart has items)

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'view_cart',
  ecommerce: {
    currency: 'LKR',
    value: 20000,  // Calculated from sum of (price * quantity) for all items
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      },
      {
        item_id: 'comp_123_regtype_2',
        item_name: 'Team Entry (2-5 members)',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Team Entry (2-5 members)',
        price: 15000,
        quantity: 1,
        currency: 'LKR',
        index: 1
      }
    ]
  }
});
```

---

## 6. `remove_from_cart`

### **Firing Occasion:**
- Fires when a user clicks the remove button (trash icon) on a cart item
- Triggered in `RegistrationCartSidebar.tsx` after successful DELETE request to `/api/competitions/cart/remove`
- Fires once per successful item removal

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'remove_from_cart',
  ecommerce: {
    currency: 'LKR',
    value: 5000,  // Calculated from price * quantity of removed item
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      }
    ]
  }
});
```

---

## 7. `begin_checkout`

### **Firing Occasion:**
- Fires when a user clicks the "Proceed to Checkout" button in the cart sidebar
- Triggered in `RegistrationCartSidebar.tsx` when user clicks checkout button (after agreeing to terms)
- Fires once per checkout initiation (before navigation to checkout page)

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'begin_checkout',
  ecommerce: {
    currency: 'LKR',
    value: 20000,  // Calculated from sum of (price * quantity) for all items
    coupon: undefined,  // Optional: coupon code if applicable
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      },
      {
        item_id: 'comp_123_regtype_2',
        item_name: 'Team Entry (2-5 members)',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Team Entry (2-5 members)',
        price: 15000,
        quantity: 1,
        currency: 'LKR',
        index: 1
      }
    ]
  }
});
```

---

## 8. `add_payment_info`

### **Firing Occasion:**
- Fires when a user selects a payment method and clicks the payment button
- Triggered in `checkout-client.tsx`:
  - When user clicks "Pay with Card" button (paymentType: 'card')
  - When user clicks "Submit Bank Transfer" button (paymentType: 'bank_transfer')
- Fires once per payment method selection/submission

### **Sample dataLayer Push (Card Payment):**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'add_payment_info',
  ecommerce: {
    currency: 'LKR',
    value: 20000,  // Calculated from sum of (price * quantity) for all items
    payment_type: 'card',  // or 'bank_transfer'
    coupon: undefined,  // Optional: coupon code if applicable
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      },
      {
        item_id: 'comp_123_regtype_2',
        item_name: 'Team Entry (2-5 members)',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Team Entry (2-5 members)',
        price: 15000,
        quantity: 1,
        currency: 'LKR',
        index: 1
      }
    ]
  }
});
```

### **Sample dataLayer Push (Bank Transfer):**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'add_payment_info',
  ecommerce: {
    currency: 'LKR',
    value: 20000,
    payment_type: 'bank_transfer',
    coupon: undefined,
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      }
    ]
  }
});
```

---

## 9. `purchase`

### **Firing Occasion:**
- Fires when payment is successfully completed and user lands on the payment success page
- Triggered in `payment-success-client.tsx` when the component mounts and payment data is available
- Also triggered in `admin-registrations-client.tsx` when admin manually approves a registration
- Fires once per successful purchase/approval

### **Sample dataLayer Push:**
```javascript
// First, clear previous ecommerce object
window.dataLayer.push({ ecommerce: null });

// Then push the event
window.dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'ORD-1234567890',  // Required: Order/Transaction ID
    currency: 'LKR',
    value: 20000,  // Total transaction value (can be provided or calculated from items)
    tax: undefined,  // Optional: Tax amount
    shipping: undefined,  // Optional: Shipping cost
    coupon: undefined,  // Optional: Coupon code used
    affiliation: undefined,  // Optional: Affiliation/partner name
    items: [
      {
        item_id: 'comp_123_regtype_1',
        item_name: 'Individual Entry',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Individual Entry',
        price: 5000,
        quantity: 1,
        currency: 'LKR',
        index: 0
      },
      {
        item_id: 'comp_123_regtype_2',
        item_name: 'Team Entry (2-5 members)',
        item_category: 'Competition Registration',
        item_category2: 'ArchAlley Competition 2025',
        item_category3: 'Team Entry (2-5 members)',
        price: 15000,
        quantity: 1,
        currency: 'LKR',
        index: 1
      }
    ]
  }
});
```

---

## Important Notes:

1. **E-commerce Object Clearing**: All events first clear the previous ecommerce object by pushing `{ ecommerce: null }` before pushing the new event. This is required by GA4 to prevent data contamination.

2. **Currency**: Default currency is 'LKR' (Sri Lankan Rupees) for all events.

3. **Item Structure**: All items follow the GA4 e-commerce item structure with:
   - `item_id`: Unique identifier (format: `{competitionId}_{registrationTypeId}`)
   - `item_name`: Display name of the registration type
   - `item_category`: Always 'Competition Registration'
   - `item_category2`: Competition title
   - `item_category3`: Registration type name
   - `price`: Registration fee
   - `quantity`: Always 1 (one registration per item)
   - `index`: Position in the list (0-based)

4. **Value Calculation**: The `value` field is automatically calculated from `sum(price * quantity)` for all items if not explicitly provided.

5. **Event Sequence**: Typical user journey event sequence:
   - `view_item_list` → `view_item` → `select_item` → `add_to_cart` → `view_cart` → `begin_checkout` → `add_payment_info` → `purchase`

