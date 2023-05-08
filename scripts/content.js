// Function to send a message to the background script and request tab time data
function requestTabTimeData() {
  chrome.runtime.sendMessage({ action: "getTabTimeData" }, (response) => {
    // Handle the received tab time data
    console.log("Received tab time data:", response);
    // Perform any further actions with the tab time data
  });
}

// Call the function to request tab time data
requestTabTimeData();
