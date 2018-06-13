define('Controls/Popup/Opener/Stack/StackController',
   [
      'Controls/Popup/Opener/BaseController',
      'Controls/Popup/Opener/Stack/StackStrategy',
      'WS.Data/Collection/List',
      'Controls/Popup/TargetCoords',
      'Core/Deferred',
      'Core/constants',
      'css!Controls/Popup/Opener/Stack/Stack'
   ],
   function(BaseController, StackStrategy, List, TargetCoords, Deferred, cConstants) {
      'use strict';


      var _private = {

         prepareSizes: function(item, container) {
            var templateStyle = getComputedStyle(container.children[0]);
            if (!item.popupOptions.minWidth) {
               item.popupOptions.minWidth = parseInt(templateStyle.minWidth, 10);
            }
            if (!item.popupOptions.maxWidth) {
               item.popupOptions.maxWidth = parseInt(templateStyle.maxWidth, 10);
            }

            //Если задано одно значение - приравниваем minWidth и maxWidth
            item.popupOptions.minWidth = item.popupOptions.minWidth || item.popupOptions.maxWidth;
            item.popupOptions.maxWidth = item.popupOptions.maxWidth || item.popupOptions.minWidth;

            if (item.popupOptions.maxWidth < item.popupOptions.minWidth) {
               item.popupOptions.maxWidth = item.popupOptions.minWidth;
            }

            item.containerWidth = container.getElementsByClassName('controls-Popup__template')[0].offsetWidth; //Берем размеры пользовательского шаблона
         },

         getStackParentCoords: function() {
            var elements = document.getElementsByClassName('controls-Popup__stack-target-container');
            var targetCoords = TargetCoords.get(elements && elements.length ? elements[0] : document.body);

            return {
               top: targetCoords.top,
               right: window.innerWidth - targetCoords.right
            };
         },
         elementDestroyed: function(instance, element) {
            instance._stack.remove(element);
            instance._update();
            instance._destroyDeferred.callback();
         }
      };

      /**
       * Контроллер стековых панелей.
       * @class Controls/Popup/Opener/Stack/StackController
       * @control
       * @private
       * @category Popup
       */

      var StackController = BaseController.extend({
         _destroyDeferred: undefined,
         constructor: function(cfg) {
            StackController.superclass.constructor.call(this, cfg);
            this._stack = new List();
            _private.elementDestroyed.bind(this);
         },

         elementCreated: function(item, container) {
            _private.prepareSizes(item, container);
            this._stack.add(item, 0);
            this._update();
         },

         elementUpdated: function(item, container) {
            _private.prepareSizes(item, container);
            this._update();
         },

         elementDestroyed: function(element, container) {
            this._destroyDeferred = new Deferred();
            if (cConstants.browser.chrome && !cConstants.browser.isMobilePlatform) {
               this._getTemplateContainer(container).classList.add('controls-Stack_hide');
            } else {
               _private.elementDestroyed(this, element);
            }
            return this._destroyDeferred;
         },

         elementAnimated: function(element, container) {
            var templateContainer = this._getTemplateContainer(container);
            if (templateContainer.classList.contains('controls-Stack_hide')) {
               _private.elementDestroyed(this, element);
            }
         },

         _update: function() {
            var self = this;
            this._stack.each(function(item, index) {
               item.position = self._getItemPosition(index);
            });
         },

         _getItemPosition: function(index) {
            var tCoords = _private.getStackParentCoords();
            var item = this._stack.at(index);
            return StackStrategy.getPosition(tCoords, item);
         },
         _getTemplateContainer: function(container) {
            return container.getElementsByClassName('controls-Popup__template')[0];
         }
      });

      return new StackController();
   }
);
