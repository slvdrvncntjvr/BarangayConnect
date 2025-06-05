import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Plus, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  barangayId: number;
  barangay?: {
    name: string;
    municipality: string;
  };
}

interface Barangay {
  id: number;
  name: string;
  municipality: string;
  province: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  barangayId: number;
  barangay?: {
    name: string;
    municipality: string;
  };
}

export default function SuperAdminPage() {
  const { toast } = useToast();
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");
  const [adminSearchTerm, setAdminSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    barangayId: 0
  });

  // Get admin token for authentication
  const adminToken = localStorage.getItem("adminToken");

  // Fetch admin users
  const { data: adminUsers, isLoading: loadingAdmins } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch admin users");
      return response.json();
    },
    enabled: !!adminToken,
  });

  // Fetch barangays
  const { data: barangays } = useQuery<Barangay[]>({
    queryKey: ["/api/barangays"],
  });

  // Fetch residents by barangay
  const { data: residents } = useQuery<User[]>({
    queryKey: ["/api/users", selectedBarangay],
    queryFn: async () => {
      const response = await fetch(`/api/users?barangayId=${selectedBarangay}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: !!selectedBarangay && !!adminToken,
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      firstName: string;
      lastName: string;
      barangayId: number;
      password: string;
    }) => {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create admin");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsCreateAdminOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        barangayId: 0
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = () => {
    createAdminMutation.mutate({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      barangayId: formData.barangayId,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
                <p className="text-red-200">BarangayConnect Management Center</p>
              </div>
            </div>
            <Badge variant="destructive" className="text-sm px-3 py-1">
              SUPERADMIN ACCESS
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 font-medium">Total Barangays</p>
                  <p className="text-3xl font-bold text-slate-900">{barangays?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 font-medium">Admin Accounts</p>
                  <p className="text-3xl font-bold text-slate-900">{adminUsers?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 font-medium">Total Residents</p>
                  <p className="text-3xl font-bold text-slate-900">{residents?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Admin Account Management</CardTitle>
                <CardDescription>Create and manage barangay administrator accounts</CardDescription>
              </div>
              <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Admin Account</DialogTitle>
                    <DialogDescription>
                      Create a new administrator account for a specific barangay
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="barangayId">Barangay</Label>
                      <Select 
                        value={formData.barangayId ? formData.barangayId.toString() : ""} 
                        onValueChange={(value) => setFormData({...formData, barangayId: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays?.map((barangay) => (
                            <SelectItem key={barangay.id} value={barangay.id.toString()}>
                              {barangay.name}, {barangay.municipality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateAdmin} 
                      disabled={createAdminMutation.isPending || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.barangayId}
                    >
                      {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search admins by name or email..."
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            {loadingAdmins ? (
              <div className="text-center py-4">Loading admin accounts...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Barangay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers?.filter(admin => 
                    !adminSearchTerm || 
                    `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                    admin.email.toLowerCase().includes(adminSearchTerm.toLowerCase())
                  ).map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        {admin.barangay?.name}, {admin.barangay?.municipality}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Admin Details",
                                description: `${admin.firstName} ${admin.lastName} - ${admin.email}`,
                              });
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to deactivate ${admin.firstName} ${admin.lastName}?`)) {
                                toast({
                                  title: "Admin Deactivated",
                                  description: "Admin account has been deactivated",
                                });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Resident Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Resident Management</CardTitle>
            <CardDescription>View and manage residents by barangay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="barangaySelect">Select Barangay</Label>
              <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a barangay to view residents" />
                </SelectTrigger>
                <SelectContent>
                  {barangays?.map((barangay) => (
                    <SelectItem key={barangay.id} value={barangay.id.toString()}>
                      {barangay.name}, {barangay.municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBarangay && residents && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium">
                        {resident.firstName} {resident.lastName}
                      </TableCell>
                      <TableCell>{resident.email}</TableCell>
                      <TableCell>Recently</TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}