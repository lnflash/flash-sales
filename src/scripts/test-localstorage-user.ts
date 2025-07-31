// This script is meant to be run in the browser console
// Copy and paste this code into the browser console where you're logged in as charms

const USER_STORAGE_KEY = 'flash_dashboard_user';
const userData = localStorage.getItem(USER_STORAGE_KEY);

if (userData) {
  const user = JSON.parse(userData);
  console.log('User data from localStorage:', user);
  console.log('Username:', user.username);
  console.log('Username length:', user.username.length);
  console.log('Username charCodes:', Array.from(user.username).map(c => c.charCodeAt(0)));
} else {
  console.log('No user data found in localStorage');
}

// Also check what the dashboard is seeing
console.log('\nChecking dashboard elements:');
const dashboardTitle = document.querySelector('h1')?.textContent;
console.log('Dashboard title:', dashboardTitle);

const submissionsCount = document.querySelector('[class*="Your Submissions"]')?.nextElementSibling?.textContent;
console.log('Submissions count shown:', submissionsCount);