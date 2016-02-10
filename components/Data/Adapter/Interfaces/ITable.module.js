/* global define */
define('js!SBIS3.CONTROLS.Data.Adapter.ITable', [], function () {
   'use strict';

   /**
    * Интерфейс адаптера для таблицы данных
    * @mixin SBIS3.CONTROLS.Data.Adapter.ITable
    * @public
    * @author Мальцев Алексей
    */

   return /** @lends SBIS3.CONTROLS.Data.Adapter.ITable.prototype */{
      /**
       * Возвращает пустую таблицу
       * @returns {*}
       */
      getEmpty: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает кол-во записей таблицы
       * @returns {Number}
       */
      getCount: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает данные таблицы в формате адаптера
       * @returns {*}
       */
      getData: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Добавляет запись в таблицу
       * @param {*} record Запись
       * @param {Number} [at] Позиция, в которую добавляется запись (по умолчанию - в конец)
       */
      add: function (record, at) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает запись по позиции
       * @param {Number} index Позиция
       * @returns {*} Запись таблицы
       */
      at: function (index) {
         throw new Error('Method must be implemented');
      },

      /**
       * Удаляет запись по позиции
       * @param {Number} at Позиция записи
       */
      remove: function (at) {
         throw new Error('Method must be implemented');
      },

      /**
       * Заменяет запись
       * @param {*} record Заменяющая запись
       * @param {Number} at Позиция, в которой будет произведена замена
       */
      replace: function (record, at) {
         throw new Error('Method must be implemented');
      },

      /**
       * Перемещает запись
       * @param {Number} source Позиция, откуда перемещаем
       * @param {Number} target Позиция, в позицию которую перемещаем
       * @returns {*}
       */
      move: function(source, target) {
         throw new Error('Method must be implemented');
      },

      /**
       * Объединяет две записи
       * @param {Number} acceptor Позиция принимающей записи
       * @param {Number} donor Позиция записи-донора
       * @param {String} idProperty  Название поля содержащего первичный ключ
       * @returns {*}
       */
      merge: function(acceptor, donor, idProperty) {
         throw new Error('Method must be implemented');
      },

      /**
       * Копирует запись по позиции
       * @param {Number} index Позиция, которая будет скопирована
       * @returns {*}
       */
      copy: function(index) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает формат поля (в режиме только для чтения)
       * @param {String} name Поле записи
       * @returns {SBIS3.CONTROLS.Data.Format.Field}
       */
      getFormat: function (name) {
         throw new Error('Method must be implemented');
      },

      /**
       * Добавляет поле в таблицу.
       * Если позиция не указана (или указана как -1), поле добавляется в конец.
       * Если поле с таким форматом уже есть, генерирует исключение.
       * @param {SBIS3.CONTROLS.Data.Format.Field} format Формат поля
       * @param {Number} [at] Позиция поля
       */
      addField: function(format, at) {
         throw new Error('Method must be implemented');
      },

      /**
       * Удаляет поле из таблицы по имени.
       * @param {String} name Имя поля
       */
      removeField: function(name) {
         throw new Error('Method must be implemented');
      },

      /**
       * Удаляет поле из таблицы по позиции.
       * Если позиция выходит за рамки допустимого индекса, генерирует исключение.
       * @param {String} index Позиция поля
       */
      removeFieldAt: function(index) {
         throw new Error('Method must be implemented');
      }
   };
});
