define('Controls/Calendar/interface/IMonth', [
   'WS.Data/Type/descriptor',
], function(types) {
   'use strict';

   /**
    * Интерфейс контролов отображающих месяц
    * mixin Controls/Calendar/interface/IMonth
    */

   return {
      getDefaultOptions: function() {
         return {

            /**
             * @name Controls/Calendar/interface/IMonth#month
             * @cfg {Date|String} Месяц с которого откроется календарь
             * @remark
             * Строка должна быть формата ISO 8601.
             * Дата игнорируется.
             * @example
             * <pre class="brush:xml">
             *     <option name="month">2015-03-07T21:00:00.000Z</option>
             * </pre>
             */
            month: null,

            /**
             * @name Controls/Calendar/interface/IMonth#showCaption
             * @cfg {String} Тип заголовка "text"|null
             */
            showCaption: false,

            /**
             * @name Controls/Calendar/interface/IMonth#captionFormat
             * @cfg {String} Формат заголовка
             * @remark
             * Строка должна быть в формате поддерживаемым Date.strftime.
             */
            captionFormat: '%B, %Y',

            /**
             * @name Controls/Calendar/interface/IMonth#showWeekdays
             *  @cfg {Boolean} Если true, то дни недели отображаются
             */
            showWeekdays: true,

            /**
             * @name Controls/Calendar/interface/IMonth#dayFormatter
             * @cfg {Function} Возможность поменять конфигурацию для дня. В функцию приходит объект даты. Опция необходима для производственных каледнадрей.
             */
            dayFormatter: undefined,
         };
      },


      getOptionTypes: function() {
         return {

            // month: types(Date),
            showCaption: types(Boolean),
            captionFormat: types(String),
            showWeekdays: types(Boolean),
            dayFormatter: types(Function)
         };
      }
   };
});
