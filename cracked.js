uri = decodeURI(window.location);
loginp1 = uri.replace(/.*login=/, "");
login = loginp1.replace(/&.*/, "");
password = uri.replace(/.*password=/, "");

alert("Username: " + login + " Password: " + password);
