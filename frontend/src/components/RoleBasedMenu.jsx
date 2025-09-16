import React from 'react';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, BookOpen, Users, Settings, LogOut, MessageSquare, Briefcase, BarChart2, Star, User, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/store/redux/authSlice';
 

// Define the navigation links for each role
const roleLinks = {
  admin: [
    { name: 'Dashboard', icon: <LayoutGrid />, path: '/admin' },
    { name: 'Profile', icon: <User />, path: '/profile' },
    { name: 'Manage Users', icon: <Users />, path: '/admin/users' },
    { name: 'Analytics', icon: <BarChart2 />, path: '/admin/analytics' },
    { name: 'Settings', icon: <Settings />, path: '/admin/settings' },
  ],
  student: [
    { name: 'Dashboard', icon: <LayoutGrid />, path: '/student' },
    { name: 'My Courses', icon: <BookOpen />, path: '/student/courses' },
    { name: 'My Certificates', icon: <BookOpen />, path: '/student/certificates' },
    // { name: 'Roadmaps', icon: <TrendingUp />, path: '/roadmaps' },
    // { name: 'Interview Prep', icon: <Briefcase />, path: '/interview-prep' },
    // { name: 'ATS Checker', icon: <FileText />, path: '/ats-checker' },
    // { name: 'Group Chat', icon: <MessageSquare />, path: '/groups' },
    { name: 'Support', icon: <MessageSquare />, path: 'student/support' },
    { name: 'Profile', icon: <User />, path: '/profile' },
    { name: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  instructor: [
    { name: 'Dashboard', icon: <LayoutGrid />, path: '/instructor' },
    { name: 'Profile', icon: <User />, path: '/profile' },
    { name: 'My Courses', icon: <BookOpen />, path: '/instructor/courses' },
    { name: 'Student Reviews', icon: <Star />, path: '/instructor/reviews' },
    { name: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  customercare: [
    { name: 'Home', icon: <Home />, path: '/' },
    { name: 'Profile', icon: <User />, path: '/profile' },
    { name: 'Dashboard', icon: <LayoutGrid />, path: '/customercare' },
    { name: 'Support Tickets', icon: <Briefcase />, path: '/customercare/support' },
    { name: 'User Management', icon: <Users />, path: '/customercare/users' },
    { name: 'Settings', icon: <Settings />, path: '/settings' },
  ],
  guest: [
    { name: 'Home', icon: <Home />, path: '/' },
    { name: 'About', icon: <User />, path: '/about' },
    { name: 'Contact', icon: <MessageSquare />, path: '/contact' },
  ],
};

const RoleBasedMenu = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const role = user?.role || 'guest';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const links = roleLinks[role] || roleLinks.guest;

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="flex flex-col w-full min-w-[200px] items-start p-2 bg-card h-full">
      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2 w-full flex-1"
      >
        {links.map((link, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Link
              to={link.path}
              className="flex items-center gap-4 p-3 rounded-xl text-foreground hover:bg-input/70 transition-colors duration-200"
            >
              {link.icon}
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          </motion.div>
        ))}
      </motion.nav>

      {role !== 'guest' && (
        <motion.div className="w-full mt-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors duration-200 w-full"
          >
            <LogOut />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default RoleBasedMenu;