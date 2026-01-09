"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCache } from "@/lib/api";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (sidebarExpanded) {
      document.body.classList.add('has-expanded-sidebar');
    } else {
      document.body.classList.remove('has-expanded-sidebar');
    }
  }, [sidebarExpanded]);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheMessage(null);
    
    try {
      await clearCache();
      setCacheMessage({ type: 'success', text: 'Cache cleared successfully!' });
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (error) {
      setCacheMessage({ type: 'error', text: 'Failed to clear cache' });
      setTimeout(() => setCacheMessage(null), 3000);
    } finally {
      setClearingCache(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} min-h-screen overflow-hidden selection:bg-[#FF5E00] selection:text-white relative bg-white text-neutral-900 flex`}>
        {/* Background Animation */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>

        {/* Left Sidebar */}
        <nav className="fixed z-50 flex flex-col bg-white/80 w-[72px] border-neutral-100/80 border-r pt-6 pb-6 top-0 bottom-0 left-0 backdrop-blur-xl justify-between" id="sidebar">
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Sidebar Header */}
            <div id="sidebar-header" className="flex items-center justify-center w-full px-2 min-h-[40px] relative">
              <div id="logo-wrapper" className="relative flex items-center justify-center w-10 h-10 shrink-0 rounded-xl cursor-pointer">
                <div className="text-[#FF5E00]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M7 15h0M12 15h0M17 15h0M7 11h10"/>
                  </svg>
                </div>
                <button onClick={toggleSidebar} id="expand-trigger" className="absolute inset-0 flex items-center justify-center rounded-xl text-neutral-400 transition-all backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <path d="M9 3v18"></path>
                    <path d="m14 9 3 3-3 3"></path>
                  </svg>
                </button>
              </div>
              <button id="collapse-trigger" onClick={toggleSidebar} className="text-neutral-400 hover:text-neutral-600 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <path d="M9 3v18"></path>
                </svg>
              </button>
            </div>

            <div className="w-8 h-[1px] bg-neutral-100"></div>

            {/* Nav Items */}
            <div className="flex flex-col gap-2 w-full px-2">
              {/* Analysis Tool */}
              <Link href="/" className={`sidebar-item group relative flex items-center justify-center p-2.5 rounded-lg transition-all ${
                isActive('/')
                  ? 'text-[#FF5E00] bg-[#FF5E00]/5'
                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 stroke-[1.5]">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <span className="nav-label absolute left-14 px-2 py-1 bg-neutral-900 text-white font-normal rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg transition-opacity duration-300 text-xs">
                  Analysis Tool
                </span>
              </Link>

              {/* Purchase History */}
              <Link href="/purchases" className={`sidebar-item group relative flex items-center justify-center p-2.5 rounded-lg transition-all ${
                isActive('/purchases')
                  ? 'text-[#FF5E00] bg-[#FF5E00]/5'
                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 stroke-[1.5]">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span className="nav-label absolute left-14 px-2 py-1 bg-neutral-900 text-white font-normal rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg transition-opacity duration-300 text-xs">
                  Purchase History
                </span>
              </Link>

              {/* Database */}
              <Link href="/database" className={`sidebar-item group relative flex items-center justify-center p-2.5 rounded-lg transition-all ${
                isActive('/database')
                  ? 'text-[#FF5E00] bg-[#FF5E00]/5'
                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 stroke-[1.5]">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
                  <path d="M3 12a9 3 0 0 0 18 0"></path>
                </svg>
                <span className="nav-label absolute left-14 px-2 py-1 bg-neutral-900 text-white font-normal rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg transition-opacity duration-300 text-xs">
                  Sales Database
                </span>
              </Link>

              {/* eBay Search */}
              <Link href="/ebay" className={`sidebar-item group relative flex items-center justify-center p-2.5 rounded-lg transition-all ${
                isActive('/ebay')
                  ? 'text-[#FF5E00] bg-[#FF5E00]/5'
                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 stroke-[1.5]">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <span className="nav-label absolute left-14 px-2 py-1 bg-neutral-900 text-white font-normal rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg transition-opacity duration-300 text-xs">
                  eBay Search
                </span>
              </Link>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col items-center gap-4 w-full px-2" id="sidebar-bottom-actions">
            {/* Settings */}
            <button className="sidebar-item group relative flex items-center justify-center p-2.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 stroke-[1.5]">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span className="nav-label absolute left-14 px-2 py-1 bg-neutral-900 text-white font-normal rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-lg transition-opacity duration-300 text-xs">
                Settings
              </span>
            </button>
          </div>
        </nav>

        {/* Content Wrapper */}
        <div id="main-wrapper" className="flex flex-col flex-1 pl-[72px] transition-all duration-300 h-screen relative z-10">
          {/* Top Bar */}
          <header className="h-16 border-b border-neutral-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-40">
            {/* Global Search */}
            <div className="flex items-center w-full max-w-lg">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400 group-focus-within:text-[#FF5E00] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2 border-none bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white text-sm text-neutral-900 rounded-lg focus:ring-1 focus:ring-neutral-200 placeholder-neutral-400 transition-all outline-none" 
                  placeholder="Search cards, players, or brands..."
                />
              </div>
            </div>

            {/* Right Actions: Clear Cache, Status & Profile */}
            <div className="flex items-center gap-4">
              {/* Clear Cache Button */}
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 hover:bg-[#FF5E00]/5 border border-neutral-200 hover:border-[#FF5E00]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear Redis cache"
              >
                <svg
                  className={`w-4 h-4 text-neutral-600 group-hover:text-[#FF5E00] transition-colors ${clearingCache ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {clearingCache ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  )}
                </svg>
                <span className="text-xs font-medium text-neutral-600 group-hover:text-[#FF5E00] transition-colors">
                  {clearingCache ? 'Clearing...' : 'Clear Cache'}
                </span>
              </button>

              <div className="h-6 w-[1px] bg-neutral-200"></div>

              {/* System Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wide">
                  System Operational
                </span>
              </div>

              <div className="h-6 w-[1px] bg-neutral-200"></div>

              {/* User Profile */}
              <button className="flex items-center gap-3 hover:bg-neutral-50 p-1.5 pl-2 rounded-full transition-all group">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-neutral-900">Card Trader</p>
                  <p className="text-[10px] text-neutral-500">Analyst</p>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-neutral-100 group-hover:ring-[#FF5E00]/20 transition-all bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
                  CT
                </div>
              </button>
            </div>
          </header>

          {/* Toast Notification */}
          {cacheMessage && (
            <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-2 flex items-center gap-3 animate-in slide-in-from-top-5 ${
              cacheMessage.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {cacheMessage.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium text-sm">{cacheMessage.text}</span>
            </div>
          )}

          {/* Main Workspace */}
          <main className="flex-1 overflow-y-auto no-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
