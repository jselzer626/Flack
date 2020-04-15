document.addEventListener("DOMContentLoaded", () => {


  localStorage.clear()

  //connect to socket
  let socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

  //variable definitions
  let displayChunk = 5
  let tutorialArrowSides = document.querySelector('#tutorialArrowSides')
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
    input.addEventListener('keypress', e => {
      if (e.keyCode === 13) {
        e.preventDefault()
        button.click()
        return false
      }
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
  let postCreate = (action, post, activeUsersCount, areaToPost=postSpace, currentActiveUsers=activeUsers) => {

    let template = Handlebars.compile(document.querySelector('#postTemplate').innerHTML)
    let newPost = template({'post': post})
    if (action == "addingOldPosts") {
      areaToPost.insertAdjacentHTML('afterbegin', newPost)
    } else {
      areaToPost.innerHTML += newPost
      currentActiveUsers.innerHTML = activeUsersCount
    }
  }

  //load channel - first clear any messages, then save current channel to memory then write posts to DOM and make post create input appear
  let loadChannel = (channel, space=postSpace, channelHeader=channelHeaderSpace) => {
    const request = new XMLHttpRequest()
    request.open('GET', `/loadChannel?channel=${channel}`)
    request.onload = () => {
      space.innerHTML = ''
      let response = request.responseText
      //if localStorage has saved the variable but the server has been restarted (i.e. all channels deleted) then handle error
      if (response.trim() == '"Channel does not exist"')
        space.innerHTML = '<br><br><br><p class="lead" style="text-align: center"><em>Please create a channel to begin messaging</em></p><br><br><br>'
      else {

        response = JSON.parse(response)
        var channelDetails = channelHeader.querySelector('#channelDetails')

        channelHeader.querySelector('h4').innerHTML = `#${channel}`
        channelHeader.querySelector('p').style.display = 'none'
        channelDetails.querySelector('p').innerHTML = `<b>Created:</b> ${response.channelCreated}`
        channelDetails.style.display = "block"

        $(`a:contains("${currentChannel}")`) ? $(`a:contains("${currentChannel}")`).closest('li').removeClass('selected') : ''
        localStorage.setItem('currentChannel', channel)
        currentChannel = channel
        $(`a:contains("${channel}")`).closest('li').addClass('selected')

        if (response.posts.length > 0) {
            if (response.posts.length <= displayChunk) {
              response.posts.forEach(post => postCreate('create', post, response.users, space))
              notificationSpace.querySelector.innerHTML = "<em>Displaying all posts for this channel</em>"
            }
            else {
              for (let i = (response.posts.length - displayChunk); i <= response.posts.length; i ++) {
                postCreate('create', response.posts[i], response.users, space)
              }
              notificationSpace.querySelector('p').innerHTML = "<em>Displaying most recent messages</em>"
              notificationSpace.querySelector("button").style.display = ''
            }
        } else {
          //space.innerHTML = '<br><br><br><p class="lead" style="text-align: center"><em>No posts here yet!</em></p><br><br><br>'
          document.querySelector('#createChannelPrompt').style.boxShadow = ''
          tutorialArrowSides.style.display = "none"
          activeUsers.innerHTML = response.users
          if (postSpace.childElementCount == 0) {
             document.querySelector("#tutorialArrowDown").style.display = "block"
             document.querySelector('textarea').style.boxShadow = "1px 1px 25px 10px #014421"
          }
        }
        document.querySelector("#newPostCreate").style.display = 'block'
      }
    }
    request.send()
  }

  let loadMorePosts = (channel, end) => {
    const request = new XMLHttpRequest()
    request.open('GET', `/loadMorePosts?channel=${channel}&start=${end}`)
    request.onload = () => {

      let response = request.responseText

      response = JSON.parse(response)
      response.posts.forEach(post => postCreate('addingOldPosts', post, 0))

      console.log(response.displayButton)

      if (response.displayButton == false)  {
        notificationSpace.querySelector('button').style.display = "none"
        notificationSpace.querySelector('p').innerHTML = '<em>Displaying all posts for channel</em>'
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

  // icons for posts
  $(document).on('click', ".fa-trash", e => {
    if (confirm('Are you sure you want to delete this post?')) {
      socket.emit('delete post', {'channel': currentChannel, 'id': e.target.parentNode.dataset.postIndex})
    } else {
      e.preventDefault()
      return false
    }
  })

  $(document).on('click', ".fa-star", e => {
    if (e.target.dataset.checked == 'false') {
      e.target.className += ' checked'
      e.target.dataset.checked = true
    } else {
      e.target.classList.remove('checked')
      e.target.dataset.checked = false
    }
  })

  //load more posts button

  notificationSpace.querySelector('button').onclick = () => {
    var start = postSpace.childElementCount
    loadMorePosts(currentChannel, start)
  }

  document.querySelector('#createChannelPrompt').onclick = () => {
    document.querySelector('#createChannelPrompt').parentElement.style.display = "none"
    channelCreate.style.display = ''
  }

  //userName create
  newUserSpace.querySelector('button').onclick = saveUser => {

    let userNameToSave = newUserSpace.querySelector('input')

    if (userNameToSave.value) {
      userName = userNameToSave.value
      localStorage.setItem('userName', userName)
      greeting('newUser', userName)
      newUserSpace.style.boxShadow = ''
      if (!currentChannel) {
        document.querySelector('#createChannelPrompt').style.visibility = 'visible'
        document.querySelector('#createChannelPrompt').style.boxShadow = "1px 1px 25px 10px #A9A9A9"
        tutorialArrowSides.querySelector('i').className = "fa fa-arrow-left"
        tutorialArrowSides.querySelector('p').innerHTML = "Great! Now create or choose an existing channel"
        if (channelDisplay.childElementCount > 1) {
          channelDisplay.style.boxShadow = "1px 1px 25px 10px #A9A9A9"
          tutorialArrowSides.querySelector('p').innerHTML = "Great! Now create or choose an existing channel"
        } else {
          tutorialArrowSides.querySelector('p').innerHTML = "Great! Now create a channel"
        }
      }
    } else {
      saveUser.preventDefault()
      window.alert('Please enter something into the field')
      return false
    }
  }

  //---------------------------------------------------------------------------------------------------------------------------------
  //enable enter submit for inputs
  enableClick(newPostCreate.querySelector("textarea"), newPostCreate.querySelector("button"))
  enableClick(newUserSpace.querySelector('input'), newUserSpace.querySelector('button'))
  enableClick(channelCreate.querySelector('input'), channelCreate.querySelector('button'))

  //load channel channel list
  socket.emit('load channel list')

  // greet user
  if (userName != '')
    greeting('returnUser', userName)
  else {
    document.querySelector('#createChannelPrompt').style.visibility = "hidden"
    tutorialArrowSides.querySelector('p').innerHTML = "Create a username first"
    tutorialArrowSides.style.display = "block"
    newUserSpace.style.boxShadow = "1px 1px 25px 10px #014421"
  }
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
      if (currentChannel != '')
        loadChannel(currentChannel)
      else {
        channelHeaderSpace.querySelector('h4').innerHTML = 'Welcome!'
        channelHeaderSpace.querySelector('p').style.display = ''
      }
    }
  })

  //this is sent once channel has been added server side. if channel name isn't already taken then a name will be included with returned data
  socket.on('confirm channel creation', data => {
    channelDisplay.innerHTML == "<em>No channels yet!</em>" ? channelDisplay.innerHTML = '' : ''
    document.querySelector("#channelAlertSpace").innerHTML = data.message
    if (data.newChannelName) {
      createChannelLink(data.newChannelName)
      loadChannel(data.newChannelName)
    }
  })

  //this is sent once post has been added to channel dictionary server side - this will pop first <li> if number of posts is greater than 100
  socket.on('add post to channel', data => {
    let postToAdd = JSON.parse(data.post)

    let currentUsers = parseInt(data.currentActiveUsers)
    document.querySelector("#tutorialArrowDown").style.display = "none"
    document.querySelector('textarea').style.boxShadow = ''
    postSpace.querySelector('p') ? postSpace.innerHTML = '' : ''
    postCreate('create', postToAdd, currentUsers)

  })

  //confirmation from server that post has been deleted
  socket.on('confirm post deletion', data => {
    let postToDelete = postSpace.querySelector(`li[data-post-index="${data.id}"]`)
    postSpace.removeChild(postToDelete)
    notificationSpace.querySelector('p').innerHTML = data.message
    setTimeout(function(){notificationSpace.querySelector('p').innerHTML = ''}, 2000)
  })

})
