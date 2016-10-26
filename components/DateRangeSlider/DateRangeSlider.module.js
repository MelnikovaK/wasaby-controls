define('js!SBIS3.CONTROLS.DateRangeSlider',[
   'js!SBIS3.CORE.CompoundControl',
   'tmpl!SBIS3.CONTROLS.DateRangeSlider',
   'js!SBIS3.CONTROLS.RangeMixin',
   'js!SBIS3.CONTROLS.DateRangeMixin',
   'js!SBIS3.CONTROLS.DateRangeChoosePickerMixin',
   'js!SBIS3.CONTROLS.PickerMixin',
   'js!SBIS3.CONTROLS.Utils.DateUtil',
   'Core/helpers/date-helpers',
   'js!SBIS3.CONTROLS.Link'
], function (CompoundControl, dotTplFn, RangeMixin, DateRangeMixin, DateRangeChoosePickerMixin, PickerMixin, DateUtil, dateHelpers) {
   'use strict';

   /**
    * Контрол позволяющий выбирать диапазон дат равный месяцу, кварталу, полугодию или году.
    *
    * Контрол работает только с фиксированными диапазонами, поэтому можно задавть в опциях либо начальную,
    * либо конечную дату периода. Вторая дата вычислится автоматически исходя из типа минимального диапазона
    * который можно выбрать. Это позволяет привязывать одну из дат к контексту не заботясь о второй.
    *
    * SBIS3.CONTROLS.DateRangeSlider
    * @class SBIS3.CONTROLS.DateRangeSlider
    * @extends $ws.proto.CompoundControl
    * @mixes SBIS3.CONTROLS.PickerMixin
    * @mixes SBIS3.CONTROLS.RangeMixin
    * @mixes SBIS3.CONTROLS.DateRangeMixin
    * @mixes SBIS3.CONTROLS.DateRangeChoosePickerMixin
    * @author Миронов Александр Юрьевич
    * @demo SBIS3.CONTROLS.Demo.MyDateRangeSlider
    *
    * @control
    * @public
    * @category Date/Time
    */
   var DateRangeSlider = CompoundControl.extend([PickerMixin, RangeMixin, DateRangeMixin, DateRangeChoosePickerMixin], /** @lends SBIS3.CONTROLS.DateRangeSlider.prototype */{
      _dotTplFn: dotTplFn,
      $protected: {
         _options: {
            // year: null,
            /**
             * @cfg {String} тип комопонента
             * normal - стандартный вид
             * link - в виде ссылки
             */
            type: 'normal',

            /**
             * @cfg {Boolean} отобразить управляющую стрелку для переключения на следующий период
             */
            showNextArrow: true,
            /**
             * @cfg {Boolean} отобразить управляющую стрелку для переключения на предыдущий период
             */
            showPrevArrow: true,

            pickerConfig: {
               corner: 'tl',
               horizontalAlign: {
                  side: 'left'
                  // offset: -3
               },
               verticalAlign: {
                  side: 'top',
                  offset: -6
               }
            }
         },
         _cssRangeSlider: {
            value: 'controls-DateRangeSlider__value',
            yearState: 'controls-DateRangeSlider__yearState'
         }
      },

      $constructor: function () {
         // this._publish('onChangeHoveredItem');
      },

      init: function () {
         var container = this.getContainer();

         DateRangeSlider.superclass.init.call(this);

         if (!this._options.showMonths && !this._options.showQuarters && !this._options.showHalfyears) {
            this.getContainer().addClass(this._cssRangeSlider.yearState);
         }

         if (this._options.type === 'normal') {
            container.find(['.', this._cssRangeSlider.value].join('')).click(this.showPicker.bind(this));
         } else {
            this.getChildControlByName('Link').subscribe('onActivated', this.showPicker.bind(this));
         }

         container.find('.controls-DateRangeSlider__prev').click(this._onPrevBtnClick.bind(this));
         container.find('.controls-DateRangeSlider__next').click(this._onNextBtnClick.bind(this));

         this.subscribe('onRangeChange', this._updateValueView.bind(this));
         this._updateValueView();
      },

      _modifyOptions: function (opts) {
         var start, end;
         opts = DateRangeSlider.superclass._modifyOptions.apply(this, arguments);
         // Поскольку контрол работает только с фиксированными диапазонами, позволим разработчикам
         // не конфигурировать конечную дату. Сделаем это за них если они этого не сделали.
         start = opts.startValue;
         end = opts.endValue;
         if (start && !end) {
            if (opts.showMonths && DateUtil.isStartOfMonth(start)) {
               opts.endValue = DateUtil.getEndOfMonth(start);
            } else if (opts.showQuarters && DateUtil.isStartOfQuarter(start)) {
               opts.endValue = DateUtil.getEndOfQuarter(start);
            } else if (opts.showHalfyears && DateUtil.isStartOfHalfyear(start)) {
               opts.endValue = DateUtil.getEndOfHalfyear(start);
            } else if (DateUtil.isStartOfYear(start)) {
               opts.endValue = DateUtil.getEndOfYear(start);
            }
         } else if (end && !start) {
            if (opts.showMonths && DateUtil.isEndOfMonth(end)) {
               opts.startValue = DateUtil.getStartOfMonth(end);
            } else if (opts.showQuarters && DateUtil.isEndOfQuarter(end)) {
               opts.startValue = DateUtil.getStartOfQuarter(end);
            } else if (opts.showHalfyears && DateUtil.isEndOfHalfyear(end)) {
               opts.startValue = DateUtil.getStartOfHalfyear(end);
            } else if (DateUtil.isEndOfYear(end)) {
               opts.startValue = DateUtil.getStartOfYear(end);
            }
         }
         return opts;
      },

      _onPrevBtnClick: function () {
         this.setPrev();
         this._updateValueView();
      },

      _onNextBtnClick: function () {
         this.setNext();
          this._updateValueView();
      },

      _updateValueView: function () {
         var caption = dateHelpers.getFormattedDateRange(this.getStartValue(), this.getEndValue(), {shortYear: true, contractToHalfYear: true, contractToQuarter: true});
         if (this._options.type === 'normal') {
            this.getContainer().find(['.', this._cssRangeSlider.value].join('')).text(caption);
         } else {
            this.getChildControlByName('Link').setCaption(caption);
         }

      }
   });

   return DateRangeSlider;
});
