import mongoose from 'mongoose';

// Personal API keys that let AI agents call the MCP endpoint as a user.
// Only the SHA-256 hash is stored; the raw key is shown once on creation.
const apiKeySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  // First characters of the key, so users can tell keys apart.
  prefix: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date },
});

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
