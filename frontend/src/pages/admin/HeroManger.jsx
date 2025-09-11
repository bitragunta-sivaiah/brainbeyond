import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createHero,
  getHeroes,
  updateHero,
  deleteHero,
} from "../../store/redux/heroSlice";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  BadgeInfo,
  X,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-hot-toast";

const HeroManager = () => {
  const dispatch = useDispatch();
  const { heroes, loading } = useSelector((state) => state.hero);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentHero, setCurrentHero] = useState(null);
  const [heroForm, setHeroForm] = useState({
    title: "",
    subtitle: "",
    ctaText: "",
    ctaLink: "",
    specialHighlight: "",
    active: true,
    role: "all",
  });
  const [heroToDelete, setHeroToDelete] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const roles = ["all", "admin", "student", "instructor", "customercare"];

  useEffect(() => {
    dispatch(getHeroes(selectedRole === "all" ? "" : selectedRole));
  }, [dispatch, selectedRole]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHeroForm({
      ...heroForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleOpenModal = (hero = null) => {
    setCurrentHero(hero);
    if (hero) {
      setHeroForm(hero);
    } else {
      setHeroForm({
        title: "",
        subtitle: "",
        ctaText: "",
        ctaLink: "",
        specialHighlight: "",
        active: true,
        role: "all",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentHero(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!heroForm.title) {
      toast.error("Title is required!");
      return;
    }
    if (currentHero) {
      dispatch(updateHero({ id: currentHero._id, heroData: heroForm })).then(
        () => {
          handleCloseModal();
        }
      );
    } else {
      dispatch(createHero(heroForm)).then(() => {
        handleCloseModal();
      });
    }
  };

  const handleDeleteHero = () => {
    if (heroToDelete) {
      dispatch(deleteHero(heroToDelete._id)).then(() => {
        setIsDeleteModalOpen(false);
        setHeroToDelete(null);
      });
    }
  };

  const openDeleteModal = (hero) => {
    setHeroToDelete(hero);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setHeroToDelete(null);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  };

  return (
    <div className="p-6 bg-background min-h-screen text-foreground">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">
          Hero Page Manager ✨
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 text-white bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus size={20} />
          <span>Add New Hero</span>
        </button>
      </header>

      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg shadow-sm text-foreground/80 transition-colors duration-200"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            Filter by Role:{" "}
            <span className="font-semibold capitalize">{selectedRole}</span>
            <ChevronDown
              size={18}
              className={`transform transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg"
              >
                {roles.map((role) => (
                  <button
                    key={role}
                    className="w-full text-left px-4 py-2 capitalize hover:bg-secondary transition-colors duration-200"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {role}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {heroes.length > 0 ? (
              heroes.map((hero, index) => (
                <motion.div
                  key={hero._id}
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  exit="hidden"
                  className="bg-card border border-border rounded-xl shadow-md p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                >
                  <div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize mb-3 ${
                        hero.role === "all"
                          ? "bg-primary text-white"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {hero.role}
                    </span>
                    <h2 className="text-xl font-heading font-bold mb-2 text-primary">
                      {hero.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {hero.subtitle}
                    </p>
                    {hero.specialHighlight && (
                      <div className="flex items-center gap-2 mb-4 bg-muted p-2 rounded-lg text-sm text-muted-foreground">
                        <BadgeInfo size={16} />
                        <span>{hero.specialHighlight}</span>
                      </div>
                    )}
                    <a
                      href={hero.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-semibold text-accent-foreground hover:underline"
                    >
                      {hero.ctaText}
                    </a>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => handleOpenModal(hero)}
                      className="p-2 text-primary rounded-full hover:bg-primary/10 transition-colors duration-200"
                      aria-label="Edit hero page"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(hero)}
                      className="p-2 text-destructive rounded-full hover:bg-destructive/10 transition-colors duration-200"
                      aria-label="Delete hero page"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center text-muted-foreground py-10"
              >
                No hero pages found for this role.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-card text-foreground p-8 rounded-xl shadow-2xl w-full max-w-lg mx-4 border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading font-bold text-primary">
                  {currentHero ? "Edit Hero Page" : "Create Hero Page"}
                </h2>
                <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground/80">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={heroForm.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="subtitle" className="block text-sm font-medium text-foreground/80">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="subtitle"
                    name="subtitle"
                    value={heroForm.subtitle}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="ctaText" className="block text-sm font-medium text-foreground/80">
                    Call to Action Text
                  </label>
                  <input
                    type="text"
                    id="ctaText"
                    name="ctaText"
                    value={heroForm.ctaText}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="ctaLink" className="block text-sm font-medium text-foreground/80">
                    Call to Action Link
                  </label>
                  <input
                    type="text"
                    id="ctaLink"
                    name="ctaLink"
                    value={heroForm.ctaLink}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="specialHighlight" className="block text-sm font-medium text-foreground/80">
                    Special Highlight
                  </label>
                  <input
                    type="text"
                    id="specialHighlight"
                    name="specialHighlight"
                    value={heroForm.specialHighlight}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-foreground/80">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={heroForm.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={heroForm.active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-foreground/80">
                    Active
                  </label>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="mr-3 px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-white bg-primary rounded-lg shadow-md hover:bg-primary/90 transition-colors duration-200"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="animate-spin" size={18} />}
                    {currentHero ? "Update Hero" : "Create Hero"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-card text-foreground p-8 rounded-xl shadow-2xl w-full max-w-sm mx-4 border border-border text-center"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Trash2 className="text-destructive" size={24} />
                </div>
                <button onClick={closeDeleteModal} className="text-muted-foreground hover:text-foreground">
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Delete Hero Page</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete the hero page titled "
                <span className="font-semibold">{heroToDelete?.title}</span>"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-muted-foreground rounded-lg hover:bg-muted transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteHero}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-destructive rounded-lg shadow-md hover:bg-destructive/90 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading && <Loader2 className="animate-spin" size={18} />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroManager;