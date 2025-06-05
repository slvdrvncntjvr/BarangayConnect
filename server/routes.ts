import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertComplaintSchema, insertAdminNoteSchema, insertUserSchema } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getUserSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: "Authentication failed" });
    }
  };

  // Get all barangays
  app.get("/api/barangays", async (req, res) => {
    try {
      const barangays = await storage.getAllBarangays();
      res.json(barangays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch barangays" });
    }
  });

  // User registration
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ message: "Account created successfully", userId: user.id });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const sessionToken = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await storage.createUserSession(user.id, sessionToken, expiresAt);

      const barangay = await storage.getBarangayById(user.barangayId);
      
      res.json({ 
        sessionToken, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          barangayId: user.barangayId,
          barangay
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User logout
  app.post("/api/auth/logout", authenticateUser, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        await storage.deleteUserSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get complaint statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getComplaintStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Create new complaint
  app.post("/api/complaints", upload.single("photo"), async (req, res) => {
    try {
      const validatedData = insertComplaintSchema.parse(req.body);
      
      let photoFilename = null;
      if (req.file) {
        const ext = path.extname(req.file.originalname);
        photoFilename = `${uuidv4()}${ext}`;
        const newPath = path.join(uploadsDir, photoFilename);
        fs.renameSync(req.file.path, newPath);
      }

      const complaint = await storage.createComplaint({
        ...validatedData,
        photoFilename,
      });

      res.status(201).json(complaint);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create complaint" });
      }
    }
  });

  // Get complaint by ID
  app.get("/api/complaints/:id", async (req, res) => {
    try {
      const complaint = await storage.getComplaintByComplaintId(req.params.id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      const notes = await storage.getAdminNotesByComplaintId(req.params.id);
      res.json({ ...complaint, notes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint" });
    }
  });

  // Get all complaints (admin only)
  app.get("/api/complaints", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const complaints = await storage.getAllComplaints();
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  // Update complaint status (admin only)
  app.put("/api/complaints/:id/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { status } = req.body;
      if (!["Submitted", "Under Review", "Resolved"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const complaint = await storage.updateComplaintStatus(req.params.id, status);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Failed to update complaint status" });
    }
  });

  // Add admin note (admin only)
  app.post("/api/complaints/:id/notes", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const validatedData = insertAdminNoteSchema.parse({
        complaintId: req.params.id,
        note: req.body.note,
      });

      const note = await storage.addAdminNote(validatedData);
      res.status(201).json(note);
    } catch (error: any) {
      if (error.errors) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add admin note" });
      }
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // SuperAdmin credentials
      if (username === "superadmin" && password === "super123!") {
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await storage.createAdminSession(1, sessionToken, expiresAt);
        
        return res.json({ 
          sessionToken, 
          expiresAt,
          isSuperAdmin: true,
          user: {
            id: 1,
            email: "superadmin@barangayconnect.gov",
            firstName: "Super",
            lastName: "Administrator",
            role: "superadmin"
          }
        });
      }
      
      // Regular admin credentials
      if (username === "admin" && password === "admin123") {
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await storage.createAdminSession(2, sessionToken, expiresAt);
        
        return res.json({ 
          sessionToken, 
          expiresAt,
          isSuperAdmin: false,
          user: {
            id: 2,
            email: "admin@barangay1.gov",
            firstName: "Barangay",
            lastName: "Administrator",
            role: "admin",
            barangayId: 1
          }
        });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        await storage.deleteAdminSession(token);
      }
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Export complaints as CSV (admin only)
  app.get("/api/admin/export", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const complaints = await storage.getAllComplaints();
      
      // Generate CSV
      const headers = ["ID", "Name", "Contact", "Email", "Category", "Priority", "Status", "Location", "Description", "Created At"];
      const csvContent = [
        headers.join(","),
        ...complaints.map(c => [
          c.complaintId,
          `"${c.fullName}"`,
          c.contactNumber,
          c.email || "",
          c.category,
          c.priority,
          c.status,
          `"${c.location}"`,
          `"${c.description.replace(/"/g, '""')}"`,
          new Date(c.createdAt).toLocaleDateString()
        ].join(","))
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="complaints-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  // Superadmin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const adminUsers = await storage.getAllAdminUsers();
      
      // Get barangay info for each admin
      const adminUsersWithBarangay = await Promise.all(
        adminUsers.map(async (admin) => {
          if (admin.barangayId) {
            const barangay = await storage.getBarangayById(admin.barangayId);
            return { ...admin, barangay };
          }
          return admin;
        })
      );
      
      res.json(adminUsersWithBarangay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post("/api/admin/create", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { email, firstName, lastName, barangayId, password } = req.body;
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin with this email already exists" });
      }
      
      const adminUser = await storage.createAdminUser({
        email,
        firstName,
        lastName,
        barangayId: parseInt(barangayId),
        password,
        role: "barangay_admin"
      });

      res.status(201).json(adminUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create admin user" });
    }
  });

  app.get("/api/users/:barangayId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const barangayId = parseInt(req.params.barangayId);
      const users = await storage.getUsersByBarangay(barangayId);
      
      // Get barangay info for each user
      const usersWithBarangay = await Promise.all(
        users.map(async (user) => {
          const barangay = await storage.getBarangayById(user.barangayId);
          return { ...user, barangay };
        })
      );
      
      res.json(usersWithBarangay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all users (for super admin)
  app.get("/api/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { barangayId } = req.query;
      let users;
      
      if (barangayId) {
        users = await storage.getUsersByBarangay(parseInt(barangayId as string));
      } else {
        // Get all users from all barangays (super admin only)
        const allBarangays = await storage.getAllBarangays();
        const allUsers = await Promise.all(
          allBarangays.map(barangay => storage.getUsersByBarangay(barangay.id))
        );
        users = allUsers.flat();
      }
      
      // Get barangay info for each user
      const usersWithBarangay = await Promise.all(
        users.map(async (user) => {
          const barangay = await storage.getBarangayById(user.barangayId);
          return { ...user, barangay };
        })
      );
      
      res.json(usersWithBarangay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Add admin note to complaint
  app.post("/api/complaints/:complaintId/notes", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { complaintId } = req.params;
      const { note } = req.body;

      const adminNote = await storage.addAdminNote({
        complaintId,
        note,
      });

      res.status(201).json(adminNote);
    } catch (error) {
      res.status(500).json({ message: "Failed to add admin note" });
    }
  });

  // Get admin notes for complaint
  app.get("/api/complaints/:complaintId/notes", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { complaintId } = req.params;
      const notes = await storage.getAdminNotesByComplaintId(complaintId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin notes" });
    }
  });

  // Get complaint details
  app.get("/api/complaints/:complaintId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getAdminSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const { complaintId } = req.params;
      const complaint = await storage.getComplaintByComplaintId(complaintId);
      
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }

      res.json(complaint);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch complaint details" });
    }
  });

  // Forum routes
  app.get("/api/forum/posts", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getUserSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const posts = await storage.getForumPostsByBarangay(user.barangayId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.post("/api/forum/posts", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getUserSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { title, content } = req.body;
      const post = await storage.createForumPost(
        { title, content },
        user.id,
        user.barangayId
      );
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to create forum post" });
    }
  });

  app.get("/api/forum/posts/:postId/replies", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getUserSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const postId = parseInt(req.params.postId);
      const replies = await storage.getRepliesByPost(postId);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post("/api/forum/posts/:postId/replies", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const session = await storage.getUserSession(token);
      if (!session) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const postId = parseInt(req.params.postId);
      const { content } = req.body;
      const reply = await storage.createForumReply(
        { content },
        user.id,
        postId
      );
      res.status(201).json(reply);
    } catch (error) {
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
