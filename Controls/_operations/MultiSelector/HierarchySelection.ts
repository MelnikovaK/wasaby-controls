import Selection from 'Controls/_operations/MultiSelector/Selection';
import ArraySimpleValuesUtil = require('Controls/Utils/ArraySimpleValuesUtil');
import {relation} from 'Types/entity';

/**
 * @class Controls/_operations/MultiSelector/HierarchySelection
 * @extends Controls/_operations/MultiSelector/Selection
 * @author Авраменко А.С.
 * @private
 */

/**
 * @name Controls/_operations/MultiSelector/HierarchySelection#nodeProperty
 * @cfg {String} Name of the field describing the type of the node (list, node, hidden node).
 */

/**
 * @name Controls/_operations/MultiSelector/HierarchySelection#parentProperty
 * @cfg {String} Name of the field that contains information about parent node.
 */

var
   SELECTION_STATUS = {
      NOT_SELECTED: false,
      SELECTED: true,
      PARTIALLY_SELECTED: null
   },
   _private = {
      getParentId: function(key, items, parentProperty) {
         var item = items.getRecordById(key);

         if (item) {
            return item.get(parentProperty);
         }
      },

      getAllChildren: function(hierarchyRelation, rootId, items) {
         var children = [];

         hierarchyRelation.getChildren(rootId, items).forEach(function(child) {
            if (hierarchyRelation.isNode(child) !== null) {
               ArraySimpleValuesUtil.addSubArray(children, _private.getAllChildren(hierarchyRelation, child.getId(), items));
            }
            ArraySimpleValuesUtil.addSubArray(children, [child]);
         });

         return children;
      },

      getChildrenIds: function(hierarchyRelation, rootId, items) {
         return _private.getAllChildren(hierarchyRelation, rootId, items).map(function(child) {
            return child.getId();
         });
      },

      isParentSelected: function(hierarchyRelation, key, selectedKeys, excludedKeys, items) {
         if (key === null) {
            return selectedKeys[0] === null;
         }

         var
            parentId = _private.getParentId(key, items, hierarchyRelation.getParentProperty()),
            parentExcluded = false,
            parentSelected = false;

         while (parentId) {
            if (selectedKeys.indexOf(parentId) !== -1) {
               parentSelected = true;
               break;
            }
            if (excludedKeys.indexOf(parentId) !== -1) {
               parentExcluded = true;
               break;
            }
            parentId = _private.getParentId(parentId, items, hierarchyRelation.getParentProperty());
         }

         /**
          * parentId can be undefined if the user is inside a folder. But if everything is selected and none of the item's parents is excluded then parentSelected should be true.
          */
         if (!parentExcluded && !parentId && selectedKeys[0] === null) {
            parentSelected = true;
         }

         return parentSelected;
      },

      getSelectedChildrenCount: function(hierarchyRelation, rootId, selectedKeys, excludedKeys, items) {
         var
            parentSelected = selectedKeys.indexOf(rootId) !== -1 || _private.isParentSelected(hierarchyRelation, rootId, selectedKeys, excludedKeys, items),
            childId;

         return hierarchyRelation.getChildren(rootId, items).reduce(function(acc, child) {
            childId = child.getId();

            if (selectedKeys.indexOf(childId) !== -1 || (parentSelected && excludedKeys.indexOf(rootId) === -1)) {
               var newCount = excludedKeys.indexOf(childId) === -1 ? acc + 1 : acc;
               if (hierarchyRelation.isNode(child) !== null) {
                  return newCount + _private.getSelectedChildrenCount(hierarchyRelation, childId, selectedKeys, excludedKeys, items);
               } else {
                  return newCount;
               }
            } else {
               if (hierarchyRelation.isNode(child) !== null && excludedKeys.indexOf(childId) === -1) {
                  return acc + _private.getSelectedChildrenCount(hierarchyRelation, childId, selectedKeys, excludedKeys, items);
               } else {
                  return acc;
               }
            }
         }, 0);
      },

      // todo getSelectedChildrenCount vs getSelectedCount: one of these must removed
      // refactor by https://online.sbis.ru/opendoc.html?guid=face920a-41ce-49f4-bf79-25add7363adf
      getSelectedCount: function(self, hierarchyRelation, selectedKeys, excludedKeys, items) {
         var
            selection = self.getSelectedKeysForRender(),
            keys = Object.keys(selection),
            type;
         if (!keys.length) {
            return 0;
         }

         // detect type of key, object cast all types to string
         type = typeof items.at(0).getId();
         keys.forEach(function(key) {
            var
               correctKey = type === 'string' ? key : +key;
            if (selection[correctKey] === null) {
               if (excludedKeys.indexOf(correctKey) !== -1) {
                  delete selection[correctKey];
               }
               if (!(selectedKeys.indexOf(correctKey) !== -1 || _private.isParentSelected(hierarchyRelation, correctKey, selectedKeys, excludedKeys, items))) {
                  delete selection[correctKey];
               }
            }
         });
         return Object.keys(selection).length;
      },

      getSelectedButNotLoadedItemsCount: function(selectedKeys, items) {
         return selectedKeys.reduce(function(acc, key) {
            if (key !== null && !items.getRecordById(key)) {
               return acc + 1;
            }
            return acc;
         }, 0);
      },

      hasExcludedChildren: function(hierarchyRelation, rootId, excludedKeys, items) {
         var
            hasExcludedChildren = false,
            childrenIds = _private.getChildrenIds(hierarchyRelation, rootId, items);
         for (var i = 0; i < childrenIds.length; i++) {
            if (excludedKeys.indexOf(childrenIds[i]) !== -1) {
               hasExcludedChildren = true;
               break;
            }
         }
         return hasExcludedChildren;
      },

      getIntersection: function(firstCollection, secondCollection) {
         return firstCollection.filter(function(key) {
            return secondCollection.indexOf(key) !== -1;
         });
      }
   };

var HierarchySelection = Selection.extend({
   _hierarchyRelation: null,

   constructor: function(options) {
      HierarchySelection.superclass.constructor.apply(this, arguments);

      this._hierarchyRelation = new relation.Hierarchy({
         idProperty: options.keyProperty || 'id',
         parentProperty: options.parentProperty || 'Раздел',
         nodeProperty: options.nodeProperty || 'Раздел@'
      });
   },

   select: function(keys) {
      // 1) Удаляем все ключи из excludedKeys, если они там есть. Если их там нет, то добавляем в selectedKeys
      // 2) Для каждого ключа получаем всех детей и удаляем их из обоих массивов
      var childrenIds;
      this._selectedKeys = this._selectedKeys.slice();
      this._excludedKeys = this._excludedKeys.slice();

      keys.forEach(function(key) {
         if (this._excludedKeys.indexOf(key) !== -1) {
            ArraySimpleValuesUtil.removeSubArray(this._excludedKeys, keys);
         } else {
            ArraySimpleValuesUtil.addSubArray(this._selectedKeys, keys);
         }
         childrenIds = _private.getChildrenIds(this._hierarchyRelation, key, this._items);
         ArraySimpleValuesUtil.removeSubArray(this._selectedKeys, childrenIds);
         ArraySimpleValuesUtil.removeSubArray(this._excludedKeys, childrenIds);
      }.bind(this));
   },

   unselect: function(keys) {
      // 1) Удаляем всех из selectedKeys
      // 2) Удаляем всех детей из excludedKeys
      // 3) Для каждого ключа бежим по всем родителям, как только нашли полностью выделенного родителя, то добавляем в excludedKeys и заканчиваем бежать
      var isAllSelection = this._isAllSelection(this._getParams(null));
      var childrenIds;
      var parentId;
      this._selectedKeys = this._selectedKeys.slice();
      this._excludedKeys = this._excludedKeys.slice();

      ArraySimpleValuesUtil.removeSubArray(this._selectedKeys, keys);

      keys.forEach(function(key) {
         childrenIds = _private.getChildrenIds(this._hierarchyRelation, key, this._items);
         ArraySimpleValuesUtil.removeSubArray(this._excludedKeys, childrenIds);
         ArraySimpleValuesUtil.removeSubArray(this._selectedKeys, childrenIds);

         if (!this._items.getRecordById(key) && !isAllSelection) {
            //There's no point to add this key to excludedKeys because it is either root or this item was removed from the collection
            return;
         }

         parentId = _private.getParentId(key, this._items, this._hierarchyRelation.getParentProperty());
         while (parentId) {
            if (this._isAllSelection(this._getParams(parentId))) {
               ArraySimpleValuesUtil.addSubArray(this._excludedKeys, [key]);
            }
            parentId = _private.getParentId(parentId, this._items, this._hierarchyRelation.getParentProperty());
         }

         //item can be not loaded yet, but anyway he must be in excluded, beacouse method with selection will work incorrect
         if ((parentId === null || !this._items.getRecordById(key)) && this._isAllSelection(this._getParams(null))) {
            ArraySimpleValuesUtil.addSubArray(this._excludedKeys, [key]);
         }
      }.bind(this));
   },

   selectAll: function() {
      this.select([this._getRoot()]);
      ArraySimpleValuesUtil.addSubArray(this._excludedKeys, [this._getRoot()]);
   },

   /* toDo Когда пытаются снять выделение, надо его снимать полностью для всех разделов
    Иначе сейчас люди в окнах выбора не могут снять выделение. Запись может быть выделена глубоко в иерархии
    Поправится после задачи https://online.sbis.ru/opendoc.html?guid=0606ed47-453c-415e-90b5-51e34037433e

   unselectAll: function() {
      this.unselect([this._getRoot()]);
      ArraySimpleValuesUtil.removeSubArray(this._excludedKeys, [this._getRoot()]);
   }, */

   toggleAll: function() {
      var
         rootId = this._getRoot(),
         selectedKeys = this._selectedKeys.slice(),
         excludedKeys = this._excludedKeys.slice(),
         childrensIdsRoot = _private.getChildrenIds(this._hierarchyRelation, rootId, this._items);

      if (this._isAllSelection(this._getParams(rootId))) {
         this.unselect([rootId]);
         this.select(_private.getIntersection(childrensIdsRoot, excludedKeys));

      } else {
         this.select([rootId]);
         this.unselect(_private.getIntersection(childrensIdsRoot, selectedKeys));
      }
   },

   getCount: function() {
      return (
         _private.getSelectedCount(
            this,
            this._hierarchyRelation,
            this._selectedKeys,
            this._excludedKeys,
            this._items
         ) +
         _private.getSelectedButNotLoadedItemsCount(
            this._selectedKeys,
            this._items
         )
      );
   },

   _getSelectionStatus: function(item) {
      var
         itemId = item.get(this._options.keyProperty),
         isParentSelected = _private.isParentSelected(this._hierarchyRelation, itemId, this._selectedKeys, this._excludedKeys, this._items),
         hasSelectedChildren = _private.getSelectedChildrenCount(this._hierarchyRelation, itemId, this._selectedKeys, this._excludedKeys, this._items) > 0,
         hasExcludedChildren;

      if (this._excludedKeys.indexOf(itemId) !== -1) {
         return hasSelectedChildren ? null : false;
      }

      if (this._selectedKeys.indexOf(itemId) !== -1 || isParentSelected || hasSelectedChildren) {
         if (this._hierarchyRelation.isNode(item) !== null) {
            hasExcludedChildren = _private.hasExcludedChildren(this._hierarchyRelation, itemId, this._excludedKeys, this._items);
            if (hasExcludedChildren) {
               return null;
            }
            return this._selectedKeys.indexOf(itemId) !== -1 || isParentSelected ? true : null;
         }
         return true;
      }

      return false;
   },

   _getParams: function(rootId) {
      var params = HierarchySelection.superclass._getParams.apply(this, arguments);
      params.rootId = rootId || null;
      params.hierarchyRelation = this._hierarchyRelation;
      return params;
   },

   _isAllSelection: function(options) {
      var
         rootId = options.rootId,
         selectedKeys = options.selectedKeys,
         excludedKeys = options.excludedKeys,
         items = options.items,
         isParentSelected = _private.isParentSelected(this._hierarchyRelation, rootId, selectedKeys, excludedKeys, items);

      return isParentSelected && excludedKeys.indexOf(rootId) === -1 || selectedKeys.indexOf(rootId) !== -1;
   },

   _getRoot: function() {
      return this._options.listModel.getRoot().getContents();
   }
});

HierarchySelection.SELECTION_STATUS = SELECTION_STATUS;

export default HierarchySelection;
