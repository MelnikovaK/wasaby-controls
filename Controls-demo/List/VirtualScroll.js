define('Controls-demo/List/VirtualScroll', [
   'Core/Control',
   'wml!Controls-demo/List/VirtualScroll/VirtualScroll',
   'Types/source',
   'css!Controls-demo/List/VirtualScroll/VirtualScroll'
], function(BaseControl,
   template,
   source) {
   'use strict';

   var ModuleClass = BaseControl.extend(
      {
         _template: template,

         constructor: function() {
            ModuleClass.superclass.constructor.apply(this, arguments);
            this._viewSource = new source.Memory({
               idProperty: 'id',
               data: getData(1000)
            });
            this._treeViewSource = new source.Memory({
               idProperty: 'id',
               data: getTreeData(100, [1, 3], [2, 5])
            });
            this._treeColumns = [
               {
                  displayProperty: 'title',
                  width: 'auto'
               }
            ];
            this._columns = [
               {
                  displayProperty: 'id',
                  width: 'auto'
               },
               {
                  displayProperty: 'text',
                  width: 'auto'
               }
            ];
            this._listSelectedFeys = [];
            this._gridSelectedFeys = [];
            this._treeSelectedFeys = [];
         }
      }
   );
   return ModuleClass;
});


function createItem(id, textLength) {
   textLength = textLength || 1;
   var item = {
      id: id+1,
      title: 'Какая то запись с id=' + (id+1) + '. ',
      text: '',
      nodeType: null,
      parentId: null,
   };
   for (var i = 0; i < textLength; i++) {
      item.title += 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc posuere nulla ex, consectetur lacinia odio blandit sit amet. ';
      item.text += 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc posuere nulla ex, consectetur lacinia odio blandit sit amet. ';
   }
   return item;
}

function createTreeItem(id, textLength, parentId, nodeType) {
   var item = createItem(id, textLength);
   item.parentId = parentId;
   item.nodeType = nodeType;
   return item;
}

function getData(count) {
   var data = [];
   for (var i = 0; i < count; i++) {
      data.push(createItem(i, Math.round(0.5 + Math.random() * 3)));
   }
   return data;
}

function getTreeData(count, secondLevelMinMax, thirdLevelMinMax) {
   var
      data = [],
      id = 0,
      sParentId,
      tParentId;
   for (var i = 0; i < count; i++) {
      data.push(createTreeItem(id, Math.round(0.5 + Math.random() * 3), null, i % 3 === 0 ? true : null));
      id++;
      sParentId = id;
      if (i % 3 === 0) {
         var secondLevelCount = Math.round(secondLevelMinMax[0] + 0.5 + Math.random() * secondLevelMinMax[1]);
         for (var j = 0; j < secondLevelCount; j++) {
            data.push(createTreeItem(id, 1, sParentId, false));
            id++;
            tParentId = id;
            var thirdLevelCount = Math.round(thirdLevelMinMax[0] + 0.5 + Math.random() * thirdLevelMinMax[1]);
            for (var k = 0; k < thirdLevelCount; k++) {
               data.push(createTreeItem(id, Math.round(0.5 + Math.random() * 4), tParentId, null));
               id++;
            }
         }
      }
   }
   return data;
}
