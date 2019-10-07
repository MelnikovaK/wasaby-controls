import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!Controls/_list/Render/Render');

import defaultItemTemplate = require('wml!Controls/_list/Render/resources/ItemTemplateWrapper');

import { SyntheticEvent } from 'Vdom/Vdom';
import { CollectionItem, Collection } from 'Controls/display';

export interface IRenderOptions {
    listModel: Collection<unknown>;
    contextMenuEnabled?: boolean;
    contextMenuVisibility?: boolean;
}

export interface IRenderChildren {
    itemsContainer?: HTMLDivElement;
}

export default class Render extends Control<IRenderOptions> {
    protected _template: TemplateFunction = template;
    protected _children: IRenderChildren;

    protected _templateKeyPrefix: string;
    protected _itemTemplate: TemplateFunction;

    protected _beforeMount(options): void {
        this._templateKeyPrefix = `list-render-${this.getInstanceId()}`;
        this._itemTemplate = options.itemTemplate || defaultItemTemplate;
    }

    getItemsContainer(): HTMLDivElement {
        return this._children.itemsContainer;
    }

    protected _onItemClick(
        e: SyntheticEvent<MouseEvent> & { preventItemEvent?: boolean },
        item: CollectionItem<unknown>
    ): void {
        if (!e.preventItemEvent && !item.isEditing()) {
            this._notify('itemClick', [item.getContents(), e], { bubbling: true });
        }
    }

    protected _onItemContextMenu(e: SyntheticEvent<MouseEvent>, item: CollectionItem<unknown>) {
        if (
            this._options.contextMenuEnabled !== false &&
            this._options.contextMenuVisibility !== false &&
            !this._options.listModel.isEditing()
        ) {
            this._notify('itemContextMenu', [item, e, false]);
        }
    }

    protected _onItemSwipe(e: SyntheticEvent<null>, item: CollectionItem<unknown>) {
        this._notify('itemSwipe', [item, e]);
        e.stopPropagation();
    }

    protected _canHaveMultiselect(options): boolean {
        const visibility = options.multiselectVisibility;
        return visibility === 'onhover' || visibility === 'visible';
    }
}
