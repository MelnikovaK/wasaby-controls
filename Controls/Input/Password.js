define('Controls/Input/Password',
   [
      'Core/Control',
      'tmpl!Controls/Input/Password/Password',
      'WS.Data/Type/descriptor',
      'Controls/Input/resources/InputRender/BaseViewModel',

      'css!Controls/Input/Password/Password'
   ],

   function(Control, template, types, BaseViewModel) {

   /**
    * Password input.
    *
    * @class Controls/Input/Password
    * @extends Core/Control
    * @mixes Controls/Input/interface/IInputText
    * @mixes Controls/Input/interface/IInputPlaceholder
    * @mixes Controls/Input/interface/IValidation
    * @mixes Controls/Input/interface/IInputTag
    * @mixes Controls/Input/PasswordDocs
    * @control
    * @public
    * @category Input
    * @author Золотова Э.Е.
    */

      'use strict';

      var PasswordInput = Control.extend({
         _template: template,
         _passwordVisible: false,

         constructor: function(options) {
            PasswordInput.superclass.constructor.apply(this, arguments);
            this._simpleViewModel = new BaseViewModel({
               value: options.value
            });
         },

         _beforeUpdate: function() {
            this._simpleViewModel.updateOptions({
               value: this._options.value
            });
         },

         _toggleVisibilityHandler: function() {
            this._passwordVisible = !this._passwordVisible;
         },

         _valueChangedHandler: function(e, value) {
            this._notify('valueChanged', [value]);
         }

      });

      PasswordInput.getOptionTypes = function getOptionsTypes() {
         return {
            placeholder: types(String)
         };
      };

      PasswordInput.getDefaultOptions = function getDefaultOptions() {
         return {
            placeholder: rk('Пароль')
         };
      };

      return PasswordInput;
   });
