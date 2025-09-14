import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./redux/authSlice";
import uploadReducer from "./redux/uploadSlice";
import adminReducer from "./redux/adminSlice";
import faqReducer from "./redux/faqSlice";
import marqueeReducer from "./redux/marqueeSlice";
import notificationReducer from "./redux/notificationSlice";
import courseReducer from "./redux/courseSlice"; // Importing the course reducer
import coursecontentReducer from "./redux/courseContentSlice"; // Importing the course content reducer
import blogReducer from "./redux/blogSlice"; // Importing the blog reducer
import subscriptionsReducer from "./redux/subscriptionSlice";
import analysisReducer from "./redux/analysisSlice";
import homepageReducer from "./redux/homepageSlice";
import dataReducer from "./redux/dataSlice";
import eventReducer from "./redux/eventSlice";
import couponReducer from "./redux/couponSlice";
import instructorReducer from "./redux/instructorSlice";
import heroReducer from "./redux/heroSlice";
import groupChatReducer from "./redux/groupChatSlice";
import supportTicketReducer from "./redux/supportTicketSlice";
import studentCourseReducer from "./redux/studentCourseSlice";
import courseCertificatesReducer from "./redux/courseCertificatesSlice";
import studentProfileReducer from "./redux/studentProfileSlice";
import liveClassSliceReducer from "./redux/liveClassSlice";
import contactReducer from './redux/contactSlice'
import interviewsReducer from './redux/interviewPreparationSlice'
import resumeReducer from './redux/resumeSlice'
import atsReducer from './redux/atsSlice'
import roadmapsReducer from './redux/learningRoadmapSlice'
// --- 1. Import the new admin history reducer ---
import adminHistoryReducer from './redux/adminHistorySlice';

export const store = configureStore({
  reducer: {
    auth: userReducer,
    upload: uploadReducer,
    admin: adminReducer,
    faq: faqReducer,
    marquee: marqueeReducer,
    notifications: notificationReducer,
    course: courseReducer,
    courseContent: coursecontentReducer,
    blog: blogReducer,
    subscriptions: subscriptionsReducer,
    dashboard: analysisReducer,
    homepage: homepageReducer,
    data: dataReducer,
    events: eventReducer,
    coupons: couponReducer,
    instructor: instructorReducer,
    hero: heroReducer,
    groupChat: groupChatReducer,
    supportTicket: supportTicketReducer,
    studentCourses: studentCourseReducer,
    certificates: courseCertificatesReducer,
    studentProfile: studentProfileReducer,
    liveClasses: liveClassSliceReducer,
    contact: contactReducer,
    interview: interviewsReducer,
    resume: resumeReducer,
    ats: atsReducer,
    roadmaps: roadmapsReducer,
    // --- 2. Add the reducer to the store ---
    adminHistory: adminHistoryReducer,
  },
});

export default store;