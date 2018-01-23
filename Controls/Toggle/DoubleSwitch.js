define('js!Controls/Toggle/DoubleSwitch', [
   'Core/Control',
   'tmpl!Controls/Toggle/DoubleSwitch/DoubleSwitch',
   'WS.Data/Type/descriptor',
   'css!Controls/Toggle/DoubleSwitch/DoubleSwitch'
], function (Control, template, types) {

   /**
    * Контрол, отображающий переключатель
    * @class Controls/Toggle/DoubleSwitch
    * @extends Controls/Control
    * @mixes Controls/Toggle/interface/ICheckable
    * @mixes Controls/interface/ITooltip
    * @control
    * @public
    * @category Toggle
    */

   /**
    * @name Controls/Toggle/DoubleSwitch#captions
    * @cfg {Array.<String>} Массив заголовков
    */

   /**
    * @name Controls/Toggle/DoubleSwitch#orientation
    * @cfg {String} Способ отображения
    * @variant horizontal Горизонтальная ориентация
    * @variant vertical Вертикальная ориентация
    */
   var _private = {
      checkCaptions: function(captions){
         if (captions.length !== 2) {
            throw new Error ('You must set 2 captions.')
         }
      },

      notifyChanged: function(self){
         self._notify('valueChanged', [!self._options.value]);
      }
   };


   var Switch = Control.extend({
      _template: template,

      constructor: function (options) {
         Switch.superclass.constructor.apply(this, arguments);
         _private.checkCaptions(options.captions);
      },

      _clickTextHandler: function (e, _nextValue) {
         if (this._options.value !== _nextValue) {
            _private.notifyChanged(this);
         }
      },

      _clickToggleHandler: function (e) {
         _private.notifyChanged(this);
      },

      _beforeUpdate: function (newOptions) {
         _private.checkCaptions(newOptions.captions);
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
         orientation: types(String).oneOf([
            'vertical',
            'horizontal'
         ]),
         //TODO: сделать проверку на массив когда будет сделана задача https://online.sbis.ru/opendoc.html?guid=2016ea16-ed0d-4413-82e5-47c3aeaeac59
         captions: types(Object)
      };
   };

   Switch._private = _private;

   return Switch;
});