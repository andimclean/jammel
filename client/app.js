var SocketIo = require('socket.io-client')
		, config = require('./config.json')
		, path =require('path')
		, fs = require('fs')
		, mkdirp = require('mkdirp')
		, git =require('./lib/git')
		, crypto = require('crypto')
		, exec = require('./lib/exec')
		, filewalker = require('filewalker')
		, step = require('step');

var socket = SocketIo.connect('http://localhost:3000');
socket.on('connect', function() {
	console.log("Sending imavailable");
	socket.emit('imavailable');
});

function getRepositoryMirrorDirectory(repository) {
	var shasum = crypto.createHash('sha1');
	shasum.update(repository);

	return path.join(config.workingdirectory, 'mirrors', shasum.digest('hex'));
}

function getBuildDirectory(buildName) {
	var date = new Date().getTime().toString();
	return path.join(config.workingdirectory, 'builds', buildName, date);
}

socket.on('build', function(data) {
	var pipe = require('./lib/pipe');

	step(
		function doGitOps() {
			performGitOperations(data, pipe, this.parallel());
		},
		function doBuild(err, buildDir) {
			if (err)
				throw err;
			this.parallel()(null, buildDir);
			doBuildOperations(data, buildDir, pipe, this.parallel());
		},
		function archive(err,buildDir) {
			if (err)
				throw err;
			doArchive(data, buildDir, pipe, this.parallel());
		}
	);
});

function performGitOperations(data, pipe, callback) {
	var startTime = new Date().getTime();
	step(
		function makeMirrorDirIfNotExists() {
			var mirrorDir = getRepositoryMirrorDirectory(data.repository);
			this.parallel()(null, mirrorDir);
			mkdirp(mirrorDir, this.parallel());
		}, 
		
		function cloneMirrorIfNotExists(err, mirrorDir, made) {
			if (err)
				throw err;
	
			this.parallel()(null, mirrorDir);
	
			if (made) {
				git.createMirror(mirrorDir, data.repository, pipe, this.parallel());
			}
		}, 

		function fetchUpdatesForMirror(err, mirrorDir) {
			if (err)
				throw err;
	
			this.parallel()(null, mirrorDir);
			git.fetchMirror(mirrorDir, pipe, this.parallel());
		},

		function makeNewBuildDirectory(err, mirrorDir) {
			if (err)
				throw err;
	
			var buildDir = getBuildDirectory(data.buildname);
	
			this.parallel()(null, mirrorDir);
			this.parallel()(null, buildDir);
			mkdirp(buildDir, this.parallel());
		},
		
		function cloneMirrorIntoBuildDirectory(err, mirrorDir, buildDir) {
			if (err)
				throw err;
	
			this.parallel()(null, buildDir);
			git.cloneLocalGitRepository(mirrorDir, buildDir, pipe, this.parallel());
		}, 
		
		function fetchToBuildDirectory(err, buildDir) {
			if (err)
				throw err;
			this.parallel()(null, buildDir);
			git.fetchDirectory(buildDir, pipe, this.parallel());
		}, 
		
		function switchToBuildCommitHash(err, buildDir) {
			if (err)
				throw err;
			this.parallel()(null, buildDir);
			git.switchToHash(buildDir, data.buildTarget, pipe, this.parallel());
		}, 
		
		function performCallback(err, buildDir) {
			pipe.recordTime('Git', new Date().getTime() - startTime);
			callback(err, buildDir);
		}
	);
}

function doBuildOperations(data,buildDir, pipe, callback) {
	step(function doBuild() {
		var commandOptions = {
			cwd : path.join(buildDir, data.cmdDir || './')
		};
		this.parallel()(null, buildDir);
		this.parallel()(null, new Date().getTime());
		exec(data.cmd, data.cmdArgs, commandOptions, pipe, this.parallel());
	}, 
	function performCallback(err, buildDir, startTime) {
		if (err)
			throw err;
		pipe.recordTime('Build', new Date().getTime() - startTime);
		callback(null, buildDir);
	});
}

function doArchive(data, buildDir, pipe, callback) {
	var startTime = new Date().getTime();
	var regExp = [];
	for( var loop = 0; loop < data.artifacts.length; loop +=1) {
		regExp.push(new RegExp(data.artifacts[loop]));
	}
	
	filewalker(buildDir)
		.on('file', function(rel, stat, full){
			for( var loop = 0; loop < regExp.length; loop +=1) {
				if (regExp[loop].test(rel)) {
					pipe.sendArtifact(full,rel);
					return;
				}
			}	
		})
		.on('done', function() {
			pipe.recordTime('Artifacts', new Date().getTime() - startTime);
			callback();
		})
		.walk();
}
