/**
 * Created by kraynovdo on 25.01.2018.
 */
define('Controls-demo/Index', [
   'Core/Control',
   'wml!Controls-demo/Index',
   'Application/Initializer',
   'Application/Env',
   'Core/Deferred',
   'css!Controls-demo/Demo/Page',
   'css!Controls-theme/themes/default/helpers/AreaBlocks'
], function (BaseControl,
             template,
             AppInit,
             AppEnv,
             Deferred
) {
   'use strict';

   var ModuleClass = BaseControl.extend(
      {
         _template: template,
         backClickHdl: function() {
            window.history.back();
         },
         changeTheme: function(event, theme) {
            this._notify('themeChanged', [theme], { bubbling: true });
         },
         _beforeMount: function() {
            this._title = this._getTitle();
            this._settigsController = {
               getSettings: function(ids) {
                  var storage = {};
                  storage[ids[0]] = 1000;
                  if (ids[0] === 'master111') {
                     storage[ids[0]] = 300;
                  }
                  return (new Deferred()).callback(storage);
               },
               setSettings: function(settings) {
                  //'Сохранили панель с шириной ' + settings['123']
                  //'Сохранили masterDetail с шириной ' + settings['master111']
               }
            };
         },
         _getTitle: function() {
            var location = this._getLocation();
            if (location) {
               var splitter = '%2F';
               var index = location.pathname.lastIndexOf(splitter);
               if (index > -1) {
                  var splittedName = location.pathname.slice(index + splitter.length)
                     .split('/');
                  var controlName = splittedName[0];
                  return this._replaceLastChar(controlName);
               }
            }
            return 'Wasaby';
         },
         _replaceLastChar: function(controlName) {
            if (controlName[controlName.length - 1] === '/') {
               return controlName.slice(0, -1);
            }
            return controlName;
         },
         _getLocation: function() {
            if (AppInit.isInit()) {
               return AppEnv.location;
            } if (typeof window !== 'undefined') {
               return window.location;
            }
            return null;
         }
      }
   );

   return ModuleClass;
});
