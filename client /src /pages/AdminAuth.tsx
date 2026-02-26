import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminAuth() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();
  const { login } = useAuthContext();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Admin registration state
  const [adminVerificationCode, setAdminVerificationCode] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mutations
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const requestAdminMutation = trpc.auth.requestAdminRegistration.useMutation();
  const verifyAdminMutation = trpc.auth.verifyAndRegisterAdmin.useMutation();
  const checkEmailMutation = trpc.auth.checkEmailExists.useQuery(
    { email: registerEmail },
    { enabled: registerEmail.length > 0 && activeTab === "register" }
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!loginEmail || !loginPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });

      if (result.success && result.user) {
        login(result.token, result.user);
        setMessage({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => setLocation("/dashboard"), 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Login failed" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (checkEmailMutation.data?.exists) {
      setMessage({ type: "error", text: "This email is already registered" });
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      });

      if (result.success && result.user) {
        login(result.token, { id: result.userId || 0, email: registerEmail, name: registerName, role: "user" });
        setMessage({ type: "success", text: "Registration successful! Redirecting..." });
        setTimeout(() => setLocation("/dashboard"), 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Registration failed" });
    }
  };

  const handleRequestAdminRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!registerName || !registerEmail) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (checkEmailMutation.data?.exists) {
      setMessage({ type: "error", text: "This email is already registered" });
      return;
    }

    try {
      const result = await requestAdminMutation.mutateAsync({
        name: registerName,
        email: registerEmail,
      });

      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setStep("verify");
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An error occurred" });
    }
  };

  const handleVerifyAndRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!adminVerificationCode || !registerPassword || !registerConfirmPassword) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (adminVerificationCode.length !== 6) {
      setMessage({ type: "error", text: "Verification code must be 6 digits" });
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    try {
      const result = await verifyAdminMutation.mutateAsync({
        verificationCode: adminVerificationCode,
        email: registerEmail,
        name: registerName,
        password: registerPassword,
      });

      if (result.success) {
        login(result.token, { id: result.userId || 0, email: registerEmail, name: registerName, role: "admin" });
        setMessage({ type: "success", text: "Admin account created! Redirecting..." });
        setTimeout(() => setLocation("/dashboard"), 1500);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An error occurred" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">POS & Inventory System</CardTitle>
          <CardDescription>Admin Access</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || !loginEmail || !loginPassword}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              {step === "request" ? (
                <form onSubmit={handleRequestAdminRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                    {checkEmailMutation.data?.exists && (
                      <p className="text-xs text-red-500">This email is already registered</p>
                    )}
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      Need admin access? Request registration and the admin will send you a verification code.
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      requestAdminMutation.isPending ||
                      checkEmailMutation.data?.exists ||
                      !registerName ||
                      !registerEmail
                    }
                  >
                    {requestAdminMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      "Request Admin Registration"
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("login")}
                  >
                    Already have an account? Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndRegisterAdmin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Verification Code</label>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={adminVerificationCode}
                      onChange={(e) => setAdminVerificationCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <p className="text-xs text-gray-500">
                      Enter the 6-digit code sent to the admin
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Min 8 chars, 1 uppercase, 1 number, 1 special char (!@#$%^&*)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showRegisterConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showRegisterConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      verifyAdminMutation.isPending ||
                      adminVerificationCode.length !== 6 ||
                      !registerPassword ||
                      !registerConfirmPassword
                    }
                  >
                    {verifyAdminMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Admin Account...
                      </>
                    ) : (
                      "Create Admin Account"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep("request");
                      setAdminVerificationCode("");
                      setRegisterPassword("");
                      setRegisterConfirmPassword("");
                    }}
                  >
                    Back
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          {message && (
            <Alert className={message.type === "success" ? "bg-green-50 border-green-200 mt-4" : "bg-red-50 border-red-200 mt-4"}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
