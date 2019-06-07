import Controller = require('Controls/_validate/Controller');
import template = require('wml!Controls/_validate/Input');
/**
 * The control that regulates the validation of his content. Uses with input fields.
 * @class Controls/_validate/Input
 * @extends Controls/_validate/Controller
 * @control
 * @public
 * @author Красильников А.С.
 */

      export = Controller.extend({
         _template: template,
         _currentValue: undefined,
         _deactivatedHandler: function() {
            if (!this._options.readOnly) {
               this._shouldValidate = true;
               this._forceUpdate();
            }
         },
         _valueChangedHandler: function(event, value, displayValue) {
            if (this._currentValue !== value) {
               this._currentValue = value;
               this._notify('valueChanged', [value]);
               this._cleanValid();
            }
         },
         _inputCompletedHandler: function(event, value) {
            this._notify('inputCompleted', [value]);
         },
         _afterUpdate: function(oldOptions) {
            if (this._shouldValidate || this._options.value !== oldOptions.value) {
               this._shouldValidate = false;
               this.validate();
            }
         }
      });
