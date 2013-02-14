if (!localStorage.isInitialized) {
  localStorage.username="username"
  localStorage.password="password"
  localStorage.proxycode="21"
  localStorage.proxyurl="https://proxy"+localStorage.proxycode+".iitd.ernet.in/";
  localStorage.showtoasts = true;
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
			var loginformRegex = /<title>IIT Delhi Proxy Login<\/title>/.exec(formReq.responseText);
			var sessionidRegex = /<input name="sessionid" type="hidden" value="(.*)">/.exec(formReq.responseText);
			if(loginformRegex) {console.log(loginformRegex);}
			if(sessionidRegex) {console.log(sessionidRegex);}
			if(loginformRegex||sessionidRegex) {	// NOT LOGGED IN
				var logReq = new XMLHttpRequest();
				var form = 	 "sessionid="+sessionidRegex[1]+
						"&action="+"Validate"+
						"&userid="+localStorage.username+
						"&pass="+ localStorage.password
						;
				logReq.open("POST",localStorage.proxyurl+"cgi-bin/proxy.cgi",true);
				logReq.onload=function (){
					if(logReq.readyState==4){
					var successfulRegex = /You are logged in successfully as (.*)\((.*)\) from ([0-9\.]*)/.exec(logReq.responseText);
					console.log(successfulRegex);
					if (successfulRegex){
						state.logged=true;
						state.sessionid=sessionidRegex[1];
						var response = {type: "loggedin",state:state, message: "Successfully logged in."};
						var msg = "as "+successfulRegex[1]+" from "+successfulRegex[3]
									+"; Autoconfig Proxy_URL:"+successfulRegex[2]
									+"; Proxy_Host:10.10.78.21 Proxy_Port:3128";
						showPopupNotification("icon128.png",response.message,msg,3000);
						sendResponse(response);
						// TODO: Change icon to green.
						console.log("[login]\n"+JSON.stringify(response));
						if(!refreshVar){
							refreshVar = setInterval(function(){refresh();},120000);
						}
					} else {
					var response = {type: "loggedout",state:state, message: "Failed log in."};
					var invalidRegex = /Either your userid and\/or password does'not match\./.exec(logReq.responseText);
					var alreadyRegex = /(.*) already logged in from ([0-9\.]*)\./.exec(logReq.responseText);
					var expiredRegex = /<h1>(Your session expired)<\/h1>/.exec(logReq.responseText);
					var msg;
					if (invalidRegex){
						console.log(invalidRegex);
						msg = "Your username and/or password are invalid. Please check credentials on Options page.";
					} else if (alreadyRegex){
						console.log(alreadyRegex);
						msg = "Username: "+alreadyRegex[1]+" is already logged in from "+alreadyRegex[2]+". Please logout from their or log in using a different username.";
					} else if(expiredRegex){
						console.log(expiredRegex);
						msg = "The session you were logging in with has expired. Please try again.";
					}
					showPopupNotification("icon128.png",response.message,msg,3000);
					sendResponse(response);
					// TODO: Change icon to red/brown ???
					console.log("[login]\n"+JSON.stringify(response));
					}
					} else {
						// HTTP ERROR
					}
				}
				logReq.send(form);
				
			} else {	// ALREADY LOGGED IN !!!
				var response = {type: "loggedin", state:state, message: "Already logged in."};
				showPopupNotification("icon128.png",response.message,"Sign out your proxy to use this app.",3000)
				sendResponse(response);
				console.log("[login]\n"+JSON.stringify(response));
			}
		} else {
			// HTTP ERROR
		}
	};
	formReq.send();
	return true;
}

function logout(sendResponse){
	var outReq = new XMLHttpRequest();
	var form = "sessionid="+state.sessionid+
				"&action="+"logout";
	outReq.open("POST",localStorage.proxyurl+"cgi-bin/proxy.cgi",true);
	outReq.onload=function(){
		if(outReq.readyState==4){
			var logoutRegex = /Session Terminated/i.exec(outReq.responseText);
			console.log(logoutRegex);
			state.logged=false;
			state.sessionid="";
			var response = {type: "loggedout", state:state};
			if(logoutRegex) {
				response.message="User logged out."
			} else {
				response.message="User was not logged in.";
			}
			showPopupNotification("icon128.png",response.message,"Thank You for using Proxymatic!",1000);
			sendResponse(response);
			// TODO: Change icon to red/brown/
			console.log("[logout]\n"+JSON.stringify(response));
		} else {
			// HTTP ERROR
		}
	}
	outReq.send(form);
	return true;
}

function refresh(){
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
				var successfulRegex = /logged in successfully as (.*)\((.*)\) from ([0-9\.]*)/.exec(refReq.responseText);
				console.log(successfulRegex);
				if (successfulRegex){
					showPopupNotification("icon128.png","Session Refreshed","Auto refreshing session every 2 minutes",1000);
				} else {
					showPopupNotification("icon128.png","Session Refresh Failed","Authentication Failed",1000);
					// TODO: Change icon to yellow
					// TODO: Try again in 1 minute
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
			var usage = new Object();
			var usageKeys = checkReq.responseText.match(/<td align=right><B>(.*)<\/B><\/td>/g);
			for(var i = 0; i < usageKeys.length; i++){
				usageKeys[i]=/<td align=right><B>(.*)<\/B><\/td>/.exec(usageKeys[i])[1];
			}
			var usageValues = checkReq.responseText.match(/<td align=right>([^<>]*)<\/td>/g);
			console.log(usageValues);
			for(var i = 0; i < usageValues.length; i++){
				usageValues[i]=string2MB(/<td align=right>(.*)<\/td>/.exec(usageValues[i])[1]);
			}
			var quotaRegex = /(\d+[a-zA-Z]*)\/([a-zA-Z]*) (\d+[a-zA-Z]*)\/([a-zA-Z]*) (\d+[a-zA-Z]*)\/([a-zA-Z]*)/.exec(checkReq.responseText);
			var quotaKeys = new Array();
			var quotaValues = new Array();
			for(var i = 0; 2*i+2<=quotaRegex.length; ++i){
				quotaValues[i] = string2MB(quotaRegex[2*i+1]);
				quotaKeys[i] = quotaRegex[2*i+2];
			}
			var quotaUsed = new Array();
			for(var i=0;i<quotaKeys.length;++i){
				usage[quotaKeys[i]]=new Object();
				usage[quotaKeys[i]].quota=quotaValues[i];
				quotaUsed[i]=0;
				for(var j=0;j<usageKeys.length;++j){
					if(usageKeys[j].toLowerCase()==quotaKeys[i].toLowerCase()){
						usage[quotaKeys[i]].usage=usageValues[j];
						quotaUsed[i]=100*usageValues[j]/quotaValues[i];
						usage[quotaKeys[i]].percent=quotaUsed[i];
						break;
					}
				}
			}
			var response = {type: "usage"};
			response.message=usage2String(usage);
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
			} else {
				response.color="#9E3B33";
			} // TODO: this should work in pop.js // read pallete (only once) instead of static values.
			try{
				sendResponse(response);
			} catch (e) {
				showPopupNotification("icon128.png","Proxy Usage: "+response.value+"%",response.message,3000);
			}
			console.log("[check]\n"+JSON.stringify(response));
		} else {
			// HTTP ERROR
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
	var match = /([-+]?[0-9]*\.?[0-9]*)([a-zA-Z]*)/.exec(str);
	try {
		var num = parseFloat(match[1]);
		var unit = match[2];
		if (unit.toLowerCase()=="b") {
			num/=(1024*1024);
		} else if (unit.toLowerCase()=="kb") {
			num/=1024;
		} else if (unit.toLowerCase()=="mb"||unit.toLowerCase()=="") {
			//num=num;
		} else if (unit.toLowerCase()=="gb") {
			num*=1024;
		} else {
			throw "unexpected unit";
		}
	} catch (e) {
		num = str;
	}
	return num;
}

function showPopupNotification(img,title,body,ms) {
	if(JSON.parse(localStorage.showtoasts)) {
		notification = window.webkitNotifications.createNotification(
						img,title,body);
		notification.show();
		setTimeout(function(){notification.cancel();},ms);
	}
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
		return check(sendResponse);
	}
  });
