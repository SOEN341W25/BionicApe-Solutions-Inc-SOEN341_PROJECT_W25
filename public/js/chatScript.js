const socket = io();

// DOM elements
const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesUL = document.getElementById('messages');
const inviteForm = document.getElementById('inviteForm');
const inputInvite = document.getElementById('inputInvite');
const leaveChannelForm = document.getElementById('leaveChannelForm');
const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const searchBtn = document.querySelector(".bx-search");

// Constants
const DELETED_MODERATOR_MESSAGE = "Message is deleted by moderator";
let currentChannel;
let currentRecipientUser;
let mode = '';

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
    item.setAttribute("onclick", "deleteMessage(this)");
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

// Load channel chat history
function loadChatHistoryOfCurrentChannel() {
    fetch(`/api/channels/${currentChannel}`)
        .then((res) => res.json())
        .then((data) => {
            clearBox("messages");
            
            if (data.messageIds && data.messageIds.length > 0) {
                data.messageIds.forEach(message => {
                    addChatMessageToChatBox(message);
                });
            }
            
            // Show/hide invite form based on channel type
            if (data.public === undefined || data.public === true) {
                inviteForm.style.display = 'none';
                leaveChannelForm.style.display = 'none';
            } else {
                inviteForm.style.display = 'inline-block';
                leaveChannelForm.style.display = 'inline-block';
            }
            
            window.scrollTo(0, document.body.scrollHeight);
        })
        .catch(error => {
            console.error("Error loading channel history:", error);
        });
}

// Load direct message history
function loadChatHistoryOfCurrentRecipientUser() {
    fetch(`/api/users/userDMs/${currentRecipientUser}`)
        .then((res) => res.json())
        .then((data) => {
            clearBox("messages");
            
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

// Select a channel
function selectChannel(element) {
    mode = "channel";
    currentChannel = element.textContent;
    document.getElementById("currentChatBoxTitle").textContent = currentChannel;
    loadChatHistoryOfCurrentChannel();
}

// Select a user for DM
function selectUser(element) {
    mode = "dms";
    currentRecipientUser = element.textContent;
    document.getElementById("currentChatBoxTitle").textContent = currentRecipientUser;
    loadChatHistoryOfCurrentRecipientUser();
}

// Delete/restore a message
function deleteMessage(element) {
    const messageId = element.getAttribute("id");
    const visible = element.getAttribute("data-visibility") === 'true';
    socket.emit('modify channel message', messageId, !visible);
}

// Toggle sidebar
function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
}

// Display all channels
function displayAllChannels() {
    fetch('/api/users/channels')
        .then(res => res.json())
        .then(channels => {
            const renderList = document.getElementById('renderList');
            renderList.innerHTML = '';
            
            if (channels && channels.length > 0) {
                channels.forEach(channel => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = '#';
                    a.setAttribute("onclick", "selectChannel(this)");
                    li.setAttribute("id", `${channel.channelName}_id`);
                    a.textContent = channel.channelName;
                    li.appendChild(a);
                    renderList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No channels found.';
                renderList.appendChild(li);
            }
        })
        .catch(error => {
            console.error("Error loading channels:", error);
        });
}

// Event listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        if (mode === "channel") {
            socket.emit('channel message', input.value, currentChannel);
        } else {
            socket.emit('dms to user', input.value, currentRecipientUser);
        }
        input.value = '';
    }
});

inviteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (inputInvite.value && mode === "channel") {
        socket.emit('channel invite', inputInvite.value, currentChannel);
        inputInvite.value = '';
    }
});

leaveChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (mode === "channel") {
        socket.emit('channel leave', currentChannel);
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
socket.on('channel message', (msg, channelName) => {
    if (channelName === currentChannel) {
        addChatMessageToChatBox(msg);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

socket.on('dms to user', (msg, currentRecipient) => {
    if (currentRecipient === currentRecipientUser) {
        addChatMessageToChatBox(msg);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

socket.on('modify channel message', (message, visible) => {
    const messageElement = document.getElementById(message.messageId);
    if (messageElement) {
        const currentVisibility = messageElement.getAttribute("data-visibility") === 'true';
        
        if (visible !== currentVisibility) {
            messageElement.setAttribute("data-visibility", visible);
            messageElement.textContent = visible ? 
                constructChatMessageFromJson(message) : 
                DELETED_MODERATOR_MESSAGE;
        }
    }
});

socket.on('channel invite', (channel, userExists) => {
    if (!userExists) {
        alert("User does not exist");
    } else {
        alert("User has been invited to the channel");
    }
});

socket.on('channel leave', (userLeft) => {
    if (userLeft) {
        alert("You have left the channel");
        location.reload();
    } else {
        alert("Failed to leave the channel");
    }
});

// Initialize
menuBtnChange();
displayAllChannels();
document.addEventListener('DOMContentLoaded', displayAllChannels);
