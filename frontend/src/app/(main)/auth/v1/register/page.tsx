import Link from "next/link";
import { Command } from "lucide-react";

export default function RegisterV1() {
  return (
    <div className="flex h-dvh">
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="font-semibold text-2xl">Register</h2>
          <p className="text-muted-foreground text-sm">Registration form coming soon.</p>
          <p className="text-muted-foreground text-xs">
            Already have an account?{" "}
            <Link prefetch={false} href="login" className="text-primary">Login</Link>
          </p>
        </div>
      </div>
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <Command className="mx-auto size-12 text-primary-foreground" />
          <h1 className="mt-6 font-light text-5xl text-primary-foreground">Welcome!</h1>
          <p className="mt-2 text-primary-foreground/80 text-xl">You&apos;re in the right place.</p>
        </div>
      </div>
    </div>
  );
}
