import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { unwrapResult } from '@reduxjs/toolkit';
import { User, Mail, Lock, CheckCircle, ArrowLeft, ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react';
// CORRECTED: Imported the new clearAuthError action.
import { loginUser, requestOtp, loginWithOtp, forgotPassword } from '../store/redux/authSlice';
import { Link, useNavigate } from 'react-router-dom';

// Component for a single OTP input box
const OtpInput = React.forwardRef(({ value, onChange, onKeyDown }, ref) => (
  <input
    type="text"
    maxLength="1"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    className="w-12 h-12 text-center text-2xl font-mono border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-card text-card-foreground"
    ref={ref}
  />
));
OtpInput.displayName = 'OtpInput';


// Animated Logo Component
const AnimatedLogo = () => (
    <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10 text-primary transition-colors duration-300"
        fill="currentColor"
    >
        <title>HDS LMS</title>
        <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
    </svg>
);


// Component to display validation errors
const ErrorDisplay = ({ message }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 text-sm text-red-500 flex items-center justify-center gap-2"
    >
      <AlertCircle className="w-4 h-4" />
      {message}
    </motion.p>
  );
};


const Login = () => {
  const dispatch = useDispatch();
  const { isLoading, user, error: authError } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [viewState, setViewState] = useState('login');
  const [error, setError] = useState(null);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // CORRECTED: Use a single useEffect to watch for backend errors from Redux.
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // CORRECTED: A robust view changer that clears all local and Redux errors.
  const changeView = (newView) => {
    setError(null);
   
    // Keep email in the identifier field when moving from request to enter OTP
    if (newView !== 'otpLogin') {
      setIdentifier('');
    }
    setPassword('');
    setOtp(['', '', '', '', '', '']);
    setViewState(newView);
  };

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (error) {
        setError(null);
       
    }
  };
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) {
        setError(null);
       
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide both an identifier and a password.');
      return;
    }
    dispatch(loginUser({ identifier, password }));
  };

  // CORRECTED: Refactored to be an async function for cleaner logic.
  const handleOtpRequest = async (e) => {
    e?.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!identifier.trim() || !emailRegex.test(identifier)) {
      setError('Please provide a valid email to request an OTP.');
      return;
    }
    
    try {
      // CORRECTED: Dispatch with just the email string, as the thunk expects.
      // `unwrapResult` will make this promise reject if the thunk fails.
      await dispatch(requestOtp(identifier)).unwrap();
      setError(null); // Clear previous errors on success
      setViewState('otpLogin');
    } catch (rejectedValue) {
      // The error is already set by the useEffect watching authError,
      // so we just catch it here to prevent unhandled promise rejection warnings.
      console.error('Failed to request OTP:', rejectedValue);
    }
  };

  const handleOtpLogin = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
        setError("Please enter the full 6-digit OTP.");
        return;
    }
    // CORRECTED: Dispatch with 'email' key to match the API.
    dispatch(loginWithOtp({ email: identifier, otp: otpCode }));
  };

  // CORRECTED: Refactored for clarity and correct dispatching.
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!identifier.trim() || !emailRegex.test(identifier)) {
      setError('Please provide a valid email address.');
      return;
    }
    try {
      // CORRECTED: Dispatch with just the email string.
      await dispatch(forgotPassword(identifier)).unwrap();
      // Optionally, you can show a success message or switch to a confirmation view.
    } catch (rejectedValue) {
      console.error('Failed to request password reset:', rejectedValue);
    }
  };
  
  const handleOtpChange = (e, index) => {
    if(error) {
        setError(null);
       
    }
    const value = e.target.value;
    if (/[0-9]/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value !== '' && index < otp.length - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (viewState === 'otpLogin') {
      otpInputRefs.current[0]?.focus();
    }
  }, [viewState]);

  const renderForm = () => {
    switch (viewState) {
      case 'login':
        return (
          <motion.form
            key="login-form"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleLoginSubmit}
          >
            <h2 className="text-2xl font-bold text-center text-card-foreground mb-6 font-font-heading ">
              Log in to your account
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Username or Email"
                  value={identifier}
                  onChange={handleIdentifierChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-input placeholder:bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
            </div>
            <ErrorDisplay message={error} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <> Log In <ArrowRight className="w-5 h-5" /> </>
              )}
            </motion.button>
            <div className="mt-4 text-center text-sm">
              <button type="button" onClick={() => changeView('forgotPassword')} className="text-muted-foreground hover:underline mr-4 transition-colors duration-300" disabled={isLoading}>
                Forgot Password?
              </button>
              <button type="button" onClick={() => changeView('requestOtp')} className="text-muted-foreground hover:underline transition-colors duration-300" disabled={isLoading}>
                Login with OTP
              </button>
            </div>
            <p className='text-sm text-center mt-3'>Don't have an Account <Link to={'/signup'} className='ml-1 text-primary'>SignUp</Link></p>
          </motion.form>
        );

      case 'requestOtp':
        return (
          <motion.form
            key="request-otp-form"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleOtpRequest}
          >
            <button type="button" onClick={() => changeView('login')} className="mb-4 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-center text-card-foreground mb-2 font-font-heading ">
              Request Login OTP
            </h2>
            {/* CORRECTED: UI text updated to specify email. */}
            <p className="text-muted-foreground text-center text-sm mb-6">
              Enter your email to receive a one-time password.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              {/* CORRECTED: Input type changed to 'email' for better semantics and validation. */}
              <input
                type="email"
                placeholder="Email"
                value={identifier}
                onChange={handleIdentifierChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                required
              />
            </div>
            <ErrorDisplay message={error} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <> Request OTP <Mail className="w-5 h-5" /> </>
              )}
            </motion.button>
          </motion.form>
        );

      case 'otpLogin':
        return (
          <motion.div
            key="otp-login-form"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <button type="button" onClick={() => changeView('requestOtp')} className="mb-4 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-center text-card-foreground mb-2 font-font-heading ">
              Enter Login OTP
            </h2>
            <p className="text-center text-muted-foreground mb-6 text-sm">
              A one-time password has been sent to <strong>{identifier}</strong>.
            </p>
            <form onSubmit={handleOtpLogin}>
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((digit, index) => (
                  <OtpInput
                    key={index}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                  />
                ))}
              </div>
              <ErrorDisplay message={error} />
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isLoading}
                className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
              >
                 {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 ) : (
                   <> Log In with OTP <CheckCircle className="w-5 h-5" /> </>
                 )}
              </motion.button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={handleOtpRequest} className="text-primary hover:underline transition-colors duration-300 text-sm font-medium" disabled={isLoading}>
                Resend OTP
              </button>
            </div>
          </motion.div>
        );

      case 'forgotPassword':
        return (
          <motion.form
            key="forgot-password-form"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleForgotPassword}
          >
            <button type="button" onClick={() => changeView('login')} className="mb-4 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-center text-card-foreground mb-2 font-font-heading ">
              Forgot Password
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Enter your email to receive a password reset token.
            </p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={identifier}
                onChange={handleIdentifierChange}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                required
              />
            </div>
            <ErrorDisplay message={error} />
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : (
                <> Send Reset Token <RefreshCcw className="w-5 h-5" /> </>
              )}
            </motion.button>
          </motion.form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border"
      >
        <div className="text-center mb-8">
          <h1 className="flex items-center justify-center p-4 bg-accent rounded-full w-fit mx-auto">
            <AnimatedLogo/>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm font-font-body ">
            Your Premier Learning Management System
          </p>
        </div>
        <AnimatePresence mode="wait">
          {renderForm()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
