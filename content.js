console.log('Teleparty Clone content script loaded.');

let socket;
let sidebar = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkForVideo') {
    const hasVideo = checkForVideo();
    console.log('Video check result:', hasVideo); // Add this log
    sendResponse({ hasVideo: hasVideo });
  } else if (request.action === 'startParty') {
    if (createSidebar()) {
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  return true; // Keeps the message channel open for asynchronous responses
});

function checkForVideo() {
    // Check for video elements with blob URLs
    const blobVideos = document.querySelectorAll('video[src^="blob:"]');
    if (blobVideos.length > 0) {
        return true;
    }

    // Check for video elements with specific classes
    const classVideos = document.querySelectorAll('video.w-full.h-full');
    if (classVideos.length > 0) {
        return true;
    }

    // General video element check
    if (document.querySelector('video')) {
        return true;
    }

    // Check for video in iframes
    const iframes = document.querySelectorAll('iframe');
    for (let iframe of iframes) {
        try {
            if (iframe.contentDocument && iframe.contentDocument.querySelector('video')) {
                return true;
            }
        } catch (e) {
            console.log('Could not access iframe content');
        }
    }

    // Check for common video player elements
    const commonPlayerSelectors = [
        '.html5-video-player', // YouTube
        '.video-js', // VideoJS
        '.jwplayer', // JW Player
        '[data-player]', // Generic data-player attribute
        '#movie_player', // YouTube
        '.video-stream', // Some streaming sites
        // Add any other selectors specific to braflix.ru if needed
    ];

    for (let selector of commonPlayerSelectors) {
        if (document.querySelector(selector)) {
            return true;
        }
    }

    return false;
}

function createSidebar() {
  if (sidebar) return true; // Sidebar already exists

  const video = document.querySelector('video');
  if (!video) return false; // No video found

  sidebar = document.createElement('div');
  sidebar.id = 'teleparty-sidebar';
  sidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background-color: #1a1a1a;
    color: white;
    z-index: 9999;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
  `;

  const chatContainer = document.createElement('div');
  chatContainer.innerHTML = `
    <h2>Teleparty Chat</h2>
    <div id="chat-messages" style="height: 70%; overflow-y: auto; margin-bottom: 10px;"></div>
    <input type="text" id="chat-input" placeholder="Type a message..." style="width: 100%; padding: 5px;">
    <button id="send-message" style="width: 100%; margin-top: 10px; padding: 5px;">Send</button>
  `;

  sidebar.appendChild(chatContainer);
  document.body.appendChild(sidebar);

  // Adjust the main content to make room for the sidebar
  document.body.style.marginRight = '300px';

  // Add chat functionality
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-message');
  const chatMessages = document.getElementById('chat-messages');

  sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      addChatMessage('You', message);
      chatInput.value = '';
      // Here you would typically send the message to other party members
    }
  });

  return true;
}

function addChatMessage(sender, message) {
  const chatMessages = document.getElementById('chat-messages');
  const messageElement = document.createElement('p');
  messageElement.textContent = `${sender}: ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

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
