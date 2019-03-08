var isTampering = true;
var windowopen = false;
var types = [];
var pattern = false;

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
		user_modify_headers(data).then(res=>{
			if(res.stop) stop_tampering();
			done({requestHeaders: res.headers});
		});
	
});



//});
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
//		user_modify_body(data).then(res=>{
//			if(res.stop) stop_tampering();
//			if(res.cancel) return done({cancel: true});
//			if(res.redirect) return done({redirectUrl: res.redirect});
//			done(e);
//		});i
//var bodydata = JSON.parse(data);
data.body.forEach(body=>{
console.log(body.value);
});
//return done({redirectUrl: res.redirect});
done(e);
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
			url: "popups/confirm_tamper/popup.html",
			type: "panel",
			allowScriptsToClose: true
		}).then(w=>{
			msgHandler = msg=>{
				types = msg.types;
				pattern = msg.pattern;
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
			width: 375,
			height: 525,
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

/*
var headerdata = JSON.parse(decodeURIComponent(data));
headerdata.header.forEach(header=>{
console.log(header.name)
});
*/
}

function user_modify_body(data){
/*
	return new Promise(done=>{
		browser.windows.create({
			url: "popup.html?"+encodeURIComponent(JSON.stringify(data)),
			type: "panel",
			width: 375,
			height: 525,
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
var bodydata = JSON.parse(decodeURIComponent(data));
bodydata.body.forEach(body=>{
console.log(body.name)
});

*/
}

function confirm_and_start_tamper(){
	user_confirm_tamper().then(res=>{
		if(res.tamper === true){
			isTampering = true;
			browser.browserAction.setIcon({
				path: {
					"48": "icons/icon-tamper-48.png",
					"32": "icons/icon-tamper-32.png",
					"16": "icons/icon-tamper-16.png"
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
			"48": "icons/icon-notamper-48.png",
			"32": "icons/icon-notamper-32.png",
			"16": "icons/icon-notamper-16.png"
		}
	});
	stop_tamper_listener();
}

browser.runtime.onMessage.addListener(handleMessage);
browser.browserAction.onClicked.addListener(()=>{
	if(!isTampering) confirm_and_start_tamper();
	else stop_tampering();
});

start_tamper_listener();
