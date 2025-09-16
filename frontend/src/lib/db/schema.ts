import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  boolean,
  jsonb,
  numeric
} from "drizzle-orm/pg-core";

// Enums
export const contactMethodEnum = pgEnum("contact_method", ["email", "phone", "both"]);
export const secretStatusEnum = pgEnum("secret_status", ["active", "paused", "triggered"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "basic", "premium", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "inactive", "cancelled", "trial", "past_due"]);
export const reminderStatusEnum = pgEnum("reminder_status", ["pending", "sent", "failed", "cancelled"]);
export const reminderTypeEnum = pgEnum("reminder_type", ["25_percent", "50_percent", "7_days", "3_days", "24_hours", "12_hours", "1_hour"]);

// Tables
export const secrets = pgTable("secrets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  contactMethod: contactMethodEnum("contact_method").notNull(),
  checkInDays: integer("check_in_days").notNull().default(30),
  status: secretStatusEnum("status").notNull().default("active"),
  serverShare: text("server_share"),
  iv: text("iv"),
  authTag: text("auth_tag"),
  sssSharesTotal: integer("sss_shares_total").notNull().default(3),
  sssThreshold: integer("sss_threshold").notNull().default(2),
  isTriggered: boolean("is_triggered").default(false),
  lastCheckIn: timestamp("last_check_in"),
  nextCheckIn: timestamp("next_check_in"),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminNotifications = pgTable("admin_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  metadata: jsonb("metadata"),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkInTokens = pgTable("check_in_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  secretId: uuid("secret_id").notNull().references(() => secrets.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkinHistory = pgTable("checkin_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  secretId: uuid("secret_id").notNull().references(() => secrets.id),
  userId: text("user_id").notNull(),
  checkedInAt: timestamp("checked_in_at").notNull(),
  nextCheckIn: timestamp("next_check_in").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cronConfig = pgTable("cron_config", {
  id: integer("id").primaryKey(),
  projectUrl: text("project_url").notNull().default(""),
  serviceRoleKey: text("service_role_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipientEmail: text("recipient_email").notNull(),
  secretId: uuid("secret_id").notNull().references(() => secrets.id),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reminderJobs = pgTable("reminder_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  secretId: uuid("secret_id").notNull().references(() => secrets.id),
  reminderType: reminderTypeEnum("reminder_type").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: reminderStatusEnum("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  failedAt: timestamp("failed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionTiers = pgTable("subscription_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: subscriptionTierEnum("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  maxSecrets: integer("max_secrets").notNull(),
  maxRecipientsPerSecret: integer("max_recipients_per_secret").notNull(),
  customIntervals: boolean("custom_intervals").default(false),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userContactMethods = pgTable("user_contact_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredMethod: contactMethodEnum("preferred_method").default("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  tierId: uuid("tier_id").notNull().references(() => subscriptionTiers.id),
  provider: text("provider"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  status: subscriptionStatusEnum("status").notNull().default("inactive"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Export types for use in application
export type Secret = typeof secrets.$inferSelect;
export type SecretInsert = typeof secrets.$inferInsert;
export type SecretUpdate = Partial<SecretInsert>;

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type CheckInToken = typeof checkInTokens.$inferSelect;
export type CheckinHistory = typeof checkinHistory.$inferSelect;
export type UserContactMethod = typeof userContactMethods.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;