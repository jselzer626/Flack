//connect to socket
let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

//function declarations

let greeting = (status, userName, returnGreeting, newUserSpace) => {

  let greetingText = document.createElement('p')

  newUserSpace.style.display = "none"
  returnGreeting.style.visibility = "visible"
  returnGreeting.appendChild(greetingText)
  greetingText.className = "lead"

  status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}`
}

let postCreate = (post, areaToPost) => {

  //post will be an object containing text, user and timeStamp
  let newPost = document.createElement('li')
  newPost.innerHTML = `<b>${post.user}</b><span class="text-muted">   ${post.time}</span><br>${post.text}`
  areaToPost.append(newPost)

}

let loadChannel = channel => {
  const request = new XMLHttpRequest()
  request.open('GET', `/loadChannel?q=${channel}`)
  request.onload = () => {

    let postDisplaySpace = document.querySelector('#postsView')

    //clear any existing messages
    postDisplaySpace.innerHTML = ''

    //save channel to browser memory
    localStorage.setItem('currentChannel', channel)

    //change channel header
    document.querySelector('#selectedChannel').innerHTML = channel

    //parse response and add to DOM
    let response = JSON.parse(request.responseText)
    response.length > 0 ? response.forEach(post => postCreate(post, postDisplaySpace)) : postDisplaySpace.innerHTML = '<p class="lead"><em>No posts here yet!</em></p>'

    //make post create input appear
    document.querySelector("#newPostCreate").style.display = 'block'
  }
  request.send()
}

//function for channel switch
let channelView = channel => {
  loadChannel(channel)
}

document.addEventListener("DOMContentLoaded", () => {

  //localStorage.clear()

  //variable definitions
  let channelDisplay = document.querySelector("#channelDisplay")
  let newPostCreate = document.querySelector("#newPostCreate")
  let returnGreeting = document.querySelector("#returnUserGreeting")
  let newUserSpace = document.querySelector("#newUserForm")
  let postSpace = document.querySelector("#postsView")
  let channelList = ''
  let userName = ''


  //check to see if channel list exists
  localStorage.getItem('userName') ? userName = localStorage.getItem('userName') : ''

  //check to see if user already has a stored username
    if (userName != '')
      greeting('returnUser', userName, returnGreeting, newUserSpace)
    else {
      newUserSpace.style.visibility = "visible"
      //createInputForm("Enter new username here", "Create", newUserSpace, 'newUserCreate', 'newUserInput', '25%')

      newUserCreate.onclick = () => {
        if (newUserInput.value) {

          userName = newUserInput.value
          localStorage.setItem('userName', userName)

          greeting('newUser', userName, returnGreeting, newUserSpace)
        }
      }
    }

  //check to see if channels saved in browser and update variables
  if (localStorage.getItem('channelList')) {
    channelList = localStorage.getItem('channelList')
    channelList.trim().split('     ').forEach(channel => channelDisplay.innerHTML += `<li><a href='#' onclick="channelView('${channel}')">${channel}</a></li>`)
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

    //new post create button
    newPostCreate.querySelector("button").onclick = () => {

      //confirm channel name
      let currentChannel = localStorage.getItem('currentChannel')

      //save text
      let post = newPostCreate.querySelector("textarea").value

      //timestamp
      let today = new Date()
      let timeStamp = `${today.getMonth()}-${today.getDate()}-${today.getFullYear()} ${today.getHours()}:` + (today.getMinutes() < 10 ? $`0${today.getMinutes()}` : `${today.getMinutes()}`)

      //send to server
      socket.emit('save post', {'user': userName, 'time': timeStamp, 'text': post, 'channel': currentChannel})

    }

  })

  socket.on('confirm channel creation', data => {

    //if this is first channel added then clear no channels added alert
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''

    //add channel name
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    data.newChannelName ? channelDisplay.innerHTML += `<li><a href='#' onclick="channelView('${data.newChannelName}')">${data.newChannelName}</a></li>` : ''

  })

  socket.on('add post to channel', data=> {
    let postToAdd = JSON.parse(data.post)
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate(postToAdd, postSpace)

  })


})
