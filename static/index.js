let greeting = (status, userName, returnGreeting, newUserSpace) => {

  let greetingText = document.createElement('p')

  newUserSpace.style.display = "none"
  returnGreeting.style.visibility = "visible"
  returnGreeting.appendChild(greetingText)
  greetingText.className = "lead"

  status == "returnUser" ? greetingText.innerHTML = `Welcome back ${userName}!` : greetingText.innerHTML = `Welcome ${userName}` ;

}

let createInputForm = (placeholder, buttonText, placeToInsert, buttonId, width="auto") => {

  const New_Input_Group = document.createElement('div')
  const New_Button_Holder = document.createElement('div')
  const New_Button = document.createElement('button')
  const New_Input = document.createElement('input')

  New_Input_Group.className = "input-group mb3"
  New_Input_Group.style.margin = "auto"
  New_Input_Group.style.width = width
  New_Button_Holder.className = "input-group-prepend"
  New_Button.className = "btn btn-primary"
  New_Button.innerHTML = buttonText
  New_Button.setAttribute('id', buttonId)
  New_Input.className = "form-control"
  New_Input.setAttribute('type', 'text')
  New_Input.setAttribute('placeholder', placeholder)

  placeToInsert.append(New_Input_Group)
  New_Input_Group.append(New_Button_Holder)
  New_Button_Holder.append(New_Button)
  New_Input_Group.append(New_Input)

}

/*let channelCreate = (channelName, channelList) => {



}*/
