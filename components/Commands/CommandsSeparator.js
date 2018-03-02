/**
 * Модуль 'Компонент кнопка'.
 *
 * @description
 */
define('SBIS3.CONTROLS/Commands/CommandsSeparator', [
   'js!WSControls/Buttons/ButtonBase',
   'SBIS3.CONTROLS/Mixins/Checkable',
   'tmpl!SBIS3.CONTROLS/Commands/CommandsSeparator',
   'css!SBIS3.CONTROLS/Commands/CommandsSeparator'
], function(WSButtonBase, Checkable, dotTplFn) {

   'use strict';

   /**
    * Контрол, отображающий разделитель.
    * @class SBIS3.CONTROLS/Commands/CommandsSeparator
    * @extends WSControls/Buttons/ButtonBase
    * @author Крайнов Д.О.
    *
    * @mixes SBIS3.CONTROLS/Mixins/Checkable
    *
    * @public
    * @control
    * @category ButtonBase
    * @initial
    * <component data-component='SBIS3.CONTROLS/Commands/CommandsSeparator'>
    *    <option name='command' value='toggleHistory'></option>
    * </component>
    */

   var CommandsSeparator = WSButtonBase.extend([Checkable], /** @lends SBIS3.CONTROLS/Button/ToggleButton.prototype */ {
      _dotTplFn: dotTplFn,
      $protected: {
      }
   });

   return CommandsSeparator;

});