import AboutUs from "@/components/AboutUs";
import Blogs from "@/components/Blogs";
import ChangePassword from "@/components/ChangePassword";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import ForgotPassword from "@/components/ForgotPassword";
import GetCertificateById from "@/components/GetCertificateById";
import ManageSubscriptions from "@/components/ManageSubscriptions";
 
import MyCourses from "@/components/MyCourses";
import Policy from "@/components/Policy";
import RoadmapDetails from "@/components/RoadmapDetails";
import Roadmaps from "@/components/Roadmaps";
import SettingsPage from "@/components/SettingsPage";
 
import Subscription from "@/components/Subscription";
import VerificationTokenCertificate from "@/components/VerificationTokenCertificate";
import StudentDashboard from "@/layout/StudentDashboard";
import AdminContactManager from "@/pages/admin/AdminContactManager";
import AdminInterviewQuestions from "@/pages/AdminInterviewQuestions";
 
import AllOrderManager from "@/pages/AllOrderManager";
import AtsScoreChecker from "@/pages/AtsScoreChecker";
import CreateResumePage from "@/pages/CreateResumePage";
import CustomerCareContactManager from "@/pages/customerCare/CustomerCareContactManager";
import CustomerCareSupport from "@/pages/CustomerCareSupport";
import InterviewPreparationManager from "@/pages/InterviewPreparationManager";
import MyResumes from "@/pages/MyResume";
import PreparationDetailPage from "@/pages/PreparationDetailPage";
import RoadmapManager from "@/pages/RoadmapManager";
import StartInterview from "@/pages/StartInterview";
import React, { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

// Lazy Loaded Components
// Public Pages
const App = React.lazy(() => import("../App"));
const Login = React.lazy(() => import("../pages/Login"));
const SignUp = React.lazy(() => import("../pages/SignUp"));
const Home = React.lazy(() => import("../pages/Home"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const AllCourses = React.lazy(() => import("../components/AllCourses"));
const CourseDetails = React.lazy(() => import("../pages/CourseDetails"));
const CourseContent = React.lazy(() => import("../pages/CourseContent"));
const MyCertificationsPage = React.lazy(() => import("../components/MyCertificationsPage"));
const Notification = React.lazy(() => import("../components/Notification"));
const BlogDetails = React.lazy(() => import("../components/BlogDetails"));
const StudentCourseGroupChat = React.lazy(() => import("../pages/StudentCourseGroupChat"));
const StudentSupport = React.lazy(() => import("../pages/StudentSupport"));
const NonFound = React.lazy(() => import("../components/NonFound"));

// Admin Layout and Pages
const AdminDashboard = React.lazy(() => import("@/layout/AdminDashboard"));
const AdminAnalysis = React.lazy(() => import("@/layout/AdminAnalysis"));
const UserManager = React.lazy(() => import("@/pages/admin/UserManager"));
const HeroManager = React.lazy(() => import("@/pages/admin/HeroManger"));
const CourseManager = React.lazy(() => import("@/pages/admin/CourseManager"));
const AdminCourseContentManager = React.lazy(() => import("@/pages/admin/CourseContentManager"));
const BlogManager = React.lazy(() => import("@/pages/admin/BlogManager"));
const EventManager = React.lazy(() => import("@/pages/admin/EventManager"));
const SubscriptionManager = React.lazy(() => import("@/pages/admin/SubscriptionManager"));
const CouponManager = React.lazy(() => import("@/pages/admin/CouponManager"));
const PurchaseManager = React.lazy(() => import("@/pages/admin/PurchaseManager"));
const AdsAndAnnouncementsManager = React.lazy(() => import("@/pages/admin/AdsAndAnnouncementsManager"));
const MarqueeManger = React.lazy(() => import("@/pages/admin/MarqueeManger"));
const FAQManager = React.lazy(() => import("@/pages/admin/FAQManager"));
const CreateCourse = React.lazy(() => import("../components/CreateCourse"));
const UpdateCourse = React.lazy(() => import("../components/UpdateCourse"));
const AdminAndInstructorGroupChatManager = React.lazy(() => import("../pages/AdminAndInstructorGroupChatManager"));
const AdminAndInstructorSupporter = React.lazy(() => import("../pages/AdminAndInstructorSupporter"));
const AdminProfile = React.lazy(() => import("@/pages/admin/AdminProfile"));

// Instructor Layout and Pages
const InstructorDashboard = React.lazy(() => import("@/layout/InstructorDashboard"));
const InstructorAnalysis = React.lazy(() => import("@/layout/InstructorAnalysis"));
const InstructorProfile = React.lazy(() => import("@/pages/instructor/InstructorProfile"));
const InstructorCoursesContentManager = React.lazy(() => import("@/pages/instructor/InstructorCoursesContentManager"));
const InstructorCourseManager = React.lazy(() => import("@/pages/instructor/InstructorCourseManager"));
const InstructorBlogManager = React.lazy(() => import("@/pages/instructor/InstructorBlogManager"));
const AnnouncementManager = React.lazy(() => import("@/pages/instructor/AnnouncementManager"));
const InstructorEventManager = React.lazy(() => import("@/pages/instructor/InstructorEventManager"));

// Customer Care Layout and Pages
const CustomerCareDashboard = React.lazy(() => import("../pages/customerCare/CustomerCareDashboard"));
const CustomerCareSupportManager = React.lazy(() => import("../pages/CustomerCareSupport"));
const AssignedTickets = React.lazy(() => import("../pages/customerCare/AssignedTickets"));
const EscalatedTickets = React.lazy(() => import("../pages/customerCare/EscalatedTickets"));
const AllTickets = React.lazy(() => import("../pages/customerCare/AllTickets")); // Added AllTickets for completeness
const CustomerCareAnalysis = React.lazy(() => import("../layout/CustomerCareAnalysis")); // Added AllTickets for completeness


// stduent 
const Student = React.lazy(() => import("../layout/Student"));

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <Suspense fallback={<div>Loading Application...</div>}>
                <App />
            </Suspense>
        ),
        children: [
            // --- Public Routes ---
            { index: true, element: <Home /> }, // Default route for '/'
            { path: 'login', element: <Login /> },
            { path: 'signup', element: <SignUp /> },
            { path: 'profile', element: <Profile /> },
            { path: 'Settings', element: <SettingsPage /> },
            { path: 'forgot-password', element: <ForgotPassword /> },
            { path: 'settings/change-password', element: <ChangePassword /> },
            { path: 'student/interview-prep', element: <InterviewPreparationManager /> },
            { path: 'interview-prep/:id', element: <PreparationDetailPage /> },
            { path: 'interview-prep/session/:id', element: <StartInterview /> },
            { path: 'notifications', element: <Notification /> },
            { path: 'blogs/:slug', element: <BlogDetails /> },
            { path: 'blog', element: <Blogs /> },
            { path: 'faq', element: <FAQ /> },
            { path: 'student/groups', element: <StudentCourseGroupChat /> },
            { path: 'student/support', element: <StudentSupport /> },
            { path: 'student/support/:ticketId', element: <StudentSupport /> },
            { path: 'pricing', element: <Subscription /> },
            { path: 'about', element: <AboutUs /> },
            { path: 'policy', element: <Policy /> },
            { path: 'contact', element: < Contact /> },
            { path: 'subscriptions', element: < ManageSubscriptions /> },
            { path: 'student/roadmaps', element: < RoadmapManager /> },
            { path: 'student/ats-resume-checker', element: < AtsScoreChecker /> },
            { path: 'certificates/:certId', element: <GetCertificateById /> },
            { path: 'verify-certificate/:verificationToken', element: <VerificationTokenCertificate /> },

            // Course Related Public Routes
            { path: 'courses', element: <AllCourses /> },
            { path: 'roadmaps', element: <Roadmaps /> },
            { path: 'roadmap/:slug', element: <RoadmapDetails /> },
            { path: 'student/resume-builder', element: <CreateResumePage /> },
            { path: 'resumes/builder/:id', element: <CreateResumePage /> },
            { path: 'student/my-resumes', element: <MyResumes /> },
            { path: 'courses/:slug', element: <CourseDetails /> },
            { path: 'courses/:slug/learn', element: <CourseContent /> },

            // Student Specific Routes
            { path: 'student/courses', element: <MyCourses /> },
            { path: 'student/anlaysis', element: <StudentDashboard /> },
            { path: 'student/certificates', element: <MyCertificationsPage /> },

            // --- Admin Routes ---
            {
                path: 'admin',
                element: (
                    <Suspense fallback={<div>Loading Admin Panel...</div>}>
                        <AdminDashboard />
                    </Suspense>
                ),
                children: [
                    { index: true, element: <AdminAnalysis /> }, // Default admin route
                    { path: 'dashboard', element: <AdminAnalysis /> }, // Admin's own profile
                    { path: 'analytics', element: <AdminAnalysis /> }, // Admin's own profile
                    { path: 'profile', element: <AdminProfile /> }, // Admin's own profile
                    { path: 'users', element: <UserManager /> },
                    { path: 'hero', element: <HeroManager /> },
                    { path: 'courses', element: <CourseManager /> },
                    { path: 'courses/chapters', element: <AdminCourseContentManager /> },
                    { path: 'blog', element: <BlogManager /> },
                    { path: 'events', element: <EventManager /> },
                    { path: 'subscriptions', element: <SubscriptionManager /> },
                    { path: 'coupons', element: <CouponManager /> },
                    { path: 'purchases', element: <AllOrderManager /> },
                    { path: 'ads&Announcement', element: <AdsAndAnnouncementsManager /> },
                    { path: 'marquee', element: <MarqueeManger /> },
                    { path: 'faqs', element: <FAQManager /> },
                    { path: 'create-Course', element: <CreateCourse /> },
                    { path: 'update-Course/:courseId', element: <UpdateCourse /> },
                    { path: 'groups', element: <AdminAndInstructorGroupChatManager /> },
                    { path: 'support', element: <AdminAndInstructorSupporter /> },
                    { path: 'support/:ticketId', element: <AdminAndInstructorSupporter /> },
                    { path: 'purchases', element: <AllOrderManager /> },
                    { path: 'contact', element: <AdminContactManager /> },
                    { path: 'interview-questions', element: <AdminInterviewQuestions /> },
                ],
            },

            // --- Instructor Routes ---
            {
                path: 'instructor',
                element: (
                    <Suspense fallback={<div>Loading Instructor Panel...</div>}>
                        <InstructorDashboard />
                    </Suspense>
                ),
                children: [
                    { index: true, element: <InstructorAnalysis /> }, // Default instructor route
                    { path: 'dashboard', element: <InstructorAnalysis /> }, // Instructor's own profile
                    { path: 'profile', element: <InstructorProfile /> }, // Instructor's own profile
                    { path: 'courses-content', element: <InstructorCoursesContentManager /> },
                    { path: 'courses', element: <InstructorCourseManager /> },
                    { path: 'create-Course', element: <CreateCourse /> },
                    { path: 'update-Course/:courseId', element: <UpdateCourse /> },
                    { path: 'blog', element: <InstructorBlogManager /> },
                    { path: 'announcements', element: <AnnouncementManager /> },
                    { path: 'events', element: <InstructorEventManager /> },
                    { path: 'support', element: <AdminAndInstructorSupporter /> }, // Shared support component
                    { path: 'support/:ticketId', element: <AdminAndInstructorSupporter /> }, // Shared support component
                ],
            },

            // --- Customer Care Routes ---
            {
                path: 'customercare',
                element: (
                    <Suspense fallback={<div>Loading Customer Care Panel...</div>}>
                        <CustomerCareDashboard />
                    </Suspense>
                ),
                children: [
                    { index: true, element: <CustomerCareAnalysis  /> }, // Main customer care route
                    { path: 'support', element: <CustomerCareSupport /> }, // Changed to AllTickets for clarity
                    { path: 'support/:ticketId', element: <CustomerCareSupport /> }, // Changed to AllTickets for clarity
                    { path: 'assigned-tickets', element: <AssignedTickets /> },
                    { path: 'escalated-tickets', element: <EscalatedTickets /> },
                    { path: 'contact', element: <CustomerCareContactManager /> },

                ],
            },
            //  student 
            {path:'/student', element:<Student/>,children:[
               {path:'' , element:<StudentDashboard/> },
               {path:'settings' , element:<SettingsPage/> },
            ]},
            // --- Catch-all 404 Route (ALWAYS LAST) ---
            { path: '*', element: <NonFound /> },
        ],
    },
]);
