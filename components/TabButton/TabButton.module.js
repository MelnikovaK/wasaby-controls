/**
 * Модуль 'Компонент кнопка'.
 *
 * @description
 */
define('js!SBIS3.CONTROLS.TabButton', ['js!SBIS3.CONTROLS.RadioButtonBase', 'html!SBIS3.CONTROLS.TabButton'], function(RadioButtonBase, dotTplFn) {

   'use strict';
   /**
    * Контрол, отображающий корешок закладки. Работает только в составе группы. В джине не вытаскивается
    * @class SBIS3.CONTROLS.TabButton
    * @extends SBIS3.CONTROLS.RadioButtonBase
    * @control
    * @category Containers
    */
   var TabButton = RadioButtonBase.extend( /** @lends SBIS3.CONTROLS.TabButton.prototype */ {
      _dotTplFn : dotTplFn,
      $protected: {
         _options: {

         }
      },

      $constructor: function() {

      }

   });

   return TabButton;

});