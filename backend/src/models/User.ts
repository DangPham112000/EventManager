import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  // Clerk user id ("user_..."); set on the user's first sign-in.
  clerkId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  // Read-only link to the user's calendar (see calendarShare.ts).
  calendarShare: {
    enabled: { type: Boolean, default: false },
    mode: { type: String, enum: ['PRIVATE', 'PUBLIC'], default: 'PRIVATE' },
    token: { type: String },
  },
});

userSchema.index({ 'calendarShare.token': 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
