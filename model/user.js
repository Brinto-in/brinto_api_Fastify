import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

const modelName = 'users';

const usersSchema = new Schema({
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

usersSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

usersSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();

  if (!update) {
    return;
  }

  const password = update.$set?.password ?? update.password;
  if (typeof password === 'string') {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (update.$set?.password !== undefined) {
      update.$set.password = hashedPassword;
    } else {
      update.password = hashedPassword;
    }

    this.setUpdate(update);
  }
});

usersSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const usersModel = mongoose.models[modelName]
  || mongoose.model(modelName, usersSchema);

export default usersModel;