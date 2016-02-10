/* global define */
define('js!SBIS3.CONTROLS.Data.Adapter.IAdapter', [], function () {
   'use strict';

   /**
    * Интерфейс адаптера, осуществляющиего операции с "сырыми" данными
    * @mixin SBIS3.CONTROLS.Data.Adapter.IAdapter
    * @public
    * @author Мальцев Алексей
    */

   return /** @lends SBIS3.CONTROLS.Data.Adapter.IAdapter.prototype */{
      /**
       * Возвращает интерфейс доступа к данным в виде таблицы
       * @param {*} data Сырые данные
       * @returns {SBIS3.CONTROLS.Data.Adapter.ITable}
       */
      forTable: function (data) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает интерфейс доступа к данным в виде записи
       * @param {*} data Сырые данные
       * @returns {SBIS3.CONTROLS.Data.Adapter.IRecord}
       */
      forRecord: function (data) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает название поля, которое является первичным ключем
       * @param {*} data Сырые данные
       * @returns {String}
       */
      getKeyField: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает значение свойства
       * @param {*} data Сырые данные
       * @param {String} property Название свойства
       * @returns {*}
       */
      getProperty: function (data, property) {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает значение свойства
       * @param {*} data Сырые данные
       * @param {String} property Название свойства
       * @param {*} value Значение свойства
       */
      setProperty: function (data, property, value) {
         throw new Error('Method must be implemented');
      },

      /**
       * Сериализует данные - переводит из внешнего формата в формат адаптера
       * @param {*} data Сериализуемые данные
       * @returns {Object} Сериализованные данные
       * @static
       */
      serialize: function (data) {
         throw new Error('Method must be implemented');
      }
   };
});
