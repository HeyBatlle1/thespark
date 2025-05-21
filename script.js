// script.js

let generatedStyleCount = 0; // Track simulated AI style generations

document.getElementById('profile-setup-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const displayName = document.getElementById('display-name').value;
    const shortBio = document.getElementById('short-bio').value;
    const profilePicture = document.getElementById('profile-picture').files[0];

    console.log('Profile Setup Form Submitted:');
    console.log('Display Name:', displayName);
    console.log('Short Bio:', shortBio);
    console.log('Profile Picture:', profilePicture);

    // --- Backend Integration Point: Save Profile Data ---
    // In a real application, you would send displayName, shortBio, and profilePicture
    // to your backend here using a fetch or XMLHttpRequest call.
    // Example (pseudo-code):
    /*
    fetch('/api/save-profile', {
        method: 'POST',
        body: formData // Use FormData to send file and text data
    })
    .then(response => response.json())
    .then(data => {
        console.log('Profile saved successfully:', data);
        // On success, populate profile page and transition
        document.getElementById('profile-display-name').textContent = displayName;
        document.getElementById('profile-bio').textContent = shortBio;
        // Handle profile picture display after upload
        if (data.profilePictureUrl) {
            document.getElementById('profile-pic').src = data.profilePictureUrl;
        }

        // Hide profile setup and show profile page
        document.getElementById('profile-setup').classList.add('hidden');
        document.getElementById('profile-page').classList.remove('hidden');

        console.log('Profile setup complete and profile page displayed!');
    })
    .catch(error => {
        console.error('Error saving profile:', error);
        // Handle errors (e.g., show an error message to the user)
    });
    */
    // --- End Backend Integration Point ---

    // Simulate successful profile saving and populate profile page for now
    document.getElementById('profile-display-name').textContent = displayName;
    document.getElementById('profile-bio').textContent = shortBio;
    // Profile picture handling will be added later

    // Hide profile setup and show profile page
    document.getElementById('profile-setup').classList.add('hidden');
    document.getElementById('profile-page').classList.remove('hidden');

    console.log('Profile setup complete and profile page displayed!');
});

document.getElementById('ai-styling-button').addEventListener('click', function() {
    console.log('AI Style My Profile button clicked!');
    // Hide profile page content and show AI styling interface
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('ai-styling-interface').classList.remove('hidden');
});

// Simulate AI Image Generation (replace with actual backend call)
function simulateAIGenerateImage(prompt) {
    console.log("Simulating AI image generation for prompt:", prompt);
    // Generate a placeholder image URL based on the prompt
    const width = 800;
    const height = 200;
    const bgColor = 'cccccc'; // Light grey placeholder background
    const textColor = '333333'; // Dark grey placeholder text
    const text = encodeURIComponent(prompt.substring(0, 20) + '...'); // Use a truncated prompt for text

    const imageUrl = `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${text}`;
    return imageUrl; // Return the simulated image URL
}

document.getElementById('generate-style-button').addEventListener('click', function() {
    const aiPrompt = document.getElementById('ai-prompt').value;
    console.log('Generate Style button clicked!');
    console.log('AI Prompt:', aiPrompt);

    // Simulate sending prompt to AI and getting result
    const generatedImageUrl = simulateAIGenerateImage(aiPrompt);

    // Apply the generated image to the profile banner
    const profileBanner = document.getElementById('profile-banner');
    profileBanner.style.backgroundImage = `url('${generatedImageUrl}')`;
    profileBanner.style.backgroundSize = 'cover';
    profileBanner.style.backgroundPosition = 'center';
    profileBanner.textContent = ''; // Remove placeholder text

    console.log('Applied simulated AI style to banner:', generatedImageUrl);

    // Increment simulated generation count
    generatedStyleCount++;
    console.log('Simulated AI style generations:', generatedStyleCount);

    // --- Backend Integration Point: Save Generated Style ---
    // In a real application, you would save the generated image URL or ID
    // to the user's profile data on the backend here.
    // You would also handle the "one free create" logic and paid generations here.
    // --- End Backend Integration Point ---

    // Optionally, hide the AI styling interface and show the profile page again
    // document.getElementById('ai-styling-interface').classList.add('hidden');
    // document.getElementById('profile-page').classList.remove('hidden');
});

document.getElementById('revert-style-button').addEventListener('click', function() {
    console.log('Revert Style button clicked!');
    const profileBanner = document.getElementById('profile-banner');
    profileBanner.style.backgroundImage = ''; // Clear the background image
    profileBanner.textContent = 'Profile Banner Area (AI Image Here)'; // Restore placeholder text
    console.log('Profile banner style reverted.');
});
