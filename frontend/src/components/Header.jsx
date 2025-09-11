import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  ChevronDown,
  Bell,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../store/redux/authSlice";
import { fetchUnreadCount } from "../store/redux/notificationSlice"; 
import RoleBasedMenu from "./RoleBasedMenu";
import notificationSound from '../assets/notification.wav';

// Assuming ThemeContext and ThemeProvider are correctly implemented
const ThemeContext = createContext(null);

const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.error("useTheme must be used within a ThemeProvider");
    return { theme: "light", setTheme: () => {} };
  }
  return context;
};

const BrandLogo = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-primary transition-colors duration-300"
    fill="currentColor"
  >
    <title>Brain Beyond</title>
    <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
  </svg>
);

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full text-foreground hover:bg-muted focus:outline-none p-3 transition-colors duration-300"
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {theme === "light" && (
            <motion.div
              key="sun"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Sun className="h-5 w-5" />
            </motion.div>
          )}
          {theme === "dark" && (
            <motion.div
              key="moon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Moon className="h-5 w-5" />
            </motion.div>
          )}
          {theme === "system" && (
            <motion.div
              key="laptop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <Laptop className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 z-50 w-32 bg-card rounded-sm p-1 shadow-accent shadow overflow-hidden"
          >
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm rounded-t-sm text-foreground hover:bg-muted"
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm rounded-b-sm text-foreground hover:bg-muted"
            >
              <Laptop className="h-4 w-4" /> System
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavLink = ({ to, children }) => (
  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
    <Link to={to} className="text-foreground hover:text-primary relative group">
      {children}
      <span className="absolute left-0 -bottom-1 h-0.5 w-full bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </Link>
  </motion.div>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors duration-200"
  >
    {children}
  </Link>
);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for notification sound logic
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const audioRef = useRef(new Audio(notificationSound));

  const user = useSelector((state) => state.auth.user);
  const { unreadCount } = useSelector((state) => state.notifications);
  const { status: notificationsStatus } = useSelector((state) => state.notifications);

  useEffect(() => {
    // Only fetch if a user is logged in and not already loading or succeeded
    if (user && notificationsStatus === 'idle') {
      dispatch(fetchUnreadCount());
    }
  }, [dispatch, user, notificationsStatus]);

  useEffect(() => {
    // Play sound if a new notification arrives
    if (user && unreadCount > prevUnreadCount) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          audioRef.current.play();
        }, i * 1500); // Play sound 3 times with a 1.5-second delay
      }
    }
    // Update the previous count for the next check
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, user, prevUnreadCount]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setIsUserDropdownOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <ThemeProvider>
      <header className="sticky top-0 z-50 w-full bg-background backdrop-blur-lg font-body border-b border-border">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              className="flex-shrink-0 flex items-center group relative"
              whileHover={{ scale: 1.05 }}
            >
              <Link to="/" className="flex items-center gap-2">
                <BrandLogo />
                <h1 className="text-2xl hidden md:block font-heading text-foreground tracking-tight font-bold transition-colors duration-300">
                  <span className="font-display font-bold text-foreground">Brain <span className="text-primary">Beyond</span></span>
                </h1>
              </Link>
              <motion.div
                className="absolute top-full mt-2 ml-4 left-1/2 -translate-x-1/2 p-1 px-3 bg-popover text-popover-foreground rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-300"
                initial={{ y: 5 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="whitespace-nowrap text-xs font-body">
                  Higher Degrees Solution
                </span>
              </motion.div>
            </motion.div>

            <div className="hidden md:flex items-center space-x-6 font-body">
              <NavLink to="/courses">Courses</NavLink>
              {/* <NavLink to="/dashboard">Dashboard</NavLink> */}
              <NavLink to="/pricing">Pricing</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </div>

            <div className="flex items-center md:gap-4 gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative p-2 rounded-full text-foreground hover:bg-muted focus:outline-none transition-colors duration-300 ${unreadCount > 0 ? 'animate-bell-ring' : ''}`}
                aria-label="Notifications"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                )}
              </motion.button>
              <ThemeToggle />

              {user ? (
                <div className="relative hidden md:block" ref={userDropdownRef}>
                  <motion.button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 rounded-full text-foreground hover:bg-muted focus:outline-none p-2 transition-colors duration-300"
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={
                        user.profileInfo?.avatar ||
                        "https://placehold.co/40x40/aabbcc/ffffff?text=U"
                      }
                      alt={`${user.username || "User"}'s avatar`}
                      className="w-10 h-10 rounded-full object-cover ring-3 ring-primary p-0.5"
                    />
                    <span className="hidden lg:block font-medium font-heading text-sm">
                      {user.username || "User"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isUserDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isUserDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-fit min-w-[150px] bg-card rounded-xl border border-border shadow-sm overflow-hidden z-10"
                      >
                        <RoleBasedMenu />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/login"
                      className="px-4 py-2 text-md font-medium font-heading text-foreground border border-border rounded-full hover:bg-muted transition-colors duration-300"
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/signup"
                      className="px-4 py-2 text-md font-medium font-heading text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors duration-300"
                    >
                      Sign Up
                    </Link>
                  </motion.div>
                </div>
              )}

              <div className="md:hidden flex items-center gap-2">
                {user ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                    ref={userDropdownRef}
                  >
                    <motion.button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 rounded-full text-foreground hover:bg-muted focus:outline-none transition-colors duration-300"
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={
                          user.profileInfo?.avatar ||
                          "https://placehold.co/40x40/aabbcc/ffffff?text=U"
                        }
                        alt={`${user.username || "User"}'s avatar`}
                        className="w-10 h-10 rounded-full object-cover ring-3 ring-primary p-0.5"
                      />
                    </motion.button>
                    <AnimatePresence>
                      {isUserDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute -right-[100%] mt-2 w-fit min-w-[150px] bg-card rounded-md border border-border shadow overflow-hidden z-10"
                        >
                          <RoleBasedMenu />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/login"
                      className="px-3 py-1.5 text-md font-medium font-heading text-foreground border border-border rounded-full hover:bg-muted transition-colors duration-300"
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-foreground hover:bg-muted focus:outline-none"
                  aria-label="Open menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-card/90 backdrop-blur-md border-t border-border"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 font-body">
                <MobileNavLink
                  to="/courses"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Courses
                </MobileNavLink>
                {/* <MobileNavLink
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </MobileNavLink> */}
                <MobileNavLink
                  to="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </MobileNavLink>
                <MobileNavLink
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </MobileNavLink>
                <MobileNavLink
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </MobileNavLink>
                <div className="border-t border-border mt-2 pt-2" />
                {user ? (
                  <MobileNavLink
                    to="#"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </MobileNavLink>
                ) : (
                  <MobileNavLink
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </MobileNavLink>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </ThemeProvider>
  );
};

export default Header;