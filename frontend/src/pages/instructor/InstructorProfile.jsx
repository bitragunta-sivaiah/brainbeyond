import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Github,
  GraduationCap,
  Linkedin,
  PenSquare,
  Play,
  Twitter,
  Upload,
  UserRound,
  Youtube,
  Globe,
  Star,
  BookOpen,
  Users,
  Award,
} from 'lucide-react';
import {
  getInstructorProfile,
  updateInstructorProfile,
  getInstructorCourses,
} from '../../store/redux/instructorSlice';
import { uploadSingleFile } from '../../store/redux/uploadSlice';
import { toast } from 'react-hot-toast';

const InstructorProfile = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;

  const dispatch = useDispatch();

  const { profile, courses, isLoading, error } = useSelector(
    (state) => state.instructor
  );
  const { singleFileStatus, singleFile } = useSelector((state) => state.upload);

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    userBio: '', // This corresponds to user.profileInfo.bio
    phone: '',
    headline: '',
    experience: 0,
    certifications: '', // To be handled as a JSON string or similar for the form
    specializations: '',
    teachingPhilosophy: '',
    portfolioUrl: '',
    socialLinks: {
      website: '',
      github: '',
      linkedin: '',
      twitter: '',
      youtube: '',
    },
    // We'll add new user fields here as needed
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    timezone: '',
  });

  useEffect(() => {
    if (userId) {
      dispatch(getInstructorProfile(userId));
      dispatch(getInstructorCourses(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (profile) {
      const { user } = profile;
      setProfileForm({
        firstName: user?.profileInfo?.firstName || '',
        lastName: user?.profileInfo?.lastName || '',
        userBio: user?.profileInfo?.bio || '',
        headline: profile.headline || '',
        experience: profile.experience || 0,
        certifications: profile.certifications
          ? JSON.stringify(profile.certifications, null, 2)
          : '[]',
        specializations: profile.specializations
          ? profile.specializations.join(', ')
          : '',
        teachingPhilosophy: profile.teachingPhilosophy || '',
        portfolioUrl: profile.portfolioUrl || '',
        phone: user?.profileInfo?.phone || '',
        socialLinks: {
          website: user?.socialLinks?.website || '',
          github: user?.socialLinks?.github || '',
          linkedin: user?.socialLinks?.linkedin || '',
          twitter: user?.socialLinks?.twitter || '',
          youtube: user?.socialLinks?.youtube || '',
        },
        dateOfBirth: user?.profileInfo?.dateOfBirth
          ? new Date(user.profileInfo.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: user?.profileInfo?.gender || '',
        address: {
          street: user?.profileInfo?.address?.street || '',
          city: user?.profileInfo?.address?.city || '',
          state: user?.profileInfo?.address?.state || '',
          country: user?.profileInfo?.address?.country || '',
          zipCode: user?.profileInfo?.address?.zipCode || '',
        },
        timezone: user?.profileInfo?.timezone || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (singleFileStatus === 'succeeded' && singleFile && userId) {
      const newAvatarUrl = singleFile.fileUrl;
      const updateData = {
        // The backend expects avatar as part of profileInfo, not a top-level field.
        profileInfo: {
          avatar: newAvatarUrl,
        },
      };

      dispatch(updateInstructorProfile({ userId, updateData }));

      toast.success('Avatar uploaded successfully!');
      // You should also clear the singleFile state after use
      // assuming a reducer action like `dispatch(clearSingleFileState())` exists.
    }
  }, [singleFileStatus, singleFile, dispatch, userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name in profileForm.socialLinks) {
      setProfileForm((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [name]: value,
        },
      }));
    } else if (['street', 'city', 'state', 'country', 'zipCode'].includes(name)) {
      setProfileForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    try {
      const parsedCertifications = JSON.parse(profileForm.certifications);
      if (!Array.isArray(parsedCertifications)) {
        throw new Error('Certifications must be a valid JSON array.');
      }

      const updateData = {
        profileInfo: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          bio: profileForm.userBio,
          phone: profileForm.phone,
          dateOfBirth: profileForm.dateOfBirth,
          gender: profileForm.gender,
          address: profileForm.address,
          timezone: profileForm.timezone,
        },
        socialLinks: profileForm.socialLinks,
        instructorProfile: {
          headline: profileForm.headline,
          experience: Number(profileForm.experience),
          certifications: parsedCertifications,
          specializations: profileForm.specializations
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item),
          teachingPhilosophy: profileForm.teachingPhilosophy,
          portfolioUrl: profileForm.portfolioUrl,
        },
      };
      dispatch(updateInstructorProfile({ userId, updateData }));
      setIsEditing(false);
    } catch (err) {
      toast.error(`Error saving profile: ${err.message}`);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadSingleFile(file));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground font-body">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl"
        >
          Loading Profile...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive font-body">
        <div className="text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground font-body">
        <div className="text-xl">Profile not found.</div>
      </div>
    );
  }

  const {
    user: userData,
    totalStudents,
    totalCourses,
    averageRating,
    totalReviews,
    experience,
    certifications,
  } = profile;

  return (
    <div className="container mx-auto px-4 py-12 bg-background text-foreground">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Profile Card */}
          <div className="col-span-1 md:col-span-1">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-lg shadow-md p-6 border border-border sticky top-8"
            >
              <div className="flex justify-end mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 rounded-full bg-accent text-accent-foreground hover:bg-opacity-80 transition-colors"
                >
                  <PenSquare size={20} />
                </motion.button>
              </div>
              {/* Avatar section */}
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-primary">
                <img
                  src={
                    userData?.profileInfo?.avatar ||
                    'https://via.placeholder.com/150'
                  }
                  alt="Instructor Avatar"
                  className="w-full h-full object-cover"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-primary bg-opacity-50 text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Upload size={24} />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={singleFileStatus === 'loading'}
                  />
                </label>
              </div>
              <h1 className="text-2xl font-heading text-center mb-2">
                {userData?.profileInfo?.firstName}{' '}
                {userData?.profileInfo?.lastName}
              </h1>
              <h2 className="text-sm text-muted-foreground text-center mb-4 font-body">
                {profile?.headline}
              </h2>
              {/* Stats Section */}
              <div className="flex justify-around mb-6 text-center">
                <div>
                  <Users size={24} className="mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div>
                  <BookOpen size={24} className="mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{totalCourses}</p>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div>
                  <Star size={24} className="mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">
                    {averageRating?.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-muted-foreground text-xl">
                {userData?.socialLinks?.linkedin && (
                  <a
                    href={userData.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin />
                  </a>
                )}
                {userData?.socialLinks?.github && (
                  <a
                    href={userData.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github />
                  </a>
                )}
                {userData?.socialLinks?.twitter && (
                  <a
                    href={userData.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Twitter />
                  </a>
                )}
                {userData?.socialLinks?.youtube && (
                  <a
                    href={userData.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Youtube />
                  </a>
                )}
                {userData?.socialLinks?.website && (
                  <a
                    href={userData.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe />
                  </a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {isEditing ? (
                // Profile Edit Form
                <form
                  onSubmit={handleFormSubmit}
                  className="bg-card rounded-lg shadow-md p-6 border border-border"
                >
                  <h3 className="text-xl font-heading mb-4">Edit Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="headline"
                      value={profileForm.headline}
                      onChange={handleInputChange}
                      placeholder="Headline"
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      name="experience"
                      value={profileForm.experience}
                      onChange={handleInputChange}
                      placeholder="Years of Experience"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={profileForm.dateOfBirth}
                      onChange={handleInputChange}
                      placeholder="Date of Birth"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select
                      name="gender"
                      value={profileForm.gender}
                      onChange={handleInputChange}
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                    <textarea
                      name="specializations"
                      value={profileForm.specializations}
                      onChange={handleInputChange}
                      placeholder="Specializations (comma-separated)"
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      name="userBio"
                      value={profileForm.userBio}
                      onChange={handleInputChange}
                      placeholder="Your general biography (max 500 characters)"
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      name="teachingPhilosophy"
                      value={profileForm.teachingPhilosophy}
                      onChange={handleInputChange}
                      placeholder="Your teaching philosophy (max 1000 characters)"
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="portfolioUrl"
                      value={profileForm.portfolioUrl}
                      onChange={handleInputChange}
                      placeholder="Portfolio URL"
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                      name="certifications"
                      value={profileForm.certifications}
                      onChange={handleInputChange}
                      placeholder='Certifications (JSON format): [{"name": "...", "issuer": "...", "dateObtained": "YYYY-MM-DD"}]'
                      className="col-span-2 p-2 rounded-md bg-input border border-border text-foreground h-32 focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                    <h4 className="col-span-2 font-semibold mt-4">Address</h4>
                    <input
                      type="text"
                      name="street"
                      value={profileForm.address.street}
                      onChange={handleInputChange}
                      placeholder="Street"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="city"
                      value={profileForm.address.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="state"
                      value={profileForm.address.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="country"
                      value={profileForm.address.country}
                      onChange={handleInputChange}
                      placeholder="Country"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="zipCode"
                      value={profileForm.address.zipCode}
                      onChange={handleInputChange}
                      placeholder="Zip Code"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="timezone"
                      value={profileForm.timezone}
                      onChange={handleInputChange}
                      placeholder="Timezone"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <h4 className="col-span-2 font-semibold mt-4">Social Links</h4>
                    <input
                      type="text"
                      name="linkedin"
                      value={profileForm.socialLinks.linkedin}
                      onChange={handleInputChange}
                      placeholder="LinkedIn URL"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="github"
                      value={profileForm.socialLinks.github}
                      onChange={handleInputChange}
                      placeholder="GitHub URL"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="twitter"
                      value={profileForm.socialLinks.twitter}
                      onChange={handleInputChange}
                      placeholder="Twitter URL"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="youtube"
                      value={profileForm.socialLinks.youtube}
                      onChange={handleInputChange}
                      placeholder="YouTube URL"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      name="website"
                      value={profileForm.socialLinks.website}
                      onChange={handleInputChange}
                      placeholder="Personal Website URL"
                      className="p-2 rounded-md bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
                    >
                      Save Changes
                    </motion.button>
                  </div>
                </form>
              ) : (
                // Profile View
                <div>
                  {/* Bio & Philosophy Section */}
                  <div className="bg-card rounded-lg shadow-md p-6 border border-border mb-8">
                    <h3 className="text-xl font-heading mb-4 border-b pb-2 border-border">
                      About Me
                    </h3>
                    <div className="flex items-start mb-4">
                      <UserRound size={20} className="mr-3 mt-1 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">Biography</h4>
                        <p className="text-muted-foreground">
                          {userData?.profileInfo?.bio || 'No bio provided.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <GraduationCap size={20} className="mr-3 mt-1 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          Teaching Philosophy
                        </h4>
                        <p className="text-muted-foreground">
                          {profile?.teachingPhilosophy ||
                            'No teaching philosophy provided.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Skills and Experience Section */}
                  <div className="bg-card rounded-lg shadow-md p-6 border border-border">
                    <h3 className="text-xl font-heading mb-4 border-b pb-2 border-border">
                      Skills & Expertise
                    </h3>
                    <div className="flex items-start mb-4">
                      <Briefcase size={20} className="mr-3 mt-1 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          Specializations
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {profile?.specializations?.length > 0 ? (
                            profile.specializations.map((spec, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-semibold"
                              >
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No specializations listed.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start mb-4">
                      <Briefcase size={20} className="mr-3 mt-1 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          Experience
                        </h4>
                        <p className="text-muted-foreground">
                          {experience > 0 ? `${experience} years` : 'Less than a year'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Award size={20} className="mr-3 mt-1 text-primary" />
                      <div>
                        <h4 className="font-semibold text-foreground">
                          Certifications
                        </h4>
                        {certifications?.length > 0 ? (
                          <ul className="list-disc list-inside text-muted-foreground mt-2">
                            {certifications.map((cert, index) => (
                              <li key={index}>
                                {cert.name} from {cert.issuer} (
                                {new Date(cert.dateObtained).getFullYear()})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">
                            No certifications listed.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 bg-card rounded-lg shadow-md p-6 border border-border"
        >
          <h3 className="text-2xl font-heading mb-6 border-b pb-2 border-border">
            Courses by {userData?.profileInfo?.firstName}
          </h3>
          <AnimatePresence mode="wait">
            {courses.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {courses.map((course) => (
                  <motion.div
                    key={course._id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-muted rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-foreground truncate">
                      {course.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.shortDescription}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-primary text-xl">
                        ${course.price}
                      </span>
                      <button className="flex items-center text-accent-foreground hover:underline">
                        View Course <Play size={16} className="ml-1" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground"
              >
                <p>This instructor has not published any courses yet.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InstructorProfile;