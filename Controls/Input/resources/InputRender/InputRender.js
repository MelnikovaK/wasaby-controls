define('js!Controls/Input/resources/InputRender/InputRender',
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
       * @control
       * @private
       * @category Input
       * @author Журавлев Максим Сергеевич
       */

      var _private = {

         getSelection: function(self){
            var
               result = self._selection;

            //Если курсор ещё не был поставлен в поле, то поставим его в конец
            if (!result) {
               result = {
                  selectionStart: self._options.value ? self._options.value.length : 0,
                  selectionEnd: self._options.value ? self._options.value.length : 0
               };
            }

            return result;
         },

         getTargetPosition: function(target){
            return target.selectionEnd;
         },

         saveSelection: function(self, target){
            self._selection = _private.getSelection(self);
            self._selection.selectionStart = target.selectionStart;
            self._selection.selectionEnd = target.selectionEnd;
         },

         setTargetData: function(target, data){
            target.value = data.value;
            target.setSelectionRange(data.position, data.position);
         }

      };

      var InputRender = Control.extend({
         
         _controlName: 'Controls/Input/resources/InputRender/InputRender',
         _template: template,

         _inputHandler: function(e) {
            var
               value = this._options.value,
               newValue = e.target.value,
               selection = _private.getSelection(this),
               position = _private.getTargetPosition(e.target),
               inputType, splitValue, processedData;

            inputType = e.nativeEvent.inputType ?
                  RenderHelper.getAdaptiveInputType(e.nativeEvent.inputType, selection) :
                  RenderHelper.getInputType(value, newValue, position, selection);
            //Подготавливаем объект с разобранным значением
            splitValue = RenderHelper.getSplitInputValue(value, newValue, position, selection, inputType);

            //
            processedData = this._options.viewModel.prepareData(splitValue, inputType);

            _private.setTargetData(e.target, processedData);
            _private.saveSelection(this, e.target);

            this._notify('valueChanged', processedData.value);
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

         _selectionHandler: function(e){
            _private.saveSelection(this, e.target);
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

         _focusHandler: function(e) {
            if (this._options.selectOnClick) {
               e.target.select();
            }
         },

         /**
          * Метод вставляет строку text вместо текущего выделенного текста в инпуте
          * Если текст не выделен, то просто вставит text на позицию каретки
          * @param text
          * @returns {Number} позиция каретки.
          */
         paste: function(text) {
            var
               selection = _private.getSelection(this),
               processedData = this._options.viewModel.prepareData({
                  before: this._options.value.slice(0, selection.selectionStart),
                  insert: text,
                  after: this._options.value.slice(selection.selectionEnd, this._options.value.length)
               }, 'insert');

            if (this._options.value !== processedData.value) {
               this._notify('valueChanged', processedData.value);
               this._forceUpdate();
            }

            //Возвращаем позицию каретки. Она обрабатывается методом pasteHelper
            return selection.selectionEnd;
         }
      });

      InputRender.getDefaultOptions = function() {
         return {
            value: '',
            selectOnClick: false
         };
      };

      //TODO расскоментировать этот блок + зависимость types когда полечат https://online.sbis.ru/opendoc.html?guid=e53e46a0-9478-4026-b7d1-75cc5ac0398b
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
            ])
         };
      };*/

      return InputRender;
   }
);