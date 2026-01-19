// checkout.js
let addressConfirmed = false;
let cartCount = 0;
let subTotalAmount = 0;

async function initCheckoutCartPage() {
    subTotalAmount = parseFloat(getFromUrl("total")) || 0;
    if (!subTotalAmount) {
        showToast("Please go through your cart!", "info");
    }

    const subPriceInput = document.getElementById("productPrice");
    subPriceInput.textContent = `Rs. ${subTotalAmount.toLocaleString()}`;

    try {
        // Load cart items for summary
        await renderCartItems();

        const cartResp = await checkoutService.getCartCount();
        if (cartResp.success) {
            cartCount = cartResp.data.totalCartItems || 0;
        }

        updateCartCount();
    } catch (err) {
        console.error('Error initializing checkout cart page:', err);
    }
}

async function renderCartItems() {
    try {
        const response = await cartService.getCartItems();
        if (response.success && response.data) {
            const listContainer = document.getElementById("cartItemsList");
            listContainer.innerHTML = "";

            response.data.forEach(item => {
                const product = item.product;
                const thumbnailImg = product.images.find(img => img.thumbnail === true) || product.images[0];
                const productImageUrl = thumbnailImg ? thumbnailImg.url : 'default-image.png';

                const itemHtml = `
                    <div class="flex items-center gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                        <div class="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1.5 flex-shrink-0">
                            <img src="${productImageUrl}" alt="${product.name}" class="w-full h-full object-contain">
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start gap-2">
                                <p class="font-bold text-slate-800 text-sm truncate">${product.name}</p>
                                <p class="text-xs font-bold text-blue-600 whitespace-nowrap">x${item.quantity}</p>
                            </div>
                            <p class="text-[10px] text-slate-400 line-clamp-1 mt-0.5">${product.shortDescription || product.description || ''}</p>
                            <p class="text-xs font-semibold text-slate-500 mt-1">Rs. ${product.price.toLocaleString()}</p>
                        </div>
                    </div>
                `;
                listContainer.insertAdjacentHTML('beforeend', itemHtml);
            });
        }
    } catch (err) {
        console.error('Error rendering cart items:', err);
    }
}

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = cartCount || 0;
    }
}

// ===== ELEMENTS =====
const phoneInput = document.getElementById("phoneNumber");

const addressTypeInput = document.getElementById("addressType");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");

const provinceInput = document.getElementById("province");
const districtInput = document.getElementById("district");
const placeInput = document.getElementById("place");
const landmarkInput = document.getElementById("landmark");

const locateBtn = document.getElementById("locateOnMapBtn");
const confirmCheckbox = document.getElementById("confirmAddress");
const confirmSection = confirmCheckbox.closest(".mt-6");

const deliveryChargeEl = document.getElementById("deliveryCharge");
const totalPriceEl = document.getElementById("totalPrice");


const checkoutBtn = document.getElementById("checkoutButton");

function showToast(message, type = "info", duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

// ===== ADDRESS TYPE (HOME / WORK) =====
document.querySelectorAll("input[name='address_type']").forEach(radio => {
    radio.addEventListener("change", async function () {
        try {
            showToast("Fetching saved address...", "info");
            const response = await checkoutService.fetchAddress(this.value);
            data = response.data;

            if (!data) {
                showToast("No saved address found", "error");
                return;
            }

            addressTypeInput.value = data.addressType;
            latitudeInput.value = data.latitude;
            longitudeInput.value = data.longitude;

            provinceInput.value = data.province;
            districtInput.value = data.district;
            placeInput.value = data.place;
            landmarkInput.value = data.landmark || "";

            updateMapFromLatAndLng(data.latitude, data.longitude);
            disableInputFields();
            locateBtn.classList.add("hidden");

            confirmSection.classList.add("hidden");

            deliveryChargeEl.textContent = `Rs. ${(data.deliveryCharge || 0).toLocaleString()}`;
            const total = (data.deliveryCharge || 0) + subTotalAmount;
            totalPriceEl.textContent = `Rs. ${total.toLocaleString()}`;
            addressConfirmed = true;

        } catch (e) {
            console.error(e);
            showToast("Failed to load address", "error");
        }
    });
});

// ===== LOCATE BUTTON =====
locateBtn.addEventListener("click", async () => {
    const province = provinceInput.value?.trim();
    const district = districtInput.value?.trim();
    const place = placeInput.value?.trim();
    const landmark = landmarkInput.value?.trim();

    if (!province && !district && !place && !landmark) {
        showToast("Please fill the address field");
        return;
    }

    const address = [landmark, place, district, province, COUNTRY]
        .filter(Boolean)
        .join(", ");

    const location = await geocodeAddress(address);
    if (!location) {
        showToast("Location not found", "error");
        return;
    }

    map.setView([location.lat, location.lng], 16);
    marker.setLatLng([location.lat, location.lng]);

    updateLatLng(location.lat, location.lng);
    updateAddressFields(location.components, location.roadInfo);
});


// ===== CONFIRM ADDRESS CHECKBOX =====
confirmCheckbox.addEventListener("change",
    async function () {
        if (!this.checked) return;

        if (latitudeInput.value === "" || longitudeInput.value === "") {
            showToast("Please select on map for accurate address", "info");
            this.checked = false;
            return;
        }

        const address = {
            latitude: latitudeInput.value,
            longitude: longitudeInput.value
        };

        try {
            showToast("Confirming address...", "info");
            disableInputFields();
            marker.dragging.disable();
            const response = await checkoutService.calculateDeliveryCharge(address);
            const deliveryCharge = response.data?.deliveryCharge || 0;
            deliveryChargeEl.textContent = `Rs. ${deliveryCharge.toLocaleString()}`;
            const total = deliveryCharge + subTotalAmount;
            totalPriceEl.textContent = `Rs. ${total.toLocaleString()}`;
            addressConfirmed = true;
            showToast("Address confirmed", "success");
        }
        catch (e) {
            console.error(e);
            showToast("Failed to confirm address", "error");
            this.checked = false;
        }
    });

checkoutBtn.addEventListener("click", async function () {

    const contactNumber = phoneInput.value?.trim() || '';
    const type = addressTypeInput?.value || 'OTHER'; // HOME | WORK | OTHER

    const latitude = Number(latitudeInput.value) || -1;
    const longitude = Number(longitudeInput.value) || -1;

    const provinceVal = provinceInput.value?.trim() || '';
    const districtVal = districtInput.value?.trim() || '';
    const placeVal = placeInput.value?.trim() || '';
    const landmarkVal = landmarkInput.value?.trim() || '';

    const deliveryCharge = Number(deliveryChargeEl.textContent.replace("Rs. ", "")) || -1;

    const paymentMethod = document.querySelector(
        "input[name='payment_method']:checked"
    )?.value || ''; // ESEWA | KHALTI | CASH_ON_DELIVERY

    console.log({
        contactNumber,
        type,
        latitude,
        longitude,
        provinceVal,
        districtVal,
        placeVal,
        landmarkVal,
        paymentMethod,
        deliveryCharge,
        addressConfirmed
    });


    if (type.value === "" || latitude === -1 || longitude === -1 || !addressConfirmed || deliveryCharge === -1) {
        showToast("Please select on map and confirm!", "info");
        return;
    }

    if (contactNumber === "" || provinceVal === "" || districtVal === "" || placeVal === "" || landmarkVal === "" || paymentMethod === "") {
        showToast("Please fill all the fields", "error");
        return;
    }

    // validations
    if (!/^(97|98)\d{8}$/.test(contactNumber)) {
        showToast("Invalid phone number", "error");
        return;
    }

    if ((!addressConfirmed && !type) || isNaN(deliveryCharge)) {
        showToast("Please confirm address first", "error");
        return;
    }

    if (!paymentMethod) {
        showToast("Select payment method", "error");
        return;
    }

    // request body matching PlaceOrderRequest
    const body = {
        contactNumber: contactNumber,
        type: type,
        latitude: latitude,
        longitude: longitude,
        province: provinceVal,
        district: districtVal,
        place: placeVal,
        landmark: landmarkVal,
        paymentMethod: paymentMethod,
        deliveryCharge: deliveryCharge
    };

    try {
        showToast("Placing order...", "info");
        const response = await checkoutService.processCartCheckout(body);
        if (response.success) {
            const paymentData = response.data;
            console.log("Payment Data:", paymentData);

            if (paymentData.method === "CASH_ON_DELIVERY") {
                showToast("Order placed successfully! Pay on delivery.", "success");
                setTimeout(() => {
                    window.location.href = "orders.html";
                }, 1500);
            } else if (paymentData.method === "ESEWA") {
                populateEsewaFormAndSubmit(paymentData.esewa);
            } else if (paymentData.method === "KHALTI") {
                window.location.href = paymentData.url;
            }

        } else {
            showToast(response.message || "Failed to place order", "error");
        }
    }
    catch (e) {
        console.error(e);
        showToast("An error occurred during checkout", "error");
    }

});


function disableInputFields() {
    latitudeInput.disabled = true;
    longitudeInput.disabled = true;
    addressTypeInput.disabled = true;
    provinceInput.disabled = true;
    districtInput.disabled = true;
    placeInput.disabled = true;
    landmarkInput.disabled = true;
    locateBtn.disabled = true;
}

function getFromUrl(productId) {
    const params = new URLSearchParams(window.location.search);
    return params.get(productId);
}

function populateEsewaFormAndSubmit(esewaData) {

    document.getElementById("esewa_amount").value = esewaData.amount;
    document.getElementById("esewa_tax_amount").value = esewaData.taxAmt;
    document.getElementById("esewa_total_amount").value = esewaData.total_amount;
    document.getElementById("esewa_transaction_uuid").value = esewaData.transaction_uuid;
    document.getElementById("esewa_product_code").value = "EPAYTEST";

    document.getElementById("esewa_product_service_charge").value = esewaData.productServiceCharge;
    document.getElementById("esewa_product_delivery_charge").value = esewaData.productDeliveryCharge;
    document.getElementById("esewa_success_url").value = "http://localhost:8080/api/payment/esewa-response-handle";
    document.getElementById("esewa_failure_url").value = "http://localhost:8080/api/payment/esewa-response-handle";
    document.getElementById("esewa_signature").value = esewaData.signature;

    document.getElementById("esewaForm").submit();

}

document.getElementById("cartBtn").addEventListener("click", () => {
    window.location.href = "cart.html";
})

document.addEventListener("DOMContentLoaded", initCheckoutCartPage);