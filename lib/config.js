var sanitize = require('validator').sanitize,
    os = require('os'),
	fs = require('fs'),
	httpClient = require('./http-client'),
	EventEmitter = require('events').EventEmitter;

var argv = require('optimist')
    .usage('Usage: $0 -c [config] -w [workers]')
    .demand(['c'])
	.string('c')
	.alias('c', 'config')
	.alias('w', 'workers')
	.default('w', ((os.cpus().length - 2) < 1) ? 1 : os.cpus().length - 2)
    .argv;

var config = new EventEmitter();

config.file = (argv.config && argv.config != null && (typeof argv.config == "string")) ? sanitize(argv.config.toLowerCase()).trim() : null;

if (!config.file) {
	error("ERROR! Please set an environment by loading a configuration file with --config");
}

var parsedConfiguration;
try {
	parsedConfiguration = fs.readFileSync(config.file, 'utf-8');
	try {
		parsedConfiguration = JSON.parse(parsedConfiguration);
	} catch (jsonError) {
		error("Error. Can't parse the configuration file \"" + config.file + "\". Invalid JSON.");
	}
} catch (err) {
	error("Error. Can't find the configuration file \"" + config.file + "\". Invalid file path.");
}

// Load version 
var parsedPackage;
try {
	var packagePath = __dirname + "/../package.json";
	parsedPackage = fs.readFileSync(packagePath, 'utf-8');
	try {
		parsedPackage = JSON.parse(parsedPackage);
	} catch (jsonError) {
		error("Error. Can't parse the package file \"" + packagePath + "\". Invalid JSON.");
	}
} catch (err) {
	error("Error. Can't find the package file \"" + packagePath + "\". Invalid file path.");
}

config.version=parsedPackage.version;
config.env = config.file.match(/[-_\w]+[.][\w]+$/i)[0].split("\.")[0];
process.env.NODE_ENV = config.env;
config.port = parsedConfiguration.port;
config.workers = (argv.workers > 0) ? argv.workers : os.cpus().length - 1; // Free one CPU for OS
config.hostname = os.hostname();

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
	config.ip = add;
	config.emit("completed");
});

module.exports = config;

function error(message) {
	console.error(message);
	process.exit(1);
}