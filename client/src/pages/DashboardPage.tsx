import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Search, BarChart3, Users, Clock, CheckCircle } from "lucide-react";

interface StatsData {
  total: number;
  resolved: number;
  pending: number;
  thisMonth: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Welcome Header */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Welcome back, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              {user?.barangay?.name}, {user?.barangay?.municipality}
            </p>
            <p className="text-blue-200">
              Manage your complaints and stay connected with your barangay services.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/file-complaint">
                <CardHeader className="text-center pb-4">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle className="text-lg">File New Complaint</CardTitle>
                  <CardDescription>
                    Report issues in your barangay for quick resolution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="lg">
                    Get Started
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/track">
                <CardHeader className="text-center pb-4">
                  <Search className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <CardTitle className="text-lg">Track Complaints</CardTitle>
                  <CardDescription>
                    Monitor the progress of your submitted complaints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" size="lg">
                    Track Now
                  </Button>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center pb-4">
                <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <CardTitle className="text-lg">Community Stats</CardTitle>
                <CardDescription>
                  View barangay complaint statistics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" size="lg">
                  View Stats
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Barangay Statistics</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Complaints</p>
                      <p className="text-3xl font-bold text-blue-900">{stats?.total || 0}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Resolved</p>
                      <p className="text-3xl font-bold text-green-900">{stats?.resolved || 0}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 font-medium">Pending</p>
                      <p className="text-3xl font-bold text-yellow-900">{stats?.pending || 0}</p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">This Month</p>
                      <p className="text-3xl font-bold text-purple-900">{stats?.thisMonth || 0}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">File Your Complaint</h3>
              <p className="text-slate-600">
                Submit detailed information about issues in your barangay through our easy-to-use form.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Track Progress</h3>
              <p className="text-slate-600">
                Monitor your complaint status and receive updates as our team works on resolution.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Get Resolution</h3>
              <p className="text-slate-600">
                Receive notification when your complaint has been resolved and see the outcome.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}