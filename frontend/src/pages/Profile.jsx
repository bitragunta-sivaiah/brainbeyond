import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserProfile,
  updateUserProfile,
  changePassword,
  logoutUser,
} from "../store/redux/authSlice"; // Adjust path as needed
import { uploadSingleFile } from "../store/redux/uploadSlice"; // Adjust path as needed
import {
  User, Info, Link as LinkIcon, LogOut, MapPin, Clock, BarChart, Layers,
  DollarSign, Shield, GraduationCap, KeyRound, Calendar, Hash, CheckSquare,
  ListChecks, PlusCircle, Trash2, Edit, Save, Image as ImageIcon, CheckCircle,
  XCircle, BookOpen, Star, Briefcase, Menu, X, Users, MessageSquare, BookUser,
  Award, Target, Lightbulb, FileText, Building
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Helper function to safely get nested object properties
const get = (obj, path, def = "") => {
  const value = path.split(".").reduce((acc, part) => acc && acc[part], obj);
  return value !== undefined && value !== null ? value : def;
};

// --- SUB-COMPONENTS ---

const SkeletonLoader = () => (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-10 animate-pulse">
        <div className="flex justify-between items-center pb-6 border-b border-border mb-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="flex gap-4">
                <div className="h-10 bg-muted rounded-full w-32"></div>
                <div className="h-10 bg-muted rounded-full w-10"></div>
            </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4 space-y-4">
                <div className="h-32 w-32 bg-muted rounded-full mx-auto"></div>
                <div className="h-6 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                <div className="space-y-2 pt-4">
                    <div className="h-10 bg-muted rounded-md w-full"></div>
                    <div className="h-10 bg-muted rounded-md w-full"></div>
                    <div className="h-10 bg-muted rounded-md w-full"></div>
                </div>
            </div>
            <div className="lg:w-3/4 space-y-6">
                <div className="bg-card p-6 rounded-xl h-64"></div>
                <div className="bg-card p-6 rounded-xl h-48"></div>
            </div>
        </div>
    </div>
);
const SectionCard = ({ title, icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-card p-4 sm:p-6 rounded-2xl shadow-sm border border-border"
  >
    <h3 className="text-lg sm:text-xl font-semibold text-accent-foreground flex items-center gap-3 mb-5">
      {icon} {title}
    </h3>
    <div>{children}</div>
  </motion.div>
);

// --- MAIN COMPONENT ---

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(fetchUserProfile()); }, [dispatch]);
  useEffect(() => { if (user) setProfileData({ ...user }); }, [user]);
  
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  }

  // --- Data Handlers ---
  const handleEditToggle = () => {
    if (isEditing) handleSaveProfile();
    setIsEditing(!isEditing);
  };
  const handleDataChange = (path, value) => {
    setProfileData((prev) => {
        const newState = JSON.parse(JSON.stringify(prev));
        let current = newState;
        const keys = path.split(".");
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        const finalKey = keys[keys.length - 1];
        // Handle comma-separated strings for arrays
        if (["learningObjectives", "interests", "specializations", "languages", "preferredLearningStyles", "skills", "tools", "workingDays", "preferredDays", "preferredTimes"].some(p => path.includes(p)) && typeof value === 'string') {
            current[finalKey] = value.split(",").map(item => item.trim()).filter(Boolean);
        } else {
            current[finalKey] = value;
        }
        return newState;
    });
  };
  const handleArrayItemChange = (path, index, fieldName, value) => {
    setProfileData(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const array = get(newState, path);
        if (array && array[index] !== undefined) array[index][fieldName] = value;
        return newState;
    });
  };
  const handleAddNewItem = (path, newItemTemplate) => {
    setProfileData(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const keys = path.split('.');
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        const finalKey = keys[keys.length - 1];
        if (!Array.isArray(current[finalKey])) {
            current[finalKey] = [];
        }
        current[finalKey].push(newItemTemplate);
        return newState;
    });
  };
  const handleDeleteItem = (path, index) => {
    setProfileData(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const array = get(newState, path);
        if (array && array[index] !== undefined) array.splice(index, 1);
        return newState;
    });
  };
  const handleSaveProfile = async () => {
    try {
      await dispatch(updateUserProfile(profileData)).unwrap();
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) { 
        toast.error(err.message || "Failed to update profile.");
    }
  };
  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) return toast.error("New passwords do not match.");
    if (passwordData.newPassword.length < 5) return toast.error("Password must be at least 5 characters long.");
    try {
      await dispatch(changePassword(passwordData)).unwrap();
      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
        toast.error(err.message || "Failed to change password.");
    }
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const result = await dispatch(uploadSingleFile(file)).unwrap();
        handleDataChange("profileInfo.avatar", result.fileUrl);
        toast.success("Profile image updated!");
      } catch (err) { 
        toast.error(err.message || "Failed to upload image.");
      }
    }
  };

  // --- RENDER HELPERS ---
  const renderInputField = (label, path, options = {}) => (
    <div className={options.className || ""}>
      <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type={options.type || "text"} 
        value={get(profileData, path) || ""} 
        onChange={(e) => handleDataChange(path, e.target.value)} 
        disabled={!isEditing || options.disabled}
        className="mt-1 block w-full bg-input border-border rounded-lg shadow-sm p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
      />
    </div>
  );
  const renderTextareaField = (label, path, options = {}) => (
    <div className={options.className || "md:col-span-2"}>
        <label className="block text-sm font-medium text-muted-foreground mb-1">{label}</label>
        <textarea
            rows={options.rows || 4}
            value={Array.isArray(get(profileData, path)) ? get(profileData, path).join(", ") : get(profileData, path)}
            onChange={(e) => handleDataChange(path, e.target.value)}
            disabled={!isEditing}
            className="mt-1 block w-full bg-input border-border rounded-lg shadow-sm p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
    </div>
  );
  const renderArrayField = (label, path, fields, newItemTemplate, showAddButton = true) => {
    const items = get(profileData, path, []);
    return (
      <SectionCard title={label} icon={<ListChecks className="w-5 h-5" />}>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <div key={index} className="bg-muted p-4 rounded-lg border border-border/50 relative group">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fields.map((field) => (
                        <div key={field.name}>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
                         {field.type === 'select' ? (
                            <select
                                value={get(item, field.name, "")}
                                onChange={(e) => handleArrayItemChange(path, index, field.name, e.target.value)}
                                className="text-sm block w-full bg-input border-border rounded-md shadow-sm p-2 text-foreground"
                            >
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                         ) : (
                            <input
                                type={field.type || "text"}
                                value={get(item, field.name, "")}
                                onChange={(e) => handleArrayItemChange(path, index, field.name, e.target.value)}
                                className="text-sm block w-full bg-input border-border rounded-md shadow-sm p-2 text-foreground"
                            />
                         )}
                        </div>
                    ))}
                  </div>
                ) : (
                  fields.map((field) => (
                    <p key={field.name} className="truncate text-sm">
                      <span className="font-semibold text-muted-foreground">{field.label}: </span>
                      {field.type === "date" ? (get(item, field.name) ? new Date(get(item, field.name)).toLocaleDateString() : "N/A") : (get(item, field.name, "N/A") || "N/A").toString()}
                    </p>
                  ))
                )}
                {isEditing && showAddButton && (
                  <button onClick={() => handleDeleteItem(path, index)} className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm mt-1">No {label.toLowerCase()} found.</p>
          )}
        </div>
        {isEditing && showAddButton && (
          <button onClick={() => handleAddNewItem(path, newItemTemplate)} className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <PlusCircle className="w-4 h-4" /> Add New {label.slice(0, -1)}
          </button>
        )}
      </SectionCard>
    );
  };
  const renderStat = (label, value, icon) => (
    <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-xl text-center border border-border/50">
        <div className="text-primary mb-1">{icon}</div>
        <span className="text-xl font-bold text-foreground">{value || 0}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  // --- RENDER TABS ---
  const renderProfileTab = () => (
    <div className="space-y-6">
      <SectionCard title="Basic Information" icon={<Info className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField("First Name", "profileInfo.firstName")}
            {renderInputField("Last Name", "profileInfo.lastName")}
            {renderInputField("Email", "email", { disabled: true })}
            {renderInputField("Phone", "profileInfo.phone", { type: "tel" })}
            {renderInputField("Date of Birth", "profileInfo.dateOfBirth", { type: "date" })}
            {renderInputField("Timezone", "profileInfo.timezone")}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Gender</label>
              <select value={get(profileData, "profileInfo.gender")} onChange={(e) => handleDataChange("profileInfo.gender", e.target.value)} disabled={!isEditing} className="mt-1 block w-full bg-input border-border rounded-lg shadow-sm p-2.5 text-sm text-foreground">
                  <option value="">Select...</option> <option value="male">Male</option> <option value="female">Female</option> <option value="other">Other</option> <option value="prefer-not-to-say">Prefer Not To Say</option>
              </select>
            </div>
            {renderTextareaField("Bio", "profileInfo.bio")}
        </div>
      </SectionCard>
      <SectionCard title="Address" icon={<MapPin className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField("Street", "profileInfo.address.street")}
            {renderInputField("City", "profileInfo.address.city")}
            {renderInputField("State", "profileInfo.address.state")}
            {renderInputField("Country", "profileInfo.address.country")}
            {renderInputField("Zip Code", "profileInfo.address.zipCode")}
        </div>
      </SectionCard>
      <SectionCard title="Social Links" icon={<LinkIcon className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField("Website", "socialLinks.website")}
            {renderInputField("GitHub", "socialLinks.github")}
            {renderInputField("LinkedIn", "socialLinks.linkedin")}
            {renderInputField("Twitter", "socialLinks.twitter")}
            {renderInputField("YouTube", "socialLinks.youtube")}
        </div>
      </SectionCard>
    </div>
  );
  const renderEnrollmentsTab = () => (
    <div className="space-y-6">
      {renderArrayField("Enrolled Courses", "enrolledCourses", [ { name: "course.title", label: "Course" }, { name: "progress", label: "Progress (%)" }, { name: "enrolledAt", label: "Enrolled On", type: "date" }, ], {}, false)}
      {renderArrayField("Certificates", "certificates", [ { name: "title", label: "Certificate" }, { name: "course.title", label: "Course" }, { name: "issuedDate", label: "Issued On", type: "date" }, ], {}, false)}
      <SectionCard title="Subscriptions & Purchases" icon={<DollarSign className="w-5 h-5" />}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderArrayField("Subscriptions", "purchasedSubscriptions", [ { name: "subscription.name", label: "Plan" }, { name: "endDate", label: "End Date", type: "date" }, { name: "isActive", label: "Status" }, ], {}, false)}
          {renderArrayField("Purchases", "enrollCoursePurchase", [ { name: "course.title", label: "Course" }, { name: "enrolledAt", label: "Purchased On", type: "date" }, ], {}, false)}
        </div>
      </SectionCard>
    </div>
  );
  const renderDashboardTab = () => {
    if (!user) return null;
    switch (user.role) {
      case "student":
        return (
          <SectionCard title="Student Dashboard" icon={<GraduationCap className="w-5 h-5" />}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextareaField("Career Goals", "careerGoals")}
                    {renderTextareaField("Learning Objectives (comma-separated)", "learningObjectives")}
                    {renderTextareaField("Interests (comma-separated)", "interests")}
                    {renderTextareaField("Preferred Learning Styles (comma-separated)", "preferredLearningStyles", {rows: 2})}
                </div>
                <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold text-accent-foreground mb-3 flex items-center gap-2"><Clock size={16} /> Time Availability</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {renderInputField("Hours Per Week", "timeAvailability.hoursPerWeek", { type: 'number' })}
                        {renderInputField("Preferred Days (e.g., Mon, Wed)", "timeAvailability.preferredDays")}
                        {renderInputField("Preferred Times (e.g., Mornings)", "timeAvailability.preferredTimes")}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderArrayField("Skills", "skills", 
                      [{ name: "name", label: "Skill" }, { name: "level", label: "Level", type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] }], 
                      { name: "", level: "beginner" })}
                    {renderArrayField("Work Experience", "workExperience", 
                      [{ name: "title", label: "Title" }, { name: "company", label: "Company" }, { name: "startDate", label: "Start Date", type: "date" }, { name: "endDate", label: "End Date", type: "date" }, { name: "description", label: "Description" }], 
                      { title: "", company: "", startDate: "", endDate: "", description: "" })}
                    {renderArrayField("Education", "education", 
                      [{ name: "degree", label: "Degree" }, { name: "institution", label: "Institution" }, { name: "fieldOfStudy", label: "Field of Study" }, { name: "startYear", label: "Start Year", type: "number" }, { name: "endYear", label: "End Year", type: "number" }], 
                      { degree: "", institution: "", fieldOfStudy: "", startYear: "", endYear: "" })}
                    {renderArrayField("Achievements", "achievements", 
                      [{ name: "title", label: "Title" }, { name: "description", label: "Description" }, { name: "type", label: "Type", type: "select", options: ['certificate', 'badge', 'award', 'contest_win'] }, { name: "date", label: "Date", type: "date" }], 
                      { title: "", description: "", type: "award", date: "" })}
                </div>
                <div>
                    <h4 className="text-lg font-semibold text-accent-foreground my-4 flex items-center gap-2"><BarChart /> Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {renderStat("Courses Done", get(profileData, "stats.coursesCompleted"), <BookOpen size={20}/>)}
                        {renderStat("Lessons Done", get(profileData, "stats.lessonsCompleted"), <ListChecks size={20}/>)}
                        {renderStat("Quizzes Taken", get(profileData, "stats.quizzesTaken"), <CheckSquare size={20}/>)}
                        {renderStat("Problems Solved", get(profileData, "stats.codingProblemsSolved"), <Hash size={20}/>)}
                        {renderStat("Streak Days", get(profileData, "stats.streakDays"), <Calendar size={20}/>)}
                    </div>
                </div>
            </div>
          </SectionCard>
        );
      case "instructor":
        return (
          <SectionCard title="Instructor Dashboard" icon={<BookUser className="w-5 h-5" />}>
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputField("Years of Experience", 'experience', { type: 'number' })}
                    {renderInputField("Portfolio URL", 'portfolioUrl')}
                    {renderTextareaField("Specializations (comma-separated)", "specializations", {rows: 2})}
                    {renderTextareaField("Teaching Philosophy", "teachingPhilosophy")}
                </div>
                {renderArrayField("Certifications", "certifications", 
                    [{ name: "name", label: "Name" }, { name: "issuer", label: "Issuer" }, { name: "dateObtained", label: "Date", type: "date" }],
                    { name: "", issuer: "", dateObtained: "" }
                )}
                {renderArrayField("Courses Taught", "courses", 
                    [{ name: "title", label: "Course Title" }], {}, false)}
                 <div>
                    <h4 className="text-lg font-semibold text-accent-foreground my-4 flex items-center gap-2"><BarChart /> Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderStat("Total Students", get(profileData, "totalStudents"), <Users size={20}/>)}
                        {renderStat("Total Courses", get(profileData, "totalCourses"), <BookOpen size={20}/>)}
                        {renderStat("Total Reviews", get(profileData, "totalReviews"), <MessageSquare size={20}/>)}
                        {renderStat("Average Rating", get(profileData, "averageRating"), <Star size={20}/>)}
                    </div>
                </div>
             </div>
          </SectionCard>
        );
      case "customercare":
         return (
          <SectionCard title="Support Dashboard" icon={<Briefcase className="w-5 h-5" />}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputField("Position", 'position')}
                    {renderTextareaField("Languages (comma-separated)", "languages", {rows: 2})}
                    {renderTextareaField("Specialization (comma-separated)", 'specialization', {rows: 2})}
                </div>
                 <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold text-accent-foreground mb-3 flex items-center gap-2"><Clock size={16} /> Availability</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderInputField("Working Days", "availability.workingDays")}
                        {renderInputField("Shift Start", "availability.shiftStart")}
                        {renderInputField("Shift End", "availability.shiftEnd")}
                        {renderInputField("Timezone", "availability.timezone")}
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderArrayField("Skills", "skills", 
                      [{ name: "name", label: "Skill" }, { name: "proficiency", label: "Proficiency", type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] }], 
                      { name: "", proficiency: "beginner" })}
                    {renderArrayField("Tools", "tools", 
                      [{ name: "name", label: "Tool" }, { name: "proficiency", label: "Proficiency", type: 'select', options: ['beginner', 'intermediate', 'advanced', 'expert'] }], 
                      { name: "", proficiency: "beginner" })}
                </div>
                {renderArrayField("Performance Reviews", "performanceReviews", 
                    [{ name: "date", label: "Date", type: "date" }, { name: "reviewer.username", label: "Reviewer" }, { name: "rating", label: "Rating" }, { name: "feedback", label: "Feedback" }], 
                    {}, false)}
                {renderArrayField("Current Assignments", "currentAssignments",
                    [{ name: "subject", label: "Ticket Subject" }, { name: "status", label: "Status" }],
                    {}, false)}
                 <div>
                    <h4 className="text-lg font-semibold text-accent-foreground my-4 flex items-center gap-2"><BarChart /> Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderStat("Tickets Resolved", get(profileData, "stats.ticketsResolved"), <CheckSquare size={20}/>)}
                        {renderStat("Avg. Resolution (hrs)", get(profileData, "stats.averageResolutionTime"), <Clock size={20}/>)}
                        {renderStat("Satisfaction", `${get(profileData, "stats.customerSatisfaction", 0)}/5`, <Star size={20}/>)}
                        {renderStat("Active Tickets", get(profileData, "stats.currentActiveTickets"), <MessageSquare size={20}/>)}
                    </div>
                </div>
            </div>
          </SectionCard>
          );
      case "admin":
        return (
             <SectionCard title="Admin Dashboard" icon={<Shield className="w-5 h-5" />}>
                <p className="text-muted-foreground">Welcome, Admin. You have access to administrative panels throughout the application.</p>
             </SectionCard>
        );
      default:
        return <SectionCard title="Dashboard" icon={<BarChart className="w-5 h-5"/>}><p>No specific dashboard for your role.</p></SectionCard>;
    }
  };
  const renderSecurityTab = () => (
     <div className="space-y-6">
       <SectionCard title="Change Password" icon={<KeyRound className="w-5 h-5" />}>
         <div className="max-w-md space-y-4">
           <div>
             <label className="block text-sm font-medium text-muted-foreground">Current Password</label>
             <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={e => setPasswordData(p => ({...p, currentPassword: e.target.value}))} className="mt-1 block w-full bg-input border-border rounded-lg p-2.5"/>
           </div>
           <div>
             <label className="block text-sm font-medium text-muted-foreground">New Password</label>
             <input type="password" name="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({...p, newPassword: e.target.value}))} className="mt-1 block w-full bg-input border-border rounded-lg p-2.5"/>
           </div>
           <div>
             <label className="block text-sm font-medium text-muted-foreground">Confirm New Password</label>
             <input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={e => setPasswordData(p => ({...p, confirmNewPassword: e.target.value}))} className="mt-1 block w-full bg-input border-border rounded-lg p-2.5"/>
           </div>
           <motion.button onClick={handlePasswordUpdate} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
             Update Password
           </motion.button>
         </div>
       </SectionCard>
       {renderArrayField("Login History", "loginHistory", [ { name: "timestamp", label: "Date", type: "date" }, { name: "ipAddress", label: "IP Address" }, { name: "device", label: "Device" }, { name: "browser", label: "Browser" }, { name: "os", label: "OS" }, { name: "location", label: "Location" } ], {}, false)}
     </div>
  );

  if (isLoading && !user) return <SkeletonLoader />;
  if (!user) return <div className="flex justify-center items-center h-screen bg-background text-foreground">Please log in to view your profile.</div>;
  
  // --- MAIN RENDER ---
  const TABS = {
    profile: { icon: <Info className="w-5 h-5" />, label: "Profile" },
    dashboard: { icon: <BarChart className="w-5 h-5" />, label: "Dashboard" },
    enrollments: { icon: <Layers className="w-5 h-5" />, label: "Enrollments" },
    security: { icon: <Shield className="w-5 h-5" />, label: "Security" },
  };

  const SidebarItem = ({ tabName, icon, label }) => (
    <button onClick={() => handleTabClick(tabName)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tabName ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap gap-4 justify-between items-center pb-6 border-b border-border mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your profile, enrollments, and security.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button onClick={handleEditToggle} className={`px-3 sm:px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm ${isEditing ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              <span className="hidden sm:inline">{isEditing ? "Save Changes" : "Edit Profile"}</span>
            </motion.button>
            <button onClick={() => dispatch(logoutUser())} className="p-2.5 rounded-lg bg-secondary text-secondary-foreground" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
                <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2.5 rounded-lg bg-secondary text-secondary-foreground">
                    {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                </button>
            </div>
          </div>
        </header>
        <main className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4 xl:w-1/5">
              <div className="flex flex-col items-center w-full p-6 bg-card rounded-2xl border border-border space-y-4">
                <div className="relative group">
                    <img src={get(profileData, "profileInfo.avatar")} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                    {isEditing && (
                        <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <ImageIcon className="text-white w-6 h-6" />
                        </button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={!isEditing} accept="image/*" />
                <h2 className="text-xl font-semibold text-foreground">{get(profileData, "username")}</h2>
                <span className="text-muted-foreground capitalize text-sm bg-muted px-2 py-1 rounded">{get(profileData, "role")}</span>
                <div className={`flex items-center gap-2 text-xs ${get(profileData, "isVerified") ? "text-green-500" : "text-yellow-500"}`}>
                    {get(profileData, "isVerified") ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span>{get(profileData, "isVerified") ? "Verified" : "Not Verified"}</span>
                </div>
              </div>
              <nav className={`mt-6 bg-card p-2 rounded-2xl border border-border ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
                <div className="space-y-2">
                  {Object.entries(TABS).map(([key, { icon, label }]) => (
                    <SidebarItem key={key} tabName={key} icon={icon} label={label} />
                  ))}
                </div>
              </nav>
          </aside>
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                {activeTab === "profile" && renderProfileTab()}
                {activeTab === "enrollments" && renderEnrollmentsTab()}
                {activeTab === "dashboard" && renderDashboardTab()}
                {activeTab === "security" && renderSecurityTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;