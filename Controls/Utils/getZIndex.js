/**
 * Created by as.krasilnikov on 29.10.2018.
 */
define('Controls/Utils/getZIndex', ['Core/helpers/isNewEnvironment'], function(isNewEnvironment) {

   'use strict';

   // z-index 110 обусловлен тем, что в контенте страницы могут лежать платформенные компоненты с
   // zindex: 100 (switchableArea в tabControl'e). Попытки ограничить контент z-index'a на OnlineBaseInnerMinCoreView
   // привели к другим ошибкам из-за неправильной верстки OnlineBaseInnerMinCoreView. Ошибка в том, что стековые панели
   // лежат в боди, а нестековые панели лежат внутри контента, т.к. там навешен класс ws-float-area-stack-root.
   // В 621 версию решаю на своей стороне и выписываю задачу, чтобы поправили в OnlineBaseInnerMinCoreView
   var ZINDEX_STEP = 110;

   return function getZIndex(instance) {
      if (document && !isNewEnvironment()) {
         var container = $(instance._container);
         var parentArea = container.closest('.controls-compoundAreaNew__floatArea, .ws-float-area-stack-cut-wrapper, .controls-Popup, .controls-FloatArea, .ws-window');
         if (parentArea.length) {
            return parseInt(parentArea.css('z-index'), 10) + ZINDEX_STEP;
         }
         return ZINDEX_STEP;
      }
      return undefined;
   };
});
