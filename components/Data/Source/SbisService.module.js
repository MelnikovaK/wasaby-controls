/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Source.SbisService', [
   'js!SBIS3.CONTROLS.Data.Source.Rpc',
   'js!SBIS3.CONTROLS.Data.Source.DataSet',
   'js!SBIS3.CONTROLS.Data.Query.Query',
   'js!SBIS3.CONTROLS.Data.Di',
   'js!SBIS3.CONTROLS.Data.Adapter.Sbis',
   'js!SBIS3.CONTROLS.Data.Source.Provider.SbisBusinessLogic'
], function (Rpc, DataSet, Query, Di) {
   'use strict';

   /**
    * Источник данных на сервисах БЛ СБиС
    * @class SBIS3.CONTROLS.Data.Source.SbisService
    * @extends SBIS3.CONTROLS.Data.Source.Rpc
    * @public
    * @ignoreMethods prepareQueryParams
    * @author Мальцев Алексей
    * @example
    * <pre>
    *    var dataSource = new SbisService({
    *       endpoint: 'СообщениеОтКлиента',
    *    });
    * </pre>
    * <pre>
    *    var dataSource = new SbisService({
    *       endpoint: 'СообщениеОтКлиента',
    *       binding: {
    *          read: 'Прочитать',
    *          query: 'СписокОбщий',
    *          format: 'Список'
    *       }
    *       idProperty: '@СообщениеОтКлиента'
    *    });
    * </pre>
    */

   var SbisService = Rpc.extend(/** @lends SBIS3.CONTROLS.Data.Source.SbisService.prototype */{
      /**
       * @typedef {Object} Binding
       * @property {String} [create=Создать Имя метода для создания записи через {@link create}
       * @property {String} [read=Прочитать] Имя метода для чтения записи через {@link read}
       * @property {String} [update=Записать] Имя метода для обновления записи через {@link update}
       * @property {String} [destroy=Удалить] Имя метода для удаления записи через {@link destroy}
       * @property {String} [query=Список] Имя метода для получения списка записей через {@link query}
       * @property {String} [copy=Копировать] Имя метода для копирования записей через {@link copy}
       * @property {String} [merge=Объединить] Имя метода для объединения записей через {@link merge}
       * @property {String} [format] Имя метода для получения формата записи через {@link create}, {@link read} и {@link copy}. Метод должен быть декларативным.
       */

      _moduleName: 'SBIS3.CONTROLS.Data.Source.SbisService',
      $protected: {
         _options: {
            /**
             * @cfg {Endpoint|String} Конечная точка, обеспечивающая доступ клиента к функциональным возможностям источника данных
             * @see getEndPoint
             * @example
             * <pre>
             *    var dataSource = new SbisService({
             *       endpoint: 'Сотрудник'
             *    });
             * </pre>
             * @example
             * <pre>
             *    var dataSource = new SbisService({
             *       endpoint: {
             *          address: '/service/',
             *          contract: 'Сотрудник'
             *       }
             *    });
             * </pre>
             */
            endpoint: {},

            /**
             * @cfg {Binding} Соответствие методов CRUD+ методам БЛ.
             * @see getBinding
             * @see setBinding
             * @see create
             * @see read
             * @see destroy
             * @see query
             * @see copy
             * @see merge
             * @example
             * <pre>
             *    var dataSource = new SbisService({
             *       endpoint: 'Сотрудник',
             *       binding: {
             *          create: 'МойМетодСоздать',
             *          read: 'МойМетодПрочитать',
             *          update: 'МойМетодЗаписать',
             *          destroy: 'МойМетодУдалить'
             *       }
             *    });
             * </pre>
             */
            binding: {
               create: 'Создать',
               read: 'Прочитать',
               update: 'Записать',
               destroy: 'Удалить',
               query: 'Список',
               copy: 'Копировать',
               merge: 'Объединить'
            },

            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} Адаптер для работы с данными, по умолчанию {@link SBIS3.CONTROLS.Data.Adapter.Sbis}
             * @see SBIS3.CONTROLS.Data.Source.ISource#adapter
             * @see getAdapter
             * @see setAdapter
             * @see SBIS3.CONTROLS.Data.Adapter.Sbis
             * @see SBIS3.CONTROLS.Data.Di
             */
            adapter: 'adapter.sbis',

            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Source.Provider.IRpc} Объект, реализующий сетевой протокол для обмена в режиме клиент-сервер, по умолчанию {@link SBIS3.CONTROLS.Data.Source.Provider.SbisBusinessLogic}
             * @see SBIS3.CONTROLS.Data.Source.Rpc#provider
             * @see getProvider
             * @see SBIS3.CONTROLS.Data.Di
             * @example
             * <pre>
             *    var dataSource = new SbisService({
             *       endpoint: 'Сотрудник',
             *       provider: 'source.provider.sbis-plugin'
             *    });
             * </pre>
             * @example
             * <pre>
             *    var dataSource = new SbisService({
             *       endpoint: 'Сотрудник',
             *       provider: new SbisPluginProvider()
             *    });
             * </pre>
             */
            provider: 'source.provider.sbis-business-logic'
         },

         /**
          * @var {SBIS3.CONTROLS.Data.Source.Provider.SbisBusinessLogic} Объект, который умеет ходить на бизнес-логику, для смены порядковых номеров
          */
         _orderProvider: undefined
      },

      $constructor: function(cfg) {
         cfg = cfg || {};
         //Deprecated
         if ('strategy' in cfg && !('adapter' in cfg)) {
            this._options.adapter = cfg.strategy;
            $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'option "strategy" is deprecated and will be removed in 3.7.4. Use "adapter" instead.');
         }
         if ('keyField' in cfg && !('idProperty' in cfg)) {
            this._options.idProperty = cfg.keyField;
            $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'option "keyField" is deprecated and will be removed in 3.7.4. Use "idProperty" instead.');
         }
         if (!('endpoint' in cfg)) {
            if ('service' in cfg && typeof cfg.service === 'string' && !('resource' in cfg)) {
               $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'Option "service" is deprecated and will be removed in 3.7.4. Use "endpoint.contract" instead.');
               this._options.endpoint.contract = cfg.service;
            }
            if ('service' in cfg && typeof cfg.service === 'object') {
               $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'Option "service" is deprecated and will be removed in 3.7.4. Use "endpoint.contract" and "endpoint.address" instead.');
               this._options.endpoint.contract = cfg.service.name || '';
               this._options.endpoint.address = cfg.service.serviceUrl || undefined;
            }
            if ('resource' in cfg && typeof cfg.resource === 'object') {
               $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'Option "resource" is deprecated and will be removed in 3.7.4. Use "endpoint.contract" and "endpoint.address" instead.');
               this._options.endpoint.address = cfg.resource.serviceUrl || '';
               this._options.endpoint.contract = cfg.resource.name || '';
            }
         }
         if (!('binding' in cfg)) {
            if ('formatMethodName' in cfg) {
               $ws.single.ioc.resolve('ILogger').info(this._moduleName + '::$constructor()', 'Option "formatMethodName" is deprecated and will be removed in 3.7.4. Use "binding.format" instead.');
               this._options.binding.format = cfg.formatMethodName;
            }
         }
      },

      //region SBIS3.CONTROLS.Data.Source.ISource

      /**
       * Создает пустую модель через источник данных
       * @param {Object|SBIS3.CONTROLS.Data.Model} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Model}.
       * @see SBIS3.CONTROLS.Data.Source.ISource#create
       * @example
       * <pre>
       *     var dataSource = new SbisService({
       *        endpoint: 'Сотрудник'
       *     });
       *     dataSource.create().addCallback(function(model) {
       *         var name = model.get('Имя');
       *     });
       * </pre>
       * @example
       * <pre>
       *     var dataSource = new SbisService({
       *        endpoint: 'Сотрудник',
       *        binding: {
       *           format: 'СписокДляПрочитать'
    *           }
       *     });
       *     dataSource.create().addCallback(function(model) {
       *         var name = model.get('Имя');
       *     });
       * </pre>
       */
      create: function(meta) {
         //TODO: вместо 'ИмяМетода' может передаваться 'Расширение'
         if (meta === undefined) {
            meta = {
               'ВызовИзБраузера': true
            };
         }
         var adapter = this.getAdapter(),
            args = {
               'Фильтр': this._buildRecord(meta),
               'ИмяМетода': this._options.binding.format || null
            };

         return this.getProvider().call(
            this._options.binding.create,
            adapter.serialize(args)
         ).addCallbacks((function (data) {
            return this._getModelInstance(data);
         }).bind(this), function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::create()', error);
            return new Error('Cannot invoke create method');
         });
      },

      /**
       * Читает модель из источника данных
       * @param {String} key Первичный ключ модели
       * @param {Object|SBIS3.CONTROLS.Data.Model} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Model}.
       * @see SBIS3.CONTROLS.Data.Source.ISource#read
       */
      read: function(key, meta) {
         var adapter = this.getAdapter(),
            args = {
               'ИдО': key,
               'ИмяМетода': this._options.binding.format || null
            };
         if (meta && !Object.isEmpty(meta)) {
            args['ДопПоля'] = meta;
         }

         return this.getProvider().call(
            this._options.binding.read,
            adapter.serialize(args)
         ).addCallbacks((function (data) {
            var model = this._getModelInstance(data, true);
            model.setStored(true);
            return model;
         }).bind(this), function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::read()', error);
            return error;
         });
      },

      /**
       * Обновляет модель в источнике данных
       * @param {SBIS3.CONTROLS.Data.Model} model Обновляемая модель
       * @param {Object|SBIS3.CONTROLS.Data.Model} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       * @see SBIS3.CONTROLS.Data.Source.ISource#update
       */
      update: function(model, meta) {
         var adapter = this.getAdapter(),
            args = {
               'Запись': model
            };
         if (meta && !Object.isEmpty(meta)) {
            args['ДопПоля'] = meta;
         }

         return this.getProvider().call(
            this._options.binding.update,
            adapter.serialize(args)
         ).addCallbacks((function (key) {
            if (key && !model.isStored() && this.getIdProperty()) {
               model.set(this.getIdProperty(), key);
            }
            model.setStored(true);
            model.applyChanges();
            return key;
         }).bind(this), function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::update()', error);
            return error;
         });
      },

      /**
       * Удаляет модель из источника данных
       * @param {String|Array} keys Первичный ключ, или массив первичных ключей модели
       * @param {Object|SBIS3.CONTROLS.Data.Model} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       * @see SBIS3.CONTROLS.Data.Source.ISource#destroy
       */
      destroy: function(keys, meta) {
         if ($ws.helpers.type(keys) !== 'array') {
            keys = [keys];
         }
         /*В ключе может содержаться ссылка на объект бл
          сгруппируем ключи по соответсвующим им объектам*/
         var groups = {},
            providerName;
         for (var i = 0, len = keys.length; i < len; i++) {
            providerName = this._getProviderNameById(keys[i]);
            groups[providerName] = groups[providerName] || [];
            groups[providerName].push(String.prototype.split.call(keys[i],',')[0]);
         }
         var pd = new $ws.proto.ParallelDeferred();
         for (providerName in groups) {
            if (groups.hasOwnProperty(providerName)) {
               pd.push(this._destroy(
                  groups[providerName],
                  providerName,
                  meta
               ));
            }
         }
         return pd.done().getResult();
      },

      merge: function(first, second) {
         var adapter = this.getAdapter();

         return this.getProvider().call(
            this._options.binding.merge,
            adapter.serialize({
               'ИдО' : first,
               'ИдОУд': second
            })
         ).addCallbacks(function (res) {
               return res;
            }, function (error) {
               $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::merge()', error);
               return error;
            });
      },

      copy: function(key, meta) {
         var adapter = this.getAdapter(),
            args = {
               'ИдО': key,
               'ИмяМетода': this._options.binding.format
            };
         if (meta && !Object.isEmpty(meta)) {
            args['ДопПоля'] = meta;
         }

         return this.getProvider().call(
            this._options.binding.copy,
            adapter.serialize(args)
         ).addCallbacks(function (res) {
               return res;
            }, function (error) {
               $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::copy()', error);
               return error;
            });
      },

      query: function(query) {
         var adapter = this.getAdapter(),
            args = {
               'Фильтр': this._buildRecord(query ? query.getWhere() : null),
               'Сортировка': this._buildRecordSet(this._getSortingParams(query)),
               'Навигация': this._buildRecord(this._getPagingParams(query)),
               'ДопПоля': this._getAdditionalParams(query)
            };

         return this.getProvider().call(
            this._options.binding.query,
            adapter.serialize(args)
         ).addCallbacks((function (res) {
            return this._getDataSetInstance({
               rawData: res,
               totalProperty: 'n'
            });
         }).bind(this), function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::query()', error);
            return error;
         });
      },

      call: function (command, data) {
         var adapter = this.getAdapter();

         return this.getProvider().call(
            command,
            adapter.serialize(data)
         ).addCallbacks((function (res) {
            return this._getDataSetInstance({
               rawData: res,
               totalProperty: 'n'
            });
         }).bind(this), function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::call()', error);
            return error;
         });
      },

      //endregion SBIS3.CONTROLS.Data.Source.ISource

      //region Protected methods

      /**
       * Возвращает тип значения
       * @param {*} val Значение
       * @returns {String|Object}
       * @protected
       */
      _getValueType: function (val) {
         switch (typeof val) {
            case 'boolean':
               return 'boolean';
            case 'number':
               if (val % 1 === 0) {
                  return 'integer';
               }
               return 'real';
            case 'object':
               if (val === null) {
                  return 'string';
               } else if ($ws.helpers.instanceOfModule(val, 'SBIS3.CONTROLS.Data.Record')) {
                  return 'record';
               } else if (val instanceof $ws.proto.Record) {
                  return 'record';
               } else if ($ws.helpers.instanceOfModule(val, 'SBIS3.CONTROLS.Data.Collection.RecordSet')) {
                  return 'recordset';
               } else if (val instanceof Date) {
                  return 'datetime';
               } else if (val instanceof Array) {
                  return {
                     type: 'array',
                     kind: this._getValueType(val[0])
                  };
               } else {
                  return 'string';
               }
               break;
            default:
               return 'string';
         }
      },

      /**
       * Строит запись из объекта
       * @param {Object.<String, *>|SBIS3.CONTROLS.Data.Record} data Данные полей записи
       * @returns {SBIS3.CONTROL.Data.Record|null}
       * @protected
       */
      _buildRecord: function (data) {
         if (data === null) {
            return data;
         }
         if (data && $ws.helpers.instanceOfModule(data, 'SBIS3.CONTROLS.Data.Record')) {
            return data;
         }

         var record = this._getModelInstance(null),
            name,
            value,
            field;

         for (name in data) {
            if (data.hasOwnProperty(name)) {
               value = data[name];
               field = this._getValueType(value);
               if (!(field instanceof Object)) {
                  field = {type: field};
               }
               field.name = name;
               record.addField(field, undefined, value);
            }
         }

         return record;
      },

      /**
       * Строит рекодсет из массива
       * @param {Array.<Object.<String, *>>|SBIS3.CONTROLS.Data.Collection.RecordSet} data Данные рекордсета
       * @returns {SBIS3.CONTROLS.Data.Collection.RecordSet|null}
       * @protected
       */
      _buildRecordSet: function (data) {
         if (data === null) {
            return data;
         }
         if (data && $ws.helpers.instanceOfModule(data, 'SBIS3.CONTROLS.Data.Collection.RecordSet')) {
            return data;
         }

         var recordset = this._getListInstance(null),
            count = data.length || 0,
            i;

         recordset.setAdapter(this._options.adapter);
         for (i = 0; i < count; i++) {
            recordset.add(this._buildRecord(data[i]));
         }

         return recordset;
      },

      /**
       * Возвращает параметры сортировки
       * @param {SBIS3.CONTROLS.Data.Query.Query} query Запрос
       * @returns {Array|null}
       * @protected
       */
      _getSortingParams: function (query) {
         if (!query) {
            return null;
         }
         var orders = query.getOrderBy();
         if (orders.length === 0) {
            return null;
         }

         var sort = [],
             order;
         for (var i = 0; i < orders.length; i++) {
            order = orders[i];
            sort.push({
               n: order.getSelector(),
               o: order.getOrder(),
               l: !order.getOrder()
            });
         }
         return sort;
      },

      /**
       * Возвращает параметры навигации
       * @param {SBIS3.CONTROLS.Data.Query.Query} query Запрос
       * @returns {Object|null}
       * @protected
       */
      _getPagingParams: function (query) {
         if (!query) {
            return null;
         }
         var offset = query.getOffset(),
            limit = query.getLimit();

         if (offset === 0 && limit === undefined) {
            return null;
         }
         return {
            'Страница': limit > 0 ? Math.floor(offset / limit) : 0,
            'РазмерСтраницы': limit,
            'ЕстьЕще': offset >= 0
         };
      },

      /**
       * Возвращает дополнительные параметры
       * @param {SBIS3.CONTROLS.Data.Query.Query} query Запрос
       * @returns {Array}
       * @protected
       */
      _getAdditionalParams: function (query) {
         var meta = [];
         if (query) {
            meta = query.getMeta();
            if (meta && $ws.helpers.instanceOfModule(meta, 'SBIS3.CONTROLS.Data.Record')) {
               meta = meta.toObject();
            }
            if (meta instanceof Object) {
               var arr = [];
               for (var key in meta) {
                  if (meta.hasOwnProperty(key)) {
                     arr.push(meta[key]);
                  }
               }
               meta = arr;
            }
            if (!(meta instanceof Array)) {
               throw new TypeError(this._moduleName + '::_getAdditionalParams(): unsupported metadata type: only Array, SBIS3.CONTROLS.Data.Record or Object allowed');
            }
         }

         return meta;
      },

      /**
       * Возвращает имя объекта бл из сложного идентификатора или имя объекта из источника, для простых идентификаторов
       * @param id - Идентификатор записи
       * @returns {String}
       * @protected
       */
      _getProviderNameById: function (id) {
         if (String(id).indexOf(',') !== -1) {
            var ido = String(id).split(',');
            return ido[1];
         }
         return this._options.endpoint.contract;
      },

      /**
       * вызвает метод удаления
       * @param {String|Array} id Идентификатор объекта
       * @param {String} BLObjName  Название объекта бл у которго будет вызвано удаление
       * @param {Object} meta  Дополнительные мета данные
       * @returns {$ws.proto.Deferred}
       * @protected
       */
      _destroy: function(id, BLObjName, meta) {
         var adapter = this.getAdapter(),
            args = {
               'ИдО': id
            };
         if (meta && !Object.isEmpty(meta)) {
            args['ДопПоля'] = meta;
         }
         var provider = this.getProvider();
         if (BLObjName && this._options.endpoint.contract !== BLObjName) {
            provider = Di.resolve('source.provider.sbis-business-logic', {
               endpoint: {
                  contract: BLObjName
               }
            });
         }
         return provider.call(
            this._options.binding.destroy,
            adapter.serialize(args)
         ).addCallbacks(function (res) {
            return res;
         }, function (error) {
            $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Source.SbisService::destroy()', error);
            return error;
         });
      },

      //endregion Protected methods

      //region Deprecated

      /**
       * Возвращает аргументы списочного метода
       * @deprecated Метод будет удален в 3.7.4, используйте query()
       */
      prepareQueryParams : function(filter, sorting, offset, limit, hasMore){
         var query = new Query(),
            args;

         query.where(filter)
            .offset(hasMore === undefined ? offset : hasMore)
            .limit(limit)
            .orderBy(sorting);

         args = {
            'Фильтр': this._buildRecord(query ? query.getWhere() : null),
            'Сортировка': this._buildRecordSet(this._getSortingParams(query)),
            'Навигация': this._buildRecord(this._getPagingParams(query)),
            'ДопПоля': this._getAdditionalParams(query)
         };

         return this.getAdapter().serialize(args);
      }

      //endregion Deprecated
   });

   Di.register('source.sbis-service', SbisService);

   return SbisService;
});
