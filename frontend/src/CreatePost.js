import React, { useState } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client

// Component for creating a new post
function CreatePost() {
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false); // State to manage loading

  // TODO: Implement rich text editor instead of a simple textarea
  // TODO: Implement basic tagging functionality

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      console.log('Post content cannot be empty.');
      // TODO: Display error message to user
      return;
    }

    setLoading(true); // Set loading to true

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user is signed in.');
      setLoading(false);
      // TODO: Handle case where no user is signed in
      return;
    }

    try {
      // Insert a new row into the 'posts' table
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.uid,
            content: postContent, // TODO: Save rich text content
            // created_at will be set by the database default
            tags: [], // TODO: Save tags
            likes_count: 0,
            comments_count: 0,
          },
        ]);

      if (error) {
        throw error;
      }

      console.log('Post created successfully!', data);
      setPostContent(''); // Clear the textarea after posting
      // TODO: Provide user feedback (e.g., success message, redirect)
    } catch (error) {
      console.error('Error creating post:', error.message);
      // TODO: Display error message to user
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <div className="bg-blue-900 p-8 rounded-lg shadow-md w-full max-w-xl mt-8 text-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">Create New Post</h2>
      <div className="mb-4">
        <label htmlFor="post-content" className="block text-gray-200 text-sm font-bold mb-2">What's on your mind?</label>
        <textarea
          id="post-content"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows="6"
          placeholder="Write your post here..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          disabled={loading} // Disable input while loading
        ></textarea>
      </div>
      {/* TODO: Add tagging input */}
      <div className="flex items-center justify-between">
        <button
          className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleCreatePost}
          disabled={loading} // Disable button while loading
        >
          {loading ? 'Sharing...' : 'Share Post'}
        </button>
      </div>
    </div>
  );
}

export default CreatePost;
