var config = require('./config');

require('./lib/unit-isolated').run(config, {
    WSRootPath: 'sbis3-ws/ws/',
    wsRoot: 'sbis3-ws/ws/',
    WSTheme: 'wi_scheme',
    resourceRoot: 'components/',
    nostyle: true,
    globalConfigSupport: false
});