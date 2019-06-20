/**
 * Created by as.krasilnikov on 21.03.2018.
 */

   export = {

      /**
       * Returns popup position
       * @function Controls/_popupTemplate/Dialog/Opener/DialogStrategy#getPosition
       * @param windowData The parameters of the browser window
       * @param containerSizes Popup container sizes
       * @param item Popup configuration
       */
      getPosition: function(windowData, containerSizes, item) {
         var width, height, left, top, dif;

         if (item.dragged) {
            left = Math.max(0, item.position.left);
            top = Math.max(0, item.position.top);

            // check overflowX
            dif = (item.position.left + containerSizes.width) - windowData.width;
            left -= Math.max(0, dif);

            // check overflowY
            dif = (item.position.top + containerSizes.height) - windowData.height;
            top -= Math.max(0, dif);
            return {
               left: left,
               top: top,
               width: item.position.width,
               height: item.position.height
            };
         }

         var popupOptions = item.popupOptions;

         width = this._calculateValue(popupOptions, containerSizes.width, windowData.width, popupOptions.width);
         height = this._calculateValue(popupOptions, containerSizes.height, windowData.height, popupOptions.height);
         left = this._getLeftCoord(windowData.width, width || containerSizes.width);
         top = this._getTopCoord(windowData, height || containerSizes.height);

         return {
            width,
            height,
            maxHeight: Math.min(popupOptions.maxHeight || windowData.height, windowData.height),
            minHeight: popupOptions.minHeight,
            maxWidth: Math.min(popupOptions.maxWidth || windowData.width, windowData.width),
            minWidth: popupOptions.minWidth,
            left: left + (windowData.scrollLeft || 0),
            top: top + (windowData.scrollTop || 0)
         };
      },
      _calculateValue: function(popupOptions, containerValue, windowValue, popupValue) {
         if (popupValue) {
            return popupValue;
         } else if (popupOptions.maximize || containerValue > windowValue) {
            return windowValue;
         }
      },
      _getLeftCoord: function(wWidth, width) {
         return Math.max(Math.round((wWidth - width) / 2), 0);
      },

      _getTopCoord: function(windowData, height) {
         return Math.round((windowData.height - height) / 2);
      }
   };

