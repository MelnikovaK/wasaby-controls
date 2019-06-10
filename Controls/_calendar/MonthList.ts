import BaseControl = require('Core/Control');
import coreMerge = require('Core/core-merge');
import CalendarSource from './MonthList/CalendarSource';
import dateUtils = require('Controls/Utils/Date');
import template = require('wml!Controls/_calendar/MonthList/MonthList');
import 'wml!Controls/_calendar/MonthList/MonthListItem';

/*
 Этот компонент можно отдать прикладникам и использовать в разделе календаря на онлайне.
 Для этого надо предусмотреть api для кастомизации представления года и месяца, а так же возможность
 подмешивания пользовательских данных при рендеринге годов и месяцев.
 */

/**
 * Прокручивающийся список с месяцами. Позволяет выбирать период.
 *
 * @class Controls/_calendar/MonthList
 * @mixes Controls/_calendar/interface/IMonthListCustomDays
 * @extends Core/Control
 * @author Миронов А.Ю.
 * @noShow
 */
var ModuleComponent = BaseControl.extend({
    _viewSource: null,
    _template: template,
    _position: 0,

    _startValue: null,
    _endValue: null,
    _selectionProcessing: false,
    _selectionBaseValue: null,
    _selectionHoveredValue: null,

    constructor: function () {
        ModuleComponent.superclass.constructor.apply(this, arguments);
    },

    _beforeMount: function (options) {
        this._position = options.date.getFullYear();
        this._viewSource = new CalendarSource({

            //monthSource: new MonthSource()
        });

        // TODO: портировать установку года и подскрол к нужному месяцу когда будет корректно работать навигация по курсору.
        // https://online.sbis.ru/opendoc.html?guid=f01aaceb-2c7e-4a19-9a86-2d59c5419254

        // this._startValue = options.startValue;
        // this._endValue = options.endValue;
        // this.selectionProcessing = options.selectionProcessing;
    },

    _beforeUpdate: function (options) {
        var year = options.date.getFullYear();
        if (year !== this._position) {
            this._position = year;
        }

        this._startValue = options.startValue;
        this._endValue = options.endValue;

        // this._selectionProcessing = options.selectionProcessing;
        // this._selectionBaseValue = options.selectionBaseValue;
        // this._selectionHoveredValue = options.selectionHoveredValue;
    },

    startValueChangedHandler: function (event, value) {
        // this._startValue = value;
        this._notify('startValueChanged', [value]);
    },

    endValueChangedHandler: function (event, value) {
        // this._endValue = value;
        this._notify('endValueChanged', [value]);
    },

    selectionChangedHandler: function (event, start, end) {
        this._notify('selectionChanged', [start, end]);
    },

    _getMonth: function (year, month) {
        return new Date(year, month, 1);
    },

    _drawItemsHandler: function() {
        this._notify('drawItems');
    }
});

ModuleComponent.getDefaultOptions = function () {
    return coreMerge({
        date: dateUtils.getStartOfMonth(),
        itemTemplate: 'wml!Controls/_calendar/MonthList/MonthListItem'
    }, {});
};

// ModuleComponent.getOptionTypes = function() {
//    return coreMerge({
//       // itemTemplate: types(String)
//    }, {});
// };

export default ModuleComponent;