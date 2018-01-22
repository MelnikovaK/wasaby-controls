define('js!Controls/Popup/Manager/Container',
   [
      'Core/Control',
      'tmpl!Controls/Popup/Manager/Container',
      'WS.Data/Collection/List',
      'css!Controls/Popup/Manager/Container'
   ],
   function (Control, template, List) {
      'use strict';

      var Container = Control.extend({
         /**
          * Контейнер для отображения окон
          * @class Controls/Popup/Manager/Container
          * @extends Core/Control
          * @control
          * @private
          * @category Popup
          * @author Лощинин Дмитрий
          */

         _controlName: 'Controls/Popup/Manager/Container',
         _template: template,

         constructor: function (cfg) {
            Container.superclass.constructor.call(this, cfg);
            this._overlayId = null;
            this._popupItems = new List();
         },

         /**
          * Установить индекс попапа, под которым будет отрисован оверлей
          * @function Controls/Popup/Manager/Container#setPopupItems
          * @param {Integer} index индекс попапа
          */
         setOverlay: function(index){
            this._overlayId = index;
         },

         /**
          * Изменить набор окон
          * @function Controls/Popup/Manager/Container#setPopupItems
          * @param {List} popupItems новый набор окон
          */
         setPopupItems: function (popupItems) {
            this._popupItems = popupItems;
            this._forceUpdate();
         },

         /**
          * Закрыть попап
          * @function Controls/Popup/Manager/Container#_closePopup
          * @param event
          * @param id идентификатор попапа.
          */
         _closePopup: function (event, id) {
            if (this.eventHandlers && this.eventHandlers.onClosePopup) {
               this.eventHandlers.onClosePopup(event, id);
            }
         },

         /**
          * Обработчик на создание нового попапа
          * @function Controls/Popup/Manager/Container#_popupCreated
          * @param event
          * @param id идентификатор попапа.
          * @param width ширина попапа.
          * @param height высота попапа.
          */
         _popupCreated: function(event, id, width, height){
            if (this.eventHandlers && this.eventHandlers.onPopupCreated) {
               this.eventHandlers.onPopupCreated(event, id, width, height);
            }
         },

         /**
          * Обработчик на обновление попапа
          * @function Controls/Popup/Manager/Container#_popupUpdated
          * @param event
          * @param id идентификатор попапа.
          * @param width ширина попапа.
          * @param height высота попапа.
          */
         _popupUpdated: function(event, id, width, height){
            if (this.eventHandlers && this.eventHandlers.onPopupUpdated) {
               this.eventHandlers.onPopupUpdated(event, id, width, height);
            }
         },

         /**
          * Обработчик установки фокуса.
          * @function Controls/Popup/Manager/Container#_popupFocusIn
          * @param event
          * @param id идентификатор попапа.
          * @param focusedControl
          */
         _popupFocusIn: function(event, id, focusedControl){
            if (this.eventHandlers && this.eventHandlers.onPopupFocusIn) {
               this.eventHandlers.onPopupFocusIn(event, id, focusedControl);
            }
         },

         /**
          * Обработчик потери фокуса.
          * @function Controls/Popup/Manager/Container#_popupFocusOut
          * @param event
          * @param id идентификатор попапа.
          * @param focusedControl
          */
         _popupFocusOut: function(event, id, focusedControl){
            if (this.eventHandlers && this.eventHandlers.onPopupFocusOut) {
               this.eventHandlers.onPopupFocusOut(event, id, focusedControl);
            }
         },

         /**
          * Обработчик на отправку результат с попапа
          * @function Controls/Popup/Manager/Container#_popupCreated
          * @param event
          * @param id идентификатор попапа.
          * @param result
          */
         _result: function(event, id, result){
            if (this.eventHandlers && this.eventHandlers.onResult) {
               this.eventHandlers.onResult(event, id, result);
            }
         }
      });

      return Container;
   }
);