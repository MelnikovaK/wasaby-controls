define('js!SBIS3.CONTROLS.DateRangeBigChoosePickerMixin', [
   'js!SBIS3.CONTROLS.DateRangeBigChoose',
   'js!SBIS3.CONTROLS.Utils.DateUtil',
   'Core/core-instance'
], function (DateRangeBigChoose, DateUtil, cInstance) {
   /**
    * Миксин, умеющий отображать выпадающий вниз блок содержащий контрол SBIS3.CONTROLS.DateRangeBigChoose.
    * Используется только совместно с SBIS3.CONTROLS.DateRangeMixin(SBIS3.CONTROLS.RangeMixin) и SBIS3.CONTROLS.PickerMixin.
    * Связывает данные текущего контрола и открываемого в выпадающем блоке.
    * @mixin SBIS3.CONTROLS.DateRangeBigChoosePickerMixin
    * @public
    * @author Миронов Александр Юрьевич
    */

   var DateRangeBigChoosePickerMixin = /**@lends SBIS3.CONTROLS.DateRangeBigChoosePickerMixin.prototype  */{
      $protected: {
         _options: {
            /**
             * Режим выбора одной даты или диапазона дат
             * @cfg {Boolean} Если true, то включена возможность выделения диапазона,
             * иначе можно выделить только 1 дату.
             */
            rangeselect: true,

            pickerConfig: {
               corner: 'tl',
               horizontalAlign: {
                  side: 'left'
               },
               verticalAlign: {
                  side: 'top'
               }
            }
         },

         _chooserControl: null
      },

      $constructor: function () {
         if (!(cInstance.instanceOfMixin(this, 'SBIS3.CONTROLS.RangeMixin' ||
               cInstance.instanceOfMixin(this, 'SBIS3.CONTROLS.DateRangeMixin')))) {
            throw new Error('RangeMixin or DateRangeMixin mixin is required');
         }
         if (!cInstance.instanceOfMixin(this, 'SBIS3.CONTROLS.PickerMixin')) {
            throw new Error('PickerMixin mixin is required');
         }
      },

      before: {
         showPicker: function () {
            if (this._chooserControl) {
               this._chooserControl.setRange(this.getStartValue(), this.getEndValue());
               if (this._options.rangeselect) {
                  this._chooserControl.applyYearState();
               }
            }
         }
      },

      instead: {
         /**
          * Определение контента пикера. Переопределённый метод
          * @private
          */
         _setPickerContent: function () {
            var self = this,
               // Создаем пустой контейнер
               element = $('<div>');

            this._picker.getContainer().empty();
            // Преобразуем контейнер в контролл DateRangeChoose и запоминаем
            self._chooserControl = new DateRangeBigChoose({
               parent: this._picker,
               element: element,
               startValue: this.getStartValue(),
               endValue: this.getEndValue(),
               rangeselect: this._options.rangeselect
            });

            // Добавляем в пикер
            this._picker.getContainer().append(element);

            this._chooserControl.subscribe('onChoose', this._onChooserRangeChange.bind(this));
            this._chooserControl.subscribe('onCancel', this._onChooserClose.bind(this));
         }
      },

      _onChooserRangeChange: function (e, start, end) {
         if (!this._options.rangeselect) {
            end = start;
         }
         this.setRange(start, end);
         this.hidePicker();
      },
      _onChooserClose: function(e) {
         this.hidePicker();
      }
   };

   return DateRangeBigChoosePickerMixin;
});
