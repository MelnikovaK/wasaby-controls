/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Source.DataSet', [
   'js!SBIS3.CONTROLS.Data.Di',
   'js!SBIS3.CONTROLS.Data.Model',
   'js!SBIS3.CONTROLS.Data.Collection.RecordSet'
], function (Di) {
   'use strict';

   /**
    * Набор данных, полученный из источника
    * @class SBIS3.CONTROLS.Data.Source.DataSet
    * @public
    * @author Мальцев Алексей
    */

   var DataSet = $ws.core.extend({}, /** @lends SBIS3.CONTROLS.Data.Source.DataSet.prototype */{
      _moduleName: 'SBIS3.CONTROLS.Data.Source.DataSet',
      $protected: {
         _options: {
            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Source.ISource} Источник, из которого получены данные
             * @see getSource
             * @see SBIS3.CONTROLS.Data.Source.ISource
             */
            source: null,

            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} Адаптер для работы с данными, по умолчанию {@link SBIS3.CONTROLS.Data.Adapter.Json}
             * @see getAdapter
             * @see SBIS3.CONTROLS.Data.Adapter.IAdapter
             * @see SBIS3.CONTROLS.Data.Di
             */
            adapter: 'adapter.json',

            /**
             * @cfg {String} Сырые данные, выданные источником
             * @see getRawData
             * @see setRawData
             */
            rawData: null,

            /**
             * @cfg {String|Function} Конструктор модели, по умолчанию {@link SBIS3.CONTROLS.Data.Model}
             * @see getModel
             * @see setModel
             * @see SBIS3.CONTROLS.Data.Model
             * @see SBIS3.CONTROLS.Data.Di
             */
            model: 'model',

            /**
             * @cfg {String|Function} Конструктор списка моделей, по умолчанию {@link SBIS3.CONTROLS.Data.Collection.RecordSet}
             * @see getListModule
             * @see setListModule
             * @see SBIS3.CONTROLS.Data.Collection.RecordSet
             * @see SBIS3.CONTROLS.Data.Di
             */
            listModule: 'collection.recordset',

            /**
             * @cfg {String} Поле модели, содержащее первичный ключ
             * @see getIdProperty
             * @see setIdProperty
             * @see SBIS3.CONTROLS.Data.Model#idProperty
             */
            idProperty: '',

            /**
             * @cfg {String} Свойство данных, в которых находится выборка
             * @see getItemsProperty
             * @see setItemsProperty
             */
            itemsProperty: '',

            /**
             * @cfg {String} Свойство данных, в которых находится общее число элементов выборки
             * @see getTotalProperty
             * @see setTotalProperty
             */
            totalProperty: ''
         }
      },

      $constructor: function (cfg) {
         cfg = cfg || {};
         if ('data' in cfg && !('rawData' in cfg)) {
            this._options.rawData = cfg.data;
            $ws.single.ioc.resolve('ILogger').info('SBIS3.CONTROLS.Data.Source.DataSet', 'option "data" is deprecated and will be removed in 3.7.4. Use "rawData" instead.');
         }
      },

      //region Public methods

      /**
       * Возвращает источник, из которого получены данные
       * @returns {String|SBIS3.CONTROLS.Data.Source.ISource}
       * @see source
       * @see SBIS3.CONTROLS.Data.Source.ISource
       */
      getSource: function () {
         if (typeof this._options.source === 'string') {
            this._options.source = Di.resolve(this._options.source);
         }
         return this._options.source;
      },

      /**
       * Возвращает адаптер для работы с данными
       * @returns {String|SBIS3.CONTROLS.Data.Adapter.IAdapter}
       * @see adapter
       * @see SBIS3.CONTROLS.Data.Adapter.IAdapter
       */
      getAdapter: function () {
         if (typeof this._options.adapter === 'string') {
            this._options.adapter = Di.resolve(this._options.adapter);
         }
         return this._options.adapter;
      },

      /**
       * Возвращает конструктор модели
       * @returns {String|Function}
       * @see model
       * @see setModel
       * @see SBIS3.CONTROLS.Data.Model
       * @see SBIS3.CONTROLS.Data.Di
       */
      getModel: function () {
         return this._options.model;
      },

      /**
       * Устанавливает конструктор модели
       * @param {String|Function} model
       * @see model
       * @see getModel
       * @see SBIS3.CONTROLS.Data.Model
       * @see SBIS3.CONTROLS.Data.Di
       */
      setModel: function (model) {
         this._options.model = model;
      },

      /**
       * Возвращает конструктор списка моделей
       * @returns {String|Function}
       * @see setListModule
       * @see listModule
       * @see SBIS3.CONTROLS.Data.Di
       */
      getListModule: function () {
         return this._options.listModule;
      },

      /**
       * Устанавливает конструктор списка моделей
       * @param {String|Function} listModule
       * @see getListModule
       * @see listModule
       * @see SBIS3.CONTROLS.Data.Di
       */
      setListModule: function (listModule) {
         this._options.listModule = listModule;
      },

      /**
       * Возвращает свойство модели, содержащее первичный ключ
       * @returns {String}
       * @see setIdProperty
       * @see idProperty
       * @see SBIS3.CONTROLS.Data.Model#idProperty
       */
      getIdProperty: function () {
         return this._options.idProperty;
      },

      /**
       * Устанавливает свойство модели, содержащее первичный ключ
       * @param {String} name
       * @see getIdProperty
       * @see idProperty
       * @see SBIS3.CONTROLS.Data.Model#idProperty
       */
      setIdProperty: function (name) {
         this._options.idProperty = name;
      },

      /**
       * Возвращает свойство данных, в которых находится выборка
       * @returns {String}
       * @see setItemsProperty
       * @see itemsProperty
       */
      getItemsProperty: function () {
         return this._options.itemsProperty;
      },

      /**
       * Устанавливает свойство данных, в которых находится выборка
       * @param {String} name
       * @see getItemsProperty
       * @see itemsProperty
       */
      setItemsProperty: function (name) {
         this._options.itemsProperty = name;
      },

      /**
       * Возвращает свойство данных, в которых находится выборка
       * @returns {String}
       * @see setTotalProperty
       * @see totalProperty
       */
      getTotalProperty: function () {
         return this._options.totalProperty;
      },

      /**
       * Устанавливает свойство данных, в которых находится выборка
       * @param {String} name
       * @see getTotalProperty
       * @see totalProperty
       */
      setTotalProperty: function (name) {
         this._options.totalProperty = name;
      },

      /**
       * Возвращает выборку
       * @param {String} [property] Свойство данных, в которых находятся элементы выборки. Если не указывать, вернется основная выборка.
       * @returns {SBIS3.CONTROLS.Data.Collection.RecordSet}
       * @see itemsProperty
       */
      getAll: function (property) {
         this._checkAdapter();
         if (property === undefined) {
            property = this._options.itemsProperty;
         }

         var data =  this._getDataProperty(property),
            items = Di.resolve(this._options.listModule, {
               rawData: data,
               adapter: this._options.adapter,
               model: this._options.model,
               idProperty: this._options.idProperty
            });

         if (!items && !$ws.helpers.instanceOfModule(items, 'SBIS3.CONTROLS.Data.Collection.RecordSet')) {
            throw new TypeError('SBIS3.CONTROLS.Data.Source.DataSet::getAll(): listModule should extend SBIS3.CONTROLS.Data.Collection.RecordSet');
         }
         return items;
      },

      /**
       * Возвращает общее число элементов выборки
       * @param {String} [property] Свойство данных, в которых находится общее число элементов выборки
       * @returns {*}
       * @see totalProperty
       */
      getTotal: function (property) {
         if (property === undefined) {
            property = this._options.totalProperty;
         }
         return this._getDataProperty(property);
      },

      /**
       * Возвращает модель
       * @param {String} [property] Свойство данных, в которых находится модель
       * @returns {SBIS3.CONTROLS.Data.Model|undefined}
       * @see itemsProperty
       */
      getRow: function (property) {
         this._checkAdapter();
         if (property === undefined) {
            property = this._options.itemsProperty;
         }
         var data = this._getDataProperty(property),
            adapter = this.getAdapter().forTable(data),
            type = this.getAdapter().getProperty(data, '_type');
         if (type === 'recordset') {
            if (adapter.getCount() > 0) {
               return this._getModelInstance(
                  adapter.at(0)
               );
            }
         } else {
            return this._getModelInstance(
               data
            );
         }

         return undefined;
      },

      /**
       * Возвращает значение
       * @param {String} [property] Свойство данных, в которых находится значение
       * @returns {*}
       * @see itemsProperty
       */
      getScalar: function (property) {
         if (property === undefined) {
            property = this._options.itemsProperty;
         }
         return this._getDataProperty(property);
      },

      /**
       * Проверяет наличие свойства в данных
       * @param {String} property Свойство
       * @returns {Boolean}
       * @see getProperty
       */
      hasProperty: function (property) {
         return this._getDataProperty(property) !== undefined;
      },

      /**
       * Возвращает значение свойства в данных
       * @param {String} property Свойство
       * @returns {*}
       * @see hasProperty
       */
      getProperty: function (property) {
         return this._getDataProperty(property);
      },

      /**
       * Возвращает сырые данные
       * @returns {Object}
       * @see setRawData
       * @see rawData
       */
      getRawData: function() {
         return this._options.rawData;
      },

      /**
       * Устанавливает сырые данные
       * @param rawData {Object} Сырые данные
       * @see getRawData
       * @see rawData
       */
      setRawData: function(rawData) {
         this._options.rawData = rawData;
      },

      //endregion Public methods

      //region Protected methods

      /**
       * Возвращает свойство данных
       * @param {String} property Свойство
       * @returns {*}
       * @private
       */
      _getDataProperty: function (property) {
         this._checkAdapter();
         return property ?
            this.getAdapter().getProperty(this._options.rawData, property) :
            this._options.rawData;
      },

      /**
       * Возвращает инстанс модели
       * @param {*} rawData Данные модели
       * @returns {Function}
       * @private
       */
      _getModelInstance: function (rawData) {
         if (!this._options.model) {
            throw new Error('Model is not defined');
         }
         return Di.resolve(this._options.model, {
            rawData: rawData,
            adapter: this._options.adapter
         });
      },

      /**
       * Проверят наличие адаптера
       * @private
       */
      _checkAdapter: function () {
         if (!this.getAdapter()) {
            throw new Error('Adapter is not defined');
         }
      }

      //endregion Protected methods

   });

   Di.register('source.dataset', DataSet);

   return DataSet;
});
