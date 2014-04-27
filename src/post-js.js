//LAUNCH WORKER
Module["print"] = function(msg) { cout(msg,"color:white; padding-left: 15px;"); };
Module["clear"] = function() { console.clear(); }; 
Module["printErr"] = function(msg) { 
	if(msg == "Exiting runtime. Any attempt to access the compiled C code may fail from now. If you want to keep the runtime alive, set Module[\"noExitRuntime\"] = true or build with -s NO_EXIT_RUNTIME=1")
	{
		self.postMessage({action:"end"});
		return;
	}
	cout(msg,"color:#444"); 
};

if(typeof(self) != undefined)
{
	self.postMessage({action:"ready"});

	//read messages
	self.addEventListener('message', function(e) {
		if(!Module['_main'])
		{
			cout("No main function found","color: red");
			return;
		}
		if( e.data.action == "callMain" )
			Module.callMain();
	}, false);
}
//END *********