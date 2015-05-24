module.exports = {
	executing: function (cmd, cmdArgs, cmdOptions) {
		console.log('executing: ', cmd, cmdArgs, cmdOptions);
	},
	stdout : function(data) {
		console.log('stdout: ', data.toString('utf8'));
	},
	stderr : function(data) {
		console.log('stderr: ', data.toString('utf8'));
	},
	recordTime : function(tag, length) {
		console.log('Timed : ', tag, ' : ', length);
	},
	sendArtifact : function(full,rel) {
		console.log("Relative:", rel, ' fulname:', full);
	}
};
