function updateState(response){
	console.log(JSON.stringify(response)+"\n"+response.state.logged);
	if(response.state.logged) {
		document.getElementById("logger").innerHTML="Log Out";
	} else {
		document.getElementById("logger").innerHTML="Log In";
	}
}

chrome.extension.sendMessage({type:"checkstate"},function (resp){updateState(resp);});


function logger() {
g = (document.getElementById("logger").innerHTML=="Log In") ? "login" : "logout"
chrome.extension.sendMessage({type: g}, function (resp){updateState(resp);});
}

function checker() {
g = "checkusage"
chrome.extension.sendMessage({type: g}, function (resp){checkinfo(resp);});
}

function checkinfo(response) {
	var bar = document.getElementById("usage");
	var usg = document.getElementById("usageBar");
	usg.style.width=response.value+"%";
	usg.style['background-color']=response.color;
	bar.style.display='block';
	bar.title=response.message;
	console.log(usg.style.width);
	console.log(usg.style['background-color']);
}

document.getElementById("logger").onclick = logger;
document.getElementById("checker").onclick = checker;
