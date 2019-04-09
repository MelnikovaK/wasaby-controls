import Control = require('Core/Control');
import collection = require('Types/collection');
import template = require('wml!Controls/Popup/Manager/Container');
import ManagerController = require('Controls/Popup/Manager/ManagerController');
import 'css!theme?Controls/Popup/Manager/Container';
      

      // step zindex between popups. It should be enough to place all the additional popups (menu, infobox, suggest) on the main popups (stack, window)
      var POPUP_ZINDEX_STEP = 10;

      var Container = Control.extend({

         /**
          * Container for displaying popups
          * @class Controls/Popup/Manager/Container
          * @extends Core/Control
          * @control
          * @private
          * @category Popup
          * @author Красильников А.С.
          */

         _template: template,
         _overlayId: null,
         _zIndexStep: POPUP_ZINDEX_STEP,
         _popupItems: null,
         _beforeMount: function() {
            this._popupItems = new collection.List();
         },
         _afterMount: function() {
            ManagerController.setContainer(this);
         },

         /**
          * Set the index of popup, under which the overlay will be drawn
          * @function Controls/Popup/Manager/Container#setPopupItems
          * @param {Integer} index индекс попапа
          */
         setOverlay: function(index) {
            this._overlayId = index;
         },

         /**
          * Set a new set of popups
          * @function Controls/Popup/Manager/Container#setPopupItems
          * @param {List} popupItems new popup set
          */
         setPopupItems: function(popupItems) {
            this._popupItems = popupItems;
            this._forceUpdate();
         },

         getPopupById: function(id) {
            return this._children[id];
         },

         activatePopup: function(id) {
            var popup = this.getPopupById(id);
            if (popup) {
               popup.activatePopup();
            }
         },

         getPendingById: function(id) {
            return this._children[id + '_registrator'];
         },

         _popupDeactivated: function(event, popupId, data) {
            this._notify('popupDeactivated', [popupId, data], { bubbling: true });
         },

         _popupActivated: function(event, popupId, data) {
            this._notify('popupActivated', [popupId, data], { bubbling: true });
         },

         _overlayClickHandler: function(event) {
            event.preventDefault();
         },

         _getPopupZIndex: function(item, index) {
            var customZIndex = item.controller.getCustomZIndex(this._popupItems);
            return item.popupOptions.zIndex || customZIndex || (index + 1) * POPUP_ZINDEX_STEP;
         }
      });

      // To calculate the zIndex in a compatible notification Manager
      Container.POPUP_ZINDEX_STEP = POPUP_ZINDEX_STEP;
      export = Container;
   
