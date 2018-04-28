define('Controls/TreeGrid', [
   'Controls/Grid',
   'Controls/List/TreeGrid/TreeGridViewModel',
   'tmpl!Controls/List/TreeGrid/TreeGrid',
   'Core/core-merge',
   'Controls/List/TreeGrid/TreeGridView',
   'css!Controls/List/TreeGrid/TreeGrid'
], function(Grid, TreeGridViewModel, TreeTpl, cMerge) {
   'use strict';

   var _private = {
      prepareModelConfig: function(cfg) {
         return {
            parentProperty: cfg.parentProperty,
            nodeProperty: cfg.nodeProperty
         };
      },
      prepareViewConfig: function(cfg) {
         return {
            parentProperty: cfg.parentProperty,
            nodeProperty: cfg.nodeProperty
         };
      }
   };

   /**
    * Компонент иерархического списка, отображаемого в виде дерева, с произвольным шаблоном отображения каждого элемента. Обладает возможностью загрузки/подгрузки данных из источника.
    * @class Controls/Tree
    * @extends Controls/Grid
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/ISingleSelectable
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IGroupedView
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/List/interface/IListControl
    * @mixes Controls/List/interface/IHierarchy
    * @mixes Controls/List/interface/ITreeControl
    * @control
    * @public
    * @category List
    */

   var Tree = Grid.extend({
      _template: TreeTpl,
      _getModelConstructor: function() {
         return TreeGridViewModel;
      },
      _prepareModelConfig: function(cfg) {
         return cMerge(Tree.superclass._prepareModelConfig(cfg), _private.prepareModelConfig(cfg));
      },
      _prepareViewConfig: function(cfg) {
         return cMerge(Tree.superclass._prepareViewConfig(cfg), _private.prepareViewConfig(cfg));
      }
   });
   return Tree;
});
