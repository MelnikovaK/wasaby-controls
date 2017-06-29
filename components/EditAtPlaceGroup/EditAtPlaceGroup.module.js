/**
 * Created by iv.cheremushkin on 18.11.2014.
 */
define('js!SBIS3.CONTROLS.EditAtPlaceGroup',
   ['js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CONTROLS.PickerMixin',
      'js!SBIS3.CONTROLS.EditAtPlace',
      'js!SBIS3.CONTROLS.EditAtPlaceMixin',
      'html!SBIS3.CONTROLS.EditAtPlaceGroup',
      'css!SBIS3.CONTROLS.EditAtPlaceGroup'],
   function (CompoundControl, PickerMixin, EditAtPlace, EditAtPlaceMixin, dotTplFn) {
      'use strict';
      /**
       * @class SBIS3.CONTROLS.EditAtPlaceGroup
       * @extends SBIS3.CORE.CompoundControl
       * @control
       * @public
       * @category Inputs
       *
       * @mixes SBIS3.CONTROLS.PickerMixin
       * @mixes SBIS3.CONTROLS.EditAtPlaceMixin
       *
       * @author Крайнов Дмитрий Олегович
       * @demo SBIS3.CONTROLS.Demo.MyEditAtPlace
       */

      var EditAtPlaceGroup = CompoundControl.extend([PickerMixin, EditAtPlaceMixin], /** @lends SBIS3.CONTROLS.EditAtPlaceGroup.prototype */{
         /**
          * @event onCancel Происходит при отмене сохранения изменений.
          * @param {Core/EventObject} eventObject Дескриптор события.
          * @remark
          * Выход из режима редактирования производится нажатием клавиши Esc или кнопки "Нет" в диалоге, который появляется при клике вне области редактирования.
          */
         /**
          * @event onApply Происходит при сохранении изменений.
          * @param {Core/EventObject} eventObject Дескриптор события.
          * @remark
          * Сохранение изменений производится нажатием клавиши "Enter" или кнопки "Да" в диалоге, который появляется при клике вне области редактирования.
          */
          /**
           * @event onShowEditor Происходит при переходе в режим редактирования.
           * @param {Core/EventObject} eventObject Дескриптор события.
           */
         _dotTplFn: dotTplFn,
         $protected: {
            _textField: null,
            _cancelButton: null,
            _okButton: null,
            _editorTpl: null,
            _requireDialog: false,
            _options: {
               /**
                * @cfg {Content} шаблон
                */
               template: null
            }
         },

         $constructor: function () {
            this._publish('onCancel', 'onApply', 'onShowEditor');
         },

         init: function(){
            EditAtPlaceGroup.superclass.init.call(this);
            var self = this;
            this.reviveComponents();
            if (this._options.displayAsEditor) {
               this.setInPlaceEditMode(true);
            }
            // всем EditAtPlace задаем свой обработчик клика
            this._iterateChildEditAtPlaces(function(child){
               child._setClickHandler(self._clickHandler.bind(self));
               child._setKeyPressHandler(self._keyPressHandler.bind(self));
               child._setEditInGroup();
               if ($(child._options.editorTpl).attr('data-component') == 'SBIS3.CONTROLS.TextArea'){
                  $(child._container.children()[0]).addClass('controls-EditAtPlace__textAreaWrapper');
               }
               child.subscribe('onTextChange', function(event, text){
                  self._requireDialog = text != child._oldText;
               });
            });
            if (!this._options.editInPopup){
               this.subscribe('onFocusOut', function(){
                  self._applyEdit();
               });
            }
         },

         _setPickerContent: function () {
            var self = this;
            this._picker._container.addClass('controls-EditAtPlaceGroup__editorOverlay');
            this._picker._container.bind('keydown', function (e) {
               self._keyPressHandler(e);
            });

            this._iterateChildEditAtPlaces(function(child){
               child._setEditInGroup();;
               child._setKeyPressHandler(self._keyPressHandler.bind(self));
            }, this._picker);
            this._addControlPanel(this._picker._container);
         },

         _iterateChildEditAtPlaces: function(func, parent){
            var children;
            if (!parent){
               children = this.getChildControls();
            } else {
               children = parent.getChildControls();
            }
            var eapIndex = 0;
            for (var i = 0; i < children.length; i++) {
               if (children[i] instanceof EditAtPlace) {
                  var res = func(children[i], eapIndex++);
                  if (res === false) {
                     break;
                  }
               }
            }
         },

         /**
          * Установить режим отображения
          * @param inPlace true - редактирвоание / false - отображение
          */
         setInPlaceEditMode: function (inPlace) {
            this._iterateChildEditAtPlaces(function(child){
               child.setInPlaceEditMode(inPlace);
            });
            if (inPlace) {
               this._notify('onShowEditor');
            }
         },

         _cancelEdit: function () {
            if (this._options.editInPopup) {
               this._requireDialog = false;
               this._picker.hide();
            } else {
               this._removeControlPanel();
               this.setInPlaceEditMode(false);
            }
            this._iterateChildEditAtPlaces(function (child) {
               child._setOldText();
            });
            this._deactivateActiveChildControl();
            this._notify('onCancel');
         },

         _getEditTemplate: function(){
            return this._options.template;
         },

         showPicker: function(){
            EditAtPlaceGroup.superclass.showPicker.call(this);
            var index = this._getActiveChildControlIndex();
            this._iterateChildEditAtPlaces(function(child, i){
               child.setInPlaceEditMode(true);
               if (i == index) {
                  child.setActive(true);
               }
            }, this._picker);
         },

         _getActiveChildControlIndex: function(){
            var index = 0;
            this._iterateChildEditAtPlaces(function(child, i){
               if (child.isActive()) {
                  index = i;
                  return false;
               }
            });
            return index;
         },

         _clickHandler: function (e) {
            if (this.isEnabled()) {
               e.stopPropagation();
               this._iterateChildEditAtPlaces(function (child) {
                  child._saveOldText();
               });
               if (this._options.editInPopup) {
                  this.showPicker();
               } else {
                  this.setInPlaceEditMode(true);
                  this._addControlPanel(this._container);
               }
            }
         },

         setEnabled: function(enabled){
            EditAtPlaceGroup.superclass.setEnabled.call(this, enabled);
            this._iterateChildEditAtPlaces(function(child){
               child.setEnabled(enabled);
            });
         }
      });

      return EditAtPlaceGroup;
   });