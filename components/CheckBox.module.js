
define('js!SBIS3.CONTROLS.CheckBox', [
   "Core/constants",
   "js!WSControls/Buttons/ButtonBase",
   "js!SBIS3.CONTROLS.Checkable",
   "tmpl!SBIS3.CONTROLS.CheckBox/CheckBox/CheckBox",
   "tmpl!SBIS3.CONTROLS.CheckBox/CheckBox/resources/ContentTemplate",
   "js!SBIS3.CONTROLS.ITextValue",
   'css!SBIS3.CONTROLS.CheckBox/CheckBox/CheckBox'
], function( constants,WSButtonBase, Checkable, dotTplFn, defaultContentTemplate, ITextValue) {

   'use strict';
   var prepareChecked = function(checked, threeState) {
      //Портится контекст, когда приходит null при threeState = false checked, checked = null
      return checked;
   };
   /**
    * Контрол, отображающий стандартный флажок.
    * Можно настроить:
    * <ol>
    *    <li>{@link caption} - текст подписи;</li>
    *    <li>{@link threeState} - количество состояний;</li>
    *    <li>{@link checked} - начальное состояние.</li>
    * </ol>
    * При необходимости создания нескольких флажков используйте {@link SBIS3.CONTROLS.CheckBoxGroup CheckBoxGroup}.
    * @class SBIS3.CONTROLS.CheckBox
    * @extends WSControls/Buttons/ButtonBase
    *
    * @mixes SBIS3.CONTROLS.Checkable
    * @mixes SBIS3.CONTROLS.ITextValue
    *
    *
    * @demo SBIS3.CONTROLS.Demo.MyCheckbox
    * @author Журавлев Максим Сергеевич
    *
    * @ignoreOptions icon extendedTooltip independentContext contextRestriction isContainerInsideParent stateKey subcontrol
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment verticalAlignment owner
    *
    * @ignoreMethods activate activateFirstControl activateLastControl addPendingOperation changeControlTabIndex
    * @ignoreMethods applyEmptyState applyState findParent getAlignment getEventHandlers getEvents getExtendedTooltip
    * @ignoreMethods getId getLinkedContext getMinHeight getMinSize getMinWidth getOwner getOwnerId getParentByClass
    * @ignoreMethods getParentByName getParentByWindow getStateKey getTopParent getUserData hasEvent hasEventHandlers
    * @ignoreMethods isDestroyed isSubControl makeOwnerName once sendCommand setOwner setStateKey setUserData setValue
    * @ignoreMethods subscribe unbind unsubscribe
    *
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onStateChanged onTooltipContentRequest onChange
    * @ignoreEvents onBeforeShow onAfterShow onBeforeLoad onAfterLoad onBeforeControlsLoad onKeyPressed onResize
    * @ignoreEvents onFocusIn onFocusOut onReady
    *
    * @control
    * @public
    * @category Input
    * @initial
    * <component data-component='SBIS3.CONTROLS.CheckBox'>
    *     <option name="caption">CheckBox</option>
    * </component>
    */

   var CheckBox = WSButtonBase.extend([Checkable, ITextValue], /** @lends SBIS3.CONTROLS.CheckBox.prototype */ {
      _dotTplFn : dotTplFn,
      $protected: {
         _checkBoxCaption: null,
         _keysWeHandle: [constants.key.space],
         _options: {
            /**
             * @cfg {Boolean} Наличие неопределённого состояния
             * Возможные значения:
             * <ul>
             *    <li>true - есть неопределённое состояние;</li>
             *    <li>false - нет неопределённого состояния.</li>
             * </ul>
             * @example
             * <pre class="brush:xml">
             *    <option name="threeState">true</option>
             * </pre>
             */
            threeState: false,
            /**
             * @cfg {String} Текст подписи флага
             * @translatable
             */
            textValue : '',
            contentTemplate: null
         }
      },

      _modifyOptions: function() {
         var options = CheckBox.superclass._modifyOptions.apply(this, arguments);
         options.contentTemplate = options.contentTemplate || defaultContentTemplate;

         return options;
      },

      $constructor: function() {
         this._checkBoxCaption = $('.js-controls-CheckBox__caption', this._container);
         this._options.checked = prepareChecked(this._options.checked, this._options.threeState);
         if (this._options.checked) {
            this._options.textValue = this._options.caption;
         }
      },
      /**
       * Установить текст подписи флага.
       * @param {String} captionTxt Текст подписи флага.
       * @example
       * Из массива names установить подписи каждому флагу.
       * <pre>
       *    //names - массив с названиями товаров
       *    //flags - массив объектов-флагов
       *    $ws.helpers.forEach(names, function(name, index) {
      *       flags[index].setCaption(name);
      *    });
       * </pre>
       */
      setCaption: function(captionTxt){
         CheckBox.superclass.setCaption.call(this,captionTxt);
         if (captionTxt) {
            this._checkBoxCaption.html(captionTxt).removeClass('controls-CheckBox__caption_empty');
            if (this._options.checked) {
               this._options.textValue = this._options.caption;
            }
         }
         else {
            this._checkBoxCaption.html('&nbsp;').addClass('controls-CheckBox__caption_empty');
            this._options.textValue = '';
         }
      },

      /**
       * Возвращает текстовое значение контрола
       * @returns {String}
       */
      getTextValue: function() {
         return this._options.textValue;
      },

      _keyboardHover: function(e) {
         if (e.which === constants.key.space) {
            this.setChecked(!this.isChecked());
         }
         return false;
      },

      /**
       * Устанавливает состояние кнопки.
       * @param {Boolean} flag Признак состояния кнопки: true/false, и возможно null при включённой опции {@link threeState}.
       * @example
       * <pre>
       *     var btn = this.getChildControlByName(("myButton");
       *        btn.setChecked(true);
       * </pre>
       * @see threeState
       * @see checked
       * @see isChecked
       * @see setValue
       */
      setChecked: function(flag) {
         this._options.checked = prepareChecked(flag, this._options.threeState);
         if (this._options.checked) {
            this._options.textValue = this._options.caption;
         }
         else {
            this._options.textValue = '';
         }
         this._container.toggleClass('controls-Checked__checked', !!this._options.checked);
         this._container.toggleClass('controls-ToggleButton__null', !!(this._options.threeState && this._options.checked == null));
         this.validate();
         this._notify('onCheckedChange', this._options.checked);
         this._notifyOnPropertyChanged('checked');
      },

      _changeCheckedByClick: function() {
         if (!this._options.threeState) {
            this.setChecked(!(this.isChecked()));
         } else {
            if (this._options.checked === false){
               this.setChecked(true);
            } else
            if (this._options.checked === true){
               this.setChecked(null);
            } else  {
               this.setChecked(false);
            }
         }
      }

   });

   return CheckBox;

});