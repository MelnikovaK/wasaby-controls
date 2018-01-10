define('js!Controls/Input/Password',
    [
        'Core/Control',
        'tmpl!Controls/Input/Password/Password',
        'WS.Data/Type/descriptor',
       'Controls/Input/resources/InputRender/SimpleViewModel',

        'css!Controls/Input/Password/Password'
    ],

function(Control, template, types, SimpleViewModel) {

   /**
    * Поле ввода пароля.
    * @class Controls/Input/Password
    * @extends Controls/Control
    * @mixes Controls/Input/interface/IInputText
    * @mixes Controls/Input/interface/IInputPlaceholder
    * @mixes Controls/Input/interface/IValidation
    * @mixes Controls/Input/interface/IInputTag
    * @control
    * @public
    * @category Input
    * @author Золотова Э.Е.
    */

    'use strict';

    var PasswordInput = Control.extend({
        _template: template,
        _passwordVisible: false,

        constructor: function (options) {
           PasswordInput.superclass.constructor.apply(this, arguments);
           this._simpleViewModel = new SimpleViewModel();
        },

        _toggleVisibilityHandler: function() {
            this._passwordVisible = !this._passwordVisible;
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