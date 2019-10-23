define('Controls-demo/FilterView/lookupTemplate',
   [
      'Core/Control',
      'wml!Controls-demo/FilterView/lookupTemplate/lookupTemplate',
      'css!Controls-demo/Dropdown/Dropdown'
   ],

   function(Control, template) {

      'use strict';
      var LookupTemplate = Control.extend({

         _template: template,

         _selectedKeysHandler: function(event, keys) {
            this._notify('selectedKeysChanged', [keys]);
         },

         _textValueHandler: function(event, textValue) {
            this._notify('textValueChanged', [textValue]);
         }

      });

      return LookupTemplate;
   });
