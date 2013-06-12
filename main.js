var os				= require('os');
var _ 				= require('underscore');
var sys 			= require('sys')
var exec 			= require('child_process').exec;
var dateFormat 		= require('dateformat');
var stack 			= require('./lib.stack').stack;
var fs 				= require('fs')

String.prototype.contains = function(str, startIndex) { return -1!==this.indexOf(str, startIndex); };
Array.prototype.contains = function(str) {
	for (var i in this) {
		if (this[i] == str) {
			return true;
		}
	}
	return false;
};

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
			script:	"main.js -mysql online -batchsize 50"
		},
		Mailstack:	{
			path:	"/home/gitbuffer/Mailstack/",
			script:	"main.js -mysql online -batchsize 50 -use smtp"
		},
	};
	this.options = this.processArgs();
	console.log("--- Options ---\n",this.options);
}
Reboot.prototype.reboot = function() {
	var scope = this;
	var name;
	// Kill all node process
	this.emptyFile(this.shellscript);
	/*if (this.options.reboot) {
		for (name in this.scripts) {
			if (this.options.reboot.contains(name)) {
				this.execUpdate(this.scripts[name].path);
				this.execNode(this.scripts[name].path+this.scripts[name].script);
			}
		}
	} else if (this.options.ignore) {
		for (name in this.scripts) {
			if (!this.options.ignore.contains(name)) {
				this.execUpdate(this.scripts[name].path);
				this.execNode(this.scripts[name].path+this.scripts[name].script);
			}
		}
	} else if (this.options.service) {*/
		for (name in this.scripts) {
			//this.emptyFile("output/"+name+".conf", );
			(function(name) {
				scope.parseTemplate("tpl.conf", {
					name:		name,
					command:	"node "+scope.scripts[name].path+scope.scripts[name].script+" >> "+scope.scripts[name].path+scope.today+".log 2>&1"
				}, function(response) {
					scope.emptyFile("output/"+name+".conf", response);
				});
			})(name);
		}
	/*} else {
		this.execKill();
		for (name in this.scripts) {
			this.execUpdate(this.scripts[name].path);
			this.execNode(this.scripts[name].path+this.scripts[name].script);
		}
	}*/
	
	
	if (this.options.service) {
		// write the copy script
		this.emptyFile("output/copy.sh");
		for (name in this.scripts) {
			this.stack.add(function(params, onFinish) {
				scope.appendToFile("output/copy.sh", "copy "+params.name+".conf /etc/init/"+params.name+".conf", onFinish);
			}, {name:name});
		}
	}
	
	this.stack.process(function() {
		console.log("> REBOOT DONE.");
	});
}
Reboot.prototype.parseTemplate = function(template, data, callback) {
	var scope 	= this;
	
	// Set the template markup
	_.templateSettings = {
		interpolate : /\{\{(.+?)\}\}/g
	};
	
	
	// Read the template
	fs.readFile(template, 'utf8', function (err, response) {
		
		// Compile the template
		var template 	= _.template(response);
		// Execute and store the code
		var tplcode		= template(data);
		callback(tplcode);
	});
}
Reboot.prototype.execKill = function() {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> KILLING ALL NODE PROCESS.");
		scope.appendToFile(scope.shellscript, "killall node", onFinish);
	}, {});
}
Reboot.prototype.execNode = function(script) {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> STARTING "+script+".");
		scope.appendToFile(scope.shellscript, "nohup node "+script+" > "+scope.today+".log &", onFinish);
	}, {});
}
Reboot.prototype.execUpdate = function(path) {
	var scope = this;
	this.stack.add(function(params, onFinish) {
		console.log("> UPDATING "+path+".");
		scope.appendToFile(scope.shellscript, "cd "+path+" && git pull", onFinish);
	}, {});
}
Reboot.prototype.emptyFile = function(filename, data) {
	var log = fs.createWriteStream(filename, {'flags': 'w'});
	if (data) {
		log.end(data);
	} else {
		log.end("#!/bin/sh\n");
	}
}
Reboot.prototype.appendToFile = function(filename, data, callback) {
	fs.appendFile(filename, data+"\n", function (err) {
		if (callback) {
			callback();
		}
	});
}
Reboot.prototype.processArgs = function() {
	var i;
	var args 	= process.argv.slice(2);
	var output 	= {};
	for (i=0;i<args.length;i++) {
		var l1	= args[i].substr(0,1);
		if (l1 == "-") {
			if (args[i+1] == "true") {
				args[i+1] = true;
			}
			if (args[i+1] == "false") {
				args[i+1] = false;
			}
			if (!isNaN(args[i+1]*1)) {
				args[i+1] = args[i+1]*1;
			}
			console.log("typeof",typeof args[i+1]);
			console.log("args[i+1]",args[i+1]);
			if (args[i+1].toString().contains(",")) {
				args[i+1] = args[i+1].toString().split(",");
			}
			output[args[i].substr(1)] = args[i+1];
			i++;
		}
	}
	return output;
};


var reboot = new Reboot();
reboot.reboot();