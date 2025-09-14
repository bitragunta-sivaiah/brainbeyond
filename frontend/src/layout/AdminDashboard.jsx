import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  Users,
  Book,
  DollarSign,
  Gift,
  HelpCircle,
  Megaphone,
  ShoppingBag,
  Bell,
  MessageCircle,
  Mail,
  Grid,
  Menu,
  X,
  Code,
  Newspaper,
  ZoomIn,
  Package,
  Calendar,
  Layers,
  BriefcaseBusiness,
  Headphones,
  Settings,
  Home, // Added Home icon for Homepage link
  Phone
} from 'lucide-react';
import { MdMeetingRoom } from 'react-icons/md';
import { SiAdminer } from 'react-icons/si';

// Sidebar navigation links data, now organized into categories with colors
const navCategories = [
  {
    name: 'Main',
    icon: <Layers size={20} />,
    // Using custom CSS variables for adaptive colors
    colorClass: 'text-category-main',
    links: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <Grid size={20} /> },
      { name: 'Admin Data Access', path: '/admin/history-access', icon: <SiAdminer size={20} /> },
    ],
  },
  {
    name: 'Content & Community',
    icon: <Book size={20} />,
    colorClass: 'text-category-content',
    links: [
      { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
      { name: 'Courses', path: '/admin/courses', icon: <Book size={20} /> },
      { name: 'Courses Chapters', path: '/admin/courses/chapters', icon: <Book size={20} /> },
      { name: 'Hero', path: '/admin/hero', icon: <Home size={20} /> }, // Added Homepage link
      { name: 'Blog', path: '/admin/blog', icon: <Newspaper size={20} /> },
      { name: 'Groups & Chats', path: '/admin/groups', icon: <MessageCircle size={20} /> },
      { name: 'Events', path: '/admin/events', icon: <Calendar size={20} /> },
    ],
  },
  {
    name: 'Promotions & Sales',
    icon: <BriefcaseBusiness size={20} />,
    colorClass: 'text-category-promo',
    links: [
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: <DollarSign size={20} /> },
      { name: 'Coupons', path: '/admin/coupons', icon: <Gift size={20} /> },
      { name: 'Purchases', path: '/admin/purchases', icon: <ShoppingBag size={20} /> },
      { name: 'Ads', path: '/admin/ads&Announcement', icon: <ZoomIn size={20} /> },
    ],
  },
  {
    name: 'Communications',
    icon: <Headphones size={20} />,
    colorClass: 'text-category-comm',
    links: [
      { name: 'Marquee', path: '/admin/marquee', icon: <Code size={20} /> },
      { name: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
      { name: 'Customer Support', path: '/admin/support', icon: <Mail size={20} /> },
      { name: 'Contact Supports', path: '/admin/contact', icon: <Phone size={20} /> },
    ],
  },
  {
    name: 'System & Utilities',
    icon: <Settings size={20} />,
    colorClass: 'text-category-system',
    links: [
      { name: 'FAQs', path: '/admin/faqs', icon: <HelpCircle size={20} /> },
 
    ],
  },
];

const sidebarVariants = {
  expanded: { width: '300px' },
  collapsed: { width: '100px' },
};

// Variants for the container of links, used for staggering
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Stagger delay between children
      delayChildren: 0.1,    // Initial delay before first child animates
    },
  },
};

// Variants for individual link items
const linkItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth); // Assuming auth slice is in Redux store

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getFullName = (firstName, lastName) => {
    const nameParts = [];
    if (firstName) nameParts.push(firstName);
    if (lastName) nameParts.push(lastName);
    return nameParts.join(' ') || 'Admin User';
  };

  return (
    <div className="flex  max-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3 }}
        className="relative flex-shrink-0 bg-card p-4 shadow-md overflow-y-auto"
      >
        <div className="flex items-center justify-between p-2 mb-6">
          {isSidebarOpen && (
            <h1 className="text-xl font-heading font-bold text-primary whitespace-nowrap">Admin Dashboard</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-muted text-muted-foreground hover:bg-secondary transition-colors"
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
            className={`flex items-center gap-4 p-4 mb-6 rounded-xl bg-secondary ${
              isSidebarOpen ? 'flex-row' : 'flex-col text-center'
            }`}
          >
            <div className="w-12 h-12 flex-shrink-0">
              <img
                src={user.profileInfo?.avatar || "https://placehold.co/48x48/F5F5F5/BDBDBD?text=Avatar"}
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover border-2 border-primary"
              />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-base font-heading">
                  {getFullName(user.profileInfo?.firstName, user.profileInfo?.lastName)}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            )}
          </motion.div>
        )}

        <nav>
          {navCategories.map((category, index) => (
            <div key={index} className="mb-6">
              {isSidebarOpen ? (
                <div className={`flex items-center gap-2 p-2 mb-2 text-sm font-bold uppercase ${category.colorClass}`}>
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
              >
                {category.links.map((link, subIndex) => (
                  <motion.li key={subIndex} className="mb-4" variants={linkItemVariants}>
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg transition-colors duration-200 p-3
                          ${isSidebarOpen ? 'ml-4 gap-4' : 'justify-center'}
                          ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted hover:shadow-sm'}`
                      }
                      // Removed whileHover from NavLink and applied direct hover classes for smoother effect
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
      <main className="flex-1 max-h-screen overflow-y-auto   ">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
