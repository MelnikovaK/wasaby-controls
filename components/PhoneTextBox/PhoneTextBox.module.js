define('js!SBIS3.CONTROLS.PhoneTextBox', ['js!SBIS3.CONTROLS.FormattedTextBox', 'tmpl!SBIS3.CONTROLS.PhoneTextBox', 'Core/detection', 'css!SBIS3.CONTROLS.PhoneTextBox'], function(FormattedTextBoxBase, dotTpl, detection) {

   'use strict';

   /**
    * Класс контрола, отображающий ссылку, при нажатии на которую произойдет звонок.
    * @class SBIS3.CONTROLS.PhoneTextBox
    * @extends SBIS3.CONTROLS.FormattedTextBox
    * @description
    * Пример:
    * <pre>
    *    <ws:SBIS3.CONTROLS.PhoneTextBox enabled="{{false}}" srcText="88005553535" mask="ddd-(ddd)-dd-dd"/>
    * </pre>
    * В примере использованы опции:
    * enabled - задает отображение PhoneTextBox в виде ссылки, по умолчанию PhoneTextBox отображается как поле ввода,
    * srcText - задает телефонный номер,
    * mask    - задает формат отображения телефонного номера,
    *
    * @demo SBIS3.CONTROLS.Demo.PagePhoneTextBox
    *
    * @author Крайнов Дмитрий Олегович
    *
    * @ignoreOptions independentContext contextRestriction extendedTooltip validators
    * @ignoreOptions element linkedContext handlers parent autoHeight autoWidth horizontalAlignment
    * @ignoreOptions isContainerInsideParent owner stateKey subcontrol verticalAlignment
    *
    * @ignoreMethods activateFirstControl activateLastControl addPendingOperation applyEmptyState applyState clearMark
    * @ignoreMethods changeControlTabIndex destroyChild detectNextActiveChildControl disableActiveCtrl findParent
    * @ignoreMethods focusCatch getActiveChildControl getChildControlById getChildControlByName getChildControls
    * @ignoreMethods getClassName getContext getEventBusOf getEventHandlers getEvents getExtendedTooltip getOpener
    * @ignoreMethods getImmediateChildControls getLinkedContext getNearestChildControlByName getOwner getOwnerId
    * @ignoreMethods getReadyDeferred getStateKey getTabindex getUserData getValue hasActiveChildControl hasChildControlByName
    * @ignoreMethods hasEventHandlers isActive isAllReady isDestroyed isMarked isReady makeOwnerName setOwner setSize
    * @ignoreMethods markControl moveFocus moveToTop once registerChildControl registerDefaultButton saveToContext
    * @ignoreMethods sendCommand setActive setChildActive setClassName setExtendedTooltip setOpener setStateKey activate
    * @ignoreMethods setTabindex setTooltip setUserData setValidators setValue storeActiveChild subscribe unregisterChildControl
    * @ignoreMethods unregisterDefaultButton unsubscribe validate waitAllPendingOperations waitChildControlById waitChildControlByName
    *
    * @ignoreEvents onActivate onAfterLoad onAfterShow onBeforeControlsLoad onBeforeLoad onBeforeShow onChange onClick
    * @ignoreEvents onFocusIn onFocusOut onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
    * @ignoreEvents onDragIn onDragStart onDragStop onDragMove onDragOut
    *
    * @cssModifier controls-Button__ellipsis При нехватке ширины текст на кнопке оборвётся многоточием.
    * !Важно: при добавлении этого класса сломается "Базовая линия".
    *
    * @css controls-Link__icon Класс для изменения отображения иконки кнопки.
    *
    * @public
    * @control
    * @category Button
    * @initial
    * <component data-component='SBIS3.CONTROLS.PhoneTextBox'>
    *    <option name='srcText' value='8800200600'></option>
    * </component>
    */
   var getSrcText = function(fullText) {
      var digits = fullText.replace(/[^0-9]/g, '');
      digits = '+' + digits;
      return digits;
   },

   getFullText = function(srcText, model) {
      var item, fullText = '';
      if (srcText.charAt(0) == '+') {
         srcText = srcText.substring(1);
      }
      for (var i = 0; i < model.length; i++) {
         item = model[i];
         if (item.isGroup) {
            fullText += srcText.substr(0, item.innerMask.length);
            srcText = srcText.substring(item.innerMask.length);
         } else {
            fullText += item.innerMask;
         }
      }
      return fullText;
   },
   getFirstEmptyPosition = function() {
      var
         i, j,
         model = this._getFormatModel().model;

      for (i = 0; i < model.length; i++) {
         if (model[i].isGroup) {
            for (j = 0; j < model[i].mask.length; j++) {
               if (model[i].value[j] === undefined) {
                  return [i, j];
               }
            }
         }
      }
   };

   var PhoneTextBox = FormattedTextBoxBase.extend( /** @lends SBIS3.CONTROLS.PhoneTextBox.prototype */ {
      _dotTplFn: dotTpl,
      $protected: {
         _options: {
            /**
             * @cfg {String} Устанавливает номер телефона без символов-разделителей
             * Номер будет отображен в соответствии с установленной {@link mask маской}
             * @example
             * <pre>
             *     <ws:SBIS3.CONTROLS.PhoneTextBox srcText="88001002424" />
             * </pre>
             * @see mask
             * @see getSrcText
             * @see setSrcText
             */
            srcText: undefined,
            /**
             * @cfg {String} Устанавливает маску, в соответствии с которой будет отображен телефонный номер
             * Символы, которые задают маску:
             * <ul>
             *    <li>L - заглавная буква (русский/английский алфавит),</li>
             *    <li>l - строчная буква,</li>
             *    <li>d - цифра,</li>
             *    <li>x - буква или цифра,</li>
             *    <li>все остальные символы являются разделителями.</li>
             * </ul>
             *
             * @example
             * <pre>
             *     mask: 'ddd-dd-dddd/dd'
             * </pre>
             * @see srcText
             */
            mask: '+d(ddd)ddd-dd-dd'
         }
      },

      _modifyOptions : function(cfg) {
         var formatModel = cfg._createModel(cfg._controlCharactersSet, cfg.mask);
         if (cfg.srcText) {
            cfg.text = getFullText(cfg.srcText, formatModel.model);
            if (cfg.srcText.charAt(0) !== '+') {
               cfg.srcText = '+' + cfg.srcText;
            }
         } else if (cfg.text) {
            cfg.srcText = getSrcText(cfg.text);
         } else {
            cfg.text = formatModel.getText(cfg._maskReplacer);
         }

         return PhoneTextBox.superclass._modifyOptions.apply(this, arguments);
      },

      _updateText: function() {
         PhoneTextBox.superclass._updateText.apply(this, arguments);
         this._options.srcText = getSrcText(this.getText());
         $('.controls-PhoneTextBox__link', this._container.get(0))
            .text(this.getText())
            .attr('href', 'tel:' + this._options.srcText);
      },

      _updateTextFromModel: function() {
         var formatModel = this._getFormatModel();
         this._options.text = formatModel.getText(this._getMaskReplacer());
      },

      _focusHandler: function() {
         var
            self = this,
            position = getFirstEmptyPosition.call(this);
         if (position) {
            self._moveCursor.apply(self, position);
            //chrome и safari не перемещают курсор если это делать синхронно в момент фокуса
            //https://stackoverflow.com/questions/21881509/how-to-set-cursor-position-at-the-end-of-input-text-in-google-chrome
            if (detection.chrome || detection.safari) {
               setTimeout(function () {
                  self._moveCursor.apply(self, position);
               }, 0);
            }
         } else {
            PhoneTextBox.superclass._focusHandler.apply(this, arguments);
         }
      },
      /**
       * Получает текстовое значение поля ввода телефонного номера
       * @returns {*|srcText|string}
       * @example
       * <pre>
       *     myComponent.subscribe('onTextChange', function(){
       *        myPhone.getSrcText();
       *     });
       * </pre>
       * @see srcText
       * @see setSrcText
       */
      getSrcText: function() {
         return this._options.srcText;
      },
      /**
       * Устанавливает текстовое значение поля ввода телефонного номера
       * @param srcText
       * @example
       * <pre>
       *     myComponent.subscribe('onClick', function(){
       *        myPhone.setSrcText("88001002424");
       *     });
       * </pre>
       * @see srcText
       * @see getSrcText
       */
      setSrcText: function(srcText) {
         this._options.srcText = srcText;
         this.setText(getFullText(srcText, this._getFormatModel().model));
      }
   });

   return PhoneTextBox;

});