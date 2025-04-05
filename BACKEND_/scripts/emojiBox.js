const emojiButton = document.getElementById('emoji-button');
const emojiBox = document.getElementById('emoji-box');
const emojiInput = document.getElementById('emoji-input');

emojiButton.addEventListener('click', () => {
    emojiBox.style.display = emojiBox.style.display === 'block' ? 'none' : 'block';
});

emojiBox.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji')) {
        emojiInput.value += e.target.getAttribute('data-emoji');
        emojiBox.style.display = 'none';
    }
});