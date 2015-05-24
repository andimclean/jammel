
module.exports =
	{
		stdout : function (data) { console.log('stdout: ', data.toString('utf8')); }, 
		stderr : function (data) { console.log('stderr: ', data.toString('utf8')); }
	};
