import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import {
  ShoppingBag,
  MessageSquare,
  ClipboardList,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatCount, setChatCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const fetchChatConversations = async () => {
      try {
        const res = await API.get("/chat/conversations");
        if (res.data.success && Array.isArray(res.data.data)) {
          setChatCount(
            location.pathname === "/chat" ? 0 : res.data.data.length,
          );
        }
      } catch (err) {
        console.error("Unable to fetch chat count:", err);
      }
    };

    if (user) {
      fetchChatConversations();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = () => {
      if (location.pathname === "/chat") {
        setChatCount(0);
      } else {
        setChatCount((count) => count + 1);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket, location.pathname]);

  const navLinks = [
    { name: "Dashboard", path: "/", icon: ShoppingBag },
    { name: "My Orders", path: "/orders", icon: ClipboardList },
    { name: "Chat", path: "/chat", icon: MessageSquare },
    { name: "Profile", path: "/profile", icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-primary-600 rounded-xl text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 font-sans">
                Campus<span className="text-primary-500">Mart</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                    {link.path === "/chat" && chatCount > 0 && (
                      <span className="absolute -top-1 -right-2 inline-flex min-w-[1.3rem] h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {chatCount > 99 ? "99+" : chatCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {user.isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive("/admin")
                      ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          )}

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Sell Product CTA */}
            {user && (
              <Link
                to="/add-product"
                className="flex items-center space-x-1.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md shadow-primary-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Item</span>
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-200"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {user && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl focus:outline-none"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && user && (
        <div className="md:hidden glass border-t border-slate-100 dark:border-slate-800/60 transition-all duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`relative flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium ${
                    isActive(link.path)
                      ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                  {link.path === "/chat" && chatCount > 0 && (
                    <span className="absolute -top-1 -right-2 inline-flex min-w-[1.3rem] h-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {chatCount > 99 ? "99+" : chatCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {user.isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium ${
                  isActive("/admin")
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Admin Panel</span>
              </Link>
            )}

            <Link
              to="/add-product"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-base font-medium bg-primary-600 text-white shadow-md shadow-primary-500/10"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Sell Item</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-3 py-2.5 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
