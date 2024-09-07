document.addEventListener('DOMContentLoaded', () => {
  const startPartyButton = document.getElementById('start-party');
  startPartyButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: 'startParty' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else if (response && response.success) {
          console.log('Party started successfully');
        } else {
          console.error('Failed to start party');
        }
      });
    });
  });
});
