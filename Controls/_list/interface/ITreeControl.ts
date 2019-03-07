/**
 * Interface for tree-like lists.
 *
 * @interface Controls/List/interface/ITreeControl
 * @public
 * @author Авраменко А.С.
 */


/**
 * @typedef {String} hierarchyViewModeEnum
 * @variant tree Tree-like view.
 * @variant breadcrumbs Just leaves, folders as paths.
 */

/**
 * @name Controls/List/interface/ITreeControl#expandedItems
 * @cfg {{Array.<String>}} Array of identifiers of expanded items.
 * <b>Note:</b>
 * To expand all items, this option must be set as array containing one element “null”.
 * In this case, it is assumed that all data will be loaded initially.
 * <a href="/materials/demo-ws4-tree-grid-base">Example</a>.
 */

/**
 * @name Controls/List/interface/ITreeControl#collapsedItems
 * @cfg {Boolean} Array of identifiers of collapsed items.
 * This option is used only when the value of  {@link Controls/List/interface/ITreeControl#expandedItems expandedItems} is [null].
 * <a href="/materials/demo-ws4-tree-grid-base">Example</a>.
 */

/**
 * @name Controls/List/interface/ITreeControl#nodeFooterTemplate
 * @cfg {Function} Sets footer template that will be shown for every node.
 * <a href="/materials/demo-ws4-tree-grid-extended">Example</a>.
 */

/**
 * @name Controls/List/interface/ITreeControl#hasChildrenProperty
 * @cfg {String} Name of the field that contains information whether the node has children.
 * <a href="/materials/demo-ws4-tree-grid-extended">Example</a>.
 */

/**
 * @name Controls/List/interface/ITreeControl#expanderVisibility
 * @cfg {String} Mode displaying expander indent.
 * @variant visible Always show expander for nodes and indentation for leaves.
 * @variant hasChildren Show expander only for nodes with children.
 * @default visible
 * <a href="/materials/demo-ws4-tree-grid-extended">Example</a>.
 */


/**
 * @event Controls/List/interface/ITreeControl#itemExpanded Occurs after node expansion.
 */
/**
 * @event Controls/List/interface/ITreeControl#itemCollapsed Occurs after node collapse.
 */
