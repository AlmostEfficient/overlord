// Function to retrieve the title of a tab by its ID
function getTabTitle(tabId, callback) {
  chrome.tabs.get(tabId, (tab) => {
    const tabTitle = tab ? tab.title : "No title";
    callback(tabTitle);
  });
}

function startTabTimer(tabId) {
  const startTime = new Date().getTime();

  if (tabTimeData.hasOwnProperty(tabId)) {
    const tabTimer = tabTimeData[tabId];
    const elapsed = startTime - tabTimer.startTime;
    tabTimer.totalTime += elapsed;
    tabTimer.startTime = startTime;
  } else {
    tabTimeData[tabId] = {
      startTime: startTime,
      totalTime: 0,
    };
  }
}

function stopTabTimer(tabId) {
  const endTime = new Date().getTime();
  if (tabTimeData.hasOwnProperty(tabId)) {
    const tabTimer = tabTimeData[tabId];
    const elapsed = endTime - tabTimer.startTime;
    tabTimer.totalTime += elapsed;
  }
}

let previousTabId = null;
let tabTimeData = {};

// Function to handle tab activation
function handleTabActivated(activeInfo) {
  const tabId = activeInfo.tabId;
  startTabTimer(tabId);

  // Get the title of the newly activated tab
  getTabTitle(tabId, (tabTitle) => {
    // Do something with the active tab
    console.log("Active tab:", tabTitle);
  });  
}

// Function to handle tab switch
function handleTabSwitch(activeInfo) {
  const newTabId = activeInfo.tabId;

  if (previousTabId !== null) {
    // Do something with the previous tab, e.g., stop tracking time
    getTabTitle(previousTabId, (previousTabTitle) => {
      console.log("Switched from tab:", previousTabId);
      console.log("Previous tab title:", previousTabTitle);
    });
  }

  // Do something with the newly activated tab, e.g., start tracking time
  getTabTitle(newTabId, (newTabTitle) => {
    console.log("Switched to tab:", newTabId);
    console.log("New tab title:", newTabTitle);
  });

  // Update the previous tab ID
  previousTabId = newTabId;
}

function updateTabTimeData() {
  chrome.storage.sync.set({ tabTimeData: tabTimeData });
}

function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.active) {
    startTabTimer(tabId);
  }
}

function handleTabFocus(windowId) {
  chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
    const newTab = tabs[0];

    if (previousTabId !== null) {
      // Do something with the previous tab, e.g., stop tracking time
      console.log("Lost focus from tab:", previousTabId);
    }

    console.log("Gained focus on tab:", newTab.id);
    previousTabId = newTab.id;
  });
}

// Function to handle tab blur
function handleTabBlur(windowId) {
  chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
    const activeTab = tabs[0];

    if (activeTab && activeTab.id !== previousTabId) {
      console.log("Blurred tab:", activeTab.id);
    }
  });
}

// Event listener for window focus change
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus, handle tab blur
    handleTabBlur(windowId);
  } else {
    // Window gained focus, handle tab focus
    handleTabFocus(windowId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId in tabTimeData) {
    stopTabTimer(tabId);
    delete tabTimeData[tabId];
    // chrome.storage.sync.set({ tabTimeData: tabTimeData });
    updateTabTimeData(); // Add this line
  }
});

// Event listener for extension unload
// Extension unload = extension is disabled or removed
// We need this because 
chrome.runtime.onSuspend.addListener(() => {
  // Stop timers for all tabs
  for (const tabId in tabTimeData) {
    stopTabTimer(tabId);
  }

  // Save or process the tab time data as needed
  console.log("Tab time data:", tabTimeData);
  updateTabTimeData(); // Add this line
});

// Tab activated = tab is switched to or created
chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onActivated.addListener(handleTabSwitch);
chrome.tabs.onUpdated.addListener(handleTabUpdated);
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      return;
    }

    const currentTabId = tab.id;

    if (previousTabId !== null) {
      stopTabTimer(previousTabId);
    }

    startTabTimer(currentTabId);
    previousTabId = currentTabId;
    updateTabTimeData();
  });
});



// Function to retrieve the total time spent on each tab
function getTabTimeData(callback) {
  chrome.storage.sync.get("tabTimeData", (result) => {
    const tabTimeData = result.tabTimeData || {};
    callback(tabTimeData);
  });
}

// Event listener for receiving a message from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabTimeData") {
    getTabTimeData((tabTimeData) => {
      sendResponse(tabTimeData);
      console.log("Sent tab time data:", tabTimeData)
    });
    return true; // Indicates that a response will be sent asynchronously
  }
});