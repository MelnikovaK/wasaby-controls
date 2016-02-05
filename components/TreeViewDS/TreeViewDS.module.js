define('js!SBIS3.CONTROLS.TreeViewDS', [
   'js!SBIS3.CONTROLS.ListView',
   'js!SBIS3.CONTROLS.hierarchyMixin',
   'js!SBIS3.CONTROLS.TreeMixinDS',
   'js!SBIS3.CORE.MarkupTransformer'
], function (ListView, hierarchyMixin, TreeMixinDS, MarkupTransformer) {
   'use strict';
   var ITEMS_ACTIONS_HEIGHT = 20;
   
   /**
    * Контрол, отображающий данные имеющие иерархическую структуру. Позволяет отобразить данные в произвольном виде с возможностью открыть или закрыть отдельные узлы
    * @class SBIS3.CONTROLS.TreeViewDS
    * @control
    * @public
    * @extends SBIS3.CONTROLS.ListView
    * @mixes SBIS3.CONTROLS.hierarchyMixin
    * @mixes SBIS3.CONTROLS.TreeMixinDS
    * @demo SBIS3.CONTROLS.Demo.MyTreeView
    * @author Крайнов Дмитрий Олегович
    */

   var TreeViewDS = ListView.extend([hierarchyMixin, TreeMixinDS], /** @lends SBIS3.CONTROLS.TreeViewDS.prototype*/ {
      $protected: {
         _options: {
            //FixME: так как приходит набор от листвью. пока он не нужен
            itemsActions: []
         }
      },

      init: function () {
         TreeViewDS.superclass.init.apply(this, arguments);
         this._container.addClass('controls-TreeView');
      },

      _getTargetContainer: function (record) {
         var
            parentKey = this._dataSet.getParentKey(record, this._options.hierField),
            curList;

         //TODO убрать, когда ключи будут 100% строками
         if (parentKey && ((parentKey + '') !== (this._curRoot + ''))) {
            var parentItem = $('.controls-ListView__item[data-id="' + parentKey + '"]', this.getContainer().get(0));
            curList = $('.controls-TreeView__childContainer', parentItem.get(0)).first();
            if (!curList.length) {
               curList = $('<div></div>').appendTo(parentItem).addClass('controls-TreeView__childContainer');
            }

            // !! для статичных данных тоже надо указыавть является ли запись разделом. нужно чтобы отрисовать корректно запись, которая является узлом
            if (record.get(this._options.hierField + '@')) {
               $('.controls-TreeView__item', parentItem).first().addClass('controls-TreeView__hasChild');
            }
         } else {
            curList = this._getItemsContainer();
         }

         return curList;
      },

      _getItemActionsPosition: function(item) {
         var treeItem = item.container.find('.js-controls-TreeView-itemContent'),
             parentResult = TreeViewDS.superclass._getItemActionsPosition.apply(this, arguments);

         return {
            top: item.position.top + (treeItem.length ? treeItem[0].offsetHeight : item.size.height) - ITEMS_ACTIONS_HEIGHT,
            right: parentResult.right
         }
      },

      _drawLoadedNode : function(key) {
         TreeViewDS.superclass._drawLoadedNode.apply(this, arguments);
         var itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));
         $('.controls-TreeView__childContainer', itemCont).first().css('display', 'block');
      },

      _nodeClosed : function(key) {
         var itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));
         $('.controls-TreeView__childContainer', itemCont).css('display', 'none').empty();
      },

      _drawSelectedItems : function(idArray) {
         $('.controls-ListView__itemCheckBox__multi').removeClass('controls-ListView__itemCheckBox__multi');
         for (var i = 0; i < idArray.length; i++) {
            $(".controls-ListView__item[data-id='" + idArray[i] + "']", this._container).find('.js-controls-ListView__itemCheckBox').first().addClass('controls-ListView__itemCheckBox__multi');
         }
      }
   });

   return TreeViewDS;

});
