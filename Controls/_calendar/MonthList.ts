import {date as formatDate} from 'Types/formatter';
import {debounce} from 'Types/function';
import {Base as BaseSource} from 'Types/source';
import {IoC} from 'Env/Env';
import {SyntheticEvent} from 'Vdom/Vdom';
import {Control, TemplateFunction, IControlOptions} from 'UI/Base';
import {IMonthListSource, IMonthListSourceOptions} from './interfaces/IMonthListSource';
import {IMonthList, IMonthListOptions} from './interfaces/IMonthList';
import {IMonthListVirtualPageSize, IMonthListVirtualPageSizeOptions} from './interfaces/IMonthListVirtualPageSize';
import ExtDataModel from './MonthList/ExtDataModel';
import YearsSource from './MonthList/YearsSource';
import MonthsSource from './MonthList/MonthsSource';
import monthListUtils from './MonthList/Utils';
import ITEM_TYPES from './MonthList/ItemTypes';
import {IntersectionObserverSyntheticEntry} from 'Controls/scroll';
import dateUtils = require('Controls/Utils/Date');
import getDimensions = require("Controls/Utils/getDimensions");
import scrollToElement = require('Controls/Utils/scrollToElement');
import template = require('wml!Controls/_calendar/MonthList/MonthList');
import monthTemplate = require('wml!Controls/_calendar/MonthList/MonthTemplate');
import yearTemplate = require('wml!Controls/_calendar/MonthList/YearTemplate');

/**
 * Прокручивающийся список с месяцами. Позволяет выбирать период.
 *
 * @class Controls/_calendar/MonthList
 * @extends Core/Control
 * @mixes Controls/_calendar/interface/IMonthListSource
 * @control
 * @public
 * @author Красильников А.С.
 * @demo Controls-demo/Date/MonthList
 */

/**
 * @event Controls/_calendar/MonthList#positionChanged Происходит когда меняется год или месяц. Т.е. когда
 * год или месяц пересекают верхнюю границу.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {date} Date отображаемый в самом верху год или месяц.
 * @example
 * Обновляем заголовок в зависимости от отображаемого года.
 * <pre>
 *    <Controls.calendar:MonthList startPosition="_date" on:positionChanged="_positionChangedHandler()"/>
 * </pre>
 * <pre>
 *    class  ModuleComponent extends Control {
 *       ...
 *       _positionChangedHandler(e, date) {
 *          this.setTitle(date);
 *       }
 *       ...
 *    }
 * </pre>
 */

interface IModuleComponentOptions extends
    IControlOptions,
    IMonthListSourceOptions,
    IMonthListOptions,
    IMonthListVirtualPageSizeOptions {
}

const
    sourceMap: object = {
        year: YearsSource,
        month: MonthsSource
    },
    ITEM_BODY_SELECTOR = {
        year: '.controls-MonthList__year-months',
        month: '.controls-MonthList__month-body'
    };

class  ModuleComponent extends Control<IModuleComponentOptions> implements
        IMonthListSource, IMonthList, IMonthListVirtualPageSize {
    readonly '[Controls/_calendar/interface/IMonthListSource]': true;
    readonly '[Controls/_calendar/interface/IMonthList]': true;
    readonly '[Controls/_calendar/interface/IMonthListVirtualPageSize]': true;

    protected _template: TemplateFunction = template;

    private _viewSource: BaseSource;
    private _startPositionId: string;
    private _positionToScroll: Date;
    private _displayedPosition: Date;

    private _itemTemplate: TemplateFunction;
    private _itemHeaderTemplate: TemplateFunction;

    private _lastNotifiedPositionChangedDate: Date;

    private _displayedDates: number[] = [];
    private _extData: ExtDataModel;

    private _scrollTop: number = 0;

    private _enrichItemsDebounced: Function;

    private _virtualPageSize: number;

    protected _beforeMount(options: IModuleComponentOptions): void {
        const position = options.startPosition || options.position || new Date();
        if (options.startPosition) {
            IoC.resolve('ILogger').warn('MonthList', 'Используется устаревшая опция startPosition, используйте опцию position');
        }

        this._enrichItemsDebounced = debounce(this._enrichItems, 300);

        this._updateItemTemplate(options);
        this._updateSource(options);
        this._updateVirtualPageSize(options);
        this._startPositionId = monthListUtils.dateToId(this._normalizeStartPosition(position));
        this._positionToScroll = position;
        this._displayedPosition = position;
    }

    protected _afterMount(): void {
        // TODO: We need another api to control the shadow visibility
        // https://online.sbis.ru/opendoc.html?guid=1737a12a-9dd1-45fa-a70c-bc0c9aa40a3d
        this._children.scroll.setShadowMode({ top: 'visible', bottom: 'visible' });
        this._updateScrollAfterViewModification();
    }

    protected _beforeUpdate(options: IModuleComponentOptions): void {
        this._updateItemTemplate(options);
        this._updateSource(options);
        this._updateVirtualPageSize(options, this._options);
        if (options.position !== this._displayedPosition) {
            this._displayedPosition = options.position;
            this._scrollToPosition(options.position);
        }
    }

    protected _afterRender(): void {
        this._updateScrollAfterViewModification();
    }

    protected _getMonth(year: number, month: number): Date {
        return new Date(year, month, 1);
    }

    protected _drawItemsHandler(): void {
        this._updateScrollAfterViewModification();
    }

    private _updateItemTemplate(options: IModuleComponentOptions): void {
        this._itemHeaderTemplate = options.viewMode === 'year' ?
            options.yearHeaderTemplate : options.monthHeaderTemplate;

        this._itemTemplate = options.viewMode === 'year' ?
            options.yearTemplate : options.monthTemplate;
    }
    private _getTemplate(data): TemplateFunction {
        if (data.get('type') === ITEM_TYPES.header) {
            return this._itemHeaderTemplate;
        } else {
            return this._itemTemplate;
        }
    }

    private _updateSource(options: IModuleComponentOptions): void {
        if (options.viewMode !== this._options.viewMode) {
            this._viewSource = new sourceMap[options.viewMode]({ header: Boolean(this._itemHeaderTemplate) });
        }
        if (options.viewMode !== this._options.viewMode || options.source !== this._options.source) {
            this._extData = new ExtDataModel({
                viewMode: options.viewMode,
                source: options.source
            });
        }
    }
    private _updateVirtualPageSize(options: IModuleComponentOptions, oldOptions?: IModuleComponentOptions): void {
        if (!oldOptions || options.virtualPageSize !== oldOptions.virtualPageSize) {
            // If we draw the headers as a separate element, then the virtual page should be 2 times larger,
            // because instead of one element, we draw two. Header and body.
            this._virtualPageSize = this._itemHeaderTemplate ? options.virtualPageSize * 2 : options.virtualPageSize;
        }
    }

    private _scrollToPosition(position: Date): void {
        if (!position) {
            return;
        }

        const newPosition = dateUtils.getStartOfMonth(position);

        this._positionToScroll = newPosition;

        if (this._container && this._canScroll(newPosition)) {
            // Update scroll position without waiting view modification
            this._updateScrollAfterViewModification();
        } else {
            this._startPositionId = monthListUtils.dateToId(this._normalizeStartPosition(position));
            // After changing the navigation options, we must call the "reload" to redraw the control.
            // Position option is the initial position from which control is initially drawn.
            this._children.months.reload();
        }
    }

    private _normalizeStartPosition(date: Date): Date {
        return this._options.viewMode === 'year' ?
            dateUtils.getStartOfYear(date) : dateUtils.getStartOfMonth(date);
    }

    private _intersectHandler(event: SyntheticEvent, entries: IntersectionObserverSyntheticEntry[]): void {
        for (const entry of entries) {
            this._updateDisplayedPosition(entry);
            this._updateDisplayedItems(entry);
        }
    }

    private _updateDisplayedPosition(entry: IntersectionObserverSyntheticEntry): void {
        if (entry.data.type !== ITEM_TYPES.body) {
            return;
        }
        const entryDate = entry.data.date;
        let date;
        if (entry.nativeEntry.boundingClientRect.top - entry.nativeEntry.rootBounds.top <= 0) {
            if (entry.nativeEntry.boundingClientRect.bottom - entry.nativeEntry.rootBounds.top >= 0) {
                date = entryDate;
            } else if (entry.nativeEntry.rootBounds.top - entry.nativeEntry.boundingClientRect.bottom < entry.nativeEntry.target.offsetHeight) {
                if (this._options.viewMode === 'year') {
                    date = new Date(entryDate.getFullYear() + 1, entryDate.getMonth());
                } else {
                    date = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1);
                }
            }
        }
        if (date && !dateUtils.isMonthsEqual(date, this._lastNotifiedPositionChangedDate)) {
            this._lastNotifiedPositionChangedDate = date;
            this._displayedPosition = date;
            this._notify('positionChanged', [date]);
        }
    }

    private _updateDisplayedItems(entry: IntersectionObserverSyntheticEntry): void {
        if (!this._options.source) {
            return;
        }

        const
            time = entry.data.date.getTime(),
            index = this._displayedDates.indexOf(time),
            isDisplayed = index !== -1;

        if (entry.nativeEntry.isIntersecting && !isDisplayed) {
            this._displayedDates.push(time);
        } else if (!entry.nativeEntry.isIntersecting && isDisplayed) {
            this._displayedDates.splice(index, 1);
        }
    }

    /**
     * Перезагружает данные для периода. Если переданный период не пересекается с отбражаемым периодом,
     * то данные не будут обновляться сразу же, а обновятся при подскроле к ним.
     * @function Controls/_calendar/MonthList#invalidatePeriod
     * @param {Date} start Начало периода
     * @param {Date} end Конец периода
     * @see Controls/_calendar/interface/IMonthListSource#source
     */
    private invalidatePeriod(start: Date, end: Date): void {
        if (this._extData) {
            this._extData.invalidatePeriod(start, end);
            this._extData.enrichItems(this._displayedDates);
        }
    }

    private _enrichItems(): void {
        if (this._extData) {
            this._extData.enrichItems(this._displayedDates);
        }
    }

    protected  _formatMonth(date: Date): string {
        return date ? formatDate(date, formatDate.FULL_MONTH) : '';
    }

    private _updateScrollAfterViewModification(): void {
        if (this._positionToScroll && this._canScroll(this._positionToScroll)) {
            if (this._scrollToDate(this._positionToScroll)) {
                this._positionToScroll = null;
            }
        }
    }

    private _scrollToDate(date: Date): boolean {
        const containerToScroll: HTMLElement = this._findElementByDate(date);

        if (containerToScroll) {
            scrollToElement(containerToScroll, false, true);
            return true;
        }
        return false;
    }

    private _canScroll(date: Date): boolean {
        const itemContainer: HTMLElement = this._findElementByDate(date);

        let itemDimensions: ClientRect,
            containerDimensions: ClientRect,
            scrollTop: number;

        if (!itemContainer) {
            return false;
        }

        //TODO remove after complete https://online.sbis.ru/opendoc.html?guid=7c921a5b-8882-4fd5-9b06-77950cbe2f79
        const container = this._container.get ? this._container.get(0) : this._container;

        itemDimensions = getDimensions(itemContainer);
        containerDimensions = getDimensions(container);

        scrollTop = this._scrollTop + (itemDimensions.top - containerDimensions.top);
        return this._children.scroll.canScrollTo(scrollTop);

    }

    private _scrollHandler(event: SyntheticEvent, scrollTop: number) {
        this._scrollTop = scrollTop;
        this._enrichItemsDebounced();
    }

    private _findElementByDate(date: Date): HTMLElement {
        let element: HTMLElement;

        if (this._options.viewMode === 'month' || date.getMonth() !== 0) {
            element = this._getElementByDate(
                ITEM_BODY_SELECTOR.month,
                monthListUtils.dateToId(dateUtils.getStartOfMonth(date)));
        }

        if (!element) {
            element = this._getElementByDate(
                ITEM_BODY_SELECTOR.year,
                monthListUtils.dateToId(dateUtils.getStartOfYear(date)));
        }
        return element;
    }

    private _getElementByDate(selector: string, dateId: string): HTMLElement {
        //TODO remove after complete https://online.sbis.ru/opendoc.html?guid=7c921a5b-8882-4fd5-9b06-77950cbe2f79
        const container = this._container.get ? this._container.get(0) : this._container;
        return container.querySelector(selector + '[data-date="' + dateId + '"]');
    }

    protected _dateToDataString(date: Date): string {
        return monthListUtils.dateToId(date);
    }

    static getDefaultOptions(): object {
        return {
            viewMode: 'year',
            yearTemplate,
            monthTemplate,
            // In most places where control is used, no more than 4 elements are displayed at the visible area.
            // Draw the elements above and below.
            virtualPageSize: 6
        };
    }
}

export default ModuleComponent;
