document.addEventListener('DOMContentLoaded', () => {
  const startPartyButton = document.getElementById('start-party');
  
  // Initially disable the button
  startPartyButton.disabled = true;

  // Check if there's a video on the page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: 'checkForVideo' }, (response) => {
      if (response && response.hasVideo) {
        startPartyButton.disabled = false;
      } else {
        startPartyButton.textContent = 'No video found';
      }
    });
  });

  startPartyButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: 'startParty' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log('Party started successfully');
          window.close(); // Close the popup after starting the party
        } else {
          console.error('Failed to start party');
        }
      });
    });
  });
});
