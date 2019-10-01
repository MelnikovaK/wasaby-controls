import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import template = require('wml!Controls/_popupTemplate/Notification/Base/Base');
import 'css!theme?Controls/popupTemplate';
import {default as INotification, INotificationOptions} from './interface/INotification';
import {INotificationSimpleOptions} from "./Simple";

export interface INotificationBaseOptions extends IControlOptions, INotificationOptions{
    bodyContentTemplate?: String | Function;

}

/**
* Базовый шаблон <a href='https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/openers/notification/#template'>окна уведомления</a>.
*
* @class Controls/_popupTemplate/Notification/Base
* @extends Core/Control
* @control
* @public
* @category popup
* @author Красильников А.С.
* @mixes Controls/_popupTemplate/Notification/NotificationStyles
* @demo Controls-demo/NotificationDemo/NotificationTemplate
*/

/**
 * @name Controls/_popupTemplate/Notification/Base#bodyContentTemplate
 * @cfg {function|String} Определяет основной контент окна уведомления.
 */



class Notification extends Control<INotificationBaseOptions> implements INotification{
    protected _template: TemplateFunction = template;
    private _borderStyle: String;
    private _prepareBorderStyle(popupOptions: INotificationBaseOptions): String {
        switch (popupOptions.style) {
        case 'warning':
            return 'warning';
        case 'success' :
            return 'success';
        case 'danger':
            return 'danger';
        default:
            return 'secondary';
        }
    }

    protected _beforeMount(options: INotificationSimpleOptions): void {
        this._borderStyle = this._prepareBorderStyle(options);
    }

    private _closeClick(): void {
        this._notify('close', []);
    }

    static getDefaultOptions(): INotificationOptions {
        return {
            style: 'secondary',
            autoClose: true,
            closeButtonVisibility: true
        };
    }
}

export default Notification;
