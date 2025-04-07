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
                    const i = document.createElement('
