import {detection} from 'Env/Env';
import {date as formatDate} from 'Types/formatter';
import isEmpty = require('Core/helpers/Object/isEmpty');

export default {
    /**
     * Returns whether the mode of the year can be displayed
     * @returns {Boolean}
     */
    isYearStateEnabled: function (options) {
        var quantum = options.quantum;
        return options.selectionType !== 'single' && (!quantum ||
            (isEmpty(quantum) || 'months' in quantum || 'quarters' in quantum || 'halfyears' in quantum || 'years' in quantum));
    },

    /**
     * Returns whether the month view can be displayed
     * @returns {Boolean}
     */
    isMonthStateEnabled: function (options) {
        var quantum = options.quantum;
        return (quantum && ('days' in quantum || 'weeks' in quantum)) ||
            ((!quantum || isEmpty(quantum)) && options.minRange === 'day');
    },

    /**
     * Returns whether the month and year mode switch button can be displayed
     * @returns {Boolean}
     */
    isStateButtonDisplayed: function (options) {
        return this.isYearStateEnabled(options) && this.isMonthStateEnabled(options);
    },

    dateToDataString: function(date) {
        return formatDate(date, 'YYYY.M');
    },
    dataStringToDate: function (str) {
        var d = str.split('.');
        return new Date(d[0], parseInt(d[1], 10) - 1);
    },

    isStickySupport: function() {
        return !((detection.isIE && detection.IEVersion < 16) || (detection.isWinXP && detection.chrome));
    }
};
