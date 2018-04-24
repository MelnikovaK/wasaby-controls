/**
 * Created by as.krasilnikov on 26.12.2017.
 */
define('Controls/Dropdown/resources/DropdownViewModel',
   [
      'Core/Abstract',
      'WS.Data/Chain',
      'Controls/List/SimpleList/ItemsViewModel',
      'WS.Data/Relation/Hierarchy'
   ],
   function(Abstract, Chain, ItemsViewModel, Hierarchy) {
      var DropdownViewModel = Abstract.extend({
         _itemsModel: null,

         constructor: function(cfg) {
            this._options = cfg;
            DropdownViewModel.superclass.constructor.apply(this, arguments);

            this._itemsModel = new ItemsViewModel({
               items: this._getCurrentRootItems(cfg),
               idProperty: cfg.keyProperty,
               displayProperty: 'title'
            });
            this._hierarchy = new Hierarchy({
               idProperty: cfg.keyProperty,
               parentProperty: cfg.parentProperty,
               nodeProperty: cfg.nodeProperty
            });
         },

         _getCurrentRootItems: function(cfg) {
            if (!cfg.parentProperty || !cfg.nodeProperty) {
               return cfg.items;
            }
            return Chain(cfg.items).filter(function(item) {
               return item.get(cfg.parentProperty) === cfg.rootKey;
            }).value();
         },

         destroy: function() {
            this._itemsModel.destroy();
            this._hierarchy.destroy();
            DropdownViewModel.superclass.destroy.apply(this, arguments);
         },

         reset: function() {
            return this._itemsModel.reset();
         },

         isEnd: function() {
            return this._itemsModel.isEnd();
         },

         goToNext: function() {
            return this._itemsModel.goToNext();
         },

         getCurrent: function() {
            var itemsModelCurrent = this._itemsModel.getCurrent();
            itemsModelCurrent.hasChildren = this._hasItemChildren(itemsModelCurrent.item);
            itemsModelCurrent.hasParent = this._hasParent(itemsModelCurrent.item);
            itemsModelCurrent.isSelected = this._isItemSelected(itemsModelCurrent.item);
            itemsModelCurrent.icon = itemsModelCurrent.item.get('icon');
            itemsModelCurrent.itemTemplateProperty = this._options.itemTemplateProperty;
            itemsModelCurrent.template = itemsModelCurrent.item.get(itemsModelCurrent.itemTemplateProperty);
            return itemsModelCurrent;
         },
         _isItemSelected: function(item) {
            var keys = this._options.selectedKeys;
            if (keys instanceof Array) {
               return keys.indexOf(item.get(this._options.keyProperty)) > -1;
            }
            return keys && keys === item.get(this._options.keyProperty);
         },
         _hasItemChildren: function(item) {
            return this._hierarchy.isNode(item) && !!this._hierarchy.getChildren(item, this._options.items).length;
         },
         hasHierarchy: function() {
            if (!this._options.parentProperty || !this._options.nodeProperty) {
               return false;
            }
            var display = this._itemsModel._display;
            for (var i = 0; i < display.getCount(); i++) {
               var item = display.at(i).getContents();
               if (item.get(this._options.nodeProperty)) {
                  return true;
               }
            }
            return false;
         },
         _hasParent: function(item) {
            return this._hierarchy.hasParent(item, this._options.items);
         },
         getCount: function() {
            return this._itemsModel.getCount();
         }
      });

      return DropdownViewModel;
   });
