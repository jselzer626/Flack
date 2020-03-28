//connect to socket
let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

let greeting = (status, userName, returnGreeting, newUserSpace) => {

  let greetingText = document.createElement('p')

  newUserSpace.style.display = "none"
  returnGreeting.style.visibility = "visible"
  returnGreeting.appendChild(greetingText)
  greetingText.className = "lead"

  status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}`
}

let channelView = channel => {
  console.log(channel)
  socket.emit('channel view', {'channelName': channel})
}

document.addEventListener("DOMContentLoaded", () => {

  //localStorage.clear()

  let channelDisplay = document.querySelector("#channelDisplay")
  let channelList = ''

  //check to see if channels saved in browser and update variables
  if (localStorage.getItem('channelList')) {
    channelList = localStorage.getItem('channelList')
    channelList.trim().split('     ').forEach(channel => channelDisplay.innerHTML += `<li><a href='#' class='channelLink' onclick="channelView('${channel}')">${channel}</a></li>`)
  } else
    channelDisplay.innerHTML = "<em>No channels yet!</em>"

  //once connection is made configure buttons
  socket.on('connect', () => {

    //button for channel configuration
    document.querySelector('#channelCreate').onclick = () => {

      //add something later to handle if a blank name is inputted
      let newChannelName = document.querySelector("#newChannelName").value

      channelList += (newChannelName + '     ')
      localStorage.setItem('channelList', channelList)
      socket.emit('create channel', {'newChannelName': newChannelName})
    }

  })

  socket.on('confirm channel creation', data => {

    //if this is first channel added then clear no channels added alert
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''

    //add channel name
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    data.newChannelName ? channelDisplay.innerHTML += `<li><a href='#' class='channelLink' onclick="channelView('${data.newChannelName}')">${data.newChannelName}</a></li>` : ''

  })

})
