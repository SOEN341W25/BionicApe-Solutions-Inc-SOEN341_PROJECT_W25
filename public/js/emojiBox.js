// Emoji picker functionality
const emojiButton = document.getElementById('emoji-button');
const emojiBox = document.getElementById('emoji-box');
const emojiInput = document.getElementById('emoji-input');

// Create emoji choices
const emojis = [
    { emoji: '😊', code: ':smile:' },
    { emoji: '😂', code: ':joy:' },
    { emoji: '👍', code: ':thumbsup:' },
    { emoji: '❤️', code: ':heart:' },
    { emoji: '🎉', code: ':tada:' },
    { emoji: '🤔', code: ':thinking:' },
    { emoji: '😎', code: ':sunglasses:' },
    { emoji: '👋', code: ':wave:' }
];

// Initialize emoji box
function initEmojiBox() {
    if (!emojiBox) return;
    
    // Clear existing content
    emojiBox.innerHTML = '';
    
    // Add emojis
    emojis.forEach(item => {
        const span = document.createElement('span');
        span.classList.add('emoji');
        span.setAttribute('data-emoji', item.emoji);
        span.setAttribute('title', item.code);
        span.textContent = item.emoji;
        emojiBox.appendChild(span);
    });
}

// Add event listeners
if (emojiButton) {
    emojiButton.addEventListener('click', () => {
        emojiBox.style.display = emojiBox.style.display === 'block' ? 'none' : 'block';
    });
}

if (emojiBox) {
    emojiBox.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji')) {
            const emoji = e.target.getAttribute('data-emoji');
            
            // If we're in a chat context, add to main input
            const chatInput = document.getElementById('input');
            if (chatInput) {
                chatInput.value += emoji;
                chatInput.focus();
            } 
            // Otherwise use the dedicated emoji input if available
            else if (emojiInput) {
                emojiInput.value += emoji;
                emojiInput.focus();
            }
            
            emojiBox.style.display = 'none';
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initEmojiBox);
