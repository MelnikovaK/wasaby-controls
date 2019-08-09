import * as Env from 'Env/Env';
import {debounce} from 'Types/function';
import {SyntheticEvent} from 'Vdom/Vdom';
import {delay as runDelayed} from 'Types/function';
import {Control, IControlOptions, TemplateFunction} from 'UI/Base';

import * as template from 'wml!Controls/_popup/Manager/Popup';
import * as PopupContent from 'wml!Controls/_popup/Manager/PopupContent';

const RESIZE_DELAY = 10;
// on ios increase delay for scroll handler, because popup on frequent repositioning loop the scroll.
const SCROLL_DELAY = Env.detection.isMobileIOS ? 100 : 10;

interface IPosition {
    position: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
    maxWidth: number;
    minWidth: number;
    maxHeight: number;
    minHeight: number;
    hidden: boolean;
}

interface ISelfOptions {
    hidden: boolean;
    position: IPosition;
}

type UpdateCallback = () => void;
type IPopupOptions = IControlOptions & ISelfOptions;

class Popup extends Control<IPopupOptions> {

    /**
     * Control Popup
     * @class Controls/_popup/Manager/Popup
     * @mixes Controls/interface/IOpenerOwner
     * @mixes Controls/interface/ICanBeDefaultOpener
     * @extends Core/Control
     * @control
     * @private
     * @category Popup
     * @author Красильников А.С.
     */

    /**
     * @name Controls/_popup/Manager/Popup#template
     * @cfg {Content} Template
     */

    /**
     * @name Controls/_popup/Manager/Popup#templateOptions
     * @cfg {Object} Template options
     */

    protected _template: TemplateFunction = template;

    // Register the openers that initializing inside current popup
    // After updating the position of the current popup, calls the repositioning of popup from child openers
    protected _openersUpdateCallback: UpdateCallback[] = [];

    protected _isEscDown: boolean = false;

    private _closeByESC(event: SyntheticEvent<KeyboardEvent>): void {
        if (event.nativeEvent.keyCode === Env.constants.key.esc) {
            this._close();
        }
    }

    protected _afterMount(): void {
        /* TODO: COMPATIBLE. You can't just count on afterMount position and zooming on creation
         * inside can be compoundArea and we have to wait for it, and there is an asynchronous phase. Look at the flag waitForPopupCreated */
        this._controlResize = debounce(this._controlResize.bind(this), RESIZE_DELAY);
        this._scrollHandler = debounce(this._scrollHandler.bind(this), SCROLL_DELAY);

        if (this.waitForPopupCreated) {
            this.callbackCreated = (function () {
                this.callbackCreated = null;
                this._notify('popupCreated', [this._options.id], {bubbling: true});
                this._options.creatingDef && this._options.creatingDef.callback(this._options.id);
            }).bind(this);
        } else {
            this._notify('popupCreated', [this._options.id], {bubbling: true});
            this._options.creatingDef && this._options.creatingDef.callback(this._options.id);
            this.activatePopup();
        }
    }

    protected _afterUpdate(oldOptions: IPopupOptions): void {
        this._notify('popupAfterUpdated', [this._options.id], {bubbling: true});

        if (Popup._isResized(oldOptions, this._options)) {
            const eventCfg = {
                type: 'controlResize',
                target: this,
                _bubbling: false
            };
            this._children.resizeDetect.start(new SyntheticEvent(null, eventCfg));
        }
    }

    protected _beforeUnmount(): void {
        this._notify('popupDestroyed', [this._options.id], {bubbling: true});
    }

    /**
     * Close popup
     * @function Controls/_popup/Manager/Popup#_close
     */
    protected _close(): void {
        this._notify('popupClose', [this._options.id], {bubbling: true});
    }

    protected _maximized(event: SyntheticEvent<Event>, state: boolean): void {
        this._notify('popupMaximized', [this._options.id, state], {bubbling: true});
    }

    protected _popupDragStart(event: SyntheticEvent<Event>, offset: number): void {
        this._notify('popupDragStart', [this._options.id, offset], {bubbling: true});
    }

    protected _popupDragEnd(): void {
        this._notify('popupDragEnd', [this._options.id], {bubbling: true});
    }

    protected _popupMouseEnter(event: SyntheticEvent<MouseEvent>, popupEvent: SyntheticEvent<MouseEvent>): void {
        this._notify('popupMouseEnter', [this._options.id, popupEvent], {bubbling: true});
    }

    protected _popupMouseLeave(event: SyntheticEvent<MouseEvent>, popupEvent: SyntheticEvent<MouseEvent>): void {
        this._notify('popupMouseLeave', [this._options.id, popupEvent], {bubbling: true});
    }

    protected _animated(event: SyntheticEvent<AnimationEvent>): void {
        this._children.resizeDetect.start(ev);
        this._notify('popupAnimated', [this._options.id], {bubbling: true});
    }

    protected _registerOpenerUpdateCallback(event: SyntheticEvent<Event>, callback: UpdateCallback): void {
        this._openersUpdateCallback.push(callback);
    }

    protected _unregisterOpenerUpdateCallback(event: SyntheticEvent<Event>, callback: UpdateCallback): void {
        const index = this._openersUpdateCallback.indexOf(callback);
        if (index > -1) {
            this._openersUpdateCallback.splice(index, 1);
        }
    }

    protected _callOpenersUpdate(): void {
        for (let i = 0; i < this._openersUpdateCallback.length; i++) {
            this._openersUpdateCallback[i]();
        }
    }

    protected _scrollHandler(): void {
        this._notify('pageScrolled', [this._options.id], {bubbling: true});
    }

    /**
     * Update popup
     * @function Controls/_popup/Manager/Popup#_close
     */
    protected _update(): void {
        this._notify('popupUpdated', [this._options.id], {bubbling: true});

        // After updating popup position we will updating the position of the popups open with it.
        runDelayed(this._callOpenersUpdate.bind(this));
    }

    protected _controlResize(): void {
        this._notify('popupControlResize', [this._options.id], {bubbling: true});
    }

    /**
     * Proxy popup result
     * @function Controls/_popup/Manager/Popup#_sendResult
     */
    protected _sendResult(event: SyntheticEvent<Event>, ...args: any[]): void {
        const popupResultArgs = [this._options.id].concat(args);
        this._notify('popupResult', popupResultArgs, {bubbling: true});
    }

    protected _swipeHandler(event: SyntheticEvent<TouchEvent>): void {
        // close popup by swipe only for vdom, cause ws3 controls use differ system of swipe,
        // we can't stop it on vdom controls.
        if (event.nativeEvent.direction === 'right' && !this._options.isCompoundTemplate) {
            this._close();
        }
    }

    /**
     * key up handler
     * @function Controls/_popup/Manager/Popup#_keyUp
     * @param event
     */
    protected _keyUp(event: SyntheticEvent<KeyboardEvent>): void {
        /**
         * Старая панель по событию keydown закрывается и блокирует всплытие события. Новая панель делает
         * тоже самое, но по событию keyup. Из-за этого возникает следующая ошибка.
         * https://online.sbis.ru/opendoc.html?guid=0e4a5c02-f64c-4c7d-88b8-3ab200655c27
         *
         * Что бы не трогать старые окна, мы добавляем поведение на закрытие по esc. Закрываем только в том случае,
         * если новая панель поймала событие keydown клавиши esc.
         */
        if (this._isEscDown) {
            this._isEscDown = false;
            this._closeByESC(event);
        }
    }

    protected _keyDown(event: SyntheticEvent<KeyboardEvent>): void {
        if (event.nativeEvent.keyCode === Env.constants.key.esc) {
            this._isEscDown = true;
        }
    }

    activatePopup(): void {
        // TODO Compatible
        if (this._options.autofocus && !this._options.isCompoundTemplate) {
            this.activate();
        }
    }

    private static _isResized(oldOptions: IPopupOptions, newOptions: IPopupOptions): boolean {
        const {position: oldPosition, hidden: oldHidden}: IPopupOptions = oldOptions;
        const {position: newPosition, hidden: newHidden}: IPopupOptions = newOptions;
        const hasWidthChanged: boolean = oldPosition.width && oldPosition.width !== newPosition.width;
        const hasHeightChanged: boolean = oldPosition.height && oldPosition.height !== newPosition.height;
        const hasHiddenChanged: boolean = oldHidden !== newHidden;

        return hasWidthChanged || hasHeightChanged || (hasHiddenChanged && newHidden === false);
    }
}

Popup.getDefaultOptions = function () {
    return {
        content: PopupContent,
        autofocus: true
    };
};

export = Popup;

