define('Controls/Input/Text',
   [
      'Core/IoC',
      'Controls/Input/Base',
      'WS.Data/Type/descriptor',
      'Controls/Input/Text/ViewModel'
   ],
   function(IoC, Base, descriptor, ViewModel) {
      'use strict';

      /**
       * Controls that allows user to enter single-line text.
       * <a href="/materials/demo-ws4-input">Demo examples.</a>.
       *
       * @class Controls/Input/Text
       * @extends Core/Control
       *
       * @mixes Controls/Input/interface/IInputTag
       * @mixes Controls/Input/interface/IInputText
       * @mixes Controls/Input/interface/IPaste
       * @mixes Controls/Input/interface/IInputBase
       * @mixes Controls/Input/interface/IInputPlaceholder
       * @mixes Controls/Input/resources/InputRender/InputRenderStyles
       *
       * @public
       * @demo Controls-demo/Input/Text/TextPG
       *
       * @author Колесова П.С.
       */


      /**
       * @name Controls/Input/Text#maxLength
       * @cfg {Number} Maximum number of characters that can be entered in the field.
       * @remark
       * If user tries to enter text longer than the value of maxLength, control will prevent input.
       * @example
       * In this example, only 20 characters can be entered in the field.
       * <pre>
       *    <Controls.Input.Text maxLength="{{20}}"/>
       * </pre>
       */

      /**
       * @name Controls/Input/Text#trim
       * @cfg {Boolean} Determines whether the field value should be trimmed when input is completed.
       * @default false
       * @remark
       * String is trimmed only when input is completed.
       * If you bind control's state to the value in the field, the state will contain spaces when user types, and will be trimmed only when input is completed.
       * true - removes whitespaces from both ends of the string when input is completed.
       * false - does not do anything.
       * @example
       * In this example, extra spaces with both side will be trimmed when the focus leaves the text box.
       * <pre>
       *    <Controls.Input.Text trim="{{true}}" bind:value="_fieldValue" on:inputCompleted="_inputCompletedHandler()"/>
       * </pre>
       *
       * <pre>
       *    Control.extend({
       *       ...
       *       _fieldValue: '',
       *
       *       _inputCompletedHandler(value) {
       *          // When event fires, both value and _fieldValue will contain trimmed field value
       *       }
       *       ...
       *    });
       * </pre>
       * @see Controls/Input/interface/IInputText#inputCompleted
       */

      /**
       * @name  Controls/Input/Text#constraint
       * @cfg {String} Regular expression for input filtration.
       * @remark
       * This regular expression is applied to every character that user enters. If entered character doesn't match regular expression, it is not added to the field. When user pastes a value with multiple characters to the field, we check the value characters by characters, and only add the characters that pass regular expression. For example, if you try to paste "1ab2cd" to the field with constraint "[0-9]", only "12" will be inserted in the field.
       * @example
       * In this example, the user will be able to enter only numbers in the field.
       * <pre>
       *    <Controls.Input.Text constraint="[0-9]"/>
       * </pre>
       */

      var _private = {
         validateConstraint: function(constraint) {
            if (constraint && !/^\[.+?\]$/.test(constraint)) {
               IoC.resolve('ILogger').error('Controls/Input/Text', 'The constraint options are not set correctly. More on https://wi.sbis.ru/docs/js/Controls/Input/Text/options/constraint/');
               return false;
            }

            return true;
         }
      };

      var Text = Base.extend({
         _getViewModelOptions: function(options) {
            return {
               maxLength: options.maxLength,
               constraint: options.constraint
            };
         },

         _getViewModelConstructor: function() {
            return ViewModel;
         },

         _changeHandler: function() {
            if (this._options.trim) {
               var trimmedValue = this._viewModel.displayValue.trim();

               if (trimmedValue !== this._viewModel.displayValue) {
                  this._viewModel.displayValue = trimmedValue;
                  this._notifyValueChanged();
               }
            }

            Text.superclass._changeHandler.apply(this, arguments);
         },

         _beforeMount: function(options) {
            Text.superclass._beforeMount.apply(this, arguments);

            _private.validateConstraint(options.constraint);
         },

         _beforeUpdate: function(newOptions) {
            Text.superclass._beforeUpdate.apply(this, arguments);

            if (this._options.constraint !== newOptions.constraint) {
               _private.validateConstraint(newOptions.constraint);
            }
         }
      });

      Text.getDefaultOptions = function() {
         var defaultOptions = Base.getDefaultOptions();

         defaultOptions.value = '';
         defaultOptions.trim = false;

         return defaultOptions;
      };

      Text.getOptionTypes = function() {
         var optionTypes = Base.getOptionTypes();

         /**
          * https://online.sbis.ru/opendoc.html?guid=00ca0ce3-d18f-4ceb-b98a-20a5dae21421
          * optionTypes.maxLength = descriptor(Number|null);
          */
         optionTypes.trim = descriptor(Boolean);
         optionTypes.constraint = descriptor(String);

         return optionTypes;
      };

      return Text;
   });
