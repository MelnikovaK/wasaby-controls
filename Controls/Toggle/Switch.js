define('Controls/Toggle/Switch', [
   'Core/Control',
   'tmpl!Controls/Toggle/Switch/Switch',
   'WS.Data/Type/descriptor',
   'css!Controls/Toggle/Switch/Switch',
   'css!Controls/Toggle/resources/SwitchCircle/SwitchCircle'
], function(Control, template, types) {

   /**
    * Контрол, отображающий переключатель
    * @class Controls/Toggle/Switch
    * @extends Core/Control
    * @mixes Controls/Toggle/interface/ICheckable
    * @mixes Controls/interface/ITooltip
    * @control
    * @public
    * @category Toggle
    */

   /**
    * @name Controls/Toggle/Switch#caption
    * @cfg {String} Заголовок
    */

   var Switch = Control.extend({
      _template: template,

      _clickHandler: function(e) {
         if (!this._options.readOnly) {
            this._notify('valueChanged', [!this._options.value]);
         }
      }
   });

   Switch.getDefaultOptions = function getDefaultOptions() {
      return {
         value: false
      };
   };

   Switch.getOptionTypes = function getOptionTypes() {
      return {
         value: types(Boolean),
         caption: types(String)
      };
   };

   return Switch;
});
