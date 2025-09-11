import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile } from './store/redux/authSlice';
 

import Footer from './components/Footer';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import Marquee from './components/Marquee';
import Nointernet from './components/Nointernet';
import { ThemeProvider } from './utils/ThemeProvider';

const App = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // ✅ IMPROVED: Reliably track online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // If authenticated but user data isn't loaded, fetch the user profile
    if (isAuthenticated && !user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <Nointernet />;
  }

  return (
    // ✅ FIXED: ThemeProvider now wraps the entire application
    <ThemeProvider>
      <div>
        <Marquee />
        <Header />
        <Toaster />
        <main> {/* Added a main tag for semantic HTML */}
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;