import { 
  complaints, 
  adminNotes, 
  adminSessions, 
  barangays,
  users,
  userSessions,
  adminUsers,
  forumPosts,
  forumReplies,
  type Complaint, 
  type InsertComplaint, 
  type AdminNote, 
  type InsertAdminNote, 
  type AdminSession,
  type Barangay,
  type InsertBarangay,
  type User,
  type InsertUser,
  type UserSession,
  type AdminUser,
  type InsertAdminUser,
  type ForumPost,
  type InsertForumPost,
  type ForumReply,
  type InsertForumReply
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Complaint operations
  createComplaint(complaint: InsertComplaint, userId?: number): Promise<Complaint>;
  getComplaintById(id: string): Promise<Complaint | undefined>;
  getComplaintByComplaintId(complaintId: string): Promise<Complaint | undefined>;
  getAllComplaints(barangayId?: number): Promise<Complaint[]>;
  updateComplaintStatus(complaintId: string, status: string): Promise<Complaint | undefined>;
  
  // Admin note operations
  addAdminNote(note: InsertAdminNote): Promise<AdminNote>;
  getAdminNotesByComplaintId(complaintId: string): Promise<AdminNote[]>;
  
  // Barangay operations
  getAllBarangays(): Promise<Barangay[]>;
  getBarangayById(id: number): Promise<Barangay | undefined>;
  createBarangay(barangay: InsertBarangay): Promise<Barangay>;
  
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUsersByBarangay(barangayId: number): Promise<User[]>;
  
  // User session operations
  createUserSession(userId: number, sessionToken: string, expiresAt: Date): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionToken: string): Promise<void>;
  
  // Admin user operations
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUserById(id: number): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  
  // Admin session operations
  createAdminSession(adminId: number, sessionToken: string, expiresAt: Date): Promise<AdminSession>;
  getAdminSession(sessionToken: string): Promise<AdminSession | undefined>;
  deleteAdminSession(sessionToken: string): Promise<void>;
  
  // Forum operations
  createForumPost(post: InsertForumPost, authorId: number, barangayId: number): Promise<ForumPost>;
  getForumPostsByBarangay(barangayId: number): Promise<ForumPost[]>;
  getForumPostById(id: number): Promise<ForumPost | undefined>;
  createForumReply(reply: InsertForumReply, authorId: number, postId: number): Promise<ForumReply>;
  getRepliesByPost(postId: number): Promise<ForumReply[]>;
  
  // Statistics
  getComplaintStats(barangayId?: number): Promise<{
    total: number;
    resolved: number;
    pending: number;
    thisMonth: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async createComplaint(insertComplaint: InsertComplaint, userId?: number): Promise<Complaint> {
    const complaintId = `BC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    const [complaint] = await db
      .insert(complaints)
      .values({
        ...insertComplaint,
        complaintId,
      })
      .returning();
    return complaint;
  }

  async getComplaintById(id: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.id, parseInt(id)));
    return complaint || undefined;
  }

  async getComplaintByComplaintId(complaintId: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .select()
      .from(complaints)
      .where(eq(complaints.complaintId, complaintId));
    return complaint || undefined;
  }

  async getAllComplaints(barangayId?: number): Promise<Complaint[]> {
    return await db.select().from(complaints);
  }

  async updateComplaintStatus(complaintId: string, status: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set({ status, updatedAt: new Date() })
      .where(eq(complaints.complaintId, complaintId))
      .returning();
    return complaint || undefined;
  }

  async addAdminNote(insertNote: InsertAdminNote): Promise<AdminNote> {
    const [note] = await db
      .insert(adminNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async getAdminNotesByComplaintId(complaintId: string): Promise<AdminNote[]> {
    return await db
      .select()
      .from(adminNotes)
      .where(eq(adminNotes.complaintId, complaintId));
  }

  async getAllBarangays(): Promise<Barangay[]> {
    return await db.select().from(barangays).where(eq(barangays.isActive, true));
  }

  async getBarangayById(id: number): Promise<Barangay | undefined> {
    const [barangay] = await db
      .select()
      .from(barangays)
      .where(and(eq(barangays.id, id), eq(barangays.isActive, true)));
    return barangay || undefined;
  }

  async createBarangay(insertBarangay: InsertBarangay): Promise<Barangay> {
    const [barangay] = await db
      .insert(barangays)
      .values(insertBarangay)
      .returning();
    return barangay;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.isActive, true)));
    return user || undefined;
  }

  async getUsersByBarangay(barangayId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.barangayId, barangayId), eq(users.isActive, true)));
  }

  async createUserSession(userId: number, sessionToken: string, expiresAt: Date): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values({ userId, sessionToken, expiresAt })
      .returning();
    return session;
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
    return session || undefined;
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    await db
      .delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async createAdminUser(insertAdminUser: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(insertAdminUser.password, 10);
    const [adminUser] = await db
      .insert(adminUsers)
      .values({
        ...insertAdminUser,
        password: hashedPassword,
      })
      .returning();
    return adminUser;
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.email, email), eq(adminUsers.isActive, true)));
    return adminUser || undefined;
  }

  async getAdminUserById(id: number): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.id, id), eq(adminUsers.isActive, true)));
    return adminUser || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
  }

  async createAdminSession(adminId: number, sessionToken: string, expiresAt: Date): Promise<AdminSession> {
    const [session] = await db
      .insert(adminSessions)
      .values({ adminId, sessionToken, expiresAt })
      .returning();
    return session;
  }

  async getAdminSession(sessionToken: string): Promise<AdminSession | undefined> {
    const [session] = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken));
    return session || undefined;
  }

  async deleteAdminSession(sessionToken: string): Promise<void> {
    await db
      .delete(adminSessions)
      .where(eq(adminSessions.sessionToken, sessionToken));
  }

  async createForumPost(insertPost: InsertForumPost, authorId: number, barangayId: number): Promise<ForumPost> {
    const [post] = await db
      .insert(forumPosts)
      .values({
        ...insertPost,
        authorId,
        barangayId,
      })
      .returning();
    return post;
  }

  async getForumPostsByBarangay(barangayId: number): Promise<ForumPost[]> {
    return await db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        authorId: forumPosts.authorId,
        barangayId: forumPosts.barangayId,
        isActive: forumPosts.isActive,
        isAnnouncement: forumPosts.isAnnouncement,
        isPinned: forumPosts.isPinned,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(and(eq(forumPosts.barangayId, barangayId), eq(forumPosts.isActive, true)))
      .orderBy(forumPosts.createdAt);
  }

  async getForumPostById(id: number): Promise<ForumPost | undefined> {
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(and(eq(forumPosts.id, id), eq(forumPosts.isActive, true)));
    return post || undefined;
  }

  async createForumReply(insertReply: InsertForumReply, authorId: number, postId: number): Promise<ForumReply> {
    const [reply] = await db
      .insert(forumReplies)
      .values({
        ...insertReply,
        authorId,
        postId,
      })
      .returning();
    return reply;
  }

  async getRepliesByPost(postId: number): Promise<ForumReply[]> {
    return await db
      .select({
        id: forumReplies.id,
        content: forumReplies.content,
        authorId: forumReplies.authorId,
        postId: forumReplies.postId,
        isActive: forumReplies.isActive,
        createdAt: forumReplies.createdAt,
        updatedAt: forumReplies.updatedAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.authorId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(forumReplies.createdAt);
  }

  async getComplaintStats(barangayId?: number): Promise<{
    total: number;
    resolved: number;
    pending: number;
    thisMonth: number;
  }> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const allComplaints = await db.select().from(complaints);
    
    const total = allComplaints.length;
    const resolved = allComplaints.filter(c => c.status === "Resolved").length;
    const pending = allComplaints.filter(c => c.status === "Under Review" || c.status === "Submitted").length;
    const thisMonth = allComplaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      return createdDate.getMonth() + 1 === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    return {
      total,
      resolved,
      pending,
      thisMonth,
    };
  }
}

export const storage = new DatabaseStorage();