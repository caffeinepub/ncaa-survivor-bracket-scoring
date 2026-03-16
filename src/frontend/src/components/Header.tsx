import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Trophy, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/enter", label: "Enter" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/admin", label: "Admin" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  const getLinkClass = (href: string, mobile = false) => {
    const active = isActive(href);

    if (mobile) {
      return active
        ? "block px-4 py-2 rounded-md text-sm font-semibold bg-gold/20 text-gold transition-all"
        : "block px-4 py-2 rounded-md text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all";
    }

    return active
      ? "px-4 py-2 rounded-md text-sm font-semibold bg-white/10 text-white transition-all"
      : "px-4 py-2 rounded-md text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all";
  };

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-gold/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            data-ocid="nav.link"
          >
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-navy" />
            </div>
            <div className="hidden sm:block">
              <span className="text-gold font-black text-lg tracking-tight leading-none">
                NCAA
              </span>
              <span className="text-white font-bold text-lg tracking-tight leading-none ml-1">
                SURVIVOR
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                data-ocid={`nav.${link.label.toLowerCase()}.link`}
                className={getLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-dark border-t border-gold/20 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              data-ocid={`nav.mobile.${link.label.toLowerCase()}.link`}
              className={getLinkClass(link.href, true)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
