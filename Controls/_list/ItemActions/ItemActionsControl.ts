import Control = require('Core/Control');
import template = require('wml!Controls/_list/ItemActions/ItemActionsControl');
import {showType} from 'Controls/Utils/Toolbar';
import aUtil = require('Controls/_list/ItemActions/Utils/Actions');
import ControlsConstants = require('Controls/Constants');
import getStyle = require('Controls/_list/ItemActions/Utils/getStyle');
import ArraySimpleValuesUtil = require('Controls/Utils/ArraySimpleValuesUtil');
import { relation } from 'Types/entity';
import { RecordSet, IObservable } from 'Types/collection';
import { Object as EventObject } from 'Env/Event';
import 'css!theme?Controls/list';
import { CollectionItem } from 'Types/display';

var
    ACTION_ICON_CLASS = 'controls-itemActionsV__action_icon  icon-size';

const ACTION_TYPE = 'itemActionsUpdated';

var _private = {
    fillItemAllActions: function(item, options) {
        var actions = [];
        if (options.itemActionsProperty) {
            actions = item.get(options.itemActionsProperty);
        } else {
            options.itemActions.forEach(function(action) {
                if (!options.itemActionVisibilityCallback || options.itemActionVisibilityCallback(action, item)) {
                    if (action.icon && !~action.icon.indexOf(ACTION_ICON_CLASS)) {
                        action.icon += ' ' + ACTION_ICON_CLASS;
                    }
                    action.style = getStyle(action.style, 'ItemActions');
                    action.iconStyle = getStyle(action.iconStyle, 'ItemActions');
                    actions.push(action);
                }
            });
        }
        return actions;
    },

    updateItemActions: function(self, item, options) {
        var
            all = _private.fillItemAllActions(item, options),

            showed = options.itemActionsPosition === 'outside' || all.length <= 1
                ? all
                : all.filter(function(action) {
                    return action.showType === showType.TOOLBAR || action.showType === showType.MENU_TOOLBAR;
                });

        if (_private.needActionsMenu(all, options.itemActionsPosition)) {
            showed.push({
                icon: 'icon-ExpandDown ' + ACTION_ICON_CLASS,
                style: 'secondary',
                iconStyle: 'secondary',
                _isMenu: true
            });
        }

        options.listModel.setItemActions(item, {
            all: all,
            showed: showed
        });
    },

    updateActions: function(self, options, collectionChanged: boolean = false): void {
        if (options.itemActionsProperty || options.itemActions && options.itemActions.length) {
            for (options.listModel.reset(); options.listModel.isEnd(); options.listModel.goToNext()) {
                var
                    itemData = options.listModel.getCurrent(),
                    item = itemData.actionsItem;
                if (item !== ControlsConstants.view.hiddenGroup && item.get) {
                    _private.updateItemActions(self, item, options);
                }
            }
            self._isActual = true;
            options.listModel.nextModelVersion(collectionChanged, ACTION_TYPE);
        }
    },

    updateModel: function(self, newOptions) {
        _private.updateActions(self, newOptions);
        newOptions.listModel.subscribe('onListChange', self._onCollectionChangeFn);
    },

    needActionsMenu: function(actions, itemActionsPosition) {
        var
            hasActionInMenu = false;

        actions && actions.length > 1 && actions.forEach(function(action) {
            if ((!action.showType || action.showType === showType.MENU_TOOLBAR || action.showType === showType.MENU)
                && !action.parent) {
                hasActionInMenu = true;
            }
        });

        return hasActionInMenu && itemActionsPosition !== 'outside';
    },

    getAllChildren(
       hierarchyRelation: relation.Hierarchy,
       rootId: unknown,
       items: RecordSet
    ): object[] {
       const children = [];

       hierarchyRelation.getChildren(rootId, items).forEach((child) => {
          if (hierarchyRelation.isNode(child) !== null) {
             ArraySimpleValuesUtil.addSubArray(
                children,
                _private.getAllChildren(hierarchyRelation, child.getId(), items)
             );
          }
          ArraySimpleValuesUtil.addSubArray(children, [child]);
       });

       return children;
   }
};

var ItemActionsControl = Control.extend({

    _template: template,
    _isActual: false,

    constructor: function() {
        ItemActionsControl.superclass.constructor.apply(this, arguments);
        this._onCollectionChangeFn = this._onCollectionChange.bind(this);
        this._hierarchyRelation = new relation.Hierarchy({
           idProperty: 'id',
           parentProperty: 'parent',
           nodeProperty: 'parent@'
        });
    },

    _beforeMount: function(newOptions) {
        if (typeof window === 'undefined') {
            this.serverSide = true;
            return;
        }
    },

    _beforeUpdate: function(newOptions) {
        var args = [this, newOptions];

        if (
            this._options.listModel !== newOptions.listModel ||
            this._options.itemActions !== newOptions.itemActions ||
            this._options.itemActionVisibilityCallback !== newOptions.itemActionVisibilityCallback ||
            this._options.toolbarVisibility !== newOptions.toolbarVisibility ||
            this._options.itemActionsPosition !== newOptions.itemActionsPosition ||
            !this._isActual && newOptions.canUpdateItemsActions
        ) {
            this._options.listModel.unsubscribe('onListChange', this._onCollectionChangeFn);
            _private.updateModel.apply(null, args);
        }
    },

    _onItemActionsClick: function(event, action, itemData) {
        aUtil.itemActionsClick(this, event, action, itemData, this._options.listModel);
        this.updateItemActions(itemData.actionsItem);
        this._options.listModel.setMarkedKey(itemData.key);
    },

    _applyEdit: function(item) {
        this._notify('commitActionClick', [item]);
    },

    _cancelEdit: function(item) {
        this._notify('cancelActionClick', [item]);
    },

    updateItemActions: function(item) {
        _private.updateItemActions(this, item, this._options);
        this._options.listModel.nextModelVersion(false, ACTION_TYPE);
    },

    _beforeUnmount: function() {
        this._options.listModel.unsubscribe('onListChange', this._onCollectionChangeFn);
    },

    _onCollectionChange(
       e: EventObject,
       type: string
    ): void {
        if (type === 'collectionChanged' || type === 'indexesChanged') {
           this._isActual = false;
           /**
            * In general, we don't know what we should update.
            * For example, if a user adds an item we can't just calculate actions for the newest item, we should also calculate
            * actions for it's neighbours. They may have arrows for moving, so they should also get updated.
            *
            * It's logical to think that we should update the item and it's neighbours if items get added\removed.
            * This wouldn't work because sometimes items can be far away from each other.
            * For example:
            * folder
            * -child
            * -child
            * -child
            * new folder
            *
            * In this example we should update actions of both folders, but they're not neighbours.
            * And sometimes people can add\remove actions based on number of items in the list, so it becomes even harder to know what we should update.
            *
            * So, we should calculate actions for every item everytime.
            */
            if(this._options.canUpdateItemsActions) {
               _private.updateActions(this, this._options, type === 'collectionChanged');
           }
        }
    },

   getChildren(
      action: object,
      actions: object[]
   ): object[] {
      return _private
         .getAllChildren(
            this._hierarchyRelation,
            action.id,
            new RecordSet({
               idProperty: 'id',
               rawData: actions
            })
         )
         .map((item) => item.getRawData());
   }
});

ItemActionsControl.getDefaultOptions = function() {
    return {
        itemActionsPosition: 'inside',
        itemActions: []
    };
};
ItemActionsControl._private = _private;

export = ItemActionsControl;
