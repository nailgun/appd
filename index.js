#!/usr/bin/env node

var path = require('path'),
    program = require('commander'),
    spawn = require('child_process').spawn,
    format = require('util').format,
    fs = require('fs');

exports.run = function (config) {
    var listener = null;
    var child = null;

    if (config.watchFile) {
        watchFile(config.watchFile, function (err, l) {
            if (err) {
                console.log(err);
            }
            listener = l;
            if (listener) {
                listener.on('change', function () {
                    if (child) {
                        child.kill();
                    }
                });
            }
        });
    }

    var parts = config.cmd.split(/\s+/);
    var cmd = parts[0];
    var args = parts.splice(1);

    startProcess();
    function startProcess() {
        child = spawn(cmd, args, {
            cwd: config.cwd,
            stdio: 'inherit'
        });

        child.on('exit', function (code) {
            child = null;
            console.log(format('process exited with code %s, restarting', code));
            startProcess();
        });
    }
};

function watchFile (filepath, cb) {
    fs.exists(filepath, function (exists) {
        if (!exists) {
            fs.writeFile(filepath, new Buffer(0), function (err) {
                if (err) return cb(err); // TODO
                start();
            });
        } else {
            start();
        }
    });

    function start () {
        cb(null, fs.watch(filepath));
    }
}

function main () {
    program
        .version('1.0.0')
        .parse(process.argv);

    if (program.args.length != 1) {
        program.outputHelp();
        return process.exit(0);
    }

    var configPath = program.args[0];
    configPath = path.resolve(process.cwd(), configPath);
    exports.run(require(configPath));
}

if (require.main === module) {
    main();
}
