define('Controls/Input/Number',
   [
      'Core/IoC',
      'Controls/Input/Base',
      'Types/entity',
      'Controls/Input/Number/ViewModel'
   ],
   function(IoC, Base, entity, ViewModel) {
      'use strict';

      /**
       * Controls that allows user to enter single-line number.
       * <a href="/materials/demo-ws4-input">Demo example.</a>.
       *
       * @class Controls/Input/Number
       * @extends Core/Control
       *
       * @mixes Controls/Input/interface/IInputTag
       * @mixes Controls/Input/interface/IPaste
       * @mixes Controls/Input/interface/IInputBase
       * @mixes Controls/Input/interface/IInputNumber
       * @mixes Controls/Input/interface/IInputPlaceholder
       * @mixes Controls/Input/resources/InputRender/InputRenderStyles
       *
       * @public
       * @demo Controls-demo/Input/Number/NumberPG
       *
       * @author Колесова П.С.
       */

      /**
       * @name Controls/Input/Number#precision
       * @cfg {Number} Number of characters in decimal part.
       * @remark
       * If the fractional part is not fully filled, the missing signs will be replaced by 0.
       * When the value is not set, the number of signs is unlimited.
       * @example
       * In this example you the _inputValue state of the control will store a number with a fractional part of equal 2 signs.
       * <pre>
       *    <Controls.Input.Number bind:value="_inputValue" precision="{{2}}"/>
       * </pre>
       */

      /**
       * @name Controls/Input/Number#onlyPositive
       * @cfg {Boolean} Determines whether only positive numbers can be entered in the field.
       * @default false
       * @remark
       * true - only positive numbers can be entered in the field.
       * false - positive and negative numbers can be entered in the field.
       * @example
       * In this example you _inputValue in the control state will store only a positive number.
       * <pre>
       *    <Controls.Input.Number bind:value="_inputValue" onlyPositive="{{true}}"/>
       * </pre>
       */

      /**
       * @name Controls/Input/Number#integersLength
       * @cfg {Number} Maximum integer part length.
       * @remark
       * When the value is not set, the integer part length is unlimited.
       * @example
       * In this example you the _inputValue in the control state will store a number with a integer part of no more than 10 signs.
       * <pre>
       *    <Controls.Input.Number bind:value="_inputValue" integersLength="{{10}}"/>
       * </pre>
       */

      /**
       * @name Controls/Input/Number#showEmptyDecimals
       * @cfg {Boolean} Determines whether trailing zeros are shown in the fractional part.
       * @default false
       * @remark
       * The option is applied after the completed of the input.
       * true - trailing zeros are hidden in the fractional part.
       * false - trailing zeros are shown in the fractional part.
       * @example
       * In this example you the _inputValue in the control state will store a number with a trailing  zeros in the fractional part.
       * <pre>
       *    <Controls.Input.Number bind:value="_inputValue" showEmptyDecimals="{{true}}"/>
       * </pre>
       */

      /**
       * @name Controls/Input/Number#delimiters
       * @cfg {Boolean} Determines whether the number should be split into triads.
       * @default true
       * @remark
       * true - the number split into triads.
       * false - does not do anything.
       */

      var _private = {
         validateOptions: function(options) {
            if (options.integersLength <= 0) {
               IoC.resolve('ILogger').error('Number', 'Incorrect integers length: ' + options.integersLength + '. Integers length must be greater than 0.');
            }
         }
      };

      var NumberInput = Base.extend({
         _getViewModelOptions: function(options) {
            _private.validateOptions(options);

            return {
               precision: options.precision,
               delimiters: options.delimiters,
               onlyPositive: options.onlyPositive,
               integersLength: options.integersLength,
               showEmptyDecimals: options.showEmptyDecimals
            };
         },

         _getViewModelConstructor: function() {
            return ViewModel;
         },

         _changeHandler: function() {
            if (this._viewModel.trimTrailingZeros(true)) {
               this._notifyValueChanged();
            }

            NumberInput.superclass._changeHandler.apply(this, arguments);
         },

         _focusInHandler: function() {
            if (this._viewModel.addTrailingZero()) {
               this._notifyValueChanged();
            }

            NumberInput.superclass._focusInHandler.apply(this, arguments);
         },

         _focusOutHandler: function() {
            if (this._viewModel.trimTrailingZeros(false)) {
               this._notifyValueChanged();
            }

            NumberInput.superclass._focusOutHandler.apply(this, arguments);
         }
      });

      NumberInput.getDefaultOptions = function() {
         var defaultOptions = Base.getDefaultOptions();

         defaultOptions.value = 0;
         defaultOptions.delimiters = true;
         defaultOptions.onlyPositive = false;
         defaultOptions.showEmptyDecimals = false;

         return defaultOptions;
      };

      NumberInput.getOptionTypes = function() {
         var optionTypes = Base.getOptionTypes();

         /**
          * https://online.sbis.ru/opendoc.html?guid=00ca0ce3-d18f-4ceb-b98a-20a5dae21421
          * optionTypes.value = descriptor(Number|null);
          * optionTypes.precision = descriptor(Number|null);
          * optionTypes.integersLength = descriptor(Number|null);
          */
         delete optionTypes.value;

         optionTypes.delimiters = entity.descriptor(Boolean);
         optionTypes.onlyPositive = entity.descriptor(Boolean);
         optionTypes.showEmptyDecimals = entity.descriptor(Boolean);

         return optionTypes;
      };

      return NumberInput;
   });
