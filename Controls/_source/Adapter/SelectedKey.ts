import Control = require('Core/Control');
import template = require('wml!Controls/_source/Adapter/SelectedKey/SelectedKey');

/**
 * Container for controls that implement interface {@link Controls/interface/IMultiSelectable multiSelectable}.
 * Container receives selectedKey option and transfers selectedKeys option to children.
 * Listens for children "selectedKeysChanged" event and notify event "selectedKeyChanged".
 * @class Controls/_source/Adapter/SelectedKey
 * @extends Controls/Control
 * @control
 * @public
 * @author Золотова Э.Е.
 */

var _private = {
   getSelectedKeys: function(selectedKey, items) {
      return selectedKey === null && !(items && items.getRecordById(null)) ? [] : [selectedKey];
   },

   dataLoadCallbackHandler: function(items) {
      this._items = items;
      if (this._options.dataLoadCallback) {
         this._options.dataLoadCallback(items);
      }
   }
};

var Adapter = Control.extend({

   _template: template,
   _selectedKeys: null,
   _items: null,

   _beforeMount: function(options) {
      this._dataLoadCallbackHandler = _private.dataLoadCallbackHandler.bind(this);
      this._selectedKeys = _private.getSelectedKeys(options.selectedKey, this._items);
   },

   _beforeUpdate: function(newOptions) {
      if (this._options.selectedKey !== newOptions.selectedKey) {
         this._selectedKeys = _private.getSelectedKeys(newOptions.selectedKey, this._items);
      }
   },

   _selectedKeysChanged: function(event, keys) {
      event.stopPropagation();
      var selectedKey = keys.length ? keys[0] : null;
      this._notify('selectedKeyChanged', [selectedKey]);
   }

});

Adapter._private = _private;

export default Adapter;
