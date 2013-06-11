var os				= require('os');
var _ 				= require('underscore');
var sys 			= require('sys')
var exec 			= require('child_process').exec;
var dateFormat 		= require('dateformat');
var stack 			= require('./lib.stack').stack;
var fs 				= require('fs')

function processArgs() {
	var i;
	var args 	= process.argv.slice(2);
	var output 	= {};
	for (i=0;i<args.length;i++) {
		var l1	= args[i].substr(0,1);
		if (l1 == "-") {
			output[args[i].substr(1)] = args[i+1];
			i++;
		}
	}
	return output;
};
var args = processArgs();
for (i in args) {
	console.log("-> ",i,": ",args[i]);
}

function Reboot() {
	this.stack 			= new stack(); 
	this.today 			= dateFormat(new Date(), "mmmm-dS-yyyy");
	this.shellscript	= "boot.sh";
	this.scripts	= {
		Datastore:	{
			path:	"/home/gitbuffer/datastore/",
			script:	"main.js"
		},
		Agora:	{
			path:	"/home/gitbuffer/Agora/",
			script:	"main.js"
		},
		Daemons:	{
			path:	"/home/gitbuffer/Daemons/",
			script:	"main.js"
		},
		Mailstack:	{
			path:	"/home/gitbuffer/Mailstack/",
			script:	"main.js"
		},
	};
}
Reboot.prototype.reboot = function() {
	var scope = this;
	var name;
	// Kill all node process
	this.emptyFile(this.shellscript);
	this.execKill();
	for (name in this.scripts) {
		this.execUpdate(this.scripts[name].path);
		this.execNode(this.scripts[name].path+this.scripts[name].script);
	}
	this.stack.process(function() {
		console.log("> REBOOT DONE.");
	});
}
Reboot.prototype.execKill = function() {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> KILLING ALL NODE PROCESS.");
		scope.appendToFile(scope.shellscript, "killall node", onFinish);
		
		/*var child = exec("killall node", function (error, stdout, stderr) {
			//sys.print('stdout: ' + stdout);
			//sys.print('stderr: ' + stderr);
			if (error !== null) {
				//console.log('exec error: ' + error);
			}
			onFinish();
		});*/
	}, {});
}
Reboot.prototype.execNode = function(script) {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> STARTING "+script+".");
		scope.appendToFile(scope.shellscript, "node "+script+"", onFinish);
		
		/*var child = exec("node "+script+"", function (error, stdout, stderr) {
			console.log(">> stdout",stdout);
			console.log(">> stderr",stderr);
			if (error !== null) {
				console.log('>> error',error);
			}
			onFinish();
		});*/
	}, {});
}
Reboot.prototype.execUpdate = function(path) {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> UPDATING "+path+".");
		scope.appendToFile(scope.shellscript, "cd "+path+" && git pull", onFinish);
		
		/*var child = exec("cd "+path+" && git pull", function (error, stdout, stderr) {
			//sys.print('stdout: ' + stdout);
			//sys.print('stderr: ' + stderr);
			if (error !== null) {
				//console.log('exec error: ' + error);
			}
			onFinish();
		});*/
	}, {});
}
Reboot.prototype.emptyFile = function(filename) {
	var log = fs.createWriteStream(filename, {'flags': 'w'});
	log.end("#!/bin/sh\n");
	
}
Reboot.prototype.appendToFile = function(filename, data, callback) {
	fs.appendFile(filename, data+"\n", function (err) {
		if (callback) {
			callback();
		}
	});
}


var reboot = new Reboot();
reboot.reboot();