document.getElementById('mic-btn').addEventListener('click', function() {
    const voiceStatus = document.getElementById('voice-status');
    voiceStatus.style.display = 'block'; // Show listening status

    // Start voice recognition
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
            voiceStatus.style.display = 'none'; // Hide listening status
            // You can trigger the send button here if you want
            // document.getElementById('send-btn').click();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error detected: ' + event.error);
            voiceStatus.style.display = 'none'; // Hide listening status
        };

        recognition.start();
    } else {
        alert('Speech recognition not supported in this browser.');
    }
});
