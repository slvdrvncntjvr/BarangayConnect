import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Complaint, AdminNote } from "@shared/schema";
import { categoryDisplayName } from "@/lib/utils";

export default function TrackComplaintPage() {
  const [trackingId, setTrackingId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: complaintData, isLoading, error } = useQuery({
    queryKey: [`/api/complaints/${searchId}`],
    enabled: !!searchId,
  });

  const handleTrack = () => {
    if (!trackingId.trim()) {
      return;
    }
    setSearchId(trackingId.toUpperCase());
  };

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

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "Submitted":
        return 33;
      case "Under Review":
        return 66;
      case "Resolved":
        return 100;
      default:
        return 0;
    }
  };

  const complaint = complaintData as Complaint & { notes: AdminNote[] };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Track Your Complaint</h1>
            <p className="text-slate-600">Enter your complaint ID to check the current status and progress.</p>
          </div>

          {/* Search Form */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Enter Complaint ID (e.g., BC-2024-0001)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1 text-lg py-4"
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
              <Button onClick={handleTrack} size="lg" className="px-8 min-w-32">
                {isLoading ? "Searching..." : "Track"}
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-8 border-destructive">
              <CardContent className="p-6 text-center">
                <div className="text-destructive mb-2">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Complaint Not Found</h3>
                <p className="text-slate-600">
                  Please check your complaint ID and try again. Make sure to include the "BC-" prefix.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Sample Complaint Display */}
          {complaint && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-primary/5 rounded-xl p-6 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Complaint ID: {complaint.complaintId}</h2>
                    <p className="text-slate-600">Filed on {new Date(complaint.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <Badge className={`${getStatusColor(complaint.status)} text-white`}>
                      <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                      {complaint.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Progress</span>
                    <span>{getProgressPercentage(complaint.status)}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        complaint.status === "Resolved" ? "bg-success" : "bg-warning"
                      }`}
                      style={{ width: `${getProgressPercentage(complaint.status)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Complaint Submitted</h3>
                      <p className="text-sm text-slate-600">{new Date(complaint.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      ["Under Review", "Resolved"].includes(complaint.status) ? "bg-warning" : "bg-slate-300"
                    }`}>
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        ["Under Review", "Resolved"].includes(complaint.status) ? "text-slate-900" : "text-slate-400"
                      }`}>Under Review</h3>
                      <p className={`text-sm ${
                        ["Under Review", "Resolved"].includes(complaint.status) ? "text-slate-600" : "text-slate-400"
                      }`}>
                        {["Under Review", "Resolved"].includes(complaint.status) 
                          ? new Date(complaint.updatedAt).toLocaleString()
                          : "Pending"
                        }
                      </p>
                      {complaint.status === "Under Review" && (
                        <p className="text-sm text-slate-500 mt-1">Our team is evaluating your complaint and will provide updates soon.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      complaint.status === "Resolved" ? "bg-success" : "bg-slate-300"
                    }`}>
                      {complaint.status === "Resolved" ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${
                        complaint.status === "Resolved" ? "text-slate-900" : "text-slate-400"
                      }`}>Resolution</h3>
                      <p className={`text-sm ${
                        complaint.status === "Resolved" ? "text-slate-600" : "text-slate-400"
                      }`}>
                        {complaint.status === "Resolved" 
                          ? new Date(complaint.updatedAt).toLocaleString()
                          : "Pending"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complaint Details Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Complaint Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-medium text-slate-500">Category:</span>
                      <p className="text-slate-900 font-medium">{categoryDisplayName(complaint.category)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Priority:</span>
                      <Badge className={`${getPriorityColor(complaint.priority)} text-white ml-2`}>
                        {complaint.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Location:</span>
                      <p className="text-slate-900">{complaint.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Complainant:</span>
                      <p className="text-slate-900">{complaint.fullName}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-500">Description:</span>
                    <p className="text-slate-900 mt-1">{complaint.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              {complaint.notes && complaint.notes.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z"></path>
                      </svg>
                      Admin Updates
                    </h3>
                    <div className="space-y-3">
                      {complaint.notes.map((note) => (
                        <div key={note.id} className="bg-white rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-900">Barangay Administrator</span>
                            <span className="text-sm text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700">{note.note}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button variant="outline" className="px-6 py-3">
                  Report Additional Issue
                </Button>
                <Link href="/file-complaint">
                  <Button className="px-6 py-3">
                    File New Complaint
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/">
              <Button variant="ghost">← Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
