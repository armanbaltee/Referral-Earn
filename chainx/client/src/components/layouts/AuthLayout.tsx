import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layers } from 'lucide-react';

export function AuthLayout(): React.ReactElement {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 text-white border-r border-zinc-800">
        <div className="flex items-center gap-3 font-semibold text-lg tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">ChainX</span>
        </div>

        <div className="space-y-4 max-w-lg">
          <blockquote className="text-xl font-medium leading-relaxed text-zinc-200">
            &ldquo;ChainX is a high-performance affiliate, commission, multi-tier referral, and task
            distribution platform built with financial precision and enterprise architecture.&rdquo;
          </blockquote>
          <p className="text-sm text-zinc-400">
            Enterprise Tier MLM &bull; Micro-Tasks &bull; Real-time Ledger
          </p>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} ChainX Platform. All rights reserved.
        </div>
      </div>

      {/* Auth Content */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
