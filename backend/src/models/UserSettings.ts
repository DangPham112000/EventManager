import mongoose from 'mongoose';

// Event Manager's own per-user settings. Identity (email, name, avatar) is not
// stored here: it lives in the shared core.users (see coreUsers.ts).
const userSettingsSchema = new mongoose.Schema({
  // Clerk user id ("user_...").
  clerkId: { type: String, required: true, unique: true },
  // Read-only link to the user's calendar (see calendarShare.ts).
  calendarShare: {
    enabled: { type: Boolean, default: false },
    mode: { type: String, enum: ['PRIVATE', 'PUBLIC'], default: 'PRIVATE' },
    token: { type: String },
  },
});

userSettingsSchema.index({ 'calendarShare.token': 1 }, { unique: true, sparse: true });

export const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
