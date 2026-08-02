import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'node:dns'

dotenv.config()

try {
  dns.setDefaultResultOrder('ipv4first')
  dns.setServers(['8.8.8.8', '1.1.1.1'])
} catch {
  // Ignore error if unsupported
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argtree'

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('MongoDB connected successfully')
    return true
  } catch (error) {
    console.warn(`MongoDB connection unavailable (${error.message}). Running with in-memory storage.`)
    return false
  }
}
