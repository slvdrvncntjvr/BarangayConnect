import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Users, FileText, BarChart3 } from "lucide-react";

interface StatsData {
  total: number;
  resolved: number;
  pending: number;
  thisMonth: number;
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    window.location.href = "/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to BarangayConnect</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Your digital bridge to efficient barangay services. File complaints, track progress, and build a better community together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl">
                  Get Started - Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold">
                  Create Account
                </Button>
              </Link>
            </div>
            
            {/* Admin Access */}
            <div className="mt-8 pt-8 border-t border-blue-400">
              <p className="text-blue-200 mb-4">Are you a barangay administrator?</p>
              <Link href="/admin-access">
                <Button size="lg" variant="outline" className="border-2 border-yellow-400 text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-primary px-8 py-4 text-lg font-semibold">
                  <Shield className="w-5 h-5 mr-2" />
                  Administrative Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Community Impact</h2>
            <p className="text-lg text-slate-600">See how we're making a difference in our barangay</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-0">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? "..." : (stats?.total ?? 0)}
                </div>
                <div className="text-blue-100">Total Complaints Filed</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-success to-green-600 text-white border-0">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? "..." : (stats?.resolved ?? 0)}
                </div>
                <div className="text-green-100">Successfully Resolved</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-warning to-yellow-600 text-white border-0">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? "..." : (stats?.thisMonth ?? 0)}
                </div>
                <div className="text-yellow-100">Resolved This Month</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Simple steps to get your concerns addressed</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">1. File Your Complaint</h3>
                <p className="text-slate-600 mb-6">Submit your concern with details, photos, and contact information through our easy-to-use form.</p>
                <Link href="/file-complaint">
                  <Button variant="link" className="text-primary font-medium">
                    Get Started →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">2. Track Progress</h3>
                <p className="text-slate-600 mb-6">Monitor your complaint status in real-time using your unique complaint ID.</p>
                <Link href="/track">
                  <Button variant="link" className="text-primary font-medium">
                    Track Now →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">3. Get Resolution</h3>
                <p className="text-slate-600 mb-6">Receive updates from barangay officials and see your issue resolved efficiently.</p>
                <Link href="/signup">
                  <Button variant="link" className="text-primary font-medium">
                    Get Started →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
