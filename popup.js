document.getElementById("n").onclick = ()=>respond(false);
document.getElementById("y").onclick = ()=>respond(true);
var wordlistfile;

function respond(r) {
	var types = [];
	Array.from(document.querySelectorAll(".types")).forEach(inp=>{
		if(inp.checked) types.push(inp.value);
	});
	browser.runtime.sendMessage({
		tamper: r,
		types: types,
		docpattern: document.getElementById("matchregexdoc").value,
                failpattern: document.getElementById("matchregexfail").value,
                crackuser: document.getElementById("crackuser").value,
                wordlist: wordlistfile
	});
}


function readSingleFile(e) {
  var file = e.target.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
    wordlistfile = e.target.result;
  //  displayContents(contents);
  };
  reader.readAsText(file);
}

document.getElementById('file-input').addEventListener('change', readSingleFile, false);

function firefox57_workaround_for_blank_panel() {
	browser.windows.getCurrent().then((currentWindow) => {
		browser.windows.update(currentWindow.id, {
			width: currentWindow.width,
			height: currentWindow.height + 1, // 1 pixel more than original size...
		});
	});
}

firefox57_workaround_for_blank_panel();
