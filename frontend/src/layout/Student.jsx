import React from 'react'; // Removed useMemo as it's no longer needed
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { NavLink, Outlet } from 'react-router-dom';
import {
  TrendingUp,
  Briefcase,
  FileText,
  MessageSquare,
  LayoutGrid,
  BookOpen,
  User,
  Settings,
} from 'lucide-react';
import Student from './StudentDashboard';

// Master list of ALL possible links with a unique 'key' for each.
const allPossibleLinks = [
  { key: 'dashboard', name: 'Dashboard', icon: <LayoutGrid />, path: '' },
  { key: 'my-courses', name: 'My Courses', icon: <BookOpen />, path: 'student/courses' },
  { key: 'roadmaps', name: 'Roadmaps', icon: <TrendingUp />, path: 'roadmaps' },
  { key: 'ats-checker', name: 'ATS Checker', icon: <FileText />, path: 'ats-resume-checker' },
  { key: 'interview-prep', name: 'Interview Prep', icon: <Briefcase />, path: 'interview-prep' },
  { key: 'resume-builder', name: 'Resume Builder', icon: <FileText />, path: 'resume-builder' },
  { key: 'my-resumes', name: 'My Resumes', icon: <FileText />, path: 'my-resumes' },
  { key: 'group-chat', name: 'Group Chat', icon: <MessageSquare />, path: 'groups' },
  // { key: 'profile', name: 'Profile', icon: <User />, path: 'profile' },
  { key: 'settings', name: 'Settings', icon: <Settings />, path: 'settings' },
];

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { mySubscriptions } = useSelector((state) => state.subscriptions);

  // ✅ CHANGE: We no longer filter the links. 
  // Every student will see all links from the master list.
  const visibleLinks = allPossibleLinks;

  if (!user || user.role !== 'student') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <h1 className="text-2xl text-destructive font-bold">Access Denied.</h1>
      </div>
    );
  }

  const currentPlanType = mySubscriptions?.activeSubscription?.subscription?.planType;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-card p-6 rounded-xl shadow-md border border-border text-center">
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Back, {user.username}!</h2>
          <p className="text-muted-foreground">Your personalized hub for academic and career growth.</p>
          {currentPlanType && (
            <p className="text-sm text-primary mt-2">
              Your Current Plan: <span className="font-semibold capitalize">{currentPlanType}</span>
            </p>
          )}
        </div>

        {/* Horizontal Scroller for Links */}
        <div className="w-full overflow-x-auto custom-scrollbar whitespace-nowrap py-2 px-1">
          <motion.div
            className="flex gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* The map function now iterates over the complete list */}
            {visibleLinks.map((link) => (
              <motion.div
                key={link.key}
                variants={itemVariants}
                className="inline-block"
              >
                <NavLink
                  to={link.path}
                  end={link.path === ''}
                  className={({ isActive }) =>
                    `flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300
                    ${isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-card text-foreground border-border hover:bg-muted/50'
                    }`
                  }
                >
                  {link.icon}
                  <span className="font-medium">{link.name}</span>
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        {/* Main Content Area (Outlet) */}
        <motion.div
          className="bg-card p-6 rounded-xl shadow-md border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Outlet /> 
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;