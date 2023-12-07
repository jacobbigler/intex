async function handleLoginFormSubmit(event) {
    event.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        // Handle authentication error
        console.error('Authentication failed');
        return;
      }
  
      const { token } = await response.json();
  
      // Store the JWT in localStorage
      localStorage.setItem('jwtToken', token);
  
      window.location.href = '/';  // Redirect to the homepage
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Function to retrieve the JWT from localStorage
function getJwtToken() {
    return localStorage.getItem('jwtToken');
  }
  
// Function to make an authenticated request to a protected route
async function fetchProtectedResource() {
  const jwtToken = getJwtToken();

  if (jwtToken) {
    // Include the JWT in the headers
    const headers = {
      Authorization: `Bearer ${jwtToken}`,
      // Add any other headers as needed
    };

    try {
      // Example: Fetching a protected resource
      const response = await fetch('/report', { headers });

      if (!response.ok) {
        // Handle error for the protected resource
        console.error('Error fetching protected resource');
        return;
      }

      const data = await response.json();
      console.log('Protected Resource Data:', data);

      // Continue processing the data or updating the UI
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    // Handle case where JWT is not available (user is not logged in)
    alert("User not authenticated")
    console.log('User not authenticated');
    // Redirect to the login page or perform other actions as needed
    window.location.href = '/login';
  }
}

// Example: Call the function when the page loads or when needed
document.addEventListener('DOMContentLoaded', fetchProtectedResource);
