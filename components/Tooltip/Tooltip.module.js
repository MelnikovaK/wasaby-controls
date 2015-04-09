/**
 * Created by iv.cheremushkin on 12.08.2014.
 */

define('js!SBIS3.CONTROLS.Tooltip', ['js!SBIS3.CORE.Control'], function(Control) {

   'use strict';

   /**
    * Всплывающая подсказка.
    * @class SBIS3.CONTROLS.Tooltip
    * @extends $ws.proto.Control
    * @mixes SBIS3.CONTROLS.PopupMixin
    * @public
    */

   var Tooltip = Control.Control.extend( /** @lends SBIS3.CONTROLS.Tooltip.prototype*/ {
      $protected: {
         _options: {
            /**
             * @cfg {String}  Текст на кнопке
             */
            text: ''
         }
      },

      $constructor: function() {

      }
   });

   return Tooltip;

});