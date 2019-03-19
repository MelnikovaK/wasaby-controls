define('Controls/List/TreeControl', ['Controls/_treeGrids/TreeControl'], function(Control) {
   /**
    * Hierarchical list control with custom item template. Can load data from data source.
    *
    * @class Controls/List/TreeControl
    * @mixes Controls/interface/IEditableList
    * @mixes Controls/List/TreeGridView/Styles
    * @extends Controls/List/ListControl
    * @control
    * @public
    * @category List
    */
   return Control;
});
