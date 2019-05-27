/**
 * calendar library
 * @library Controls/calendar
 * @includes Month Controls/_calendar/Month
 * @includes MonthList Controls/_calendar/MonthList
 * @includes MonthSlider Controls/_calendar/MonthSlider
 * @includes MonthModel Controls/_calendar/Month/Model
 * @includes MonthModel Controls/_calendar/Utils
 * @includes IMonthListCustomDays Controls/_calendar/interface/IMonthListCustomDays
 * @public
 * @author Kraynov D.
 */

import MonthViewDayTemplate = require('wml!Controls/_calendar/MonthView/dayTemplate');
import MonthViewTemplate = require('wml!Controls/_calendar/MonthView/MonthView');
import MonthViewTableBodyTemplate = require('wml!Controls/_calendar/MonthView/MonthViewTableBody');

export {default as Month} from './_calendar/Month';
export {default as MonthList} from './_calendar/MonthList';
export {default as MonthSlider} from './_calendar/MonthSlider';
export {Base as MonthSliderBase} from './_calendar/MonthSlider';
export {default as MonthModel} from './_calendar/Month/Model';
export {default as Utils} from './_calendar/Utils';

export {
   MonthViewDayTemplate,
   MonthViewTemplate,
   MonthViewTableBodyTemplate
}
