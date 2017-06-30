define('js!SBIS3.CONTROLS.TimePicker',
   [
      'js!SBIS3.CONTROLS.CompoundControl',
      'tmpl!SBIS3.CONTROLS.TimePicker',
      'js!SBIS3.CONTROLS.TimePickerUtils',
      'js!SBIS3.CONTROLS.Utils.DateUtil',
      'js!SBIS3.CONTROLS.TimeHeader',
      'js!SBIS3.CONTROLS.ClockPicker',
      'css!SBIS3.CONTROLS.TimePicker'
   ],
   function(CompoundControl, dotTplFn, Utils, DateUtil) {

      'use strict';

      /**
       * Контрол представляющий из себя шапку часов, и часы с быстрым выбором значения часов или минут.
       *
       * @class SBIS3.CONTROLS.TimePicker
       * @extend SBIS3.CONTROLS.CompoundControl
       *
       * @initial
       * Пример инициализации контрола.
       * Результат: TimePicker с выбором минут, стрелкой показывающей на 17, шапкой со временем 20:17
       * и подсвеченным временем 17. При смене представления на hours(см. {@link setMode})
       * будет TimePicker с выбором часов, стрелкой показывающей на 20, и шапкой с подсвеченным временем 20.
       *
       * <ws:SBIS3.CONTROLS.TimePicker
       *    time="2017-10-20 20:17"
       *    mode="minutes"
       * />
       *
       * @control
       * @public
       * @author Крайнов Дмитрий Олегович
       */
      var TimePicker = CompoundControl.extend(/** @lends SBIS3.CONTROLS.TimePicker.prototype */{
         _dotTplFn: dotTplFn,

         $protected: {
            _options: {
               /**
                * @cfg {String|Date} Время.
                *
                * @example
                * Установить время 20:17.
                * <ol>
                *    <li>
                *       <ws:time>
                *          <ws:String>2017-10-20 20:17</ws:String>
                *       </ws:time>
                *    </li>
                *    <li>
                *       tmpl:
                *          <ws:time>{{myTime}}</ws:time>
                *       js:
                *          myTime = new Date("2017-10-20 20:17");
                *    </li>
                * </ol>
                *
                * @see getTime
                * @see setTime
                */
               time: new Date(),
               /**
                * @cfg {String} Текущий режим.
                * <ol>
                *    <li>Часы: hours.</li>
                *    <li>Минуты: minutes.</li>
                * </ol>
                *
                * @example
                * Установить режим minutes.
                * <pre>
                *    <ws:mode>
                *       <ws:String>minutes</ws:String>
                *    </ws:mode>
                * </pre>
                *
                * @see getMode
                * @see setMode
                */
               mode: 'hours'
            }
         },

         /**
          * @event onChangeTime Происходит после смены времени.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} time Текущее время.
          */

         /**
          * @event onChangeMode Происходит после смены режима.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {String} mode Текущий режим.
          */

         /**
          * @event onTimeSelect Происходит при окончании выбора времени.
          * @remark
          * Окончанием выбора времени является окончание работы со стрелкой выбора времени компонента {@link SBIS3.CONTROLS.ClockPicker}.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} time Время, которое установили.
          */
         $constructor: function() {
            this._publish('onChangeTime', 'onChangeMode', 'onTimeSelect');
         },

         init: function() {
            var time;
            TimePicker.superclass.init.call(this);

            //Найдем внутренние контролы
            this._body = this.getChildControlByName('body');

            this._body.subscribe('onTimeSelect', Utils._notifyTimeSelect.bind(this));

            this.getLinkedContext().setValueSelf('mode', this.getMode());

            time = this.getTime();
            time = DateUtil.valueToDate(time) || new Date();
            this.getLinkedContext().setValueSelf('time', {
               hours: time.getHours(),
               minutes: time.getMinutes()
            });

            this.getLinkedContext().subscribe('onFieldChange', this._fieldChangeHandler.bind(this));
         },

         getTime: function() {
            return this._options.time;
         },

         /**
          * Изменить установленное время.
          * @param {Date} time новое время
          * @public
          */
         setTime: function(time) {
            time = DateUtil.valueToDate(time) || new Date();

            Utils._setUtilOption.call(this, 'time', time);
            this.getLinkedContext().setValueSelf('time', {
               hours: time.getHours(),
               minutes: time.getMinutes()
            });
         },

         getMode: function() {
            return this._options.mode;
         },

         /**
          * Изменить режим.
          * @param {String} mode новый режим.
          * @public
          */
         setMode: function(mode) {
            Utils.setMode.call(this, mode);
            this.getLinkedContext().setValueSelf('mode', mode);
         },

         hide: function() {
            TimePicker.superclass.hide.call(this);
            this._body.hide();
         },

         show: function() {
            TimePicker.superclass.show.call(this);
            // Всегда открываемся в режиме часов.
            this.setMode('hours');
            this._body.show();
         },

         _fieldChangeHandler: function(wsEvent, name, value) {
            switch (name) {
               case 'mode':
                  Utils.setMode.call(this, value);
                  break;
               case 'time':
                  var time = this.getTime();

                  time.setHours(value.hours);
                  time.setMinutes(value.minutes);

                  Utils._setUtilOption.call(this, 'time', time);
                  break;
            }
         },

         destroy: function() {
            this._body.unsubscribe('onTimeSelect', Utils._notifyTimeSelect);
            this.getLinkedContext().unsubscribe('onFieldChange', this._fieldChangeHandler);

            TimePicker.superclass.destroy.call(this);
         }
      });

      return TimePicker;
   }
);