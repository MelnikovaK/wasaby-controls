/**
 * Класс для хранения значений по объектным ключам. Обеспечивает манипуляции несколькими значениями по критериям, а также двойной доступ к
 * хранящимся значениям - по объектному клюбчу и по идентификатору. Объектные ключи всегда используются не по ссылке, а по значению
 *
 * @class SBIS3.CONTROLS.LongOperationsBunch
 * @public
 */
define('js!SBIS3.CONTROLS.LongOperationsBunch',
   [
      'Core/core-extend',
      'Core/core-merge'
   ],

   function (CoreExtend, coreMerge) {
      'use strict';

      /**
       * Класс для хранения значений по объектным ключам. Обеспечивает манипуляции несколькими значениями по критериям, а также двойной доступ к
       * хранящимся значениям - по объектному клюбчу и по идентификатору. Объектные ключи всегда используются не по ссылке, а по значению
       * @public
       * @type {SBIS3.CONTROLS.LongOperationsBunch}
       */
      var LongOperationsBunch = CoreExtend.extend(/** @lends SBIS3.CONTROLS.LongOperationsBunch.prototype */{
         _moduleName: 'SBIS3.CONTROLS.LongOperationsBunch',

         /**
          * Конструктор
          * @public
          */
         constructor: function LongOperationsBunch () {
            /**
             * Список ключей
             * @protected
             * @type {object}
             */
            this._keys = {};
            /**
             * Список хранящихся значений
             * @protected
             * @type {object}
             */
            this._values = {};
            /**
             * Счётчик идентификаторов
             * @protected
             * @type {number}
             */
            this._counter = 0;
         },

         /**
          * Установить значение. Возвращается идентификатор
          * @public
          * @param {object} key Ключ
          * @param {any} value Хранимое значение
          * @return {number}
          */
         set: function (key, value) {
            var id = this.getId(key) || ++this._counter;
            this._keys[id] = coreMerge({}, key, {clone:true});
            this._values[id] = value;
            return id;
         },

         /**
          * Получить хранящееся значение по ключу
          * @public
          * @param {object} key Ключ
          * @return {any}
          */
         get: function (key) {
            var id = this.getId(key);
            return id ? this._values[id] : undefined;
         },

         /**
          * Получить ключ по идентификатору
          * @public
          * @param {object} key Ключ
          * @return {number}
          */
         getId: function (key) {
            if (!key || typeof key !== 'object') {
               throw new TypeError('Argument "key" must be an object');
            }
            for (var id in this._keys) {
               if (_isEq(this._keys[id], key)) {
                  return +id;
               }
            }
         },

         /**
          * Получить хранящееся значение по идентификатору
          * @public
          * @param {number} id Идентификатор
          * @return {any}
          */
         getById: function (id) {
            if (typeof id !== 'number' || id <= 0) {
               throw new TypeError('Argument "id" must be positive number');
            }
            return this._values[id];
         },

         /**
          * Получить список хранящихся значений по списку ключей
          * @public
          * @param {object[]} keys Список ключей
          * @return {any[]}
          */
         list: function (keys) {
            if (!Array.isArray(keys)) {
               throw new TypeError('Argument "keys" must be an array');
            }
            return keys.map(this.get.bind(this));
         },

         /**
          * Получить список идентификаторов по списку ключей
          * @public
          * @param {object[]} keys Список ключей
          * @return {any[]}
          */
         listIds: function (keys) {
            if (!Array.isArray(keys)) {
               throw new TypeError('Argument "keys" must be an array');
            }
            return keys.map(this.getId.bind(this));
         },

         /**
          * Получить список хранящихся значений по списку идентификаторов
          * @public
          * @param {number[]} ids Список идентификаторов
          * @return {any[]}
          */
         listByIds: function (ids) {
            if (!Array.isArray(ids)) {
               throw new TypeError('Argument "ids" must be an array');
            }
            return ids.map(this.getById.bind(this));
         },

         /**
          * Найти хранящееся значения по заданным критериям
          * @public
          * @param {object} [pattern] Критерии поиска (опционально)
          * @param {number[]} [inIds] Искать только среди этих идентификаторов (опционально)
          * @return {any[]}
          */
         search: function (pattern, inIds) {
            if (pattern && typeof pattern !== 'object') {
               throw new TypeError('Argument "pattern" must be an object');
            }
            if (inIds && !(Array.isArray(inIds) && inIds.every(function (id) { return typeof id === 'number' && 0 < id; }))) {
               throw new TypeError('Argument "inIds" must be an array of numbers');
            }
            var values = [];
            var allKeys = !pattern;
            var allIds = !inIds;
            for (var id in this._keys) {
               if ((allIds || inIds.indexOf(+id) !== -1) && (allKeys || _isAgr(this._keys[id], pattern))) {
                  values.push(this._values[id]);
               }
            }
            return values;
         },

         /**
          * Найти идентификаторы по заданным критериям
          * @public
          * @param {object} [pattern] Критерии поиска (опционально)
          * @return {number[]}
          */
         searchIds: function (pattern) {
            if (pattern && typeof pattern !== 'object') {
               throw new TypeError('Argument "pattern" must be an object');
            }
            var ids = [];
            var allKeys = !pattern;
            for (var id in this._keys) {
               if (allKeys || _isAgr(this._keys[id], pattern)) {
                  ids.push(+id);
               }
            }
            return ids;
         },

         /**
          * Удалить хранящееся значение по ключу. Возвращается удалённое значение
          * @public
          * @param {object} key Ключ
          * @return {any}
          */
         remove: function (key) {
            var id = this.getId(key);
            if (id) {
               return _removeById(this, id);
            }
         },

         /**
          * Удалить хранящееся значение по ключу. Возвращается удалённое значение
          * @public
          * @param {number} id Идентификатор
          * @return {any}
          */
         removeById: function (id) {
            if (typeof id !== 'number' || id <= 0) {
               throw new TypeError('Argument "id" must be positive number');
            }
            if (id in this._keys) {
               return _removeById(this, id);
            }
         },

         /**
          * Удалить все найденные по заданным критериям хранящееся значения. Возвращается список удалённых значений
          * @public
          * @param {object} [pattern] Критерии поиска (опционально)
          * @param {number[]} [inIds] Искать только среди этих идентификаторов (опционально)
          * @return {any[]}
          */
         removeAll: function (pattern, inIds) {
            if (pattern && typeof pattern !== 'object') {
               throw new TypeError('Argument "pattern" must be an object');
            }
            if (inIds && !Array.isArray(inIds)) {
               throw new TypeError('Argument "inIds" must be an array');
            }
            if (inIds && !(Array.isArray(inIds) && inIds.every(function (id) { return typeof id === 'number' && 0 < id; }))) {
               throw new TypeError('Argument "inIds" must be an array of numbers');
            }
            var values = [];
            var allKeys = !pattern;
            var allIds = !inIds;
            for (var id in this._keys) {
               if ((allIds || inIds.indexOf(id) !== -1) && (allKeys || _isAgr(this._keys[id], pattern))) {
                  values.push(this._values[id]);
                  delete this._keys[id];
                  delete this._values[id];
               }
            }
            return values;
         }
      });



      /**
       * Удалить хранящееся значение по ключу. Возвращается удалённое значение
       * @protected
       * @param {SBIS3.CONTROLS.LongOperationsBunch} self Этот объект
       * @param {number} id Идентификатор
       * @return {any}
       */
      var _removeById = function (self, id) {
         var value = self._values[id];
         delete self._keys[id];
         delete self._values[id];
         return value;
      };

      /**
       * Проверить значение на соответсвие критериям
       * @protected
       * @param {any} tested Проверяемое значение
       * @param {object} pattern Критерии
       * @return {boolean}
       */
      var _isAgr = function (tested, pattern) {
         if (!tested || typeof tested !== 'object') {
            return false;
         }
         for (var n in pattern) {
            if (!(n in tested)) {
               return false;
            }
            var vt = tested[n];
            var vp = pattern[n];
            if (vp && typeof vp === 'object' ? !_isAgr(vt, vp) : !_isEq(vt, vp)) {
               return false;
            }
         }
         return true;
      };

      /**
       * Проверить на равенство два значения
       * @protected
       * @param {any} v1 Сравниваемое значение
       * @param {any} v2 Сравниваемое значение
       * @return {boolean}
       */
      var _isEq = function (v1, v2) {
         if (v1 == null && v2 == null) {
            return true;
         }
         if (!(v1 && typeof v1 === 'object' && v2 && typeof v2 === 'object')) {
            return v1 === v2;
         }
         if (Array.isArray(v1)) {
            if (!Array.isArray(v2) || v1.length !== v2.length) {
               return false;
            }
            for (var i = 0; i < v1.length; i++) {
               if (!_isEq(v1[i], v2[i])) {
                  return false;
               }
            }
         }
         else {
            if (Array.isArray(v2)) {
               return false;
            }
            var ns = Object.keys(v1);
            if (ns.length != Object.keys(v2).length) {
               return false;
            }
            for (var i = 0; i < ns.length; i++) {
               var n = ns[i];
               if (!_isEq(v1[n], v2[n])) {
                  return false;
               }
            }
         }
         return true;
      };



      return LongOperationsBunch;
   }
);
