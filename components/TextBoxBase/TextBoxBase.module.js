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
             * @cfg {String} Устанавливает текстовое значение в поле ввода.
             * @remark
             * Используется, когда необходимо передать в поле ввода определенное текстовое значение.
             * С опцией {@link SBIS3.CONTROLS.SuggestMixin#listFilter} используется в настройке параметров фильтрации
             * списка значений для автодополнения. Атрибут bind привязывает значение поля ввода к полю контекста.
             * Длина текста, передаваемого в поле ввода, не зависит от настройки опции {@link maxLength}.
             * Установить или изменить текстовое значение в поле ввода можно методом {@link setText}.
             * @example
             * Пример 1. Устанавливаем текст в поле ввода для поля связи:
             * <pre class="brush:xml">
             *    <option name="text">Филиппов Павел</option>
             * </pre>
             * Пример 2. Привязываем значения поля связи к полю myTextField в контексте для настройки фильтрации списка
             * значений автодополнения. В этом примере проиллюстрирована фильтрация списка по переданному тексту в
             * поле связи.
             * ![](/TextBoxBase01.png)
             * фрагмент верстки:
             * <pre class="brush:xml">
             *     <option name="text" bind="myTextField" value="Филиппов Павел"></option>
             *     <options name="listFilter">
             *         <option name="ФИО" bind="myTextField" oneWay="true" value=""></option>
             *     </options>
             * </pre>
             * @see trim
             * @see maxLength
             * @see setText
             * @see getText
             * @see SBIS3.CONTROLS.SuggestMixin#listFilter
             * @translatable
             */
            text: '',
            /**
             * @cfg {Boolean} Устанавливает режим обрезки пробелов в начале и конце добавляемого текста.
             * @variant true Обрезать пробелы.
             * @variant false Не обрезать пробелы.
             * @remark
             * Опцию применяют для исключения ситуаций, при которых в начале и конце текста образуются пробелы.
             * При включённом режиме пробелы в начале и конце введенного текста будут обрезаны.
             * Будет возвращена новая, усеченная строка. Это следует учитывать при определении {@link maxLength} -
             * максимального количества символов, которое может содержать текст при вводе.
             * @example
             * <pre class="brush:xml">
             *     <option name="trim">true</option>
             * </pre>
             * @see text
             * @see maxLength
             * @see setMaxLength
             */
            trim: false,
            /**
             * @cfg {Number} Определяет максимальное количество символов, которое может содержать поле ввода.
             * @remark
             * Применяется для ограничения длины вводимого текста. Значение равно допустимому для ввода количеству символов.
             * В случае превышения количества символов ввод не будет осуществлён.
             * Следует учитывать, что при включенной опции {@link trim} длина текста может измениться.
             * Опция не влияет на длину текста, переданного в поле ввода опцией {@link text}.
             * Установить или переопределить максимальное количество символов можно с помощью метода {@link setMaxLength}.
             * @example
             * <pre class="brush:xml">
             *     <option name="maxLength">40</option>
             * </pre>
             * @see setMaxLength
             * @see trim
             * @see text
             */
            maxLength: null,
            /**
             * @cfg {Boolean} Определяет поведение приложения на мобильных устройствах, когда фокус по умолчанию при
             * открытии страницы или диалога установлен на поле ввода.
             * @variant true Установить фокус.
             * @variant false Не устанавливать фокус.
             * @remark
             * Установленный в поле ввода фокус (курсор) на мобильных устройствах инициирует появление диалога с клавиатурой
             * для ввода значения. Опция позволяет изменить это поведение при открытии новых страниц или диалогов, когда
             * в них фокус установлен на одном из полей ввода.
             * Если полей несколько, то, как правило, появление клавиатуры неуместно. Ожидается, что пользователь сам
             * выберет поле для ввода значения.
             * В других случаях, когда на странице или диалоге всего одно поле ввода, появления клавиатуры считается уместным.
             * Установить или изменить фокус для поля ввода можно с помощью метода {@link $ws.proto.Control#setActive}.
             * @example
             * <pre class="brush:xml">
             *    <option name="focusOnActivatedOnMobiles">true</option>
             * </pre>
             * @see $ws.proto.Control#setActive
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
       * Устанавливает текстовое значение внутри поля ввода.
       * @param {String} text Текстовое значение, которое будет установлено в поле ввода.
       * @example
       * <pre>
       *     if (control.getText() == "Введите ФИО") {
       *        control.setText("");
       *     }
       * </pre>
       * @see text
       * @see getText
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
       * Получает текстовое значение поля ввода.
       * @returns {String} Текст - значение поля ввода.
       * @example
       * <pre>
       *     if (control.getText() == "Введите ФИО") {
       *        control.setText("");
       *     }
       * </pre>
       * @see text
       * @see setText
       */
      getText:function(){
         return this._options.text;
      },

      /**
       * Устанавливает максимальное количество символов, которое можно ввести в поле ввода.
       * @param {Number} num Количество символов.
       * @example
       * <pre>
       *    if (control.getName() == "Заголовок") {
       *       control.setMaxLength(50);
       *    }
       * </pre>
       * @see maxLength
       * @see text
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