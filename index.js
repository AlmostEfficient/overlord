const saveKey = async () => {
  let inputElement = document.getElementById("key_input");
  if (inputElement) {
    let value = inputElement.value.trim();
    if (value.length === 0) {
      // Display an error message when the key is empty
      showError("Please enter a valid OpenAI API Key.");
      return;
    }

    let encodedKey = encode(value);
    chrome.storage.local.set({ "openai-key": encodedKey }, () => {
      // Hide the key_input field and display the key_entered div
      document.getElementById("key_needed").style.display = "none";
      document.getElementById("key_entered").style.display = "block";
    });
  }
};

const showError = (message) => {
  let errorElement = document.getElementById("error_message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
};

// Rest of the code...


const encode = (input) => {
  return btoa(input);
};

const changeKey = () => {
  document.getElementById('key_needed').style.display = 'block';
  document.getElementById('key_entered').style.display = 'none';
};

const checkForKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      resolve(result['openai-key']);
    });
  });
};

document.getElementById('save_key_button').addEventListener('click', saveKey);
document
  .getElementById('change_key_button')
  .addEventListener('click', changeKey);

checkForKey().then((response) => {
  if (response) {
    document.getElementById('key_needed').style.display = 'none';
    document.getElementById('key_entered').style.display = 'block';
  }
});

// Function to send a message to the background script and request tab time data
function requestTabTimeData() {
  chrome.runtime.sendMessage({ action: "getTabTimeData" }, (response) => {
    // Handle the received tab time data
    console.log("Received tab time data:", response);
    // Perform any further actions with the tab time data
  });
}

document.getElementById("request_data_button").onclick = () => {
  // Call the function to request tab time data
  requestTabTimeData();
};