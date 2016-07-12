global.define = function(name){
   jsModules[name.replace(/js!/,'')] = '/' + path.relative(baseResources, newPath).replace(/\\/g,'/');
};
var fs = require('fs'),
   path = require('path'),
   jsModules = {},
   baseResources = path.join(__dirname, 'components'),
   dataResources = path.join(__dirname, 'ws-data/WS.Data'),
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
   };

dirWalker(baseResources);
dirWalker(dataResources);

fs.writeFileSync(path.join(__dirname, 'components/contents.json'), JSON.stringify({jsModules: jsModules}, null, 3));
fs.writeFileSync(path.join(__dirname, 'components/contents.js'), 'contents = ' + JSON.stringify({jsModules: jsModules}, null, 3) + ';');



