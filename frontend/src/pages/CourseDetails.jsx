import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  FileText,
  Code2,
  Lock,
  LockOpen,
  ChevronDown,
  Star,
  Play,
  X,
} from "lucide-react";
import { FaUserGraduate } from "react-icons/fa6";
import { MdVerified } from "react-icons/md";
import {
  fetchCourseDetails,
  enrollFreeCourse,
  createOrder,
  verifyPayment,
  addReview,
  updateReview,
  resetCourseDetails,
} from "../store/redux/studentCourseSlice";

// A utility function to load the Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const CourseDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { courseDetails, status, error } = useSelector(
    (state) => state.studentCourses
  );
  const { user } = useSelector((state) => state.auth);

  const [isAccordionOpen, setIsAccordionOpen] = useState({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: "" });
  const [showVideo, setShowVideo] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Check if courseDetails exists before trying to access its properties
  const hasAccess =
    courseDetails &&
    user?.enrollments?.some(
      (enrollment) => enrollment.course.toString() === courseDetails._id.toString()
    );

  const progress = hasAccess
    ? user.enrollments.find((e) => e.course.toString() === courseDetails._id.toString())
        ?.progress || 0
    : 0;

  useEffect(() => {
    if (slug) {
      dispatch(fetchCourseDetails(slug));
    }
    loadRazorpayScript().then((res) => {
      setIsRazorpayLoaded(res);
      if (!res) {
        toast.error(
          "Razorpay script failed to load. Please check your network."
        );
      }
    });

    return () => {
      dispatch(resetCourseDetails());
    };
  }, [dispatch, slug, user]);

  const toggleAccordion = (chapterId) => {
    setIsAccordionOpen((prevState) => ({
      ...prevState,
      [chapterId]: !prevState[chapterId],
    }));
  };

  const handleEnrollFree = async () => {
    if (!user) {
      toast.error("Please log in to enroll in the course.");
      return navigate("/login");
    }
    try {
      await dispatch(enrollFreeCourse(slug)).unwrap();
      toast.success("Successfully enrolled in the course!");
      dispatch(fetchCourseDetails(slug));
    } catch (err) {
      toast.error(err.message || "Failed to enroll.");
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      toast.error("Please log in to purchase the course.");
      return navigate("/login");
    }
    if (!isRazorpayLoaded) {
      return toast.error(
        "Payment gateway is not ready. Please try again in a moment."
      );
    }
    if (!courseDetails) return;

    try {
      const resultAction = await dispatch(createOrder(slug)).unwrap();
      const orderData = resultAction.razorpayOrder;
      const orderId = resultAction.orderId;

      const options = {
        key: "rzp_test_R5EX9ZeingF39U",
        amount: orderData.amount,
        currency: orderData.currency,
        name: courseDetails.title,
        description: "Course Purchase",
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verificationData = {
              ...response,
              orderId,
            };
            await dispatch(
              verifyPayment({ slug, paymentData: verificationData })
            ).unwrap();
            dispatch(fetchCourseDetails(slug));
          } catch (err) {
            toast.error("Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment was dismissed.");
          },
        },
        prefill: {
          name: user.profileInfo?.firstName + " " + user.profileInfo?.lastName,
          email: user.email,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Failed to create Razorpay order.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewData.rating === 0) {
      return toast.error("Please provide a star rating.");
    }
    try {
      await dispatch(addReview({ slug, ...reviewData })).unwrap();
      setShowReviewForm(false);
      setReviewData({ rating: 0, comment: "" });
    } catch (err) {
      toast.error(err.message || "Failed to submit review.");
    }
  };

  const renderEnrollmentButton = () => {
    if (status === "loading") {
      return (
        <button
          className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold w-full flex items-center justify-center gap-2"
          disabled
        >
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </button>
      );
    }

    if (hasAccess) {
      const progressPercent = progress || 0;
      return (
        <div className="flex flex-col items-center gap-2">
          <Link
            to={`/courses/${slug}/learn`}
            className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold w-full text-center hover:bg-primary/90 transition-colors"
          >
            Continue Learning
          </Link>
          <div className="w-full bg-muted rounded-full h-2.5">
            <motion.div
              className="bg-primary h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
          <span className="text-sm text-custom">
            Progress: {progressPercent}% Complete
          </span>
        </div>
      );
    }

    if (courseDetails?.isFree) {
      return (
        <button
          onClick={handleEnrollFree}
          className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold w-full hover:bg-primary/90 transition-colors"
        >
          Enroll for Free
        </button>
      );
    }

    const price = courseDetails.discountedPrice || courseDetails.price;
    return (
      <button
        onClick={handleCreateOrder}
        className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold w-full hover:bg-primary/90 transition-colors"
        disabled={!isRazorpayLoaded}
      >
        {isRazorpayLoaded
          ? `Buy Now for ₹${price?.toFixed(2) || "N/A"}`
          : "Loading Payment..."}
      </button>
    );
  };

  if (status === "loading" || !courseDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="bg-destructive/10 text-destructive border border-destructive rounded-xl p-8 max-w-lg">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error || "Course not found."}</p>
        </div>
      </div>
    );
  }
  const course = courseDetails;

  const renderContent = () => (
    <>
      <section className="bg-card rounded-3xl p-6 md:p-8 shadow mb-8">
        <h2 className="text-2xl font-bold mb-4 font-heading">
          Course Description
        </h2>
        {/* CORRECTED LINE */}
        <div
          className="text-custom leading-relaxed"
          dangerouslySetInnerHTML={{ __html: course.description }}
        />
      </section>

      <section className="bg-card rounded-3xl p-6 md:p-8 shadow mb-8">
        <h2 className="text-2xl font-bold mb-6 font-heading">
          Course Curriculum
        </h2>
        {hasAccess ? (
          course.chapters && course.chapters.length > 0 ? (
            <div className="space-y-4">
              {course.chapters.map((chapter) => (
                <div
                  key={chapter._id}
                  className="bg-muted/20 border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleAccordion(chapter._id)}
                    className="w-full flex justify-between items-center p-4 hover:bg-muted transition-colors"
                  >
                    <span className="text-lg font-semibold text-foreground">
                      {chapter.title}
                    </span>
                    <ChevronDown
                      className={`w-6 h-6 text-custom transition-transform duration-300 ${
                        isAccordionOpen[chapter._id] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isAccordionOpen[chapter._id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <ul className="p-4 space-y-2">
                          {course.chapters
                            .find((c) => c._id === chapter._id)
                            ?.lessons.map((lesson) => (
                              <li
                                key={lesson._id}
                                className="flex items-center gap-3 text-custom"
                              >
                                <LockOpen className="w-4 h-4 text-primary" />
                                <span>{lesson.title}</span>
                                <span className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
                                  {lesson.type === "video" && <Book />}
                                  {lesson.type === "article" && <FileText />}
                                  {lesson.type === "quiz" && <Code2 />}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-custom italic">
              No curriculum has been added to this course yet.
            </p>
          )
        ) : (
          <div className="relative w-full h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-3xl" />
            <div className="relative z-20 text-center flex flex-col items-center">
              <Lock className="w-24 h-24 text-primary mb-4" />
              <h3 className="text-3xl font-bold text-foreground font-heading">
                Course Content Locked
              </h3>
              <p className="text-custom mt-2 max-w-sm">
                To unlock the full curriculum and all lessons, please purchase
                or enroll in this course.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-card rounded-3xl p-6 md:p-8 shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold font-heading">Student Reviews</h2>
          {hasAccess && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {showReviewForm ? "Cancel Review" : "Write a Review"}
            </button>
          )}
        </div>
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-muted/30 p-4 rounded-xl mb-6 overflow-hidden"
            >
              <h3 className="text-lg font-semibold mb-2">Your Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`cursor-pointer w-6 h-6 transition-colors ${
                          i < reviewData.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        onClick={() =>
                          setReviewData({ ...reviewData, rating: i + 1 })
                        }
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium mb-1">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    rows="4"
                    className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                    value={reviewData.comment}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, comment: e.target.value })
                    }
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {course.reviews && course.reviews.length > 0 ? (
          <div className="space-y-6">
            {course.reviews.map((review) => (
              <div
                key={review._id}
                className="border-b border-border pb-4 last:border-0"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={review.user?.avatar}
                    alt={review.user?.fullName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {review.user?.fullName}
                      </span>
                      <MdVerified className="text-primary text-base" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star
                        className="text-yellow-400 w-4 h-4"
                        fill="#facc15"
                      />
                      <span className="font-semibold text-foreground text-sm">
                        {review.rating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-custom leading-relaxed">{review.comment}</p>
                <span className="text-sm text-muted-foreground mt-2 block">
                  Reviewed on: {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-custom italic">
            This course does not have any reviews yet.
          </p>
        )}
      </section>
    </>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-8 sm:px-6 lg:px-8 font-body">
      <section className="relative h-fit rounded-xl overflow-hidden shadow mb-8 bg-cover bg-center">
        <div
          className="absolute w-full h-full z-0 blur-sm"
          style={{
            backgroundImage: `url(${course.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>
        <div className="bg-black/70 absolute z-10 w-full h-full"></div>
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 text-primary-foreground">
          <div className="flex items-center gap-2 font-bold mb-2">
            <p className="text-sm uppercase tracking-wide text-background bg-primary px-4 py-2 rounded-br-sm absolute -left-3 top-0">
              {course.category}
            </p>
            <span className="text-sm capitalize rounded-full rotate-6 -top-1 absolute flex items-center justify-center text-background bg-primary px-4 py-2 -right-3">
              {course.level}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 font-heading">
            {course.title}
          </h1>
          <p className="text-lg mb-6 leading-relaxed max-w-2xl">
            {course.shortDescription}
          </p>
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <FaUserGraduate className="text-yellow-400" />
              <span>{course.totalStudents} Students</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="text-yellow-400 w-4 h-4" fill="#facc15" />
              <span className="font-semibold">
                {course.rating?.toFixed(1) || "N/A"}
              </span>
              <span className="text-xs">
                ({course.totalRatings || 0} ratings)
              </span>
            </div>
            {course.instructors && course.instructors.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Created by:</span>
                <img
                  src={course.instructors[0]?.profileInfo?.avatar}
                  alt={course.instructors[0]?.username}
                  className="w-8 h-8 rounded-full border-2 border-yellow-400 object-cover"
                />
                <span className="font-medium">
                  {course.instructors[0].username}
                </span>
                <MdVerified className="text-yellow-400 text-lg" />
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          {renderContent()}
        </div>
        <div className="w-full lg:w-1/3">
          <div className="sticky top-8 space-y-6">
            <div className="bg-card rounded-3xl shadow p-6 flex flex-col">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md mb-6">
                <img
                  src={course.thumbnail}
                  alt="Course Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
                >
                  <Play
                    className="w-12 h-12 text-primary-foreground"
                    fill="#fff"
                  />
                </button>
              </div>
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-end justify-center gap-2">
                  <span className="text-4xl font-bold text-foreground font-heading">
                    {course.isFree
                      ? "Free"
                      : `₹${
                          (course.discountedPrice || course.price)?.toFixed(2) || "N/A"
                        }`}
                  </span>
                  {course.discountedPrice && (
                    <span className="line-through text-custom text-lg">
                      ₹{course.price?.toFixed(2) || "N/A"}
                    </span>
                  )}
                </div>
                {renderEnrollmentButton()}
                <div className="text-center text-sm text-custom">
                  30-day money-back guarantee
                </div>
              </div>
              <ul className="w-full space-y-4 mt-6 text-sm">
                <li className="flex justify-between items-center text-foreground border-b pb-2 border-border">
                  <span className="text-custom">Level</span>
                  <span className="font-semibold capitalize">
                    {course.level}
                  </span>
                </li>
                <li className="flex justify-between items-center text-foreground border-b pb-2 border-border">
                  <span className="text-custom">Lessons</span>
                  <span className="font-semibold">{course.totalLessons}</span>
                </li>
                <li className="flex justify-between items-center text-foreground border-b pb-2 border-border">
                  <span className="text-custom">Duration</span>
                  <span className="font-semibold">
                    {course.duration ? `${course.duration} hours` : "N/A"}
                  </span>
                </li>
                <li className="flex justify-between items-center text-foreground">
                  <span className="text-custom">Language</span>
                  <span className="font-semibold">{course.language}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showVideo && course.previewVideo && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <X size={24} />
              </button>
              <iframe
                src={course.previewVideo}
                title={`${course.title} Preview`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseDetails;