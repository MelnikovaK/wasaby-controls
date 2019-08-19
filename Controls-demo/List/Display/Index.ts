import { Control, TemplateFunction } from 'UI/Base';
import { SyntheticEvent } from 'Vdom/Vdom';
import * as template from 'wml!Controls-demo/List/Display/Display';

import { Memory as MemorySource } from 'Types/source';
import { Model } from 'Types/entity';
import { MaskResolver } from 'Router/router';

import { View as ListViewOld } from 'Controls/list';
import DisplayList from 'Controls-demo/List/Display/DisplayList';

interface IDemoChildren {
    listViewOld?: ListViewOld;
    listView?: DisplayList<unknown>;
}

let lastKey;
function generateListElement() {
    const key = ++lastKey;
    return {
        key,
        title: `${key} list element`
    };
}

function generateListElements(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(generateListElement());
    }
    return result;
}

const STARTING_LIST_SIZE = 1000;

export default class DisplayListDemo extends Control {
    protected _template: TemplateFunction = template;
    protected _children: IDemoChildren;

    private _viewSource: MemorySource;

    private _counterData: any[] = null;
    private _useNewList: boolean;
    private _addRowsCount: number = 1;

    protected _beforeMount(options): void {
        // for demo
        lastKey = 0;

        this._viewSource = new MemorySource({
            keyProperty: 'key',
            data: generateListElements(STARTING_LIST_SIZE)
        });

        this._counterData = [];

        // Если в url'e демки написано noDisplay=чтото, используем обычный Controls.list:View
        // вместо нового списка. Нужно для проведения сравнений
        const noDisplay = MaskResolver.calculateUrlParams('noDisplay=:noDisplay').noDisplay;
        this._useNewList = !noDisplay;
    }

    private _onItemClick(e: SyntheticEvent<MouseEvent>, item: Model): void {
        const title = item.get('title');
        item.set('title', `${title} clicked`);
        this._viewSource.update(item);
    }

    private _updateCounters(e: SyntheticEvent<null>, counters: any): void {
        this._counterData = counters;
    }

    private _addRows(): void {
        const newRows = generateListElements(this._addRowsCount);
        const createPromises = newRows.map(this._viewSource.create.bind(this._viewSource));

        Promise.all(createPromises).then((records) => {
            if (this._useNewList) {
                // Добавление строк в новый список
                this._children.listView.appendItems(records);
            } else {
                // Добавление строк в старый список (страшно, но для демки)
                this._children.listViewOld
                    ._children.listControl
                    ._children.baseControl
                    .getViewModel().appendItems(records);
            }
        });
    }
}
