import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminProfile,
  updateAdminProfile,
} from "../../store/redux/adminSlice";
import { uploadSingleFile } from "../../store/redux/uploadSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Building,
  Briefcase,
  Layers,
  Phone,
  MapPin,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Save,
  Loader2,
  Edit,
  X,
  PlusCircle,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Youtube,
  Camera,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const AdminProfile = () => {
  const dispatch = useDispatch();
  const { adminProfile, loading, error } = useSelector((state) => state.admin);
  const { singleFileStatus } = useSelector((state) => state.upload);
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    profileInfo: {
      firstName: "",
      lastName: "",
      avatar: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      bio: "",
    },
    socialLinks: {},
    notificationPreferences: {},
    position: "",
    department: "",
    responsibilities: [],
    accessLevel: "",
    permissions: {},
    contactInformation: {},
  });

  // Effect to fetch the profile on component mount
  useEffect(() => {
    dispatch(fetchAdminProfile());
  }, [dispatch]);

  // Effect to populate form data when profile is loaded
  useEffect(() => {
    if (adminProfile) {
      setFormData({
        profileInfo: {
          firstName: adminProfile.user?.profileInfo?.firstName || "",
          lastName: adminProfile.user?.profileInfo?.lastName || "",
          avatar: adminProfile.user?.profileInfo?.avatar || "",
          phone: adminProfile.user?.profileInfo?.phone || "",
          dateOfBirth: adminProfile.user?.profileInfo?.dateOfBirth
            ? new Date(adminProfile.user.profileInfo.dateOfBirth)
                .toISOString()
                .split("T")[0]
            : "",
          gender: adminProfile.user?.profileInfo?.gender || "",
          address: {
            street: adminProfile.user?.profileInfo?.address?.street || "",
            city: adminProfile.user?.profileInfo?.address?.city || "",
            state: adminProfile.user?.profileInfo?.address?.state || "",
            country: adminProfile.user?.profileInfo?.address?.country || "",
            zipCode: adminProfile.user?.profileInfo?.address?.zipCode || "",
          },
          bio: adminProfile.user?.profileInfo?.bio || "",
        },
        socialLinks: adminProfile.user?.socialLinks || {},
        notificationPreferences: adminProfile.user?.notificationPreferences || {},
        position: adminProfile.position || "",
        department: adminProfile.department || "",
        responsibilities: adminProfile.responsibilities || [],
        accessLevel: adminProfile.accessLevel || "",
        permissions: adminProfile.permissions || {},
        contactInformation: adminProfile.contactInformation || {},
      });
    }
  }, [adminProfile]);

  // Handler for all input fields, including nested objects
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev };
      let currentLevel = newState;
      const path = name.split(".");

      for (let i = 0; i < path.length - 1; i++) {
        currentLevel = currentLevel[path[i]];
      }
      currentLevel[path[path.length - 1]] = value;
      return newState;
    });
  };

  // Handler for file upload
const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    const resultAction = await dispatch(uploadSingleFile(file));

    if (uploadSingleFile.fulfilled.match(resultAction)) {
      // CORRECTED LINE: Access the nested fileUrl from the data object
      const newAvatarUrl = resultAction.payload.data.fileUrl; 
      
      toast.success("Avatar uploaded successfully! Click save to apply changes.");
      
      setFormData((prev) => ({
        ...prev,
        profileInfo: {
          ...prev.profileInfo,
          avatar: newAvatarUrl,
        },
      }));
    } else {
      toast.error("File upload failed.");
    }
  }
};


  // Click handler for the avatar
  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleResponsibilitiesChange = (e, index) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities[index] = e.target.value;
    setFormData((prev) => ({
      ...prev,
      responsibilities: newResponsibilities,
    }));
  };

  const addResponsibility = () => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ""],
    }));
  };

  const removeResponsibility = (index) => {
    const newResponsibilities = [...formData.responsibilities];
    newResponsibilities.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      responsibilities: newResponsibilities,
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  // Function to handle the cancel action
  const handleCancel = () => {
    // Reset formData to the original profile data
    if (adminProfile) {
      setFormData({
        profileInfo: {
          firstName: adminProfile.user?.profileInfo?.firstName || "",
          lastName: adminProfile.user?.profileInfo?.lastName || "",
          avatar: adminProfile.user?.profileInfo?.avatar || "",
          phone: adminProfile.user?.profileInfo?.phone || "",
          dateOfBirth: adminProfile.user?.profileInfo?.dateOfBirth
            ? new Date(adminProfile.user.profileInfo.dateOfBirth)
                .toISOString()
                .split("T")[0]
            : "",
          gender: adminProfile.user?.profileInfo?.gender || "",
          address: {
            street: adminProfile.user?.profileInfo?.address?.street || "",
            city: adminProfile.user?.profileInfo?.address?.city || "",
            state: adminProfile.user?.profileInfo?.address?.state || "",
            country: adminProfile.user?.profileInfo?.address?.country || "",
            zipCode: adminProfile.user?.profileInfo?.address?.zipCode || "",
          },
          bio: adminProfile.user?.profileInfo?.bio || "",
        },
        socialLinks: adminProfile.user?.socialLinks || {},
        notificationPreferences: adminProfile.user?.notificationPreferences || {},
        position: adminProfile.position || "",
        department: adminProfile.department || "",
        responsibilities: adminProfile.responsibilities || [],
        accessLevel: adminProfile.accessLevel || "",
        permissions: adminProfile.permissions || {},
        contactInformation: adminProfile.contactInformation || {},
      });
    }
    setIsEditing(false);
  };
  
  // This is the corrected function
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = JSON.parse(JSON.stringify(formData));

    // Function to recursively clean up empty strings
    const cleanupEmptyStrings = (obj) => {
      for (const key in obj) {
        if (obj[key] === "") {
          obj[key] = undefined; // Set to undefined to prevent Mongoose validation errors
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          cleanupEmptyStrings(obj[key]);
        }
      }
    };
    
    // Clean up the payload before sending
    cleanupEmptyStrings(payload);

    try {
      await dispatch(updateAdminProfile(payload))
        .unwrap()
        .then(() => {
          setIsEditing(false);
          toast.success("Profile updated successfully!");
        });
    } catch (err) {
      console.error("Update Error:", err);
      const errorMessage = err?.message || "Failed to update profile.";
      toast.error(errorMessage);
    }
  };

  const getPermissionLabel = (key) => {
    const labels = {
      canManageUsers: "Manage Users",
      canManageContent: "Manage Content",
      canManageCourses: "Manage Courses",
      canManageFinancials: "Manage Financials",
      canManageSystemSettings: "Manage System Settings",
      canViewAnalytics: "View Analytics",
      canManageSupport: "Manage Support",
    };
    return labels[key] || key;
  };

  const renderField = (label, value, icon, name, type = "text") => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
        />
      ) : (
        <span className="text-base text-foreground">
          {value || "Not provided"}
        </span>
      )}
    </div>
  );

  const renderSelectField = (label, value, icon, name, options) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {isEditing ? (
        <select
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-base text-foreground">
          {options.find((opt) => opt.value === value)?.label || "Not provided"}
        </span>
      )}
    </div>
  );

  const renderSocialLink = (label, value, name, icon) => (
    <div className="flex items-center gap-3">
      {icon}
      {isEditing ? (
        <input
          type="text"
          name={`socialLinks.${name}`}
          value={value}
          onChange={handleInputChange}
          placeholder={label}
          className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
        />
      ) : (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {value || "Not provided"}
        </a>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Admin profile not found.
      </div>
    );
  }

  const { user } = adminProfile;

  return (
    <div className="p-8 bg-background font-body text-foreground min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-heading">Admin Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transitions"
            >
              <Edit className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transitions"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transitions"
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar and Basic Info */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 rounded-xl bg-card shadow-md border border-border"
          >
            <div className="relative group">
              <img
                src={
                  formData.profileInfo.avatar ||
                  "https://res.cloudinary.com/dpoavhrhl/image/upload/v1754401268/old7p4zsvgp1akaxw4zr.jpg" // Fallback to a default image
                }
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-md"
              />
              {isEditing && (
                <div
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {singleFileStatus === "loading" ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              )}
            </div>
            <div className="flex-grow text-center md:text-left">
              {isEditing ? (
                <>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <input
                      type="text"
                      name="profileInfo.firstName"
                      value={formData.profileInfo.firstName}
                      onChange={handleInputChange}
                      className="text-2xl font-bold font-heading bg-input p-2 rounded-lg border border-border w-40"
                    />
                    <input
                      type="text"
                      name="profileInfo.lastName"
                      value={formData.profileInfo.lastName}
                      onChange={handleInputChange}
                      className="text-2xl font-bold font-heading bg-input p-2 rounded-lg border border-border w-40"
                    />
                  </div>
                  <p className="text-muted-foreground mt-1">
                    @{user?.username}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold font-heading">
                    {user?.profileInfo?.firstName} {user?.profileInfo?.lastName}
                  </h2>
                  <p className="text-muted-foreground">
                    @{user?.username}
                  </p>
                </>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Personal Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="p-8 rounded-xl bg-card shadow-md border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 font-heading">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField(
                "Phone",
                formData.profileInfo.phone,
                <Phone className="w-4 h-4" />,
                "profileInfo.phone"
              )}
              {renderField(
                "Date of Birth",
                formData.profileInfo.dateOfBirth,
                <Calendar className="w-4 h-4" />,
                "profileInfo.dateOfBirth",
                "date"
              )}
              {renderSelectField(
                "Gender",
                formData.profileInfo.gender,
                <User className="w-4 h-4" />,
                "profileInfo.gender",
                [
                  { value: "", label: "Select Gender" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer-not-to-say", label: "Prefer not to say" },
                ]
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 font-heading">
                Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {renderField(
                  "Street",
                  formData.profileInfo.address.street,
                  <MapPin className="w-4 h-4" />,
                  "profileInfo.address.street"
                )}
                {renderField(
                  "City",
                  formData.profileInfo.address.city,
                  <MapPin className="w-4 h-4" />,
                  "profileInfo.address.city"
                )}
                {renderField(
                  "State",
                  formData.profileInfo.address.state,
                  <MapPin className="w-4 h-4" />,
                  "profileInfo.address.state"
                )}
                {renderField(
                  "Country",
                  formData.profileInfo.address.country,
                  <Globe className="w-4 h-4" />,
                  "profileInfo.address.country"
                )}
                {renderField(
                  "Zip Code",
                  formData.profileInfo.address.zipCode,
                  <MapPin className="w-4 h-4" />,
                  "profileInfo.address.zipCode"
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 font-heading">Bio</h3>
              {isEditing ? (
                <textarea
                  name="profileInfo.bio"
                  value={formData.profileInfo.bio}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none min-h-[100px]"
                />
              ) : (
                <p className="text-base text-foreground">
                  {formData.profileInfo.bio || "Not provided"}
                </p>
              )}
            </div>
          </motion.div>

          {/* Social Links Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="p-8 rounded-xl bg-card shadow-md border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 font-heading">
              Social Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {renderSocialLink(
                "Website",
                formData.socialLinks.website,
                "website",
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSocialLink(
                "GitHub",
                formData.socialLinks.github,
                "github",
                <Github className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSocialLink(
                "LinkedIn",
                formData.socialLinks.linkedin,
                "linkedin",
                <Linkedin className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSocialLink(
                "Twitter",
                formData.socialLinks.twitter,
                "twitter",
                <Twitter className="w-4 h-4 text-muted-foreground" />
              )}
              {renderSocialLink(
                "YouTube",
                formData.socialLinks.youtube,
                "youtube",
                <Youtube className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </motion.div>

          {/* Admin Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-8 rounded-xl bg-card shadow-md border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 font-heading">
              Admin Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderField(
                "Position",
                formData.position,
                <Briefcase className="w-4 h-4" />,
                "position"
              )}
              {renderField(
                "Department",
                formData.department,
                <Building className="w-4 h-4" />,
                "department"
              )}
              {renderField(
                "Access Level",
                formData.accessLevel,
                <Layers className="w-4 h-4" />,
                "accessLevel"
              )}
              {renderField(
                "Office Location",
                formData.contactInformation.officeLocation,
                <MapPin className="w-4 h-4" />,
                "contactInformation.officeLocation"
              )}
              {renderField(
                "Phone Extension",
                formData.contactInformation.phoneExtension,
                <Phone className="w-4 h-4" />,
                "contactInformation.phoneExtension"
              )}
              {renderField(
                "Emergency Contact",
                formData.contactInformation.emergencyContact,
                <Phone className="w-4 h-4" />,
                "contactInformation.emergencyContact"
              )}
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 font-heading">
                Responsibilities
              </h3>
              <AnimatePresence>
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formData.responsibilities.map((resp, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 mb-2"
                      >
                        <input
                          type="text"
                          value={resp}
                          onChange={(e) =>
                            handleResponsibilitiesChange(e, index)
                          }
                          className="flex-grow p-2 rounded-lg bg-input border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeResponsibility(index)}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transitions"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    <button
                      type="button"
                      onClick={addResponsibility}
                      className="flex items-center gap-2 mt-2 text-primary hover:underline"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Add Responsibility</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.ul
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="list-disc list-inside space-y-1 text-foreground"
                  >
                    {formData.responsibilities.length > 0 ? (
                      formData.responsibilities.map((resp, index) => (
                        <li key={index}>{resp}</li>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No responsibilities listed.
                      </p>
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Permissions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="p-8 rounded-xl bg-card shadow-md border border-border"
          >
            <h2 className="text-xl font-semibold mb-6 font-heading">
              Permissions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(formData.permissions || {}).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg bg-input/50"
                  >
                    <span className="text-foreground">
                      {getPermissionLabel(key)}
                    </span>
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => handlePermissionToggle(key)}
                        className="p-1 rounded-full hover:bg-muted transitions"
                      >
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={key + value}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            {value ? (
                              <ToggleRight className="w-6 h-6 text-primary" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </button>
                    ) : (
                      <span>
                        {value ? (
                          <CheckCircle className="w-5 h-5 text-accent" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminProfile;