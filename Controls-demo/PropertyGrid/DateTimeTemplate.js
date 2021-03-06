define('Controls-demo/PropertyGrid/DateTimeTemplate',
   [
      'Core/Control',
      'wml!Controls-demo/PropertyGrid/DateTimeTemplate',
      'css!Controls-demo/Input/resources/VdomInputs'
   ],
   function(Control, template) {
      'use strict';

      var numberTmpl = Control.extend({
         _template: template,
         _valueChangedHandler: function(event, tmp) {
            this._notify('valueChanged', [tmp]);
         }
      });


      return numberTmpl;
   });
