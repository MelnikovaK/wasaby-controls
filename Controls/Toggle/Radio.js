define('Controls/Toggle/Radio', [
   'Core/Control',
   'Controls/Controllers/SourceController',
   'tmpl!Controls/Toggle/Radio/Radio',
   'tmpl!Controls/Toggle/Radio/resources/ItemTemplate',
   'css!Controls/Toggle/Radio/Radio',
   'css!Controls/Toggle/resources/SwitchCircle/SwitchCircle'
], function(Control, SourceController, template, defaultItemTemplate) {

   /**
    * Radio button switch.
    *
    * @class Controls/Toggle/Radio
    * @extends Core/Control
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/ISingleSelectable
    * @control
    * @public
    * @category Toggle
    */

   /**
    * @name Controls/Toggle/Radio#direction
    * @cfg {string} Direction of RadioGroup.
    * @variant horizontal RadioGroup is a row of RadioButton.
    * @variant vertical RadioGroup is a column of RadioButton.
    */

   var _private = {
      initItems: function(source, self) {
         self._sourceController = new SourceController({
            source: source
         });
         return self._sourceController.load().addCallback(function(items) {
            return items;
         });
      }
   };

   var Radio = Control.extend({
      _template: template,
      _defaultItemTemplate: defaultItemTemplate,

      _beforeMount: function(options, context, receivedState) {
         if (receivedState) {
            this._items = receivedState;
         } else {
            return _private.initItems(options.source, this).addCallback(function(items) {
               this._items = items;
            }.bind(this));
         }
      },

      _beforeUpdate: function(newOptions) {
         var self = this;
         if (newOptions.source && newOptions.source !== this._options.source) {
            return _private.initItems(newOptions.source, this).addCallback(function(items) {
               this._items = items;
               self._forceUpdate();
            }.bind(this));
         }
      },

      _selectKeyChanged: function(e, item, keyProperty) {
         if (!this._options.readOnly) {
            this._notify('selectedKeyChanged', item.get(keyProperty));
         }
      }
   });

   Radio.getDefaultOptions = function getDefaultOptions() {
      return {
         direction: 'vertical'
      };
   };

   Radio._private = _private;

   return Radio;
});
