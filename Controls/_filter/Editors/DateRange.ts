import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import {Utils} from 'Controls/dateRange';
import {SyntheticEvent} from 'Vdom/Vdom';
import DateRangeTemplate = require('wml!Controls/_filter/Editors/DateRange');
import tmplNotify = require('Controls/Utils/tmplNotify');

/**
 * Контрол используют в качестве редактора для выбора периода дат на {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list-environment/filter-search/filter-view/base-settings/#step-3 панели фильтрации}.
 * @remark
 * Подробнее о настройке объединенного фильтра с выбором периода читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list-environment/filter-search/filter-view/period-selection/ здесь}.
 * @class Controls/_filter/Editors/DateRange
 * @extends Core/Control
 * @author Герасимов А.М.
 * @see Controls/filter:View
 */
class DateRangeEditor extends Control<IControlOptions> {
    protected _template: TemplateFunction = DateRangeTemplate;
    protected _tmplNotify: Function = tmplNotify;

    private _rangeChanged(event: SyntheticEvent<'rangeChanged'>, startValue: Date, endValue: Date): void {
        const caption = Utils.formatDateRangeCaption.call(null, startValue, endValue, this._options.emptyCaption);

        this._notify('rangeChanged', [startValue, endValue]);
        this._notify('textValueChanged', [caption]);
    }
}
/**
 * @event Происходит при изменении выбранного значения.
 * @name Controls/_filter/Editors/DateRange#textValueChanged
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {String} caption Строковое представление периода дат.
 */
export default DateRangeEditor;
