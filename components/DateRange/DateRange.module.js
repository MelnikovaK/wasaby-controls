/*global define*/
define('js!SBIS3.CONTROLS.DateRange', [
   'js!SBIS3.CORE.CompoundControl',
   'html!SBIS3.CONTROLS.DateRange',
   'js!SBIS3.CONTROLS.Utils.DateUtil',
   'js!SBIS3.CONTROLS.FormWidgetMixin',
   'i18n!SBIS3.CONTROLS.DateRange',
   'js!SBIS3.CONTROLS.DatePicker',
   'js!SBIS3.CONTROLS.Button',
   'js!SBIS3.CORE.DateRangeChoose'
], function (CompoundControl, dotTplFn, DateUtil, FormWidgetMixin) {
   'use strict';
   /**
    * SBIS3.CONTROLS.DateRange
    * @class SBIS3.CONTROLS.DateRange
    * @extends $ws.proto.CompoundControl
    * @author Крайнов Дмитрий Олегович
    * @control
    * @public
    * @demo SBIS3.CONTROLS.Demo.MyDateRange
    */
   var DateRange = CompoundControl.extend([FormWidgetMixin], /** @lends SBIS3.CONTROLS.DateRange.prototype */{
      _dotTplFn: dotTplFn,
      $protected: {
         _options: {
            /**
             * @cfg {Date|String} Начальная дата диапазона
             * При задании задается вместе с endDate, либо обе даты остаются не заданными
             */
            startDate: null,
            /**
             * @cfg {Date|String} Конечная дата диапазона
             * При задании задается вместе с startDate, либо обе даты остаются не заданными
             */
            endDate: null
         },
         _datePickerStart: null,
         _datePickerEnd: null,
         _dateRangeButton: null,
         _dateRangeChoose: null,
         _calendarIsShow: false
      },
      $constructor: function () {
         this._publish('onDateRangeChange', 'onStartDateChange', 'onEndDateChange');
      },

      init: function () {
         DateRange.superclass.init.call(this);

         var self = this;

         this._dateRangeButton = this.getChildControlByName('DateRange__Button');
         this._datePickerStart = this.getChildControlByName('DateRange__DatePickerStart');
         this._datePickerEnd = this.getChildControlByName('DateRange__DatePickerEnd');
         this._datePickerStart.subscribe('onDateChange', function(e, date) {
            self.clearMark();
            //передаем false, чтобы не зацикливать событие
            self._setStartDate(date, false);
            self._notifyOnPropertyChanged('startDate');
            self._notify('onStartDateChange', self._options.startDate);
            self._notify('onDateRangeChange', self._options.startDate, self._options.endDate);
         });
         this._datePickerStart.subscribe('onInputFinished', function() {
            self._datePickerEnd.setActive(true);
         });
         this._datePickerEnd.subscribe('onDateChange', function(e, date) {
            self.clearMark();
            self._setEndDate(date, false);
            self._notifyOnPropertyChanged('endDate');
            self._notify('onEndDateChange',   self._options.endDate);
            self._notify('onDateRangeChange', self._options.startDate, self._options.endDate);
         });

         this._dateRangeButton.subscribe('onActivated', this._onDateRangeButtonActivated.bind(this));

         this._dateRangeChoose = this.getChildControlByName('DateRange__DateRangeChoose');
         this._dateRangeChoose.subscribe('onMenuHide', this._onMenuHide.bind(this));
         this._dateRangeChoose.subscribe('onChange', this._onRangeChooseChange.bind(this));
         this._dateRangeChoose.setVisible(false);

         //TODO заплатка для 3.7.3.20 Нужно переделать контрол на PickerMixin
         var floatArea = this._getFloatArea();
         if (floatArea) {
            floatArea.subscribe('onClose', function() {
               self._dateRangeChoose._hideMenu();
            });
         }

         //приводим даты к Date-типу
         this._options.startDate = DateUtil.valueToDate(this._options.startDate);
         this._options.endDate   = DateUtil.valueToDate(this._options.endDate);
         this._setStartDate(this._options.startDate);
         this._setEndDate(this._options.endDate);

         this._addDefaultValidator();
      },

      _addDefaultValidator: function() {
         //Добавляем к прикладным валидаторам стандартный, который проверяет что дата начала периода меньше даты конца.
         this._options.validators.push({
            validator: function() {
               return !(this._options.startDate && this._options.endDate && this._options.endDate < this._options.startDate);
            }.bind(this),
            errorMessage: rk('Дата начала периода не может быть больше даты окончания')
         });
      },

      _setDate: function(newDate, datePicker, currentDate, type, useSetDate) {
         var date = DateUtil.valueToDate(newDate);
         var changed = false;
         if ( ! date) {
            if (type === 'start') {
               this._options.startDate = null;
            } else {
               this._options.endDate = null;
            }
            changed = true;
         }
         //дата изменилась
         if ( ! changed && ((DateUtil.isValidDate(currentDate) && date.getTime() !== currentDate.getTime()) || ( ! currentDate))) {
            if (type === 'start') {
               this._options.startDate = date;
            } else {
               this._options.endDate = date;
            }
            changed = true;
         }
         this._dateRangeChoose.setRange(this._options.startDate, this._options.endDate);
         //useSetDate чтобы не зацикливать событие от setDate и setText
         if ( ! useSetDate) {
            return changed;
         }
         if (date) {
            datePicker.setDate(date);
         } else {
            datePicker.setText('');
         }
         return changed;
      },

      /**
       * Установить начальную дату.
       * @param {Date|String} newDate
       * @param {Boolean} useSetDate true - будет вызывать setDate у DatePicker-a
       * @private
       * @return {Boolean} true - если дата изменилась
       */
      _setStartDate: function(newDate, useSetDate) {
         if (useSetDate === undefined) {
            useSetDate = true;
         }
         return this._setDate(newDate, this._datePickerStart, this._options.startDate, 'start', useSetDate);
      },

      /**
       * Установить начальную дату.
       * @param {Date|String} newDate Начальная дата диапазона.
       * @see startDate
       */
      setStartDate: function(newDate) {
         if (this._setStartDate(newDate)) {
            this._notifyOnPropertyChanged('startDate');
            this._notify('onStartDateChange', this._options.startDate);
            this._notify('onDateRangeChange', this._options.startDate, this._options.endDate);
         }
      },

      /**
       * Получить начальную дату.
       * @return {Date} Начальная дата диапазона.
       * @see startDate
       */
      getStartDate: function() {
         return this._options.startDate;
      },

      /**
       * Установить конечную дату.
       * @param {String} newDate Конечная дата диапазона.
       * @see endDate
       */
      setEndDate: function(newDate) {
         if (this._setEndDate(newDate)) {
            this._notifyOnPropertyChanged('endDate');
            this._notify('onEndDateChange', this._options.endDate);
            this._notify('onDateRangeChange', this._options.startDate, this._options.endDate);
         }
      },

      _setEndDate: function(newDate, useSetDate) {
         if (useSetDate === undefined) {
            useSetDate = true;
         }
         return this._setDate(newDate, this._datePickerEnd, this._options.endDate, 'end', useSetDate);
      },

      /**
       * Получить конечную дату.
       * @return {Date} Конечная дата диапазона.
       * @see endDate
       */
      getEndDate: function() {
         return this._options.endDate;
      },

      _onDateRangeButtonActivated: function() {
         this._calendarIsShow = !this._calendarIsShow;
         if (this._calendarIsShow) {
            //TODO Если DateRangeChoose не отобразить, то позиция окна считается не верно. Нужно на что-то заменить
            this._dateRangeChoose.setVisible(true);
            this._dateRangeChoose._showMenu();
            this._dateRangeChoose.setVisible(false);
         } else {
            this._dateRangeChoose._hideMenu();
         }
      },

      //TODO заплатка для 3.7.3.20 Нужно переделать контрол на PickerMixin
      //ищем родительскую FloatArea
      _getFloatArea: function() {
         var par = this.getParent();
         while (par && !$ws.helpers.instanceOfMixin(par, 'SBIS3.CONTROLS.PopupMixin')) {
            par = par.getParent();
         }
         return (par && $ws.helpers.instanceOfMixin(par, 'SBIS3.CONTROLS.PopupMixin')) ? par : null;
      },

      _onMenuHide: function() {
         this._calendarIsShow = false;
      },

      _onRangeChooseChange: function(event, start, end) {
         this._datePickerStart.setDate(start);
         this._datePickerEnd.setDate(end);
      },

      //TODO: этот метод нужно перенести в helpers.
      getFormattedValue: function() {
         var
             lastDay,
             result = "",
             startDate = this._options.startDate,
             endDate = this._options.endDate;

         if (startDate && endDate) {
            lastDay = new Date(endDate.getTime()).setLastMonthDay().getDate();
            //Если месяц целиком
            if (startDate.getDate() == 1 && endDate.getDate() == lastDay) {
               if (startDate.getFullYear() == endDate.getFullYear()) {
                  if (startDate.getMonth() == endDate.getMonth()) {
                     result = startDate.strftime("%f %Y");
                  } else {
                     result = startDate.strftime("%f") + ' - ' + endDate.strftime("%f %Y");
                  }
               } else {
                  result = startDate.strftime("%f %Y") + ' - ' + endDate.strftime("%f %Y");
               }
            //Если даты совпадают
            } else if (startDate.getDate() == endDate.getDate() && startDate.getMonth() == endDate.getMonth() && startDate.getFullYear() == endDate.getFullYear()) {
               result = startDate.strftime("%e.%m.%y");
            //Если даты различные
            } else {
               result = startDate.strftime("%e.%m.%y") + ' - ' + endDate.strftime("%e.%m.%y");
            }
         } else if (startDate) {
            result = startDate.strftime("%e.%m.%y") + ' - ...';
         } else if (endDate) {
            result = '... - ' + endDate.strftime("%e.%m.%y");
         }
         return result;
      }
   });
   return DateRange;
});