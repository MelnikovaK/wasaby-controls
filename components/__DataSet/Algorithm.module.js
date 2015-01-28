/**
 * Created by as.manuylov on 10.11.14.
 */
define('js!SBIS3.CONTROLS.Algorithm', ['js!SBIS3.CONTROLS.Record'], function (Record) {
   'use strict';

   /**
    * Набор алгоритмом для работы с данными
    */

   var _ = {

      /**
       * Хэлепр обхода (пока только по DataSource)
       * @param {Object} object объект по которому производится обход
       * @param {function} iterateCallback пользовательская функция обратного вызова
       * @param context контекст
       */
      each: function (object, iterateCallback, context) {
         // для быстроты создаем запись только один раз
         var record = new Record(object.getStrategy());
         object.getStrategy().each(object.getRawData(), function (rawRow) {
            // устанавливаем разные исходные данные
            record.setRaw(rawRow);
            iterateCallback.call(context, record);
         });
      }

   };

   return _;
});