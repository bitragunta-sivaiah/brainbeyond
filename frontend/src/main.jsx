import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import { router } from './router/index.jsx'
import { ThemeProvider } from './utils/ThemeProvider.jsx'
import { Provider } from 'react-redux'
import store from './store/store'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
    <ThemeProvider>
     <RouterProvider router={router} />
     </ThemeProvider>
     </Provider>
  </StrictMode>,
)
