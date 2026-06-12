import mongoose from 'mongoose';

// TODO: Define full User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  googleId: { type: String, required: true, unique: true },
  avatar: { type: String },
});

export const User = mongoose.model('User', userSchema);
