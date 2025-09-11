import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Bell,
  Layers,
  Repeat,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { FaBookReader, FaRegCalendarAlt, FaRegQuestionCircle } from 'react-icons/fa';
import { GiNotebook } from 'react-icons/gi';
import { fetchStudentDashboard } from '../store/redux/analysisSlice';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.dashboard.student);

  useEffect(() => {
    dispatch(fetchStudentDashboard());
  }, [dispatch]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-lg text-foreground bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
        <span className="mt-4">Loading student dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold">Error Loading Dashboard</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg bg-background text-muted-foreground">
        No data available.
      </div>
    );
  }

  const {
    progressSummary,
    myCourses,
    upcomingSchedule,
    notifications,
    engagement,
    financials,
    community
  } = data;

  const formatProgress = (value) => `${value.toFixed(0)}%`;

  return (
    <motion.div
      className=" md:p-8 bg-background text-foreground min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight font-display">Student Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2 font-body">Your learning journey at a glance.</p>
      </header>
      
      {/* Progress Summary Section */}
      <motion.section
        className="bg-card p-6 rounded-2xl shadow-md border border-border mb-8"
        variants={cardVariants}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <FaBookReader className="text-primary" size={24} />
            <h3 className="text-2xl font-bold text-foreground font-heading">Progress Summary</h3>
          </div>
          <p className="text-lg font-semibold text-primary">{formatProgress(progressSummary.averageProgress)} Average Progress</p>
        </div>
        <div className="w-full bg-muted rounded-full h-4 relative">
          <motion.div
            className="h-4 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressSummary.averageProgress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-4 flex justify-between items-center text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen size={16} />
            <span>{progressSummary.totalEnrolledCourses} Courses Enrolled</span>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area: Courses and Doubts */}
        <motion.section className="col-span-1 lg:col-span-2 space-y-8" variants={containerVariants}>
          
          {/* My Courses Section */}
          <motion.div className="bg-card p-2 md:p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground font-heading"><GiNotebook className="text-primary" />My Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCourses?.length > 0 ? (
                myCourses.map(course => (
                  <motion.div
                    key={course.course?._id}
                    className="relative overflow-hidden rounded-xl shadow-sm border border-border group transition-all duration-300 hover:shadow-lg"
                    whileHover={{ y: -5 }}
                  >
                    <img src={course.course?.thumbnail} alt={course.course?.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h4 className="font-semibold text-lg truncate text-foreground font-heading">{course.course?.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Layers size={16} className="mr-1" />
                        <span>{course.completedLessons} of {course.course?.totalLessons} Lessons Completed</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <motion.div
                          className="h-2 bg-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.overallProgress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <p className="text-sm font-medium text-right mt-1 text-accent-foreground">{formatProgress(course.overallProgress)}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground col-span-2">You haven't enrolled in any courses yet.</p>
              )}
            </div>
          </motion.div>

          {/* Recent Doubt Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground font-heading"><FaRegQuestionCircle className="text-primary" />Your Recent Doubt</h3>
            {engagement.recentDoubt ? (
              <div className="p-4 bg-muted rounded-xl border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">Doubt in: <span className="font-semibold">{engagement.recentDoubt.lessonTitle}</span></p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${engagement.recentDoubt.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {engagement.recentDoubt.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">"{engagement.recentDoubt.doubt}"</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">You haven't asked any recent questions.</p>
            )}
          </motion.div>
        </motion.section>

        {/* Sidebar: Schedule, Announcements, and Community */}
        <motion.section className="col-span-1 space-y-8" variants={containerVariants}>
          
          {/* Upcoming Live Classes Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground font-heading"><FaRegCalendarAlt className="text-primary" />My Schedule</h3>
            <ul className="space-y-4">
              {upcomingSchedule?.upcomingLiveClasses?.length > 0 ? (
                upcomingSchedule.upcomingLiveClasses.map((liveClass) => (
                  <li key={liveClass._id} className="p-3 bg-muted rounded-lg flex items-start space-x-3 border-l-4 border-accent">
                    <div className="p-2 bg-secondary rounded-full flex-shrink-0">
                      <Calendar className="text-primary" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground truncate">{liveClass.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Course:</span> {liveClass.course?.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Time:</span> {new Date(liveClass.startTime).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No upcoming live classes scheduled.</p>
              )}
            </ul>
          </motion.div>

          {/* Recent Announcements Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground font-heading"><Bell className="text-primary" />Recent Announcements</h3>
            <ul className="space-y-4">
              {notifications?.recentAnnouncements?.length > 0 ? (
                notifications.recentAnnouncements.map((announcement) => (
                  <li key={announcement._id} className="p-3 bg-muted rounded-lg border-l-4 border-accent">
                    <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{announcement.content}</p>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No recent announcements.</p>
              )}
            </ul>
          </motion.div>

          {/* Community and Subscriptions */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground font-heading"><MessageCircle className="text-primary" />Community & Subscriptions</h3>
            <ul className="space-y-4">
              {financials?.mySubscriptions?.length > 0 && (
                <li className="p-3 bg-muted rounded-lg flex flex-col">
                  <h4 className="font-semibold text-foreground mb-1">Subscriptions</h4>
                  {financials.mySubscriptions.map((sub) => (
                    <div key={sub._id} className="flex items-center text-sm text-muted-foreground mt-1">
                      <DollarSign size={16} className="mr-2 text-green-500" />
                      <span>{sub.subscription?.name} - {sub.subscription?.pricing?.billingCycle}</span>
                    </div>
                  ))}
                </li>
              )}
              {community?.myGroupChats?.length > 0 && (
                <li className="p-3 bg-muted rounded-lg flex flex-col">
                  <h4 className="font-semibold text-foreground mb-1">My Group Chats</h4>
                  {community.myGroupChats.map((chat) => (
                    <div key={chat._id} className="flex items-center text-sm text-muted-foreground mt-1">
                      <Repeat size={16} className="mr-2 text-secondary-foreground" />
                      <span>{chat.name}</span>
                    </div>
                  ))}
                </li>
              )}
              {(financials?.mySubscriptions?.length === 0 && community?.myGroupChats?.length === 0) && (
                <p className="text-center text-muted-foreground">No subscriptions or group chats found.</p>
              )}
            </ul>
          </motion.div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default StudentDashboard;