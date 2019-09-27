/**
 * Created by kraynovdo on 16.11.2017.
 */
import BaseViewModel = require('Controls/_list/BaseViewModel');
import ItemsUtil = require('Controls/_list/resources/utils/ItemsUtil');
import cInstance = require('Core/core-instance');
import ControlsConstants = require('Controls/Constants');
import Env = require('Env/Env');
import collection = require('Types/collection');

/**
 *
 * @author Авраменко А.С.
 * @private
 */

var _private = {

    checkDeprecated: function(cfg) {

        if (cfg.leftSpacing && !this.leftSpacing) {
            this.leftSpacing = true;
            Env.IoC.resolve('ILogger')
                .warn('IList', 'Option "leftSpacing" is deprecated and will be removed in 19.200. Use option "itemPadding.left".');
        }
        if (cfg.leftPadding && !this.leftPadding) {
            this.leftPadding = true;
            Env.IoC.resolve('ILogger')
                .warn('IList', 'Option "leftPadding" is deprecated and will be removed in 19.200. Use option "itemPadding.left".');
        }
        if (cfg.rightSpacing && !this.rightSpacing) {
            this.rightSpacing = true;
            Env.IoC.resolve('ILogger')
                .warn('IList', 'Option "rightSpacing" is deprecated and will be removed in 19.200. Use option "itemPadding.right".');
        }
        if (cfg.rightPadding && !this.rightPadding) {
            this.rightPadding = true;
            Env.IoC.resolve('ILogger')
                .warn('IList', 'Option "rightPadding" is deprecated and will be removed in 19.200. Use option "itemPadding.right".');
        }
        if (cfg.groupMethod) {
            Env.IoC.resolve('ILogger').warn('IGrouped', 'Option "groupMethod" is deprecated and removed in 19.200. Use option "groupingKeyCallback".');
        }

    },

    // проверка на то, нужно ли создавать новый инстанс рекордсета или же можно положить данные в старый
    isEqualItems: function(oldList, newList) {
        return oldList && cInstance.instanceOfModule(oldList, 'Types/collection:RecordSet') &&
            (newList.getModel() === oldList.getModel()) &&
            (Object.getPrototypeOf(newList).constructor == Object.getPrototypeOf(newList).constructor) &&
            (Object.getPrototypeOf(newList.getAdapter()).constructor == Object.getPrototypeOf(oldList.getAdapter()).constructor);
    },
    displayFilterGroups: function(item, index, displayItem) {
        return item === ControlsConstants.view.hiddenGroup || !item.get || !this.collapsedGroups[displayItem.getOwner().getGroup()(item, index, displayItem)];
    },
    prepareCollapsedGroupsByArray: function(collapsedGroups) {
        var
            result = {};
        if (collapsedGroups) {
            collapsedGroups.forEach(function(group) {
                result[group] = true;
            });
        }
        return result;
    },
    prepareCollapsedGroupsByObject: function(collapsedGroups) {
        var
            result = [];
        if (collapsedGroups) {
            for (var group in collapsedGroups) {
                if (collapsedGroups.hasOwnProperty(group)) {
                    result.push(group);
                }
            }
        }
        return result;
    },
    getDisplayFilter: function(data, cfg) {
        var
            filter = [];
        if (cfg.groupingKeyCallback) {
            filter.push(_private.displayFilterGroups.bind({ collapsedGroups: data.collapsedGroups }));
        }
        if (cfg.itemsFilterMethod) {
            filter.push(cfg.itemsFilterMethod);
        }
        return filter;
    }
};
var ItemsViewModel = BaseViewModel.extend({
    _display: null,
    _items: null,
    _itemDataCache: null,
    _curIndex: 0,
    _onCollectionChangeFnc: null,
    _collapsedGroups: null,
    _prefixItemVersion: null,
    _updateIndexesCallback: null,

    constructor: function(cfg) {
        this._prefixItemVersion = 0;
        this._itemDataCache = {};
        ItemsViewModel.superclass.constructor.apply(this, arguments);
        this._onCollectionChangeFnc = this._onCollectionChange.bind(this);
        this._collapsedGroups = _private.prepareCollapsedGroupsByArray(cfg.collapsedGroups);
        this._options.groupingKeyCallback = cfg.groupingKeyCallback || cfg.groupMethod;
        if (cfg.items) {
            if (cfg.itemsReadyCallback) {
                cfg.itemsReadyCallback(cfg.items);
            }
            this._items = cfg.items;
            this._display = this._prepareDisplay(cfg.items, this._options);
            this._display.subscribe('onCollectionChange', this._onCollectionChangeFnc);
        }
    },

    _prepareDisplay: function(items, cfg) {
        var
            filter = this.getDisplayFilter(this.prepareDisplayFilterData(), cfg);
        return ItemsUtil.getDefaultDisplayFlat(items, cfg, filter);
    },

    reset: function() {
        this._startIndex = this._options.virtualScrolling && !!this._startIndex ? this._startIndex : 0;
        this._curIndex = this._startIndex;
    },

    isEnd: function() {
        var endIndex;
        if (this._options.virtualScrolling) {
            endIndex = !!this._stopIndex ? this._stopIndex : 0;
        } else {
            endIndex = (this._display ? this._display.getCount() : 0);
        }
        return this._curIndex < endIndex;
    },

    setUpdateIndexesCallback(updateIndexesCallback: Function): void {
        this._updateIndexesCallback = updateIndexesCallback;
    },

    setIndexes: function(newStartIndex: number, stopIndex: number): boolean {
        let
            newStopIndex = Math.min(stopIndex, this.getCount()),
            isUpdated = false;

        if (this._startIndex !== newStartIndex || this._stopIndex !== newStopIndex) {
            this._startIndex = newStartIndex;
            this._stopIndex = newStopIndex;
            isUpdated = true;
            this._nextModelVersion(true, 'indexesChanged');
            if (this._updateIndexesCallback) {
                this._updateIndexesCallback();
            }
        }

        return isUpdated;
    },

    isLast: function() {
        var lastIndex;
        if (this._options.virtualScrolling) {
            lastIndex = this._stopIndex - 1;
        } else {
            lastIndex = (this._display ? this._display.getCount() - 1 : 0);
        }
        return this._curIndex === lastIndex;
    },

    goToNext: function() {
        this._curIndex++;
    },

    getCurrent: function() {
        var dispItem = this._display.at(this._curIndex);
        return this.getItemDataByItem(dispItem);
    },

    setKeyProperty(keyProperty: string): void {
        this._options.keyProperty = keyProperty;
    },

    _nextModelVersion: function(notUpdatePrefixItemVersion, changesType, action, newItems, newItemsIndex, removedItems, removedItemsIndex) {
        let changedItems = [];

        if (!notUpdatePrefixItemVersion) {
            this._prefixItemVersion++;
        }
        this._nextVersion();

        if (notUpdatePrefixItemVersion) {
            if (Array.isArray(newItems) && newItems.length > 0) {
                changedItems = changedItems.concat(newItems);
            }
            if (Array.isArray(removedItems) && removedItems.length > 0) {
                changedItems = changedItems.concat(removedItems);
            }
        }
        this._resetCacheOnChange(changesType, changedItems);

        this._notify('onListChange', changesType, action, newItems, newItemsIndex, removedItems, removedItemsIndex);
    },

    nextModelVersion: function(notUpdatePrefixItemVersion, changesType) {
        this._nextModelVersion(notUpdatePrefixItemVersion, changesType);
    },

    _calcItemVersion: function(item) {
        var
            version = '' + this._prefixItemVersion;

        // records have defined method getVersion, groups haven't
        if (item.getVersion) {
            version += item.getVersion();
        } else {
            version += item;
        }
        return version;
    },

    getItemDataByItem: function(dispItem) {
        const cacheKey = this._getDisplayItemCacheKey(dispItem);

        if (this.isCachedItemData(cacheKey)) {
            return this.getCachedItemData(cacheKey);
        }

        var
            self = this,
            itemData = {
                getPropValue: ItemsUtil.getPropertyValue,
                style: this._options.style,
                keyProperty: this._options.keyProperty,
                displayProperty: this._options.displayProperty,
                index: this._display.getIndex(dispItem),
                item: dispItem.getContents(),
                dispItem: dispItem,

                //TODO: Выпилить в 19.200 или если закрыта -> https://online.sbis.ru/opendoc.html?guid=837b45bc-b1f0-4bd2-96de-faedf56bc2f6
                leftSpacing: this._options.leftSpacing || this._options.leftPadding,
                rightSpacing: this._options.rightSpacing || this._options.rightPadding,
                _preferVersionAPI: true,
                getVersion: function() {
                    return self._calcItemVersion(itemData.item, itemData.key);
                }
            };

        // The key of breadcrumbs row is the key of the last item in the crumbs.
        if (dispItem.getContents() instanceof Array) {
            let breadCrumbs = dispItem.getContents();
            itemData.key = ItemsUtil.getPropertyValue(breadCrumbs[breadCrumbs.length-1], this._options.keyProperty);
        } else {
            itemData.key = ItemsUtil.getPropertyValue(dispItem.getContents(), this._options.keyProperty);
        }

        if (this._options.groupingKeyCallback) {
            if (this._isGroup(itemData.item)) {
                itemData.isGroup = true;
                itemData.isHiddenGroup = itemData.item === ControlsConstants.view.hiddenGroup;
                itemData.isGroupExpanded = !this._collapsedGroups[itemData.item];
                itemData.metaData = this._items.getMetaData();
            }
        }

        this.setCachedItemData(cacheKey, itemData);

        return itemData;
    },

    setCollapsedGroups: function(collapsedGroups) {
        this._options.collapsedGroups = collapsedGroups;
        this._collapsedGroups = {};

        for (var i = 0; i < collapsedGroups.length; i++) {
            this._collapsedGroups[collapsedGroups[i]] = true;
        }
        this.setFilter(this.getDisplayFilter(this.prepareDisplayFilterData(), this._options));
        this._nextModelVersion();
    },

    toggleGroup: function(group, state) {
        if (typeof state === 'undefined') {
            state = typeof this._collapsedGroups[group] !== 'undefined';
        }
        if (state) {
            delete this._collapsedGroups[group];
        } else {
            this._collapsedGroups[group] = true;
        }
        this.setFilter(this.getDisplayFilter(this.prepareDisplayFilterData(), this._options));
        this._nextModelVersion();
        this._notify('onGroupsExpandChange', {
            group: group,
            changeType: state ? 'expand' : 'collapse',
            collapsedGroups: _private.prepareCollapsedGroupsByObject(this._collapsedGroups)
        });
    },

    setFilter: function(filter) {
        this._display.setFilter(filter);
        this.nextModelVersion();
    },

    prepareDisplayFilterData: function() {
        return {
            collapsedGroups: this._collapsedGroups
        };
    },

    getDisplayFilter: function(data, cfg) {
        return _private.getDisplayFilter(data, cfg);
    },

    setGroupMethod: function(groupMethod) {
        this._options.groupMethod = groupMethod;
        this._nextModelVersion();
    },

    setGroupingKeyCallback: function(groupingKeyCallback) {
        this._options.groupingKeyCallback = groupingKeyCallback;
        this._nextModelVersion();
    },

    getNext: function() {
        var
            itemIndex = this._curIndex + 1,
            dispItem = this._display.at(itemIndex);
        return {
            getPropValue: ItemsUtil.getPropertyValue,
            keyProperty: this._options.keyProperty,
            displayProperty: this._options.displayProperty,
            index: itemIndex,
            item: dispItem.getContents(),
            dispItem: dispItem
        };
    },

    getCurrentIndex: function() {
        return this._curIndex;
    },

    getItemById: function(id, keyProperty) {
        return this._display ? ItemsUtil.getDisplayItemById(this._display, id, keyProperty) : undefined;
    },

    getCount: function() {
        return this._display ? this._display.getCount() : 0;
    },

    _onCollectionChange: function(event, action, newItems, newItemsIndex, removedItems, removedItemsIndex) {
        this._onBeginCollectionChange(action, newItems, newItemsIndex, removedItems, removedItemsIndex);

        /**
         * Virtual scroll should update indexes before onListChange event fires, otherwise subscribers of the onListChange event are going to work with the stale indexes.
         * It can cause all kinds of troubles, e.g. out of bounds access.
         * https://online.sbis.ru/opendoc.html?guid=e7978ebd-881c-494b-8449-d04af83f3404
         */
        const collectionChangeResult =
           this._notify.apply(this, ['onCollectionChange'].concat(Array.prototype.slice.call(arguments, 1)));

        const shouldNotUpdatePrefix =
            collectionChangeResult === 'updatePrefix' ? false : action !== collection.IObservable.ACTION_RESET;

        this._nextModelVersion(shouldNotUpdatePrefix, 'collectionChanged', action, newItems, newItemsIndex, removedItems, removedItemsIndex);
        this._onEndCollectionChange(action, newItems, newItemsIndex, removedItems, removedItemsIndex);
    },
    _onBeginCollectionChange: function() {
        // method may be implemented
    },
    _onEndCollectionChange: function() {
        // method may be implemented
    },

    _convertItemKeyToCacheKey: function(itemKey) {
        // Model can have an item with the key 1 and a group with the key "1".
        // We need to differentiate between them in cache, so we add an _str postfix
        // to the string ids (for cache only)
        if (typeof itemKey === 'string') {
            return itemKey + '_str';
        }
        return itemKey;
    },
    _getDisplayItemCacheKey: function(dispItem) {
        const key = ItemsUtil.getDisplayItemKey(dispItem, this._options.keyProperty);
        return this._convertItemKeyToCacheKey(key);
    },
    isCachedItemData: function(itemKey) {
        return (
            typeof itemKey !== 'undefined' &&
            typeof this._itemDataCache[itemKey] !== 'undefined'
        );
    },
    getCachedItemData: function(itemKey) {
        return this._itemDataCache[itemKey];
    },
    setCachedItemData: function(itemKey, cache) {
        this._itemDataCache[itemKey] = cache;
    },
    resetCachedItemData: function(itemKey?) {
        if (typeof itemKey !== 'undefined') {
            delete this._itemDataCache[itemKey];
        } else {
            this._itemDataCache = {};
        }
    },
    _resetCacheOnChange: function(changesType, changedItems?) {
        if (
            changesType === 'indexesChanged' ||
            changesType === 'itemActionsUpdated'
        ) {
            return;
        } else if (Array.isArray(changedItems) && changedItems.length > 0) {
            changedItems.forEach((item) => {
                if (item) {
                    const key = this._getDisplayItemCacheKey(item);
                    this.resetCachedItemData(key);
                }
            });
        } else {
            // Full cache reset
            this.resetCachedItemData();
        }
    },

    _isGroup: function(item) {
        return item === ControlsConstants.view.hiddenGroup || !item.get
    },

    isAllGroupsCollapsed(): boolean {
        for (let i = 0; i < this._display.getItems().length; i++) {
            if (!this._collapsedGroups[this._display.getGroupByIndex(i)]) {
                return false;
            }
        }

        return true;
    },
    setItems: function(items) {
        if (_private.isEqualItems(this._items, items)) {
            this._items.setMetaData(items.getMetaData());
            this._items.assign(items);
        } else {
            if (this._options.itemsReadyCallback) {
                this._options.itemsReadyCallback(items);
            }
            this._items = items;
            if (this._display) {
                this._display.unsubscribe('onCollectionChange', this._onCollectionChangeFnc);
                this._display.destroy();
            }
            this._display = this._prepareDisplay(this._items, this._options);
            this._display.subscribe('onCollectionChange', this._onCollectionChangeFnc);
            this.setIndexes(0, this.getCount());
            this._nextModelVersion();
        }
        if (this._options.itemsSetCallback) {
            this._options.itemsSetCallback(this._items);
        }
    },

    getItems: function() {
        return this._items;
    },

    appendItems: function(items) {
        if (cInstance.instanceOfModule(items, 'Types/collection:RecordSet')) {
            this._items.setMetaData(items.getMetaData());
        }
        this._items.append(items);
    },

    mergeItems: function(items, options) {
        options = Object.assign({ remove: false }, options || {});
        this._items.merge(items, options);
    },

    prependItems: function(items) {
        this._items.prepend(items);
    },

    getIndexBySourceItem: function(item) {
        return this._display ? this._display.getIndexBySourceItem(item) : undefined;
    },

    at: function(index) {
        return this._display ? this._display.at(index) : undefined;
    },

    getDisplay: function() {
        return this._display;
    },

    destroy: function() {
        ItemsViewModel.superclass.destroy.apply(this, arguments);
        if (this._display) {
            this._display.destroy();
            this._display = null;
        }
        this._items = null;
        this._itemDataCache = null;
        this._curIndex = null;
        this._onCollectionChangeFnc = null;
    }
});

export = ItemsViewModel;
