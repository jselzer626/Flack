document.addEventListener("DOMContentLoaded", () => {

  //connect to socket
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  //variable definitions
  let channelDisplay = document.querySelector("#channelDisplay")
  let newPostCreate = document.querySelector("#newPostCreate")
  let postSpace = document.querySelector("#postsView")
  let newUserSpace = document.querySelector("#newUserForm")
  let userName = ''

  // function definitions
  //------------------------------------------------------------------------------------------------------------------------------------------
  // user Greeting
  let greeting = (status, userName, newUserSpace=newUserSpace) => {

    let greetingText = document.createElement('p')

    newUserSpace.style.display = "none"
    document.querySelector("#userGreeting").appendChild(greetingText)
    greetingText.className = "lead"
    status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}`
  }

  //create and format post
  let postCreate = (post, areaToPost) => {

    let newPost = document.createElement('li')
    newPost.innerHTML = `<b>${post.user}</b><span class="text-muted">   ${post.time}</span><br>${post.text}`
    areaToPost.append(newPost)
  }

  //load channel
  let loadChannel = (channel, postSpace=postSpace) => {
    const request = new XMLHttpRequest()
    request.open('GET', `/loadChannel?q=${channel}`)
    request.onload = () => {

      //clear any existing messages, save channel to broswer memory, change page header
      postSpace.innerHTML = ''
      localStorage.setItem('currentChannel', channel)
      document.querySelector('#selectedChannel').innerHTML = channel

      //add response to DOM and make div with post input form appear
      let response = JSON.parse(request.responseText)
      response.length > 0 ? response.forEach(post => postCreate(post, postSpace)) : postSpace.innerHTML = '<p class="lead"><em>No posts here yet!</em></p>'
      document.querySelector("#newPostCreate").style.display = 'block'

    }
    request.send()
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  //configure non web-socket buttons
  //userName create
  newUserSpace.querySelector('button').onclick = saveUser => {

    let userNameToSave = newUserSpace.querySelector('input')

    if (userNameToSave.value) {
      userName = userNameToSave.value
      localStorage.setItem('userName', userName)
      greeting('newUser', userName)
    } else {
      saveUser.preventDefault()
      window.alert('Please enter something into the field')
      return false
    }
  }
  //channel view
  postSpace.querySelectorAll('a').forEach(link => {
    link.onclick = () => loadChannel(link.innerHTML)
  })

  //---------------------------------------------------------------------------------------------------------------------------------
  // once user first visits page check to see if username or make new user form appear
  if (localStorage.getItem('userName')) {
    userName = localStorage.getItem('userName')
    greeting('returnUser', userName)
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  socket.on('connect', () => {

    //configure web sockets buttons
    //new channel button
    document.querySelector('#channelCreate').onclick = () => {
      let newChannelName = document.querySelector("#newChannelName").value
      socket.emit('create channel', {'newChannelName': newChannelName})
    }

    //new post create button
    newPostCreate.querySelector("button").onclick = () => {
      let currentChannel = localStorage.getItem('currentChannel')
      let post = newPostCreate.querySelector("textarea").value
      let today = new Date()
      let timeStamp = `${today.getMonth()}-${today.getDate()}-${today.getFullYear()} ${today.getHours()}:` + (today.getMinutes() < 10 ? $`0${today.getMinutes()}` : `${today.getMinutes()}`)
      socket.emit('save post', {'user': userName, 'time': timeStamp, 'text': post, 'channel': currentChannel})
    }

    //load channels - should just happen automatically once DOM loaded / sockets connected - could eventually pass a username here as a parameter once user specific channel lists exist
    socket.emit('load channel list')

  })

  //list of channels from server
  socket.on('confirm channel list load' data => {
    data.length > 0 ? data['channelList'].forEach(channel => channelDisplay.innerHTML += `<li><a href='#'>${channel}</a></li>`) : channelDisplay.innerHTML == "<em>No channels yet!</em>"
  })

  //this is sent once channel has been added server side
  socket.on('confirm channel creation', data => {
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    data.newChannelName ? channelDisplay.innerHTML += `<li><a href='#'>${data.newChannelName}</a></li>` : ''
  })

  //this is sent once post has been added to channel dictionary server side
  socket.on('add post to channel', data=> {
    let postToAdd = JSON.parse(data.post)
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate(postToAdd, postSpace)
  })

})
