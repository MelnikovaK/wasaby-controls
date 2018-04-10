define('Controls/Popup/Opener/BaseController',
   [
      'Core/core-extend',
      'Core/Deferred'
   ],
   function(CoreExtend, cDeferred) {
      var CONTENT_SELECTOR = '.ws-Container__popup-scrolling-content';

      var _private = {

         /*
          * Вернуть размеры контента
          * */
         getContentSizes: function(container) {
            var content = container.querySelector(CONTENT_SELECTOR) || container.firstChild;

            return {
               width: content.scrollWidth,
               height: content.scrollHeight
            };
         },
         getMargins: function(config, container) {
            container.style.margin = ''; //todo
            var style = container.currentStyle || window.getComputedStyle(container);
            var margins = {
               top: parseInt(style.marginTop, 10),
               left: parseInt(style.marginLeft, 10)
            };
            container.style.margin = 0;
            return margins;
         }
      };

      /**
       * Базовая стратегия
       * @category Popup
       * @class Controls/Popup/Opener/BaseController
       * @author Лощинин Дмитрий
       */
      var BaseController = CoreExtend.extend({

         /**
          * Добавление нового элемента
          * @function Controls/Popup/Opener/BaseController#elementCreated
          * @param element
          * @param container
          */
         elementCreated: function(element, container) {

         },

         /**
          * Обновление размеров элемента
          * @function Controls/Popup/Opener/BaseController#elementUpdated
          * @param element
          * @param container
          */
         elementUpdated: function(element, container) {

         },

         /**
          * Удаление элемента
          * @function Controls/Popup/Opener/BaseController#elementDestroyed
          * @param element
          */
         elementDestroyed: function(element) {
            return new cDeferred().callback();
         },
         getDefaultPosition: function() {
            return {
               top: -10000,
               left: -10000
            };
         },
         _getPopupSizes: function(config, container) {
            var sizes = _private.getContentSizes(container);
            return {
               width: sizes.width,
               height: sizes.height,
               margins: _private.getMargins(config, container)
            };
         }
      });
      return BaseController;
   }
);
