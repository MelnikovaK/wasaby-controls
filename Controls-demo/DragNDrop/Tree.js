define('Controls-demo/DragNDrop/Tree', [
   'Core/Control',
   'Controls-demo/DragNDrop/DemoData',
   'Controls-demo/DragNDrop/ListEntity',
   'wml!Controls-demo/DragNDrop/Tree/Tree',
   'Types/source'
], function(BaseControl, DemoData, ListEntity, template, source) {
   'use strict';

   var ModuleClass = BaseControl.extend({
      _template: template,
      _viewSource: null,
      _gridColumns: null,
      _gridHeader: null,

      _beforeMount: function() {
         this._selectedKeys = [];
         this._itemsReadyCallback = this._itemsReady.bind(this);
         this._viewSource = new source.HierarchicalMemory({
            idProperty: 'id',
            data: DemoData,
            parentProperty: 'Раздел'
         });
         this._gridColumns = [{
            displayProperty: 'title'
         }, {
            displayProperty: 'additional',
            width: '150px'
         }];
         this._gridHeader = [{
            title: 'Title'
         }, {
            title: 'Additional'
         }];
      },

      _itemsReady: function(items) {
         this._items = items;
      },

      _dragStart: function(event, items) {
         var
            hasBadItems = false,
            firstItem = this._items.getRecordById(items[0]);

         items.forEach(function(item) {
            if (item === 0) {
               hasBadItems = true;
            }
         });
         return hasBadItems ? false : new ListEntity({
            items: items,
            mainText: firstItem.get('title'),
            image: firstItem.get('image'),
            additionalText: firstItem.get('additional')
         });
      },
      _dragEnd: function(event, entity, target, position) {
         this._children.listMover.moveItems(entity.getItems(), target, position);
      }
   });

   return ModuleClass;
});
