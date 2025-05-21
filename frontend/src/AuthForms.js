import React, { useState } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client

// Component for Sign Up and Login Forms
function AuthForms() {
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Handle Sign Up form submission
  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const { user, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });
      if (error) throw error;
      console.log('User signed up:', user);
      // TODO: Transition to profile setup or profile page
    } catch (error) {
      console.error('Error signing up:', error.message);
      // TODO: Display error message to user
    }
  };

  // Handle Login form submission
  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      console.log('User logged in:', user);
      // TODO: Transition to profile page
    } catch (error) {
      console.error('Error logging in:', error.message);
      // TODO: Display error message to user
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const { user, session, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      console.log('Google Sign-In successful:', user, session);
      // TODO: Transition to profile setup or profile page
    } catch (error) {
      console.error('Error during Google Sign-In:', error.message);
      // TODO: Display error message to user
    }
  };

  return (
    <div className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-sm text-gray-200">
      {/* Sign Up Form - Migrated from index.html */}
      <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div className="mb-4">
          <label htmlFor="signup-email" className="block text-gray-200 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            id="signup-email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={signupEmail}
            onChange={(e) => setSignupEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="signup-password" className="block text-gray-200 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            id="signup-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Sign Up</button>
        </div>
      </form>

      {/* Login Form - Migrated from index.html */}
      <h2 className="text-2xl font-bold text-center mb-6 mt-8">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="login-email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            id="login-email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="login-password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input
            type="password"
            id="login-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Login</button>
        </div>
      </form>

      {/* Google Sign-In Button - Migrated from index.html */}
      <div className="mt-6 text-center">
          <p className="mb-4">Or sign in with:</p>
          {/* Replace Google Sign-In HTML with a button that triggers handleGoogleSignIn */}
          <button
            onClick={handleGoogleSignIn}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Sign in with Google
          </button>
      </div>
    </div>
  );
}

export default AuthForms;
