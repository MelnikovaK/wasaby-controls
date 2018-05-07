define('Controls/List/interface/IExplorer', [
], function() {
   /**
    * Interface for hierarchical lists that can open folders.
    *
    * @mixin Controls/List/interface/IExplorer
    * @public
    */

   /**
    * @typedef {String} explorerViewMode
    * @variant grid Table.
    * @variant list List.
    * @variant tile Tiles.
    */
   /**
    * @name Controls/List/interface/IExplorer#viewMode
    * @cfg {explorerViewMode} List view mode.
    */

   /**
    * @event Controls/List/interface/IExplorer#itemOpen Occurs before opening a folder.
    */
   /**
    * @event Controls/List/interface/IExplorer#itemOpened Occurs after the folder was opened.
    */

});
