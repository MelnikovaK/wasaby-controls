global.define = function(name){
   jsModules[name.replace(/js!/,'')] = '/' + path.relative(baseResources, newPath).replace(/\\/g,'/');
};
var fs = require('fs'),
   path = require('path'),
   jsModules = {},
   baseResources = path.join(__dirname, 'components'),
   demoResources = path.join(__dirname, 'demo'),
   testResources = path.join(__dirname, 'tests'),
   wsResources = path.join(__dirname, 'sbis3-ws'),
   sandBoxResources = path.join(__dirname, 'pages', 'sandbox'),
   vdomCtrlResources = path.join(__dirname, 'Controls'),
   newPath = '',
   dirWalker = function(dir) {
      var pattern = /\.module\.js$/,
         files = fs.readdirSync(dir);
      for (var i = 0; i < files.length; i++) {
         newPath = path.join(dir, files[i]);
         if (fs.statSync(newPath).isDirectory()) {
            dirWalker(newPath);
         } else {
            if (pattern.test(files[i])) {
               require(newPath);
            }
         }
      }
   },
    testPathFix = function(key ,path) {
       if(typeof path === 'string' && path.indexOf('/') === 0) {
          return '/components' + path;
       }
       return path;
    };

dirWalker(baseResources);
dirWalker(demoResources);
dirWalker(testResources);
dirWalker(sandBoxResources);
dirWalker(vdomCtrlResources);
dirWalker(wsResources);
var contents = {
   jsModules: jsModules
};
fs.writeFileSync(path.join(__dirname, 'components/contents.json'), JSON.stringify(contents, null, 3));
contents["requirejsPaths"] = {
   "SBIS3.CONTROLS": "~resources",
   "View": "~ws/View"
};
fs.writeFileSync(path.join(__dirname, 'components/contents.js'), 'contents = ' + JSON.stringify(contents, null, 3) + ';');
