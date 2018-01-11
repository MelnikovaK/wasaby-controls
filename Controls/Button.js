define('js!Controls/Button', [
    'Core/Control',
    'tmpl!Controls/Button/Button',
    'css!WSControls/Buttons/resources/ButtonBase',
    'css!Controls/Button/Button'
], function(Control, template) {
    'use strict';

   /**
    * Кнопка
    * @class Controls/Button
    * @extends Controls/Control
    * @mixes Controls/Button/interface/IHref
    * @mixes Controls/Button/interface/ICaption
    * @mixes Controls/Button/interface/IClick
    * @mixes Controls/Button/interface/IIcon
    * @mixes Controls/interface/ITooltip
    * @control
    * @public
    * @category Button
    */

   /**
    * @name Controls/Button#type
    * @cfg {String} Внешний вид кнопки
    * @variant standard Стандартная кнопка
    * @variant link Кнопка ссылка
    * @variant flat Кнопка без контура
    */
   var Button = Control.extend({
       _controlName: 'Controls/Button',
       _template: template
   });

    return Button;
});