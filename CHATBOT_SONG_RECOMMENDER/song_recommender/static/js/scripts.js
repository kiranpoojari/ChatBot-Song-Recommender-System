document.addEventListener('DOMContentLoaded', function () {
    console.log("JavaScript file loaded successfully."); // Debugging statement

    // Get HTML elements
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const cameraButton = document.getElementById('camera-btn'); // Corrected ID
    const messagesContainer = document.getElementById('messages');
    const listeningGif = document.getElementById('listening-gif'); // GIF element
    let currentAudio = null;
    let recognition;
    let recognitionTimeout;
    let stream = null;
    let canvasElement = document.createElement('canvas');
    const videoElement = document.createElement('video');
    let detectedEmotion = '';

    // Ensure video and canvas elements are added to the DOM
    const videoContainer = document.getElementById('video-container'); // Assuming there's a container for the video
    videoElement.setAttribute('id', 'camera-stream');
    canvasElement.setAttribute('id', 'photo-canvas');
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(canvasElement);

    // Check if the browser supports the Web Speech API
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            console.log('Voice recognition started.');
            listeningGif.style.display = 'block'; // Show the GIF
            recognitionTimeout = setTimeout(() => {
                recognition.stop();
            }, 2000); // 2000 milliseconds = 2 seconds
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            console.log('Voice input received:', transcript);
            sendVoiceMessage(transcript);
        };

        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            listeningGif.style.display = 'none'; // Hide the GIF on error
            clearTimeout(recognitionTimeout); // Clear the timeout if there's an error
        };

        recognition.onend = function() {
            console.log('Voice recognition ended.');
            listeningGif.style.display = 'none'; // Hide the GIF when recognition ends
            clearTimeout(recognitionTimeout); // Clear the timeout if recognition ends
        };
    } else {
        console.error('Web Speech API not supported in this browser.');
    }

    voiceBtn.addEventListener('click', function() {
        console.log("Voice button clicked"); // Debugging statement
        if (recognition) {
            recognition.start();
        }
    });

    sendBtn.addEventListener('click', function() {
        const message = chatInput.value.trim();
        console.log("Send button clicked, message:", message); // Debugging statement
        if (message) {
            addMessage('user', 'You', message);
            chatInput.value = '';
            if (isThankYouMessage(message)) {
                addMessage('bot', 'Bot', 'You’re welcome! 🎶 If you need more music, just let me know.');
            } else {
                fetch('/process_chat/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ chat_input: message })
                })
                .then(response => {
                    // Check if response is JSON
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        return response.json();
                    } else {
                        throw new Error("Response is not JSON");
                    }
                })
                .then(data => {
                    if (data.error) {
                        addMessage('bot', 'Bot', data.error);
                    } else {
                        if (isGreeting(message)) {
                            addMessage('bot', 'Bot', 'Hello! How can I assist you today?');
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
    });

    function sendVoiceMessage(transcript) {
        if (transcript) {
            addMessage('user', 'You', transcript);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            if (isThankYouMessage(transcript)) {
                addMessage('bot', 'Bot', 'You’re welcome! 🎶 If you need more music, just let me know.');
            } else {
                fetch('/process_voice/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ voice_input: transcript })
                })
                .then(response => {
                    // Check if response is JSON
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        return response.json();
                    } else {
                        throw new Error("Response is not JSON");
                    }
                })
                .then(data => {
                    if (data.error) {
                        addMessage('bot', 'Bot', data.error);
                    } else {
                        if (isGreeting(transcript)) {
                            addMessage('bot', 'Bot', 'Hello! How can I assist you today?');
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
    }

    function isGreeting(message) {
        const lowerCaseMessage = message.toLowerCase();
        const greetings = ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good evening', 'gm', 'ge', 'hlo', 'kp'];
        return greetings.some(greeting => lowerCaseMessage.includes(greeting));
    }

    function isThankYouMessage(message) {
        const lowerCaseMessage = message.toLowerCase();
        const thankYous = ['thank you', 'thanks', 'tq', 'thankyou', 'thanks a lot', 'many thanks', 'thank'];
        return thankYous.some(thankYou => lowerCaseMessage.includes(thankYou));
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
                        currentAudio.pause(); // Pause the current audio
                    }
                    currentAudio = audio; // Set the new audio as the current audio
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
                    currentAudio.pause(); // Pause the current audio
                }
                currentAudio = audio; // Set the new audio as the current audio
            });
        }
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Automatically send a greeting message when the page loads
    addMessage('bot', 'Bot', 'Hi, how can I assist you today?');

    function processImage(blob) {
        const formData = new FormData();
        formData.append('image', blob);

        fetch('/process_image/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken') // Adding CSRF token
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                addMessage('bot', 'Bot', 'An error occurred while processing the image.');
            } else {
                console.log('Image processed successfully:', data);
                detectedEmotion = data.emotion;
                addMessage('bot', 'Bot', `Detected emotion: ${detectedEmotion}`);
                fetch('/process_chat/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ chat_input: detectedEmotion })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok.');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        addMessage('bot', 'Bot', data.error);
                    } else {
                        appendSongRecommendations(data.songs);
                    }
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                })
                .catch(error => {
                    console.error('Error:', error);
                    addMessage('bot', 'Bot', 'An error occurred while fetching songs.');
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addMessage('bot', 'Bot', 'An error occurred while processing the image.');
        });
    }

    function captureImage() {
        if (!stream) {
            return console.error("No camera stream available");
        }

        const context = canvasElement.getContext('2d');
        if (context) {
            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
            canvasElement.toBlob(blob => {
                processImage(blob);
            }, 'image/jpeg');
        }
    }

    cameraButton.addEventListener('click', async function() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Media devices API not supported.');
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            videoElement.play();

            // Capture the image after 2 seconds
            setTimeout(captureImage, 2000);
        } catch (error) {
            console.error('Error accessing the camera:', error);
        }
    });
});
