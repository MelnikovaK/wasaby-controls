define('Controls/Container/Scroll/ScrollWidthController',
   [
      'Core/detection',
      'Core/compatibility'
   ],
   function(detection, compatibility) {

      'use strict';

      var _private = {
         /**
          * Расчет ширины нативного скролла с помощью вспомогательного контейнера.
          * @return {number}
          */
         calcScrollbarWidthByMeasuredBlock: function() {
            var scrollbarWidth, measuredBlock;

            measuredBlock = document.createElement('div');
            measuredBlock.className = 'controls-Scroll__measuredBlock';
            document.body.appendChild(measuredBlock);
            scrollbarWidth = measuredBlock.offsetWidth - measuredBlock.clientWidth;
            document.body.removeChild(measuredBlock);

            return scrollbarWidth;
         },

         /**
          * Расчет ширины нативного скролла.
          * @param userAgent
          * @param detection
          * @return {number}
          */
         calcScrollbarWidth: function(userAgent, detection) {
            var scrollbarWidth;
            /**
             * В браузерах с поддержкой ::-webkit-scrollbar установлена ширина 0.
             * Определяем не с помощью Core/detection, потому что в нем считается, что chrome не на WebKit.
             */
            if (~userAgent.indexOf('AppleWebKit')) {
               scrollbarWidth = 0;
            } else if (detection.isIE12) {
               scrollbarWidth = 16;
            } else if (detection.isIE10 || detection.isIE11) {
               scrollbarWidth = 17;
            } else {
               scrollbarWidth = _private.calcScrollbarWidthByMeasuredBlock();
            }

            return scrollbarWidth;
         },

         /**
          * Расчет css стиля для скрытия нативного скролла.
          * @param scrollbarWidth
          * @param detection
          * @param compatibility
          * @return {string}
          */
         calcStyleHideScrollbar: function(scrollbarWidth, detection, compatibility) {
            var style;

            if (scrollbarWidth) {
               style = 'margin-right: -' + scrollbarWidth + 'px;';

               // На планшете c OS Windown 10 для скрытия нативного скролла, кроме margin требуется padding.
               if (compatibility.touch && detection.isIE) {
                  style += 'padding-right: ' + scrollbarWidth + 'px;';
               }
            } else {
               style = '';
            }

            return style;
         },

         calcStyleHideScrollbarFn: function(detection, compatibility) {
            var styleHideScrollbarFn;

            if (detection.firefox) {
               styleHideScrollbarFn = function() {
                  var scrollbarWidth = _private.calcScrollbarWidthByMeasuredBlock();

                  return _private.calcStyleHideScrollbar(scrollbarWidth, detection, compatibility);
               };
            } else {
               styleHideScrollbarFn = function() {
                  var scrollbarWidth;

                  if (!_private.styleHideScrollbar) {
                     scrollbarWidth = _private.calcScrollbarWidth(navigator.userAgent, detection);

                     _private.styleHideScrollbar = _private.calcStyleHideScrollbar(scrollbarWidth, detection, compatibility);
                  }

                  return _private.styleHideScrollbar;
               };
            }

            return styleHideScrollbarFn;
         }
      };

      return {
         _private: _private,

         calcStyleHideScrollbar: _private.calcStyleHideScrollbarFn(detection, compatibility)
      }
   }
);