import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminAccessPage() {
  const [accessCode, setAccessCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAccess = () => {
    if (accessCode === "ADMIN2024" || accessCode === "SECURE_ACCESS") {
      setIsVerifying(true);
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1500);
    } else {
      alert("Invalid access code. Contact system administrator for authorized access.");
      setAccessCode("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <Card className="w-full max-w-md relative z-10 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Secure Administrative Portal
          </CardTitle>
          <p className="text-slate-600 mt-2">Authorized Personnel Only</p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-xs text-slate-500">
            <Lock className="w-3 h-3" />
            <span>Protected Access</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-amber-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <span className="text-sm font-medium">Security Notice</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              This area is restricted to authorized administrative staff. 
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Administrative Access Code
              </label>
              <div className="relative">
                <Input
                  type={showCode ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="pr-10"
                  disabled={isVerifying}
                  onKeyPress={(e) => e.key === "Enter" && handleAccess()}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isVerifying}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleAccess}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={!accessCode.trim() || isVerifying}
            >
              {isVerifying ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Verifying Access...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Access Administrative Portal</span>
                </div>
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-slate-500 text-center">
              Need access? Contact your system administrator
            </p>
            <p className="text-xs text-slate-400 text-center mt-1">
              All access attempts are logged for security purposes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}