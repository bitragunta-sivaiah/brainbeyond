import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { ResponsiveBar } from '@nivo/bar';
import {
  DollarSign,
  Users,
  Star,
  BookOpen,
  MessageSquare,
  Clipboard,
  Activity,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { FaGraduationCap, FaMoneyBillWave, FaStarHalfAlt } from 'react-icons/fa';
import { MdOutlineAnnouncement } from 'react-icons/md';
import { RiFileListFill } from 'react-icons/ri';
import { fetchInstructorDashboard } from '../store/redux/analysisSlice';

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((state) => state.dashboard.instructor);

  useEffect(() => {
    dispatch(fetchInstructorDashboard());
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
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
        />
        <span className="ml-4">Loading instructor dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-lg">Error: {error}</div>;
  }

  if (!data) {
    return <div className="flex items-center justify-center min-h-screen text-lg">No data available.</div>;
  }

  const {
    summary,
    myCourses,
    content,
    engagement,
    upcomingClasses
  } = data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Nivo Radial Bar Chart Data
  const getRatingData = (myCourses) => {
    if (!myCourses || myCourses.length === 0) return [];
    
    // Group courses by rating rounded to the nearest integer
    const ratingCounts = myCourses.reduce((acc, course) => {
      const roundedRating = Math.round(course.rating);
      acc[roundedRating] = (acc[roundedRating] || 0) + 1;
      return acc;
    }, {});

    // Create a data array for the chart
    return Object.entries(ratingCounts).map(([rating, count]) => ({
      id: `${rating} Stars`,
      data: [{ x: `${rating} Stars`, y: count }]
    }));
  };

  // Nivo Bar Chart Data for Course Students
  const getCourseStudentData = (myCourses) => {
    if (!myCourses) return [];
    return myCourses.map(course => ({
      course: course.title,
      students: course.totalStudents,
    }));
  };

  // Transform recentDoubts data for the list
  const recentDoubtsTransformed = engagement.recentDoubts?.map(doubt => ({
    question: doubt.question,
    status: doubt.status,
    lessonTitle: doubt.lessonTitle,
  }));

  return (
    <motion.div
      className="p-8 bg-background text-foreground min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Instructor Dashboard</h1>
        <p className="text-muted-foreground mt-2">Personalized insights into your courses and earnings.</p>
      </header>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <FaGraduationCap className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Total Enrolled Students</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalEnrolledStudents || 0}</h2>
        </motion.div>
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <FaMoneyBillWave className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Total Earnings</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{formatCurrency(summary?.totalEarnings || 0)}</h2>
        </motion.div>
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <FaStarHalfAlt className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Average Course Rating</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{summary?.averageCourseRating || 0}</h2>
        </motion.div>
        <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border flex flex-col items-center text-center" variants={cardVariants}>
          <MdOutlineAnnouncement className="text-primary mb-3" size={32} />
          <p className="text-muted-foreground font-medium text-sm">Total Announcements</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalAnnouncements || 0}</h2>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.section className="col-span-1 lg:col-span-2 space-y-8" variants={containerVariants}>
          
          {/* My Courses Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><BookOpen className="text-primary" />My Courses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myCourses.length > 0 ? (
                myCourses.map(course => (
                  <motion.div
                    key={course.slug}
                    className="group relative overflow-hidden rounded-xl shadow-sm border border-border cursor-pointer transition-all duration-300 hover:shadow-lg"
                    whileHover={{ y: -5 }}
                    variants={cardVariants}
                  >
                    <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h4 className="font-semibold text-lg truncate text-foreground">{course.title}</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Users size={16} className="mr-1" />
                        <span>{course.totalStudents} Students</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Layers size={16} className="mr-1" />
                        <span>{course.totalLessons} Lessons</span>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-sm font-medium">
                        <span className="text-accent-foreground flex items-center">
                          <Star size={16} className="mr-1 fill-current" />
                          {course.rating.toFixed(1)} Rating
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground col-span-2">You haven't created any courses yet.</p>
              )}
            </div>
          </motion.div>

          {/* Engagement & Activity Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Activity className="text-primary" />Recent Engagement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-foreground"><Star className="text-secondary-foreground" />Latest Reviews</h4>
                <ul className="space-y-4">
                  {engagement.recentCourseReviews?.length > 0 ? (
                    engagement.recentCourseReviews.map((review, index) => (
                      <li key={index} className="p-4 bg-muted rounded-xl flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-foreground">{review.courseTitle}</p>
                          <div className="flex items-center text-sm text-yellow-500">
                            <Star size={14} className="fill-current mr-1" />
                            <span>{review.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">"{review.comment.substring(0, 70)}..."</p>
                      </li>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No recent reviews.</p>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-foreground"><MessageSquare className="text-secondary-foreground" />Recent Doubts</h4>
                <ul className="space-y-4">
                  {recentDoubtsTransformed?.length > 0 ? (
                    recentDoubtsTransformed.map((doubt, index) => (
                      <li key={index} className="p-4 bg-muted rounded-xl flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-foreground truncate">{doubt.lessonTitle}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${doubt.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {doubt.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{doubt.question.substring(0, 70)}...</p>
                      </li>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No recent doubts.</p>
                  )}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Sidebar */}
        <motion.section className="col-span-1 space-y-8" variants={containerVariants}>
          
          {/* Charts Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Sparkles className="text-primary" />Course Insights</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="h-[250px] w-full bg-muted rounded-xl p-4">
                <h4 className="text-lg font-semibold text-center mb-2">Student Distribution</h4>
                <ResponsiveBar
                  data={getCourseStudentData(myCourses)}
                  keys={['students']}
                  indexBy="course"
                  margin={{ top: 10, right: 10, bottom: 90, left: 50 }}
                  padding={0.3}
                  colors={{ scheme: 'paired' }}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Courses',
                    legendPosition: 'middle',
                    legendOffset: 60,
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Students',
                    legendPosition: 'middle',
                    legendOffset: -40,
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  theme={{
                    textColor: 'var(--foreground)',
                    axis: {
                      legend: {
                        text: {
                          fill: 'var(--foreground)',
                          fontSize: 14,
                        },
                      },
                      ticks: {
                        text: {
                          fill: 'var(--muted-foreground)',
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="h-[250px] w-full bg-muted rounded-xl p-4">
                <h4 className="text-lg font-semibold text-center mb-2">Rating Breakdown</h4>
                <ResponsiveRadialBar
                  data={getRatingData(myCourses)}
                  keys={['y']}
                  valueFormat=">-.2f"
                  startAngle={-90}
                  endAngle={90}
                  padding={0.02}
                  cornerRadius={2}
                  margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                  enableTracks={false}
                  colors={{ scheme: 'set2' }}
                  radialLabel={d => d.name}
                  barAriaLabel={e => e.id + ": " + e.formattedValue + " total reviews"}
                />
              </div>
            </div>
          </motion.div>

          {/* Upcoming Live Classes Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Calendar className="text-primary" />Upcoming Classes</h3>
            <ul className="space-y-4">
              {upcomingClasses?.length > 0 ? (
                upcomingClasses.map((liveClass) => (
                  <li key={liveClass._id} className="p-3 bg-muted rounded-lg flex items-center space-x-3">
                    <div className="p-2 bg-secondary rounded-full">
                      <RiFileListFill className="text-primary" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground truncate">{liveClass.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(liveClass.startTime).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No upcoming live classes scheduled.</p>
              )}
            </ul>
          </motion.div>

          {/* Recent Blog Posts Section */}
          <motion.div className="bg-card p-6 rounded-2xl shadow-md border border-border" variants={cardVariants}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground"><Clipboard className="text-primary" />My Blog Posts</h3>
            <ul className="space-y-4">
              {content.myBlogPosts?.length > 0 ? (
                content.myBlogPosts.map((post) => (
                  <li key={post._id} className="p-3 bg-muted rounded-lg border-l-4 border-accent">
                    <h4 className="font-semibold text-foreground">{post.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-center text-muted-foreground">You haven't published any blog posts yet.</p>
              )}
            </ul>
          </motion.div>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default InstructorDashboard;