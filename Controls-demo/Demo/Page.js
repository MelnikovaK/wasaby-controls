/**
 * Created by as.krasilnikov on 26.02.2018.
 */
define('Controls-demo/Demo/Page',
   [
      'Core/Control',
      'Core/Deferred',
      'tmpl!Controls-demo/Demo/Page',
      'Controls/Application/AppData',
      'css',
      'css!Controls-demo/Demo/Page',
      'Controls/Application',
   ],
   function (Control, Deferred, template, AppData,  cssPlugin) {
      'use strict';

      var UrlParams = (function () {
         var data = {};
         if (document.location.search) {
            var pair = (document.location.search.substr(1)).split('&');
            for (var i = 0; i < pair.length; i++) {
               var param = pair[i].split('=');
               data[param[0]] = param[1];
            }
         }
         return data;
      })(),
      themeLinks = {
         carry: '/../components/themes/carry/carry',
         presto:  '/../components/themes/presto/presto',
         carry_m: '/../components/themes/carry_medium/carry_medium',
         presto_m: '/../components/themes/presto_medium/presto_medium',
         online: '/../pages/presto/online'
      },
      setCurrentThemeLinks = function (theme) {
         var createCSSLink = function (id, href) {
            var cssLink = document.createElement('link'),
               headDOMElement = document.getElementsByTagName('head')[0],
               element = document.getElementById(id),
               onLoadHandler = function(){
                  element.setAttribute("disabled", true);
                  element.setAttribute("id", '');
                  cssLink.removeEventListener('load',onLoadHandler);
               };
            cssLink.id = id;
            cssLink.href = href + '.css';
            cssLink.rel='stylesheet';
            cssLink.type='text/css';
            if (element) {
               if (cssLink.href === element.href) {
                  /*стиль актуальный, не обновляем*/
                  return;
               } else {
                  cssLink.addEventListener('load', onLoadHandler);
                  headDOMElement.appendChild(cssLink);
               }
            } else {
               headDOMElement.appendChild(cssLink);
            }
         };
         createCSSLink('controlsThemeStyle', theme);
         $('link').each(function(index, elem) {
            if (~elem.href.indexOf('components') && !~elem.href.indexOf('components/themes')&& !~elem.href.indexOf('pages/presto/')) {
               elem.setAttribute("disabled", true);
            }
         });
      },
      old_load = cssPlugin.load;

      //хитрю с css плагином для демок
      if (UrlParams.theme) {
         cssPlugin.load = function(name, require, load){
            if (name.indexOf('SBIS3.CONTROLS.Demo') === -1 &&  (name.indexOf('SBIS3.CONTROLS') !== -1 || name.indexOf('Controls/') !== -1))     {
               load(null); return;
            } else {
               old_load.apply(this, arguments)
            }
         };
      }

      var DemoPage = Control.extend({
         _template: template,
         _theme: null,
         componentName: 'Controls-demo/Index',
         _beforeMount: function () {
            var deferred = new Deferred();
             if (UrlParams.cname) {
               this.componentName = 'Controls-demo/' + UrlParams.cname;
            }
            this._theme = themeLinks[UrlParams['theme']] || themeLinks['online'];
            requirejs([this.componentName], deferred.callback.bind(deferred));
            return deferred;
         },
         changeTheme: function(event, theme) {
            var
               newLocation = ~window.location.href.indexOf('theme') ?
                  window.location.href.replace(/theme=(.*)($|&)/, 'theme=' + theme) :
                  window.location.href + '&theme=' + theme;
            setCurrentThemeLinks(themeLinks[theme]);
            window.history.replaceState({},"", newLocation);
         },

         backClickHdl: function () {
            window.location.href = window.location.origin + '/Controls-demo/demo.html'
         },
         constructor: function(cfg){
            DemoPage.superclass.constructor.apply(this, arguments);
            this.ctxData = new AppData(cfg);
         },
         _getChildContext: function () {
            return {
               AppData: this.ctxData
            };
         }
      });

      return DemoPage;
   }
);