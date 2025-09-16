import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  BookOpen,
  BookPlus,
  Book,
  BookText,
  Rss,
  Megaphone,
  MessageSquare,
  CalendarDays,
  LayoutDashboard,
  Menu,
  X,
  Home,
  Users,
} from 'lucide-react';

// Define the navigation categories and their links with new icons and color classes
const navCategories = [
  {
    name: 'Main',
    icon: <LayoutDashboard size={20} />,
    // These colorClass names will now map to your custom CSS variables via Tailwind's theming
    colorClass: 'text-accent-foreground', // Using accent-foreground from your palette
    links: [
      { name: 'Dashboard', path: '/instructor/dashboard', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    name: 'Content',
    icon: <BookOpen size={20} />,
    colorClass: 'text-accent-foreground', // Using accent-foreground
    links: [
      { name: 'Create Course', path: '/instructor/create-Course', icon: <BookPlus size={20} /> },
      { name: 'My Courses', path: '/instructor/courses', icon: <Book size={20} /> },
      { name: 'My Course Chapters', path: '/instructor/courses-content', icon: <BookText size={20} /> },
      { name: 'Blog', path: '/instructor/blog', icon: <Rss size={20} /> },
 
    ],
  },
  {
    name: 'Community & Events',
    icon: <Users size={20} />,
    colorClass: 'text-accent-foreground', // Using accent-foreground
    links: [
      { name: 'Announcements', path: '/instructor/announcements', icon: <Megaphone size={20} /> },
      { name: 'Group Chat', path: '/instructor/groups', icon: <MessageSquare size={20} /> },
 
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

const InstructorDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getFullName = (firstName, lastName) => {
    const nameParts = [];
    if (firstName) nameParts.push(firstName);
    if (lastName) nameParts.push(lastName);
    return nameParts.join(' ') || 'Instructor';
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-body"> {/* Using custom background, foreground, and font */}
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
        transition={{ duration: 0.3 }}
        className="relative flex-shrink-0 bg-card p-4 shadow-md overflow-y-auto border-r border-border"  
      >
        <div className="flex items-center justify-between p-2 mb-6 border-b border-border pb-4"> {/* Using custom border */}
          {isSidebarOpen && (
            <h1 className="text-2xl font-extrabold text-foreground whitespace-nowrap font-heading"> {/* Using custom foreground and heading font */}
              EduConnect Admin
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
            className={`flex items-center gap-3 p-3 mb-6 rounded-lg bg-secondary border border-border ${ /* Using custom secondary and border */
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
                <span className="font-semibold text-base text-foreground font-body"> {/* Using custom foreground and body font */}
                  {getFullName(user.profileInfo?.firstName, user.profileInfo?.lastName)}
                </span>
                <span className="text-sm text-muted-foreground truncate font-body"> {/* Using custom muted-foreground and body font */}
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
                <div className={`flex items-center gap-2 px-2 py-2 mb-2 text-xs font-semibold uppercase tracking-wider ${category.colorClass} font-heading`}> {/* Using custom heading font */}
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
                        ${isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:bg-muted hover:text-foreground'}` // Using custom primary, primary-foreground, foreground, and muted
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
      <main className="flex-1 overflow-y-auto p-6 bg-background font-body"> {/* Using custom background and body font */}
        <Outlet />
      </main>
    </div>
  );
};

export default InstructorDashboard;
