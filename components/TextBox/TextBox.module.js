define('js!SBIS3.CONTROLS.TextBox', [
   'Core/EventBus',
   'Core/constants',
   'js!SBIS3.CONTROLS.TextBoxBase',
   'tmpl!SBIS3.CONTROLS.TextBox',
   'tmpl!SBIS3.CONTROLS.TextBox/resources/textFieldWrapper',
   'js!SBIS3.CONTROLS.Utils.TemplateUtil',
   'js!SBIS3.CONTROLS.TextBoxUtils',
   'Core/Sanitize',
   'Core/helpers/dom&controls-helpers',
   'Core/helpers/functional-helpers',
   'js!SBIS3.CONTROLS.ControlHierarchyManager',
   'js!SBIS3.CONTROLS.IconButton',
   'css!SBIS3.CONTROLS.TextBox'

], function(
    EventBus,
    constants,
    TextBoxBase,
    dotTplFn,
    textFieldWrapper,
    TemplateUtil,
    TextBoxUtils,
    Sanitize,
    dcHelpers,
    fHelpers,
    ControlHierarchyManager) {

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
    * @author Крайнов Дмитрий Олегович
    * @demo SBIS3.CONTROLS.Demo.MyTextBox
    *
    * @ignoreOptions independentContext contextRestriction className horizontalAlignment
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth
    * @ignoreOptions isContainerInsideParent owner stateKey subcontrol verticalAlignment
    *
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe getClassName setClassName
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChanged onChange onReady
    *
    * @control
    * @public
    * @category Inputs
    */

   var TextBox = TextBoxBase.extend(/** @lends SBIS3.CONTROLS.TextBox.prototype */ {
      _dotTplFn: dotTplFn,
      /**
       * @event onInformationIconMouseEnter Происходит когда курсор мыши входит в область информационной иконки.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @see informationIconColor
       */
      /**
       * @event onInformationIconActivated Происходит при клике по информационной иконке.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @see informationIconColor
       */
      $protected: {
      	_fromTouch: false,
         _pasteProcessing : 0,
         _inputField : null,
         _compatPlaceholder: null,
         _tooltipText: null,
         _fromTab: true,
         _beforeFieldWrapper: null,
         _afterFieldWrapper: null,
         _textFieldWrapper: null,
         _informationIcon: null,
         _options: {
            textFieldWrapper: textFieldWrapper,
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
            inputRegExp : '',
            /**
             * @cfg {Boolean} Включает отображение информационной иконки в поле ввода.
             * @remark
             * Для взаимодействия с информационной иконкой используются два события (@see onInformationIconMouseEnter) и (@see onInformationIconActivated)
             * по умолчанию опция выключена
             * @example
             * Пример показа всплывающей подсказки для поля ввода по наведению курсора на информационную иконку
             * <pre>
             *    myTextBox.subscribe('onInformationIconMouseEnter', function() {
             *       CInfobox.show({
             *         control: myTextBox.getContainer(),
             *         message: "<p><span style='color: red;'>Внимание:</span> Текст всплывающей подсказки</p>",
             *         width: 400,
             *         delay: 1000,
             *         hideDelay: 2000
             *       });
             *    });
             * </pre>
             * Цвета доступные для установки:
             * <ol>
             *    <li>done</li>
             *    <li>attention</li>
             *    <li>disabled</li>
             *    <li>error</li>
             *    <li>primary</li>
             * </ol>
             * @see setInformationIconColor
             * @see informationIconColor
             */
            informationIconColor: ''
         }
      },

      $constructor: function() {
         this._publish('onPaste', 'onInformationIconMouseEnter', 'onInformationIconActivated');
         var self = this;
         this._inputField = this._getInputField();
         this._container.bind('keypress keydown keyup', this._keyboardDispatcher.bind(this));
         this._inputField.on('paste', function(event){
            var userPasteResult = self._notify('onPaste', TextBoxUtils.getTextFromPasteEvent(event));

            if(userPasteResult !== false){
               self._pasteProcessing++;
               window.setTimeout(function(){
                  self._pasteProcessing--;
                  if (!self._pasteProcessing) {
                     var text = self._getInputValue(),
                         inputRegExp = self._options.inputRegExp;
                     if (inputRegExp){
                         text = self._checkRegExp(text, inputRegExp);
                     }
                     text = self._formatText(text);
                     self._drawText(text);
                     /* Событие paste может срабатывать:
                      1) При нажатии горячих клавиш
                      2) При вставке из котекстного меню.

                      Если текст вставлют через контекстное меню, то нет никакой возможности отловить это,
                      но событие paste гарантированно срабатывает после действий пользователя. Поэтому мы
                      можем предполагать, что это ввод с клавиатуры, чтобы правильно работали методы,
                      которые на это рассчитывают.
                      */
                     self._setTextByKeyboard(text);
                  }
               }, 100);
            }else {
               event.preventDefault();
            }

         });

         this._inputField.on('drop', function(){
            window.setTimeout(function(){
               // в момент события в поле ввода нет перенесенных данных,
               // поэтому вставка выполняется с задержкой, чтобы позволить браузеру обработать перенесенные данные (картинка, верстка)
               self._setTextByKeyboard(self._getInputValue());
            }, 100);
         });

         this._inputField.change(function(){
            var newText = $(this).val(),
                inputRegExp = self._options.inputRegExp;

            if (newText != self._options.text) {
               if(inputRegExp) {
                  newText = self._checkRegExp(newText, inputRegExp);
               }
               self.setText(newText);
            }
         });

         $(this._inputField).on('mousedown', function(){
            self._fromTab = false;
         });

         this._inputField.bind('focusin', this._inputFocusInHandler.bind(this))
                         .bind('focusout', this._inputFocusOutHandler.bind(this));

         this._container.on('touchstart', function(){
            this._fromTouch = true;
         }.bind(this));

         if (this._options.placeholder && !this._useNativePlaceHolder()) {
            this._createCompatPlaceholder();
         }

         this._container.bind('mouseenter', function(e){
            self._applyTooltip();
         });
      },

      _modifyOptions: function() {
         var cfg = TextBox.superclass._modifyOptions.apply(this, arguments);
         /* Надо подготовить шаблоны beforeFieldWrapper и afterFieldWrapper,
            чтобы у них был __vStorage, для возможности обращаться к опциям по ссылке (ref) */
         cfg.beforeFieldWrapper = TemplateUtil.prepareTemplate(cfg.beforeFieldWrapper);
         cfg.afterFieldWrapper = TemplateUtil.prepareTemplate(cfg.afterFieldWrapper);
         return cfg;
      },


      _checkRegExp: function (text, regExp) {
          var newText = '',
              inputRegExp = new RegExp(regExp);
          for (var i = 0; i < text.length; i++){
              if (inputRegExp.test(text[i])){
                  newText = newText + text[i];
              }
          }
          return newText;
      },

      init: function() {
         var self = this;
         TextBox.superclass.init.apply(this, arguments);

         if(this._options.informationIconColor) {
            this._informationIcon = this.getChildControlByName('informationIcon');

            this._informationIcon.getContainer().on('mouseenter', function() {
               self._notify('onInformationIconMouseEnter');
            });
            this._informationIcon.subscribe('onActivated', function(){
               self._notify('onInformationIconActivated');
            });
         }
         /* Надо проверить значение input'a, т.к. при дублировании вкладки там уже может быть что-то написано */
         this._checkInputVal();
      },

      /**
       * Устанавливает цвет информационной иконки.
       * @returns {String} Стандартный цвет иконки.
       * Цвета доступные для установки:
       * <ol>
       *    <li>done</li>
       *    <li>attention</li>
       *    <li>disabled</li>
       *    <li>error</li>
       *    <li>primary</li>
       * </ol>
       * @see informationIcon
       * @see informationIconColor
       */
      setInformationIconColor: function (color) {
         var informationIconContainer = this._informationIcon.getContainer();

          informationIconContainer.removeClass('icon-' + this._options.informationIconColor);
          this._options.informationIconColor = color;
          informationIconContainer.addClass('icon-' + color);
      },

      _keyboardDispatcher: function(event){
         return fHelpers.forAliveOnly(function(event){
            var result = true;
            switch (event.type) {
               case 'keydown':
                  result = this._keyDownBind.call(this, event);
                  break;
               case 'keyup':
                  result = this._keyUpBind.call(this, event);
                  break;
               case 'keypress':
                  result = this._keyPressBind.call(this, event);
                  break;
            }
            return result;
         }).call(this, event);
      },

      _useNativePlaceHolder: function() {
         return constants.compatibility.placeholder;
      },

      _checkInputVal: function() {
         var text = this._getInputValue();

         if (this._options.trim) {
            text = text.trim();
         }
         //Установим текст только если значения различны и оба не пустые
         if (text !== this._options.text && !(this._isEmptyValue(this._options.text) && !(text || '').length)){
            this.setText(text);
         }
      },

      /**
       * Применить tooltip
       * Если текст не умещается в поле по ширине, то показываем подсказку с полным текстом
       * Если текст умещается, то показываем из опции tooltip
       */
      _applyTooltip: function() {
         if (this._tooltipText != this._options.text) {
            var scrollWidth;
            if (constants.browser.isIE) {
               scrollWidth = dcHelpers.getTextWidth(this._options.text);
            }
            else {
               scrollWidth = this._inputField[0].scrollWidth;
            }
            // для случая, когда текст не умещается в поле ввода по ширине, показываем всплывающую подсказку с полным текстом
            if (scrollWidth > this._inputField[0].clientWidth) {
               this._container.attr('title', this._options.text);
            }
            else if (this._options.tooltip) {
               this.setTooltip(this._options.tooltip);
            } else if (this._container.attr('title')) {
                this._container.attr('title', '');
            }
            this._tooltipText = this._options.text;
         }
      },

      _updateCompatPlaceholderVisibility: function() {
         if (this._compatPlaceholder) {
            this._compatPlaceholder.toggleClass('ws-hidden', !!this.getText());
         }
      },

      _drawText: function(text) {
         this._updateCompatPlaceholderVisibility();
         if (this._getInputValue() != text) {
            this._setInputValue(text || '');
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
       *     if (control.getText() == '') {
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
         text = text ? text : text == 0 ? text : '';
         if (!this._useNativePlaceHolder(text)) {
            if (!this._compatPlaceholder) {
               this._createCompatPlaceholder();
            }
            this._compatPlaceholder.html(text);
         }
         else {
            this._inputField.attr('placeholder', text);
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

      _keyDownBind: function(event){
         if (event.which == 13){
            this._checkInputVal();
         }
      },

      _keyUpBind: function(event) {
         var newText = this._getInputValue(),
            textsEmpty = this._isEmptyValue(this._options.text) && this._isEmptyValue(newText);
         if (this._options.text !== newText && !textsEmpty){
            this._setTextByKeyboard(newText);
         }
         var key = event.which || event.keyCode;
         if (Array.indexOf([constants.key.up, constants.key.down], key) >= 0) {
            event.stopPropagation();
         }
      },

      _setTextByKeyboard: function(newText){
         this.setText(newText);
      },

      _getInputValue: function() {
         return this._inputField.val();
      },
      _setInputValue: function(value) {
         this._inputField.val(value);
      },
      _getInputField: function() {
         return $('.js-controls-TextBox__field', this.getContainer().get(0));
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

      _inputFocusOutHandler: function(e) {
         if (this._fromTouch){
            EventBus.globalChannel().notify('MobileInputFocusOut');
            this._fromTouch = false;
         }
      },

      _focusOutHandler: function(event, isDestroyed, focusedControl) {
         TextBox.superclass._focusOutHandler.apply(this, arguments);

         if(!isDestroyed  && (!focusedControl || !ControlHierarchyManager.checkInclusion(this, focusedControl.getContainer()[0])) ) {
            this._checkInputVal();
         }
      },

      _inputFocusInHandler: function(e) {
         if (this._fromTouch){
            EventBus.globalChannel().notify('MobileInputFocus');
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
         // убираем курсор на ipad'e при нажатии на readonly поле ввода
         if(!this.isEnabled() && constants.browser.isMobilePlatform){
            this._inputField.blur();
         }
      },

      _createCompatPlaceholder : function() {
         var self = this,
             compatPlaceholder = this.getContainer().find('.controls-TextBox__placeholder');

         if(compatPlaceholder.length) {
            this._compatPlaceholder = compatPlaceholder;
         } else {
            this._compatPlaceholder = $('<div class="controls-TextBox__placeholder">' + this._options.placeholder + '</div>');
            this._inputField.after(this._compatPlaceholder);
         }

         this._updateCompatPlaceholderVisibility();
         this._inputField.attr('placeholder', '');
         this._compatPlaceholder.css({
            'left': this._inputField.position().left || parseInt(this._inputField.parent().css('padding-left'), 10),
            'right': this._inputField.position().right || parseInt(this._inputField.parent().css('padding-right'), 10)
         });
         this._compatPlaceholder.click(function(){
            if (self.isEnabled()) {
               self._inputField.get(0).focus();
            }
         });
      },

      _getAfterFieldWrapper: function() {
         if(!this._afterFieldWrapper) {
            this._afterFieldWrapper = this.getContainer().find('.controls-TextBox__afterFieldWrapper');
         }
         return this._afterFieldWrapper;
      },

      _getBeforeFieldWrapper: function() {
         if(!this._beforeFieldWrapper) {
            this._beforeFieldWrapper = this.getContainer().find('.controls-TextBox__beforeFieldWrapper');
         }
         return this._beforeFieldWrapper;
      },

      destroy: function() {
         this._afterFieldWrapper = undefined;
         this._beforeFieldWrapper = undefined;
         this._inputField.off('*');
         this._inputField = undefined;
         if(this._informationIcon) {
            this._informationIcon.getContainer().off('*');
            this._informationIcon = undefined;
         }
         TextBox.superclass.destroy.apply(this, arguments);
      }
   });

   return TextBox;

});