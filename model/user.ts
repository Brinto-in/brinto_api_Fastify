import bcrypt from 'bcryptjs';
import mongoose, { Schema, type Model } from 'mongoose';

const modelName = 'users';

export type LoginPlatform = 'web' | 'ios' | 'android' | 'other';
export type UserRole = 'USER' | 'ADMIN' | 'STORE_OWNER';
export type UserStatus = 1 | 2 | 3;

export interface IUser {
  name?: string;
  phone: string;
  email: string;
  password: string;
  dob?: Date;
  role: UserRole[];
  user_id: string;
  user_name: string;
  status: UserStatus;
  login_platform?: LoginPlatform;
}

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UsersModel = Model<IUser, Record<string, never>, UserMethods>;

const usersSchema = new Schema<IUser, UsersModel, UserMethods>({
  name: { type: String },
  user_name: { type: String, unique: true, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: '' },
  password: { type: String, required: true },
  dob: { type: Date },
  role: {
    type: [String],
    enum: ['USER', 'ADMIN', 'STORE_OWNER'],
    default: ['USER'],
    required: true,
  },
  user_id: { type: String, required: true, unique: true },
  login_platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'other'],
    default: 'web',
  },
  status: {
    type: Number,
    enum: [1, 2, 3],
    default: 1,
    required: true,
  },
}, {
  timestamps: true,
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

usersSchema.index({ createdAt: -1, _id: -1 });

usersSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

usersSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();

  if (!update || Array.isArray(update)) {
    return;
  }

  const updateFields = update as Record<string, unknown>;
  const setFields = updateFields.$set as Record<string, unknown> | undefined;
  const password = setFields?.password ?? updateFields.password;

  if (typeof password === 'string') {
    if (setFields) {
      setFields.password = await bcrypt.hash(password, 10);
    } else {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    this.setUpdate(update);
  }
});

usersSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const usersModel = (mongoose.models[modelName] as UsersModel | undefined)
  ?? mongoose.model<IUser, UsersModel>(modelName, usersSchema);

export default usersModel;