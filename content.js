console.log('Teleparty Clone content script loaded.');

let socket;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startParty') {
    const partyId = generatePartyId();
    const partyUrl = `${window.location.href}?partyId=${partyId}`;
    const result = window.prompt('Share this link with your friends:', partyUrl);
    if (result !== null) {
      setupWebSocket(partyId);
      setupVideoSync(partyId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
    return true; // Indicates that the response is sent asynchronously
  }
});

function generatePartyId() {
  return Math.random().toString(36).substr(2, 9);
}

function setupWebSocket(partyId) {
  socket = new WebSocket('ws://localhost:8080');
  socket.onopen = () => {
    console.log('WebSocket connected');
    socket.send(JSON.stringify({ action: 'join', partyId }));
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handlePartyMessage(message);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
  };
}

function setupVideoSync(partyId) {
  const video = document.querySelector('video');
  if (!video) return;

  video.addEventListener('play', () => {
    sendMessageToParty(partyId, { action: 'play', currentTime: video.currentTime });
  });

  video.addEventListener('pause', () => {
    sendMessageToParty(partyId, { action: 'pause', currentTime: video.currentTime });
  });

  video.addEventListener('seeked', () => {
    sendMessageToParty(partyId, { action: 'seek', currentTime: video.currentTime });
  });
}

function sendMessageToParty(partyId, message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ ...message, partyId }));
  }
}

function handlePartyMessage(message) {
  const video = document.querySelector('video');
  if (!video) return;

  switch (message.action) {
    case 'play':
      video.currentTime = message.currentTime;
      video.play();
      break;
    case 'pause':
      video.currentTime = message.currentTime;
      video.pause();
      break;
    case 'seek':
      video.currentTime = message.currentTime;
      break;
  }
}
