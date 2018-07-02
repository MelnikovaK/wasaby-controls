define('Controls/Popup/Previewer/OpenerTemplate',
   [
      'Core/Control',
      'Core/Deferred',
      'tmpl!Controls/Popup/Previewer/OpenerTemplate',

      'Controls/Container/Async'
   ],
   function(Control, Deferred, template) {

      'use strict';

      var OpenerTemplate = Control.extend({
         _template: template,

         _sendResult: function(event) {
            this._notify('sendResult', [event], {bubbling: true});
         }
      });

      return OpenerTemplate;
   }
);
