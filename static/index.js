let greeting = (status, userName, returnGreeting, newUserSpace) => {

  let greetingText = document.createElement('p')

  newUserSpace.style.display = "none"
  returnGreeting.style.visibility = "visible"
  returnGreeting.appendChild(greetingText)
  greetingText.className = "lead"

  status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}`
}



document.addEventListener("DOMContentLoaded", () => {

  let channelList = ''

  //check to see if channels saved in browser and update variables
  localStorage.getItem('channelList') ? channelList = localStorage.getItem('channelList') : ''

  channelList != '' ? channelList.trim().split('     ').forEach(channel => channelDisplay.innerHTML += `<li>${channel}</li>`) : channelDisplay.innerHTML = "<em>No channels yet!</em>"

  //connect to socket
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  //once connection is made configure buttons
  socket.on('connect', () => {

    document.querySelector('#channelCreate').onclick = () => {

      //add something later to handle if a blank name is inputted
      let newChannelName = document.querySelector("#newChannelName").value

      channelList += (newChannelName + '     ')
      localStorage.setItem('channelList', channelList)
      socket.emit('create channel', {'newChannelName': newChannelName})

    }

  })

  socket.on('confirm channel creation', data => {

    document.querySelector('#channelAlertSpace').innerHTML = data.message
    data.newChannelName ? document.querySelector("#channelDisplay").innerHTML += `<li>${data.newChannelName}</li>` : ''

  })

})

/*let channelCreate = (channelName, channelList) => {



}*/
