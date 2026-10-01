import mongoose, { type Connection } from 'mongoose';

let connectionPromise: Promise<Connection> | undefined;

export async function connectDb(): Promise<Connection> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Configure it in your environment.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
    }).then(() => mongoose.connection).catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  return connectionPromise;
}