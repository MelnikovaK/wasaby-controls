define('Controls/Popup/Opener/BaseController',
   [
      'Core/core-extend',
      'Core/Deferred',
      'WS.Data/Utils'
   ],
   function(CoreExtend, Deferred, Utils) {
      var _private = {

         /*
          * Вернуть размеры контента
          * */
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
               return config.margins;
            }
            config.className = config.popupOptions.className;

            var style = _private.getFakeDivStyles(config);

            config.margins = {
               top: parseInt(style.marginTop, 10),
               left: parseInt(style.marginLeft, 10)
            };
            return config.margins;
         },

         getFakeDivStyles: function(config) {
            if (!document) {
               return {
                  marginLeft: 0,
                  marginTop: 0
               };
            }

            // create fakeDiv for calculate margins
            var fakeDiv = document.createElement('div');
            fakeDiv.className = config.popupOptions.className;
            document.body.appendChild(fakeDiv);

            var sizes = fakeDiv.currentStyle || window.getComputedStyle(fakeDiv);
            document.body.removeChild(fakeDiv);
            return sizes;
         },

         // Get manager Controller dynamically, it cannot be loaded immediately due to cyclic dependencies
         getManagerController: function() {
            if (requirejs.defined('Controls/Popup/Manager/ManagerController')) {
               return requirejs('Controls/Popup/Manager/ManagerController');
            }
         }
      };

      /**
       * Базовая стратегия
       * @category Popup
       * @class Controls/Popup/Opener/BaseController
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
          * Добавление нового элемента
          * @function Controls/Popup/Opener/BaseController#elementCreated
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

         /**
          * Обновление размеров элемента
          * @function Controls/Popup/Opener/BaseController#elementUpdated
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
          * Удаление элемента
          * @function Controls/Popup/Opener/BaseController#elementDestroyed
          * @param element
          */
         elementDestroyed: function(element) {
            return (new Deferred()).callback();
         },
         popupDeactivated: function(item) {
            var ManagerController = _private.getManagerController();
            if (item.popupOptions.closeByExternalClick && ManagerController) {
               ManagerController.remove(item.id);
            }
         },

         popupDragStart: function(item, offset) {

         },

         popupDragEnd: function(item) {

         },

         getDefaultConfig: function(item) {
            item.position = {
               top: -10000,
               left: -10000
            };
         },

         needRecalcOnKeyboardShow: function() {
            return false;
         },

         _getPopupSizes: function(config, container) {
            var containerSizes = _private.getContentSizes(container);

            config.sizes = {
               width: config.popupOptions.maxWidth || containerSizes.width,
               height: config.popupOptions.maxHeight || containerSizes.height,

               // Optimization: to consider the styles on each update is expensive
               margins: _private.getMargins(config, container)
            };
            return config.sizes;
         },
         _checkContainer: function(item, container, stage) {
            if (!container) {
               // if popup has initializing state then container doesn't created yet
               if (item.popupState !== BaseController.POPUP_STATE_INITIALIZING) {
                  Utils.logger.error(this._moduleName, 'Ошибка при построении шаблона ' + item.popupOptions.template + ' на этапе ' + stage);
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
      return BaseController;
   });
