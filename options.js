/*
  Grays out or [whatever the opposite of graying out is called] the option
  field.
*/
function save() {
	localStorage.username = proxySettings.username.value;
	localStorage.password = proxySettings.password.value;
	localStorage.proxycode = proxySettings.proxycode.value;
	localStorage.proxyurl="https://proxy"+proxySettings.proxycode.value+".iitd.ernet.in/";
}

window.addEventListener('load', function() {
  // Initialize the option controls.
  proxySettings.username.value = localStorage.username;
  proxySettings.password.value = localStorage.password;
  proxySettings.proxycode.value = localStorage.proxycode;
  proxySettings.showtoasts.checked = JSON.parse(localStorage.showtoasts);
  
  proxySettings.save.onclick = function(){save()};
  proxySettings.showtoasts.onchange = function(){
	console.log(proxySettings.showtoasts.checked);
	console.log(localStorage.showtoasts);
  localStorage.showtoasts = proxySettings.showtoasts.checked};
});
