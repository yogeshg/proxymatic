/*
  Grays out or [whatever the opposite of graying out is called] the option
  field.
*/
function ghost(isDeactivated) {
  proxySettings.style.color = isDeactivated ? 'graytext' : 'black';
                                              // The label color.
  proxySettings.username.disabled = isDeactivated; // The control manipulability.
  proxySettings.password.disabled = isDeactivated; // The control manipulability.
  proxySettings.proxycode.disabled = isDeactivated; // The control manipulability.
  proxySettings.save.disabled = isDeactivated; // The control manipulability.
}
function save() {
	localStorage.username = proxySettings.username.value;
	localStorage.password = proxySettings.password.value;
	localStorage.proxycode = proxySettings.proxycode.value;
	localStorage.proxyurl="https://proxy"+proxySettings.proxycode.value+".iitd.ernet.in/";
}

window.addEventListener('load', function() {
  // Initialize the option controls.
  proxySettings.useproxy.checked = JSON.parse(localStorage.useproxy);
  proxySettings.username.value = localStorage.username;
  proxySettings.password.value = localStorage.password;
  proxySettings.proxycode.value = localStorage.proxycode;

  if (!proxySettings.useproxy.checked) { ghost(true); }

  proxySettings.useproxy.onchange = function() {
    localStorage.useproxy = proxySettings.useproxy.checked;
    ghost(!proxySettings.useproxy.checked);
  };
  
  proxySettings.save.onclick = function(){save()};
});
