// mongoose is a CommonJS package. With "type": "module" in package.json,
// named ESM imports of its runtime exports fail under plain Node (tsx, seed
// scripts) even though bundlers paper over it — so take the default export
// and destructure. Types are erased at compile time and import normally.
import mongoose, { type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;

/**
 * Append-only record of every privileged action.
 *
 * Required for any dispute about who changed a price, approved a refund or
 * granted a role. Writes here are never conditional on the action
 * succeeding — a failed attempt is itself worth recording.
 */

export interface IAdminAuditLog {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  /** Field-level before/after. Secrets are stored as '[REDACTED]'. */
  changes?: { field: string; before: unknown; after: unknown }[];
  outcome: 'success' | 'denied' | 'error';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAdminAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorEmail: { type: String, required: true },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    resourceType: { type: String, required: true, trim: true, maxlength: 60 },
    resourceId: { type: String, trim: true },
    changes: {
      type: [
        {
          field: { type: String, required: true },
          before: Schema.Types.Mixed,
          after: Schema.Types.Mixed,
        },
      ],
      default: undefined,
      _id: false,
    },
    outcome: { type: String, enum: ['success', 'denied', 'error'], required: true },
    reason: { type: String, maxlength: 500 },
    ipAddress: String,
    userAgent: { type: String, maxlength: 400 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ outcome: 1, createdAt: -1 });

auditLogSchema.pre('save', function blockMutation(next) {
  if (!this.isNew) {
    return next(new Error('Audit log entries are immutable'));
  }
  next();
});

export const AdminAuditLog: Model<IAdminAuditLog> =
  (models.AdminAuditLog as Model<IAdminAuditLog>) ??
  model<IAdminAuditLog>('AdminAuditLog', auditLogSchema);
