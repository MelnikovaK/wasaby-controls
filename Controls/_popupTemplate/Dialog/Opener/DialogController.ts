import {default as BaseController, IPopupItem, IPopupOptions,
    IPopupSizes, IPopupPosition, IDragOffset} from 'Controls/_popupTemplate/BaseController';
import {detection} from 'Env/Env';
import DialogStrategy = require('Controls/_popupTemplate/Dialog/Opener/DialogStrategy');

interface IDialogItem extends IPopupItem {
    popupOptions: IDialogOptions;
    startPosition: IPopupPosition;
    dragged: boolean;
}

interface IDialogOptions extends IPopupOptions {
    maximize: boolean;
    top: number;
    left: number;
}

interface IWindow {
    width?: number;
    height?: number;
    scrollTop?: number;
    scrollLeft?: number;
}

/**
 * Dialog Popup Controller
 * @class Controls/_popupTemplate/Dialog/Opener/DialogController
 * @control
 * @private
 * @category Popup
 * @extends Controls/_popupTemplate/BaseController
 */
class DialogController extends BaseController {
    TYPE: string = 'Dialog';

    elementCreated(item: IDialogItem, container: HTMLDivElement): boolean {
        this._prepareConfigWithSizes(item, container);
        return true;
    }

    elementUpdated(item: IDialogItem, container: HTMLDivElement): boolean {
        /* start: We remove the set values that affect the size and positioning to get the real size of the content */
        const width: string = container.style.width;
        const height: string = container.style.height;
        // We won't remove width and height, if they are set explicitly or popup is maximize.

        if (!item.popupOptions.maximize) {
            if (!item.popupOptions.width) {
                container.style.width = 'auto';
            }
            if (!item.popupOptions.height) {
                container.style.height = 'auto';
            }
            if (item.popupOptions.maxWidth) {
                container.style.maxWidth = item.popupOptions.maxWidth + 'px';
            } else {
                container.style.maxWidth = '';
            }
            if (item.popupOptions.maxHeight) {
                container.style.maxHeight = item.popupOptions.maxHeight + 'px';
            } else {
                container.style.maxHeight = '';
            }
        }

        /* end: We remove the set values that affect the size and positioning to get the real size of the content */
        this._prepareConfigWithSizes(item, container);

        /* start: Return all values to the node. Need for vdom synchronizer */
        container.style.width = width;
        container.style.height = height;
        container.style.maxWidth = '';
        container.style.maxHeight = '';

        /* end: Return all values to the node. Need for vdom synchronizer */

        return true;
    }

    getDefaultConfig(item: IDialogItem): void {
        // set sizes before positioning. Need for templates who calculate sizes relatively popup sizes
        const sizes: IPopupSizes = {
            width: 0,
            height: 0
        };
        const defaultCoordinate: number = -10000;
        this._prepareConfig(item, sizes);
        item.position.top = defaultCoordinate;
        item.position.left = defaultCoordinate;
    }

    popupDragStart(item: IDialogItem, container: HTMLDivElement, offset: IDragOffset): void {
        if (!item.startPosition) {
            item.startPosition = {
                left: item.position.left,
                top: item.position.top
            };
        }
        item.dragged = true;
        item.position.left = item.startPosition.left + offset.x;
        item.position.top = item.startPosition.top + offset.y;

        // Take the size from cache, because they don't change when you move
        this._prepareConfig(item, item.sizes);
    }

    popupDragEnd(item: IDialogItem): void {
        delete item.startPosition;
    }

    resizeOuter(item: IPopupItem, container: HTMLDivElement): boolean {
        // На ios ресайз страницы - это зум. Не реагируем на него.
        if (!detection.isMobileIOS) {
            return this._elementUpdated(item, container);
        }
        return false;
    }

    pageScrolled(): boolean {
        // Don't respond to page scrolling. The popup should remain where it originally positioned.
        return false;
    }

    needRecalcOnKeyboardShow(): boolean {
        return true;
    }

    _prepareConfigWithSizes(item: IDialogItem, container: HTMLDivElement): void {
        const sizes: IPopupSizes = this._getPopupSizes(item, container);
        item.sizes = sizes;
        this._prepareConfig(item, sizes);
    }

    _prepareConfig(item: IDialogItem, sizes: IPopupSizes): void {
        // After popup will be transferred to the synchronous change of coordinates,
        // we need to return the calculation of the position with the keyboard.
        // Positioning relative to body
        item.position = DialogStrategy.getPosition(this._getWindowSize(), sizes, item);
        this._fixCompatiblePosition(item);
    }

    _fixCompatiblePosition(item: IDialogItem): void {
        // COMPATIBLE: for old windows user can set the coordinates relative to the body
        if (!item.dragged) {
            if (item.popupOptions.top) {
                item.position.top = item.popupOptions.top;
            }
            if (item.popupOptions.left) {
                // Calculating the left position when reducing the size of the browser window
                const differenceWindowWidth: number =
                    (item.popupOptions.left + item.popupOptions.width) - this._getWindowSize().width;
                if (differenceWindowWidth > 0) {
                    item.position.left = item.popupOptions.left - differenceWindowWidth;
                } else {
                    item.position.left = item.popupOptions.left;
                }
            }
        }
    }

    private _getWindowSize(): IWindow {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollTop: window.scrollY,
            scrollLeft: window.scrollX
        };
    }
}

export = new DialogController();
