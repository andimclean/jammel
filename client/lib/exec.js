var spawn = require('child_process').spawn;

module.exports = function(cmd, args, commandOptions, pipe, callback) {
	commandOptions = commandOptions || {};
	var exec = spawn(cmd, args, commandOptions);

	exec.stdout.on('data', pipe.stdout);

	exec.stderr.on('data', pipe.stderr);

	exec.on('close', function(code) {
		if (code !== 0) {
			callback(cmd + ' exited with %s ' + code);
		} else {
			callback();
		}
	});

}
