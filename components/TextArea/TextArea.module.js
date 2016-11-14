define('js!SBIS3.CONTROLS.TextArea', [
   "Core/constants",
   "js!SBIS3.CONTROLS.TextBoxBase",
   "html!SBIS3.CONTROLS.TextArea",
   "Core/helpers/string-helpers",
   "Core/helpers/dom&controls-helpers",
   "browser!js!SBIS3.CORE.FieldText/resources/Autosize-plugin"
], function( constants,TextBoxBase, dotTplFn, strHelpers, dcHelpers) {

   'use strict';

   /**
    * Многострочное поле ввода - это текстовое поле с автовысотой.
    * Данное поле может автоматически менять высоту в зависимости от количества введённой информации.
    * Для контрола настраиваются:
    * <ul>
    *    <li>{@link SBIS3.CONTROLS.TextArea#minLinesCount минимальное}</li>
    *    <li>и {@link SBIS3.CONTROLS.TextArea#autoResize.minLinesCount максимальное} количества отображаемых строк,</li>
    *    <li>{@link SBIS3.CONTROLS.TextArea#autoResize.state автоматическое ли изменение количества строк}.</li>
    * </ul>
    * @class SBIS3.CONTROLS.TextArea
    * @extends SBIS3.CONTROLS.TextBoxBase
    * @author Крайнов Дмитрий Олегович
    * @css controls-TextArea Класс для изменения отображения текста в многострочном поле ввода.
    *
    * @ignoreOptions independentContext contextRestriction className
    *
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents getExtendedTooltip
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe getClassName setClassName
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChanged onTooltipContentRequest onChange
    * @ignoreEvents onReady
    *
    * @demo SBIS3.CONTROLS.Demo.MyTextArea
    *
    * @control
    * @public
    * @category Inputs
    */

   var TextArea = TextBoxBase.extend( /** @lends SBIS3.CONTROLS.TextArea.prototype */ {
      _dotTplFn: dotTplFn,
      $protected: {
         _inputField: null,
         _cachedW: null,
         _cachedH: null,
         _compatPlaceholder: null,
         _options: {
             /**
              * @cfg {String} Текст подсказки внутри поля ввода
              * @remark
              * Заданный в этой опции текст отображается внутри многострочного поля ввода до начала ввода.
              * @example
              * <pre>
              *     <option name="placeholder">Введите ФИО полностью</option>
              * </pre>
              * @see setPlaceholder
              * @translatable
              */
             placeholder: '',
            /**
             * @cfg {Number} Минимальное количество строк
             * @example
             * <pre>
             *     <option name="minLinesCount">2</option>
             * </pre>
             * @remark
             * Многострочное поле ввода построится с указанным в данной опции количеством строк.
             * @see autoResize
             */
            minLinesCount: 0,
            /**
             * @typedef {Object} AutoResize
             * @property {Boolean} [state=false] Включёно/выключено автоматическое подстраивание по высоте.
             * @property {Number} maxLinesCount Максимальное количество строк.
             */
            /**
             * @cfg {AutoResize} Автоматическое подстраивание по высоте, если текст не помещается
             * @example
             * <pre>
             *    <options name="autoResize">
             *        <option name="state">true</option>
             *        <option name="maxLinesCount">10</option>
             *    </options>
             * </pre>
             * @remark
             * В данной опции можно:
             * <ul>
             *    <li>включить автоматическое изменение высоты многострочного поля ввода, например, при нехватке строк;</li>
             *    <li>задать максимальное количество строк.</li>
             * </ul>
             * По достижению максимального количества строк поле ввода больше не будет увеличиваться по высоте, и
             * появится вертикальная полоса прокрутки.
             * @see minLinesCount
             */
            autoResize: {},
            /**
             * @cfg {String} Режим перехода на новую строку
             * @variant enter По нажатию клавиши <enter>
             * @variant shiftEnter По сочетанию клавиш <shift> + <enter>
             * <pre>
             *     <opt name="newLineMode">enter</opt>
             * </pre>
             */
            newLineMode: 'enter'
         }
      },

      $constructor: function() {
         var self = this;
         this._inputField = $('.controls-TextArea__inputField', this._container);
         this._disabledWrapper = $('.controls-TextArea__disabled-wrapper', this._container);
         // При потере фокуса делаем trim, если нужно
         // TODO Переделать на платформенное событие потери фокуса
         this._inputField.bind('focusout', function () {
            var text = self._inputField.val();
            if (self._options.trim) {
               text = String.trim(text);
            }
            //Установим текст только если значения различны и оба не пустые
            if (text !== self._options.text && !(self._isEmptyValue(self._options.text) && !text.length)){
               self.setText(text);
            }
         });

         this._container.bind('keyup',function(e){
            self._keyUpBind(e);
         });

         this._inputField.bind('keydown', function(event){
            // Если тебя посетило желание добавить ниже в исключения кнопку "shift" - то напиши зачем тебе это и будь готов к тому, что
            // благодаря keyboardHover-у где то перестанут нажиматься клавиши!
            if (!self._processNewLine(event) && !event.altKey && !event.ctrlKey && event.which !== constants.key.esc && event.which !== constants.key.tab) {
               event.stopPropagation();
            }
         });

         this._inputField.bind('paste', function(){
            self._pasteProcessing++;
            window.setTimeout(function(){
               self._pasteProcessing--;
               if (!self._pasteProcessing) {
                  self.setText.call(self, self._formatText(self._inputField.val()));
                  self._inputField.val(self._options.text);
               }
            }, 100)
         });
      },

      init :function(){
         TextArea.superclass.init.call(this);
         var self = this;
         if (this._options.placeholder && !constants.compatibility.placeholder) {
            this._createCompatPlaceholder();
         }
         if (this._options.autoResize.state) {
            this._options.minLinesCount = parseInt(this._options.minLinesCount, 10);
            if (!this._options.autoResize.maxLinesCount) {
               this._options.autoResize.maxLinesCount = 100500;
            }
            this._options.autoResize.maxLinesCount = parseInt(this._options.autoResize.maxLinesCount, 10);
            if (this._options.minLinesCount > this._options.autoResize.maxLinesCount) {
               this._options.autoResize.maxLinesCount = this._options.minLinesCount;
            }
            this._inputField.data('minLinesCount', this._options.minLinesCount);
            this._inputField.data('maxLinesCount', this._options.autoResize.maxLinesCount);

            this._cachedW = this._inputField.width();
            this._cachedH = this._inputField.height();

            var trg = dcHelpers.trackElement(this._container, true);

            this._autosizeTextArea();

            trg.subscribe('onVisible', function (event, visible) {
               if (visible) {
                  var w = self._inputField.width();
                  var h = self._inputField.height();
                  if (w != self._cachedW || h != self._cachedH) {
                     self._cachedW = w;
                     self._cachedH = h;
                     self._autosizeTextArea(true);
                  }
                  /* при использовании плагина для авторасчета высоты - высота текстареи считается js-ом динамически
                   * при этом если контента много, то див, который реализует задизабленный режим, может иметь вертикальный скролл
                   * и даже после выставления нужной высоты, которой хватает для текстареи, из за вертикального скролла в диве
                   * может не хватать ширины => строки переносятся и высоты тоже не хватает - появляется скролл
                   * если добавить и убрать стиль overflow-y то все пересчитывается правильно*/
                  var wrapper = $('.controls-TextArea__disabled-wrapper', self._container.get(0));
                  wrapper.css('overflow', '');
                  setTimeout(function(){
                     wrapper.css('overflow', 'auto');
                  }, 10)
               }
            });

         } else {
            if (this._options.minLinesCount){
               this._inputField.attr('rows',parseInt(this._options.minLinesCount, 10));
            }
         }
      },

      _autosizeTextArea: function(hard){
         var self = this;
         this._inputField.autosize({
            callback: self._notifyOnSizeChanged(self, self),
            hard: hard
         });
         //Автовысота считается на клиенте отложенно. А высота контрола стоит авто именно по размерам текстареи
         //поэтому на момент, когда она еще не посчиталась абсолютное позиционирование дизаблед враппера снято и высота считается исходя из размеров враппера
         //controls-TextArea__heightInit навешивает абсолютное позиционирование после расчета высоты и высота начинает считаться исходя из размеров area

         //так же при отключенном абсолютном позиционировании если на text-area ws-invisible, то еще добавляется ее высота
         //поэтому изначально скрываем ws-hidden, а потом уже делаем ws-invisible

         if (!this.isEnabled()) {
            this._inputField.removeClass('ws-hidden').addClass('ws-invivsible');
         }
         this._container.addClass('controls-TextArea__heightInit');
      },

      _getElementToFocus: function() {
         return this._inputField;
      },

      _setEnabled: function(state){
         TextArea.superclass._setEnabled.call(this, state);
         this._inputField.toggleClass('ws-invisible', !state)
         this._disabledWrapper.toggleClass('ws-hidden', state);
         if (!state){
            this._inputField.attr('readonly', 'readonly')
         } else {
            this._inputField.removeAttr('readonly');
         }
      },

      setText: function(text){
         TextArea.superclass.setText.call(this, text);
         var newText = strHelpers.escapeHtml(text);
         this._disabledWrapper.html(strHelpers.wrapURLs(newText));
      },

      _processNewLine: function(event) {
         if (this._options.newLineMode === 'shiftEnter' && event.which === constants.key.enter) {
            if (event.shiftKey) {
               event.stopPropagation();
            } else {
               event.preventDefault();
            }
            return true;
         }
      },

      _keyUpBind: function(event) {
         var
            newText = this._inputField.val(),
            key = event.which || event.keyCode;
         if (newText != this._options.text) {
            this.setText.call(this, newText);
         }
         if (!this._processNewLine(event) && ((key === constants.key.enter && !event.ctrlKey) ||
             Array.indexOf([constants.key.up, constants.key.down], key) >= 0)) {
            event.stopPropagation();
         }
      },
       /**
        * Установить подсказку, отображаемую внутри многострочного поля ввода.
        * Метод установки или замены текста подсказки, заданного опцией {@link placeholder}.
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
          if (!constants.compatibility.placeholder) {
             if (!this._compatPlaceholder) {
                this._createCompatPlaceholder();
             }
             this._compatPlaceholder.text(text || '');
          }
          else {
             this._inputField.attr('placeholder', text);
          }
      },
      _createCompatPlaceholder : function() {
         var self = this;
         this._compatPlaceholder = $('<div class="controls-TextArea__placeholder">' + this._options.placeholder + '</div>');
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
      },
      _updateCompatPlaceholderVisibility: function() {
         if (this._compatPlaceholder) {
            this._compatPlaceholder.toggle(!this._options.text);
         }
      },
       /**
        * Метод установки минимального количества строк.
        * @param count Количество строк, меньше которого высота не уменьшается.
        * @example
        * <pre>
        *     if (textArea.getText().length > 300) {
        *        textArea.setMinLinesCount(7);
        *     }
        * </pre>
        * @see minLinesCount
        */
      setMinLinesCount: function(count) {
         var cnt = parseInt(count, 10);
         this._options.minLinesCount = cnt;
         this._inputField.attr('rows', cnt);
         this._inputField.data('minLinesCount', count);
         this._inputField.trigger('autosize.resize');
      },

      _drawText: function(text) {
         this._updateCompatPlaceholderVisibility();
         if (this._inputField.val() != text) {
            this._inputField.val(text || '');
         }
         if (this._options.autoResize.state) {
            this._inputField.trigger('autosize.resize');
         }
      },

      setMaxLength: function(num) {
         TextArea.superclass.setMaxLength.call(this, num);
         this._inputField.attr('maxlength',num);
      },

      destroy: function() {
         if (this._options.autoResize.state) {
            this._inputField instanceof $ && this._inputField.trigger('autosize.destroy');
         }
         TextArea.superclass.destroy.apply(this, arguments);
      }
   });

   return TextArea;

});