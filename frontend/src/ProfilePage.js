import React, { useState, useEffect } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import GoogleGenerativeAI
import CommentItem from './CommentItem'; // Import CommentItem component

// Initialize Google Generative AI (Load API key from environment variables)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; // Assuming using Create React App or similar setup
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// TODO: Handle case where API key is not loaded

// Define the free tier limit for AI styles
const FREE_AI_STYLE_LIMIT = 1;

// Component for the User Profile Page
function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [showAIStyling, setShowAIStyling] = useState(false); // State to manage AI styling interface visibility
  const [aiPrompt, setAiPrompt] = useState(''); // State for AI styling prompt
  const [generatingStyle, setGeneratingStyle] = useState(false); // State for AI generation loading
  const [error, setError] = useState(null); // State to manage errors
  const [profileBannerUrl, setProfileBannerUrl] = useState(''); // State for profile banner image URL
  const [newPassword, setNewPassword] = useState(''); // State for new password input
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password input
  const [accountSettingsError, setAccountSettingsError] = useState(null); // State for account settings errors
  const [userPosts, setUserPosts] = useState([]); // State to store user's posts
  const [userConnections, setUserConnections] = useState([]); // State to store user's connections
  const [connectedUsersProfileData, setConnectedUsersProfileData] = useState([]); // State to store connected users' profile data
  const [newComment, setNewComment] = useState(''); // State for new comment input
  const [postingComment, setPostingComment] = useState(false); // State to manage comment posting loading
  const [profileComments, setProfileComments] = useState([]); // State to store profile comments

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const user = session.user;
        try {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*') // Select all fields for profile data
            .eq('id', user.id) // Filter by user ID (using user.id for Supabase user)
            .single(); // Expecting a single user

          if (profileError) {
            throw profileError;
          }

          if (profileData) {
            setProfileData(profileData);
            setProfileBannerUrl(profileData.profile_picture_url || ''); // Set initial banner URL (using profile_picture_url for banner for now, will adjust later if needed)

            // Fetch user's latest posts
            const { data: postsData, error: postsError } = await supabase
              .from('posts')
              .select('*') // Select all fields for posts
              .eq('user_id', user.uid) // Filter by user ID (using user_id)
              .order('created_at', { ascending: false }) // Order by created_at descending
              .limit(5); // Limit to 5 latest posts

            if (postsError) {
              throw postsError;
            }
            setUserPosts(postsData);

            // Fetch user's connections
            const { data: connectionsData, error: connectionsError } = await supabase
              .from('connections')
              .select('*') // Select all fields for connections
              .or(`user1_id.eq.${user.uid},user2_id.eq.${user.uid}`) // Filter where user is either user1 or user2
              .eq('status', 'connected'); // Fetch only established connections

            if (connectionsError) {
              throw connectionsError;
            }
            setUserConnections(connectionsData);

            // Fetch profile comments
            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select('*') // Select all fields for comments
              .eq('profile_user_id', profileData.id) // Filter by profile owner's user ID (using profile_user_id and profileData.id)
              .order('created_at', { ascending: true }); // Order comments chronologically

            if (commentsError) {
              throw commentsError;
            }
            setProfileComments(commentsData);


          } else {
            console.log('No profile data found for user:', user.uid);
            setProfileData(null); // Ensure profileData is null if not found
            setProfileBannerUrl('');
            setUserPosts([]);
            setUserConnections([]);
            setConnectedUsersProfileData([]);
            setProfileComments([]);
            // TODO: Handle case where profile data is not found (e.g., redirect to profile setup)
          }

        } catch (error) {
          console.error('Error fetching data:', error.message);
          setError('Error fetching data.'); // Set error state
        } finally {
          setLoading(false); // Set loading to false
        }
      } else {
        // User is logged out
        setProfileData(null);
        setProfileBannerUrl('');
        setUserPosts([]);
        setUserConnections([]);
        setConnectedUsersProfileData([]);
        setProfileComments([]);
        setLoading(false); // Set loading to false if no user
        // TODO: Handle case where no user is signed in (e.g., redirect to login)
      }
    });

    // Cleanup function to unsubscribe from the auth state listener
    return () => subscription.unsubscribe();
  }, []); // Dependency array is empty as supabase is stable

  // Handle posting a new comment
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      console.log('Comment content cannot be empty.');
      // TODO: Display error message to user
      return;
    }

    setPostingComment(true); // Set posting comment to true

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileData) {
      console.error('User not logged in or profile data not available.');
      setPostingComment(false);
      // TODO: Display error message to user
      return;
    }

    try {
      // Insert a new row into the 'comments' table
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            profile_user_id: profileData.id, // Link comment to the profile owner (using profile_user_id and profileData.id)
            user_id: user.uid, // The user who posted the comment (using user_id)
            content: newComment,
            // created_at will be set by the database default
          },
        ]);

      if (error) {
        throw error;
      }

      console.log('Comment posted successfully!', data);
      setNewComment(''); // Clear the textarea after posting
      // TODO: Refresh comments list or add the new comment to state
      // For now, we'll rely on a manual refresh or re-fetching
    } catch (error) {
      console.error('Error posting comment:', error.message);
      // TODO: Display error message to user
    } finally {
      setPostingComment(false); // Set posting comment to false
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-200">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="flex items-center justify-center min-h-screen text-gray-200">No profile data available. Please set up your profile.</div>;
    // TODO: Implement proper redirection to profile setup
  }

  // Handle AI Style My Profile button click
  const handleAIStylingClick = () => {
    setShowAIStyling(true);
    setError(null); // Clear any previous errors
  };

  // Handle Add Spark / Follow button click
  const handleAddSpark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileData) {
      console.error('User not logged in or profile data not available.');
      // TODO: Display error message to user
      return;
    }

    if (user.id === profileData.id) { // Compare with profileData.id (using user.id for Supabase user)
      console.log('Cannot add yourself as a spark.');
      // TODO: Display message to user
      return;
    }

    try {
      // Insert a new row into the 'connections' table
      const { data, error } = await supabase
        .from('connections')
        .insert([
          {
            user1_id: user.uid, // The user initiating the connection (using user1_id)
            user2_id: profileData.id, // The user being connected to (the profile owner) (using user2_id and profileData.id)
            status: 'connected', // Or 'pending' if a request/acceptance flow is needed
            // created_at will be set by the database default
          },
        ]);

      if (error) {
        throw error;
      }

      console.log(`User ${user.uid} sparked user ${profileData.id}`, data);
      // TODO: Update button state or display success message
    } catch (error) {
      console.error('Error adding spark:', error.message);
      // TODO: Display error message to user
    }
  };


  // Handle Revert Style button click
  const handleRevertStyleClick = async () => {
    console.log('Revert Style button clicked!');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // Update the user's profile in the 'users' table
        const { data, error } = await supabase
          .from('users')
          .update({ profile_picture_url: '' }) // Clear the profile_picture_url (using profile_picture_url for banner for now)
          .eq('id', user.id); // Filter by user ID (using user.id for Supabase user)

        if (error) {
          throw error;
        }

        setProfileBannerUrl(''); // Clear the banner URL in local state
        setProfileData(prevProfileData => ({ ...prevProfileData, profile_picture_url: '' })); // Update profileData state as well (using profile_picture_url)
        console.log('Profile banner style reverted in Supabase and local state.', data);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error reverting profile banner style:', error.message);
        setError('Error reverting profile style.'); // Set error state
      }
    }
  };

  // Handle Generate Style button click
  const handleGenerateStyleClick = async () => {
    if (!aiPrompt) {
      console.log('Please enter a prompt for AI styling.');
      setError('Please enter a prompt for AI styling.'); // Set error state
      return;
    }

    // Check free tier limit
    if (profileData.freeAiStylesUsed >= FREE_AI_STYLE_LIMIT) {
      console.log('Free AI style limit reached. Upgrade for more.');
      setError('Free AI style limit reached. Upgrade for more.'); // Set error state
      // TODO: Implement upgrade prompt
      return;
    }

    setGeneratingStyle(true); // Set generating style to true
    setError(null); // Clear any previous errors

    try {
      // Get the generative model configured for image responses
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp", // Using the model from the documentation snippet
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      });

      // Generate content based on the prompt
      const response = await model.generateContent(aiPrompt);

      // Process the response to find image data
      let generatedImageUrl = '';
      for (const part of response.response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          // Convert base64 image data to a data URL
          generatedImageUrl = `data:image/png;base64,${imageData}`; // Assuming PNG format
          break; // Found the image data, no need to continue
        }
      }

      if (generatedImageUrl) {
        // Convert base64 data URL to Blob
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user is signed in.');
          setError('No user is signed in.');
          setGeneratingStyle(false);
          return;
        }

        // Upload the Blob to Supabase Storage
        const fileExt = generatedImageUrl.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`; // Use user.id for Supabase user

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile_banners') // Assuming a bucket named 'profile_banners'
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL of the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('profile_banners')
          .getPublicUrl(filePath);

        const downloadUrl = publicUrlData.publicUrl;

        console.log('Profile banner image uploaded to Storage:', downloadUrl);

        // Save the downloadUrl and update free generation count in Supabase and local state
        const updatedFreeCount = (profileData.free_ai_styles_used || 0) + 1; // Use free_ai_styles_used
        const { data, error } = await supabase
          .from('users')
          .update({
            profile_picture_url: downloadUrl, // Save the generated image URL (using profile_picture_url)
            free_ai_styles_used: updatedFreeCount, // Increment free generation count (using free_ai_styles_used)
          })
          .eq('id', user.id); // Filter by user ID (using user.id for Supabase user)

        if (error) {
          throw error;
        }

        // Update local state with the new banner URL and free count
        setProfileData(prevProfileData => ({
            ...prevProfileData,
            profile_picture_url: downloadUrl, // Use profile_picture_url
            free_ai_styles_used: updatedFreeCount, // Use free_ai_styles_used
        }));
        console.log('Generated style saved to Supabase and local state, free count updated.', data);

      } else {
        console.log('No image data generated for the prompt.');
        setError('No image data generated for the prompt.'); // Set error state
      }

    } catch (error) {
      console.error('Error generating AI style:', error);
      setError('Error generating AI style.'); // Set error state
    } finally {
      setGeneratingStyle(false); // Set generating style to false
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setAccountSettingsError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setAccountSettingsError('Password should be at least 6 characters.');
      return;
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error updating password:', error.message);
      setAccountSettingsError(`Error updating password: ${error.message}`);
      // TODO: Handle re-authentication if needed
    } else {
      setAccountSettingsError('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };


  return (
    <div id="profile-page" className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-2xl mt-8 text-gray-200">
      {/* Header/Banner Area */}
      <div
        id="profile-banner"
        className="w-full h-40 bg-gray-300 rounded-t-lg mb-4 flex items-center justify-center text-gray-600"
        style={{ backgroundImage: profileBannerUrl ? `url('${profileBannerUrl}')` : '', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {!profileBannerUrl && 'Profile Banner Area (AI Image Here)'}
      </div>

      <div className="flex items-center mb-4">
        {/* Profile Picture */}
        <img
          id="profile-pic"
          src={profileData.profilePictureUrl || 'placeholder-profile.png'}
          alt="Profile Picture"
          className="w-20 h-20 rounded-full border-4 border-white -mt-12 mr-4"
        />

        <div>
          {/* Display Name */}
          <h2 id="profile-display-name" className="text-2xl font-bold">{profileData.displayName}</h2>
          {/* Username (assuming UID for now, can be changed later) */}
          <p id="profile-username" className="text-gray-200">@{profileData.uid}</p>
        </div>
        {/* Add Spark / Follow Button Placeholder */}
        {/* Add Spark / Follow Button */}
        {/* TODO: Implement logic to show different button states (e.g., "Pending", "Connected") */}
        <button
          className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleAddSpark}
        >
          Add Spark
        </button>
      </div>

      {/* Short Bio */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">About Me</h3>
        <p id="profile-bio" className="text-gray-200">{profileData.shortBio}</p>
      </div>

      {/* My Latest Posts Section */}
      {/* My Latest Posts Section */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-2">My Latest Posts</h3>
        {userPosts.length > 0 ? (
          userPosts.map(post => (
            <div key={post.id} className="bg-gray-800 p-4 rounded-lg mb-4">
              {/* TODO: Display rich text content */}
              <p className="text-gray-200">{post.content}</p>
              {/* TODO: Display timestamp, likes, comments, etc. */}
            </div>
          ))
        ) : (
          <p className="text-gray-200">No posts yet.</p>
        )}
      </div>

      {/* My Writing / Portfolio Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-2">My Writing / Portfolio</h3>
        {/* TODO: Implement rich text editor and display user's writing/portfolio */}
        <p className="text-gray-200">This section will display the user's writing or portfolio.</p>
      </div>

      {/* Sparks / Influences Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-2">Sparks / Influences</h3>
        {/* TODO: Implement rich text editor and display user's sparks/influences */}
        <p className="text-gray-200">This section will display the user's sparks or influences.</p>
      </div>

        {/* The Wall / Comments / Guestbook Section */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-bold mb-2">The Wall / Comments / Guestbook</h3>
          {/* Comment Submission Form */}
          {/* Comment Submission Form */}
          <div className="mb-4">
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              placeholder="Leave a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={postingComment} // Disable input while posting
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handlePostComment}
              disabled={postingComment || !newComment.trim()} // Disable button while posting or if comment is empty
            >
              {postingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>

          {/* Display existing comments */}
          <div className="mt-4">
            <h4 className="text-lg font-bold mb-2">Comments</h4>
            {profileComments.length > 0 ? (
              profileComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <p className="text-gray-200">No comments yet.</p>
            )}
          </div>
        </div>

        {/* Connections List Section */}
        {/* Connections List Section */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-bold mb-2">Connections</h3>
          {connectedUsersProfileData.length > 0 ? (
            <ul>
              {connectedUsersProfileData.map(connectedUser => (
                <li key={connectedUser.id} className="flex items-center mb-2">
                  <img
                    src={connectedUser.profilePictureUrl || 'placeholder-profile.png'}
                    alt={`${connectedUser.displayName}'s profile picture`}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-gray-200">{connectedUser.displayName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-200">No connections yet.</p>
          )}
        </div>

        {/* AI Profile Styling Access Point */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            id="ai-styling-button"
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleAIStylingClick}
          >
              AI Style My Profile
          </button>
          <button
            id="revert-style-button"
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleRevertStyleClick}
          >
              Revert Style
          </button>
      </div>

      {/* AI Styling Interface (Conditionally Rendered) */}
      {showAIStyling && (
        <div id="ai-styling-interface" className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-sm mt-8 text-gray-200">
            <h2 className="text-2xl font-bold text-center mb-6">AI Profile Styling</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>} {/* Display error message */}
            <div className="mb-4">
                <label htmlFor="ai-prompt" className="block text-gray-200 text-sm font-bold mb-2">Enter your styling prompt:</label>
                <textarea
                  id="ai-prompt"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                  placeholder="e.g., 'A futuristic cityscape with neon lights'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={generatingStyle} // Disable input while generating
                ></textarea>
            </div>
            <div className="flex items-center justify-between">
                <button
                  id="generate-style-button"
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={handleGenerateStyleClick}
                  disabled={generatingStyle || profileData.freeAiStylesUsed >= FREE_AI_STYLE_LIMIT} // Disable button while generating or if limit reached
                >
                  {generatingStyle ? 'Generating...' : profileData.freeAiStylesUsed >= FREE_AI_STYLE_LIMIT ? 'Limit Reached' : 'Generate Style'}
                </button>
            </div>
            {profileData.freeAiStylesUsed >= FREE_AI_STYLE_LIMIT && (
                <p className="text-center text-sm mt-4">You have used {profileData.freeAiStylesUsed} of {FREE_AI_STYLE_LIMIT} free AI styles.</p>
                // TODO: Add upgrade link/button
            )}
        </div>
      )}

      {/* Basic Account Settings */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-4">Account Settings</h3>
        {accountSettingsError && <p className="text-red-500 text-center mb-4">{accountSettingsError}</p>} {/* Display account settings error message */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-200 text-sm font-bold mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={profileData.email || ''} // Display current email, or empty string if not available
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} // Update email in local state
            disabled // Email updates require re-authentication, so disable for now
          />
          {/* TODO: Implement email update with re-authentication */}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-200 text-sm font-bold mb-2">New Password</label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="confirm-password" className="block text-gray-200 text-sm font-bold mb-2">Confirm New Password</label>
          <input
            type="password"
            id="confirm-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handlePasswordChange}
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
