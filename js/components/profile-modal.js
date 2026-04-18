// Profile Modal Component
// Allows a signed-in user to update the personal data they supplied at
// registration (first name, last name, company) and shows account details
// that are not editable from the UI (email, license).

export class ProfileModal {
    constructor(authService) {
        this.authService = authService;
        this.isVisible = false;
        this.user = null;
        this.onUpdateCallback = null;

        this.keydownHandler = (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        };

        this.createModal();
        this.attachEventListeners();
    }

    createModal() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'profile-modal-backdrop';

        this.modal = document.createElement('div');
        this.modal.className = 'profile-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'profileModalTitle');

        this.modal.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title" id="profileModalTitle">Profiel bewerken</h2>
                <button type="button" class="modal-close" aria-label="Sluiten">&times;</button>
            </div>
            <div class="modal-body">
                <div class="profile-feedback profile-error" role="alert" style="display:none;"></div>
                <div class="profile-feedback profile-success" role="status" style="display:none;"></div>

                <div class="profile-readonly">
                    <div class="profile-readonly-row">
                        <span class="profile-readonly-label">E-mail</span>
                        <span class="profile-readonly-value" data-field="email"></span>
                    </div>
                    <div class="profile-readonly-row">
                        <span class="profile-readonly-label">Licentie</span>
                        <span class="profile-readonly-value" data-field="license"></span>
                    </div>
                </div>

                <form id="profileForm" class="profile-form" novalidate>
                    <div class="form-group">
                        <label for="profileFirstName">Voornaam</label>
                        <div class="input-wrapper">
                            <input type="text" id="profileFirstName" name="firstName"
                                   autocomplete="given-name" maxlength="50" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profileLastName">Achternaam</label>
                        <div class="input-wrapper">
                            <input type="text" id="profileLastName" name="lastName"
                                   autocomplete="family-name" maxlength="50" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="profileCompany">Bedrijf (optioneel)</label>
                        <div class="input-wrapper">
                            <input type="text" id="profileCompany" name="company"
                                   autocomplete="organization" maxlength="100">
                        </div>
                    </div>

                    <div class="profile-actions">
                        <button type="button" class="btn btn-secondary profile-cancel">Annuleren</button>
                        <button type="submit" class="btn btn-primary profile-save">
                            <span class="btn-text">Opslaan</span>
                            <span class="btn-spinner" style="display: none;" aria-hidden="true">⏳</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.modal);

        this.form = this.modal.querySelector('#profileForm');
        this.firstNameInput = this.modal.querySelector('#profileFirstName');
        this.lastNameInput = this.modal.querySelector('#profileLastName');
        this.companyInput = this.modal.querySelector('#profileCompany');
        this.errorEl = this.modal.querySelector('.profile-error');
        this.successEl = this.modal.querySelector('.profile-success');
        this.saveBtn = this.modal.querySelector('.profile-save');
    }

    attachEventListeners() {
        this.backdrop.addEventListener('click', () => this.hide());
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hide());
        this.modal.querySelector('.profile-cancel').addEventListener('click', () => this.hide());

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        [this.firstNameInput, this.lastNameInput, this.companyInput].forEach((input) => {
            input.addEventListener('input', () => {
                this.clearFieldError(input);
                this.hideFeedback();
            });
        });
    }

    populateForm(user) {
        this.user = user || {};
        const profile = this.user.profile || {};

        this.modal.querySelector('[data-field="email"]').textContent = this.user.email || '';
        const licenseType = (this.user.license && this.user.license.type) || 'free';
        this.modal.querySelector('[data-field="license"]').textContent = licenseType;

        this.firstNameInput.value = profile.firstName || '';
        this.lastNameInput.value = profile.lastName || '';
        this.companyInput.value = profile.company || '';

        this.clearAllFieldErrors();
        this.hideFeedback();
    }

    validate() {
        this.clearAllFieldErrors();

        const firstName = this.firstNameInput.value.trim();
        const lastName = this.lastNameInput.value.trim();
        let ok = true;

        if (!firstName) {
            this.showFieldError(this.firstNameInput, 'Voornaam is verplicht');
            ok = false;
        }
        if (!lastName) {
            this.showFieldError(this.lastNameInput, 'Achternaam is verplicht');
            ok = false;
        }
        return ok;
    }

    async handleSubmit() {
        if (!this.validate()) {
            return;
        }

        const updates = {
            firstName: this.firstNameInput.value.trim(),
            lastName: this.lastNameInput.value.trim(),
            company: this.companyInput.value.trim()
        };

        this.hideFeedback();
        this.setLoading(true);

        try {
            const result = await this.authService.updateProfile(updates);
            this.setLoading(false);

            if (result && result.success) {
                this.showSuccess('Profiel bijgewerkt');
                if (typeof this.onUpdateCallback === 'function') {
                    this.onUpdateCallback(result.user);
                }
                this.user = result.user;
                setTimeout(() => {
                    if (this.isVisible) {
                        this.hide();
                    }
                }, 900);
            } else {
                const msg = (result && result.error) || 'Bijwerken mislukt. Probeer het opnieuw.';
                this.showError(msg);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.setLoading(false);
            this.showError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        }
    }

    setLoading(loading) {
        const btnText = this.saveBtn.querySelector('.btn-text');
        const btnSpinner = this.saveBtn.querySelector('.btn-spinner');
        this.saveBtn.disabled = loading;
        if (btnText) btnText.style.display = loading ? 'none' : 'inline';
        if (btnSpinner) btnSpinner.style.display = loading ? 'inline' : 'none';
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

    clearAllFieldErrors() {
        this.modal.querySelectorAll('input').forEach((input) => this.clearFieldError(input));
    }

    showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.style.display = 'block';
        this.successEl.style.display = 'none';
    }

    showSuccess(message) {
        this.successEl.textContent = message;
        this.successEl.style.display = 'block';
        this.errorEl.style.display = 'none';
    }

    hideFeedback() {
        this.errorEl.style.display = 'none';
        this.successEl.style.display = 'none';
    }

    show(user) {
        this.populateForm(user);
        this.isVisible = true;
        this.backdrop.classList.add('active');
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.keydownHandler);

        setTimeout(() => {
            this.firstNameInput.focus();
        }, 200);
    }

    hide() {
        this.isVisible = false;
        this.backdrop.classList.remove('active');
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.keydownHandler);
        this.clearAllFieldErrors();
        this.hideFeedback();
        this.setLoading(false);
    }

    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }
}
