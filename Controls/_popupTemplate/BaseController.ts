import CoreExtend = require('Core/core-extend');
import Deferred = require('Core/Deferred');
import Utils = require('Types/util');
import {Controller as ManagerController} from 'Controls/popup';

let _fakeDiv;

      var _private = {

         getContentSizes: function(container) {
            return {
               width: container.offsetWidth,
               height: container.offsetHeight
            };
         },
         getMargins: function(config) {
            // If the classes have not changed, then the indents remain the same
            if (config.className === config.popupOptions.className) {
               if (!config.margins) {
                  config.margins = {
                     top: 0,
                     left: 0
                  };
               }
            } else {
               config.className = config.popupOptions.className;
               config.margins = _private.getFakeDivMargins(config);
            }

            return {
               top: config.margins.top,
               left: config.margins.left
            };
         },

         /**
          * Creates fake div to calculate margins.
          * Element is created with position absolute and far beyond the screen left position
          */
         getFakeDiv: function() {
            // create fake div on invisible part of window
            if (!_fakeDiv) {
               _fakeDiv = document.createElement('div');
               _fakeDiv.style.position = 'absolute';
               _fakeDiv.style.left = '-1000px';
               _fakeDiv.style.top = '-1000px';
               document.body.appendChild(_fakeDiv);
            }
            return _fakeDiv;
         },

         getFakeDivMargins: function(config) {
            if (!document) {
               return {
                  left: 0,
                  top: 0
               };
            }

            const fakeDiv = _private.getFakeDiv();
            fakeDiv.className = config.popupOptions.className;

            const styles = fakeDiv.currentStyle || window.getComputedStyle(fakeDiv);
            return {
               top: parseInt(styles.marginTop, 10),
               left: parseInt(styles.marginLeft, 10)
            };
         },

         // Get manager Controller dynamically, it cannot be loaded immediately due to cyclic dependencies
         getManagerController: function() {
            return require('Controls/popup').Controller;
         }
      };

      /**
       * Base Popup Controller
       * @category Popup
       * @class Controls/_popupTemplate/BaseController
       * @author Красильников А.С.
       */
      var BaseController = CoreExtend.extend({

         _elementCreated: function(item, container) {
            if (this._checkContainer(item, container, 'elementCreated')) {
               item.popupState = BaseController.POPUP_STATE_CREATED;
               return this.elementCreated.apply(this, arguments);
            }
         },

         /**
          * Adding a new popup
          * @function Controls/_popupTemplate/BaseController#elementCreated
          * @param element
          * @param container
          */
         elementCreated: function(element, container) {

         },

         _elementUpdated: function(item, container) {
            if (this._checkContainer(item, container, 'elementUpdated')) {
               if (item.popupState === BaseController.POPUP_STATE_CREATED || item.popupState === BaseController.POPUP_STATE_UPDATED || item.popupState === BaseController.POPUP_STATE_UPDATING) {
                  item.popupState = BaseController.POPUP_STATE_UPDATING;
                  this.elementUpdated.apply(this, arguments);
                  return true;
               }
            }
            return false;
         },

         pageScrolled(item, container): boolean {
            return this._elementUpdated(item, container);
         },

         /**
          * Updating popup
          * @function Controls/_popupTemplate/BaseController#elementUpdated
          * @param element
          * @param container
          */
         elementUpdated: function(element, container) {

         },

         elementMaximized: function(element, state) {

         },

         _elementAfterUpdated: function(item, container) {
            if (this._checkContainer(item, container, 'elementAfterUpdated')) {
               // We react only after the update phase from the controller
               if (item.popupState === BaseController.POPUP_STATE_UPDATING) {
                  item.popupState = BaseController.POPUP_STATE_UPDATED;
                  return this.elementAfterUpdated.apply(this, arguments);
               }
            }
            return false;
         },

         elementAfterUpdated: function(element, container) {

         },

         _elementDestroyed: function(item, container) {
            if (item.popupState === BaseController.POPUP_STATE_INITIALIZING) {
               return (new Deferred()).callback();
            }
            if (item.popupState === BaseController.POPUP_STATE_DESTROYED || item.popupState === BaseController.POPUP_STATE_DESTROYING) {
               return item._destroyDeferred;
            }

            if (item.popupState !== BaseController.POPUP_STATE_DESTROYED) {
               item.popupState = BaseController.POPUP_STATE_DESTROYING;
               item._destroyDeferred = this.elementDestroyed.apply(this, arguments);
               return item._destroyDeferred.addCallback(function() {
                  item.popupState = BaseController.POPUP_STATE_DESTROYED;
               });
            }
            return (new Deferred()).callback();
         },

         /**
          * Removing popup
          * @function Controls/_popupTemplate/BaseController#elementDestroyed
          * @param element
          */
         elementDestroyed: function(element) {
            return (new Deferred()).callback();
         },
         popupDeactivated: function(item) {
            var ManagerController = _private.getManagerController();
            if (item.popupOptions.closeOnOutsideClick && ManagerController) {
               ManagerController.remove(item.id);
            }
         },

         popupDragStart: function(item, offset) {

         },

         popupDragEnd: function(item) {

         },

         popupMouseEnter: function() {

         },

         popupMouseLeave: function() {

         },

         popupResize: function(element, container) {
            return this._elementUpdated(element, container);
         },

         elementAnimated: function() {

         },

         getDefaultConfig: function(item) {
            item.position = {
               top: -10000,
               left: -10000,
               maxWidth: item.popupOptions.maxWidth,
               minWidth: item.popupOptions.minWidth,
               maxHeight: item.popupOptions.maxHeight,
               minHeight: item.popupOptions.minHeight
            };
         },

         needRecalcOnKeyboardShow: function() {
            return false;
         },

         needRestoreFocus: function() {
            return true;
         },

         getCustomZIndex: function() {
            return null;
         },

         _getPopupSizes: function(config, container) {
            var containerSizes = _private.getContentSizes(container);

            config.sizes = {
               width:  config.popupOptions.width || containerSizes.width,
               height: config.popupOptions.height || containerSizes.height,

               // Optimization: to consider the styles on each update is expensive
               margins: _private.getMargins(config, container)
            };
            return config.sizes;
         },
         _getPopupContainer: function(id) {
            const popupContainer = ManagerController.getContainer();
            const item = popupContainer && popupContainer._children[id];
            let container = item && item._container;// todo https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
            if (container && container.jquery) {
               container = container[0];
            }
            return container;
         },
         _checkContainer: function(item, container, stage) {
            if (!container) {
               // if popup has initializing state then container doesn't created yet
               if (item.popupState !== BaseController.POPUP_STATE_INITIALIZING) {
                  Utils.logger.error(this._moduleName, 'Error when building the template ' + item.popupOptions.template + ' on stage ' + stage);
               }
               return false;
            }
            return true;
         },
         _private: _private
      });

      BaseController.prototype.POPUP_STATE_INITIALIZING = BaseController.POPUP_STATE_INITIALIZING = 'initializing';
      BaseController.prototype.POPUP_STATE_CREATING = BaseController.POPUP_STATE_CREATING = 'creating';
      BaseController.prototype.POPUP_STATE_CREATED = BaseController.POPUP_STATE_CREATED = 'created';
      BaseController.prototype.POPUP_STATE_UPDATING = BaseController.POPUP_STATE_UPDATING = 'updating';
      BaseController.prototype.POPUP_STATE_UPDATED = BaseController.POPUP_STATE_UPDATED = 'updated';
      BaseController.prototype.POPUP_STATE_DESTROYING = BaseController.POPUP_STATE_DESTROYING = 'destroying';
      BaseController.prototype.POPUP_STATE_DESTROYED = BaseController.POPUP_STATE_DESTROYED = 'destroyed';
      export = BaseController;

