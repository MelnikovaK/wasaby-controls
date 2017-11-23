define('js!SBIS3.CONTROLS.DateRangeSlider',[
   'js!SBIS3.CONTROLS.DateRangeSliderBase',
   'js!SBIS3.CONTROLS.DateRangeChoosePickerMixin',
   'js!SBIS3.CONTROLS.Utils.DateUtil',
   'Core/helpers/date-helpers',
   'Core/IoC',
   'js!SBIS3.CONTROLS.Link',
   'css!SBIS3.CONTROLS.DateRangeSlider/RangeSlider/DateRangeSlider'
], function (DateRangeSliderBase, DateRangeChoosePickerMixin, DateUtil, dateHelpers, IoC) {
   'use strict';

   /**
    * Контрол позволяющий выбирать диапазон дат равный месяцу, кварталу, полугодию или году.
    *
    * Если контрол работает с одним типом диапазона(например можно выбрать только месяца, или только кварталы),
    * то можно задавать в опциях и свойствах либо начальную, либо конечную дату периода.
    * Вторая дата вычислится автоматически исходя из типа диапазона который можно выбрать.
    * Это позволяет привязывать одну из дат к контексту не заботясь о второй.
    *
    * SBIS3.CONTROLS.DateRangeSlider
    * @class SBIS3.CONTROLS.DateRangeSlider
    * @extends SBIS3.CONTROLS.DateRangeSliderBase
    *
    * @mixes SBIS3.CONTROLS.DateRangeChoosePickerMixin
    *
    * @author Миронов Александр Юрьевич
    * @demo SBIS3.CONTROLS.Demo.MyDateRangeSlider
    *
    * @control
    * @public
    * @category Date/Time
    */
   var DateRangeSlider = DateRangeSliderBase.extend([DateRangeChoosePickerMixin], /** @lends SBIS3.CONTROLS.DateRangeSlider.prototype */{
      $protected: {
         _options: {
            /**
             * @cfg {Boolean} автоподстановка второго значения
             * Значение по умолчанию true
             * @deprecated
             */
            // Добавил опцию что бы исключить ошибки при переходе к автоизменению второго значения в текущей версии.
            // Пока что не уверен стоит ли выпиливать ее в будущих версиях.
            // Этот функционал скорее всего будет пересен с миксин DateRangeChoosePickerMixin, и тогда опция будет
            // полезна что бы можно было отключить это поведдение по умолчанию для некоторых компонентов.
            autoValue: true
         }
      },

      $constructor: function () {
         // this._publish('onChangeHoveredItem');
      },

      init: function () {
         DateRangeSlider.superclass.init.call(this);

         var
            self = this,
            container = this.getContainer(),
            isCheckedOptions = this._options.checkedStart || this._options.checkedEnd || this._options.iconsHandler;

         if (!this._options.showMonths && !this._options.showQuarters && !this._options.showHalfyears) {
            this.getContainer().addClass(this._cssRangeSlider.yearState);
         }

         if (!((this._options.showYears && !this._options.showHalfyears && !this._options.showQuarters && !this._options.showMonths && !isCheckedOptions) ||
                  (this._options.showHalfyears && this._options.showQuarters && this._options.showMonths) ||
                  (!this._options.showHalfyears && !this._options.showQuarters && this._options.showMonths && !isCheckedOptions) ||
                  (!this._options.showHalfyears && this._options.showQuarters && !this._options.showMonths && !isCheckedOptions)
            )) {
            IoC.resolve('ILogger').log(
               'SBIS3.CONTROLS.DateRangeSliderBase',
               this.getName() + ': Используемое сочетание опций showMonths, showQuarters, showHalfyears, showYears и опций установки иконок не стандартизовано и не должно использоваться. Возможна не корректная работа контрола.'
            )
         }

         // Пока pickerMixin не умеет выравниваться по центру относительно открывающего контрола, сделаем это за него.
         // Выпилить как сделают https://online.sbis.ru/opendoc.html?guid=73b59c8e-f962-433c-9432-1218fbe754aa
         this.subscribe('onPickerOpen', function(){
            var picker = self.getPicker();
            picker.setHorizontalAlign({
               side: 'left',
               offset: (container.outerWidth() - picker.getContainer().width()) / 2
            });
         });
      },

      _modifyOptions: function (opts) {
         var start, end;
         opts = DateRangeSlider.superclass._modifyOptions.apply(this, arguments);
         // Поскольку контрол работает только с фиксированными диапазонами, позволим разработчикам
         // не конфигурировать одну из дат. Сделаем это за них если они этого не сделали.
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
         opts._caption = this._getCaption(opts);
         return opts;
      },

      _getRangeTypeIfSingle: function () {
         var opts = {'showMonths': 'month', 'showQuarters': 'quarter', 'showHalfyears': 'halfyear', 'showYears': 'year'},
            rTypes = 0,
            rType, lastType;
         for (rType in opts) {
            if (opts.hasOwnProperty(rType)) {
               if (this._options[rType]) {
                  rTypes += 1;
                  lastType = opts[rType];
               }
            }
         }
         return rTypes === 1 && lastType;
      },

      _getStartValueByControlPeriodType: function (end, periodType) {
         if (periodType === 'month' && DateUtil.isEndOfMonth(end)) {
            return DateUtil.getStartOfMonth(end);
         } else if (periodType === 'quarter' && DateUtil.isEndOfQuarter(end)) {
            return DateUtil.getStartOfQuarter(end);
         } else if (periodType === 'halfyear' && DateUtil.isEndOfHalfyear(end)) {
            return DateUtil.getStartOfHalfyear(end);
         } else if (periodType === 'year' && DateUtil.isEndOfYear(end)) {
           return DateUtil.getStartOfYear(end);
         }
      },

      _getEndValueByControlPeriodType: function (start, periodType) {
         if (periodType === 'month' && DateUtil.isStartOfMonth(start)) {
            return DateUtil.getEndOfMonth(start);
         } else if (periodType === 'quarter' && DateUtil.isStartOfQuarter(start)) {
            return DateUtil.getEndOfQuarter(start);
         } else if (periodType === 'halfyear' && DateUtil.isStartOfHalfyear(start)) {
            return DateUtil.getEndOfHalfyear(start);
         } else if (periodType === 'year' && DateUtil.isStartOfYear(start)) {
            return DateUtil.getEndOfYear(start);
         }
      },

      setStartValue: function (value, silent) {
         var sType = this._getRangeTypeIfSingle(),
            changed, endValue;
         if (this._options.autoValue && sType) {
            changed = DateRangeSlider.superclass.setStartValue.call(this, value, true);
            if (changed) {
               if (!silent) {
                  this._notifyOnStartValueChanged();
               }
               endValue = value ? this._getEndValueByControlPeriodType(value, sType) : null;
               if (this.setEndValue(endValue, true)) {
                  if (!silent) {
                     this._notifyOnEndValueChanged();
                  }
               }
               if (!silent) {
                  this._notifyOnRangeChanged();
               }
            }
         } else {
            changed = DateRangeSlider.superclass.setStartValue.apply(this, arguments);
         }
         return changed
      },

      setEndValue: function (value, silent) {
         var sType = this._getRangeTypeIfSingle(),
            changed, startValue;
         if (this._options.autoValue && sType) {
            changed = DateRangeSlider.superclass.setEndValue.call(this, value, true);
            if (changed) {
               if (!silent) {
                  this._notifyOnEndValueChanged();
               }
               startValue = value ? this._getStartValueByControlPeriodType(value, sType) : null;
               if (this.setStartValue(startValue, true)) {
                  if (!silent) {
                     this._notifyOnStartValueChanged();
                  }
               }
               if (!silent) {
                  this._notifyOnRangeChanged();
               }
            }
         } else {
            changed = DateRangeSlider.superclass.setEndValue.apply(this, arguments);
         }
         return changed
      },

      showPicker: function () {
         if (this.isEnabled()) {
            DateRangeSlider.superclass.showPicker.apply(this, arguments);
         }
      },

      _setPickerConfig: function() {
         return {
            corner: 'tl',
            bodyBounds: true,
            locationStrategy: 'bodyBounds',
            horizontalAlign: {
               side: 'left'
            },
            verticalAlign: {
               side: 'top'
            },
            closeByExternalClick: true,
            className: 'controls-DateRangeSlider__picker'
         };
      },

      hidePicker: function () {
         DateRangeSlider.superclass.hidePicker.apply(this, arguments);
         // В нормальном режиме у DateRangeSlider нет внутренних компонентов и он не получает фокус т.к.
         // когда закрывается пикер, то фокус возвращается на предыдущий контрол(DateRangeSlider) и происходит проверка
         // на всех внетренних контролах могут ли они принимать фокус. А внутренний контрол есть только один.
         // Это сам пиккер который уже скрыт и не может принять фокус. Устанавливаем фокус вручную.
         //- У нас при открытии popup в качестве пэрента указывается открывающий компонент. Когда попап закрывается, то выпадающий компонент скрывается, и происходит поиск компонента на который будет установлен фокус среди родителей. Сначала проверяется открывающий компонент. Это CompoundControl. В нем ищутся внутренние компоненты. И находится только один скрытый. Это выпадающий блок. При таком раскладе наша логика решает, что на текущий CompaundControl не надо устанавливать фокус. И начинает искать уже в родителе нашего контрола. Т.е. DateRangeSlider не получает фокуса при закрытии выпадашки. В текущей ошибке проблема в том. что DateRangeSlider встроен в редактирование по месту. При закрытии выпадашки фокус устанавливается вне контрола редактирования по месту. И после выбора периода и клика вне редактирования по месту, редактирование по месту не закрывается.
         //- В этом МР я сделал принудительную установку фокуса после закрытия выпадашки. Про подробностями этой логики можно спросить у Шипина.
         if (this._options.type === 'normal') {
            this.setActive(true);
         }
      }
   });

   return DateRangeSlider;
});
