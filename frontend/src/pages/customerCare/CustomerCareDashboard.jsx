import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  MessageSquare,
  Shield,
  Zap,
  Users,
  Menu,
  X,
  Phone,
} from 'lucide-react';

// Define the navigation categories and their links with icons and color classes
const navCategories = [
  {
    name: 'Main',
    icon: <LayoutDashboard size={20} />,
    colorClass: 'text-accent-foreground',
    links: [
      { name: 'Dashboard', path: '/customercare/dashboard', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    name: 'Tickets',
    icon: <MessageSquare size={20} />,
    colorClass: 'text-accent-foreground',
    links: [
      { name: 'All Tickets', path: '/customercare/tickets', icon: <MessageSquare size={20} /> },
      { name: 'Contact Supports', path: '/customercare/contact', icon: <Phone size={20} /> },
      { name: 'Assigned To Me', path: '/customercare/assigned-tickets', icon: <Shield size={20} /> },
      { name: 'Escalated Tickets', path: '/customercare/escalated-tickets', icon: <Zap size={20} /> },
    ],
  },
  {
    name: 'Users',
    icon: <Users size={20} />,
    colorClass: 'text-accent-foreground',
    links: [
      { name: 'View Users', path: '/customercare/users', icon: <Users size={20} /> },
    ],
  },
];

const sidebarVariants = {
  expanded: { width: '280px' }, // Slightly smaller expanded width
  collapsed: { width: '80px' }, // Smaller collapsed width
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const linkItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const CustomerCareDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getFullName = (firstName, lastName) => {
    const nameParts = [];
    if (firstName) nameParts.push(firstName);
    if (lastName) nameParts.push(lastName);
    return nameParts.join(' ') || 'Customer Care';
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-body">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3 }}
        className="relative flex-shrink-0 bg-card p-4 shadow-md overflow-y-auto border-r border-border"
      >
        <div className="flex items-center justify-between p-2 mb-6 border-b border-border pb-4">
          {isSidebarOpen && (
            <h1 className="text-2xl font-extrabold text-foreground whitespace-nowrap font-heading">
              EduConnect Support
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-secondary transition-colors duration-200"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* User Info Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-3 p-3 mb-6 rounded-lg bg-secondary border border-border ${
              isSidebarOpen ? 'flex-row' : 'flex-col text-center'
            }`}
          >
            <div className="w-10 h-10 flex-shrink-0">
              <img
                src={user.profileInfo?.avatar || "https://placehold.co/40x40/F5F5F5/BDBDBD?text=AV"}
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-primary"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-base text-foreground font-body">
                  {getFullName(user.profileInfo?.firstName, user.profileInfo?.lastName)}
                </span>
                <span className="text-sm text-muted-foreground truncate font-body">
                  {user.email}
                </span>
              </div>
            )}
          </motion.div>
        )}

        <nav className="space-y-4">
          {navCategories.map((category, index) => (
            <div key={index}>
              {isSidebarOpen ? (
                <div className={`flex items-center gap-2 px-2 py-2 mb-2 text-xs font-semibold uppercase tracking-wider ${category.colorClass} font-heading`}>
                  {category.icon}
                  <span>{category.name}</span>
                </div>
              ) : (
                <div className="flex justify-center p-2 mb-2">
                  <div className={`text-xl ${category.colorClass}`} title={category.name}>
                    {category.icon}
                  </div>
                </div>
              )}
              <motion.ul
                initial="hidden"
                animate={isSidebarOpen ? "visible" : "hidden"}
                variants={listVariants}
                className="space-y-2"
              >
                {category.links.map((link, subIndex) => (
                  <motion.li key={subIndex} variants={linkItemVariants}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg transition-all duration-200 p-3 text-sm font-body
                        ${isSidebarOpen ? 'gap-3' : 'justify-center'}
                        ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-muted hover:text-foreground'}`
                      }
                    >
                      {link.icon}
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="font-medium whitespace-nowrap"
                        >
                          {link.name}
                        </motion.span>
                      )}
                    </NavLink>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-background font-body">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerCareDashboard;
