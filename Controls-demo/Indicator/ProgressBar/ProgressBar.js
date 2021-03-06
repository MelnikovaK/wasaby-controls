define('Controls-demo/Indicator/ProgressBar/ProgressBar',
   [
      'Core/Control',
      'wml!Controls-demo/Indicator/ProgressBar/ProgressBar',
      'json!Controls-demo/PropertyGrid/pgtext',

      'css!Controls-demo/Wrapper/Wrapper',
      'css!Controls-demo/Indicator/ProgressBar/ProgressBar'
   ],

   function(Control, template, config) {
      'use strict';
      return Control.extend({
         _template: template,
         _metaData: null,
         _content: 'Controls/progress:Bar',
         _dataObject: null,
         _componentOptions: null,
         _beforeMount: function() {
            this._dataObject = {
               value: {
                  precision: 0
               },
               name: {
                  readOnly: true
               }
            };
            this._componentOptions = {
               value: 30,
               name: 'ProgressBar'
            };
            this._metaData = config[this._content].properties['ws-config'].options;
         }
      });
   });
