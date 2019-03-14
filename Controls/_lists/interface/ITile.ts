/**
 * Interface for lists in which items are displayed as tiles.
 *
 * @interface Controls/List/interface/ITile
 * @public
 * @author Авраменко А.С.
 */

/**
 * @name Controls/List/interface/ITile#tileHeight
 * @cfg {Number} The height of the tile items.
 * @default 150
 * @remark This option is required to calculate element sizes when rendering on the server.
 * If you set the height using css, the component cannot be displayed immediately in the correct state.
 * @example
 * The following example shows how to set the height of items to 200 pixels.
 * <pre>
 *    <Controls.Tile tileHeight="{{200}}"
 *                   source="{{_viewSource}}"
 *                   keyProperty="id"
 *                   parentProperty="Раздел"
 *                   nodeProperty="Раздел@"/>
 * </pre>
 */

/**
 * @name Controls/List/interface/ITile#tileScalingMode
 * @cfg {String} Scale mode for items when you hover over them.
 * @variant none On hover the size of the items is not changed.
 * @variant outside On hover the size of the items increases. The increased item is located within the browser window.
 * @variant inside On hover the size of the items increases. The increased item is located within the control container.
 * @default none
 * @remark The increased item is positioned in the center relative to the initial position.
 * If the increased item does not fit in the specified container, the increase does not occur.
 * @example
 * The following example shows how to set the hover mode to 'outside'.
 * <pre>
 *    <Controls.Tile itemsHeight="{{200}}"
 *                   scaleTileMode="outside"
 *                   source="{{_viewSource}}"
 *                   keyProperty="id"
 *                   parentProperty="Раздел"
 *                   nodeProperty="Раздел@"/>
 * </pre>
 */

/**
 * @name Controls/List/interface/ITile#imageProperty
 * @cfg {String} Name of the item property that contains the link to the image.
 * @default image
 * @remark The increased item is positioned in the center relative to the initial position.
 * If the increased item does not fit in the specified container, the increase does not occur.
 * @example
 * The following example shows how to set the field with the image 'img'.
 * <pre>
 *    <Controls.Tile source="{{_viewSource}}"
 *                   keyProperty="id"
 *                   parentProperty="Раздел"
 *                   nodeProperty="Раздел@">
 *       <ws:itemTemplate>
 *          <ws:partial template="wml!Controls/_lists/TreeTileView/DefaultItemTpl"
 *                      imageProperty="img" >
 *       </ws:itemTemplate>
 *    </Controls.Tile>
 * </pre>
 */
