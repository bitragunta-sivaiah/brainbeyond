import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAllCourses } from '../store/redux/courseSlice';
import { motion } from 'framer-motion';
import {
    Clock,
    Euro,
    Loader2,
} from 'lucide-react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { BsArrowRightCircle } from 'react-icons/bs';
import { FaStar } from 'react-icons/fa'; // Import FaStar for rating display

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
                return 'bg-green-500/20 text-green-700 dark:text-green-300';
            case 'intermediate':
                return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
            case 'advanced':
                return 'bg-red-500/20 text-red-700 dark:text-red-300';
            default:
                return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className=" p-8 bg-background text-foreground">
            <div className="max-w-7xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-primary font-display"
                >
                    Explore Our Courses 🚀
                </motion.h1>

                {status === 'loading' && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-primary w-12 h-12" />
                    </div>
                )}

                {status === 'failed' && (
                    <div className="text-center text-destructive text-lg font-semibold">
                        <p>Error: {error}</p>
                    </div>
                )}

                {status === 'succeeded' && courses.length === 0 && (
                    <div className="text-center text-muted-foreground text-lg">
                        No courses available at the moment.
                    </div>
                )}

                {status === 'succeeded' && courses.length > 0 && (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1,
                                },
                            },
                        }}
                    >
                        {courses.map((course) => (
                            <motion.div
                                key={course._id}
                                className="bg-card text-card-foreground border border-border rounded-xl shadow-md overflow-hidden flex flex-col transition-transform hover:scale-[1.02] duration-300 group"
                                variants={{
                                    hidden: { opacity: 0, y: 50 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                            >
                                <div className="relative w-full h-48 overflow-hidden">
                                    <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {course.isFeatured && (
                                        <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-full uppercase">
                                            Featured
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
                                            {course.level}
                                        </span>
                                        {/* Since totalLessons and duration aren't in the response, they are removed. */}
                                    </div>

                                    <h3 className="text-xl font-heading font-bold mt-2 mb-4 line-clamp-2">
                                        {course.title}
                                    </h3>

                                    <p className="text-muted-foreground text-sm flex-grow line-clamp-3">
                                        {course.shortDescription}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                                        <FaChalkboardTeacher size={16} className="text-primary" />
                                        <span>
                                            {/* Corrected: Mapping instructors to their full name if the data is available */}
                                            {course.instructors && course.instructors.length > 0
                                                ? course.instructors.map((inst) => `${inst.profileInfo.firstName} ${inst.profileInfo.lastName}`).join(', ')
                                                : 'Instructor'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-4 border-t border-border pt-4">
                                        <div className="flex items-center gap-1 text-lg font-bold">
                                             
                                            <span className={`${course.isFree ?'text-green-800':'text-primary'}`}>
                                               ₹ {course.isFree ? 'Free' : course.discountedPrice > 0 ? course.discountedPrice : course.price}
                                            </span>
                                            {course.discountedPrice > 0 && (
                                                <span className="text-custom line-through text-sm ml-1">
                                                    {course.price}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <FaStar className="text-yellow-400" />
                                            <span className="font-semibold text-foreground">{course.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/courses/${course.slug}`}
                                        className="mt-4 text-center text-primary hover:text-primary/80 transition-colors font-semibold flex items-center gap-1 justify-center"
                                    >
                                        Learn More <BsArrowRightCircle size={18} />
                                    </Link>
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