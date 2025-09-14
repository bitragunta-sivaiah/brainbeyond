import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAllCourses } from '../store/redux/courseSlice';
import { motion } from 'framer-motion';
import { FaChalkboardTeacher, FaStar, FaInfoCircle } from 'react-icons/fa';

const Courses = () => {
    const dispatch = useDispatch();
    const { courses, status, error } = useSelector((state) => state.course);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchAllCourses());
        }
    }, [status, dispatch]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'beginner':
                return 'bg-secondary text-primary';
            case 'intermediate':
                return 'bg-accent text-accent-foreground';
            case 'advanced':
                return 'bg-destructive/20 text-destructive';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 10 },
        },
    };

    return (
        <div className="p-4 md:p-8 bg-background text-foreground min-h-screen">
            <div className="max-w-7xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-primary font-display"
                >
                    Discover Your Next Course 🚀
                </motion.h1>
                 
                {status === 'loading' && (
                    <div className="flex justify-center items-center h-64">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-primary rounded-full"
                        />
                    </div>
                )}
                 
                {status === 'failed' && (
                    <div className="text-center text-destructive text-lg font-semibold">
                        <p>Error: Failed to load courses. Please try again later.</p>
                    </div>
                )}
                 
                {status === 'succeeded' && courses.length === 0 && (
                    <div className="text-center text-muted-foreground text-lg">
                        No courses available at the moment.
                    </div>
                )}
                 
                {status === 'succeeded' && courses.length > 0 && (
                    <motion.div
                        className="flex flex-wrap md:justify-center gap-10"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                        {courses.map((course) => (
                            <motion.div
                                key={course._id}
                                className="bg-card text-card-foreground max-w-[350px] rounded-md shadow hover:shadow-sm overflow-hidden flex flex-col transition-all duration-500 group border border-border"
                                variants={cardVariants}
                                whileHover={{ scale: 1.05, translateY: -5 }}
                            >
                                <div className="relative w-full h-56 overflow-hidden">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {course.isFeatured && (
                                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-6">
                                            Featured
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 md:p-5 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
                                            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                                        </span>
                                        <div className="flex items-center gap-1 text-accent-foreground">
                                            <FaStar size={14} />
                                            <span className="text-sm font-semibold text-foreground">{course.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <h3 className="md:text-xl text-md font-heading text-foreground mb-2 line-clamp-2">
                                        {course.title}
                                    </h3>

                                    <p className="md:text-sm text-xs text-muted-foreground mb-4 line-clamp-3">
                                        {course.shortDescription}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 text-sm text-custom mt-auto">
                                        <FaChalkboardTeacher size={16} className="text-primary" />
                                        <span className="font-medium">
                                            {course.instructors && course.instructors.length > 0
                                                ? course.instructors.map(inst => inst.username).join(', ')
                                                : 'Unknown Instructor'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                        <div className="flex items-center gap-1 text-xl font-bold">
                                            <span className={`${course.isFree ? 'text-primary' : 'text-primary'}`}>
                                                ₹ {course.isFree ? 'Free' : course.discountedPrice > 0 ? course.discountedPrice : course.price}
                                            </span>
                                            {course.discountedPrice > 0 && (
                                                <span className="text-muted-foreground line-through text-sm ml-1">
                                                    {course.price}
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            to={`/courses/${course.slug}`}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg   group-hover:opacity-100 transition-all duration-300 ease-in-out font-medium flex items-center gap-2"
                                        >
                                            <FaInfoCircle size={16} />
                                            Details
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Courses;