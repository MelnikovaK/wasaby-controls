/**
 * Модуль 'Компонент кнопка'.
 *
 * @description
 */
define('SBIS3.CONTROLS/Radio/Button/RadioButtonBase', ['js!WSControls/Buttons/ButtonBase', 'SBIS3.CONTROLS/Mixins/Checkable'], function(WSButtonBase, Checkable) {

   'use strict';

   /**
    * Поведенческий класс, определяющий поведение одной(!!) радиокнопки. Нельзя использовать как отдельный контрол.
    * Работает только в составе группы радиокнопок.
    * При клике, если состояние не checked, то проставить true, иначе ничего не делать.
    * @class SBIS3.CONTROLS/Radio/Button/RadioButtonBase
    * @extends WSControls/Buttons/ButtonBase
    *
    * @public
    *
    * @mixes SBIS3.CONTROLS/Mixins/Checkable
    *
    * @author Крайнов Дмитрий Олегович
    */

   var RadioButtonBase = WSButtonBase.extend([Checkable], /** @lends SBIS3.CONTROLS/Radio/Button/RadioButtonBase.prototype */ {
      $protected: {
         _options: {

         }
      },

      $constructor: function() {

      },

      _clickHandler : function() {
         if (!this._checked){
            this.setChecked(true);
         }
      }

   });

   return RadioButtonBase;

});