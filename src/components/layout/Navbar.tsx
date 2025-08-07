'use client';

import Link from "next/link";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/" className="font-semibold">
          <span className="inline-block rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">SprintIQ</span>
        </Link>

        <div className="ml-6 hidden items-center space-x-6 text-sm text-muted-foreground md:flex">
          <Link href="/projects" className="hover:text-foreground">Projects</Link>
          <Link href="/workspaces" className="hover:text-foreground">Workspaces</Link>
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          <SignedOut>
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              afterMultiSessionSingleSignOutUrl="/"
              afterSwitchSessionUrl="/dashboard"
              signInUrl="/auth/sign-in"
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
} 