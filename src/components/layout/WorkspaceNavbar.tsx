'use client';

import Link from 'next/link';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

export function WorkspaceNavbar({ label, suffix }: { label?: string; suffix?: string }) {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Brand + Static breadcrumb: "SprintIQ / Workspaces" */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="font-semibold">
            <span className="inline-block">SprintIQ</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{label ?? 'Workspaces'}{suffix ? ` / ${suffix}` : ''}</span>
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


