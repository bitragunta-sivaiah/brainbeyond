import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';

// Import the thunk for verification
import { verifyCertificate, resetCertificateState } from '../store/redux/courseCertificatesSlice';

// Import Icons
import { ShieldCheck, AlertTriangle, LoaderCircle, CheckCircle, ArrowLeft } from 'lucide-react';

// --- Helper Components ---

const Loader = () => (
  <div className="flex flex-col items-center justify-center text-center p-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <LoaderCircle className="h-12 w-12 text-blue-600" />
    </motion.div>
    <p className="mt-4 text-slate-500 font-semibold">Verifying Certificate...</p>
  </div>
);

const ErrorMessage = ({ error }) => (
  <div className="flex flex-col items-center justify-center bg-red-50 text-red-700 p-8 rounded-lg border border-dashed border-red-300 text-center">
    <AlertTriangle className="h-12 w-12 mb-4" />
    <h3 className="font-bold text-2xl">Verification Failed</h3>
    <p className="mt-2">{error}</p>
  </div>
);

// --- Main Verification Page Component ---

const VerificationTokenCertificate = () => {
  const { verificationToken } = useParams();
  const dispatch = useDispatch();

  const { currentCertificate, loading, error } = useSelector(
    (state) => state.certificates
  );

  useEffect(() => {
    if (verificationToken) {
      dispatch(verifyCertificate(verificationToken));
    }

    // Cleanup on unmount
    return () => {
      dispatch(resetCertificateState());
    };
  }, [dispatch, verificationToken]);

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col items-center justify-center p-4 font-body">
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Denk+One&family=Poppins:wght@400;600;700&display=swap');
        .font-display { font-family: 'Denk One', sans-serif; }
        .font-body { font-family: 'Poppins', sans-serif; }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10">
          <div className="flex items-center justify-center mb-6 border-b pb-6">
            <ShieldCheck className="h-10 w-10 text-green-500" />
            <h1 className="ml-4 text-3xl font-display text-slate-800">
              Credential Verification
            </h1>
          </div>

          {loading && <Loader />}
          
          {error && !loading && <ErrorMessage error={error} />}

          {!loading && !error && currentCertificate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-center bg-green-50 text-green-800 p-4 rounded-lg">
                  <CheckCircle className="h-6 w-6" />
                  <p className="ml-3 font-bold text-lg">Certificate is Valid</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-6 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">RECIPIENT</p>
                    <p className="text-2xl font-bold text-slate-900">{currentCertificate.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">COURSE COMPLETED</p>
                    <p className="text-2xl font-bold text-slate-900">{currentCertificate.courseTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">ISSUE DATE</p>
                    <p className="text-lg font-semibold text-slate-700">
                      {new Date(currentCertificate.issueDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                   <div>
                    <p className="text-sm text-slate-500">ISSUED BY</p>
                    <p className="text-lg font-semibold text-slate-700">{currentCertificate.issuedBy}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="text-center mt-6">
            <Link to="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-semibold transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerificationTokenCertificate;
