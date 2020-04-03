document.addEventListener("DOMContentLoaded", () => {

  //localStorage.clear()

  //connect to socket
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  //variable definitions
  let channelDisplay = document.querySelector("#channelDisplay")
  let newPostCreate = document.querySelector("#newPostCreate")
  let postSpace = document.querySelector("#postsView")
  let newUserSpace = document.querySelector("#newUserForm")
  let changeUser = document.querySelector("#userNameChange")
  let userName = localStorage.getItem('userName') ? localStorage.getItem('userName') : ''
  let currentChannel = localStorage.getItem('currentChannel') ? localStorage.getItem('currentChannel') : ''

  //---------------------------------------------------------------------------------------------------------------------------------
  //function definitions
  //user Greeting
  let greeting = (status, userName, newUserForm=newUserSpace, changeUserSpace=changeUser) => {

    let greetingText = document.createElement('p')

    newUserForm.style.display = "none"
    document.querySelector("#userGreeting").appendChild(greetingText)
    greetingText.className = "lead"
    status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}`
    changeUserSpace.style.display = "block" //contains change userName button

    //configure change user name button
    changeUserSpace.querySelector('button').addEventListener('click', () => {
      changeUserSpace.style.display = 'none'
      greetingText.innerHTML = ''
      newUserForm.style.display = 'block'
      newUserForm.querySelector('h4').style.display = 'none'
    })
  }

  //create and format post
  let postCreate = (post, areaToPost=postSpace) => {
    let newPost = document.createElement('li')
    newPost.innerHTML = `<b>${post.user}</b><em><span class="text-muted">   ${post.time}</em></span><br>${post.text}`
    newPost.style.marginRight = '30px'
    areaToPost.append(newPost)
  }

  //load channel - first clear any messages, then save current channel to memory then write posts to DOM and make post create input appear
  let loadChannel = (channel, space=postSpace) => {
    const request = new XMLHttpRequest()
    request.open('GET', `/loadChannel?q=${channel}`)
    request.onload = () => {

      space.innerHTML = ''
      localStorage.setItem('currentChannel', channel)
      document.querySelector('#selectedChannel').innerHTML = channel
      let response = JSON.parse(request.responseText)
      response.length > 0 ? response.forEach(post => postCreate(post, space)) : space.innerHTML = '<p class="lead"><em>No posts here yet!</em></p>'
      document.querySelector("#newPostCreate").style.display = 'block'

    }
    request.send()
  }

  let createChannelLink = (channel, space=channelDisplay) => {
    let newLinkContainer = document.createElement('li')
    let newLink = document.createElement('a')
    newLink.setAttribute('href', '#')
    newLink.innerHTML = `${channel}`
    newLink.addEventListener('click', function() {
      loadChannel(channel)
    })
    newLinkContainer.append(newLink)
    space.append(newLinkContainer)
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

  //---------------------------------------------------------------------------------------------------------------------------------
  // greet return user
  userName != '' ? greeting('returnUser', userName) : ''

  //load channel channel list
  socket.emit('load channel list')

  //load most recent channel
  currentChannel != '' ? loadChannel(currentChannel) : ''

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
      currentChannel = localStorage.getItem('currentChannel')
      let post = newPostCreate.querySelector("textarea").value
      let today = new Date()
      let timeStamp = `${today.getMonth()}-${today.getDate()}-${today.getFullYear()} ${today.getHours()}:` + (today.getMinutes() < 10 ? `0${today.getMinutes()}` : `${today.getMinutes()}`)
      socket.emit('save post', {'user': userName, 'time': timeStamp, 'text': post, 'channel': currentChannel})
      newPostCreate.querySelector("textarea").value = ''
    }
  })

  //list of channels from server - first part of function checks that there isn't already a list loaded (if two broswer windows open)
  socket.on('confirm channel list load', data => {
    if (channelDisplay.querySelectorAll('a').length == 1) {
      data = JSON.parse(data.channelList)
      data.length > 0 ? data.forEach(channel => createChannelLink(channel)) : channelDisplay.innerHTML = "<em>No channels yet!</em>"
    }
  })

  //this is sent once channel has been added server side
  socket.on('confirm channel creation', data => {
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    createChannelLink(data.newChannelName)
  })

  //this is sent once post has been added to channel dictionary server side
  socket.on('add post to channel', data => {
    let postToAdd = JSON.parse(data.post)
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate(postToAdd)
  })

})
