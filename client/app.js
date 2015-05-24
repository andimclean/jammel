var SocketIo = require('socket.io-client'),
    spawn = require('child_process').spawn,
    config = require('./config.json'),
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    git = require('./lib/git'),
    crypto = require('crypto'),
    step = require('step');

var socket = SocketIo.connect('http://localhost:3000');
socket.on('connect', function() {
	console.log("Sending imavailable");
	socket.emit('imavailable');
});


function getRepositoryMirrorDirectory(repository) {
	var shasum = crypto.createHash('sha1');
	shasum.update(repository);
	
	return path.join(config.workingdirectory,'mirrors', shasum.digest('hex'));
}

function getBuildDirectory(buildName) {
	var date =new Date().getTime().toString();
	return path.join(config.workingdirectory,'builds', buildName, date);
}

socket.on('build', function(data) {
	
	var pipe = require('./lib/pipe');
	
	
	step(
		function makeMirrorDirIfNotExists() {
			var mirrorDir = getRepositoryMirrorDirectory(data.repository);
			this.parallel()(null, mirrorDir);
			mkdirp(mirrorDir, this.parallel());
		},
		function cloneMirrorIfNotExists(err, mirrorDir, made) {
			if (err) throw err;
			
			this.parallel()(null, mirrorDir);
			
			if (made) {
				git.createMirror(mirrorDir, data.repository, pipe, this.parallel());
			}
		},
		function fetchUpdatesForMirror(err, mirrorDir) {
			if (err) throw err;
			
			this.parallel()(null, mirrorDir);
			git.fetchMirror(mirrorDir, pipe, this.parallel());
		},
		
		function makeNewBuildDirectory(err, mirrorDir) {
			if (err) throw err;
			
			var buildDir = getBuildDirectory(data.buildname);
			
			this.parallel()(null, mirrorDir);
			this.parallel()(null, buildDir);
			mkdirp(buildDir, this.parallel());
		},
		function cloneMirrorIntoBuildDirectory(err, mirrorDir, buildDir) {
			if (err) throw err;

			this.parallel()(null, buildDir);
			git.cloneLocalGitRepository(mirrorDir, buildDir, pipe, this.parallel());
		},
		function fetchToBuildDirectory(err, buildDir) {
			if (err) throw err;
			this.parallel()(null, buildDir);
			git.fetchDirectory(buildDir, pipe, this.parallel());
		},
		function switchToBuildCommitHash(err, buildDir) {
			if (err) throw err;
			
			git.switchToHash(buildDir, data.buildTarget, pipe, this.parallel());
		}
	);
	
});

