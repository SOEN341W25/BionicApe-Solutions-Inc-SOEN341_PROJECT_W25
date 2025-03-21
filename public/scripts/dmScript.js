const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messagesUL = document.getElementById('messages');




function constructChatMessageFromJson(data) {
    if (!data.visible) {
        return DELETED_MODERATOR_MESSAGE;
    }
    return data.username + ":" + data.msg;
}

function addChatMessageToChatBox(msg) {
    const item = document.createElement('li');
    item.textContent = constructChatMessageFromJson(msg);
    messagesUL.appendChild(item);
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
displayAllUser();

var currentChannel;
var currentRecipientUser;
var mode = '';
const DELETED_MODERATOR_MESSAGE = "Message is deleted by moderator";

function displayAllUser() {
    fetch('api/user')
        .then(res => res.json())
        .then(users => {
            const renderUserList = document.getElementById('renderList');
            renderUserList.innerHTML = '';


            if (users && users.length > 0) {
                users.forEach(user => {
                    let li = document.createElement('li');
                    let a = document.createElement('a');
                    a.href = '#';
                    a.setAttribute("onclick", "selectUser(this)");
                    li.setAttribute("id", user.username + "_id")
                    a.textContent = user.username;
                    li.appendChild(a);
                    renderUserList.appendChild(li);
                });
            } else {
                let li = document.createElement('li');
                li.textContent = 'No user found. ';
                renderUserList.appendChild(li);
            }


        })
}

//call displayAllUser on loading page to initially populate the list
document.addEventListener('DOMContentLoaded', displayAllUser);

