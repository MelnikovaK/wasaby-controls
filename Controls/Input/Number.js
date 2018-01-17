define('js!Controls/Input/Number', [
   'Core/Control',
   'tmpl!Controls/Input/Number/Number',
   'WS.Data/Type/descriptor',
   'Controls/Input/Number/ViewModel',
   'Controls/Input/resources/InputHelper',

   'js!Controls/Input/resources/InputRender/InputRender',
   'tmpl!Controls/Input/resources/input'
], function (Control,
             template,
             types,
             NumberViewModel,
             inputHelper) {

   'use strict';
   var
      _private,
      NumberInput;

   _private = {
   };

   NumberInput = Control.extend({
      /**
       * Поле ввода числа.
       * @class Controls/Input/Number
       * @extends Controls/Control
       * @mixes Controls/Input/interface/IInputNumber
       * @mixes Controls/Input/interface/IInputPlaceholder
       * @mixes Controls/Input/interface/IValidation
       * @mixes Controls/Input/interface/IInputTag
       * @control
       * @public
       * @category Input
       */

      /**
       * @name Controls/Input/Number#precision
       * @cfg {Number} Количество знаков после запятой
       */

      /**
       * @name Controls/Input/Number#onlyPositive
       * @cfg {Boolean} Ввод только положительных чисел
       */

      /**
       * @name Controls/Input/Number#integersLength
       * @cfg {Number} Количество знаков до запятой
       */

      /**
       * @name Controls/Input/Number#showEmptyDecimals
       * @cfg {Boolean} Показывать нулевую дробную часть
       */

      _template: template,

      constructor: function (options) {
         NumberInput.superclass.constructor.apply(this, arguments);


         //Вьюмодель для намбера. Нужно связать с конфигом
         this._numberViewModel = new NumberViewModel({
            onlyPositive: options.onlyPositive,
            integersLength: options.integersLength,
            precision: options.precision
         });
      },

      _inputCompletedHandler: function () {
         var
            tmp = this._options.value.split('.'),
            integers = tmp[0],
            decimals = tmp[1];

         //Если дробная часть пустая или нулевая, то нужно убрать её
         if (!parseInt(decimals, 10)) {
            this._notify('inputCompleted', integers);
         } else {
            this._notify('inputCompleted', this._options.value);
         }
      },

      _notifyHandler: function (event, value) {
         this._notify(value);
      },

      paste: function(text) {
         inputHelper.pasteHelper(this._children['inputRender'], this._children['input'], text);
      }
   });

   NumberInput.getOptionTypes = function () {
      return {
         precision: types(Number), //Точность (кол-во знаков после запятой)
         integersLength: types(Number), //Длина целой части
         onlyPositive: types(Boolean) //Только положительные значения
      };
   };

   return NumberInput;
});