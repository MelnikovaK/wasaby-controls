import {ICrudPlus} from 'Types/source';
export interface ISourceOptions {
   source?: ICrudPlus;
   keyProperty: string;
}

/**
 * Interface for components that use data source.
 *
 * @interface Controls/_interface/ISource
 * @public
 * @author Крайнов Д.О.
 */
export default interface ISource {
/**
 * @name Controls/_interface/ISource#source
 * @cfg {Types/source:Base} Object that implements ISource interface for working with data.
 * @example
 * The list will be rendered data from _source
 * <pre>
 *    <Controls.list:View
 *       source = "{{_source}}"
 *       keyProperty="key">
 *    </Controls.list:View>
 * </pre>
 * <pre>
 *    _source: new Memory({
 *       idProperty: 'key',
 *       data: [
 *       {
 *          key: '1',
 *          title: 'Yaroslavl'
 *       },
 *       {
 *          key: '2',
 *          title: 'Moscow'
 *       },
 *       {
 *          key: '3',
 *          title: 'St-Petersburg'
 *       }
 *       ]
 *    })
 * </pre>
 * @see link to source paper
 */

/**
 * @name Controls/_interface/ISource#keyProperty
 * @cfg {String} Name of the item property that uniquely identifies collection item.
 * @remark For example, the identifier may be the primary key of the record in the database.
 * @example
 * <pre>
 *    <Controls.list:View
 *       source = "{{_source}}"
 *       keyProperty="id">
 *    </Controls.list:View>
 * </pre>
 * <pre>
 *    _source: new Memory({
 *       idProperty: 'key',
 *       data: [
 *       {
 *          key: '1',
 *          title: 'Yaroslavl'
 *       },
 *       {
 *          key: '2',
 *          title: 'Moscow'
 *       },
 *       {
 *          key: '3',
 *          title: 'St-Petersburg'
 *       }
 *       ]
 *    })
 * </pre>
 *
 */
   readonly '[Controls/_interface/ISource]': boolean;
}
