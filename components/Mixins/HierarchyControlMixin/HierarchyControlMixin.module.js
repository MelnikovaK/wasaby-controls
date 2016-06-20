/* global define, $ws */
define('js!SBIS3.CONTROLS.HierarchyControlMixin', [
   'js!SBIS3.CONTROLS.HierarchyControl.HierarchyView',
   'js!WS.Data.Collection.IBind',
   'js!WS.Data.Display.Tree',
   'js!WS.Data.Collection.LoadableList'
], function (HierarchyView, IBindCollection, TreeProjection, LoadableList) {
   'use strict';

   /**
    * Миксин, задающий любому контролу поведение работы с иерархией
    * *Это экспериментальный модуль, API будет меняться!*
    * @mixin SBIS3.CONTROLS.HierarchyControlMixin
    * @state mutable
    * @author Крайнов Дмитрий Олегович
    */

   var HierarchyControlMixin = /**@lends SBIS3.CONTROLS.HierarchyControlMixin.prototype  */{
      $protected: {
         _options: {
            /**
             * @cfg {String} Название свойства, содержащего идентификатор узла.
             */
            idProperty: '',

            /**
             * @cfg {String} Название свойства, содержащего идентификатор родительского узла. Используется только в случае, если {@link items} не реализует {@link WS.Data.Display.Tree}.
             * @remark Нужно только для того, чтобы передать в конструктор {@link WS.Data.Display.Tree}
             */
            parentProperty: '',

            /**
             * @cfg {String} Название свойства, содержащего признак узла. Используется только в случае, если {@link items} не реализует {@link WS.Data.Display.Tree}.
             * @remark Нужно только для того, чтобы передать в конструктор {@link WS.Data.Display.Tree}
             */
            nodeProperty: '',

            /**
             * @cfg {String} Название свойства, содержащего дочерние элементы узла. Используется только в случае, если {@link items} является массивом и не реализует {@link WS.Data.Display.Tree}.
             * @remark Нужно только для того, чтобы передать в конструктор {@link WS.Data.Display.Tree}
             */
            childrenProperty: '',

            /**
             * @cfg {WS.Data.Display.TreeItem|Object|String|Number} Корневой узел или его содержимое, или его идентификатор
             * @remark Нужно только для того, чтобы передать в конструктор {@link WS.Data.Display.Tree}
             */
            root: undefined
         },

         /**
          * @var {WS.Data.Display.Tree} Проекция дерева
          */
         _itemsProjection: undefined,

         _viewConstructor: HierarchyView,

         /**
          * @var {SBIS3.CONTROLS.HierarchyControl.HierarchyView} Представление иерархии
          */
         _view: undefined,
         
         /**
          * @var {Boolean} Менять текущий раздел по клику на узел
          */
         _changeRootOnClick: true,

         /**
          * @var {WS.Data.Display.TreeItem} Текущий узел дерева
          */
         _currentRoot: undefined,

         /**
          * @var {Function} Обрабатывает событие о начале загрузки узла
          */
         _onBeforeNodeLoad: undefined,

         /**
          * @var {Function} Обрабатывает событие об окончании загрузки узла
          */
         _onAfterNodeLoad: undefined
      },

      around: {
         _setItems: function (prevFn, items) {
            if (!$ws.helpers.instanceOfModule(items, 'WS.Data.Display.Display')) {
               items = new TreeProjection({
                  collection: this._convertItems(items),
                  idProperty: this._options.idProperty || (this._options.dataSource ? this._options.dataSource.getIdProperty() : ''),
                  parentProperty: this._options.parentProperty,
                  nodeProperty: this._options.nodeProperty,
                  childrenProperty: this._options.childrenProperty,
                  root: this._options.root
               });
            }

            prevFn.call(this, items);

            this._setCurrentRoot(this._itemsProjection.getRoot());
         }
      },

      after: {
         _bindHandlers: function () {
            this._onCollectionChange = this._onCollectionChange.callAround(onCollectionChange.bind(this));
            //this._onCollectionChange = onCollectionChange.bind(this);
            this._onBeforeNodeLoad = onBeforeNodeLoad.bind(this);
            this._onAfterNodeLoad = onAfterNodeLoad.bind(this);
         },

         _onItemClicked: function (event, hash) {
            if (this._changeRootOnClick) {
               this.changeRoot(hash);
            }
         }
      },

      //region Public methods

      /**
       * Сменяет отображаемый корень дерева
       * @param {String} hash Хэш элемента дерева
       */
      changeRoot: function (hash) {
         var item = this._itemsProjection.getByHash(hash);
         if (!item.isNode()) {
            return;
         }
         this._setCurrentRoot(
            item
         );
         this.redraw();

         if ($ws.helpers.instanceOfMixin(item, 'WS.Data.Collection.ISourceLoadable') &&
            (!item.isLoaded() || item.isQueryChanged())
         ) {
            item.load();
         }
      },

      //endregion Public methods

      //region Protected methods

      //region Collection
      
      /**
       * Устанавливает текущий отображаемый узел
       * @param {WS.Data.Display.TreeItem} node Узел
       * @private
       */
      _setCurrentRoot: function (node) {
         this._currentRoot = node;
      },

      _convertDataSourceToItems: function (source) {
         return new LoadableList({
            source: source
         });
      },

      _getItemsForRedraw: function () {
         return this._itemsProjection.getChildren(this._currentRoot);
      }

      //endregion Collection

      //region Behavior

      //endregion Behavior

      //endregion Protected methods
   };
   
   /**
    * Обрабатывает событие об изменении потомков узла дерева исходного дерева
    * @param {Function} prevFn Оборачиваемый метод
    * @param {$ws.proto.EventObject} event Дескриптор события.
    * @param {String} action Действие, приведшее к изменению.
    * @param {WS.Data.Display.TreeItem[]} [newItems] Новые элементы коллеции.
    * @param {Integer} [newItemsIndex] Индекс, в котором появились новые элементы.
    * @param {WS.Data.Display.TreeItem[]} [oldItems] Удаленные элементы коллекции.
    * @param {Integer} [oldItemsIndex] Индекс, в котором удалены элементы.
    * @private
    */
   var onCollectionChange = function (prevFn, event, action, newItems, newItemsIndex, oldItems, oldItemsIndex) {
      switch (action) {
         case IBindCollection.ACTION_RESET:
            var newItemsNode = newItems.length ? newItems[0].getParent() : (oldItems.length ? oldItems[0].getParent() : undefined);
            if (newItemsNode) {
               if (newItemsNode &&
                  !(newItemsNode.isRoot() || newItemsNode === this._currentRoot)
               ) {
                  this._view.renderNode(newItemsNode);
               } else {
                  this.redraw();
               }
               return;
            }
            break;
      }

      Array.prototype.shift.call(arguments);
      prevFn.apply(this, arguments);
   },
   
   /**
    * Обработчик перед загрузкой загрузки узла
    * @private
    */
   onBeforeNodeLoad = function () {
      this.itemsLoading();
   },

   /**
    * Обработчик после загрузки загрузки узла
    * @private
    */
   onAfterNodeLoad = function () {
      this.itemsLoaded();
   };

   return HierarchyControlMixin;
});

