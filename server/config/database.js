import mongoose from 'mongoose';

class Database {
  constructor() {
    this.connection = null;
    this.inMemoryData = {
      users: new Map(),
      payments: new Map(),
      counters: { users: 0, payments: 0 }
    };
  }

  async connect() {
    try {
      if (process.env.NODE_ENV === 'development' || !process.env.MONGODB_URI) {
        console.log('🧠 Using in-memory database for development');
        console.log('⚠️  Data will be lost when server restarts');
        
        this.connection = {
          connection: { host: 'in-memory' }
        };
        
        return this.connection;
      }

      const mongoUri = process.env.MONGODB_URI;
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      };

      this.connection = await mongoose.connect(mongoUri, options);
      
      console.log(`✅ MongoDB connected: ${this.connection.connection.host}`);
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧠 Falling back to in-memory database');
        this.connection = { connection: { host: 'in-memory-fallback' } };
        return this.connection;
      }
      
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      if (this.connection?.connection?.host?.includes('in-memory')) {
        console.log('✅ In-memory database cleared');
        this.inMemoryData = {
          users: new Map(),
          payments: new Map(),
          counters: { users: 0, payments: 0 }
        };
      } else {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    if (this.connection?.connection?.host?.includes('in-memory')) {
      return true;
    }
    return mongoose.connection.readyState === 1;
  }

  getInMemoryData() {
    return this.inMemoryData;
  }

  clearInMemoryData() {
    this.inMemoryData = {
      users: new Map(),
      payments: new Map(),
      counters: { users: 0, payments: 0 }
    };
  }

  getInMemoryData() {
    return this.inMemoryData;
  }

  clearInMemoryData() {
    this.inMemoryData = {
      users: new Map(),
      payments: new Map(),
      counters: { users: 0, payments: 0 }
    };
  }
}

export default new Database();
