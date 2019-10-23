import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import { SwipeVerticalMeasurer, SwipeHorizontalMeasurer } from 'Controls/list';

import template = require('wml!Controls/_listRender/Managers/Swipe/Swipe');

import { SyntheticEvent } from 'Vdom/Vdom';
import { CollectionItem, Collection } from 'Controls/display';
import { Model } from 'Types/entity';

import * as itemActionsUtil from './ItemActions/processItemActions';

interface ISwipeEvent extends Event {
    direction: string;
}

interface ISwipeControlOptions extends IControlOptions {
    listModel: Collection<Model>;

    itemActionsPosition?: string;
    actionAlignment?: string;
    actionCaptionPosition?: string;
}

export default class SwipeControl extends Control<ISwipeControlOptions> {
    protected _template: TemplateFunction = template;

    // TODO React to collection change here or in the manager
    protected _animationState: string = 'close';
    protected _actionAlignment: string;
    protected _measurer: (typeof SwipeVerticalMeasurer.default | typeof SwipeHorizontalMeasurer.default);
    // TODO Import ISwipeConfig
    protected _swipeConfig: any;

    protected _needTitle: Function;
    protected _needIcon: Function;

    protected _beforeMount(): void {
        this._needTitle = (...args) => this._measurer.needTitle(...args);
        this._needIcon = (...args) => this._measurer.needIcon(...args);
    }

    protected _onItemSwipe(
        event: SyntheticEvent<null>,
        item: CollectionItem<Model>,
        swipeEvent: SyntheticEvent<ISwipeEvent>
    ): void {
        if (swipeEvent.nativeEvent.direction === 'left' && item.getActions()) {
            this._openSwipe(item, swipeEvent);
        } else {
            this._closeSwipe(true);
        }
    }

    protected _onAnimationEnd(): void {
        if (this._animationState === 'close') {
            this._resetSwipeState();
        }
    }

    protected _onItemActionsClick(event: SyntheticEvent<MouseEvent>, action: any, item: CollectionItem<Model>): void {
        event.stopPropagation();
        itemActionsUtil.processItemActionClick.call(
            this,
            event,
            action,
            item
        );
    }

    private _openSwipe(item: CollectionItem<Model>, swipeEvent: SyntheticEvent<ISwipeEvent>): void {
        // TODO Work with managers directly, create Swipe manager in this control
        this._options.listModel.setSwipeItem(item);
        this._options.listModel.setActiveItem(item);

        if (this._options.itemActionsPosition !== 'outside') {
            this._updateSwipeConfig(item, swipeEvent);
        }

        this._animationState = 'open';
    }

    private _closeSwipe(animated: boolean = false): void {
        if (this._animationState === 'open') {
            this._animationState = 'close';
            if (!animated) {
                this._resetSwipeState();
            }
        }
    }

    private _resetSwipeState(): void {
        this._swipeConfig = null;
        // TODO Do we need this here?
        // this._notify('closeSwipe', [this._options.listModel.getSwipeItem()]);
        this._options.listModel.setSwipeItem(null);
        this._options.listModel.setActiveItem(null);
    }

    private _updateSwipeConfig(item: CollectionItem<Model>, swipeEvent: SyntheticEvent<ISwipeEvent>): void {
        const actions = item.getActions().all;
        const actionsHeight = this._getActionsContainerHeight(swipeEvent.target as HTMLElement);

        this._measureSwipeConfig(actions, this._options.actionAlignment, actionsHeight);
        if (this._needsHorizontalMeasurement()) {
            this._measureSwipeConfig(actions, 'horizontal', actionsHeight);
        }

        // TODO Move this to manager
        this._options.listModel.setItemActions(item, this._swipeConfig.itemActions);

        if (this._swipeConfig.twoColumns) {
            const visibleActions = this._swipeConfig.itemActions.showed;
            this._swipeConfig.twoColumnsActions = [
                [ visibleActions[0], visibleActions[1] ],
                [ visibleActions[2], visibleActions[3] ]
            ];
        }
    }

    private _needsHorizontalMeasurement(): boolean {
        const actions = this._swipeConfig.itemActions;
        return (
            actions.showed &&
            actions.showed.length === 1 &&
            actions.all.length > 1
        );
    }

    private _measureSwipeConfig(actions: any[], actionAlignment: string, actionsHeight: number): void {
        this._setMeasurer(actionAlignment);
        this._swipeConfig = this._measurer.getSwipeConfig(
            actions,
            actionsHeight,
            this._options.actionCaptionPosition
        );
    }

    private _setMeasurer(actionAlignment: string): void {
        this._actionAlignment = actionAlignment;
        switch (actionAlignment) {
            case 'vertical':
                this._measurer = SwipeVerticalMeasurer.default;
                break;
            case 'horizontal':
                this._measurer = SwipeHorizontalMeasurer.default;
                break;
        }
    }

    private _getActionsContainerHeight(swipeEventTarget: HTMLElement): number {
        const itemContainer = swipeEventTarget.closest('.controls-ListView__itemV');
        if (itemContainer.className.includes('js-controls-SwipeControl__actionsContainer')) {
            return itemContainer.clientHeight;
        } else {
            return itemContainer.querySelector('.js-controls-SwipeControl__actionsContainer').clientHeight;
        }
    }

    static getDefaultOptions(): Partial<ISwipeControlOptions> {
        return {
            itemActionsPosition: 'inside',
            actionAlignment: 'horizontal',
            actionCaptionPosition: 'none'
        };
    }
}
