document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const messagesContainer = document.getElementById('messages');
    let currentAudio = null;
    let recognition;

    // Check if the browser supports the Web Speech API
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            console.log('Voice recognition started.');
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            console.log('Voice input received:', transcript);
            sendVoiceMessage(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
        };

        recognition.onend = function() {
            console.log('Voice recognition ended.');
        };
    } else {
        console.error('Web Speech API not supported in this browser.');
    }

    voiceBtn.addEventListener('click', function() {
        if (recognition) {
            recognition.start();
        }
    });

    sendBtn.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage('user', 'You', message);
            chatInput.value = '';
            fetch('/process_chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ chat_input: message })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    addMessage('bot', 'Bot', data.error);
                } else {
                    if (isGreeting(message)) {
                        addMessage('bot', 'Bot', 'Hello! How can I assist you today?'); // Single consistent greeting
                    } else {
                        appendSongRecommendations(data.songs);
                    }
                }
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('bot', 'Bot', 'An error occurred while fetching songs.');
            });
        }
    });

    function sendVoiceMessage(transcript) {
        if (transcript) {
            addMessage('user', 'You', transcript);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            fetch('/process_voice/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ voice_input: transcript })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    addMessage('bot', 'Bot', data.error);
                } else {
                    if (isGreeting(transcript)) {
                        addMessage('bot', 'Bot', 'Hello! How can I assist you today?'); // Single consistent greeting
                    } else {
                        appendSongRecommendations(data.songs);
                    }
                }
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            })
            .catch(error => {
                console.error('Error:', error);
                addMessage('bot', 'Bot', 'An error occurred while fetching songs.');
            });
        }
    }

    function isGreeting(message) {
        const lowerCaseMessage = message.toLowerCase();
        const greetings = ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'gm', 'ge', 'hlo','kp'];
        return greetings.some(greeting => lowerCaseMessage.includes(greeting));
    }

    function appendSongRecommendations(songs) {
        songs.forEach(song => {
            const messageElement = document.createElement('li');
            messageElement.classList.add('message', 'bot');
            messageElement.innerHTML = `
                <div class="song-info">
                    <img src="${song.album_art}" alt="${song.name}">
                    <div class="song-details">
                        <div>Song: <a href="${song.url}" target="_blank">${song.name}</a></div>
                        <div>Artist: ${song.artist}</div>
                    </div>
                </div>
                <div class="audio-container">
                    <audio controls>
                        <source src="${song.preview_url}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                    <a href="${song.url}" class="full-song-link" target="_blank">Play Full Song</a>
                </div>
            `;
            messagesContainer.appendChild(messageElement);

            const audio = messageElement.querySelector('audio');
            if (audio) {
                audio.addEventListener('play', function() {
                    if (currentAudio && currentAudio !== audio) {
                        currentAudio.pause();  // Pause the current audio
                    }
                    currentAudio = audio;  // Set the new audio as the current audio
                });
            }
        });
    }

    function addMessage(sender, senderLabel, messageText) {
        const messageElement = document.createElement('li');
        messageElement.classList.add('message', sender);
        messageElement.innerHTML = `<div class="content"><span class="user">${senderLabel}:</span> ${messageText}</div>`;
        messagesContainer.appendChild(messageElement);

        const audio = messageElement.querySelector('audio');
        if (audio) {
            audio.addEventListener('play', function() {
                if (currentAudio && currentAudio !== audio) {
                    currentAudio.pause();  // Pause the current audio
                }
                currentAudio = audio;  // Set the new audio as the current audio
            });
        }
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; cookies.length > i; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});

