import { pgTable, text, serial, integer, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintId: text("complaint_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  priority: text("priority").notNull().default("Low"),
  status: text("status").notNull().default("Submitted"),
  photoFilename: text("photo_filename"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminNotes = pgTable("admin_notes", {
  id: serial("id").primaryKey(),
  complaintId: text("complaint_id").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Barangays table
export const barangays = pgTable("barangays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  municipality: text("municipality").notNull(),
  province: text("province").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (residents)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  address: text("address").notNull(),
  barangayId: integer("barangay_id").notNull().references(() => barangays.id),
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User sessions table
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Admin users table (barangay admins and super admin)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(), // 'super_admin' or 'barangay_admin'
  barangayId: integer("barangay_id").references(() => barangays.id), // null for super admin
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Forum posts table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  barangayId: integer("barangay_id").notNull().references(() => barangays.id),
  isAnnouncement: boolean("is_announcement").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Forum replies table
export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const barangaysRelations = relations(barangays, ({ many }) => ({
  users: many(users),
  adminUsers: many(adminUsers),
  forumPosts: many(forumPosts),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  barangay: one(barangays, {
    fields: [users.barangayId],
    references: [barangays.id],
  }),
  sessions: many(userSessions),
  forumPosts: many(forumPosts),
  forumReplies: many(forumReplies),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  barangay: one(barangays, {
    fields: [adminUsers.barangayId],
    references: [barangays.id],
  }),
  sessions: many(adminSessions),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
  barangay: one(barangays, {
    fields: [forumPosts.barangayId],
    references: [barangays.id],
  }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  author: one(users, {
    fields: [forumReplies.authorId],
    references: [users.id],
  }),
  post: one(forumPosts, {
    fields: [forumReplies.postId],
    references: [forumPosts.id],
  }),
}));

// Insert schemas
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  complaintId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  contactNumber: z.string().min(11, "Contact number must be at least 11 digits"),
  email: z.string().email().optional().or(z.literal("")),
  description: z.string().min(20, "Description must be at least 20 characters").max(500, "Description cannot exceed 500 characters"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  category: z.enum(["noise", "garbage", "lighting", "road", "water", "peace", "business", "other"]),
  priority: z.enum(["Low", "Medium", "High"]).default("Low"),
});

export const insertAdminNoteSchema = createInsertSchema(adminNotes).omit({
  id: true,
  createdAt: true,
}).extend({
  note: z.string().min(1, "Note cannot be empty"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  contactNumber: z.string().min(11, "Contact number must be at least 11 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

export const insertBarangaySchema = createInsertSchema(barangays).omit({
  id: true,
  isActive: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Barangay name must be at least 2 characters"),
  municipality: z.string().min(2, "Municipality must be at least 2 characters"),
  province: z.string().min(2, "Province must be at least 2 characters"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["super_admin", "barangay_admin"]),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  authorId: true,
  barangayId: true,
  isAnnouncement: true,
  isPinned: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title cannot exceed 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(2000, "Content cannot exceed 2000 characters"),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  authorId: true,
  postId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1, "Reply cannot be empty").max(1000, "Reply cannot exceed 1000 characters"),
});

// Types
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type AdminSession = typeof adminSessions.$inferSelect;
export type Barangay = typeof barangays.$inferSelect;
export type InsertBarangay = z.infer<typeof insertBarangaySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
