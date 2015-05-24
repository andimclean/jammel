/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user =
		require('./routes/user'), http = require('http'), path =
		require('path'), SocketIo = require('socket.io');

var app = express(), server, wss, io;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);
server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

io = SocketIo(server);

io.on('connection', function connection(socket) {
	console.log("Connection made");
	socket.on('imavailable', function(data) {
		console.log('Got imavailable');
		socket.emit('build', {
			buildname: 'jammel', 
			buildTarget: 'Develop', 
			repository: 'git@github.com:andimclean/jammel.git',
			cmd: './build',
			cmdArgs: [],
			cmdDir: './'
		});
	});
});
