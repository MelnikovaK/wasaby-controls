import Control = require('Core/Control');
import ViewModel from './ViewModel';
import template = require('wml!Controls/_switchableArea/View');
import defaultItemTemplate from './ItemTpl';
import {IoC} from 'Env/Env';
import {factory} from 'Types/chain';


/**
 * Компонент, который переключает контентные области.
 *
 * @class Controls/_switchableArea/View
 * @extends Core/Control
 * @control
 * @public
 * @author Красильников А.С.
 * @demo Controls-demo/SwitchableArea/DemoSwitchableArea
 */

/*
 Component switches content areas.
*/

/**
 * @typedef {Object} SwitchableAreaItem
 * @property {String|Number} key
 * @property {Function} itemTemplate
 */

/**
 * @name Controls/_switchableArea/View#items
 * @cfg {Array.<SwitchableAreaItem>}
 */

/**
 * @name Controls/_switchableArea/View#selectedKey
 * @cfg {String} Ключ выбранного элемента.
 */

/*
 * @name Controls/_switchableArea/View#selectedKey
 * @cfg {String} Key of selected item.
 */

/**
 * @name Controls/_switchableArea/View#itemTemplate
 * @cfg {Function} Шаблон отображения элемента.
 */

/*
 * @name Controls/_switchableArea/View#itemTemplate
 * @cfg {Function} Template for item render.
 */

var View = Control.extend({
    _template: template,

    _beforeMount: function (options) {
        this._correctSelectedKey(options);
        this._viewModel = new ViewModel(options.items, this._selectedKey);

        // if(options.items.id){
        //    IoC.resolve('ILogger').warn('SwitchableArea', 'items.id will be deprecated and removed in 19.700. Use items.key');
        // }
    },

    _beforeUpdate: function (newOptions) {
        this._correctSelectedKey(newOptions);
        if (this._options.items !== newOptions.items) {
            this._viewModel.updateItems(newOptions.items);
        }
        if (this._options.selectedKey !== newOptions.selectedKey) {
            this._viewModel.updateSelectedKey(this._selectedKey);
        }
    },

    _beforeUnmount: function () {
        this._viewModel = null;
    },

    _correctSelectedKey: function (options) {
        this._selectedKey = null;
        factory(options.items).each((item) => {
            if (item.get) {
                if (options.selectedKey === item.get('id') || options.selectedKey === item.get('key')) {
                    this._selectedKey = options.selectedKey;
                }
            } else {
                if (options.selectedKey === item.id || options.selectedKey === item.key) {
                    this._selectedKey = options.selectedKey;
                }
            }
        });

        if (!this._selectedKey) {
            IoC.resolve('ILogger').error(this._moduleName, 'Incorrect selectedKey');
            if (options.items instanceof Array) {
                this._selectedKey = options.items[0].id || options.items[0].key;
            } else {
                this._selectedKey = options.items.at(0).get('id') || options.items.at(0).get('key');
            }
        }
    }
});

View.getDefaultOptions = function () {
    return {
        itemTemplate: defaultItemTemplate
    };
};

export default View;
