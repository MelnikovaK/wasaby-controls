import Control = require('Core/Control');
import template = require('wml!Controls/_operations/__MultiSelector');
import source = require('Types/source');

var _defaultItems = [{
      id: 'selectAll',
      title: rk('Все')
   }, {
      id: 'unselectAll',
      title: rk('Снять')
   }, {
      id: 'toggleAll',
      title: rk('Инвертировать')
   }];

   var MultiSelector = Control.extend({
      _template: template,
      _multiSelectStatus: undefined,
      _menuCaption: undefined,
      _menuSource: undefined,

      _beforeMount: function(newOptions) {
         this._menuSource = this._getMenuSource();
         this._updateSelection(newOptions.selectedKeys, newOptions.excludedKeys, newOptions.selectedKeysCount, newOptions.root);
      },

      _getMenuSource: function() {
         return new source.Memory({
            keyProperty: 'id',
            data: _defaultItems
         });
      },

      _beforeUpdate: function(newOptions) {
         if (this._options.selectedKeys !== newOptions.selectedKeys || this._options.excludedKeys !== newOptions.excludedKeys || this._options.selectedKeysCount !== newOptions.selectedKeysCount) {
            this._updateSelection(newOptions.selectedKeys, newOptions.excludedKeys, newOptions.selectedKeysCount, newOptions.root);
         }
      },

      _afterUpdate: function() {
         if (this._sizeChanged) {
            this._sizeChanged = false;
            this._notify('controlResize', [], { bubbling: true });
         }
      },

      _updateSelection: function(selectedKeys, excludedKeys, count, root) {
         if (count > 0 && selectedKeys.length) {
            this._menuCaption = rk('Отмечено') + ': ' + count;
         } else if (selectedKeys[0] === root && (!excludedKeys.length || excludedKeys[0] === root && excludedKeys.length === 1)) {
            this._menuCaption = rk('Отмечено всё');
         } else if (count === null) {
            this._menuCaption = rk('Отмечено');
         } else {
            this._menuCaption = rk('Отметить');
         }
         this._sizeChanged = true;
      },

      _onMenuItemActivate: function(event, model) {
         this._notify('selectedTypeChanged', [model.get('id')], {
            bubbling: true
         });
      }
   });

   MultiSelector.getDefaultOptions = function() {
      return {
         root: null
      }
   };

   export = MultiSelector;

