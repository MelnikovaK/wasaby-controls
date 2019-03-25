import BaseViewModel = require('Controls/_input/Base/ViewModel');
import Formatter = require('Controls/_input/Mask/Formatter');
import MaskBuilder = require('Controls/_input/Phone/MaskBuilder');
import FormatBuilder = require('Controls/_input/Mask/FormatBuilder');
import InputProcessor = require('Controls/_input/Mask/InputProcessor');
      

      /**
       * @class Controls/_input/Text/ViewModel
       * @private
       * @author Миронов А.Ю.
       */

      var _private = {
         REPLACER: '',

         FORMAT_MASK_CHARS: {
            'd': '[0-9]',
            '+': '[+]'
         },

         updateFormat: function(self, value) {
            var mask = MaskBuilder.getMask(value);

            self._format = FormatBuilder.getFormat(mask, _private.FORMAT_MASK_CHARS, _private.REPLACER);
         },

         prepareData: function(result) {
            var position = result.position;

            return {
               before: result.value.substring(0, position),
               after: result.value.substring(position, result.value.length),
               insert: '',
               delete: ''
            };
         }
      };

      var ViewModel = BaseViewModel.extend({
         _format: null,

         _convertToValue: function(displayValue) {
            _private.updateFormat(this, displayValue);

            return Formatter.getClearData(this._format, displayValue).value;
         },

         _convertToDisplayValue: function(value) {
            var stringValue = value === null ? '' : value;

            _private.updateFormat(this, stringValue);

            return Formatter.getFormatterData(this._format, {
               value: stringValue,
               position: 0
            }).value;
         },

         handleInput: function(splitValue, inputType) {
            var newMask = MaskBuilder.getMask(splitValue.before + splitValue.insert + splitValue.after);
            var newFormat = FormatBuilder.getFormat(newMask, _private.FORMAT_MASK_CHARS, _private.REPLACER);
            var result = InputProcessor.input(splitValue, inputType, _private.REPLACER, this._format, newFormat);

            return ViewModel.superclass.handleInput.call(this, _private.prepareData(result), inputType);
         },

         isFilled: function() {
            var value = this._value === null ? '' : this._value;
            var mask = MaskBuilder.getMask(value);
            var keysRegExp = new RegExp('[' + Object.keys(_private.FORMAT_MASK_CHARS).join('|') + ']', 'g');
            var maskOfKeys = mask.match(keysRegExp);

            return value.length === maskOfKeys.length;
         },

         moveCarriageToEnd: function() {
            this.selection = this.displayValue.length;

            this._shouldBeChanged = true;
         }
      });

      export = ViewModel;
   
