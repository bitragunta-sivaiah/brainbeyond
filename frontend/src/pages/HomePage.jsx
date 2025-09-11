import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActiveHomepage } from '../store/redux/homepageSlice';
import {
  Loader2,
  AlertCircle,
  Quote,
  ArrowRight
} from 'lucide-react';

// --- Section Components ---

const HeroSection = ({ title, subtitle, heroConfig }) => {
  if (!heroConfig?.imageUrl) return null;

  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center p-8 text-center text-white bg-cover bg-center"
      style={{ backgroundImage: `url(${heroConfig.imageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold font-heading">{title}</h1>
        <p className="mt-4 text-xl md:text-2xl font-body">{subtitle}</p>
        {heroConfig.callToAction?.text && (
          <a href={heroConfig.callToAction.link} className={`mt-8 inline-flex items-center px-8 py-3 rounded-full font-semibold transition-transform duration-300 hover:scale-105 ${heroConfig.callToAction.buttonStyle}`}>
            {heroConfig.callToAction.text}
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        )}
      </div>
    </section>
  );
};

const FeaturedCoursesSection = ({ title, subtitle, featuredCoursesConfig }) => {
  // The API response includes the full course objects directly, not just IDs.
  // We can directly use this array.
  const featuredCourses = featuredCoursesConfig?.courses || [];

  if (featuredCourses.length === 0) return null;

  return (
    <section className="py-16 bg-card text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold font-heading">{title}</h2>
        <p className="mt-2 text-xl text-muted-foreground">{subtitle}</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredCourses.slice(0, featuredCoursesConfig.count).map(course => (
            <div key={course._id} className="bg-background rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 duration-300">
              <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Price: ${course.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({ title, subtitle, testimonialsConfig }) => {
  if (testimonialsConfig?.testimonials.length === 0) return null;

  return (
    <section className="py-16 bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold font-heading">{title}</h2>
        <p className="mt-2 text-xl text-muted-foreground">{subtitle}</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonialsConfig.testimonials.map((testimonial, index) => (
            <div key={index} className="bg-card p-8 rounded-lg shadow-md">
              <Quote className="w-8 h-8 text-primary mb-4 mx-auto" />
              <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
              <div className="mt-4 flex items-center justify-center">
                <img src={testimonial.avatar} alt={testimonial.author} className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.authorTitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ title, ctaConfig }) => {
  if (!ctaConfig?.buttonLink) return null;

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold font-heading">{title}</h2>
        <p className="mt-2 text-xl">{ctaConfig.mainText}</p>
        <p className="mt-2 text-lg text-primary-foreground/80">{ctaConfig.secondaryText}</p>
        <a href={ctaConfig.buttonLink} className={`mt-8 inline-flex items-center px-8 py-3 rounded-full font-semibold transition-transform duration-300 hover:scale-105 ${ctaConfig.buttonStyle}`}>
          {ctaConfig.buttonText}
          <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

// Placeholder components for sections not yet implemented in the data
const LatestBlogPostsSection = () => null;
const UpcomingEventsSection = () => null;
const InstructorSpotlightSection = () => null;
const CustomHtmlSection = () => null;

// --- Main HomePage Component ---

const HomePage = () => {
  const dispatch = useDispatch();
  const { activeHomepage, loading, error } = useSelector((state) => state.homepage);

  useEffect(() => {
    dispatch(fetchActiveHomepage());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !activeHomepage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center text-red-600 bg-red-50">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h1 className="text-2xl font-bold">Error Loading Homepage</h1>
        <p className="mt-2">
          We couldn't fetch the homepage content. This could be due to a network issue or missing data.
        </p>
        {error && <p className="mt-4 text-sm text-gray-500">Details: {error.message}</p>}
        {!activeHomepage && <p className="mt-4 text-sm text-gray-500">No active homepage configuration found.</p>}
      </div>
    );
  }

  const renderSection = (section, index) => {
    if (!section.isActive) return null;

    switch (section.type) {
      case 'hero':
        return <HeroSection key={index} {...section} />;
      case 'featuredCourses':
        return <FeaturedCoursesSection key={index} {...section} />;
      case 'testimonials':
        return <TestimonialsSection key={index} {...section} />;
      case 'latestBlogPosts':
        return <LatestBlogPostsSection key={index} {...section} />;
      case 'upcomingEvents':
        return <UpcomingEventsSection key={index} {...section} />;
      case 'cta':
        return <CTASection key={index} {...section} />;
      case 'instructorSpotlight':
        return <InstructorSpotlightSection key={index} {...section} />;
      case 'customHtml':
        return <CustomHtmlSection key={index} {...section} />;
      default:
        console.warn(`Unknown section type: ${section.type}`);
        return null;
    }
  };

  const sortedSections = activeHomepage?.sections 
    ? [...activeHomepage.sections].sort((a, b) => a.order - b.order) 
    : [];

  return (
    <div className="bg-background text-foreground font-body">
      <div className="space-y-12">
        {sortedSections.map(renderSection)}
      </div>
    </div>
  );
};

export default HomePage;