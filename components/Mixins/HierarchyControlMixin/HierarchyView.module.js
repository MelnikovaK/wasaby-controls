/* global define, $ws, $ */
define('js!SBIS3.CONTROLS.HierarchyControl.HierarchyView', [
   'js!SBIS3.CONTROLS.ListControl.View',
   'html!SBIS3.CONTROLS.HierarchyControl.HierarchyView/resources/HierarchyViewItem'
], function (ListView, HierarchyViewItemContainerTemplate) {
   'use strict';

   /**
    * Представление иерархии - реализует ее визуальный аспект.
    * @class SBIS3.CONTROLS.HierarchyControl.HierarchyView
    * @extends SBIS3.CONTROLS.CollectionControl.ListView
    * @author Крайнов Дмитрий Олегович
    */
   var HierarchyView = ListView.extend(/** @lends SBIS3.CONTROLS.ListControl.HierarchyView.prototype */{
      _moduleName: 'SBIS3.CONTROLS.HierarchyControl.HierarchyView',
      $protected: {
         _itemContainerTemplate: HierarchyViewItemContainerTemplate,

         /**
          * @var {String} CSS-класс узла дерева
          */
         _treeNodeСssClass: 'itemContainer-treeNode',

         /**
          * @var {String} CSS-класс листа дерева
          */
         _treeLeafСssClass: 'itemContainer-treeLeaf',

         /**
          * @var {String} Суффикс идентификатора контейнера дочерних элементов
          */
         _childrenContainerSuffix: '-children',

         /**
          * @var {String} Хэш текущего элемента
          */
         _selectedItemHash: '',

         /**
          * @var {String} Хэш элемента, надо которым находится указатель
          */
         _hoveredItemHash: '',

         /**
          * @var {Number} Уровень вложенности, который сейчас отображается
          */
         _levelOffset: 0
      },

      //region SBIS3.CONTROLS.ListControl.IView

      render: function (items) {
         this._levelOffset = items.getOwner().getLevel();
         HierarchyView.superclass.render.call(this, items);
      },

      //endregion SBIS3.CONTROLS.ListControl.IView

      //region SBIS3.CONTROLS.HierarchyControl.IHierarchyView

      //endregion SBIS3.CONTROLS.HierarchyControl.IHierarchyView

      //region Public methods

      //endregion Public methods

      //region Protected methods

      //region Events

      //endregion Events

      //region Rendering

      _getRenderData: function(items) {
         var data = HierarchyView.superclass._getRenderData.call(this, items);
         data.id = items.getOwner().getHash() + this._childrenContainerSuffix;
         return data;
      },

      _getItemRenderData: function(item) {
         if (!$ws.helpers.instanceOfModule(item, 'WS.Data.Display.TreeItem')) {
            return HierarchyView.superclass._getItemRenderData.call(this, item);
         }

         var itemData = HierarchyView.superclass._getItemRenderData.call(this, item);
         itemData.containerClass += ' ' + this._сssPrefix + (item.isNode() ? this._treeNodeСssClass : this._treeLeafСssClass);
         itemData.isNode = item.isNode();

         return itemData;
      },

      //endregion Rendering

      //region DOM

      _getTargetNode: function (item) {
         if (item.isRoot()) {
            return HierarchyView.superclass._getTargetNode.call(this, item);
         }
         return this._getTreeChildrenContainer(item.getParent());
      },

      _buildItemContainer: function(item, template) {
         var container = HierarchyView.superclass._buildItemContainer.call(this, item, template);
         container.addClass(this._сssPrefix + (item.isNode() ? this._treeNodeСssClass : this._treeLeafСssClass));
         return container;
      },

      /**
       * Возврашает DOM узел с указанным hash
       * @param {String} hash Хэш узла
       * @returns {jQuery}
       * @private
       */
      _getContainerByHash: function (hash) {
         return $('#' + hash);
      },

      /**
       * Возвращает узел DOM, содержащий детей узла дерева
       * @param {WS.Data.Display.TreeItem} item Элемент дерева
       * @private
       */
      _getTreeChildrenContainer: function(item) {
         return this._getContainerByHash(item.getHash() + this._childrenContainerSuffix);
      }

      //endregion DOM

      //endregion Protected methods

   });

   return HierarchyView;
});
