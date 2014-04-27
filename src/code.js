//Javi Agenjo (@tamat) April 2014

var console_div = document.querySelector("#console");
var console_content = document.querySelector("#console .content");

var CCompiler = {

	compiler_options: { optimize: false },
	show_warnings: true, //not used

	waiting: false, //waiting server response (to avoid flooding)
	editor: null,

	//instances allowed to be called from the worker
	safe_instances: { console: console },

	init: function()
	{
		//create code mirror area
		var textarea = document.getElementById("code-area");
		var editor = CodeMirror.fromTextArea(textarea, {
			mode: "text/x-c++src",
			theme: "ambiance",
			lineNumbers: true,
			extraKeys: {
					"Ctrl-Space": "autocomplete",
					"Cmd-Space": "autocomplete",
					"Ctrl-S": "save",
					"Cmd-S": "save",
					"Ctrl-L": "load",
					"Cmd-L": "load",
					"Ctrl-Enter": "compile",
					"Cmd-Enter": "compile",
					}
		});
		this.editor = editor;

		CodeMirror.commands.autocomplete = function(cm) {
			//CodeMirror.showHint(cm, CodeMirror.javascriptHint );
			//TODO
		}

		CodeMirror.commands.compile = function(cm) {
			var code = editor.getValue();
			CCompiler.compile( code );
		}

		CodeMirror.commands.save = function(cm) {
			var code = editor.getValue();
			localStorage.setItem("ccompiler-code", code);
			cout("Code saved","color: #AAF");
		}

		CodeMirror.commands.load = function(cm) {
			var code = localStorage.getItem("ccompiler-code");
			if(code)
			{
				editor.setValue( code );
				cout("Code loaded","color: #AAF");
			}
			else
				cout("No code found to load","color: #AAF");
		}

		//bind buttons
		$("#help-button").click( CCompiler.showHelp.bind( CCompiler ) );
		$("#compile-button").click( function() { CodeMirror.commands.compile(); } );
		$("#clear-button").click( console.clear );
		$("#kill-button").click( CCompiler.killProcess.bind( CCompiler ) );
		$("#optimize-button").click( function() { $(this).toggleClass("clicked"); CCompiler.compiler_options.optimize = !CCompiler.compiler_options.optimize; });
	},

	compile: function(code)
	{
		if( this.waiting )
		{
			cout("Wait till the previous finished...");
			return;
		}

		this.killProcess();

		var line = cout("Compiling...");

		//Server request to get the code transpiled...
		$.post("compiler.php",{code: code, options: this.compiler_options },null,"json")
		.done( function(resp) {
			CCompiler.waiting = false;
			if(resp.error)
			{
				line.innerHTML = "Compiling... <span style='color: red'>ERROR</span>";
				cout( resp.error, "color: #FAA" );
				if(resp.output)
					cout(resp.output.split("\n").join("<br/>"), "color: #FAA" );
				if(resp.output.indexOf("generated") != -1)
					CCompiler.showErrors(resp.output);
				return;
			}
			line.innerHTML = "Compiling... <span style='color: #AFA'>DONE</span>";
			console.log(resp);
			if(resp.output == "CACHED")
				cout("Using cached version", "color: #AEF");
			else
				cout(resp.output);
			CCompiler.execute( resp.emcc_url );
		})
		.fail( function(err) {
			CCompiler.waiting = false;
			line.innerHTML = "Compiling... <span style='color: red'>SERVER ERROR</span>";
		});

		//set as waiting to avoid do more than one request
		this.waiting = true;
	},

	//execute the code in the url inside a worker
	execute: function( url )
	{
		this.clearErrors();

		if(this.worker)
			this.worker.terminate();

		cout(" + Launching worker...","color:#444");
		var worker = this.worker = new Worker(url);
		worker.onerror = function(err) { 
			cout("Error in code","color: red"); 
			cout(err,"color: gray"); 
			console.log(err);
		}

		worker.addEventListener("message", function(e){
			if(!e.data) return;
			var data = e.data;

			//allow to call exported instances
			if(data.action == "eval")
			{
				var instance = CCompiler.safe_instances[ data.instance ];
				if( instance && instance[ data.method ] )
					instance[ data.method ].apply( instance, data.params );
			}
			else if(data.action == "cout") //regular cout
			{
				cout.apply( window, data.params );
			}
			else if(data.action == "ready") //ready to call main
			{
				cout(" + Calling main()" ).style.marginBottom = "10px";
				this.postMessage({ action:"callMain" });
			}
			else if(data.action == "end") //main exited
			{
				this.terminate();
				CCompiler.worker = null;
				setTimeout(function() {
					cout(" + process finished" ).style.marginTop = "10px";
				},200);
			}
		});
	},

	//kill the worker
	killProcess: function()
	{
		if(!this.worker) return;
		this.worker.terminate();
		this.worker = null;
		cout(" + process killed" ).style.marginTop = "10px";
	},

	//parse errors and mark them in codemirror
	showErrors: function( errors )
	{
		var lines = errors.split("\n");

		var last_line = lines[ lines.length - 2];
		var num_errors = parseInt( last_line.split(" ")[0] );

		for(var i = 0; i < num_errors; i+=3)
		{
			var line = lines[i];
			var tokens = line.split(":");
			if(tokens.length == 0)
				continue;
			var lineNumber = parseInt( tokens[1] ) - 1;
			this.editor.addLineClass( lineNumber, 'background', 'line-error');
		}
	},

	//clear all error marks in codemirror
	clearErrors: function()
	{
		this.editor.eachLine( function(line) {
			CCompiler.editor.removeLineClass( line, 'background', 'line-error');
		});
	},

	//show help in console
	showHelp: function()
	{
		var info = document.getElementById("help-info");
		cout( info.innerHTML );
	}
};

//print in the console
function cout(txt, style)
{
	style = style || "";

	//create line
	var msg = document.createElement("p");
	msg.className = "msg";
	msg.innerHTML = "<span style='"+style+"'>"+txt+"</span>";

	//avoid overflow
	if(console_content.childElementCount > 1000)
		console_content.removeChild( console_content.childNodes[0] );

	//append
	console_content.appendChild(msg);

	//auto scroll
	console_content.scrollTop = console_content.scrollHeight;
	return msg;
}

//redirect standard console messages to my console
console._log = console.log;
console.log = function(msg) {
	if(typeof(msg) == "string")
		cout(msg,"color: #444");
	console._log(msg);
};

//allow to clear the console
console.clear = function()
{
	console_content.innerHTML = ""; 
}

//useful
String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return this;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}


//launch app
CCompiler.init();