import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "@/components/portal/auth/LoginForm";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="vs-auth-shell">
      <div className="vs-auth-card card">
        <div className="vs-auth-brand">
          <span className="vs-brand-mark vs-brand-mark--logo">
            <Image src="/logo.jpg" alt="Tech Pursuit Systems" width={56} height={56} priority />
          </span>
          <div>
            <strong>Tech Pursuit</strong>
            <p className="muted-3" style={{ margin: 0 }}>
              Invoice Portal
            </p>
          </div>
        </div>
        <h1 className="vs-auth-title">Sign in with your email</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
