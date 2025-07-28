import mongoose from 'mongoose';
import Database from '../config/database.js';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  
  stripeCustomerId: {
    type: String,
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    required: true,
    default: 'eur',
    uppercase: true
  },
  
  status: {
    type: String,
    enum: [
      'pending',
      'processing', 
      'succeeded',
      'failed',
      'canceled',
      'refunded'
    ],
    default: 'pending'
  },
  
  paymentMethod: {
    type: String,
    enum: ['card', 'sepa_debit', 'ideal', 'paypal'],
    default: 'card'
  },
  
  licenseType: {
    type: String,
    enum: ['subscription', 'lifetime'],
    required: true
  },
  
  subscriptionPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: function() {
      return this.licenseType === 'subscription';
    }
  },
  
  metadata: {
    productName: String,
    campaignId: String,
    referralSource: String,
    discountCode: String,
    originalAmount: Number
  },
  
  billing: {
    name: String,
    email: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    }
  },
  
  refund: {
    amount: {
      type: Number,
      default: 0
    },
    reason: String,
    refundedAt: Date,
    stripeRefundId: String
  },
  
  invoice: {
    number: String,
    url: String,
    downloadUrl: String
  },
  
  processedAt: Date,
  failureReason: String,
  
  webhookEvents: [{
    eventId: String,
    eventType: String,
    processedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ stripeCustomerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.invoice.number) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.invoice.number = `ROI-${year}${month}-${random}`;
  }
  next();
});

paymentSchema.statics.getStats = async function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        status: 'succeeded',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        subscriptions: {
          $sum: {
            $cond: [{ $eq: ['$licenseType', 'subscription'] }, 1, 0]
          }
        },
        lifetimeLicenses: {
          $sum: {
            $cond: [{ $eq: ['$licenseType', 'lifetime'] }, 1, 0]
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRevenue: 0,
    totalPayments: 0,
    averageAmount: 0,
    subscriptions: 0,
    lifetimeLicenses: 0
  };
};

paymentSchema.methods.processRefund = function(amount, reason) {
  this.refund.amount = amount;
  this.refund.reason = reason;
  this.refund.refundedAt = new Date();
  this.status = 'refunded';
  return this.save();
};

class InMemoryPayment {
  constructor(data) {
    const db = Database.getInMemoryData();
    this._id = `payment_${++db.counters.payments}`;
    this.userId = data.userId;
    this.stripePaymentIntentId = data.stripePaymentIntentId;
    this.stripeCustomerId = data.stripeCustomerId;
    this.amount = data.amount;
    this.currency = data.currency || 'EUR';
    this.status = data.status || 'pending';
    this.paymentMethod = data.paymentMethod || 'card';
    this.licenseType = data.licenseType;
    this.subscriptionPeriod = data.subscriptionPeriod;
    this.metadata = data.metadata || {};
    this.billing = data.billing || {};
    this.refund = data.refund || { amount: 0 };
    this.invoice = data.invoice || {};
    this.processedAt = data.processedAt;
    this.failureReason = data.failureReason;
    this.webhookEvents = data.webhookEvents || [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    if (!this.invoice.number) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      this.invoice.number = `ROI-${year}${month}-${random}`;
    }
  }

  async save() {
    const db = Database.getInMemoryData();
    this.updatedAt = new Date();
    db.payments.set(this._id, { ...this });
    return this;
  }

  async processRefund(amount, reason) {
    this.refund.amount = amount;
    this.refund.reason = reason;
    this.refund.refundedAt = new Date();
    this.status = 'refunded';
    return this.save();
  }

  static async find(query = {}) {
    const db = Database.getInMemoryData();
    const results = [];
    
    for (const [id, paymentData] of db.payments) {
      let matches = true;
      
      for (const [key, value] of Object.entries(query)) {
        if (paymentData[key] !== value) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        const payment = new InMemoryPayment(paymentData);
        payment._id = id;
        results.push(payment);
      }
    }
    
    return results;
  }

  static async findById(id) {
    const db = Database.getInMemoryData();
    const paymentData = db.payments.get(id);
    if (!paymentData) return null;
    
    const payment = new InMemoryPayment(paymentData);
    payment._id = id;
    return payment;
  }

  static async getStats(startDate, endDate) {
    const db = Database.getInMemoryData();
    let totalRevenue = 0;
    let totalPayments = 0;
    let subscriptions = 0;
    let lifetimeLicenses = 0;
    
    for (const [id, paymentData] of db.payments) {
      if (paymentData.status === 'succeeded' && 
          paymentData.createdAt >= startDate && 
          paymentData.createdAt <= endDate) {
        totalRevenue += paymentData.amount;
        totalPayments++;
        
        if (paymentData.licenseType === 'subscription') subscriptions++;
        if (paymentData.licenseType === 'lifetime') lifetimeLicenses++;
      }
    }
    
    return {
      totalRevenue,
      totalPayments,
      averageAmount: totalPayments > 0 ? totalRevenue / totalPayments : 0,
      subscriptions,
      lifetimeLicenses
    };
  }

  sort(sortObj) {
    return this;
  }

  select(fields) {
    return this;
  }

  limit(num) {
    return this;
  }
}

const Payment = process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI 
  ? InMemoryPayment 
  : mongoose.model('Payment', paymentSchema);

export default Payment;
