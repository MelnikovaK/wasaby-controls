define('Controls/Container/MassSelector', [
   'Core/Control',
   'tmpl!Controls/Container/MassSelector/MassSelector',
   'Controls/Container/MassSelector/MassSelectorContextField',
   'Controls/Controllers/Multiselect/Selection'
], function(Control, template, MassSelectorContextField, MultiSelection) {
   return Control.extend({
      //todo: весь модуль
      _template: template,
      _multiselection: null,
      _items: null,
      _count: 0,
      _selectedKeys: null,

      _beforeMount: function(newOptions) {
         this._itemsReadyCallback = this._itemsReadyCallback.bind(this);
         this._updateItems = this._updateItems.bind(this);

         this._selectedKeys = newOptions.selectedKeys;

         this._multiselection = new MultiSelection({
            selectedKeys: newOptions.selectedKeys,
            excludedKeys: newOptions.excludedKeys
         });

         this._updateCount();
         this._updateContext();
      },

      _selectedKeysChangedHandler: function(event, selectedKeys) {
         var currentSelection = this._multiselection.getSelection(),
            selected = selectedKeys,
            excluded = currentSelection.excluded;

         this._selectedKeys = selectedKeys;

         if (this._count === 'all' || this._count === 'part') {
            excluded = [];
            this._items.forEach(function(item) {
               var key = item.getId();
               if (selectedKeys.indexOf(key) < 0) {
                  excluded.push(key);
               }
            });
            selected = [null];
         }

         this._multiselection.unselectAll();
         this._multiselection.select(selected);
         this._multiselection.unselect(excluded);

         this._updateCount();
         this._updateContext();
      },

      _selectedTypeChangedHandler: function(event, typeName) {
         this._multiselection[typeName]();

         this._updateCount();
         this._updateSelectedKeys();
         this._updateContext();
      },

      _itemsReadyCallback: function(items) {
         if (this._items) {
            this._items.unsubscribe('onCollectionChange', this._updateItems);
         }
         this._items = items;
         this._items.subscribe('onCollectionChange', this._updateItems);
         this._updateItems();
      },

      _updateCount: function() {
         var currentSelection = this._multiselection.getSelection(),
            selectedKeys = currentSelection.selected,
            excludedKeys = currentSelection.excluded;
         this._count =
            selectedKeys && !!selectedKeys.length
               ? selectedKeys[0] === null
                  ? excludedKeys && !!excludedKeys.length
                     ? 'part'
                     : 'all'
                  : selectedKeys.length
               : 0;
      },

      _updateSelectedKeys: function() {
         this._selectedKeys = [];
         var currentSelection = this._multiselection.getSelection(),
            selected = currentSelection.selected,
            excluded = currentSelection.excluded;

         if (this._count === 'all' || this._count === 'part') {
            this._items.forEach(function(item) {
               var key = item.getId();
               if (excluded.indexOf(key) < 0) {
                  this._selectedKeys.push(key);
               }
            }.bind(this));
         } else {
            this._selectedKeys = selected;
         }
      },

      _updateItems: function() {
         this._updateSelectedKeys();
         this._updateContext();
      },

      _updateContext: function() {
         this._context = new MassSelectorContextField(
            this._selectedKeys,
            this._itemsReadyCallback,
            this._count
         );
         this._forceUpdate();
      },

      _getChildContext: function() {
         return {
            selection: this._context
         };
      }
   });
});
