import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BookOpen, Award, CheckCircle } from 'lucide-react';
import { IoIosArrowForward } from 'react-icons/io';
import { Link } from 'react-router-dom';
import { fetchMyCourses } from '../store/redux/studentCourseSlice'; // Adjust path
import { TbProgress, TbProgressCheck } from 'react-icons/tb';

const MyCourses = () => {
  const dispatch = useDispatch();
  const { myCourses, status, error } = useSelector((state) => state.studentCourses);

  useEffect(() => {
    dispatch(fetchMyCourses());
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-t-4 border-primary border-t-transparent rounded-full"
        ></motion.div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-destructive text-xl font-heading">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-8 md:p-12 lg:p-16 bg-background text-foreground min-h-screen font-body"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display mb-8 lg:mb-12 text-primary tracking-tighter">
        My Courses
      </h1>

      {myCourses.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-xl shadow-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <BookOpen size={64} className="text-custom mb-4" />
          <h2 className="text-xl sm:text-2xl md:text-3xl font-heading text-foreground mb-2">
            You haven't enrolled in any courses yet.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore our collection of courses and start your learning journey!
          </p>
          <Link
            to="/courses"
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg hover:bg-opacity-90 transition-all duration-300"
          >
            Browse Courses
          </Link>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
        >
          {myCourses.map((course, index) => (
            <motion.div
              key={course._id}
              className="relative p-6 bg-card rounded-xl shadow-lg border border-border flex flex-col justify-between overflow-hidden group hover:shadow-2xl transition-all duration-300"
              variants={itemVariants}
            >
              <Link to={`/courses/${course.slug}/progress`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl lg:text-2xl font-heading text-foreground group-hover:text-primary transition-colors duration-300">
                    {course.title}
                  </h3>
                  <IoIosArrowForward className="text-custom group-hover:text-primary transition-colors duration-300" />
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-custom">
                  Progress: {course.progress || 0}%
                </span>

                <div className="flex flex-wrap items-center mt-4 text-xs font-semibold text-custom">
                  <span className="flex items-center mr-4">
                    <BookOpen size={16} className="mr-1 text-primary" />
                    {course.totalLessons} Lessons
                  </span>
                  {course.progress === 100 && (
                    <span className="flex items-center text-primary-foreground bg-primary px-2 py-1 rounded-full">
                      <CheckCircle size={16} className="mr-1" />
                      Completed
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MyCourses;