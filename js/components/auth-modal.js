export class AuthModal {
    constructor(authService, validationService) {
        this.authService = authService;
        this.validationService = validationService;
        this.currentTab = 'login';
        this.isVisible = false;
        
        this.createModal();
        this.attachEventListeners();
    }
    
    createModal() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop auth-modal-backdrop';
        
        this.modal = document.createElement('div');
        this.modal.className = 'modal auth-modal';
        
        this.modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">Welkom bij ROI Calculator</h2>
                <button class="modal-close" aria-label="Sluiten">&times;</button>
            </div>
            <div class="modal-body">
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Inloggen</button>
                    <button class="auth-tab" data-tab="register">Registreren</button>
                </div>
                
                <div class="auth-content">
                    <div class="auth-form login-form active">
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail">E-mailadres</label>
                                <div class="input-wrapper">
                                    <input type="email" id="loginEmail" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Wachtwoord</label>
                                <div class="input-wrapper">
                                    <input type="password" id="loginPassword" required>
                                </div>
                            </div>
                            <div class="auth-actions">
                                <button type="submit" class="btn btn-primary btn-lg auth-submit">
                                    <span class="btn-text">Inloggen</span>
                                    <span class="btn-spinner" style="display: none;">⏳</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="auth-form register-form">
                        <form id="registerForm">
                            <div class="form-group">
                                <label for="registerEmail">E-mailadres</label>
                                <div class="input-wrapper">
                                    <input type="email" id="registerEmail" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">Wachtwoord</label>
                                <div class="input-wrapper">
                                    <input type="password" id="registerPassword" required>
                                    <small class="form-help">Minimaal 8 tekens, 1 hoofdletter en 1 cijfer</small>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="registerFirstName">Voornaam</label>
                                <div class="input-wrapper">
                                    <input type="text" id="registerFirstName" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="registerLastName">Achternaam</label>
                                <div class="input-wrapper">
                                    <input type="text" id="registerLastName" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="registerCompany">Bedrijf (optioneel)</label>
                                <div class="input-wrapper">
                                    <input type="text" id="registerCompany">
                                </div>
                            </div>
                            <div class="auth-actions">
                                <button type="submit" class="btn btn-primary btn-lg auth-submit">
                                    <span class="btn-text">Account aanmaken</span>
                                    <span class="btn-spinner" style="display: none;">⏳</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="auth-error" style="display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.modal);
    }
    
    attachEventListeners() {
        this.backdrop.addEventListener('click', () => this.hide());
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
        
        this.modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        this.modal.querySelector('#loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        this.modal.querySelector('#registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        this.attachValidationListeners();
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    attachValidationListeners() {
        const inputs = this.modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }
    
    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Voer een geldig e-mailadres in';
            }
        }
        
        if (input.type === 'password') {
            if (value.length < 8) {
                isValid = false;
                errorMessage = 'Wachtwoord moet minimaal 8 tekens bevatten';
            } else if (!/[A-Z]/.test(value)) {
                isValid = false;
                errorMessage = 'Wachtwoord moet minimaal 1 hoofdletter bevatten';
            } else if (!/[0-9]/.test(value)) {
                isValid = false;
                errorMessage = 'Wachtwoord moet minimaal 1 cijfer bevatten';
            }
        }
        
        if (input.required && !value) {
            isValid = false;
            errorMessage = 'Dit veld is verplicht';
        }
        
        if (!isValid) {
            this.showFieldError(input, errorMessage);
        } else {
            this.clearFieldError(input);
        }
        
        return isValid;
    }
    
    showFieldError(input, message) {
        input.classList.add('is-invalid');
        
        let errorEl = input.parentElement.querySelector('.invalid-feedback');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'invalid-feedback';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }
    
    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const errorEl = input.parentElement.querySelector('.invalid-feedback');
        if (errorEl) {
            errorEl.remove();
        }
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        this.modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        this.modal.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.classList.contains(`${tabName}-form`));
        });
        
        this.hideError();
        this.clearAllFieldErrors();
    }
    
    async handleLogin() {
        const form = this.modal.querySelector('#loginForm');
        const email = form.querySelector('#loginEmail').value.trim();
        const password = form.querySelector('#loginPassword').value;
        
        if (!this.validateForm(form)) {
            return;
        }
        
        this.setLoading(true);
        this.hideError();
        
        const result = await this.authService.login(email, password);
        
        this.setLoading(false);
        
        if (result.success) {
            this.hide();
            this.onAuthSuccess(result.user);
        } else {
            this.showError(result.error);
        }
    }
    
    async handleRegister() {
        const form = this.modal.querySelector('#registerForm');
        const userData = {
            email: form.querySelector('#registerEmail').value.trim(),
            password: form.querySelector('#registerPassword').value,
            firstName: form.querySelector('#registerFirstName').value.trim(),
            lastName: form.querySelector('#registerLastName').value.trim(),
            company: form.querySelector('#registerCompany').value.trim()
        };
        
        if (!this.validateForm(form)) {
            return;
        }
        
        this.setLoading(true);
        this.hideError();
        
        const result = await this.authService.register(userData);
        
        this.setLoading(false);
        
        if (result.success) {
            this.hide();
            this.onAuthSuccess(result.user);
        } else {
            this.showError(result.error);
        }
    }
    
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    setLoading(loading) {
        const submitBtn = this.modal.querySelector('.auth-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');
        
        submitBtn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnSpinner.style.display = loading ? 'inline' : 'none';
    }
    
    showError(message) {
        const errorEl = this.modal.querySelector('.auth-error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    hideError() {
        const errorEl = this.modal.querySelector('.auth-error');
        errorEl.style.display = 'none';
    }
    
    clearAllFieldErrors() {
        this.modal.querySelectorAll('input').forEach(input => {
            this.clearFieldError(input);
        });
    }
    
    show() {
        this.isVisible = true;
        this.backdrop.classList.add('active');
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const firstInput = this.modal.querySelector('.auth-form.active input');
            if (firstInput) firstInput.focus();
        }, 300);
    }
    
    hide() {
        this.isVisible = false;
        this.backdrop.classList.remove('active');
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        this.modal.querySelectorAll('form').forEach(form => form.reset());
        this.clearAllFieldErrors();
        this.hideError();
    }
    
    showLogin() {
        this.switchTab('login');
        this.show();
    }
    
    showRegister() {
        this.switchTab('register');
        this.show();
    }
    
    onAuthSuccess(user) {
        if (this.onAuthSuccessCallback) {
            this.onAuthSuccessCallback(user);
        }
    }
    
    setAuthSuccessCallback(callback) {
        this.onAuthSuccessCallback = callback;
    }
}
