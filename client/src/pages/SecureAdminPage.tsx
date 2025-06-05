import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner, InlineLoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import type { Complaint } from "@shared/schema";
import { categoryDisplayName, formatDateTime } from "@/lib/utils";
import { Eye, MessageSquare, LogOut, Shield, Search, Filter } from "lucide-react";

interface LoginForm {
  email: string;
  password: string;
}

export default function SecureAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const superAdmin = localStorage.getItem("isSuperAdmin") === "true";
    if (token) {
      setSessionToken(token);
      setIsLoggedIn(true);
      setIsSuperAdmin(superAdmin);
    }
  }, []);

  const loginForm = useForm<LoginForm>({
    defaultValues: {
      email: "",
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
      
      localStorage.setItem("adminToken", data.sessionToken);
      localStorage.setItem("isSuperAdmin", data.isSuperAdmin ? "true" : "false");
      
      toast({
        title: "Login Successful",
        description: `Welcome ${data.user.firstName} ${data.user.lastName}`,
      });

      if (data.isSuperAdmin) {
        window.location.href = "/superadmin";
      }
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please check your email and password.",
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
      
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isSuperAdmin");
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    total: number;
    resolved: number;
    pending: number;
    thisMonth: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: isLoggedIn && !!sessionToken,
  });

  const { data: complaints = [], isLoading: complaintsLoading, error: complaintsError, refetch } = useQuery<Complaint[]>({
    queryKey: ["/api/admin/complaints"],
    enabled: isLoggedIn && !!sessionToken,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/complaints/${complaintId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Status Updated",
        description: "Complaint status has been successfully updated.",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ complaintId, note }: { complaintId: string; note: string }) => {
      const response = await apiRequest("POST", "/api/admin/complaints/notes", {
        complaintId,
        note,
      });
      return response.json();
    },
    onSuccess: () => {
      setNoteDialogOpen(false);
      setAdminNote("");
      toast({
        title: "Note Added",
        description: "Admin note has been successfully added.",
      });
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || complaint.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
            <p className="text-slate-600">Secure access for authorized personnel</p>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="admin@barangay.gov.ph" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
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
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
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
                  {loginMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Signing in...</span>
                    </div>
                  ) : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Complaint Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{adminUser?.firstName} {adminUser?.lastName}</p>
                <p className="text-xs text-slate-500">{isSuperAdmin ? "Super Admin" : "Barangay Admin"}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Complaints</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {statsLoading ? <LoadingSpinner size="sm" /> : stats?.total || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-slate-600">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statsLoading ? <LoadingSpinner size="sm" /> : stats?.resolved || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
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
                  <p className="text-3xl font-bold text-orange-600">
                    {statsLoading ? <LoadingSpinner size="sm" /> : stats?.pending || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-sm font-medium text-slate-600">This Month</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {statsLoading ? <LoadingSpinner size="sm" /> : stats?.thisMonth || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <CardTitle>Complaints Management</CardTitle>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {complaintsLoading ? (
              <InlineLoadingSpinner text="Loading complaints..." />
            ) : complaintsError ? (
              <ErrorState 
                title="Failed to load complaints"
                message="Please check your connection and try again."
                onRetry={() => refetch()}
              />
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No complaints found matching your criteria.</p>
              </div>
            ) : (
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
                    {filteredComplaints.map((complaint) => (
                      <TableRow key={complaint.id}>
                        <TableCell className="font-mono text-sm">{complaint.complaintId}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{complaint.fullName}</p>
                            <p className="text-sm text-slate-500">{complaint.contactNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{categoryDisplayName(complaint.category)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            complaint.priority === "High" ? "destructive" :
                            complaint.priority === "Medium" ? "default" : "secondary"
                          }>
                            {complaint.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={complaint.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ 
                              complaintId: complaint.complaintId, 
                              status 
                            })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDateTime(complaint.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setNoteDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Complaint Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
            <DialogDescription>
              Full information for complaint {selectedComplaint?.complaintId}
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Complainant Name</label>
                  <p className="text-slate-900">{selectedComplaint.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Contact Number</label>
                  <p className="text-slate-900">{selectedComplaint.contactNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <p className="text-slate-900">{selectedComplaint.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Category</label>
                  <p className="text-slate-900">{categoryDisplayName(selectedComplaint.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Priority</label>
                  <Badge variant={
                    selectedComplaint.priority === "High" ? "destructive" :
                    selectedComplaint.priority === "Medium" ? "default" : "secondary"
                  }>
                    {selectedComplaint.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p className="text-slate-900">{selectedComplaint.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Location</label>
                <p className="text-slate-900">{selectedComplaint.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{selectedComplaint.description}</p>
              </div>
              {selectedComplaint.photoFilename && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Photo Evidence</label>
                  <img 
                    src={`/uploads/${selectedComplaint.photoFilename}`} 
                    alt="Complaint evidence" 
                    className="w-full max-w-md rounded-lg border"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-600">Submitted On</label>
                <p className="text-slate-900">{formatDateTime(selectedComplaint.createdAt)}</p>
              </div>
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
            <Textarea
              placeholder="Enter your note here..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
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
              {addNoteMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Adding...</span>
                </div>
              ) : "Add Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}