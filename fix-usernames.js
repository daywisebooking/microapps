// Run this script in your browser console while logged in as admin
// This will generate usernames for all users who don't have one

async function fixUsernames() {
  console.log("Starting username fix...");
  
  try {
    const response = await fetch("/api/admin/fix-usernames", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": localStorage.getItem("microapps_mock_auth") 
          ? JSON.parse(localStorage.getItem("microapps_mock_auth")).id 
          : "unknown"
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Updated ${data.updated} users:`);
      console.table(data.users);
    } else {
      console.error("❌ Error:", data.error);
    }
  } catch (error) {
    console.error("❌ Failed to fix usernames:", error);
  }
}

fixUsernames();

