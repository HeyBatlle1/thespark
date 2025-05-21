import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForms from './AuthForms'; // Import AuthForms component
import ProfileSetup from './ProfileSetup'; // Import ProfileSetup component
import ProfilePage from './ProfilePage'; // Import ProfilePage component
import CreatePost from './CreatePost'; // Import CreatePost component
import supabase from './supabaseConfig'; // Import the Supabase client

function App() {
  const [user, setUser] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true); // State to manage initial loading

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // Check if profile exists in Supabase
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id') // Select just the ID to check existence
            .eq('id', currentUser.id) // Filter by user ID (using currentUser.id for Supabase user)
            .single();

          setProfileExists(!!data); // Profile exists if data is returned
          if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
             throw error;
          }
        } catch (error) {
          console.error('Error checking profile existence:', error.message);
          setProfileExists(false); // Assume profile doesn't exist on error
        }
      } else {
        setProfileExists(false); // No user, no profile
      }
      setLoading(false); // Authentication state and profile check complete
    });

    // Clean up the subscription
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-200">Loading...</div>;
  }

  return (
    <div className="App bg-zinc-800 flex items-center justify-center min-h-screen text-gray-200">
      {/* Components will go here */}
      {user ? (
        profileExists ? (
          <ProfilePage /> // Show profile page if user is logged in and profile exists
        ) : (
          <ProfileSetup onProfileSaved={() => setProfileExists(true)} /> // Show profile setup if user is logged in but profile doesn't exist, pass callback to update state
        )
      ) : (
        <AuthForms /> // Show auth forms if no user is logged in
      )}

      {/* TODO: Integrate CreatePost component into a proper routing structure */}
      {user && <CreatePost />} {/* Temporarily render CreatePost for logged-in users */}
    </div>
  );
}

export default App;
