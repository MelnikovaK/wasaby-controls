define('Controls/List/interface/IList', [
], function() {

   /**
    * Interface for lists.
    *
    * @interface Controls/List/interface/IList
    * @public
    * @author Авраменко А.С.
    */

   /**
    * @name Controls/List/interface/IList#contextMenuVisibility
    * @cfg {Boolean} Determines whether context menu should be shown on right-click.
    * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
    * @default true
    */

   /**
    * @name Controls/List/interface/IList#emptyTemplate
    * @cfg {Function} Template for the empty list.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    * @remark
    * We recommend to use default template for emptyTemplate: wml!Controls/List/emptyTemplate
    * The template accepts the following options:
    * - contentTemplate content of emptyTemplate
    * - topSpacing Spacing between top border and content of emptyTemplate
    * - bottomSpacing Spacing between bottom border and content of emptyTemplate
    * @example
    * <pre>
    *    <Controls.List>
    *       <ws:emptyTemplate>
    *          <ws:partial template="wml!Controls/List/emptyTemplate" topSpacing="xl" bottomSpacing="l">
    *             <ws:contentTemplate>Нет данных</ws:contentTemplate>
    *          </ws:partial>
    *       </ws:emptyTemplate>
    *    </Controls.List
    * </pre>
    */

   /**
    * @name Controls/List/interface/IList#footerTemplate
    * @cfg {Function} Template that will be rendered below the list.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    */

   /**
    * @name Controls/List/interface/IList#resultsTemplate
    * @cfg {Function} Results row template.
    */

   /**
    * @name Controls/List/interface/IList#resultsPosition
    * @cfg {String} Results row position.
    * @variant top Show results above the list.
    * @variant bottom Show results below the list.
    */

   /**
    * @typedef {Object} VirtualScrollConfig
    * @property {Number} maxVisibleItems Maximum number of rendered items.
    */

   /**
    * @name Controls/List/interface/IList#virtualScrollConfig
    * @cfg {VirtualScrollConfig} Virtual scroll config.
    */

   /**
    * @name Controls/List/interface/IList#sorting
    * @cfg {Array} Determinates sorting for list.
    * @example
    * [
    *    { price: 'desc' },
    *    { balance: 'asc' }
    * ]
    */

   /**
    * @name Controls/List/interface/IList#multiSelectVisibility
    * @cfg {String} Whether multiple selection is enabled.
    * <a href="/materials/demo-ws4-list-multiselect">Example</a>.
    * @variant visible Show.
    * @variant hidden Do not show.
    * @variant onhover Show on hover.
    * @default hidden
    */

   /**
    * @typedef {Object} ItemAction
    * @property {String} id Identifier of operation.
    * @property {String} title Operation name.
    * @property {String} icon Operation icon.
    * @property {Number} showType Location of operation.
    * @property {String} style Operation style.
    * @property {String} iconStyle Style of the action's icon. (secondary | warning | danger | success).
    * @property {Function} handler Operation handler.
    */

   /**
    * @name Controls/List/interface/IList#itemActions
    * @cfg {Array.<ItemAction>} Array of configuration objects for buttons which will be shown when the user hovers over an item.
    * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
    */

   /**
    * @name Controls/List/interface/IList#itemActionsPosition
    * @cfg {String} Position of item actions.
    * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
    * @variant inside Item actions will be positioned inside the item's row.
    * @variant outside Item actions will be positioned under the item's row.
    */

   /**
    * @event Controls/List/interface/IList#itemActionsClick
    * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
    * @param {ItemAction} action Object with configuration of the clicked action.
    * @param {WS.Data/Entity/Model} item Instance of the item whose action was clicked.
    * @param {HTMLElement} itemContainer Container of the item whose action was clicked.
    */

   /**
    * @name Controls/List/interface/IList#itemActionVisibilityCallback
    * @cfg {function} item operation visibility filter function
    * @param {ItemAction} action Object with configuration of an action.
    * @param {WS.Data/Entity/Model} item Instance of the item whose action is being processed.
    * @returns {Boolean} Determines whether the action should be rendered.
    */

   /**
    * @name Controls/List/interface/IList#markedKey
    * @cfg {Number} Identifier of the marked collection item.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    */

   /**
    * @name Controls/List/interface/IList#markerVisibility
    * @cfg {String} Determines when marker is visible.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    * @variant visible The marker is always displayed, even if the marked key entry is not specified.
    * @variant hidden The marker is always hidden.
    * @variant onactivated - The marker is displayed on List activating. For example, when user mark a record.
    * @default onactivated
    */

   /**
    * @name Controls/List/interface/IList#uniqueKeys
    * @cfg {String} Strategy for loading new list items.
    * @remark
    * true - Merge, items with the same identifier will be combined into one.
    * false - Add, items with the same identifier will be shown in the list.
    */

   /**
    * @name Controls/List/interface/IList#itemsReadyCallback
    * @cfg {Function} Callback function that will be called when list data instance is ready.
    */

   /**
    * @name Controls/List/interface/IList#dataLoadCallback
    * @cfg {Function} Callback function that will be called when list data loaded by source
    */

   /**
    * @name Controls/List/interface/IList#dataLoadErrback
    * @cfg {Function} Callback function that will be called when data loading fail
    */

   /**
    * @function Controls/List/interface/IList#reload
    * Reloads list data and view.
    */

   /**
    * @function Controls/List/interface/IList#reloadItem
    * Loads model from data source, merges changes into the current data and renders the item.
    */

   /**
    * @event Controls/List/interface/IList#itemClick Occurs when list item is clicked.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    */

   /**
    * @event Controls/List/interface/IList#hoveredItemChanged The event fires when the user hovers over a list item with a cursor.
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
    * @param {WS.Data/Entity/Model} item Instance of the item whose action was clicked.
    * @param {HTMLElement} itemContainer Container of the item.
    */

   /**
    * @event  Controls/List/interface/IList#markedKeyChanged Occurs when list item was selected (marked).
    * <a href="/materials/demo-ws4-list-base">Example</a>.
    * @param {Number} key Key of the selected item.
    */
});
