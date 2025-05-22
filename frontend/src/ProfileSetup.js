import React, { useState } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client

// Component for Profile Setup Form
function ProfileSetup({ onProfileSaved }) {
  const [displayName, setDisplayName] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false); // State to manage loading
  const [error, setError] = useState(null); // State to manage errors

  // Handle Profile Setup form submission
  const handleProfileSetup = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true
    setError(null); // Clear previous errors

    let profilePictureUrl = '';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user is signed in.');
      setError('No user is signed in. Please log in.'); // Display error message
      setLoading(false);
      return;
    }

    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; // Use user.id for Supabase user

      const { error: uploadError } = await supabase.storage
        .from('profile_pictures') // Assuming a bucket named 'profile_pictures'
        .upload(filePath, profilePicture, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError.message);
        setError(`Error uploading profile picture: ${uploadError.message}`); // Display error message
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(filePath);

      profilePictureUrl = publicUrlData.publicUrl;
      console.log('Profile picture uploaded:', profilePictureUrl);
    }

    try {
      // Save profile data to Supabase
      const { error } = await supabase
        .from('users')
        .insert([
          {
            id: user.id, // Use user.id for Supabase user
            display_name: displayName, // Use snake_case for Supabase column
            short_bio: shortBio, // Use snake_case for Supabase column
            profile_picture_url: profilePictureUrl, // Use snake_case for Supabase column
            free_ai_styles_used: 0, // Initialize free AI styles count
            // created_at will be set by the database default
          },
        ]);

      if (error) {
        throw error;
      }

      console.log('Profile data saved to Supabase for user:', user.id);
      // Call the callback to indicate profile is saved and trigger navigation
      onProfileSaved();
    } catch (error) {
      console.error('Error saving profile data to Supabase:', error.message);
      setError(`Error saving profile data: ${error.message}`); // Display error message
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div id="profile-setup" className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-sm mt-8 text-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">Set Up Your Profile</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>} {/* Display error message */}
      <form onSubmit={handleProfileSetup}>
        <div className="mb-4">
          <label htmlFor="display-name" className="block text-gray-200 text-sm font-bold mb-2">Display Name</label>
          <input
            type="text"
            id="display-name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading} // Disable input while loading
          />
        </div>
        <div className="mb-4">
          <label htmlFor="short-bio" className="block text-gray-200 text-sm font-bold mb-2">Short Bio</label>
          <textarea
            id="short-bio"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            required
            disabled={loading} // Disable input while loading
          ></textarea>
        </div>
        <div className="mb-6">
          <label htmlFor="profile-picture" className="block text-gray-200 text-sm font-bold mb-2">Profile Picture</label>
          <input
            type="file"
            id="profile-picture"
            accept="image/*"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onChange={(e) => setProfilePicture(e.target.files[0])}
            disabled={loading} // Disable input while loading
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileSetup;
