const socket = io();

// DOM elements
const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesUL = document.getElementById('messages');
const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const searchBtn = document.querySelector(".bx-search");

// Constants
const DELETED_MODERATOR_MESSAGE = "Message is deleted by moderator";
let currentRecipientUser;

// Format message for display
function constructChatMessageFromJson(data) {
    if (!data.visible) {
        return DELETED_MODERATOR_MESSAGE;
    }
    return `${data.username}: ${data.msg}`;
}

// Add message to chat box
function addChatMessageToChatBox(msg) {
    const item = document.createElement('li');
    item.textContent = constructChatMessageFromJson(msg);
    messagesUL.appendChild(item);
    item.setAttribute("id", msg.messageId);
    item.setAttribute("data-visibility", msg.visible);
    
    // Add sentiment class
    if (msg.sentiment === 'positive') {
        item.classList.add('positive');
    } else if (msg.sentiment === 'negative') {
        item.classList.add('negative');
    } else {
        item.classList.add('neutral');
    }
}

// Clear element content
function clearBox(elementID) {
    document.getElementById(elementID).innerHTML = "";
}

// Load direct message history
function loadChatHistoryOfCurrentRecipientUser() {
    fetch(`/api/users/userDMs/${currentRecipientUser}`)
        .then((res) => res.json())
        .then((data) => {
            clearBox("messages");
            clearBox("lastActiveAtTitle");
            
            if (data.userDMs) {
                data.userDMs.forEach(dms => {
                    if (dms.recipientUser === currentRecipientUser) {
                        dms.messageIds.forEach(message => {
                            addChatMessageToChatBox(message);
                        });
                    }
                });
            }
            
            // Display last active time
            fetch(`/api/users/${currentRecipientUser}`)
                .then((res) => res.json())
                .then((userData) => {
                    if (userData.lastActivateAt) {
                        const activeDate = new Date(userData.lastActivateAt);
                        document.getElementById("lastActiveAtTitle").innerHTML = 
                            `Last active on ${activeDate.toDateString()} at ${activeDate.toLocaleTimeString()}`;
                    }
                })
                .catch(console.error);
                
            window.scrollTo(0, document.body.scrollHeight);
        })
        .catch(error => {
            console.error("Error loading DM history:", error);
        });
}

// Select a user for DM
function selectUser(element) {
    currentRecipientUser = element.textContent;
    document.getElementById("currentChatBoxTitle").textContent = currentRecipientUser;
    loadChatHistoryOfCurrentRecipientUser();
}

// Toggle sidebar
function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
}

// Display all users
function displayAllUsers() {
    fetch('/api/users')
        .then(res => res.json())
        .then(users => {
            const renderUserList = document.getElementById('renderList');
            renderUserList.innerHTML = '';
            
            if (users && users.length > 0) {
                users.forEach(user => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    const i = document.createElement('i');
                    
                    a.href = '#';
                    a.setAttribute("onclick", "selectUser(this)");
                    li.setAttribute("id", `${user.username}_id`);
                    
                    // Set user status indicator
                    const userStatus = user.userStatus || "offline";
                    i.setAttribute("class", userStatus === "online" ? "userStatus_online" : "userStatus");
                    
                    // Set content
                    a.textContent = user.username;
                    i.textContent = userStatus;
                    
                    li.appendChild(a);
                    li.appendChild(i);
                    renderUserList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No users found.';
                renderUserList.appendChild(li);
            }
        })
        .catch(error => {
            console.error("Error loading users:", error);
        });
}

// Event listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value && currentRecipientUser) {
        socket.emit('dms to user', input.value, currentRecipientUser);
        input.value = '';
    }
});

closeBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange();
});

searchBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange();
});

// Socket event listeners
socket.on('dms to user', (msg, sender) => {
    if (sender === currentRecipientUser || msg.username === currentRecipientUser) {
        addChatMessageToChatBox(msg);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

socket.on('user status', (user) => {
    const userElement = document.getElementById(`${user.username}_id`);
    if (userElement) {
        const statusElement = userElement.querySelector('i');
        if (statusElement) {
            statusElement.setAttribute("class", user.userStatus === "online" ? "userStatus_online" : "userStatus");
            statusElement.textContent = user.userStatus;
        }
    }
});

// Initialize
menuBtnChange();
displayAllUsers();
document.addEventListener('DOMContentLoaded', displayAllUsers);
