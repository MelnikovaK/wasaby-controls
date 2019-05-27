import Deferred = require('Core/Deferred');
import collection = require('Types/collection');
import BaseController = require('Controls/_popupTemplate/BaseController');
import NotificationStrategy = require('Controls/_popupTemplate/Notification/Opener/NotificationStrategy');
import NotificationContent = require('Controls/_popupTemplate/Notification/Opener/NotificationContent');
      var timeAutoClose = 5000;

      var _private = {
         setNotificationContent: function(item) {
            item.popupOptions.content = NotificationContent;
         },
         findItemById: function(popupItems, id) {
            let index = popupItems && popupItems.getIndexByValue('id', id);
            if (index > -1) {
               return popupItems.at(index);
            }
            return null;
         },
         isLinkedPopup(popupItems, parentItem, item):Boolean {
            while (item && item.parentId) {
               item = _private.findItemById(popupItems, item.parentId);
               if (item === parentItem) {
                  return true;
               }
            }
            return  false;
         }
      };

      /**
       * Notification Popup Controller
       * @class Controls/_popupTemplate/Notification/Opener/NotificationController
       * @control
       * @private
       * @category Popup
       * @extends Controls/_popupTemplate/BaseController
       */
      var NotificationController = BaseController.extend({
         constructor: function(cfg) {
            NotificationController.superclass.constructor.call(this, cfg);
            this._stack = new collection.List();
         },

         elementCreated: function(item, container) {
            item.height = container.offsetHeight;
            _private.setNotificationContent(item);
            this._stack.add(item, 0);
            this._updatePositions();
            if (item.popupOptions.autoClose) {
               this._closeByTimeout(item);
            }
         },

         elementUpdated: function(item, container) {
            _private.setNotificationContent(item);
            item.height = container.offsetHeight;
            this._updatePositions();
         },

         elementDestroyed: function(item) {
            this._stack.remove(item);
            this._updatePositions();

            NotificationController.superclass.elementDestroyed.call(item);

            return new Deferred().callback();
         },

         popupMouseEnter: function(item) {
            if (item.popupOptions.autoClose) {
               clearTimeout(item.closeId);
            }
         },

         popupMouseLeave: function(item) {
            if (item.popupOptions.autoClose) {
               this._closeByTimeout(item);
            }
         },

         _closeByTimeout: function(item) {
            item.closeId = setTimeout(function() {
               require('Controls/popup').Controller.remove(item.id);
            }, timeAutoClose);
         },

         getCustomZIndex(popupItems, item):Number {
            // Notification windows must be above all popup windows
            // will be fixed by https://online.sbis.ru/opendoc.html?guid=e6a136fc-be49-46f3-84d5-be135fae4761
            let count = popupItems.getCount();
            for (let i = 0; i < count; i++) {
               // if popups are linked, then notification must be higher then parent
               if (popupItems.at(i).popupOptions.maximize && !_private.isLinkedPopup(popupItems, popupItems.at(i), item)) {
                  let maximizedPopupZIndex = (i + 1) * 10;
                  return maximizedPopupZIndex - 1;
               }
            }
            return 100;
         },

         getDefaultConfig(item) {
            NotificationController.superclass.getDefaultConfig.apply(this, arguments);
            _private.setNotificationContent(item);
         },

         _updatePositions: function() {
            var height = 0;

            /**
             * In item.height is the height of the popup.
             * It takes into account the indentation between the notification popups,
             * specified in the template via css. This is done to support theming.
             */
            this._stack.each(function(item) {
               item.position = NotificationStrategy.getPosition(height);
               height += item.height;
            });
         }
      });

      export = new NotificationController();

