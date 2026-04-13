import { Config } from '../config/config.js';

export class AuthService {
    constructor() {
        this.TOKEN_KEY = 'roi_calculator_auth_token';
        this.USER_KEY = 'roi_calculator_user';
        this.baseURL = Config.api.baseURL + '/auth';
        this.currentUser = null;
        this.token = null;
        
        this.loadStoredAuth();
    }
    
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            if (data.data.token) {
                this.token = data.data.token;
                try {
                    sessionStorage.setItem(this.TOKEN_KEY, this.token);
                } catch (e) {
                    // sessionStorage unavailable; token held in memory only
                }
            }

            this.currentUser = data.data.user;
            try {
                const safeUser = {
                    _id: this.currentUser._id,
                    email: this.currentUser.email,
                    profile: {
                        firstName: this.currentUser.profile?.firstName,
                        lastName: this.currentUser.profile?.lastName
                    },
                    license: this.currentUser.license
                };
                sessionStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
            } catch (e) {
                // sessionStorage unavailable
            }
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            if (data.data.token) {
                this.token = data.data.token;
                try {
                    sessionStorage.setItem(this.TOKEN_KEY, this.token);
                } catch (e) {
                    // sessionStorage unavailable
                }
            }

            this.currentUser = data.data.user;
            try {
                const safeUser = {
                    _id: this.currentUser._id,
                    email: this.currentUser.email,
                    profile: {
                        firstName: this.currentUser.profile?.firstName,
                        lastName: this.currentUser.profile?.lastName
                    },
                    license: this.currentUser.license
                };
                sessionStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
            } catch (e) {
                // sessionStorage unavailable
            }
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseURL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    },
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }
    
    async verifyToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.baseURL}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.data.user;
                try {
                    const safeUser = {
                        _id: this.currentUser._id,
                        email: this.currentUser.email,
                        profile: {
                            firstName: this.currentUser.profile?.firstName,
                            lastName: this.currentUser.profile?.lastName
                        },
                        license: this.currentUser.license
                    };
                    sessionStorage.setItem(this.USER_KEY, JSON.stringify(safeUser));
                } catch (e) {
                    // sessionStorage unavailable
                }
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.clearAuth();
            return false;
        }
    }
    
    loadStoredAuth() {
        try {
            this.token = sessionStorage.getItem(this.TOKEN_KEY);
        } catch (e) {
            this.token = null;
        }

        try {
            const storedUser = sessionStorage.getItem(this.USER_KEY);
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        } catch (error) {
            console.error('Error parsing stored user:', error);
            this.clearAuth();
        }

        this._migrateLegacyStorage();
    }
    
    _migrateLegacyStorage() {
        try {
            if (localStorage.getItem(this.TOKEN_KEY)) {
                localStorage.removeItem(this.TOKEN_KEY);
            }
            if (localStorage.getItem(this.USER_KEY)) {
                localStorage.removeItem(this.USER_KEY);
            }
        } catch (e) {
            // ignore
        }
    }
    
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        try {
            sessionStorage.removeItem(this.TOKEN_KEY);
            sessionStorage.removeItem(this.USER_KEY);
        } catch (e) {
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
