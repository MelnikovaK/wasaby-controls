/**
 * Created by iv.cheremushkin on 28.08.2014.
 */

define('js!SBIS3.CONTROLS.NumberTextBox', [
   "Core/defaultRenders",
   "Core/constants",
   "js!SBIS3.CONTROLS.Utils.NumberTextBoxUtil",
   "js!SBIS3.CONTROLS.TextBox",
   "tmpl!SBIS3.CONTROLS.NumberTextBox/resources/NumberTextBoxArrows",
   'css!SBIS3.CONTROLS.NumberTextBox'
], function ( cDefaultRenders, constants, NumberTextBoxUtil, TextBox, arrowTpl) {


   'use strict';
   /**
    * Поле ввода числа.
    * Можно настроить:
    * <ol>
    *    <li>количество знаков {@link integers в целой части};</li>
    *    <li>количество знаков {@link decimals после запятой};</li>
    *    <li>{@link hideEmptyDecimals прятать ли пустую дробную часть};</li>
    *    <li>запрещение ввода {@link onlyPositive отрицательных чисел};</li>
    *    <li>запрещение ввода {@link onlyInteger дробных чисел};</li>
    *    <li>{@link enableArrows наличие стрелок} для увеличения/уменьшения числа;</li>
    *    <li>{@link text начальное значение}.</li>
    * </ol>
    * @class SBIS3.CONTROLS.NumberTextBox
    * @extends SBIS3.CONTROLS.TextBox
    * @author Роман Валерий Сергеевич
    * @demo SBIS3.CONTROLS.Demo.MyNumberTextBox
    *
    * @ignoreOptions independentContext contextRestriction isContainerInsideParent owner stateKey subcontrol textTransform
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment verticalAlignment
    *
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChanged onChange onReady
    *
    * @cssModifier controls-NumberTextBox__text-align-right Выравнивает содержимое поля ввода по правому краю.
    *
    * @control
    * @public
    * @category Inputs
    * @initial
    * <component data-component='SBIS3.CONTROLS.NumberTextBox'>
    *     <option name="text">0</option>
    * </component>
    */

   function formatText(value, text, onlyInteger, decimals, integers, delimiters, onlyPositive, maxLength, hideEmptyDecimals){
      // Вырезаем переносы строк и теги.
      value = typeof value === 'string' ? value.replace(/\n/gm, '').replace(/<.*?>/g, '') : value;
      var decimals = onlyInteger ? 0 : decimals,
          dotPos = (value = (value + '')).indexOf('.'),
          parsedVal = dotPos != -1 ? '.' + value.substr(dotPos + 1).replace(/[^0-9]/g, '') : '0',
          isDotLast = (value && value.length) ? dotPos === value.length - 1 : false,
          decimalsPart;

      if (value == '-') {
         return value;
      }

      value = cDefaultRenders.numeric(
         value,
         integers,
         delimiters,
         decimals,
         onlyPositive,
         maxLength,
         true
      );
      
      if(isDotLast){
         value = value ? value + '.' : '.';
      }
      if(value && hideEmptyDecimals && decimals){
         dotPos = value.indexOf('.');
         if (parsedVal === '0') {
            value = (dotPos !== -1 ? value.substring(0, dotPos) : value) + '.0';
         } else {
            decimalsPart = decimals == -1 ? parsedVal : parsedVal.substr(0, decimals + 1);
            value = (dotPos !== -1 ? value.substring(0, dotPos) + decimalsPart : value);
         }
      }

      if(!NumberTextBoxUtil.checkMaxLength(value, maxLength)){
         return text;
      }
      return value || '';
   }

   function hideEmptyDecimals(value){
      value = value + '';

      while (value && value.indexOf('.') !== -1 && (value[value.length - 1] == '0' || value[value.length - 1] == '.')) {
         value = value.substr(0, value.length - 1);
      }
      return value;
   }

   var NumberTextBox = TextBox.extend(/** @lends SBIS3.CONTROLS.NumberTextBox.prototype */ {
      $protected: {
         _inputField: null,
         _caretPosition: [0, 0],
         _SHIFT_KEY: false,
         _CTRL_KEY: false,
         _options: {
            afterFieldWrapper: arrowTpl,
            /**
             * @cfg {Boolean} Ввод только положительных чисел
             * Возможные значения:
             * <ul>
             *    <li>true - ввод только положительных чисел;</li>
             *    <li>false - нет ограничения на знак вводимых чисел.</li>
             * </ul>
             * @example
             * <pre>
             *     <option name="onlyPositive">true</option>
             * </pre>
             */
            onlyPositive: false,
            /**
             * @cfg {Boolean} Ввод только целых чисел
             * Возможные значения:
             * <ul>
             *    <li>true - ввод только целых чисел;</li>
             *    <li>false - возможен ввод дробных чисел.</li>
             * </ul>
             * @example
             * <pre>
             *     <option name="onlyInteger">true</option>
             * </pre>
             * @see decimals
             * @see hideEmptyDecimals
             * @see setOnlyInteger
             */
            onlyInteger: false,
            /**
             * @cfg {Number} Количество знаков после запятой
             * Опция задаёт ограничение количества знаков дробной части числа.
             * @example
             * <pre>
             *     <option name="decimals">3</option>
             * </pre>
             * @see integers
             * @see hideEmptyDecimals
             */
            decimals: -1,
            /**
             * @cfg {Number} Количество знаков до запятой
             * Опция задаёт ограничение количества знаков в целой части числа.
             * @example
             * <pre>
             *     <option name="integers">4</option>
             * </pre>
             * @see decimals
             */
            integers: 16,
            /**
             * @cfg {Boolean} Прятать нулевую дробную часть
             * Опция позволяет скрыть нулевую дробную часть.
             * @example
             * <pre>
             *     <option name="hideEmptyDecimals">true</option>
             * <pre>
             * @see decimals
             */
            hideEmptyDecimals: true,
            /**
             * @cfg {Boolean} Использовать ли кнопки для изменения значения
             * С помощью кнопок можно увеличивать/уменьшать целую часть числа на 1.
             * @example
             * <pre>
             *     <option name="enableArrows">true</option>
             * </pre>
             * @see integers
             * @see onlyInteger
             */
            enableArrows: false,
            /**
             * @cfg {Boolean} Показать разделители триад
             * @example
             * <pre>
             *     <option name="delimiters">true</option>
             * </pre>
             * @see integers
             * @see onlyInteger
             * @see decimals
             */
            delimiters: false,
            /**
             * @cfg {Number} Числовое значение контрола
             * Если установлено, то значение опции text игнорируется.
             * @example
             * <pre>
             *     <option name="numericValue">123.456</option>
             * </pre>
             * @see text
             */
            numericValue: null
         },
         _inputMirror: null
      },

      _modifyOptions: function(options){
         var value;

         options = NumberTextBox.superclass._modifyOptions.apply(this, arguments);
         value = (options.numericValue != undefined) ? options.numericValue : options.text;
         if (value){
            options.text = formatText(
               value,
               options.text, 
               options.onlyInteger, 
               options.decimals, 
               options.integers, 
               options.delimiters, 
               options.onlyPositive, 
               options.maxLength,
               options.hideEmptyDecimals
            );
         }
         if(options.hideEmptyDecimals && options.text) {
            options.text = hideEmptyDecimals(options.text);
         }

	      options.cssClassName += ' controls-NumberTextBox';

         return options;
      },

      $constructor: function () {
         var self = this;
         this._createMirrorInput();
         $('.js-controls-NumberTextBox__arrowDown', this.getContainer().get(0)).click(function () {
            if (self.isEnabled()) {
               self._arrowDownClick();
            }
         });

         $('.js-controls-NumberTextBox__arrowUp', this.getContainer().get(0)).click(function () {
            if (self.isEnabled()) {
               self._arrowUpClick();
            }
         });

         this._inputField.bind('blur', function(){
            self._blurHandler();
         });

         // TODO https://online.sbis.ru/opendoc.html?guid=f30c45a4-49f5-4125-b743-d391331b6587
         // временное решения в версию для скролла в поле ввода,
         // сейчас браузерный скролл ломает preventDefalt - его нельзя удалить т.к. мы обрабатываем все нажатия и иначе цифры будут дублироваться
         this._inputField.on('keyup click focus', function(event) {
            var off = this.selectionStart,
               containerWidth, cursorOffset, scrollLeft;

            self._inputMirror.text(self._getInputValue().substring(0, off).replace(/\s/g, "\u00a0"));
            containerWidth = self._inputField[0].clientWidth;
            cursorOffset = self._inputMirror.outerWidth();
            scrollLeft = cursorOffset - containerWidth;
            self._inputField.scrollLeft(scrollLeft > 0 ? scrollLeft + 1 : 0); // +1px на ширину каретки
         });
      },

      _createMirrorInput: function() {
         var mirrorContainer = $('.controls-NumberTextBox__mirror');
         if(mirrorContainer.length){
            this._inputMirror = mirrorContainer;
         }else {
            this._inputMirror = $('<span class="controls-NumberTextBox__mirror controls-TextBox__field"></span>');
            $('body').append(this._inputMirror);
         }
      },

      init: function() {
         NumberTextBox.superclass.init.apply(this, arguments);
      },

       _blurHandler: function() {
            // Прятать нулевую дробную часть при потере фокуса
           this._hideEmptyDecimals();
       },

      _inputFocusInHandler: function() {
         var text = this._getInputValue();
         // Показывать нулевую дробную часть при фокусировки не зависимо от опции hideEmptyDecimals
         if (this._options.enabled) {
            this._options.text = this._formatText(this._options.text);
            if(text !== this._options.text) {
               this._setInputValue(this._options.text);
            }
         }
         NumberTextBox.superclass._inputFocusInHandler.apply(this, arguments);
      },

      _setText: function(text){
         if (text !== '-' && text !== '.' && text !== ''){
            text = this._formatText(text);
            if (text.indexOf('.') === text.length - 1) {
               this._setInputValue(text);
               this._setCaretPosition(this._caretPosition[0] + 1, this._caretPosition[1] + 1);
               return;
            }
         }
         this._setNumericValue(text);
         this._setInputValue(text);
         this._setCaretPosition(this._caretPosition[0], this._caretPosition[1]);
      },

      setText: function(text){
         var newText = this._isEmptyValue(text) ? text : this._formatText(text);
         this._setNumericValue(newText);
         NumberTextBox.superclass.setText.call(this, newText);
         if(!this.isActive() && this._options.hideEmptyDecimals) {
            this._hideEmptyDecimals();
         }
      },

      _hideEmptyDecimals: function () {
         var value = this._getInputValue();
         if(value) {
            if (this._options.hideEmptyDecimals && (value && value.indexOf('.') != -1)) {
               value = hideEmptyDecimals(value);
            }
            this._options.text = value;

            this._setInputValue(value);
         }
      },

       /**
        * Возвращает текущее числовое значение поля ввода.
        * @returns {Number} Текущее значение поля ввода числа.
        * @example
        * <pre>
        *     if (control.getNumericValue() < 19) {
        *        textBox.setEnabled("false");
        *     }
        * </pre>
        */
      getNumericValue: function(){
        var val = this._options.numericValue;
        return (isNaN(val)) ? null : val;
      },

      setNumericValue: function(value) {
         if (value !== this._options.numericValue && value < 9007199254740992){ // проверка на вернюю границу 2^53
            this._setNumericValue(value);
            this.setText(value + '');
         }
      },

      _setNumericValue: function(value){
         if (typeof(value) == 'string'){
             value = value.replace(/\s+/g,'');
         }
         if (this._options.onlyInteger) {
            this._options.numericValue = parseInt(value, 10);
         } else {
            this._options.numericValue = parseFloat(value);
         }
         this._notifyOnPropertyChanged('numericValue');
      },
      /**
       * Установить количество знаков после запятой
       * @param decimals Количество знаков после запятой
       */
      setDecimals: function(decimals) {
         if (typeof decimals === 'number') {
            this._options.decimals = decimals;
         }
      },

      /**
       * Установить количество знаков после запятой
       * @param decimals Количество знаков после запятой
       */
      setIntegers: function(integers) {
         if (typeof integers === 'number') {
            this._options.integers = integers;
         }
      },
      /**
       * Установить возможность ввода только целых чисел
       * @param {Boolean} onlyInteger Ввод только целых чисел
       * @see onlyInteger
       */
      setOnlyInteger: function(onlyInteger){
         this._options.onlyInteger = Boolean(onlyInteger);
      },

      _updateCompatPlaceholderVisibility: function() {
         if (this._compatPlaceholder) {
            if (typeof this._options.numericValue === 'number' && !isNaN(this._options.numericValue)) {
                this._compatPlaceholder.addClass('ws-hidden');
            } else {
               NumberTextBox.superclass._updateCompatPlaceholderVisibility.apply(this, arguments);
            }
         }
      },

      /**
       * Получить количество знаков после запятой
       */
      getDecimals: function() {
         return this._options.decimals;
      },

      _formatText: function(value){
         return formatText(
            value, 
            this._options.text, 
            this._options.onlyInteger, 
            this._options.decimals, 
            this._options.integers, 
            this._options.delimiters, 
            this._options.onlyPositive, 
            this._options.maxLength,
            this._options.hideEmptyDecimals
         );
      },

      _arrowUpClick: function(){
         this.setNumericValue(this._getSibling(1));
      },

      _arrowDownClick: function(){
         if (!(this._options.onlyPositive && this.getNumericValue() < 1)) {
            this.setNumericValue(this._getSibling(-1));
         }
      },

      _keyDownBind: function (event) {
         if (!this.isEnabled()){
            return false;
         }
         this._caretPosition = this._getCaretPosition();
         if (event.shiftKey){
            this._SHIFT_KEY = true;
         }
         if (event.ctrlKey){
            this._CTRL_KEY = true;
         }
         if (event.which == constants.key.f5   || // F5, не отменяем действие по-умолчанию
            event.which == constants.key.f12   || // F12,не отменяем действие по-умолчанию
            event.which == constants.key.left  || // не отменяем arrow keys (влево, вправо)
            event.which == constants.key.right ||
            event.which == constants.key.end   || // не отменяем home, end
            event.which == constants.key.home
         ) {
            return true;
         }
         var keyCode = (event.which >= 96 && event.which <= 105) ? event.which - 48 : event.which;
         /*точка*/
         if ((keyCode == 190 || keyCode == 110 || keyCode == 191 || keyCode == 188) && (!event.key || event.key == ',' || event.key == '.'|| event.key == 'б' || event.key == 'ю' || event.key == 'Decimal')) {
            this._dotHandler(event);
            return;
         }
         if(keyCode == 189 || keyCode == 173 || keyCode == 109/*минус 173 - firefox, 109 - NumPad*/){
            this._toggleMinus();
            event.preventDefault();
         }

         if (keyCode == 46){ /*Delete*/
            this._deleteHandler();
         } else if (keyCode == 8){ /*Backspace*/
            this._backspaceHandler();
         } else if (keyCode >= 48 && keyCode <= 57 && !this._SHIFT_KEY){ /*Numbers*/
            event.preventDefault();
            this._numberPressHandler(keyCode);
            return true;
         }
         if (this._getInputValue().indexOf('.') === 0){
            this._setText('0' + this._getInputValue());
            this._setCaretPosition(1);
         }
         if (this._CTRL_KEY){
            return true;
         }
         event.preventDefault();
      },

      _numberPressHandler: function (keyCode) {
         var b = this._caretPosition[0], //начало выделения
             e = this._caretPosition[1],  //конец выделения
             currentVal = this._getInputValue(),
             newState = NumberTextBoxUtil.numberPress(
                 b,
                 e,
                 currentVal,
                 this._options.delimiters,
                 this._options.integers,
                 this._options.decimals,
                 keyCode,
                 this._options.maxLength
             );

         this._setText(newState.value);
         this._setCaretPosition(newState.caretPosition);
      },

      _deleteHandler: function(){
         var b = this._caretPosition[0], //начало выделения
             e = this._caretPosition[1],  //конец выделения
             currentVal = this._getInputValue(),
             newState = NumberTextBoxUtil.deletPressed(b,
                 e,
                 currentVal,
                 this._options.delimiters,
                 this._options.decimals
             );

         this._setText(newState.value);
         this._setCaretPosition(newState.caretPosition + newState.step - 1);
      },

      _backspaceHandler: function(){
         var b = this._caretPosition[0], //начало выделения
             e = this._caretPosition[1],  //конец выделения
             currentVal = this._getInputValue(),
             newState = NumberTextBoxUtil.backspacePressed(
                 b,
                 e,
                 currentVal,
                 this._options.delimiters,
                 this._options.decimals
             );

         this._setText(newState.value);
         this._setCaretPosition(newState.caretPosition + newState.step - 1);
      },

      _dotHandler: function(event){
         if (!this._options.onlyInteger && this._options.decimals !== 0) {
            var currentVal = this._getInputValue(),
               dotPosition = currentVal.indexOf('.');
            if (dotPosition != -1) {
               this._setCaretPosition(dotPosition + 1);
            } else {
               currentVal = currentVal.substr(0, this._caretPosition[0]) + '.' + currentVal.substr(this._caretPosition[1]);
               this._setText(currentVal);
            }
         }
         event.preventDefault();
      },

      _keyUpBind: function(e){
         NumberTextBox.superclass._keyUpBind.apply(this, arguments);
         if (e.which == 16){
            this._SHIFT_KEY = false;
         }
         if (e.which == 17){
            this._CTRL_KEY = false;
         }
      },

      _toggleMinus: function(){
         var value,
             step;

         if (!this._options.onlyPositive) {
            value = this._getInputValue();
            // это надо т.к. при смене знака каретка должна остаться на месте
            // если в поле ввода не было значения, то появится "-0" -> сдвиг 2 в остальных случаях сдвиг на 1
            step = value ? 1 : 2;

            if(!value){
               value = '0';
            }
            if (this._options.text.indexOf('-') == -1) {
               this._setText('-' + value);
               this._setCaretPosition(this._caretPosition[0] + step);
            } else {
               this._setText(value.substr(1));
               this._setCaretPosition(this._caretPosition[0] - 1);
            }
            TextBox.superclass.setText.call(this, this._getInputValue());
         }
      },

      _getSibling: function (a) {
         var sibling = this.getNumericValue();
         if ((sibling < 1 && sibling > 0 && a == -1) ||
             (sibling > -1 && sibling < 0 && a == 1)){
            this._toggleMinus();
            return -sibling;
         } else {
            return sibling + a;
         }
      },

      /**
       * Возвращает массив содержащий координаты выделения
       * @return {Array} массив содержащий координаты выделения
       */
      _getCaretPosition : function(){
         var
            obj = this._inputField.get(0),
            b,
            e,
            l;
         if (constants.browser.isIE && constants.browser.IEVersion < 9) { //IE
            var range = document.selection.createRange();
            l = range.text.length;
            range.moveStart('textedit', -1);
            e = range.text.length;
            range.moveEnd('textedit', -1);
            b = e - l;
         }
         else
         {
            b = obj.selectionStart;
            e = obj.selectionEnd;
         }
         return [b,e];
      },
      /**
       * Выставляет каретку в переданное положение
       * @param {Number}  pos    позиция, в которую выставляется курсор
       * @param {Number} [pos2]  позиция правого края выделения
       */
      _setCaretPosition : function(pos, pos2){
         pos2 = pos2 || pos;
         var obj = this._inputField.get(0);
         if (constants.browser.isIE && constants.browser.IEVersion < 9) { //IE
            var r = obj.createTextRange();
            r.collapse(true);
            r.moveStart("character", pos);
            r.moveEnd("character", pos2-pos); // Оказывается moveEnd определяет сдвиг, а не позицию
            r.select();
         }
         else
         {
            obj.setSelectionRange(pos, pos2);
            obj.focus();
         }
      }

   });

   return NumberTextBox;

});
