define('Controls/Input/resources/InputRender/InputRender',
   [
      'Core/Control',

      /*'WS.Data/Type/descriptor',*/
      'tmpl!Controls/Input/resources/InputRender/InputRender',
      'Controls/Input/resources/RenderHelper',

      'css!Controls/Input/resources/InputRender/InputRender'
   ],
   function(Control, /*types,*/ template, RenderHelper) {

      'use strict';

      /**
       * @class Controls.Input.resources.InputRender.InputRender
       * @extends Core/Control
       * @mixes Controls/Input/resources/InputRender/InputRenderDocs
       * @control
       * @private
       * @category Input
       * @author Баранов М.А.
       */

      var _private = {

         getSelection: function(self) {
            var
               result = self._selection,
               val = self._options.viewModel.getDisplayValue();

            //Если курсор ещё не был поставлен в поле, то поставим его в конец
            if (!result) {
               result = {
                  selectionStart: val ? val.length : 0,
                  selectionEnd: val ? val.length : 0
               };
            }

            return result;
         },

         getTargetPosition: function(target) {
            return target.selectionEnd;
         },

         saveSelection: function(self, target) {
            self._selection = _private.getSelection(self);
            self._selection.selectionStart = target.selectionStart;
            self._selection.selectionEnd = target.selectionEnd;
         },

         setTargetData: function(target, data) {
            target.value = data.value;
            target.setSelectionRange(data.position, data.position);
         }

      };

      var InputRender = Control.extend({
         
         _template: template,

         _inputHandler: function(e) {
            var
               value = this._options.viewModel.getDisplayValue(),
               newValue = e.target.value,
               selection = _private.getSelection(this),
               position = _private.getTargetPosition(e.target),
               inputType, splitValue, processedData;

            /**
             * У android есть баг/фича: при включённом spellcheck удаление последнего символа в textarea возвращает
             * inputType == 'insertCompositionText', вместо 'deleteContentBackward'.
             * Соответственно доверять ему мы не можем и нужно вызвать метод RenderHelper.getInputType
             */
            inputType = e.nativeEvent.inputType && e.nativeEvent.inputType !== 'insertCompositionText'
               ? RenderHelper.getAdaptiveInputType(e.nativeEvent.inputType, selection)
               : RenderHelper.getInputType(value, newValue, position, selection);

            //Подготавливаем объект с разобранным значением
            splitValue = RenderHelper.getSplitInputValue(value, newValue, position, selection, inputType);

            //
            processedData = this._options.viewModel.handleInput(splitValue, inputType);

            _private.setTargetData(e.target, processedData);
            _private.saveSelection(this, e.target);

            this._notify('valueChanged', [this._options.viewModel.getValue()]);
         },

         _keyUpHandler: function(e) {
            var keyCode = e.nativeEvent.keyCode;

            // При нажатии стрелок происходит смещение курсора.
            if (keyCode > 36 && keyCode < 41) {
               _private.saveSelection(this, e.target);
            }
         },

         _clickHandler: function(e) {
            _private.saveSelection(this, e.target);
         },

         _selectionHandler: function(e) {
            _private.saveSelection(this, e.target);
         },

         _inputCompletedHandler: function(e) {
            this._notify('inputCompleted', [this._options.viewModel.getValue()]);
         },

         _notifyHandler: function(e, value) {
            this._notify(value);
         },

         _getInputState: function() {
            var
               result;

            if (this._options.validationErrors && this._options.validationErrors.length) {
               result = 'error';
            } else if (this.isEnabled()) {
               result = 'default';
            } else {
               result = 'disabled';
            }

            return result;
         },

         _focusinHandler: function(e) {
            if (this.isEnabled() && this._options.selectOnClick) {
               e.target.select();
            }
         },

         /**
          * Метод вставляет строку text вместо текущего выделенного текста в инпуте
          * Если текст не выделен, то просто вставит text на позицию каретки
          * @param text
          * @param selectionStart
          * @param selectionEnd
          * @returns {Number} позиция каретки.
          */
         paste: function(text, selectionStart, selectionEnd) {
            var
               displayValue = this._options.viewModel.getDisplayValue(),
               processedData = this._options.viewModel.handleInput({
                  before: displayValue.slice(0, selectionStart),
                  insert: text,
                  after: displayValue.slice(selectionEnd, displayValue.length)
               }, 'insert');

            if (displayValue !== this._options.viewModel.getValue()) {
               this._notify('valueChanged', [this._options.viewModel.getValue()]);
            }

            this._selection = {
               selectionStart: selectionStart + text.length,
               selectionEnd: selectionStart + text.length
            };

            //Возвращаем позицию каретки. Она обрабатывается методом pasteHelper
            return processedData.position;
         }
      });

      InputRender.getDefaultOptions = function() {
         return {
            value: '',
            selectOnClick: false,
            style: 'default',
            inputType: 'Text',
            autocomplete: true
         };
      };

      //TODO расскоментировать этот блок + зависимость types когда полечат https://online.sbis.ru/opendoc.html?guid=1416c4da-b0e0-402b-9e02-a3885dc6cdb8
      /*InputRender.getOptionTypes = function() {
         return {
            value: types(String),
            selectOnClick: types(Boolean),
            prepareValue: types(Function).required(),
            tagStyle: types(String).oneOf([
               'primary',
               'done',
               'attention',
               'error',
               'info'
            ]),
            autocomplete: types(Boolean)
         };
      };*/

      return InputRender;
   }
);
