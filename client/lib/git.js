var step = require('step')
	, exec = require('./exec');

function performGitAction(args, commandOptions, pipe, callback) {
	commandOptions = commandOptions || {};
	exec('git', args, commandOptions, pipe, callback);
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
