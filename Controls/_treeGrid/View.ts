import {View as Grid} from 'Controls/grid';
import TreeGridViewModel = require('Controls/_treeGrid/TreeGridView/TreeGridViewModel');
import entity = require('Types/entity');
import TreeGridView = require('Controls/_treeGrid/TreeGridView/TreeGridView');
import TreeControl = require('Controls/_treeGrid/TreeControl');


   /**
    * Hierarchical list with custom item template. Can load data from data source.
    * The detailed description and instructions on how to configure the control you can read <a href='https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list/'>here</a>.
    * List of examples:
    * <ul>
    *    <li><a href="/materials/demo-ws4-edit-in-place">How to configure editing in your list</a>.</li>
    *    <li><a href="/materials/demo-ws4-tree-singleexpand">Tree with singleExpand option</a>.</li>
    * </ul>
    *
    * @class Controls/_treeGrid/View
    * @extends Controls/_grid/Grid
    * @mixes Controls/_interface/ISource
    * @mixes Controls/interface/IItemTemplate
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IGrouped
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/_list/interface/IList
    * @mixes Controls/_list/interface/IHierarchy
    * @mixes Controls/_list/interface/ITreeControl
    * @mixes Controls/interface/ITreeGridItemTemplate
    * @mixes Controls/_tile/interface/IDraggable
    *
    * @mixes Controls/_list/interface/IVirtualScroll
    * @mixes Controls/_list/BaseControlStyles
    * @mixes Controls/_list/ListStyles
    * @mixes Controls/_grid/GridStyles
    * @mixes Controls/_treeGrid/Styles
    * @mixes Controls/_list/ItemActions/ItemActionsStyles
    * @mixes Controls/_list/Swipe/SwipeStyles
    *
    * @mixes Controls/_list/Mover/MoveDialog/Styles
    * @mixes Controls/_paging/PagingStyles
    * @mixes Controls/_paging/DigitButtonsStyles
    * @mixes Controls/_grid/SortButtonStyles
    *
    * @control
    * @public
    * @author Авраменко А.С.
    * @category List
    * @demo Controls-demo/List/TreeGrid/BasePG
    */

   var Tree = Grid.extend(/** @lends Controls/TreeGrid */{
      _viewName: TreeGridView,
      _viewTemplate: TreeControl,
      _getModelConstructor: function() {
         return TreeGridViewModel;
      },
      getOptionTypes: function() {
         return {
            keyProperty: entity.descriptor(String).required(),
            parentProperty: entity.descriptor(String).required()
         };
      },
      // todo removed or documented by task:
      // https://online.sbis.ru/opendoc.html?guid=24d045ac-851f-40ad-b2ba-ef7f6b0566ac
      toggleExpanded: function(id) {
         this._children.listControl.toggleExpanded(id);
      }
   });
   export = Tree;

