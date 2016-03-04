/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Format.Format', [
   'js!SBIS3.CONTROLS.Data.Collection.List',
   'js!SBIS3.CONTROLS.Data.Serializer'
], function (List, Serializer) {
   'use strict';

   /**
    * Формат полей
    * @class SBIS3.CONTROLS.Data.Format.Format
    * @extends SBIS3.CONTROLS.Data.Collection.List
    * @public
    * @author Мальцев Алексей
    */

   var Format = List.extend(/** @lends SBIS3.CONTROLS.Data.Format.Format.prototype */{
      _moduleName: 'SBIS3.CONTROLS.Data.Format.Format',
      $protected: {
         _options: {
            /**
             * @cfg {Array.<SBIS3.CONTROLS.Data.Format.Field>} Элементы списка
             * @name SBIS3.CONTROLS.Data.Format.Format#items
             */
         },

         /**
          * @member {Array.<SBIS3.CONTROLS.Data.Format.Field>} Элементы списка
          */
         _items: []
      },

      $constructor: function () {
         for (var i = 0, len = this._items.length; i < len; i++) {
            this._checkItem(this._items[i]);
            this._checkName(this._items[i], i);
         }
      },

      //region SBIS3.CONTROLS.Data.Collection.List

      add: function (item, at) {
         this._checkItem(item);
         this._checkName(item);
         Format.superclass.add.apply(this, arguments);
      },

      remove: function (item) {
         this._checkItem(item);
         return Format.superclass.remove.apply(this, arguments);
      },

      replace: function (item, at) {
         this._checkItem(item);
         this._checkName(item, at);
         Format.superclass.replace.apply(this, arguments);
      },

      assign: function (items) {
         var i, len;
         items = this._itemsToArray(items);
         for (i = 0, len = items.length; i < len; i++) {
            this._checkItem(items[i]);
         }
         Format.superclass.assign.call(this, items);
         for (i = 0, len = this._items.length; i < len; i++) {
            this._checkName(this._items[i], i);
         }
      },

      append: function (items) {
         items = this._itemsToArray(items);
         for (var i = 0, len = items.length; i < len; i++) {
            this._checkItem(items[i]);
            this._checkName(items[i]);
         }
         Format.superclass.append.call(this, items);
      },

      prepend: function (items) {
         items = this._itemsToArray(items);
         for (var i = 0, len = items.length; i < len; i++) {
            this._checkItem(items[i]);
            this._checkName(items[i]);
         }
         Format.superclass.prepend.call(this, items);
      },

      //endregion SBIS3.CONTROLS.Data.Collection.List

      // region SBIS3.CONTROLS.Data.SerializableMixin
      // endregion SBIS3.CONTROLS.Data.SerializableMixin

      //region Public methods

      /**
       * Удаляет поле из формата по имени.
       * Если поля с таким именем нет, генерирует исключение.
       * @param {String} name Имя поля
       */
      removeField: function (name) {
         var index = this.getIndexByValue('name', name);
         if (index === -1) {
            throw new ReferenceError(this._moduleName + '::removeField(): field "' + name + '" is not found');
         }
         this.removeAt(index);
      },

      /**
       * Возвращает индекс поля по его имени.
       * Если поля с таким именем нет, возвращает -1.
       * @param {String} name Имя поля
       * @returns {Number}
       */
      getFieldndex: function (name) {
         return this.getIndexByValue('name', name);
      },

      /**
       * Возвращает имя поля по его индексу.
       * Если индекс выходит за допустимый диапазон, генерирует исключение.
       * @param {Number} at Имя поля
       * @returns {String}
       */
      getFieldName: function (at) {
         return this.at(at).getName();
      },

      /**
       * Клонирует формат
       * @returns {SBIS3.CONTROLS.Data.Format.Format}
       */
      clone: function() {
         var serializer = new Serializer();
         return JSON.parse(
            JSON.stringify(this, serializer.serialize),
            serializer.deserialize
         );
      },

      //endregion Public methods

      //region Protected methods

      /**
       * Проверяет, что переданный элемент - формат поля
       * @protected
       */
      _checkItem: function (item) {
         if(!item || !$ws.helpers.instanceOfModule(item, 'SBIS3.CONTROLS.Data.Format.Field')) {
            throw new TypeError('Item should be an instance of SBIS3.CONTROLS.Data.Format.Field');
         }
      },

      /**
       * Проверяет, что формат поля не дублирует уже существующее имя поля
       * @protected
       */
      _checkName: function (item, at) {
         var exists = this.getFieldndex(item.getName());
         if(exists > -1 && exists !== at) {
            throw new ReferenceError(this._moduleName + ': field with name "' + item.getName() + '" already exists');
         }
      }

      //endregion Protected methods

   });

   return Format;
});
