define('Controls/interface/IFastFilter', [
], function() {

   /**
    * Interface for component Fast Filter
    * @interface Controls/interface/IFastFilter
    * @public
    * @author Герасимов А.М.
    */

   /**
    * @typedef {Object} PropertiesFastFilter
    * @property {String} keyProperty Name of the item property that uniquely identifies collection item.
    * @property {String} displayProperty Name of the item property that content will be displayed. Only affects the value when selecting.
    * @property {Types/source:Base} source Object that implements ISource interface for data access. If 'items' is specified, 'source' will be ignored.
    * @property {Boolean} multiSelect Determines whether multiple selection is set.
    * @property {Controls/interface/ISelectorDialog} selectorTemplate Items selection panel template.
    * @property {Function} itemTemplate Template for item render. For more information, see {@link Controls/interface/IDropdown#itemTemplate}
    * @property {String} itemTemplateProperty Name of the item property that contains template for item render. For more information, see {@link Controls/interface/IDropdown#itemTemplateProperty}
    * @property {Object} filter Filter configuration - object with field names and their values. {@link Controls/interface/IFilter}
    * @property {Object} navigation List navigation configuration. Configures data source navigation (pages, offset, position) and navigation view (pages, infinite scroll, etc.) {@link Controls/interface/INavigation}
    * @property {Types/collection:IList} items Special structure for the visual representation of the filter. {@link Types/collection:IList}.
    */

   /**
    * @typedef {Types/source:Base} FastFilterSource
    * @property {String} id Name of filter field.
    * @property {*} value Current filter field value.
    * @property {*} resetValue Value for reset.
    * @property {*} textValue Text value of filter field. Used to display a textual representation of the filter.
    * @property {PropertiesFastFilter} properties Fast filter settings.
    */

   /**
    * @name Controls/interface/IFastFilter#source
    * @cfg {FastFilterSource} Sets the source of data set to use in the mapping.
    * @example
    * TMPL:
    * <pre>
    *    <Controls.Filter.Fast
    *              bind:selectedKey='_selectedKey'
    *              source="{{_source}}"
    *    />
    * </pre>
    * JS:
    * <pre>
    *    this._source = new MemorySource({
    *       idProperty: 'id',
    *       data: [
    *          {id: 'genre',
    *           resetValue: '0',
    *           value: '0',
    *           properties: {
    *              keyProperty: 'key',
    *              displayProperty: 'title',
    *              source: new MemorySource({
    *                 idProperty: 'id',
    *                 data: [
    *                    { key: '0', title: 'все жанры' },
    *                    { key: '1', title: 'фантастика' },
    *                    { key: '2', title: 'фэнтези' },
    *                    { key: '3', title: 'мистика' }
    *                ]
    *              })
    *           }, ...
    *       ]
    *    });
    * </pre>
    */

   /**
    * @event Controls/interface/IFastFilter#filterChanged Happens when filter changed.
    * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
    * @param {Object} filter New filter.
    */

});
