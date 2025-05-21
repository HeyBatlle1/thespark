import React, { useState, useEffect } from 'react';
import supabase from './supabaseConfig'; // Import the Supabase client

// Component to display a single comment
function CommentItem({ comment }) {
  const [commenterProfile, setCommenterProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommenterProfile = async () => {
      if (comment.user_id) { // Use comment.user_id based on Supabase schema
        try {
          const { data, error } = await supabase
            .from('users')
            .select('display_name, profile_picture_url') // Select relevant fields
            .eq('id', comment.user_id) // Filter by user ID
            .single(); // Expecting a single user

          if (error) {
            throw error;
          }

          if (data) {
            setCommenterProfile(data);
          } else {
            console.log('No profile data found for commenter:', comment.user_id);
          }
        } catch (error) {
          console.error('Error fetching commenter profile:', error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCommenterProfile();
  }, [comment.user_id]); // Dependency array includes comment.user_id

  if (loading) {
    return <div className="text-gray-400">Loading comment...</div>;
  }

  return (
    <div className="bg-gray-800 p-3 rounded-lg mb-3">
      <div className="flex items-center mb-2">
        <img
          src={commenterProfile?.profile_picture_url || 'placeholder-profile.png'} // Use profile_picture_url
          alt={commenterProfile?.display_name || 'Commenter'} // Use display_name
          className="w-8 h-8 rounded-full mr-2"
        />
        <span className="font-bold text-gray-200">{commenterProfile?.display_name || 'Anonymous'}</span> {/* Use display_name */}
      </div>
      <p className="text-gray-200">{comment.content}</p>
      {/* TODO: Display formatted timestamp */}
      {comment.created_at && ( // Use created_at
        <p className="text-xs text-gray-400 mt-1">
          {new Date(comment.created_at).toLocaleString()} {/* Use created_at */}
        </p>
      )}
    </div>
  );
}

export default CommentItem;
