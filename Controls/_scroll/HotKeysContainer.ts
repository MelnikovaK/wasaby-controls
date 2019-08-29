import {Control, IControlOptions} from 'UI/Base';
import template = require('wml!Controls/_scroll/HotKeysContainer');

/**
 * Control makes Controls.scroll:Container to handle up, down, page up, page down, home, end keys by default
 * @class Controls/_scroll/HotKeysContainer
 * @extends Core/Control
 * @author Шипин А.А.
 * @public
 */
class HotKeysContainer extends Control<IControlOptions> {
    protected _template: Function = template;
    protected _defaultActions = [{keyCode: 33}, {keyCode: 34}, {keyCode: 35}, {keyCode: 36}, {keyCode: 38}, {keyCode: 40}];
    // Этого кода не будет, когда добавится еще один хук жизненного цикла - "заморозка".
    private _afterMount(): void {
        this._notify('registerKeyHook', [this], { bubbling: true});
    }
    private _beforeUnmount(): void {
        this._notify('unregisterKeyHook', [this], { bubbling: true});
    }
    register(): void {
        this._children.KeyHook.register();
    }
    unregister(): void {
        this._children.KeyHook.unregister();
    }
}

export default HotKeysContainer;
