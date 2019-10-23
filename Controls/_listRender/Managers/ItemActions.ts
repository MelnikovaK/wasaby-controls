import { Control, TemplateFunction, IControlOptions } from 'UI/Base';

import template = require('wml!Controls/_listRender/Managers/ItemActions/ItemActions');

import { SyntheticEvent } from 'Vdom/Vdom';
import { CollectionItem, Collection } from 'Controls/display';
import { Model } from 'Types/entity';

import * as itemActionsUtil from './ItemActions/processItemActions';

export type TItemActionVisibilityCallback = (action, item: Model) => boolean;

export interface IItemActionsControlOptions extends IControlOptions {
    listModel: Collection<Model>;

    itemActions?: any[];
    itemActionsVisibilityCallback?: TItemActionVisibilityCallback;
    itemActionsPosition?: string;

    contextMenuConfig?: any;
}

export default class ItemActionsControl extends Control<IItemActionsControlOptions> {
    protected _template: TemplateFunction = template;

    // TODO React to collection change here or in the manager
    protected _initializedActions: boolean = false;

    protected _onContainerMouseEnter(): void {
        if (!this._initializedActions) {
            this._options.listModel.getItemActionsManager().assignItemActions(
                this._options.itemActions,
                this._options.itemActionsVisibilityCallback
            );
            this._initializedActions = true;
        }
    }

    protected _onItemActionsClick(event: SyntheticEvent<MouseEvent>, action: any, item: CollectionItem<Model>): void {
        itemActionsUtil.processItemActionClick.call(
            this,
            event,
            action,
            item
        );
    }

    protected _onItemContextMenu(
        event: SyntheticEvent<null>,
        item: CollectionItem<Model>,
        clickEvent: SyntheticEvent<MouseEvent>
    ): void {
        itemActionsUtil.openActionsMenu.call(
            this,
            item,
            clickEvent,
            true
        );
    }

    static getDefaultOptions(): Partial<IItemActionsControlOptions> {
        return {
            itemActionsPosition: 'inside'
        };
    }
}
