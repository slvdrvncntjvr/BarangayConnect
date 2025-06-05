import React, { useState } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import FileComplaintPage from "@/pages/FileComplaintPage";
import TrackComplaintPage from "@/pages/TrackComplaintPage";
import AdminAccessPage from "@/pages/AdminAccessPage";
import SecureAdminPage from "@/pages/SecureAdminPage";
import SuperAdminPage from "@/pages/SuperAdminPage";
import ForumPage from "@/pages/ForumPage";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/admin-access" component={AdminAccessPage} />
        <Route path="/admin" component={SecureAdminPage} />
        <Route path="/superadmin" component={SuperAdminPage} />
        <Route component={HomePage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/file-complaint" component={FileComplaintPage} />
      <Route path="/track" component={TrackComplaintPage} />
      <Route path="/forum" component={ForumPage} />
      <Route path="/admin-access" component={AdminAccessPage} />
      <Route path="/admin" component={SecureAdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <main>
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => {
            if (isAuthenticated) {
              window.location.href = "/dashboard";
            } else {
              window.location.href = "/";
            }
          }}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 hover:text-primary transition-colors">BarangayConnect</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Complaint Management System</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NavLink href="/">Dashboard</NavLink>
                <NavLink href="/file-complaint">File Complaint</NavLink>
                <NavLink href="/track">Track</NavLink>
                <NavLink href="/forum">Community</NavLink>
                <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 ml-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-slate-500">{user?.barangay?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink href="/login">Login</NavLink>
                <NavLink href="/signup">Sign Up</NavLink>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4">
            <div className="space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-lg mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{user?.barangay?.name}</div>
                    </div>
                  </div>
                  <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Dashboard</MobileNavLink>
                  <MobileNavLink href="/file-complaint" onClick={() => setMobileMenuOpen(false)}>File Complaint</MobileNavLink>
                  <MobileNavLink href="/track" onClick={() => setMobileMenuOpen(false)}>Track</MobileNavLink>
                  <MobileNavLink href="/forum" onClick={() => setMobileMenuOpen(false)}>Community</MobileNavLink>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" onClick={() => setMobileMenuOpen(false)}>Login</MobileNavLink>
                  <MobileNavLink href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? "text-primary bg-primary/10" 
        : "text-slate-600 hover:text-primary hover:bg-slate-100"
    }`}>
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href} onClick={onClick} className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? "text-primary bg-primary/10" 
        : "text-slate-600 hover:text-primary hover:bg-slate-100"
    }`}>
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">BarangayConnect</h3>
            </div>
            <p className="text-slate-300">Connecting citizens with their local government for better community service and efficient complaint resolution.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="/file-complaint" className="hover:text-white transition-colors">File Complaint</a></li>
              <li><a href="/track" className="hover:text-white transition-colors">Track Status</a></li>
              <li><a href="/forum" className="hover:text-white transition-colors">Community Forum</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <div className="space-y-2 text-slate-300">
              <p><svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>+63 (02) 123-4567</p>
              <p><svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>info@barangayconnect.gov.ph</p>
              <p><svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>Barangay Hall, Manila</p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-300">
          <p>&copy; 2024 BarangayConnect. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
