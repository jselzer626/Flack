document.addEventListener("DOMContentLoaded", () => {

  console.log(screen.height)

  //connect to socket
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  //variable definitions
  let channelCreate = document.querySelector('#channelCreate')
  let channelDisplay = document.querySelector("#channelDisplay")
  let newPostCreate = document.querySelector("#newPostCreate")
  let postSpace = document.querySelector("#postsView")
  let newUserSpace = document.querySelector("#newUserForm")
  let changeUser = document.querySelector("#userNameChange")
  let activeUsers = document.querySelector('#activeUsers')
  let channelHeaderSpace = document.querySelector(".headerSpace")
  let notificationSpace = document.querySelector("#notificationSpace")
  let userName = localStorage.getItem('userName') ? localStorage.getItem('userName') : ''
  let currentChannel = localStorage.getItem('currentChannel') ? localStorage.getItem('currentChannel') : ''

  //---------------------------------------------------------------------------------------------------------------------------------
  //function definitions
  let enableClick = (input, button) => {
    input.addEventListener('keyup', e => {
      e.keyCode === 13 ? button.click() : ''
    })
  }

  //Timestamping
  let getTime = () => {
    let today = new Date()
    let rightNow = `${today.getMonth()}-${today.getDate()}-${today.getFullYear()} ${today.getHours()}:` + (today.getMinutes() < 10 ? `0${today.getMinutes()}` : `${today.getMinutes()}`)
    return rightNow
  }

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
  let postCreate = (post, activeUsersCount, areaToPost=postSpace, currentActiveUsers=activeUsers) => {

    let template = Handlebars.compile(document.querySelector('#postTemplate').innerHTML)
    let newPost = template({'post': post})
    areaToPost.innerHTML += newPost
    currentActiveUsers.innerHTML = activeUsersCount

    document.querySelector('.fa-trash').addEventListener('click', e => {
      if (confirm('Are you sure you want to delete this post?')) {
        postsView.removeChild(e.target.parentNode)
        socket.emit('delete post', {'channel': currentChannel, 'id': e.target.parentNode.dataset.postIndex})
      } else {
        e.preventDefault()
        return false
      }
    })

    document.querySelector('.fa-star').addEventListener('click', e => {
      if (e.target.dataset.checked == 'false') {
        e.target.className += ' checked'
        e.target.dataset.checked = true
      }
      else {
        e.target.classList.remove('checked')
        e.target.dataset.checked = false
      }
    })

  }

  //load channel - first clear any messages, then save current channel to memory then write posts to DOM and make post create input appear
  let loadChannel = (channel, space=postSpace, pageLoad, channelHeader=channelHeaderSpace) => {
    const request = new XMLHttpRequest()
    request.open('GET', `/loadChannel?q=${channel}`)
    request.onload = () => {
      space.innerHTML = ''
      let response = request.responseText
      //if localStorage has saved the variable but the server has been restarted (i.e. all channels deleted) then handle error
      if (response.trim() == '"Channel does not exist"')
        space.innerHTML = '<br><br><br><p class="lead" style="text-align: center"><em>Please create a channel to begin messaging</em></p><br><br><br>'
      else {
        response = JSON.parse(response)
        channelHeader.querySelector('h4').innerHTML = `#${channel}`
        channelHeader.querySelector('p').innerHTML = `<b>Created:</b> ${response.channelCreated}`
        channelHeader.querySelector('#channelDetails').style.display = "block"

        $(`a:contains("${currentChannel}")`) ? $(`a:contains("${currentChannel}")`).closest('li').removeClass('selected') : ''

        localStorage.setItem('currentChannel', channel)
        currentChannel = channel
        $(`a:contains("${channel}")`).closest('li').addClass('selected')

        if (response.posts.length > 0)
          response.posts.forEach(post => postCreate(post, response.users, space))
        else {
          space.innerHTML = '<br><br><br><p class="lead" style="text-align: center"><em>No posts here yet!</em></p><br><br><br>'
          activeUsers.innerHTML = response.users
        }
        document.querySelector("#newPostCreate").style.display = 'block'

      }
    }
    request.send()
  }

  let createChannelLink = (channel, space=channelDisplay) => {
    let newLinkContainer = document.createElement('li')
    let newLink = document.createElement('a')
    newLink.setAttribute('href', '#')
    newLink.innerHTML = `${channel}`
    newLink.addEventListener('click', e => {
      loadChannel(channel)
    })
    newLinkContainer.append(newLink)
    space.append(newLinkContainer)
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  //configure non web-socket buttons

  //userName create

  document.querySelector('#createChannelPrompt').onclick = () => {

    document.querySelector('#createChannelPrompt').parentElement.style.display = "none"
    channelCreate.style.display = ''

  }

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

  //enable enter submit for inputs
  enableClick(newPostCreate.querySelector("textarea"), newPostCreate.querySelector("button"))
  enableClick(newUserSpace.querySelector('input'), newUserSpace.querySelector('button'))
  enableClick(channelCreate.querySelector('input'), channelCreate.querySelector('button'))

  // load current channel
  currentChannel != '' ? loadChannel(currentChannel) : ''

  //load channel channel list
  socket.emit('load channel list')

  //---------------------------------------------------------------------------------------------------------------------------------
  socket.on('connect', () => {

    //configure web sockets buttons
    //new channel button
    channelCreate.querySelector('button').onclick = () => {
      let newChannelName = document.querySelector("#newChannelName").value
      socket.emit('create channel', {'newChannelName': newChannelName, 'channelCreated': getTime()})
      document.querySelector("#newChannelName").value = ''
      channelCreate.style.display = 'none'
      document.querySelector('#createChannelPrompt').parentElement.style.display = "block"
    }

    //new post create button
    newPostCreate.querySelector("button").onclick = () => {
      currentChannel = localStorage.getItem('currentChannel')
      let post = newPostCreate.querySelector("textarea").value
      let today = new Date()
      let timeStamp = getTime()
      socket.emit('save post', {'user': userName, 'time': timeStamp, 'text': post, 'channel': currentChannel})
      newPostCreate.querySelector("textarea").value = ''
    }
  })

  //list of channels from server - first part of function checks that there isn't already a list loaded (if two broswer windows open)
  socket.on('confirm channel list load', data => {
    if (channelDisplay.querySelectorAll('a').length == 1) {
      data = JSON.parse(data.channelList)
      data.length > 0 ? data.forEach(channel => createChannelLink(channel)) : channelDisplay.innerHTML = "<em>No channels yet!</em>"
      currentChannel != '' ? loadChannel(currentChannel) : channelHeaderSpace.innerHTML = 'No channel currently selected!'
    }
  })

  //this is sent once channel has been added server side. if channel name isn't already taken then a name will be included with returned data
  socket.on('confirm channel creation', data => {
    console.log(data)
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    if (data.newChannelName) {
      createChannelLink(data.newChannelName)
      loadChannel(data.newChannelName)
    }
  })

  //this is sent once post has been added to channel dictionary server side - this will pop first <li> if number of posts is greater than 100
  socket.on('add post to channel', data => {
    console.log(data)
    let postToAdd = JSON.parse(data.post)
    if (data.removePosts == true) {
      //postsView.removeChild(postsView.childNodes[0])
      postsView.removeChild(postsView.children[0])
    }

    let currentUsers = parseInt(data.currentActiveUsers)
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate(postToAdd, currentUsers)

  })

  //confirmation from server that post has been deleted
  socket.on('confirm post deletion', data => {
    notificationSpace.querySelector('p').innerHTML = data.message
    setTimeout(function(){notificationSpace.querySelector('p').innerHTML = ''}, 2000)
  })

})
