"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

type LoginErrorCode = "INVALID_CREDENTIALS" | "USER_SUSPENDED" | "TENANT_SUSPENDED";

const ERROR_MAP: Record<LoginErrorCode, string> = {
  INVALID_CREDENTIALS: "Invalid email or password.",
  USER_SUSPENDED: "Your account has been suspended. Please contact support.",
  TENANT_SUSPENDED:
    "Your school account has been suspended. Please contact the system administrator.",
};

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw data;
      }

      localStorage.setItem("refresh_token", data.data.refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(data.data.user));
      (window as any).__accessToken = data.data.accessToken;
      router.push("/dashboard/default");
    } catch (err: any) {
      const code = err?.code as LoginErrorCode | undefined;
      setApiError(
        (code && ERROR_MAP[code]) || err?.message || "Something went wrong. Please try again.",
      );
      resetField("password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-background">
      {/* Left panel */}
      <aside className="relative hidden w-2/5 flex-col items-center justify-center overflow-hidden p-12 md:flex ds-accent-bg">
        <div className="absolute left-12 top-16 h-3 w-3 rounded-full bg-white/30" />
        <div className="absolute right-20 top-1/3 h-5 w-5 rounded-full bg-white/20" />
        <div className="absolute bottom-24 left-1/3 h-4 w-4 rounded-full bg-white/25" />
        <GraduationCap size={48} className="text-white" strokeWidth={1.5} />
        <h1 className="mt-6 text-center text-4xl font-light leading-tight text-white">
          Welcome Back
        </h1>
        <p className="mt-3 text-center text-lg text-white/80">
          Log in to manage your school
        </p>
      </aside>

      {/* Right panel */}
      <main className="flex w-full flex-col items-center justify-center px-6 py-10 md:w-3/5">
        <div className="w-full max-w-[480px]">
          {/* Brand */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] ds-accent-bg">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              EduAdmin
            </span>
          </div>

          <h2 className="text-3xl font-bold text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access the dashboard
          </p>

          {apiError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg px-4 py-3 text-sm bg-destructive/10 border border-destructive text-destructive"
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
              <span>{apiError}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
            noValidate
          >
            <Field label="Email Address" error={errors.email?.message}>
              <input
                type="email"
                placeholder="admin@school.com"
                autoComplete="email"
                {...register("email")}
                className={cn(
                  "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors",
                  "placeholder:text-muted-foreground focus:border-primary",
                  errors.email && "border-destructive focus:border-destructive"
                )}
              />
            </Field>

            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register("password")}
                  className={cn(
                    "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 pr-11 text-sm outline-none transition-colors",
                    "placeholder:text-muted-foreground focus:border-primary",
                    errors.password && "border-destructive focus:border-destructive"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <SubmitButton
              disabled={!isValid || submitting}
              loading={submitting}
              idleLabel="Sign In"
              loadingLabel="Signing in..."
            />
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/v1/register" className="font-medium text-primary">
              Register your school &rarr;
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs text-destructive">
          {error}
        </span>
      )}
      {hint && !error && <div className="mt-2 text-sm text-muted-foreground">{hint}</div>}
    </label>
  );
}

function SubmitButton({
  disabled,
  loading,
  idleLabel,
  loadingLabel,
}: {
  disabled?: boolean;
  loading?: boolean;
  idleLabel: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-semibold transition-all duration-150",
        disabled
          ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
          : "ds-accent-bg border border-transparent text-white hover:brightness-110"
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? loadingLabel : idleLabel}
    </button>
  );
}
