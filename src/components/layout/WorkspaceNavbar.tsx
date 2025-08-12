'use client';

import Link from 'next/link';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Navbar } from './Navbar';

export function WorkspaceNavbar({ label, suffix }: { label?: string; suffix?: string }) {
  return <Navbar />;
}


