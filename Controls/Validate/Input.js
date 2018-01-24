define('!Controls/Validate/Input',
   [
      'Controls/Validate/Controller',
      'tmpl!Controls/Validate/Input'
   ],
   function(
      Controller,
      template
   ){
      'use strict';

      var Validate = Controller.extend({
         _template: template,
         _focusOutHandler: function () {
            this._shouldValidate = true;
            this._forceUpdate();
         },
         _cleanValid: function () {
            this.setValidationResult(null);
         },
         _afterUpdate: function() {
            if (this._shouldValidate) {
               this._shouldValidate = false;
               this.validate();
            }
         },
      });
      return Validate;
   }
);