/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * main.jsx — Application Entry Point
 * =====================================
 * Bootstraps the React app by configuring AWS Amplify with Cognito credentials
 * from environment variables, then mounts the root <App /> component into the
 * DOM inside React StrictMode.
 *
 * Required environment variables:
 *   VITE_COGNITO_USER_POOL_ID — Cognito User Pool ID.
 *   VITE_COGNITO_CLIENT_ID    — Cognito App Client ID.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.jsx'

// Configures AWS Amplify with Cognito User Pool settings from environment variables.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        email: true,
      },
    },
  },
})

// Mounts the React app into the #root DOM element with StrictMode enabled.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
