define('Controls/Explorer', [
   'Core/Control',
   'wml!Controls/Explorer/Explorer',
   'Controls/List/SearchView/SearchGridViewModel',
   'Controls/List/TreeGridView/TreeGridViewModel',
   'Controls/List/TreeTileView/TreeTileViewModel',
   'Controls/Utils/tmplNotify',
   'Controls/Utils/applyHighlighter',
   'Types/chain',
   'Core/core-instance',
   'Core/constants',
   'Controls/Utils/keysHandler',
   'Controls/List/TreeTileView/TreeTileView',
   'Controls/List/TreeGridView/TreeGridView',
   'Controls/List/SearchView',
   'Controls/List/TreeControl',
   'Types/entity',
   'Controls/TreeGrid',
   'Controls/BreadCrumbs/Path'
], function(
   Control,
   template,
   SearchGridViewModel,
   TreeGridViewModel,
   TreeTileViewModel,
   tmplNotify,
   applyHighlighter,
   chain,
   cInstance,
   cConstants,
   keysHandler
) {
   'use strict';

   var
      HOT_KEYS = {
         backByPath: cConstants.key.backspace
      };

   var
      ITEM_TYPES = {
         node: true,
         hiddenNode: false,
         leaf: null
      },
      DEFAULT_VIEW_MODE = 'table',
      VIEW_NAMES = {
         search: 'Controls/List/SearchView',
         tile: 'Controls/List/TreeTileView/TreeTileView',
         table: 'Controls/List/TreeGridView/TreeGridView'
      },
      VIEW_MODEL_CONSTRUCTORS = {
         search: SearchGridViewModel,
         tile: TreeTileViewModel,
         table: TreeGridViewModel
      },
      _private = {
         setRoot: function(self, root) {
            self._root = root;
            self._notify('itemOpen', root);
            if (typeof self._options.itemOpenHandler === 'function') {
               self._options.itemOpenHandler(root);
            }
         },
         dataLoadCallback: function(self, data) {
            var metaData = data.getMetaData();
            if (metaData.path && metaData.path.getCount() > 0) {
               self._breadCrumbsItems = chain.factory(metaData.path).toArray();
            } else {
               self._breadCrumbsItems = null;
            }
            self._forceUpdate();
            if (self._options.dataLoadCallback) {
               self._options.dataLoadCallback(data);
            }
         },
         setViewMode: function(self, viewMode) {
            if (viewMode === 'search') {
               self._root = self._options.root;
            }
            self._viewMode = viewMode;
            self._swipeViewMode = viewMode === 'search' ? 'table' : viewMode;
            self._viewName = VIEW_NAMES[viewMode];
            self._viewModelConstructor = VIEW_MODEL_CONSTRUCTORS[viewMode];
            self._leftPadding = viewMode === 'search' ? 'search' : undefined;
         },
         backByPath: function(self) {
            if (self._breadCrumbsItems && self._breadCrumbsItems.length > 0) {
               if (self._breadCrumbsItems.length > 1) {
                  _private.setRoot(self, self._breadCrumbsItems[self._breadCrumbsItems.length - 2].getId());
               } else {
                  _private.setRoot(self, self._options.root);
               }
            }
         }
      };

   /**
    * Hierarchical list that can expand and go inside the folders. Can load data from data source.
    *
    * @class Controls/Explorer
    * @extends Core/Control
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/IItemTemplate
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IEditableList
    * @mixes Controls/interface/IGroupedView
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/List/interface/IListControl
    * @mixes Controls/List/interface/IHierarchy
    * @mixes Controls/List/interface/ITreeControl
    * @mixes Controls/List/interface/IExplorer
    * @control
    * @public
    * @category List
    * @author Авраменко А.С.
    */

   var Explorer = Control.extend({
      _template: template,
      _breadCrumbsItems: null,
      _root: null,
      _viewName: null,
      _viewMode: null,
      _viewModelConstructor: null,
      _leftPadding: null,
      _dragOnBreadCrumbs: false,
      _hoveredBreadCrumb: undefined,

      _beforeMount: function(cfg) {
         this._dataLoadCallback = _private.dataLoadCallback.bind(null, this);
         this._root = this._options.root;
         this._breadCrumbsDragHighlighter = this._dragHighlighter.bind(this);
         _private.setViewMode(this, cfg.viewMode);
      },
      _beforeUpdate: function(cfg) {
         if (this._viewMode !== cfg.viewMode) {
            _private.setViewMode(this, cfg.viewMode);
         }
      },
      _dragEndBreadCrumbs: function(event, dragObject) {
         if (this._hoveredBreadCrumb !== undefined) {
            this._notify('dragEnd', [dragObject.entity, this._hoveredBreadCrumb, 'on']);
         }
      },
      _dragHighlighter: function(itemKey) {
         return this._dragOnBreadCrumbs && this._hoveredBreadCrumb === itemKey ? 'controls-BreadCrumbsView__dropTarget' : '';
      },
      _documentDragEnd: function() {
         this._dragOnBreadCrumbs = false;
      },
      _documentDragStart: function(event, dragObject) {
         if (cInstance.instanceOfModule(dragObject.entity, 'Controls/DragNDrop/Entity/Items')) {
            this._dragOnBreadCrumbs = true;
         }
      },
      _hoveredCrumbChanged: function(event, item) {
         this._hoveredBreadCrumb = item;
      },
      _onItemClick: function(event, item) {
         if (item.get(this._options.nodeProperty) === ITEM_TYPES.node) {
            _private.setRoot(this, item.getId());
         }
      },
      _onBreadCrumbsClick: function(event, itemId) {
         _private.setRoot(this, itemId);
      },
      _onExplorerKeyDown: function(event) {
         keysHandler(event, HOT_KEYS, _private, this);
      },
      beginEdit: function(options) {
         return this._children.treeControl.beginEdit(options);
      },
      beginAdd: function(options) {
         return this._children.treeControl.beginAdd(options);
      },
      cancelEdit: function() {
         return this._children.treeControl.cancelEdit();
      },
      commitEdit: function() {
         return this._children.treeControl.commitEdit();
      },
      reload: function() {
         return this._children.treeControl.reload();
      },
      _notifyHandler: tmplNotify,
      _applyHighlighter: applyHighlighter
   });

   Explorer._private = _private;
   Explorer._constants = {
      DEFAULT_VIEW_MODE: DEFAULT_VIEW_MODE,
      ITEM_TYPES: ITEM_TYPES,
      VIEW_NAMES: VIEW_NAMES,
      VIEW_MODEL_CONSTRUCTORS: VIEW_MODEL_CONSTRUCTORS
   };

   Explorer.getDefaultOptions = function() {
      return {
         multiSelectVisibility: 'hidden',
         viewMode: DEFAULT_VIEW_MODE,
         root: null
      };
   };

   return Explorer;
});
