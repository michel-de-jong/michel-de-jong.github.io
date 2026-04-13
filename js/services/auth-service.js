export class AuthService {
    constructor() {
        this.USERS_KEY = 'roi_calculator_users';
        this.SESSION_KEY = 'roi_calculator_session';
        this.currentUser = null;
        this.token = null;

        this.loadStoredAuth();
    }

    async _hashPassword(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(salt + password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    _generateId() {
        return crypto.randomUUID
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                  const r = (Math.random() * 16) | 0;
                  return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
              });
    }

    _generateSalt() {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    _generateToken() {
        const arr = new Uint8Array(32);
        crypto.getRandomValues(arr);
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    _getUsers() {
        try {
            const raw = localStorage.getItem(this.USERS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    _saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    _saveSession(user, token) {
        const session = { user, token, ts: Date.now() };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    async login(email, password) {
        try {
            const users = this._getUsers();
            const record = users.find(u => u.email === email.toLowerCase());
            if (!record) {
                return { success: false, error: 'Ongeldig e-mailadres of wachtwoord' };
            }

            const hash = await this._hashPassword(password, record.salt);
            if (hash !== record.passwordHash) {
                return { success: false, error: 'Ongeldig e-mailadres of wachtwoord' };
            }

            record.lastLogin = new Date().toISOString();
            this._saveUsers(users);

            const token = this._generateToken();
            const user = this._publicUser(record);
            this.currentUser = user;
            this.token = token;
            this._saveSession(user, token);

            return { success: true, user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Er is een fout opgetreden bij het inloggen' };
        }
    }

    async register(userData) {
        try {
            const users = this._getUsers();
            const emailLower = userData.email.toLowerCase();

            if (users.some(u => u.email === emailLower)) {
                return { success: false, error: 'Er bestaat al een account met dit e-mailadres' };
            }

            const salt = this._generateSalt();
            const passwordHash = await this._hashPassword(userData.password, salt);

            const record = {
                _id: this._generateId(),
                email: emailLower,
                salt,
                passwordHash,
                profile: {
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    company: userData.company || ''
                },
                license: { type: 'free' },
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };

            users.push(record);
            this._saveUsers(users);

            const token = this._generateToken();
            const user = this._publicUser(record);
            this.currentUser = user;
            this.token = token;
            this._saveSession(user, token);

            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Er is een fout opgetreden bij het registreren' };
        }
    }

    async logout() {
        this.clearAuth();
    }

    async verifyToken() {
        return this.isAuthenticated();
    }

    _publicUser(record) {
        return {
            _id: record._id,
            email: record.email,
            profile: { ...record.profile },
            license: { ...record.license }
        };
    }

    loadStoredAuth() {
        try {
            const raw = localStorage.getItem(this.SESSION_KEY);
            if (!raw) return;
            const session = JSON.parse(raw);
            if (session && session.user && session.token) {
                this.currentUser = session.user;
                this.token = session.token;
            }
        } catch {
            this.clearAuth();
        }
    }

    clearAuth() {
        this.token = null;
        this.currentUser = null;
        try {
            localStorage.removeItem(this.SESSION_KEY);
        } catch {
            // ignore
        }
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }
}
