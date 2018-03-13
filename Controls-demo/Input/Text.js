define('Controls-demo/Input/Text', [
   'Core/Control',
   'tmpl!Controls-demo/Input/Text',
   'WS.Data/Source/Memory'
], function(Control, template) {

   'use strict';

   var VdomDemoText = Control.extend({
      _template: template,
      _text1: '',
      _placeholder: '',
      _constraint: '',
      _validationErrors: '',
      _validationErrorsValue: false,
      _trim: false,
      _maxLength: '',
      _selectOnClick: false,

      valueChangedHandler: function () {
         if (this._validationErrorsValue){
            this._validationErrors = ['Some error'];
         } else{
            this._validationErrors = null;
         }
      }
   });

   return VdomDemoText;
});
