import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  expiresAt: Date;
  createdAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Automatically expire and purge revoked token entries once the underlying JWT expires
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken: Model<IRevokedToken> =
  (mongoose.models.RevokedToken as Model<IRevokedToken>) ||
  mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);

export default RevokedToken;
