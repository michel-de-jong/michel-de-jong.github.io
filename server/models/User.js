import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Database from '../config/database.js';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: function() {
      return !this.oauth.google.id; // Password required if not using OAuth
    },
    minlength: 8
  },
  
  oauth: {
    google: {
      id: String,
      email: String
    }
  },
  
  license: {
    type: {
      type: String,
      enum: ['free', 'subscription', 'lifetime'],
      default: 'free'
    },
    purchasedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    features: {
      type: [String],
      default: ['calculator'], // Free users get basic calculator
      enum: [
        'calculator',     // Free feature
        'scenarios',      // Premium features
        'monte-carlo',
        'waterfall', 
        'portfolio',
        'historical',
        'saved',
        'export'
      ]
    }
  },
  
  stripeCustomerId: {
    type: String,
    default: null
  },
  
  profile: {
    firstName: String,
    lastName: String,
    company: String,
    country: {
      type: String,
      default: 'NL'
    }
  },
  
  preferences: {
    currency: {
      type: String,
      default: 'EUR'
    },
    language: {
      type: String,
      default: 'nl'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  lastLogin: {
    type: Date,
    default: null
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });
userSchema.index({ 'license.type': 1 });
userSchema.index({ stripeCustomerId: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPremiumAccess = function() {
  if (this.license.type === 'lifetime') return true;
  if (this.license.type === 'subscription' && this.license.expiresAt > new Date()) return true;
  return false;
};

userSchema.methods.hasFeatureAccess = function(feature) {
  return this.license.features.includes(feature);
};

userSchema.methods.updateLicense = function(licenseType, expiresAt = null) {
  this.license.type = licenseType;
  this.license.purchasedAt = new Date();
  this.license.expiresAt = expiresAt;
  
  if (licenseType === 'free') {
    this.license.features = ['calculator'];
  } else {
    this.license.features = [
      'calculator',
      'scenarios', 
      'monte-carlo',
      'waterfall',
      'portfolio', 
      'historical',
      'saved',
      'export'
    ];
  }
  
  return this.save();
};

userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

class InMemoryUser {
  constructor(data) {
    const db = Database.getInMemoryData();
    this._id = `user_${++db.counters.users}`;
    this.email = data.email;
    this.password = data.password;
    this.oauth = data.oauth || { google: { id: null, email: null } };
    this.license = data.license || {
      type: 'free',
      purchasedAt: null,
      expiresAt: null,
      features: ['calculator']
    };
    this.stripeCustomerId = data.stripeCustomerId || null;
    this.profile = data.profile || {};
    this.preferences = data.preferences || {
      currency: 'EUR',
      language: 'nl',
      emailNotifications: true
    };
    this.lastLogin = data.lastLogin || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async save() {
    const db = Database.getInMemoryData();
    this.updatedAt = new Date();
    
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    
    db.users.set(this._id, { ...this });
    return this;
  }

  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  hasPremiumAccess() {
    if (this.license.type === 'lifetime') return true;
    if (this.license.type === 'subscription' && this.license.expiresAt > new Date()) return true;
    return false;
  }

  hasFeatureAccess(feature) {
    return this.license.features.includes(feature);
  }

  async updateLicense(licenseType, expiresAt = null) {
    this.license.type = licenseType;
    this.license.purchasedAt = new Date();
    this.license.expiresAt = expiresAt;
    
    if (licenseType === 'free') {
      this.license.features = ['calculator'];
    } else {
      this.license.features = [
        'calculator',
        'scenarios', 
        'monte-carlo',
        'waterfall',
        'portfolio', 
        'historical',
        'saved',
        'export'
      ];
    }
    
    return this.save();
  }

  get fullName() {
    return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
  }

  toJSON() {
    const user = { ...this };
    delete user.password;
    return user;
  }

  static async findOne(query) {
    const db = Database.getInMemoryData();
    for (const [id, userData] of db.users) {
      if (query.email && userData.email === query.email) {
        const user = new InMemoryUser(userData);
        user._id = id;
        const queryResult = Object.assign(user, {
          select: (fields) => queryResult,
          populate: (path) => queryResult
        });
        return queryResult;
      }
      if (query._id && id === query._id) {
        const user = new InMemoryUser(userData);
        user._id = id;
        const queryResult = Object.assign(user, {
          select: (fields) => queryResult,
          populate: (path) => queryResult
        });
        return queryResult;
      }
    }
    return null;
  }

  static async findById(id) {
    const db = Database.getInMemoryData();
    const userData = db.users.get(id);
    if (!userData) return null;
    
    const user = new InMemoryUser(userData);
    user._id = id;
    const queryResult = Object.assign(user, {
      select: (fields) => queryResult,
      populate: (path) => queryResult
    });
    return queryResult;
  }

  static async find(query = {}) {
    const db = Database.getInMemoryData();
    const results = [];
    
    for (const [id, userData] of db.users) {
      let matches = true;
      
      for (const [key, value] of Object.entries(query)) {
        if (userData[key] !== value) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        const user = new InMemoryUser(userData);
        user._id = id;
        results.push(user);
      }
    }
    
    return results;
  }

  select(fields) {
    return this;
  }
}

const User = process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI 
  ? InMemoryUser 
  : mongoose.model('User', userSchema);

export default User;
