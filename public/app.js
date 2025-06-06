document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    const YOUR_BACKEND_CHAT_URL = '/api/chat';
    const BOT_AVATAR_SRC = 'bot-avatar.png';
    const USER_AVATAR_SRC = 'user-avatar.png';

    function addMessageToChat(text, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        if (isLoading) {
            messageDiv.classList.add('bot-loading');
        }

        const avatarImg = document.createElement('img');
        avatarImg.classList.add('avatar');
        avatarImg.src = sender === 'user' ? USER_AVATAR_SRC : BOT_AVATAR_SRC;
        avatarImg.alt = sender === 'user' ? 'User Avatar' : 'Bot Avatar';

        const p = document.createElement('p');
        p.textContent = text;

        // Standard DOM order: Avatar then Text for bot, Text then Avatar for user.
        // CSS 'order' property will control the final visual layout.
        if (sender === 'user') {
            messageDiv.appendChild(p); // Text first in DOM
            messageDiv.appendChild(avatarImg); // Avatar second in DOM
        } else { // Bot message
            messageDiv.appendChild(avatarImg); // Avatar first in DOM
            messageDiv.appendChild(p); // Text second in DOM
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addMessageToChat("Hi there! I'm Holy Crow. Can't find your desired movie on hungryflix, or do you need some suggestions? Ask me and I will get the job done ", 'bot');

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') return;

        addMessageToChat(messageText, 'user');
        userInput.value = '';

        addMessageToChat("Holy Crow is thinking...", 'bot', true);

        console.log("Attempting to send to backend:", { message: messageText }); // DEBUG LOG

        try {
            const response = await fetch(YOUR_BACKEND_CHAT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            const loadingMessage = chatMessages.querySelector('.bot-loading');
            if (loadingMessage) {
                loadingMessage.remove();
            }

            if (!response.ok) {
                let errorDetails = `Server responded with status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if(errorData.error) errorDetails = errorData.error;
                    if(errorData.details) errorDetails += ` - ${errorData.details}`;
                } catch (e) { /* Ignore if response is not JSON */ }
                
                console.error('Error from backend:', errorDetails);
                addMessageToChat(`Oops! Something went wrong. ${errorDetails}. Please try again.`, 'bot');
                return;
            }

            const data = await response.json();
            if (data.reply) {
                addMessageToChat(data.reply, 'bot');
            } else {
                addMessageToChat('I received a response, but there was no reply text.', 'bot');
            }

        } catch (error) {
            console.error('Network or other error in sendMessage:', error);
            const loadingMessage = chatMessages.querySelector('.bot-loading');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            addMessageToChat('Oops! I couldn\'t connect. Please check your connection or try again.', 'bot');
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    userInput.focus();
});