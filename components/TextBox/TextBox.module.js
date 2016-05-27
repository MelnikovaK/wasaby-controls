define('js!SBIS3.CONTROLS.TextBox', ['js!SBIS3.CONTROLS.TextBoxBase','html!SBIS3.CONTROLS.TextBox'], function(TextBoxBase, dotTplFn) {

   'use strict';

   /**
    * Однострочное текстовое поле ввода.
    * Специальные поля:
    * <ul>
    *    <li>{@link SBIS3.CONTROLS.NumberTextBox NumberTextBox} - поле ввода числа;</li>
    *    <li>{@link SBIS3.CONTROLS.PasswordTextBox PasswordTextBox} - поле ввода пароля;</li>
    *    <li>{@link SBIS3.CONTROLS.TextArea TextArea} - многострочное поле ввода;</li>
    *    <li>{@link SBIS3.CONTROLS.FormattedTextBox FormattedTextBox} - поле ввода с маской.</li>
    * </ul>
    *
    * Для поля ввода можно задать:
    * <ol>
    *    <li>{@link maxLength} - ограничение количества вводимых символов;</li>
    *    <li>{@link inputRegExp} - фильтр вводимых символов;</li>
    *    <li>{@link trim} - обрезать ли пробелы при вставке текста;</li>
    *    <li>{@link selectOnClick} - выделять ли текст при получении контролом фокуса;</li>
    *    <li>{@link textTransform} - форматирование регистра текста.</li>
    * </ol>
    * @class SBIS3.CONTROLS.TextBox
    * @extends SBIS3.CONTROLS.TextBoxBase
    * @control
    * @public
    * @author Крайнов Дмитрий Олегович
    * @demo SBIS3.CONTROLS.Demo.MyTextBox
    * @category Inputs
    *
    * @ignoreOptions independentContext contextRestriction extendedTooltip className
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment
    * @ignoreOptions isContainerInsideParent owner stateKey subcontrol verticalAlignment
    *
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents getExtendedTooltip
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe getClassName setClassName
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChanged onTooltipContentRequest onChange
    * @ignoreEvents onReady
    */

   var TextBox = TextBoxBase.extend(/** @lends SBIS3.CONTROLS.TextBox.prototype */ {
      _dotTplFn: dotTplFn,
      $protected: {
         _pasteProcessing : 0,
         _inputField : null,
         _compatPlaceholder: null,
         _tooltipText: null,
         _fromTab: true,
         _options: {
            beforeFieldWrapper: null,
            afterFieldWrapper: null,
            /**
             * @cfg {String} Устанавливает форматирование регистра текстового значения в поле ввода.
             * @variant uppercase Все символы верхним регистром.
             * @variant lowercase Все символы нижним регистром.
             * @variant none Без изменений.
             * @remark
             * Опция используется в случаях, когда все символы текста в поле ввода нужно отобразить прописными
             * (верхний регистр) или строчными (нижний регистр).
             * Заменить или установить регистр текста можно при помощи метода {@link setTextTransform}.
             * @example
             * Пример отображения в поле связи всех символов текста прописными
             * для {@link placeholder текста подсказки внутри поля ввода}:
             * ![](/TextBox02.png)
             * фрагмент верстки:
             * <pre class="brush:xml">
             *    <option name="textTransform">uppercase</option>
             * </pre>
             * @see setTextTransform
             * @see placeholder
             *
             */
            textTransform: 'none',
            /**
             * @cfg {Boolean} Определяет режим выделения текста в поле ввода при получении фокуса.
             * * true Выделять текст.
             * * false Не выделять текст.
             * @remark
             * Используется в случаях, когда поле ввода нужно использовать в качестве источника текстовой информации:
             * пользователю требуется скопировать строку в поле для каких-либо дальнейших действий.
             * @example
             * Иллюстрация выделения текста, переданного в поле связи опцией {@link SBIS3.CONTROLS.TextBoxBase#text}:
             * ![](/TextBox03.png)
             * фрагмент верстки:
             * <pre class="brush:xml">
             *     <option name="selectOnClick">true</option>
             * </pre>
             * @see SBIS3.CONTROLS.TextBoxBase#text
             */
            selectOnClick: false,
            /**
             * @cfg {String} Устанавливает текст подсказки внутри поля ввода.
             * @remark
             * Данный текст отображается внутри поля ввода до момента получения фокуса.
             * Заменить текст подсказки, заданный опцией, можно при помощи метода {@link setPlaceholder}.
             * @example
             * Пример 1. Текст подсказки в поле связи:
             * ![](/TextBox01.png)
             * фрагмент верстки:
             * <pre class="brush:xml">
             *     <option name="placeholder">ФИО исполнителя или название рабочей зоны</option>
             * </pre>
             * Пример 2. Текст подсказки с {@link textTransform форматированием регистра}:
             * ![](/TextBox02.png)
             * @see setPlaceholder
             * @see textTransform
             * @translatable
             */
            placeholder: '',
            /**
             * @cfg {String} Устанавливает регулярное выражение, в соответствии с которым будет осуществляться валидация вводимых символов.
             * @remark
             * Служит для фильтрации вводимых символов в поле ввода по условию, установленному регулярным выражением.
             * Каждый вводимый символ будет проверяться на соответствие указанному в этой опции регулярному выражению;
             * несоответствующие символы ввести будет невозможно.
             * @example
             * Разрешен ввод только цифр:
             * <pre class="brush:xml">
             *     <option name="inputRegExp">[0-9]</option>
             * </pre>
             * Разрешен ввод только кириллицы:
             * <pre class="brush:xml">
             *     <option name="inputRegExp">[а-яА-ЯёЁ]</option>
             * </pre>
             */
            inputRegExp : ''
         }
      },

      $constructor: function() {
         var self = this;
         this._inputField = $('.js-controls-TextBox__field', this.getContainer().get(0));
         this._container.bind('keypress', this._keyPressBind.bind(this))
                        .bind('keydown', this._keyDownBind.bind(this))
                        .bind('keyup', this._keyUpBind.bind(this));

         this._inputField.on('paste', function(){
            self._pasteProcessing++;
            window.setTimeout(function(){
               self._pasteProcessing--;
               if (!self._pasteProcessing) {
                  var text = self._inputField.val(),
                     newText = '';
                  if (self._options.inputRegExp){
                     var regExp = new RegExp(self._options.inputRegExp);
                     for (var i = 0; i < text.length; i++){
                        if (regExp.test(text[i])){
                           newText = newText + text[i];
                        }
                     }
                     text = newText;
                  }
                  self._inputField.val(text);
                  self.setText(self._formatText(text));   
               }
            }, 100);
         });

         this._inputField.change(function(){
            var newText = $(this).val();
            if (newText != self._options.text) {
               self.setText(self._options.text);
            }
         });

         $(this._inputField).on('mousedown', function(){
            self._fromTab = false;
         });

         this._inputField.bind('focusin', this._inputFocusInHandler.bind(this));

         this._inputField.bind('focusout', function(){
            var text = self._inputField.val();
            if (self._options.trim) {
               text = String.trim(text);
            }
            //Установим текст только если значения различны и оба не пустые
            if (text !== self._options.text && !(self._isEmptyValue(self._options.text) && !text.length)){
               self.setText(text);
            }
         });

         if (this._options.placeholder && !$ws._const.compatibility.placeholder) {
            this._createCompatPlaceholder();
         }

         this._container.bind("mouseenter", function(e){
            self._applyTooltip();
         });
      },

      /**
       * Применить tooltip
       * Если текст не умещается в поле по ширине, то показываем подсказку с полным текстом
       * Если текст умещается, то показываем из опции tooltip
       */
      _applyTooltip: function() {
         if (this._tooltipText != this._options.text) {
            var scrollWidth;
            if ($ws._const.browser.isIE) {
               scrollWidth = $ws.helpers.getTextWidth(this._options.text);
            }
            else {
               scrollWidth = this._inputField[0].scrollWidth;
            }
            // для случая, когда текст не умещается в поле ввода по ширине, показываем всплывающую подсказку с полным текстом
            if (scrollWidth > this._inputField[0].clientWidth) {
               this._container.attr('title', this._options.text);
            }
            else {
               this.setTooltip(this._options.tooltip);
            }
            this._tooltipText = this._options.text;
         }
      },

      _updateCompatPlaceholderVisibility: function() {
         if (this._compatPlaceholder) {
            this._compatPlaceholder.toggle(!this._options.text);
         }
      },

      _drawText: function(text) {
         this._updateCompatPlaceholderVisibility();
         if (this._inputField.val() != text) {
            this._inputField.val(text || '');
         }
      },

      setMaxLength: function(num) {
         TextBox.superclass.setMaxLength.call(this, num);
         this._inputField.attr('maxlength',num);
      },

      /**
       * Устанавливает подсказку, отображаемую внутри поля ввода.
       * @param {String} text Текст подсказки.
       * @example
       * <pre>
       *     if (control.getText() == "") {
       *        control.setPlaceholder("Введите ФИО полностью");
       *     }
       * </pre>
       * @see placeholder
       */
      setPlaceholder: function(text){
         this._setPlaceholder(text);
         this._options.placeholder = text;
      },

      _setPlaceholder: function(text){
         if (!$ws._const.compatibility.placeholder) {
            if (!this._compatPlaceholder) {
               this._createCompatPlaceholder();
            }
            this._compatPlaceholder.text(text || '');
         }
         else {
            this._inputField.attr('placeholder', text || '');
         }
      },

      /**
       * Устанавливает форматирование регистра текста в поле ввода.
       * @param {String} textTransform Необходимое форматирование регистра текста.
       * @variant uppercase Все символы текста становятся прописными (верхний регистр).
       * @variant lowercase Все символы текста становятся строчными (нижний регистр).
       * @variant none Текст не меняется.
       * @example
       * <pre>
       *    control.setTextTransform("lowercase");
       * </pre>
       * @see textTransform
       */
      setTextTransform: function(textTransform){
         switch (textTransform) {
            case 'uppercase':
               this._inputField.removeClass('controls-TextBox__field-lowercase')
                  .addClass('controls-TextBox__field-uppercase');
               break;
            case 'lowercase':
               this._inputField.removeClass('controls-TextBox__field-uppercase')
                  .addClass('controls-TextBox__field-lowercase');
               break;
            default:
               this._inputField.removeClass('controls-TextBox__field-uppercase')
                  .removeClass('controls-TextBox__field-lowercase');
         }
      },

      _keyDownBind: function(){

      },

      _keyUpBind: function(event) {
         var newText = this._inputField.val();
         if (this._options.text !== newText){
            this._setTextByKeyboard(newText);
         }
         var key = event.which || event.keyCode;
         if (Array.indexOf([$ws._const.key.up, $ws._const.key.down], key) >= 0) {
            event.stopPropagation();
         }
      },

      _setTextByKeyboard: function(newText){
         this.setText(newText);
      },

      _keyPressBind: function(event) {
         if (this._options.inputRegExp && !event.ctrlKey){
            return this._inputRegExp(event, new RegExp(this._options.inputRegExp));
         }
      },

      _getElementToFocus: function() {
         return this._inputField;
      },

      _setEnabled : function(enabled) {
         TextBox.superclass._setEnabled.call(this, enabled);
         if (enabled) {
            this._inputField.removeAttr('readonly');
         } else {
            this._inputField.attr('readonly', 'readonly')
         }
         this._setPlaceholder(enabled ? this._options.placeholder : '');
      },

      _inputRegExp: function (e, regexp) {
         var keyCode = e.which || e.keyCode;
         //Клавиши стрелок, delete, backspace и тд
         if (!e.charCode){
            return true;
         }
         if (keyCode < 32 || e.ctrlKey || e.altKey) {
            return false;
         }
         if (!regexp.test(String.fromCharCode(keyCode))) {
            return false;
         }
         return true;
      },

      _inputFocusInHandler: function(e) {
         // Хак для фф и ие, которые ставят курсор в readonly поле
         if (!this._options.enabled){
            this._inputField.blur()
         }
         if (this._options.selectOnClick || this._fromTab){
            this._inputField.select();
         }
         this._fromTab = true;
         /* При получении фокуса полем ввода, сделаем контрол активным.
          *  Делать контрол надо активным по фокусу, т.к. при клике и уведении мыши,
          *  кусор поставится в поле ввода, но соыбтие click не произойдёт и контрол актвным не станет, а должен бы.*/
         if(!this.isActive()) {
            this.setActive(true, false, true);
            e.stopPropagation();
         }
      },

      _createCompatPlaceholder : function() {
         var self = this;
         this._compatPlaceholder = $('<div class="controls-TextBox__placeholder">' + this._options.placeholder + '</div>');
         this._updateCompatPlaceholderVisibility();
         this._inputField.after(this._compatPlaceholder);
         this._compatPlaceholder.css({
            'left': this._inputField.position().left || parseInt(this._inputField.parent().css('padding-left'), 10),
            'right': this._inputField.position().right || parseInt(this._inputField.parent().css('padding-right'), 10)
         });
         this._compatPlaceholder.click(function(){
            if (self.isEnabled()) {
               self._inputField.get(0).focus();
            }
         });
      }
   });

   return TextBox;

});