"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/icon.svg"
              alt="Newton AI"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900">Newton AI</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden items-center gap-0 md:flex absolute left-1/2 -translate-x-1/2">
            <Link
              href="/features"
              className="rounded-lg text-[15px] font-normal"
              style={{
                padding: '4px 12px',
                color: 'rgb(63, 63, 70)',
                backgroundColor: 'rgba(230, 230, 232, 0)',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg text-[15px] font-normal"
              style={{
                padding: '4px 12px',
                color: 'rgb(63, 63, 70)',
                backgroundColor: 'rgba(230, 230, 232, 0)',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="rounded-lg text-[15px] font-normal"
              style={{
                padding: '4px 12px',
                color: 'rgb(63, 63, 70)',
                backgroundColor: 'rgba(230, 230, 232, 0)',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
            >
              About
            </Link>
            <Link
              href="/blog"
              className="rounded-lg text-[15px] font-normal"
              style={{
                padding: '4px 12px',
                color: 'rgb(63, 63, 70)',
                backgroundColor: 'rgba(230, 230, 232, 0)',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
            >
              Blog
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-2 md:flex shrink-0">
            <Link
              href="/login"
              className="rounded-lg border  border-gray-200 bg-white px-4 py-2 text-[14px] font-medium text-gray-900 transition-colors hover:bg-gray-50"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border  border-white/12 px-4 py-2 text-[14px] text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(241deg, rgba(0, 0, 1) -10.49%, rgba(0, 0, 1) 106.38%)',
                boxShadow: '0px 0px 6px 1px rgba(50, 61, 214, 0.1)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.15px'
              }}
            >
              Start learning
            </Link>
          </div>

          {/* Mobile Sign Up & Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/signup"
              className="rounded-lg border border-white/12 px-4 py-2 text-[14px] text-white transition-all hover:shadow-lg"
              style={{
                background: 'linear-gradient(241deg, rgba(0, 0, 1) -10.49%, rgba(0, 0, 1) 106.38%)',
                boxShadow: '0px 0px 6px 1px rgba(50, 61, 214, 0.1)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.15px'
              }}
            >
              Sign up
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative">
                <span
                  className="absolute w-full h-[2px] bg-gray-600 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    top: isMobileMenuOpen ? '50%' : '0',
                    transform: isMobileMenuOpen ? 'translateY(-50%) rotate(45deg)' : 'translateY(0) rotate(0deg)'
                  }}
                />
                <span
                  className="absolute w-full h-[2px] bg-gray-600 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    opacity: isMobileMenuOpen ? 0 : 1
                  }}
                />
                <span
                  className="absolute w-full h-[2px] bg-gray-600 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    bottom: isMobileMenuOpen ? '50%' : '0',
                    transform: isMobileMenuOpen ? 'translateY(50%) rotate(-45deg)' : 'translateY(0) rotate(0deg)'
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="bg-white md:hidden" style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 2px 8px 0px' }}>
          <div className="px-6 py-4">
            {/* Auth Buttons */}
            <div className="space-y-2">
              <Link
                href="/login"
                className="block rounded-lg border text-center text-[15px] font-normal transition-colors"
                style={{
                  padding: '12px',
                  borderColor: 'rgba(34, 34, 34, 0.1)',
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(24, 24, 27)',
                  width: '100%'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block rounded-lg border border-white/12 text-center text-[15px] text-white transition-all hover:shadow-lg"
                style={{
                  padding: '12px',
                  background: 'linear-gradient(241deg, rgba(0, 0, 1) -10.49%, rgba(0, 0, 1) 106.38%)',
                  boxShadow: '0px 0px 6px 1px rgba(50, 61, 214, 0.1)',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  letterSpacing: '-0.15px',
                  width: '100%'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start learning
              </Link>
            </div>

            {/* Divider */}
            <div className="my-4" style={{ height: '1px', backgroundColor: 'rgb(212, 212, 216)' }}></div>

            {/* Nav Links */}
            <div className="space-y-1">
              <Link
                href="/features"
                className="block rounded-lg text-[15px] font-normal"
                style={{
                  padding: '12px',
                  color: 'rgb(63, 63, 70)',
                  backgroundColor: 'rgba(230, 230, 232, 0)',
                  transition: 'background-color 0.3s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="block rounded-lg text-[15px] font-normal"
                style={{
                  padding: '12px',
                  color: 'rgb(63, 63, 70)',
                  backgroundColor: 'rgba(230, 230, 232, 0)',
                  transition: 'background-color 0.3s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="block rounded-lg text-[15px] font-normal"
                style={{
                  padding: '12px',
                  color: 'rgb(63, 63, 70)',
                  backgroundColor: 'rgba(230, 230, 232, 0)',
                  transition: 'background-color 0.3s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/blog"
                className="block rounded-lg text-[15px] font-normal"
                style={{
                  padding: '12px',
                  color: 'rgb(63, 63, 70)',
                  backgroundColor: 'rgba(230, 230, 232, 0)',
                  transition: 'background-color 0.3s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 230, 232, 0)'}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
