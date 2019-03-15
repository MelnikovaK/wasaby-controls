import Control = require('Core/Control');
import SourceController = require('Controls/Controllers/SourceController');
import template = require('wml!Controls/_toolbars/View');
import toolbarItemTemplate = require('wml!Controls/_toolbars/ToolbarItemTemplate');
import {factory} from 'Types/collection';
import tUtil = require('Controls/Utils/Toolbar');
import {iconsUtil as validateIconStyle} from 'Controls/buttons';
import 'css!theme?Controls/_toolbars/View';
//TODO: Пока не добавлена возможность загружать темизированную css-ку, загружаю статически.
//TODO: https://online.sbis.ru/opendoc.html?guid=b963cb6d-f640-45a9-acdc-aab887ea2f4a
import 'css!theme?Controls/_toolbars/ToolbarPopup';

/**
 * Graphical control element on which buttons, menu and other input or output elements are placed.
 * <a href="/materials/demo-ws4-buttons">Demo-example</a>.
 *
 * @class Controls/Toolbar
 * @extends Core/Control
 * @mixes Controls/interface/ITooltip
 * @mixes Controls/interface/ISource
 * @mixes Controls/interface/IItemTemplate
 * @mixes Controls/List/interface/IHierarchy
 * @control
 * @public
 * @category Toolbar
 * @author Михайловский Д.С.
 * @demo Controls-demo/Toolbar/ToolbarPG
 */

/**
 * @name Controls/Toolbar#source
 * @cfg {Types/source:Base} Object that implements ISource interface for data access.
 * @default undefined
 * @remark
 * The item can have an property 'title' and 'showType'. 'Title' determine item caption. 'ShowType' determine where display item, 0 - show in menu,
 * 1 - show on menu and toolbar, 2 - show in toolbar.
 * @example
 * Tabs buttons will be rendered data from _source. First item render with left align, other items render with defult, right align.
 * <pre>
 *    <Controls.Toolbar
 *              keyProperty="key"
 *              source="{{_source}}"
 *    />
 * </pre>
 * <pre>
 *    _source: new Memory({
    *        idProperty: 'key',
    *        data: [
    *        {
    *           id: '1'
    *           showType: 2,
    *           icon: 'icon-Time',
    *           '@parent': false,
    *           parent: null
    *        },
    *        {
    *           id: '2',
    *           title: 'Moscow',
    *           '@parent': false,
    *           parent: null
    *        },
    *        {
    *           id: '3',
    *           title: 'St-Petersburg',
    *           '@parent': false,
    *           parent: null
    *        }
    *        ]
    *    })
 * </pre>
 */

/**
 * @name Controls/Toolbar#itemsSpacing
 * @cfg {String} Type of spacing between items.
 * @default medium
 * @example
 * Tabs buttons will be rendered data from _source. First item render with left align, other items render with defult, right align.
 * <pre>
 *    <Controls.Toolbar
 *              keyProperty="key"
 *              source="{{_source}}"
 *              itemsSpacing="big"
 *    />
 * </pre>
 */

/**
 * @event Controls/Toolbar#itemClick Occurs when item was clicked.
 * @param {Core/vdom/Synchronizer/resources/SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Record} item Clicked item.
 * @example
 * TMPL:
 * <pre>
 *    <Controls.Toolbar on:itemClick="onToolbarItemClick()" />
 * </pre>
 * JS:
 * <pre>
 *    onToolbarItemClick: function(e, selectedItem) {
    *       var itemId = selectedItem.get('id');
    *       switch (itemId) {
    *          case 'remove':
    *             this._removeItems();
    *             break;
    *          case 'move':
    *             this._moveItems();
    *             break;
    *    }
    * </pre>
    */

/**
 * @name Controls/Toolbar#itemTemplate
 * @cfg {Function} Template for item render.
 * @remark
 * To determine the template, you should call the base template 'Controls/toolbars:ToolbarItemTemplate'.
 * The template is placed in the component using the ws:partial tag with the template attribute.
 * You can change the display of records by setting button options values:
 * <ul>
 *    <li>buttonReadOnly</li>
 *    <li>buttonTransparent</li>
 *    <li>buttonStyle</li>
 *    <li>buttonCaption</li>
 *    <li>buttonViewMode</li>
 *    <li>displayProperty - name of displaying text field, default value "tittle"</li>
 * <ul>
 * @example
 * <pre>
 *    <Controls.Toolbar
 *       source="{{_source}}"
 *       on:itemClick="_itemClick()"
 *    >
 *       <ws:itemTemplate>
 *          <ws:partial
 *             template="Controls/toolbars:ToolbarItemTemplate"
 *             buttonStyle="{{myStyle}}"
 *             buttonReadOnly="{{readOnlyButton}}"
 *             buttonTransparent="{{myButtonTransparent}}"
 *             buttonViewMode="{{myButtonViewMode}}"
 *             displayProperty="title"
 *             iconStyleProperty="iconStyle"
 *             iconProperty="icon"
 *          />
 *      </ws:itemTemplate>
 * </pre>
 */

/**
 * @name Controls/Toolbar#popupClassName
 * @cfg {String} Class for drop-down list in toolbar menu.
 * @example
 * <pre>
 *    <Controls.Toolbar
 *       popupClassName="your-custom-class"
 *       source="{{_source}}"
 *       on:itemClick="_itemClick()"/>
 * </pre>
 */

var _private = {
    loadItems: function (instance, source) {
        var self = this;

        instance._sourceController = new SourceController({
            source: source
        });
        return instance._sourceController.load().addCallback(function (items) {
            instance._items = items;

            // TODO: убрать когда полностью откажемся от поддержки задавания цвета в опции иконки. icon: icon-error, icon-done и т.д.
            // TODO: https://online.sbis.ru/opendoc.html?guid=05bbeb41-d353-4675-9f73-6bfc654a5f00
            validateIconStyle.itemsSetOldIconStyle(instance._items);
            instance._menuItems = self.getMenuItems(instance._items);
            instance._needShowMenu = instance._menuItems && instance._menuItems.getCount();
            return items;
        });
    },

    getMenuItems: function (items) {
        return tUtil.getMenuItems(items).value(factory.recordSet, {
            adapter: items.getAdapter(),
            idProperty: items.getIdProperty(),
            format: items.getFormat()
        });
    },

    setPopupOptions: function (self, newOptions) {
        self._popupOptions = {
            className: (newOptions.popupClassName || '') + ' controls-Toolbar__popup__list',
            corner: {vertical: 'top', horizontal: 'right'},
            horizontalAlign: {side: 'left'},
            eventHandlers: {
                onResult: self._onResult,
                onClose: self._closeHandler
            },
            opener: self,
            templateOptions: {
                keyProperty: newOptions.keyProperty,
                parentProperty: newOptions.parentProperty,
                nodeProperty: newOptions.nodeProperty,
                showClose: true
            }
        };
    },

    generateItemPopupConfig: function (item, event, self) {
        var itemConfig = '';
        if (item.get('icon') !== undefined && item.get('tittle') === undefined) {
            itemConfig += 'icon';
        }
        if (item.get('buttonViewMode') === 'toolButton') {
            itemConfig += 'toolButton';
        }
        return {
            corner: {vertical: 'top', horizontal: 'left'},
            horizontalAlign: {side: 'right'},
            className: 'controls-Toolbar__popup__' + (itemConfig || 'link') + ' ' + (item.get('popupClassName') || ''),
            templateOptions: {
                items: self._items,
                rootKey: item.get(self._options.keyProperty),
                showHeader: item.get('showHeader'),
                headConfig: {
                    icon: item.get('icon'),
                    caption: item.get('title'),
                    iconStyle: item.get('iconStyle')
                }
            },
            target: event.currentTarget
        };
    },

    generateMenuConfig: function (self) {
        return {
            className: 'controls-Toolbar__popup__list ' + (self._options.popupClassName || ''),
            templateOptions: {
                items: self._menuItems,
                itemTemplateProperty: self._options.itemTemplateProperty
            },
            target: self._children.popupTarget
        };
    },
    openPopup: function (config, self) {
        self._children.menuOpener.open(config, self);
    }
};

var Toolbar = Control.extend({
    showType: tUtil.showType,
    _template: template,
    _defaultItemTemplate: toolbarItemTemplate,
    _needShowMenu: null,
    _menuItems: null,
    _parentProperty: null,
    _nodeProperty: null,
    _items: null,
    _popupOptions: null,

    constructor: function () {
        this._onResult = this._onResult.bind(this);
        this._closeHandler = this._closeHandler.bind(this);
        Toolbar.superclass.constructor.apply(this, arguments);
    },
    _beforeMount: function (options, context, receivedState) {
        this._parentProperty = options.parentProperty;
        this._nodeProperty = options.nodeProperty;

        _private.setPopupOptions(this, options);
        if (receivedState) {
            this._items = receivedState;

            // TODO: убрать когда полностью откажемся от поддержки задавания цвета в опции иконки. icon: icon-error, icon-done и т.д.
            // TODO: https://online.sbis.ru/opendoc.html?guid=05bbeb41-d353-4675-9f73-6bfc654a5f00
            validateIconStyle.itemsSetOldIconStyle(this._items);
            this._menuItems = _private.getMenuItems(this._items);
            this._needShowMenu = this._menuItems && this._menuItems.getCount();
        } else if (options.source) {
            return _private.loadItems(this, options.source);
        }
    },
    _beforeUpdate: function (newOptions) {
        if (newOptions.keyProperty !== this._options.keyProperty ||
            this._options.parentProperty !== newOptions.parentProperty ||
            this._options.nodeProperty !== newOptions.nodeProperty ||
            this._options.popupClassName !== newOptions.popupClassName) {
            _private.setPopupOptions(this, newOptions);
        }
        if (newOptions.source && newOptions.source !== this._options.source) {
            _private.loadItems(this, newOptions.source).addCallback(function () {
                this._forceUpdate();
            }.bind(this));
        }
        this._nodeProperty = newOptions.nodeProperty;
        this._parentProperty = newOptions.parentProperty;
    },
    _onItemClick: function (event, item) {
        if (item.get(this._nodeProperty)) {
            var config = _private.generateItemPopupConfig(item, event, this);
            _private.openPopup(config, this);

            // TODO нотифай событий menuOpened и menuClosed нужен для работы механизма корректного закрытия превьювера переделать
            // TODO по задаче https://online.sbis.ru/opendoc.html?guid=76ed6751-9f8c-43d7-b305-bde84c1e8cd7

            this._notify('menuOpened', [], {bubbling: true});
        }
        event.stopPropagation();
        this._notify('itemClick', [item]);
        item.handler && item.handler(item);
    },

    _showMenu: function () {
        var config = _private.generateMenuConfig(this);
        this._notify('menuOpened', [], {bubbling: true});
        _private.openPopup(config, this);
    },

    _onResult: function (result) {
        if (result.action === 'itemClick') {
            var item = result.data[0];
            this._notify('itemClick', [item]);

            // menuOpener may not exist because toolbar can be closed by toolbar parent in item click handler
            if (this._children.menuOpener && !item.get(this._nodeProperty)) {
                this._children.menuOpener.close();
            }
        }
    },

    _closeHandler: function () {
        this._notify('menuClosed', [], {bubbling: true});
    }
});

Toolbar.getDefaultOptions = function() {
    return {
        itemsSpacing: 'medium'
    };
};

Toolbar._private = _private;

export default Toolbar;
