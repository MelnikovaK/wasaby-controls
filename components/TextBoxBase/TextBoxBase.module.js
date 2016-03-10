define('js!SBIS3.CONTROLS.TextBoxBase',
   [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CONTROLS.FormWidgetMixin',
      'js!SBIS3.CONTROLS.DataBindMixin',
      'js!SBIS3.CORE.CompoundActiveFixMixin'
   ], function(CompoundControl, FormWidgetMixin, DataBindMixin, CompoundActiveFixMixin) {

   'use strict';

   /**
    * Базовый класс для текстового поля
    * @class SBIS3.CONTROLS.TextBoxBase
    * @extends $ws.proto.Control
    * @mixes SBIS3.CONTROLS.FormWidgetMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    *
    * @ignoreOptions independentContext contextRestriction isContainerInsideParent owner stateKey subcontrol className
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment verticalAlignment
    * @ignoreOptions extendedTooltip
    *
    * @ignoreMethods applyEmptyState applyState getClassName getEventHandlers getEvents getExtendedTooltip getOwnerId
    * @ignoreMethods getLinkedContext getOwner getStateKey getUserData hasEvent hasEventHandlers makeOwnerName once
    * @ignoreMethods sendCommand setClassName setExtendedTooltip setOpener setStateKey setUserData subscribe unsubscribe
    * @ignoreMethods subscribeOnceTo unbind
    *
    * @ignoreEvents onChange onClick onDragIn onDragMove onDragOut onDragStart onDragStop onKeyPressed onStateChange
    * @ignoreEvents onTooltipContentRequest
    */

   var TextBoxBase = CompoundControl.extend([FormWidgetMixin, DataBindMixin, CompoundActiveFixMixin], /** @lends SBIS3.CONTROLS.TextBoxBase.prototype*/ {

       /**
        * @event onTextChange Срабатывает при изменении текста в поле ввода.
        * @param {$ws.proto.EventObject} eventObject Дескриптор события.
        * @param {String} text Текст в поле ввода.
        * @example
        * <pre>
        *     textBox.subscribe('onTextChange', function(event, text){
        *        if (text == 'Воскресение') {
        *           alert('Такого не может быть')
        *        }
        *     };
        * </pre>
        * @see setText
        * @see setValue
        */

      $protected: {
         _keysWeHandle: [
            $ws._const.key.del,
            $ws._const.key.backspace,
            $ws._const.key.left,
            $ws._const.key.right,
            $ws._const.key.minus,
            $ws._const.key.space,
            $ws._const.key.m,
            $ws._const.key.o
         ],
         _options: {
            /**
             * @cfg {String} Устанавливает текст в поле ввода.
             * @remark
             * Помимо описания текста, который будет отображен в поле ввода, используется в настройке параметров фильтрации
             * списка значений для автодополнения, с опцией {@link SBIS3.CONTROLS.SuggestMixin#listFilter}.
             * Атрибут bind привязывает значение поля ввода к полю контекста.
             * @example
             * <pre class="brush:xml">
             *     <!-- Устанавливаем текст в поле ввода -->
             *        <option name="text">Текст, с которым построится поле ввода</option>
             *     <!-- Привязываем значения поля связи к полю myTextField в контексте для настройки фильтрации списка значений автодополнения-->
             *        <option name="text" bind="myTextField" value="">
             * </pre>
             * @see trim
             * @see maxLength
             * @see setText
             * @see getText
             * @see setValue
             * @see getValue
             * @see SBIS3.CONTROLS.SuggestMixin#listFilter
             * @translatable
             */
            text: '',
            /**
             * @cfg {Boolean} Обрезать ли пробелы при вставке
             * @remark
             * При включённой опции обрезаются пробелы в начале и в конце текста.
             * Возможные значения:
             * <ul>
             *    <li>true - обрезать пробелы;</li>
             *    <li>false - не обрезать.</li>
             * </ul>
             * @example
             * <pre class="brush:xml">
             *     <option name="trim">true</option>
             * </pre>
             * @see text
             * @see maxLength
             */
            trim: false,
            /**
             * @cfg {Number} Максимальное количество символов, которое может содержать значение при вводе.
             * @example
             * <pre class="brush:xml">
             *     <option name="maxLength">40</option>
             * </pre>
             * @remark
             * Применяется для ввода значения.
             * В случае превышения количества символов ввод не будет осуществлён.
             * @see setMaxLength
             * @see trim
             * @see text
             */
            maxLength: null,
            /**
             * @cfg {Boolean} Устанавливать фокус по активации контрола в мобильных устройствах.
             * Обычное поведение для полей ввода на мобильных устройствах - не устанавливать фокус при вызове
             * setActive(true), поскольку это вызовет появление клавиатуры, что неудобно - она нужна тогда, когда пользователь
             * сам тыкнул в поле ввода, или в исключительных случаях - когда есть какой-то модальный диалог с полем ввода, и
             * ему точно ничего другого, как писать в это поле ввода, не остаётся.
             * @example
             * <pre class="brush:xml">
             *    <option name="focusOnActivatedOnMobiles">true</option>
             * </pre>
             * <wiTag group="Управление">
             */
            focusOnActivatedOnMobiles: false
         }
      },

      $constructor: function() {
         this._publish('onTextChange');
         this._container.removeClass('ws-area');
         this._options.text = (this._options.text) ? this._options.text.toString() : '';
         this.subscribe('onTextChange', function () {
            //снимаем выделение валидатора на время ввода
            this.clearMark();
         });
      },

      /**
       * Установить текст внутри поля.
       * @param {String} text Текст для установки в поле ввода.
       * @example
       * <pre>
       *     if (control.getText() == "Введите ФИО") {
       *        control.setText("");
       *     }
       * </pre>
       * @see text
       * @see getText
       * @see setValue
       * @see getValue
       */
      setText: function(text){
         //null, NaN, undefined оставляем как есть, но выводим их как пустую строку
         var newText = (text === null || text !== text || typeof text === "undefined") ? text : this._formatText(text.toString());
         if (newText !== this._options.text) {
            this._options.text = newText;
            this._drawText(newText);
            this._notify('onTextChange', newText);
            this._notifyOnPropertyChanged('text');
         }
      },

      /**
       * Получить текст внутри поля.
       * @returns {String} Текст - значение поля ввода.
       * @example
       * <pre>
       *     if (control.getText() == "Введите ФИО") {
       *        control.setText("");
       *     }
       * </pre>
       * @see text
       * @see setText
       * @see setValue
       * @see getValue
       */
      getText:function(){
         return this._options.text;
      },

      /**
       * Установить максимальное количество символов, которое можно ввести.
       * @param {Number} num Количество символов.
       * @example
       * <pre>
       *    if (control.getName() == "Заголовок") {
       *       control.setMaxLength(50);
       *    }
       * </pre>
       * @see maxLength
       */
      setMaxLength: function(num) {
         this._options.maxLength = num;
      },

      _formatText : function(text) {
         return text || ''; // так как есть датабиндинг может прийти undefined
      },

      _drawText: function() {

      },

      _keyboardHover: function(event){
         event.stopPropagation();
         return true;
      },

      getValue : function() {
         $ws.single.ioc.resolve('ILogger').log('getValue()', 'getValue is deprecated. Use getText()');
         return this.getText();
      },

      setValue : function(txt) {
         $ws.single.ioc.resolve('ILogger').log('setValue()', 'setValue is deprecated. Use setText()');
         this.setText(txt);
      }
   });

   return TextBoxBase;

});