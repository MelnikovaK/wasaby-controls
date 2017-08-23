define('js!SBIS3.CONTROLS.TextArea', [
   "Core/constants",
   "js!SBIS3.CONTROLS.TextBox",
   'tmpl!SBIS3.CONTROLS.TextArea/resources/inputField',
   'Core/helpers/String/escapeHtml',
   'js!SBIS3.CONTROLS.Utils.LinkWrap',
   "Core/IoC",
   'Core/helpers/Hcontrol/trackElement',
   "browser!js!SBIS3.CORE.FieldText/resources/Autosize-plugin",
   'css!SBIS3.CONTROLS.TextArea'
], function( constants,TextBox, inputField, escapeHtml, LinkWrap, IoC, trackElement) {

   'use strict';

   function generateClassesName(min, max) {
      if (!max || max < min) {
         max = min;
      }
      return 'controls-TextArea__field__minheight-' + min + ' controls-TextArea__field__maxheight-' + max;
   }

   function modifyHeightClasses(container, addClasses) {
      var curClasses = container.className, newClasses = '';
      newClasses = curClasses.replace(/controls\-TextArea__field__maxheight\-[0-9]*/g, '');
      newClasses = newClasses.replace(/controls\-TextArea__field__minheight\-[0-9]*/g, '');
      newClasses = newClasses + ' ' + addClasses;
      container.className = newClasses;
   }

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
    * @author Романов Валерий Сергеевич
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

   var TextArea = TextBox.extend( /** @lends SBIS3.CONTROLS.TextArea.prototype */ {
      //_dotTplFn: dotTplFn,
      $protected: {
         _inputField: null,
         _cachedW: null,
         _cachedH: null,
         _pasteCommand: 'insertText',
         _autoSizeInitialized: false,
         _options: {
            textFieldWrapper: inputField,
            wrapUrls: LinkWrap.wrapURLs,
            escapeHtml: escapeHtml,
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
             * @cfg {Number} Максимальное количество строк
             * @example
             * <pre>
             *     <option name="maxLinesCount">4</option>
             * </pre>
             * @remark
             * При несовпадении максимального и минимального количества строк у поля ввода включится автовысота
             * @see minLinesCount
             */
            maxLinesCount: 0,
            /**
             * @cfg {String} Режим перехода на новую строку
             * @variant enter По нажатию клавиши <enter>
             * @variant shiftEnter По сочетанию клавиш <shift> + <enter>
             * <pre>
             *     <opt name="newLineMode">enter</opt>
             * </pre>
             */
            newLineMode: 'enter',
            breakClickBySelect: false
         }
      },

      _modifyOptions: function(cfg) {
         var newCfg = TextArea.superclass._modifyOptions.apply(this, arguments);
         if (cfg.autoResize && cfg.autoResize.maxLinesCount) {
            cfg.maxLinesCount = cfg.autoResize.maxLinesCount;
            IoC.resolve('ILogger').log('TextArea', 'Опция cfg.autoResize устарела - используйте maxLinesCount');
         }
         if (cfg.autoResize && cfg.autoResize.state && !cfg.maxLinesCount) {
            cfg.maxLinesCount = 10;
         }

         if (cfg.minLinesCount > cfg.maxLinesCount) {
            cfg.maxLinesCount = cfg.minLinesCount;
         }
         newCfg.heightclassName = generateClassesName(cfg.minLinesCount, cfg.maxLinesCount);
         newCfg.cssClassName += ' controls-TextArea';
         return newCfg;
      },

      $constructor: function() {
         var self = this;
         this._inputField = $('.controls-TextArea__field', this._container);
         this._disabledWrapper = $('.controls-TextArea__view', this._container);

         /* В textArea есть баг при вставке в дом, иногда могут теряться переносы строк.
            В этом случае надо обновить текст и отрисовать его заного.
            Перевставка текста произойдёт только если text отличается от значения в textArea .*/
         this._drawText(this.getText());

         // При потере фокуса делаем trim, если нужно
         // TODO Переделать на платформенное событие потери фокуса
         this._inputField.bind('focusout', function () {
            var text = self._inputField.val();
            if (self._options.trim) {
               text = text.trim();
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

         if (this._options.maxLinesCount != this._options.minLinesCount) {

            this._inputField.data('minLinesCount', this._options.minLinesCount);
            this._inputField.data('maxLinesCount', this._options.maxLinesCount);

            this._cachedW = this._inputField.width();
            this._cachedH = this._inputField.height();

            var trg = trackElement(this._container, true);

            if(this.isVisible()){
               this._autosizeTextArea();
            }

            trg.subscribe('onVisible', function (event, visible) {
               if (visible) {
                  var w = self._inputField.width();
                  var h = self._inputField.height();
                  if (w != self._cachedW || h != self._cachedH) {
                     self._cachedW = w;
                     self._cachedH = h;
                     self._autosizeTextArea(true);
                  }
               }
            });

         } else {
            if (this._options.minLinesCount){
               this._inputField.attr('rows',parseInt(this._options.minLinesCount, 10));
            }
            this._removeAutoSizeDognail();
         }
      },

      _removeAutoSizeDognail: function() {
         //Автовысота считается на клиенте отложенно. А высота контрола стоит авто именно по размерам текстареи
         //поэтому на момент, когда она еще не посчиталась абсолютное позиционирование дизаблед враппера снято и высота считается исходя из размеров враппера
         //controls-TextArea__heightInit навешивает абсолютное позиционирование после расчета высоты и высота начинает считаться исходя из размеров area

         //так же при отключенном абсолютном позиционировании если на text-area ws-invisible, то еще добавляется ее высота
         //поэтому изначально скрываем ws-hidden, а потом уже делаем ws-invisible
         if (!this.isEnabled()) {
            this._inputField.removeClass('ws-hidden').addClass('ws-invisible');
         }
         else {
            $('.controls-TextArea__view', this._container.get(0)).removeClass('ws-invisible').addClass('ws-hidden');
            this._inputField.removeClass('ws-hidden').removeClass('ws-invisible');
            if (!this._options.text) {
               $('.controls-TextArea__view', this._container.get(0)).empty();
               $('.controls-TextArea__view', this._container.get(0)).removeClass('controls-TextArea__view-empty'); //todo:
            }
         }
         //нельзя классы, ограничивающие высоту ставить сразу в шаблоне, потому что из-за них некорректно считается высота, т.к. оин сразу добавляют скролл, а считать высоту надо без скролла
         var hClasses = generateClassesName(this._options.minLinesCount, this._options.maxLinesCount);
         modifyHeightClasses(this._inputField.get(0), hClasses);
         this._container.addClass('controls-TextArea__heightInit');
      },

      _autosizeTextArea: function(hard){
         var self = this;
         this._inputField.autosize({
            callback: self._notifyOnSizeChanged(self, self),
            hard: hard
         });


         this._removeAutoSizeDognail();
      },

      _getElementToFocus: function() {
         return this._inputField;
      },

      _setEnabled: function(state){
         TextArea.superclass._setEnabled.call(this, state);
         this._inputField.toggleClass('ws-invisible', !state);
         this._disabledWrapper.toggleClass('ws-hidden', state);
         this._updateDisabledWrapper();
      },

      setText: function(text){
         TextArea.superclass.setText.call(this, text);
         this._updateDisabledWrapper();
      },

       _onClickHandler: function(event){
         // т.к. поле ввода находится внутри контейнера, то клик по внешнему контейнеру не ставит курсор в поле
         // поэтому принудительно проставляем фокус в активное поле
          if (this.isEnabled()) {
             this._getElementToFocus().focus();
          }
          TextArea.superclass._onClickHandler.call(this, event);
       },

      _updateDisabledWrapper: function() {
         if (this._disabledWrapper && !this.isEnabled()) {
            var
               newText = escapeHtml(this.getText());
            this._disabledWrapper.html(LinkWrap.wrapURLs(newText));
            this._disabledWrapper.toggleClass('controls-TextArea__view-empty', !newText);
         }
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
            key = event.which || event.keyCode,
            textsEmpty = this._isEmptyValue(this._options.text) && this._isEmptyValue(newText);
         if (newText != this._options.text && !textsEmpty) {
            this.setText.call(this, newText);
         }
         if (!this._processNewLine(event) && ((key === constants.key.enter && !event.ctrlKey) ||
            Array.indexOf([constants.key.up, constants.key.down], key) >= 0)) {
            event.stopPropagation();
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
         var hClasses = generateClassesName(cnt, this._options.maxLinesCount);
         modifyHeightClasses(this._inputField.get(0), hClasses);
         modifyHeightClasses(this._disabledWrapper.get(0), hClasses);
      },

      _drawText: function(text) {
         if (this._inputField.val() != text) {
            this._inputField.val(text || '');
            this._autosizeTextArea(true);
         }
      },

      setMaxLength: function(num) {
         TextArea.superclass.setMaxLength.call(this, num);
         this._inputField.attr('maxlength',num);
      },

      destroy: function() {
         this._inputField instanceof $ && this._inputField.trigger('autosize.destroy');
         trackElement(this._container, false);
         TextArea.superclass.destroy.apply(this, arguments);
      }
   });

   return TextArea;

});
