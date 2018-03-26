
define('SBIS3.CONTROLS/Button/StateButton', [
   'js!WSControls/Buttons/ToggleButton'
], function(WSToggleButton) {

   'use strict';

   /**
    * Класс контрола "Кнопка со сменой состояний".
    *
    * @class SBIS3.CONTROLS/Button/StateButton
    * @extends WSControls/Buttons/ToggleButton
    *
    * @author Крайнов Д.О.
    *
    * @control
    * @public
    *
    * @category Button
    *
    * @demo Examples/Button/MyButton/MyButton
    *
    * @initial
    * <component data-component='SBIS3.CONTROLS/Button/StateButton'>
    *    <option name='caption' value='Изменить'></option>
    *    <option name='checkedCaption' value='Сохранить'></option>
    *    <option name='icon' value='sprite:icon-24 icon-Author icon-primary'></option>
    *    <option name='checkedIcon' value='sprite:icon-24 icon-Save icon-primary'></option>
    *    <option name='className' value='controls-Button controls-Button__default'></option>
    * </component>
    */

   var StateButton = WSToggleButton.extend( /** @lends SBIS3.CONTROLS/Button/StateButton.prototype */ {
       $protected: {
           _options: {
               checkedCaption: null,
               checkedIcon: null
           },
           _caption: null,
           _checkedCaption: null,
           _icon: null,
           _checkedIcon: null
       },

      $constructor: function() {
          this._caption = this.getCaption();
          this._checkedCaption = this._options.checkedCaption;
          this._icon = this.getIcon();
          this._checkedIcon = this._options.checkedIcon;
      },

      setChecked: function(flag) {
          var newChecked = !!flag,
              newIcon = newChecked ? this._checkedIcon : this._icon,
              newCaption = newChecked ? this._checkedCaption : this._caption;

          newIcon && this.setIcon(newIcon);
          newCaption && this.setCaption(newCaption);

          WSToggleButton.superclass.setChecked.apply(this, arguments);
      }

   });

   return StateButton;

});