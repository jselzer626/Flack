//connect to socket
let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

//function definition for new/user greeting
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
  console.log('here')
  const request = new XMLHttpRequest()
  request.open('GET', `/loadChannel?q=${channel}`)
  request.onload = () => {
    //here
    let response = JSON.parse(request.responseText)
    console.log(response)
  }
  request.send()
}

//function for channel switch
let channelView = channel => {
  //socket.emit('channel view', {'channelName': channel})
  loadChannel(channel)
}


document.addEventListener("DOMContentLoaded", () => {

  localStorage.clear()

  let channelDisplay = document.querySelector("#channelDisplay")
  let newPostCreate = document.querySelector("#newPostCreate")
  let returnGreeting = document.querySelector("#returnUserGreeting")
  let newUserSpace = document.querySelector("#newUserForm")
  let postSpace = document.querySelector("#postsView")
  let channelList = ''
  let userName = ''
  let currentChannel = ''

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

    //new post create button
    newPostCreate.querySelector("button").onclick = () => {

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
    data.newChannelName ? channelDisplay.innerHTML += `<li><a href='#' class='channelLink' onclick="channelView('${data.newChannelName}')">${data.newChannelName}</a></li>` : ''

  })

  socket.on('view channel messages', data => {
    currentChannel = data.channelName
    document.querySelector('#selectedChannel').innerHTML = currentChannel

    //if no messages yet in channel notify user


    /*data.posts.length == 0 ? postSpace.innerHTML = '<p class="lead" style="margin:auto"><em>No posts in this channel yet!</em></p>': data.posts.forEach(post => postCreate(post, postSpace))

    document.querySelector('#createPost').style.display = 'block'*/

  })

  socket.on('add post to channel', data=> {
    let postToAdd = JSON.parse(data.post)
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate(postToAdd, postSpace)

  })


})
