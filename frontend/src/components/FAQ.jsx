import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPublicFAQs } from '../store/redux/faqSlice'; // Adjust the import path as needed
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Minus } from 'lucide-react';
import { Disclosure } from '@headlessui/react'; // A great library for accessible accordions

// You'll need to install headlessui
// npm install @headlessui/react

const FAQ = () => {
  const dispatch = useDispatch();
  const { faqs, loading, error } = useSelector((state) => state.faq);

  useEffect(() => {
    dispatch(fetchPublicFAQs());
  }, [dispatch]);

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
        <p>An error occurred while fetching FAQs: {error}</p>
      </div>
    );
  }

  // Group FAQs by category for a better user experience
  const faqsByCategory = faqs.reduce((acc, faq) => {
    const category = faq.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  return (
    <div className="p-8 bg-background font-body text-foreground min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold font-heading text-center mb-12">
          Frequently Asked Questions
        </h1>

        {faqs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground rounded-xl bg-card shadow-md border border-border">
            <p>No FAQs are available at the moment. Please check back later!</p>
          </div>
        ) : (
          Object.entries(faqsByCategory).map(([category, faqs]) => (
            <div key={category} className="mb-10">
              <h2 className="text-2xl font-bold font-heading mb-6 border-b-2 border-primary/20 pb-2">
                {category}
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <motion.div
                    key={faq._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: faq.order * 0.05 }} // Staggered animation
                    className="bg-card rounded-xl shadow-md border border-border"
                  >
                    <Disclosure>
                      {({ open }) => (
                        <div className="w-full"> {/* <-- The fix is here */}
                          <Disclosure.Button className="flex w-full items-center justify-between p-6 text-left text-lg font-medium font-body text-foreground transition-colors hover:text-primary">
                            <span>{faq.question}</span>
                            <span className="ml-6 flex-shrink-0 text-primary">
                              {open ? (
                                <Minus className="w-6 h-6" />
                              ) : (
                                <Plus className="w-6 h-6" />
                              )}
                            </span>
                          </Disclosure.Button>
                          <AnimatePresence initial={false}>
                            {open && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                              >
                                <Disclosure.Panel className="px-6 pb-6 text-base text-muted-foreground">
                                  {faq.answer}
                                </Disclosure.Panel>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </Disclosure>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  );
};

export default FAQ;