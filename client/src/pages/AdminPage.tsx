import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Complaint } from "@shared/schema";
import { categoryDisplayName } from "@/lib/utils";

interface LoginForm {
  username: string;
  password: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setIsLoggedIn(true);
      setIsSuperAdmin(data.isSuperAdmin || false);
      setAdminUser(data.user);
      
      // Store token in localStorage for SuperAdmin page
      localStorage.setItem("adminToken", data.sessionToken);
      localStorage.setItem("isSuperAdmin", data.isSuperAdmin ? "true" : "false");
      
      toast({
        title: "Login Successful",
        description: `Welcome ${data.user.firstName} ${data.user.lastName}`,
      });

      // Redirect SuperAdmin to SuperAdmin page
      if (data.isSuperAdmin) {
        window.location.href = "/superadmin";
      }
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (sessionToken) {
        await apiRequest("POST", "/api/admin/logout", {});
      }
    },
    onSuccess: () => {
      setIsLoggedIn(false);
      setSessionToken(null);
      setIsSuperAdmin(false);
      setAdminUser(null);
      
      // Clear localStorage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isSuperAdmin");
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    },
  });

  const { data: stats = { total: 0, resolved: 0, pending: 0, thisMonth: 0 } } = useQuery<{
    total: number;
    resolved: number;
    pending: number;
    thisMonth: number;
  }>({
    queryKey: ["/api/stats"],
    enabled: isLoggedIn,
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    queryFn: async () => {
      const response = await fetch("/api/complaints", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch complaints");
      return response.json();
    },
    enabled: isLoggedIn && !!sessionToken,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: string; status: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Complaint status has been updated successfully",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/export", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      if (!response.ok) throw new Error("Export failed");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `complaints-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: "Complaints have been exported to CSV",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-slate-500";
      case "Under Review":
        return "bg-warning";
      case "Resolved":
        return "bg-success";
      default:
        return "bg-slate-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-slate-400";
      case "Medium":
        return "bg-warning";
      case "High":
        return "bg-destructive";
      default:
        return "bg-slate-400";
    }
  };

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  // Add admin note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ complaintId, note }: { complaintId: string; note: string }) => {
      const response = await fetch(`/api/complaints/${complaintId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error("Failed to add note");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note Added",
        description: "Admin note has been added successfully",
      });
      setNoteDialogOpen(false);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add admin note",
        variant: "destructive",
      });
    },
  });

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h1>
              <p className="text-slate-600">Enter your credentials to access the admin dashboard</p>
              
              {/* Credentials Display */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border text-sm">
                <h3 className="font-semibold text-slate-900 mb-2">Test Credentials:</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">SuperAdmin:</span>
                    <p className="text-slate-600">Username: <code className="bg-white px-1 rounded">superadmin</code></p>
                    <p className="text-slate-600">Password: <code className="bg-white px-1 rounded">super123!</code></p>
                  </div>
                  <div className="border-t pt-2">
                    <span className="font-medium text-blue-600">Barangay Admin:</span>
                    <p className="text-slate-600">Username: <code className="bg-white px-1 rounded">admin</code></p>
                    <p className="text-slate-600">Password: <code className="bg-white px-1 rounded">admin123</code></p>
                  </div>
                </div>
              </div>
            </div>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage complaints and monitor barangay services</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="bg-success hover:bg-green-700"
          >
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
          <Button 
            onClick={() => logoutMutation.mutate()}
            variant="outline"
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Complaints</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Resolved</p>
                <p className="text-2xl font-bold text-success">{stats?.resolved || 0}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-primary">{stats?.thisMonth || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complaints Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Complaints</h2>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="lighting">Street Lighting</SelectItem>
                    <SelectItem value="garbage">Garbage Collection</SelectItem>
                    <SelectItem value="road">Road Repair</SelectItem>
                    <SelectItem value="noise">Noise Complaint</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Complainant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaintsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading complaints...
                    </TableCell>
                  </TableRow>
                ) : complaints?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No complaints found
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints?.map((complaint: Complaint) => (
                    <TableRow key={complaint.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{complaint.complaintId}</TableCell>
                      <TableCell>{complaint.fullName}</TableCell>
                      <TableCell className="font-medium">
                        {categoryDisplayName(complaint.category)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(complaint.priority)} text-white`}>
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={complaint.status}
                          onValueChange={(status) => 
                            updateStatusMutation.mutate({ 
                              complaintId: complaint.complaintId, 
                              status 
                            })
                          }
                        >
                          <SelectTrigger className={`w-36 border-0 ${getStatusColor(complaint.status)} text-white font-medium`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Under Review">Under Review</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-primary"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setViewDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="text-success"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setNoteDialogOpen(true);
                            }}
                          >
                            Note
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {complaints && complaints.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, complaints.length)}</span> of <span className="font-medium">{complaints.length}</span> results
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button size="sm">1</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Complaint Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              View complete complaint information
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Complaint ID</h4>
                  <p className="text-slate-600">{selectedComplaint.complaintId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Status</h4>
                  <Badge className={`${getStatusColor(selectedComplaint.status)} text-white`}>
                    {selectedComplaint.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Complainant</h4>
                  <p className="text-slate-600">{selectedComplaint.fullName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Contact</h4>
                  <p className="text-slate-600">{selectedComplaint.contactNumber}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Category</h4>
                <p className="text-slate-600">{categoryDisplayName(selectedComplaint.category)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Description</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-md">{selectedComplaint.description}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Location</h4>
                <p className="text-slate-600">{selectedComplaint.location}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Priority</h4>
                  <Badge className={`${getPriorityColor(selectedComplaint.priority)} text-white`}>
                    {selectedComplaint.priority}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Date Submitted</h4>
                  <p className="text-slate-600">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedComplaint.photoFilename && (
                <div>
                  <h4 className="font-semibold text-slate-900">Photo Evidence</h4>
                  <img 
                    src={`/uploads/${selectedComplaint.photoFilename}`} 
                    alt="Complaint evidence" 
                    className="mt-2 rounded-md max-w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
            <DialogDescription>
              Add an internal note for complaint {selectedComplaint?.complaintId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="adminNote" className="text-sm font-medium text-slate-700">
                Note
              </label>
              <Textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter your note here..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNoteDialogOpen(false);
                setAdminNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedComplaint && adminNote.trim()) {
                  addNoteMutation.mutate({
                    complaintId: selectedComplaint.complaintId,
                    note: adminNote.trim()
                  });
                }
              }}
              disabled={!adminNote.trim() || addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
