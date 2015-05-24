var   spawn = require('child_process').spawn
	, path =require('path')
	, step = require('step');

function performGitAction(args, commandOptions, pipe, callback) {
	commandOptions = commandOptions || {};
	var gitclone = spawn('git', args, commandOptions);

	gitclone.stdout.on('data', function(data) {
		pipe.stdout(data);
	});

	gitclone.stderr.on('data', function(data) {
		pipe.stderr(data);
	});

	gitclone.on('close', function(code) {
		if (code !== 0) {
			console.log(args);
			callback('git exited with code ' + code);
		} else {
			callback();
		}
	});
}
module.exports =
	{
		createMirror : function(mirrorDir, repository, pipe, callback) {
			performGitAction([ 'clone', repository, '--mirror', mirrorDir ], {}, pipe, callback);
		},
		
		fetchMirror : function(mirrorDir,  pipe, callback) {
			var commandOptions = {
					cwd : mirrorDir
			};
			performGitAction([ 'fetch'], commandOptions,  pipe, callback);
		},
		
		cloneLocalGitRepository : function (mirrorDir, buildDir, pipe, callback) {
			
			performGitAction([ 'clone', '--local', mirrorDir, buildDir], {},  pipe, callback);
		},
		
		fetchDirectory : function (gitDir, pipe, callback) {
			var commandOptions = {
					cwd : gitDir
			};
			performGitAction([ 'fetch'], commandOptions,  pipe, callback);
		},

		switchToHash: function (gitDir, buildTarget, pipe, callback) {
			var commandOptions = {
					cwd : gitDir
			};
			performGitAction([ 'checkout', '--detach', buildTarget], commandOptions,  pipe, callback);			
		}
	};
