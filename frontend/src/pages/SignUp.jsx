import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { registerUser, verifyEmailOtp, requestOtp } from '../store/redux/authSlice';
import { Link, useNavigate } from 'react-router-dom';

// Component for a single OTP input box, now correctly using forwardRef
const OtpInput = React.forwardRef(({ value, onChange, onKeyDown }, ref) => (
  <input
    type="text"
    maxLength="1"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    className="w-12 h-12 text-center text-2xl font-mono border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 bg-card text-card-foreground font-font-mono "
    ref={ref}
  />
));

const AnimatedLogo = () => (
    <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
   className="h-10 w-10 text-primary transition-colors duration-300"
    fill="currentColor"
  >
    <title>Brain Beyond</title>
    <path d="M21.809 5.524L12.806.179l-.013-.007.078-.045h-.166a1.282 1.282 0 0 0-1.196.043l-.699.403-8.604 4.954a1.285 1.285 0 0 0-.644 1.113v10.718c0 .46.245.884.644 1.113l9.304 5.357c.402.232.898.228 1.297-.009l9.002-5.345c.39-.231.629-.651.629-1.105V6.628c0-.453-.239-.873-.629-1.104zm-19.282.559L11.843.719a.642.642 0 0 1 .636.012l9.002 5.345a.638.638 0 0 1 .207.203l-4.543 2.555-4.498-2.7a.963.963 0 0 0-.968-.014L6.83 8.848 2.287 6.329a.644.644 0 0 1 .24-.246zm14.13 8.293l-4.496-2.492V6.641a.32.32 0 0 1 .155.045l4.341 2.605v5.085zm-4.763-1.906l4.692 2.601-4.431 2.659-4.648-2.615a.317.317 0 0 1-.115-.112l4.502-2.533zm-.064 10.802l-9.304-5.357a.643.643 0 0 1-.322-.557V7.018L6.7 9.51v5.324c0 .348.188.669.491.84l4.811 2.706.157.088v4.887a.637.637 0 0 1-.329-.083z" />
  </svg>
);

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const { isLoading } = useSelector((state) => state.auth);

  // State to manage which form to display
  const [isOtpSent, setIsOtpSent] = useState(false);

  // State for registration form
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  // State for OTP verification
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  // Handles registration form submission
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(registerForm)).then((result) => {
      // Check for successful registration before switching views
      if (result.meta.requestStatus === 'fulfilled') {
        setIsOtpSent(true);
      }
    });
  };

  // Handles OTP form submission
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    // Dispatch the verification action and handle navigation on success
    dispatch(verifyEmailOtp({ email: registerForm.email, otp: otpCode })).then(
      (result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          // Navigate to the home page after successful verification
          navigate('/');
        }
      }
    );
  };
  
  // Handles OTP input changes
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/[0-9]/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Focus the next input field if a digit was entered
      if (value !== '' && index < otp.length - 1) {
        otpInputRefs.current[index + 1].focus();
      }
    }
  };

  // Handles OTP input keydown events (e.g., backspace)
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      e.preventDefault(); // Prevents default backspace behavior in some browsers
      otpInputRefs.current[index - 1].focus();
    }
  };

  // Handles resending the OTP
  const handleResendOtp = () => {
    // Dispatch the request with the email in a robust payload object
    dispatch(requestOtp({ email: registerForm.email }));
  };
  
  // Resets OTP state and focuses the first OTP input when the form is shown
  useEffect(() => {
    if (isOtpSent) {
      // Ensure the first OTP input is focused when the OTP form appears
      otpInputRefs.current[0]?.focus();
    } else {
      // Reset OTP state when the form is hidden
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOtpSent]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card p-8 rounded-2xl shadow-lg border border-border"
      >
        <div className="text-center mb-8">
          <h1 className="flex items-center justify-center w-fit p-4 rounded-full bg-accent mx-auto ">
             <AnimatedLogo/>
          </h1>
          <p className="mt-2 text-muted-foreground text-sm font-font-body ">
            Your Premier Learning Management System
          </p>
        </div>
        
        {/* AnimatePresence handles the smooth transition between the two forms */}
        <AnimatePresence mode="wait">
          {!isOtpSent ? (
            // Registration Form
            <motion.form
              key="register-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleRegisterSubmit}
            >
              <h2 className="text-2xl font-bold text-center   text-card-foreground mb-6 font-font-heading ">
                Create an account
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 font-font-body "
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 font-font-body "
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-input text-card-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 font-font-body "
                    required
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-font-body "
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
              <p className='mt-4 text-sm text-center'>Already Have an Account <Link to={'/login'} className='ml-1 text-primary'>Login</Link></p>
            </motion.form>
          ) : (
            // OTP Verification Form
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-center text-card-foreground mb-2 text-center font-font-heading ">
                Email Verification
              </h2>
              <p className="text-center text-muted-foreground mb-6 text-sm font-font-body ">
                An OTP has been sent to your email. Please enter it below to verify your account.
              </p>
              <form onSubmit={handleOtpSubmit}>
                <div className="flex justify-center gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <OtpInput
                      key={index}
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      isLast={index === otp.length - 1}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                    />
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-font-body "
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      Verify Email
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button" // Use type="button" to prevent form submission
                  onClick={handleResendOtp}
                  className="text-primary hover:underline transition-colors duration-300 text-sm font-medium font-font-body "
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SignUp;
