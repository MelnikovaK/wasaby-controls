require('./lib/isolated').run({saveToFile:true}, {
   wsRoot: 'sbis3-ws/ws/',
   resourceRoot: 'components/',
   nostyle: true,
   globalConfigSupport: false
});

process.on('exit', function(code) {
   code = process.exitCode = 0;
});
