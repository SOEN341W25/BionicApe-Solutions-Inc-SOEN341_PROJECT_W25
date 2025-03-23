const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesUL = document.getElementById('messages');
const inviteForm = document.getElementById('inviteForm');
const inputInvite = document.getElementById('inputInvite');
const leaveChannelForm = document.getElementById('leaveChannelForm');



function constructChatMessageFromJson(data) {
    if (!data.visible) {
        return DELETED_MODERATOR_MESSAGE;
    }
    return data.username + ":" + data.msg;
}


function addChatMessageToChatBox(msg)//create li
{
    const item = document.createElement('li');//creates the 'li' tag for each message sent
    item.textContent = constructChatMessageFromJson(msg);//fill 'li' tag with certain content which is the message received
    messagesUL.appendChild(item);//messages has ul and it will add it to its child which is inside of the tag ul  
    item.setAttribute("onclick", "deleteMessage(this)");
    item.setAttribute("id", msg.messageId);
    item.setAttribute("data-visibility", msg.visible);
}
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        if (mode == "channel") {
            socket.emit('channel message', input.value, currentChannel);
        }
        else {
            socket.emit('dms to user', input.value, currentRecipientUser);
        }
        input.value = '';
    }
});
inviteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (inputInvite.value) {
        if (mode == "channel") {
            socket.emit('channel invite', inputInvite.value, currentChannel);
        }
        inputInvite.value = '';
    }
});
leaveChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (mode == "channel") {
        socket.emit('channel leave', currentChannel);
    }
});
socket.on('channel message', (msg, channelName) => {
    console.log(channelName);
    if (channelName === currentChannel) {
        addChatMessageToChatBox(msg);
        window.scrollTo(0, document.body.scrollHeight);//some scrolling
    }
    else {
        //notification
        console.log("notify", channelName);
        const channelToNotify = document.getElementById(msg.channelName + "_id");
        //channelToNotify.setAttribute("class","sidebarNotify");
        //channelToNotify.style.backgroundColor = "red"
    }
});
socket.on('channel invite', (channel, userExist) => {
    if (!userExist) {
        alert("User does not exist");
    }
    else {
        alert(JSON.stringify(channel));

    }
})
socket.on('channel leave', (userLeft) => {
    if (userLeft) {
        alert("User left");
        location.reload();//refresh the page to make leaving channel dissapear
    }
    else {
        alert("User fail to leave");
    }

})
socket.on('dms to user', (msg, currentRecipient) => {
    console.log("I have received dm", msg, currentRecipient);
    if (currentRecipient === currentRecipientUser) {
        addChatMessageToChatBox(msg);
        window.scrollTo(0, document.body.scrollHeight);//some scrolling
    }
    else {
        //notification
        console.log("notify", currentRecipient);
        const userToNotify = document.getElementById(msg.username + "_id");
        //channelToNotify.setAttribute("class","sidebarNotify");
        //channelToNotify.style.backgroundColor = "red"
    }
});
function clearBox(elementID) {
    console.log(elementID);
    let element = document.getElementById(elementID);
    element.innerHTML = "";//get the tag and whatever is in between becomes empty

}
function loadChatHistoryOfCurrentChannel() {
    fetch("/api/channel/" + currentChannel)
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data))
            //createListUserInChannel(data);
            clearBox("messages");
            data.messageIds.forEach(message => {
                addChatMessageToChatBox(message);
            })
            if (data.public == undefined || data.public == true) {
                inviteForm.style.display = 'none';
                leaveChannelForm.style.display = 'none';

            }
            else {
                inviteForm.style.display = 'inline-block';
                leaveChannelForm.style.display = 'inline-block';
            }
            //mongodb is not very restrictive so the schema can differ.
            //no sql is flexible in terms of schema therefore, we need to mention both statement wheter the data is undefined and true
        })
        .catch(console.error);
}
function loadChatHistoryOfCurrentRecipientUser() {
    fetch("/api/user/userDMs/" + currentRecipientUser)
        .then((res) => res.json())
        .then((data) => {
            console.log(JSON.stringify(data))
            clearBox("messages");
            data.userDMs.forEach(dms => {
                if (dms.recipientUser == currentRecipientUser) {
                    dms.messageIds.forEach(individualMessage => {
                        addChatMessageToChatBox(individualMessage);
                    })
                }

            })
        })
        .catch(console.error);
}


function selectChannel(element) {
    mode = "channel";
    const displayChannelName = document.getElementById("currentChatBoxTitle");
    console.log(element.innerHTML);
    currentChannel = element.innerHTML;
    displayChannelName.innerHTML = element.innerHTML;
    loadChatHistoryOfCurrentChannel();
}

function selectUser(element) {
    mode = "dms";
    const selectUsername = document.getElementById("currentChatBoxTitle");
    console.log(element.innerHTML);
    currentRecipientUser = element.innerHTML;
    selectUsername.innerHTML = element.innerHTML;
    loadChatHistoryOfCurrentRecipientUser();
}

function deleteMessage(element) {
    let messageId = element.getAttribute("id");
    let visible = element.getAttribute("data-visibility");
    let visibleInBoolType = (visible === 'true');
    console.log(!visibleInBoolType);
    socket.emit('modify channel message', messageId, !visibleInBoolType);
}
socket.on('modify channel message', (message, visible) => {
    console.log(message);
    const findMessage = document.getElementById(message.messageId);
    const elementMessageVisibility = findMessage.getAttribute("data-visibility");
    if (visible == elementMessageVisibility) {
        return;
    }

    findMessage.setAttribute("data-visibility", visible);
    if (visible) {
        findMessage.innerHTML = constructChatMessageFromJson(message)

    }
    else {
        findMessage.innerHTML = DELETED_MODERATOR_MESSAGE;
    }




});
let sidebar = document.querySelector(".sidebar");
let closeBtn = document.querySelector("#btn");
let searchBtn = document.querySelector(".bx-search");

closeBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange();
})

searchBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    menuBtnChange();
})

function menuBtnChange() {
    if (sidebar.classList.contains("open")) {
        closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
    }
}

menuBtnChange();
displayAllChannel();

var currentChannel;

var currentRecipientUser;
var mode = '';
const DELETED_MODERATOR_MESSAGE = "Message is deleted by moderator";

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.toggle-btn');


    sidebar.classList.toggle('collapsed');


    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.style.left = '10px'; // Move button when sidebar is hidden
    } else {
        toggleBtn.style.left = '260px'; // Reset position when sidebar is visible
    }
}




const formEl = document.querySelector('.form');


formEl.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(formEl);
    const data = Object.fromEntries(formData);


    fetch('/api/channel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            displayAllChannel(); // Refresh the list of channels
        })
        .catch(err => console.log(err));
});


function displayAllChannel() {
    fetch('/api/user/channels') // Assuming this endpoint returns the list of channels
        .then(res => res.json())
        .then(channels => {
            const renderList = document.getElementById('renderList');
            renderList.innerHTML = ''; // Clear the current list


            if (channels && channels.length > 0) {
                channels.forEach(channel => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = '#';
                    a.setAttribute("onclick", "selectChannel(this)");
                    li.setAttribute("id", channel.channelName + "_id")
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
        .catch(err => console.log(err));
}

// Call displayAllChannel on loading page to initially populate the list
document.addEventListener('DOMContentLoaded', displayAllChannel);

