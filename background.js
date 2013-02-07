if (!localStorage.isInitialized) {
  localStorage.isActivated = true;   // The display activation.
  localStorage.useproxy=true
  localStorage.username="username"
  localStorage.password="password"
  localStorage.proxycode="21"
  localStorage.proxyurl="https://proxy"+localStorage.proxycode+".iitd.ernet.in/";
  localStorage.isInitialized = true; // The option initialization.
}
//	TODO FIX
//	MAINTAIN STATE
//	pop checks state
//	response returns state + change-message
//	sessionid in state
var state = {
	logged:false,
	sessionid:""
}

var refreshVar = null;
var lockState = false;

function checkState(sendResponse){
	var response = {
		state:state,
		message:"State Update"
	};
	sendResponse(response);
	console.log("[checkState]\n"+JSON.stringify(response));
	return false;
}

function login(sendResponse){
	var formReq = new XMLHttpRequest();
    formReq.open("GET", "http://www.google.com", true);
    formReq.onload=function (){
		if(formReq.readyState==4){
			//console.log(formReq.getAllResponseHeaders());
			//console.log(formReq.responseText);
			// TODO: Improve sniffing mechanism
			var formMatch = /<title>IIT Delhi Proxy Login<\/title>/.exec(formReq.responseText);
			if(formMatch) {	// NOT LOGGED IN
				var formMatch2 = /<input name="sessionid" type="hidden" value="(.*)">/.exec(formReq.responseText);
				console.log(formMatch2);
				var logReq = new XMLHttpRequest();
				var form = 	 "sessionid="+formMatch2[1]+
						"&action="+"Validate"+
						"&userid="+localStorage.username+
						"&pass="+ localStorage.password
						;
				logReq.open("POST",localStorage.proxyurl+"cgi-bin/proxy.cgi",true);
				logReq.onload=function (){
					if(logReq.readyState==4){
					//console.log(logReq.getAllResponseHeaders());
					//console.log(logReq.responseText); // TODO FIX check validation
					var validMatch = /You are logged in successfully as (.*)\((.*)\) from ([0-9\.]*)/.exec(logReq.responseText);
					console.log(validMatch);
					if (validMatch){
						state.logged=true;
						state.sessionid=formMatch2[1];
						var response = {type: "loggedin",state:state, message: "Successfully logged in."};
						showPopupNotification("icon128.png",response.message,"For other apps, use Proxy_Host:10.10.78.21 Proxy_Port:3128",3000);
						sendResponse(response);
						console.log("[login]\n"+JSON.stringify(response));
						if(!refreshVar){
							refreshVar = setInterval(function(){refresh();},120000);
						}
					} else {
						var response = {type: "loggedout",state:state, message: "Invalid log in."};
						showPopupNotification("icon128.png",response.message,"Check log in credentials in options page",3000);
						sendResponse(response);
						console.log("[login]\n"+JSON.stringify(response));
					}
					} else {
						// ERROR
					}
				}
				logReq.send(form);
				
			} else {	// ALREADY LOGGED IN !!!
				var response = {type: "loggedin", state:state, message: "Already logged in."};
				showPopupNotification("icon128.png","Already logged in.","Sign out your proxy to use this app.",3000)
				sendResponse(response);
				console.log("[login]\n"+JSON.stringify(response));
			}
		} else {
			// ERROR
		}
	};
	formReq.send();
	return true;
}

function logout(sendResponse){
	var outReq = new XMLHttpRequest();
	var form = 	 "sessionid="+state.sessionid+
			"&action="+"logout";
	outReq.open("POST",localStorage.proxyurl+"cgi-bin/proxy.cgi",true);
	outReq.onload=function(){
		if(outReq.readyState==4){
			var logoutMatch = /Session Terminated/i.exec(outReq.responseText);
			console.log(logoutMatch);
			state.logged=false;
			state.sessionid="";
			var response = {type: "loggedout", state:state, message: ""};
			if(logoutMatch) {
				response.message="User has been Logged-Out."
			} else {
				response.message="User was not Logged-In.";
			}
			showPopupNotification("icon128.png",response.message,"Thank You for using PS!",1000);
			sendResponse(response);
			console.log("[logout]\n"+JSON.stringify(response));
		} else {
			// ERROR
		}
	}
	outReq.send(form);
	return true;
}

function refresh(){
	console.log("refresh");
	if(state.logged) {
		var refReq = new XMLHttpRequest();
		var form = 	 "sessionid="+state.sessionid+
				"&action="+"Refresh"+
				"&userid="+localStorage.username+
				"&pass="+ localStorage.password
				;
		refReq.open("POST",localStorage.proxyurl+"cgi-bin/proxy.cgi",true);
		refReq.onload=function (){
			if(refReq.readyState==4){
				//console.log(refReq.getAllResponseHeaders());
				//console.log(refReq.responseText);
				// IF VALIDATE
				var validMatch = /logged in successfully as (.*)\((.*)\) from ([0-9\.]*)/.exec(refReq.responseText);
				console.log(validMatch);
				if (validMatch){
					showPopupNotification("icon128.png","Session Refreshed","Auto refreshing session every 2 minutes",1000);
				} else {
					showPopupNotification("icon128.png","Session Refresh Failed","Authentication Failed",1000);
				}
			} else {
				// ERROR
			}
		};
		refReq.send(form);
	} else {
		if(refreshVar) {
			clearInterval(refreshVar);
		}
	}
}

function check(sendResponse){
	var checkReq = new XMLHttpRequest();
    checkReq.open("POST",localStorage.proxyurl+"squish/squish1.cgi", true);
	checkReq.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	var form =	"uid="+localStorage.username+
				"&magic_word="+localStorage.password+
				"&1=Proxy+Usage";
	checkReq.onload=function (){
		if(checkReq.readyState==4){
			var response = new Object();
			var usageKeys = checkReq.responseText.match(/<td align=right><B>(.*)<\/B><\/td>/g);
			for(var i = 0; i < usageKeys.length; i++){
				usageKeys[i]=/<td align=right><B>(.*)<\/B><\/td>/.exec(usageKeys[i])[1];
			}
			var usageValues = checkReq.responseText.match(/<td align=right>([^<>]*)<\/td>/g);
			for(var i = 0; i < usageValues.length; i++){
				usageValues[i]=string2MB(/<td align=right>([^<>]*)<\/td>/.exec(usageValues[i])[1]);
			}
			var match = /(\d+[a-zA-Z]*)\/([a-zA-Z]*) (\d+[a-zA-Z]*)\/([a-zA-Z]*) (\d+[a-zA-Z]*)\/([a-zA-Z]*)/.exec(checkReq.responseText);
			var quotaKeys = new Array();
			var quotaValues = new Array();
			for(var i = 0; 2*i+2<=match.length; ++i){
				quotaValues[i] = string2MB(match[2*i+1]);
				quotaKeys[i] = match[2*i+2];
			}
			var quotaUsed = new Array();
			for(var i=0;i<quotaKeys.length;++i){
				response[quotaKeys[i]]=new Object();
				response[quotaKeys[i]].quota=quotaValues[i];
				quotaUsed[i]=0;
				for(var j=0;j<usageKeys.length;++j){
					if(usageKeys[j].toLowerCase()==quotaKeys[i].toLowerCase()){
						response[quotaKeys[i]].usage=usageValues[j];
						quotaUsed[i]=100*usageValues[j]/quotaValues[i];
						response[quotaKeys[i]].percent=quotaUsed[i];
						break;
					}
				}
			}
			response.message=usage2String(response);
			max=Math.max.apply(null, quotaUsed);
			response.value=max;
			if (max<=20){
				response.color="#90CA77";
			} else if (max<=40){
				response.color="#81C6DD";
			} else if (max<=60){
				response.color="#E9B64D";
			} else if (max<=80){
				response.color="#E48743";
			} else if (max<=100){
				response.color="#9E3B33";
			}
			sendResponse(response);
			console.log("[check]\n"+JSON.stringify(response));
		} else {
			// ERROR
		}
	};
	checkReq.send(form);
	return true;
}

function usage2String(resp) {
	return "Week: "+resp.week.percent.toFixed(2)+"% ("+resp.week.usage+"MB of "+resp.week.quota+"MB); "
	+"Month: "+resp.month.percent.toFixed(2)+"% ("+resp.month.usage+"MB of "+resp.month.quota+"MB); "
	+"Year: "+resp.year.percent.toFixed(2)+"% ("+resp.year.usage+"MB of "+resp.year.quota+"MB).";
}

function string2MB(str) {
	var match = /[-+]?[0-9]*\.?[0-9]*([a-zA-Z]+)/.exec(str);
	var num = parseFloat(match[0]);
	var unit = match[1];
	if (unit.toLowerCase()=="kb") {
		num/=1024;
	} else if (unit.toLowerCase()=="mb") {
	} else if (unit.toLowerCase()=="gb") {
		num*=1024;
	} else {
		num = str;
	}
	return num;
}

function showPopupNotification(img,title,body,ms) {
	notification = window.webkitNotifications.createNotification(
					img,title,body);
	notification.show();
	setTimeout(function(){notification.cancel();},ms);
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) { 
	var response;
	if(request.type=="checkstate") {
		return checkState(sendResponse);
	}else if(request.type=="login") {
		return login(sendResponse);
	} else if(request.type=="logout") {
		return logout(sendResponse);
	} else if(request.type=="checkusage") {
		var response = {type: "usage", value: 50.00, icon: "50.png", message: "Your proxy usage is "+"2000 MB"+" of "+"4000 MB"};
		return check(sendResponse);
	}
	
	/*var notification = window.webkitNotifications.createNotification(
    'icon128.png',				// The image.
    'response.message',		// The title.
    response.message		// The body.
	);
	notification.show();
	setTimeout(function(){notification.cancel();},1000);*/
  });
