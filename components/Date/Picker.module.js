/**
 * TODO Компонент пока тестировался только в Chrome
 */
define(
   'js!SBIS3.CONTROLS.DatePicker',
   [
      'Core/EventBus',
      'js!SBIS3.CONTROLS.DateBox',
      'js!SBIS3.CONTROLS.PickerMixin',
      'js!SBIS3.CONTROLS.DateRangeBigChoose',
      'js!SBIS3.CONTROLS.TimePicker',
      'tmpl!SBIS3.CONTROLS.DatePicker/Picker/DatePicker',
      'tmpl!SBIS3.CONTROLS.DateBox/DateBox/DateBox',
      'tmpl!SBIS3.CONTROLS.DatePicker/Picker/elementPickerContent',
      'js!SBIS3.CONTROLS.Utils.IsChildControl',
      "Core/IoC",
      'i18n!SBIS3.CONTROLS.DatePicker',
      'js!SBIS3.CONTROLS.IconButton',
      'css!SBIS3.CONTROLS.DatePicker/Picker/DatePicker',
      'css!SBIS3.CONTROLS.FormattedTextBox/FormattedTextBox/FormattedTextBox',
      'css!SBIS3.CONTROLS.DateBox/DateBox/DateBox'
   ],
   function (EventBus, DateBox, PickerMixin, DateRangeBigChoose, TimePicker, dotTplFn, dateBoxTpl, ElementPickerContent, isChildControl, IoC) {

   'use strict';

   /**
    * Контрол, предназначенный для ввода информации о дате/времени.
    * <br/>
    * В зависимости от {@link mask маски} возможен ввод:
    * <ol>
    *    <li>только даты,</li>
    *    <li>только времени,</li>
    *    <li>даты и времени.</li>
    * </ol>
    * Осуществить ввод информации можно как с клавиатуры, так и выбором на календаре, который открывается кликом по соответствующей иконке рядом с полем ввода.
    * <br/>
    * Если контролу в опцию {@link date} установлена несуществующая календарная дата, то в качестве значения будет установлен null.
    * Аналогичное поведение свойственно и при работе с контекстом: если опция date привязана к полю контекста, в котором хранится несуществующая календарная дата, то в значение контрола будет установлен null.
    *
    * @class SBIS3.CONTROLS.DatePicker
    * @extends SBIS3.CONTROLS.DateBox
    *
    * @mixes SBIS3.CONTROLS.PickerMixin
    *
    * @author Крайнов Дмитрий Олегович
    *
    * @demo SBIS3.CONTROLS.Demo.MyDatePicker
    *
    * @control
    * @public
    * @category Date/Time
    */

   var DatePicker = DateBox.extend([PickerMixin], /** @lends SBIS3.CONTROLS.DatePicker.prototype */{
      _dotTplFn: dotTplFn,
      /**
        * @event onDateChange Происходит при изменении даты.
        * @remark
        * Изменение даты производится одним из трёх способов:
        * 1. через выбор в календаре;
        * 2. через установку нового значения в поле ввода с клавиатуры;
        * 3. методами {@link setText} или {@link setDate}.
        * @param {Core/EventObject} eventObject Дескриптор события.
        * @param {Date} date Дата, которую установили.
        * @example
        * <pre>
        *    var dateChangeFn = function(event) {
        *       if (this.getDate().getTime() < minDate.getTime()) {
        *          buttonSend.setEnabled(false);
        *          title.setText('Указана прошедшая дата: проверьте нет ли ошибки');
        *       }
        *    };
        *    datePicker.subscribe('onDateChange', dateChangeFn);
        * </pre>
        */
      /**
       * @event onDateSelect Происходит при окончании выбора даты.
       * @remark
       * Окончанием выбора даты является уход фокуса из поля ввода, на не дочерние контролы.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {Date} date Дата, которую установили.
       */
      $protected: {
         _pickerContent: null,
         /**
          * Опции создаваемого контролла
          */
         _options: {
            dateBoxTpl: dateBoxTpl,
            /**
             * @cfg {Boolean} Устанавливает отображение иконки календаря рядом с полем ввода.
             * @remark
             * Если {@link mask} установлена в значение "Только время", то автоматически иконка календаря скрывается (значение опции самостоятельно сменится на false).
             * @example
             * <pre>
             *     <option name="pickerIconShow">false</option>
             * </pre>
             * @see date
             * @see mask
             * @see setDate
             * @deprecated
             */
            pickerIconShow: true,
            /**
             * @cfg {Boolean} Устанавливает отображение иконки выбора времени рядом с полем ввода в случае если {@link mask} установлена в значение "Только время".
             * @remark
             * Опция будет удалена начиная с версии 3.17.*, значение по умолчанию будет timePickerIconShow = true.
             * @deprecated
             */
            timePickerIconShow: false,

            pickerConfig: {
               corner: 'tl',
               cssClassName: 'controls-DateRangeBigChoose__noBorder',
               horizontalAlign: {
                  side: 'right',
                  offset: 143
               },
               verticalAlign: {
                  side: 'top',
                  offset: -9
               },
               bodyBounds: true,
               locationStrategy: 'bodyBounds',
               activateAfterShow: true
            }
         },
         _onFocusInHandler: undefined
      },

      $constructor: function () {
         this._publish('onDateChange', 'onDateSelect', 'onFocusOut');
      },

      init: function () {
         DatePicker.superclass.init.call(this);
         this._pickerInit();
      },

      isPickerIconShow: function() {
         return this._options.pickerIconShow;
      },

      _modifyOptions : function(options) {
         DatePicker.superclass._modifyOptions.call(this, options);

         /*
          * TODO: Удалить, когда все перейдут на опцию pickerIconShow вместо isCalendarIconShown.
          * Возможно нужно убрать эту опции, потому что есть компонент DateBox. DatePicker отличается
          * от DateBox только иконкой и встает вопрос зачем использовать DatePicker без иконки.
          */
         if (options.isCalendarIconShown === false) {
            options.pickerIconShow = false;
            IoC.resolve('ILogger').log('DatePicker', 'В качестве опции isCalendarIconShown используйте pickerIconShow');
         }
         this._checkTypeOfMask(options);

         return options;
      },

      _getPickerName: function() {
         return this._options._pickerName;
      },

      _getPickerMethod: function(method) {
         var name = '_' + this._getPickerName() + method;
         return this[name].bind(this);
      },

      /**
       * Инициализация пикера.
       * @private
       */
      _pickerInit: function() {
         if (this.isPickerIconShow()) {
            this.getChildControlByName('PickerButton').subscribe('onActivated', this._getPickerMethod('Init'));
         }
      },

      /**
       * Инициализация пикера выбора даты
       * @private
       */
      _calendarInit: function() {
         if (this.isEnabled()) {
            this.togglePicker();

            this._initFocusInHandler();
            // Если календарь открыт данным кликом - обновляем календарь в соответствии с хранимым значением даты
            if (this._picker.isVisible() && this.getDate()) {
               this._pickerContent.setStartValue(this.getDate());
            }
         }
      },

      /**
       * Инициализация пикера выбора даты
       * @private
       */
      _timeInit: function() {
         if (this.isEnabled()) {
            this._options.pickerConfig.closeButton = true;

            //TODO: Убрать, когда у FloatArea будет бордер.
            this._options.pickerConfig.cssClassName = 'controls-DatePicker__timePicker-border';

            this.togglePicker();

            this._initFocusInHandler();
            // Если часы открыты данным кликом - обновляем часы в соответствии с хранимым значением даты.
            if (this._picker.isVisible() && this.getDate()) {
               this._pickerContent.setTime(this.getDate());
            }

            this._pickerContent.subscribe('onTimeSelect', this._timeSelectHandler.bind(this));
            this._picker.subscribe('onClose', this._notify.bind(this, 'onDateSelect'));
         }
      },

      _timeSelectHandler: function() {
         // Если закончили выбор времени на минутах, то нужно закрыть пикер.
         if (this._pickerContent.getMode() === 'minutes') {
            this.hidePicker();
            // При выборе даты через TimePicker после его закрытия считаем, что закончили выбор даты.
            this._notify('onDateSelect');
         }
      },

      _setEnabled : function(enabled) {
         DatePicker.superclass._setEnabled.call(this, enabled);
         if (this._picker && this._picker.isVisible()){
            this.hidePicker();
         }
         // Внутри шаблона DatePicker используем шаблон DateBox. Устанавливаем на нем соответсвующие классы
         // что бы к нему корректно применились стили.
         this.getContainer().children('.controls-DateBox').toggleClass('ws-enabled', enabled).toggleClass('ws-disabled', !enabled);
      },
      _getStateToggleContainer: function(){
         return this.getContainer().children('.controls-DateBox');
      },
      showPicker: function () {
         DatePicker.superclass.showPicker.call(this);
         this._getPickerMethod('Show')();
      },

      _calendarShow: function() {
         this._pickerContent.setRange(this.getDate(), this.getDate());
         this._pickerContent.updateViewAfterShow();
      },

      _timeShow: function() {
         var timeControl = this._pickerContent;

         timeControl.setTime(this.getDate());
         timeControl.defaultMode();
      },

      /**
       * Определение контента пикера. Переопределённый метод
       * @private
       */
      _setPickerContent: function() {
         // Создаем пустой контейнер
         var element = $(ElementPickerContent({
               pickerName: this._getPickerName()
            }));

         // Добавляем в пикер
         this._picker.getContainer().append(this._getPickerMethod('Create')(element));
      },

      _calendarCreate: function(element) {
         var
            date = this.getDate(),
            type = this.getType();

         this._pickerContent = new DateRangeBigChoose({
            parent: this._picker,
            element: element,
            rangeselect: false,
            startValue: date,
            startValueSerializationMode: type,
            endValue: date,
            endValueSerializationMode: type
         });
         // Добавляем в пикер
         this._picker.getContainer().append(element);

         // Нажатие на календарный день в пикере устанавливает дату
         this._pickerContent.subscribe('onChoose', this._onChooserChange.bind(this));
         this._pickerContent.subscribe('onCancel', this._onChooserClose.bind(this));
         // this._chooserControl.subscribe('onDateChange', function(eventObject, date) {
         //    self.setDate(date);
         //    self.hidePicker();
         // });
         return element;
      },

      _timeCreate: function(element) {
         this._pickerContent = new TimePicker({
            parent: this._picker,
            element: element,
            time: this.getDate()
         });
         this._pickerContent.subscribe('onChangeTime', this._onChangeTimeHandler.bind(this));
         return element;
      },

      _onChangeTimeHandler: function(event, time) {
         this.setDate(new Date(time));
      },

      _onChooserChange: function(event, date) {
         // DateRangeBigChoose не поддерживает ввод времени, по этому сохраняем время из даты текущего контрола
         if (date && this._lastDate) {
            date = new Date(date);
            date.setHours(this._lastDate.getHours());
            date.setMinutes(this._lastDate.getMinutes());
            date.setSeconds(this._lastDate.getSeconds());
            date.setMilliseconds(this._lastDate.getMilliseconds());
         }
         /**
          * Переведем активность обратно в контрол выбора даты,
          * чтобы корректно работали табы и события фокусов
          */
         this.setActive(true);
         this.setDate(date);
         this.hidePicker();
      },
      _onChooserClose: function(event) {
         /**
          * Переведем активность обратно в контрол выбора даты,
          * чтобы корректно работали табы и события фокусов
          */
         this.setActive(true);
         this.hidePicker();
      },

      /**
       * Проверить тип даты. Скрыть иконку календаря, если отсутствуют день, месяц и год (т.е. присутствует только время)
       * @private
       */
      _checkTypeOfMask: function (options) {
         var
            mask = options.mask,
            pickerName;
         if (/[DMY]/.test(mask)) {
            pickerName = 'calendar';
         } else if (mask === 'HH:II') {
            pickerName = 'time';
         }
         if (pickerName) {
            options._pickerName = pickerName;
         } else {
            options.pickerIconShow = false;
         }
         // Выпилить с опцией timePickerIconShow
         if (options._pickerName === 'time' && !options.timePickerIconShow) {
            options.pickerIconShow = false;
         }
      },

      setActive: function(active) {
         DatePicker.superclass.setActive.apply(this, arguments);
         if (active) {
            this._initFocusInHandler();
         }
      },

      _initFocusInHandler: function() {
         if (!this._onFocusInHandler) {
            this._onFocusInHandler = this._onFocusIn.bind(this);
            this.subscribeTo(EventBus.globalChannel(), 'onFocusIn', this._onFocusInHandler);
         }
      },

      _onFocusIn: function(event) {
         if (!isChildControl(this, event.getTarget())) {
            this._notify('onDateSelect');
            this.unsubscribeFrom(EventBus.globalChannel(), 'onFocusIn', this._onFocusInHandler);
            this._onFocusInHandler = null;
         }
      }
   });

   return DatePicker;
});
