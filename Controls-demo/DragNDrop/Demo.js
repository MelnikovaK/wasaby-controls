define('Controls-demo/DragNDrop/Demo', [
   'Core/Control',
   'wml!Controls-demo/DragNDrop/Demo/Demo',
   'Types/source',
   'Core/core-clone',
   'Controls-demo/DragNDrop/Demo/Data',
   'Controls/DragNDrop/Entity/Items',
   'css!Controls-demo/DragNDrop/Demo/Demo',
   'wml!Controls-demo/DragNDrop/Demo/columnTemplate',
   'wml!Controls-demo/DragNDrop/Demo/timeColumnTemplate',
   'wml!Controls-demo/DragNDrop/Demo/receivedColumnTemplate'
], function(BaseControl, template, source, cClone, DemoData, Entity) {
   'use strict';

   var ModuleClass = BaseControl.extend({
      _template: template,

      _beforeMount: function() {
         this._itemsReadyCallbackFirst = this._itemsReadyFirst.bind(this);
         this._itemsReadyCallbackSecond = this._itemsReadySecond.bind(this);
         this._itemsReadyCallbackThird = this._itemsReadyThird.bind(this);
         this._itemActionsFirst = [{
            icon: 'sprite:icon-medium icon-Erase icon-error',
            showType: 2,
            id: 0
         }];
         this._viewSourceFirst = new source.Memory({
            idProperty: 'id',
            data: cClone(DemoData.listItems)
         });
         this._viewSourceSecond = new source.HierarchicalMemory({
            idProperty: 'id',
            data: cClone(DemoData.tasks),
            parentProperty: 'parent'
         });
         this._viewSourceThird = new source.HierarchicalMemory({
            idProperty: 'id',
            data: cClone(DemoData.tile),
            parentProperty: 'parent'
         });
         this._gridColumns = [{
            template: 'wml!Controls-demo/DragNDrop/Demo/columnTemplate'
         }, {
            template: 'wml!Controls-demo/DragNDrop/Demo/timeColumnTemplate',
            width: '100px'
         }, {
            displayProperty: 'state',
            width: '100px'
         }, {
            template: 'wml!Controls-demo/DragNDrop/Demo/receivedColumnTemplate',
            width: '100px'
         }];
         this._gridHeader = [{
            title: ''
         }, {
            title: 'Срок'
         }, {
            title: 'Состояние'
         }, {
            title: 'Получено'
         }];
         this._expandedItems = [1, 2, 3];
         this._selectedKeys = [];
      },

      _itemsReadyFirst: function(items) {
         this._itemsFirst = items;
      },

      _itemsReadySecond: function(items) {
         this._itemsSecond = items;
      },

      _itemsReadyThird: function(items) {
         this._itemsThird = items;
      },

      _dragEndFirst: function(event, entity, target, position) {
         this._children.listMoverFirst.moveItems(entity.getItems(), target, position);
      },

      _dragEndSecond: function(event, entity, target, position) {
         this._children.listMoverSecond.moveItems(entity.getItems(), target, position);
      },

      _dragEndThird: function(event, entity, target, position) {
         this._children.listMoverThird.moveItems(entity.getItems(), target, position);
      },

      _dragStartFirst: function(event, items) {
         var firstItem = this._itemsFirst.getRecordById(items[0]);

         return new Entity({
            items: items,
            mainText: firstItem.get('title'),
            image: firstItem.get('image'),
            additionalText: firstItem.get('additional')
         });
      },

      _dragStartSecond: function(event, items) {
         var firstItem = this._itemsSecond.getRecordById(items[0]);

         return new Entity({
            items: items,
            mainText: firstItem.get('title'),
            image: firstItem.get('image'),
            logo: 'icon-FolderClosed icon-primary',
            additionalText: firstItem.get('text')
         });
      },

      _dragStartThird: function(event, items) {
         var firstItem = this._itemsThird.getRecordById(items[0]);

         return new Entity({
            items: items,
            mainText: firstItem.get('title'),
            logo: firstItem.get('type') ? 'icon-FolderClosed icon-primary' : 'icon-DocumentW icon-primary',
            additionalText: firstItem.get('size')
         });
      }
   });
   return ModuleClass;
});
