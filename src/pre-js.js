//BASIC OUTPUT FROM WORKER ************
if(typeof(self) != undefined)
{
	self.console = {
		clear: function()
		{
			self.postMessage({action:"eval", instance: "console", method:"clear"});
		},

		log: function(msg)
		{
			self.postMessage({action:"eval", instance: "console", method:"log", params: msg});
		},

		err: function(msg)
		{
			self.postMessage({action:"eval", instance: "console", method:"err", params: msg});
		}
	}

	self.cout = function cout(msg,style)
	{
		self.postMessage({action:"cout", params: [msg, style] });
	}
}
//END ************************************