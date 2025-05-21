import React, { useState, useEffect } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import GoogleGenerativeAI
import CommentItem from './CommentItem'; // Import CommentItem component

// Initialize Google Generative AI (Load API key from environment variables)
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; // Assuming using Create React App or similar setup
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Define the free tier limit for AI styles
const FREE_AI_STYLE_LIMIT = 1;

// Component for the User Profile Page
function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [redirectTo, setRedirectTo] = useState(null); // State to manage redirection target
  const [showAIStyling, setShowAIStyling] = useState(false); // State to manage AI styling interface visibility
  const [aiPrompt, setAiPrompt] = useState(''); // State for AI styling prompt
  const [generatingStyle, setGeneratingStyle] = useState(false); // State for AI generation loading
  const [aiError, setAiError] = useState(null); // State to manage errors specifically for AI styling
  const [profileBannerUrl, setProfileBannerUrl] = useState(''); // State for profile banner image URL
  const [fetchError, setFetchError] = useState(null); // State to manage errors during data fetching
  const [newPassword, setNewPassword] = useState(''); // State for new password input
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password input
  const [accountSettingsError, setAccountSettingsError] = useState(null); // State for account settings errors
  const [currentPassword, setCurrentPassword] = useState(''); // State for current password input
  const [newEmail, setNewEmail] = useState(''); // State for new email input
  const [writingPortfolio, setWritingPortfolio] = useState(''); // State for user's writing/portfolio
  const [sparksInfluences, setSparksInfluences] = useState(''); // State for user's sparks/influences
  const [userPosts, setUserPosts] = useState([]); // State to store user's posts
  const [userConnections, setUserConnections] = useState([]); // State to store user's connections
  const [connectedUsersProfileData, setConnectedUsersProfileData] = useState([]); // State to store connected users' profile data
  const [newComment, setNewComment] = useState(''); // State for new comment input
  const [postingComment, setPostingComment] = useState(false); // State to manage comment posting loading
  const [profileComments, setProfileComments] = useState([]); // State to store profile comments
  const [connectionStatus, setConnectionStatus] = useState('not_connected'); // State to store connection status
  const [isApiKeyLoaded, setIsApiKeyLoaded] = useState(!!GEMINI_API_KEY); // State to track if API key is loaded

  useEffect(() => {
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not loaded. AI styling will be disabled.');
      setIsApiKeyLoaded(false);
      setAiError('AI styling is currently unavailable. Please ensure the GEMINI_API_KEY is set in your environment variables.');
    }

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
              .select('id, content, created_at') // Select specific fields including timestamp
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

            // Fetch profile comments
            fetchProfileComments(profileData.id);

            // Check connection status between current user and profile owner
            const { data: connectionData, error: connectionError } = await supabase
              .from('connections')
              .select('status')
              .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`) // Fetch connections where current user is either user1 or user2
              .or(`user1_id.eq.${profileData.id},user2_id.eq.${profileData.id}`); // Fetch connections where profile owner is either user1 or user2

            if (connectionError) {
              console.error('Error fetching connection status:', connectionError.message);
              setConnectionStatus('error'); // Set status to error
            } else if (connectionData && connectionData.length > 0) {
              // Find the connection between the current user and the profile owner
              const foundConnection = connectionData.find(conn =>
                (conn.user1_id === user.id && conn.user2_id === profileData.id) ||
                (conn.user1_id === profileData.id && conn.user2_id === user.id)
              );

              if (foundConnection) {
                setConnectionStatus(foundConnection.status); // Set status based on the found connection
              } else {
                setConnectionStatus('not_connected'); // No direct connection found
              }
            } else {
              setConnectionStatus('not_connected'); // No connections found at all
            }


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
          setFetchError('Error fetching data.'); // Set fetch error state
        } finally {
          setLoading(false); // Set loading to false
        }
      } else {
        // User is logged out
        console.log('No user is signed in. Redirecting to login.');
        setRedirectTo('/login'); // Redirect to login if no user
        setLoading(false); // Set loading to false if no user
      }
    });

    // Cleanup function to unsubscribe from the auth state listener
    return () => subscription.unsubscribe();
  }, []); // Dependency array is empty as supabase is stable

  // Handle posting a new comment
  const handlePostComment = async () => {
    if (!newComment.trim()) {
      console.log('Comment content cannot be empty.');
      setAiError('Comment content cannot be empty.'); // Display error message
      return;
    }

    setPostingComment(true); // Set posting comment to true

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileData) {
      console.error('User not logged in or profile data not available.');
      setAiError('User not logged in or profile data not available.'); // Display error message
      setPostingComment(false);
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
      fetchProfileComments(profileData.id); // Refresh comments after posting
    } catch (error) {
      console.error('Error posting comment:', error.message);
      setAiError(`Error posting comment: ${error.message}`); // Display error message
    } finally {
      setPostingComment(false); // Set posting comment to false
    }
  };

  // Function to fetch profile comments
  const fetchProfileComments = async (profileUserId) => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*') // Select all fields for comments
        .eq('profile_user_id', profileUserId) // Filter by profile owner's user ID
        .order('created_at', { ascending: true }); // Order comments chronologically

      if (commentsError) {
        throw commentsError;
      }
      setProfileComments(commentsData);
    } catch (error) {
      console.error('Error fetching profile comments:', error.message);
      setAiError(`Error fetching comments: ${error.message}`); // Display error message
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-200">Loading profile...</div>;
  }

  if (fetchError) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">{fetchError}</div>;
  }

  if (!profileData && !loading) { // Check if not loading and profileData is null
    console.log('No profile data available. Redirecting to profile setup.');
    setRedirectTo('/profilesetup'); // Redirect to profile setup if no profile data
  }

  if (redirectTo) {
    // In a real application, you would use a router here
    // For this example, we'll just display a message
    return <div className="flex items-center justify-center min-h-screen text-gray-200">Redirecting to {redirectTo}...</div>;
  }

  // Handle AI Style My Profile button click
  const handleAIStylingClick = () => {
    setShowAIStyling(true);
    setAiError(null); // Clear any previous errors
  };

  // Handle Add Spark / Follow button click
  const handleAddSpark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileData) {
      console.error('User not logged in or profile data not available.');
      setAiError('User not logged in or profile data not available.'); // Display error message
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
      setAiError(`Error adding spark: ${error.message}`); // Display error message
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
        setAiError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error reverting profile banner style:', error.message);
        setAiError('Error reverting profile style.'); // Set error state
      }
    }
  };

  // Handle Generate Style button click
  const handleGenerateStyleClick = async () => {
    if (!isApiKeyLoaded) {
      console.error('GEMINI_API_KEY is not loaded. Cannot generate style.');
      setAiError('AI styling is currently unavailable. Please ensure the GEMINI_API_KEY is set in your environment variables.');
      return;
    }

    if (!aiPrompt) {
      console.log('Please enter a prompt for AI styling.');
      setAiError('Please enter a prompt for AI styling.'); // Set error state for AI styling
      return;
    }

    // Check free tier limit
    if (profileData.free_ai_styles_used >= FREE_AI_STYLE_LIMIT) { // Use free_ai_styles_used
      console.log('Free AI style limit reached. Upgrade for more.');
      setAiError('Free AI style limit reached. Upgrade for more.'); // Set error state for AI styling
      // TODO: Implement upgrade prompt
      return;
    }

    setGeneratingStyle(true); // Set generating style to true
    setAiError(null); // Clear any previous errors

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
          setAiError('No user is signed in.');
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
        setAiError('No image data generated for the prompt.'); // Set error state
      }

    } catch (error) {
      console.error('Error generating AI style:', error);
      setAiError('Error generating AI style.'); // Set error state for AI styling
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

  // Handle email change with re-authentication
  const handleEmailChange = async () => {
    if (!currentPassword || !newEmail) {
      setAccountSettingsError('Please enter your current password and new email address.');
      return;
    }

    setAccountSettingsError(null); // Clear previous errors

    try {
      // Re-authenticate the user with their current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profileData.email, // Use the current email for re-authentication
        password: currentPassword,
      });

      if (reauthError) {
        console.error('Error during re-authentication:', reauthError.message);
        setAccountSettingsError(`Error changing email: Invalid current password.`);
        return;
      }

      // If re-authentication is successful, update the email
      const { data, error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) {
        console.error('Error updating email:', updateError.message);
        setAccountSettingsError(`Error changing email: ${updateError.message}`);
      } else {
        setAccountSettingsError('Email updated successfully! Please check your new email for a confirmation link.');
        setCurrentPassword('');
        setNewEmail('');
        // Optionally, update the profileData state with the new email
        setProfileData(prevProfileData => ({ ...prevProfileData, email: newEmail }));
      }

    } catch (error) {
      console.error('Error during email change:', error.message);
      setAccountSettingsError(`Error changing email: ${error.message}`);
    }
  };

  // Handle saving writing/portfolio data
  const handleSaveWritingPortfolio = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user is signed in.');
      setAiError('No user is signed in. Please log in to save your writing/portfolio.'); // Use aiError for now, could add a separate state for this
      return;
    }

    try {
      // Update the user's profile in the 'users' table with writing/portfolio data
      const { data, error } = await supabase
        .from('users')
        .update({ writing_portfolio: writingPortfolio }) // Assuming a column named 'writing_portfolio'
        .eq('id', user.id); // Filter by user ID

      if (error) {
        throw error;
      }

      console.log('Writing/portfolio data saved successfully!', data);
      // Optionally, display a success message to the user
      setAiError('Writing/portfolio saved successfully!'); // Use aiError for now
    } catch (error) {
      console.error('Error saving writing/portfolio data:', error.message);
      setAiError(`Error saving writing/portfolio: ${error.message}`); // Use aiError for now
    }
  };

  // Handle saving sparks/influences data
  const handleSaveSparksInfluences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user is signed in.');
      setAiError('No user is signed in. Please log in to save your sparks/influences.'); // Use aiError for now, could add a separate state for this
      return;
    }

    try {
      // Update the user's profile in the 'users' table with sparks/influences data
      const { data, error } = await supabase
        .from('users')
        .update({ sparks_influences: sparksInfluences }) // Assuming a column named 'sparks_influences'
        .eq('id', user.id); // Filter by user ID

      if (error) {
        throw error;
      }

      console.log('Sparks/influences data saved successfully!', data);
      // Optionally, display a success message to the user
      setAiError('Sparks/influences saved successfully!'); // Use aiError for now
    } catch (error) {
      console.error('Error saving sparks/influences data:', error.message);
      setAiError(`Error saving sparks/influences: ${error.message}`); // Use aiError for now
    }
  };


  return (
    <div id="profile-page" className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-2xl mt-8 text-gray-200">
      {fetchError && <p className="text-red-500 text-center mb-4">{fetchError}</p>} {/* Display fetch error message */}
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
          disabled={connectionStatus !== 'not_connected'} // Disable if already connected or pending
        >
          {connectionStatus === 'not_connected' && 'Add Spark'}
          {connectionStatus === 'pending' && 'Pending'}
          {connectionStatus === 'connected' && 'Connected'}
          {connectionStatus === 'error' && 'Error'}
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
              {/* Display rich text content */}
              <div className="text-gray-200" dangerouslySetInnerHTML={{ __html: post.content }}></div>
              {/* Display timestamp */}
              {post.created_at && (
                <p className="text-gray-400 text-sm mt-2">Posted on: {new Date(post.created_at).toLocaleString()}</p>
              )}
              {/* TODO: Display likes, comments, etc. */}
            </div>
          ))
        ) : (
          <p className="text-gray-200">No posts yet.</p>
        )}
      </div>

      {/* My Writing / Portfolio Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-2">My Writing / Portfolio</h3>
        {/* TODO: Implement fetching and displaying saved writing/portfolio */}
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="6"
          placeholder="Share your writing or portfolio links/excerpts here..."
          value={writingPortfolio}
          onChange={(e) => setWritingPortfolio(e.target.value)}
        ></textarea>
        <div className="flex justify-end mt-2">
          <button
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleSaveWritingPortfolio} // TODO: Implement save function
          >
            Save Writing/Portfolio
          </button>
        </div>
      </div>

      {/* Sparks / Influences Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-2">Sparks / Influences</h3>
        {/* TODO: Implement fetching and displaying saved sparks/influences */}
        <textarea
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="4"
          placeholder="Share your sparks or influences here..."
          value={sparksInfluences}
          onChange={(e) => setSparksInfluences(e.target.value)}
        ></textarea>
        <div className="flex justify-end mt-2">
          <button
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleSaveSparksInfluences} // TODO: Implement save function
          >
            Save Sparks/Influences
          </button>
        </div>
      </div>

        {/* The Wall / Comments / Guestbook Section */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-lg font-bold mb-2">The Wall / Comments / Guestbook</h3>
          {aiError && <p className="text-red-500 text-center mb-4">{aiError}</p>} {/* Display error message for comments */}
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
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded rounded focus:outline-none focus:shadow-outline"
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
            disabled={!isApiKeyLoaded} // Disable button if API key is not loaded
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
            {aiError && <p className="text-red-500 text-center mb-4">{aiError}</p>} {/* Display error message for AI styling */}
            {!isApiKeyLoaded && (
              <p className="text-red-500 text-center mb-4">AI styling is unavailable because the GEMINI_API_KEY is not loaded.</p>
            )}
            <div className="mb-4">
                <label htmlFor="ai-prompt" className="block text-gray-200 text-sm font-bold mb-2">Enter your styling prompt:</label>
                <textarea
                  id="ai-prompt"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="4"
                  placeholder="e.g., 'A futuristic cityscape with neon lights'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={generatingStyle || !isApiKeyLoaded} // Disable input while generating or if API key is not loaded
                ></textarea>
            </div>
            <div className="flex items-center justify-between">
                <button
                  id="generate-style-button"
                  className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={handleGenerateStyleClick}
                  disabled={generatingStyle || profileData.free_ai_styles_used >= FREE_AI_STYLE_LIMIT || !isApiKeyLoaded} // Disable button while generating, if limit reached, or if API key is not loaded
                >
                  {generatingStyle ? 'Generating...' : profileData.free_ai_styles_used >= FREE_AI_STYLE_LIMIT ? 'Limit Reached' : 'Generate Style'}
                </button>
            </div>
            {profileData.free_ai_styles_used >= FREE_AI_STYLE_LIMIT && ( // Use free_ai_styles_used
                <div className="text-center text-sm mt-4">
                    <p>You have used {profileData.free_ai_styles_used} of {FREE_AI_STYLE_LIMIT} free AI styles.</p>
                    {/* Placeholder for upgrade link/button */}
                    <p className="text-blue-400 cursor-pointer">Click here to upgrade for more AI styles</p>
                </div>
            )}
        </div>
      )}

      {/* Basic Account Settings */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <h3 className="text-lg font-bold mb-4">Account Settings</h3>
        {accountSettingsError && <p className="text-red-500 text-center mb-4">{accountSettingsError}</p>} {/* Display account settings error message */}
        <div className="mb-4">
          <label htmlFor="current-password" className="block text-gray-200 text-sm font-bold mb-2">Current Password (for email change)</label>
          <input
            type="password"
            id="current-password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="new-email" className="block text-gray-200 text-sm font-bold mb-2">New Email Address</label>
          <input
            type="email"
            id="new-email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleEmailChange} // Call a new function for email change
          >
            Change Email
          </button>
        </div>
        <div className="mb-4 mt-8"> {/* Added margin-top for separation */}
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
