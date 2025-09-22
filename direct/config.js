/**
 * Thrivoy Frontend Configuration
 * 
 * IMPORTANT: Update these settings before deploying to production
 * This file should be placed in your GitHub repository root
 */

// STEP 1: Update this with your Apps Script Web App URL
// Get this from: Apps Script > Deploy > New Deployment > Web App > Copy URL
const THRIVOY_CONFIG = {
    // Replace 'YOUR_DEPLOYMENT_ID' with your actual Apps Script deployment ID
    API_URL: 'https://script.google.com/macros/s/AKfycbzn28Orw0cvr9FX1JZUBWM--wQEmjA2EBEbH_I7rZuVWDONLUEU36w18yX2wxAaJhBy/exec',
    
    // GitHub Pages configuration (automatically detected)
    GITHUB_PAGES_URL: window.location.origin,
    
    // Environment settings
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname.includes('github.io'),
    
    // Request timeout settings
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // Retry configuration for failed requests
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    
    // Feature flags
    FEATURES: {
        AI_CONTENT_GENERATION: true,
        SOCIAL_SHARING: true,
        PAYMENT_INTEGRATION: true,
        ANALYTICS_TRACKING: true
    }
};

/**
 * CORS-Free API Communication Class
 * Handles all communication with Apps Script backend without CORS issues
 */
class ThrivoyAPI {
    constructor(config = THRIVOY_CONFIG) {
        this.config = config;
        this.requestQueue = new Map();
    }

    /**
     * Main API request method - automatically handles CORS via JSONP
     * @param {string} action - The action to perform
     * @param {Object} data - Data to send
     * @returns {Promise} Response from API
     */
    async request(action, data = {}) {
        const requestData = { ...data, action };
        const requestId = this.generateRequestId();
        
        try {
            // Primary method: JSONP (most reliable for Apps Script)
            const result = await this.makeJSONPRequest(requestId, requestData);
            this.logRequest(action, 'success', result);
            return result;
            
        } catch (error) {
            this.logRequest(action, 'error', error);
            
            // Fallback: Try POST request if JSONP fails
            try {
                console.log('JSONP failed, attempting POST fallback...');
                const fallbackResult = await this.makePostRequest(requestData);
                this.logRequest(action, 'fallback_success', fallbackResult);
                return fallbackResult;
            } catch (fallbackError) {
                console.error('Both JSONP and POST failed:', fallbackError);
                throw new Error(`API request failed: ${error.message}`);
            }
        }
    }

    /**
     * JSONP request implementation
     */
    makeJSONPRequest(requestId, data) {
        return new Promise((resolve, reject) => {
            const callbackName = `thrivoyCallback_${requestId}`;
            const timeoutId = setTimeout(() => {
                this.cleanupJSONP(callbackName, script);
                reject(new Error('Request timeout'));
            }, this.config.REQUEST_TIMEOUT);

            // Create global callback
            window[callbackName] = (response) => {
                clearTimeout(timeoutId);
                this.cleanupJSONP(callbackName, script);
                
                if (response && response.success !== undefined) {
                    resolve(response);
                } else {
                    reject(new Error('Invalid response format'));
                }
            };

            // Create script element for JSONP
            const script = document.createElement('script');
            const params = new URLSearchParams({ ...data, callback: callbackName });
            script.src = `${this.config.API_URL}?${params.toString()}`;
            
            script.onerror = () => {
                clearTimeout(timeoutId);
                this.cleanupJSONP(callbackName, script);
                reject(new Error('Network error during JSONP request'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * POST request fallback
     */
    async makePostRequest(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        try {
            const response = await fetch(this.config.API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Cleanup JSONP resources
     */
    cleanupJSONP(callbackName, script) {
        try {
            if (window[callbackName]) {
                delete window[callbackName];
            }
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        } catch (error) {
            console.warn('JSONP cleanup error:', error);
        }
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Request logging for debugging
     */
    logRequest(action, status, data) {
        if (this.config.DEBUG) {
            console.log(`[ThrivoyAPI] ${action}:${status}`, data);
        }
    }

    /**
     * Batch request handler for multiple simultaneous requests
     */
    async batchRequest(requests) {
        const promises = requests.map(req => this.request(req.action, req.data));
        return Promise.allSettled(promises);
    }

    /**
     * Health check method
     */
    async healthCheck() {
        try {
            const result = await this.request('test', { timestamp: Date.now() });
            return result.success === true;
        } catch (error) {
            return false;
        }
    }
}

/**
 * Form Handler Class - Manages form submissions with proper error handling
 */
class ThrivoyFormHandler {
    constructor(api) {
        this.api = api;
        this.forms = new Map();
    }

    /**
     * Initialize form with validation and submission handling
     */
    initializeForm(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form ${formId} not found`);
            return;
        }

        const config = {
            validate: true,
            showProgress: true,
            autoRedirect: false,
            successMessage: 'Form submitted successfully!',
            ...options
        };

        this.forms.set(formId, { element: form, config });
        this.setupFormListeners(formId);
    }

    /**
     * Setup form event listeners
     */
    setupFormListeners(formId) {
        const formData = this.forms.get(formId);
        const { element: form, config } = formData;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleFormSubmission(formId);
        });

        // Real-time validation
        if (config.validate) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        }
    }

    /**
     * Handle form submission with progress and error handling
     */
    async handleFormSubmission(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const { element: form, config } = formData;
        const submitButton = form.querySelector('button[type="submit"]');
        
        try {
            // Show loading state
            this.setFormLoading(form, true);
            
            // Validate form
            if (config.validate && !this.validateForm(form)) {
                throw new Error('Please fix the validation errors');
            }

            // Prepare form data
            const data = this.serializeForm(form);
            
            // Submit to API
            const result = await this.api.request('onboard', data);
            
            if (result.success) {
                this.handleFormSuccess(form, result, config);
            } else {
                throw new Error(result.error || 'Submission failed');
            }
            
        } catch (error) {
            this.handleFormError(form, error.message);
        } finally {
            this.setFormLoading(form, false);
        }
    }

    /**
     * Serialize form data to object
     */
    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) data[key] = [data[key]];
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes that weren't checked
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked && checkbox.name) {
                data[checkbox.name] = false;
            }
        });

        return data;
    }

    /**
     * Form validation
     */
    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Individual field validation
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (field.hasAttribute('required') && !value) {
            errorMessage = 'This field is required';
            isValid = false;
        }

        // Type-specific validation
        if (value && field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
        }

        if (value && (field.type === 'tel' || field.name.includes('phone'))) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value)) {
                errorMessage = 'Please enter a valid phone number';
                isValid = false;
            }
        }

        // Show/hide error
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        field.style.borderColor = '#dc3545';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = 'color: #dc3545; font-size: 14px; margin-top: 4px;';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        field.style.borderColor = '';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Set form loading state
     */
    setFormLoading(form, isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const spinner = submitButton?.querySelector('.loading-spinner');
        const btnText = submitButton?.querySelector('.btn-text');
        
        if (submitButton) {
            submitButton.disabled = isLoading;
            if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
            if (btnText && isLoading) {
                btnText.textContent = 'Processing...';
            }
        }

        // Disable all form inputs while loading
        const inputs = form.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            if (input !== submitButton) {
                input.disabled = isLoading;
            }
        });
    }

    /**
     * Handle successful form submission
     */
    handleFormSuccess(form, result, config) {
        if (config.successMessage) {
            this.showAlert(config.successMessage, 'success');
        }

        if (config.autoRedirect && result.redirectUrl) {
            setTimeout(() => {
                window.location.href = result.redirectUrl;
            }, 2000);
        }

        // Custom success callback
        if (config.onSuccess && typeof config.onSuccess === 'function') {
            config.onSuccess(result);
        }
    }

    /**
     * Handle form submission error
     */
    handleFormError(form, message) {
        this.showAlert(`Error: ${message}`, 'error');
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        const alertElement = document.getElementById('alert-message') || this.createAlertElement();
        alertElement.className = `alert alert-${type}`;
        alertElement.innerHTML = message;
        alertElement.style.display = 'block';

        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Create alert element if it doesn't exist
     */
    createAlertElement() {
        const alert = document.createElement('div');
        alert.id = 'alert-message';
        alert.className = 'alert';
        alert.style.cssText = `
            padding: 15px 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid;
            display: none;
        `;
        
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alert, container.firstChild);
        
        return alert;
    }
}

/**
 * Initialize Thrivoy frontend
 */
function initializeThrivoy() {
    // Check if API URL is configured
    if (THRIVOY_CONFIG.API_URL.includes('YOUR_DEPLOYMENT_ID')) {
        console.error('⚠️ SETUP REQUIRED: Please update API_URL in config.js with your Apps Script deployment URL');
        return;
    }

    // Create global API instance
    window.ThrivoyAPI = new ThrivoyAPI(THRIVOY_CONFIG);
    window.ThrivoyForms = new ThrivoyFormHandler(window.ThrivoyAPI);

    // Test API connection
    window.ThrivoyAPI.healthCheck().then(isHealthy => {
        console.log(`🌐 API Status: ${isHealthy ? 'Connected' : 'Connection Failed'}`);
        if (!isHealthy && THRIVOY_CONFIG.DEBUG) {
            console.warn('API health check failed. Check your deployment URL and CORS settings.');
        }
    });

    console.log('✅ Thrivoy frontend initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThrivoy);
} else {
    initializeThrivoy();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { THRIVOY_CONFIG, ThrivoyAPI, ThrivoyFormHandler };
}
