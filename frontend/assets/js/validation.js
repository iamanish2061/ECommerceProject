const patterns = {
    fullName: /^[A-Za-z\s]{4,50}$/,
    username: /^[A-Za-z0-9_]{4,20}$/,
    email: /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/,
    password: /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[@#$%^&+=!_*])(?=\S+$).{8,50}$/,
    code: /^\d{6}$/
};

// FIX: Ensure 'message' is used and we return false
const showError = (input, message = null) => {
    const field = input.closest('.field');
    const errorSpan = field?.querySelector('.error-msg');
    if (errorSpan) {
        // Using the passed 'message' or fallback
        errorSpan.textContent = message || errorSpan.dataset.default || "Invalid input";
        errorSpan.classList.add('active');
    }
    return false;
};

const hideError = (input) => {
    const errorSpan = input.closest('.field')?.querySelector('.error-msg');
    if (errorSpan) {
        errorSpan.classList.remove('active');
    }
};

// All functions now take the HTML input element and return true/false

function validateFullName(input) {
    const val = input.value.trim();
    if (!val) {
        return showError(input, "Fullname is required");
    } if (!patterns.fullName.test(val)) {
        return showError(input, "Fullname must be 4-50 characters (letters and spaces only)");
    }
    hideError(input);
    return true;
}

// FIX: Corrected to use input element and username pattern
function validateUsername(input) {
    const val = input.value.trim();
    if (!val) {
        return showError(input, "Username is required");
    }
    // FIX: Using the correct 'patterns.username' regex
    if (!patterns.username.test(val)) {
        return showError(input, "Username must be 4-20 characters (a-z, 0-9, and _)");
    }
    hideError(input);
    return true;
}

// FIX: Standardized to return true/false
function validateEmail(input) {
    const val = input.value.trim();
    if (!val) {
        return showError(input, "Email is required");
    } if (!patterns.email.test(val)) {
        return showError(input, "Invalid email format");
    }
    hideError(input);
    return true;
}

function validatePassword(input) {
    const val = input.value.trim();
    if (!val) {
        return showError(input, "Password is required");
    } if (!patterns.password.test(val)) {
        showToast("Password must be 8+ characters and include a number, letter, and symbol (@#$%^&+=!_*)", "info");
        return showError(input, "Password must be 8+ characters and include a number, letter, and symbol (@#$%^&+=!_*)");
    }
    hideError(input);
    return true;
}

function validateConfirmPassword(passwordInput, confirmInput) {
    const passwordVal = passwordInput.value.trim();
    const confirmVal = confirmInput.value.trim();

    if (passwordVal !== confirmVal) {
        return showError(confirmInput, "Passwords do not match");
    }
    hideError(confirmInput);
    return true;
}