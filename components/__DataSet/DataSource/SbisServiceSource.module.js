/**
 * Created by as.manuylov on 10.11.14.
 */
define('js!SBIS3.CONTROLS.SbisServiceSource', [
   'js!SBIS3.CONTROLS.BaseSource',
   'js!SBIS3.CONTROLS.Record',
   'js!SBIS3.CONTROLS.DataSet',
   'js!SBIS3.CONTROLS.SbisJSONStrategy'
], function (BaseSource, Record, DataSet, SbisJSONStrategy) {
   'use strict';

   /**
    * Класс для работы с бизнес-логикой СБИС, как с источником данных.
    * @public
    * @class SBIS3.CONTROLS.SbisServiceSource
    * @extends SBIS3.CONTROLS.BaseSource
    * <pre>
    *     var dataSource = new SbisServiceSource({
    *         service: {
    *             name: 'Товар'
    *         }
    *     });
    * </pre>
    */

   return BaseSource.extend({
      $protected: {
         _options: {
             /**
              * @noShow
              */
            strategy: null,
            /**
             * @cfg {String} Имя метода, который будет использоваться для построения списка записей
             * сопоставление CRUD операций и методов БЛ
             * @see query
             */
            queryMethodName: 'Список',
             /**
              * @cfg {String} Имя метода, который будет использоваться для создания записей
              * @example
              * <pre>
              *    <option name="crateMethodName">Создать</option>
              * </pre>
              * @see create
              */
            crateMethodName: 'Создать',
             /**
              * @cfg {String} Имя метода, который будет использоваться для чтения записей
              * @example
              * <pre>
              *    <option name="readMethodName">Прочитать</option>
              * </pre>
              * @see read
              */
            readMethodName: 'Прочитать',
             /**
              * @cfg {String} Имя метода, который будет использоваться для обновления записей
              * @example
              * <pre>
              *    <option name="updateMethodName">Записать</option>
              * </pre>
              * @see update
              */
            updateMethodName: 'Записать',
             /**
              * @cfg {String} Имя метода, который будет использоваться для удаления записей
              * @example
              * <pre>
              *    <option name="destroyMethodName">Удалить</option>
              * </pre>
              * @see destroy
              */
            destroyMethodName: 'Удалить'
         },
         /**
          * @cfg {$ws.proto.ClientBLObject} Объект, который умеет ходить на бизнес-логику
          */
         _BL: undefined,
         /**
          * @cfg {$ws.proto.ClientBLObject} Объект, который используется для смены порядковых номеров на бизнес-логике
          */
         _orderBL: undefined,
         /**
          * @cfg {String} Имя объекта бизнес-логики
          */
         _object: undefined
      },

      $constructor: function (cfg) {
         this._BL = new $ws.proto.ClientBLObject(cfg.service);
         this._object = cfg.service;
         this._options.strategy = cfg.strategy || new SbisJSONStrategy();
      },

      /**
       * Вызов создания записи в источнике данных методом, указанным в опции {@link createMethodName}.
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет SBIS3.CONTROLS.Record.
       * @example
       * <pre>
       *     var dataSource = new SbisServiceSource({
       *         service: {
       *             name: 'Товар'
       *         }
       *     });
       *     dataSource.create().addCallback(function(record) {
       *         var raw = record.getRaw();
       *         var key = record.getKey();
       *         record.set('Наименование', 'Тест ' + (new Date()).toString());
       *         dataSource.update(record).addCallback(function(success) {
       *             var raw = record.getRaw();
       *             var key = record.getKey();
       *         });
       *     });
       * </pre>
       * @see createMethodName
       */
      create: function () {
         var self = this,
            def = new $ws.proto.Deferred();
         //todo Выпилить адовый костыль для создания черновика, как только решится вопрос на стороне БЛ
         //(задание https://inside.tensor.ru/opendoc.html?guid=a886eecb-c2a0-4628-8919-a395be42dbbb)
         self._BL.call(self._options.crateMethodName, {
            'Фильтр': {
               d: [
                  true
               ],
               s: [{
                  n: 'ВызовИзБраузера',
                  t: 'Логическое'
               }]
            },
            'ИмяМетода': null
         }, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {
            var record = new Record({
               strategy: self.getStrategy(),
               raw: res,
               keyField: self.getStrategy().getKey(res)
            });
            def.callback(record);
         }, function (error) {
            $ws.single.ioc.resolve('ILogger').log('SbisServiceSource', error);
            throw new Error('Не удалось выполнить метод create');
         });
         return def;
      },

      /**
       * Метод для {@link readMethodName чтения} записи её по идентификатору.
       * @param {Number} id Идентификатор записи.
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придёт SBIS3.CONTROLS.Record.
       * @example
       * <pre>
       *     var dataSource = new SbisServiceSource({
       *         service: {
       *             name: 'Товар'
       *         }
       *     });
       *     dataSource.read(1).addCallback(function(record) {
       *         var key = record.getKey();
       *         var name = record.get('Наименование');
       *     });
       * </pre>
       * @see readMethodName
       */
      read: function (id) {
         var self = this,
            def = new $ws.proto.Deferred();
         self._BL.call(self._options.readMethodName, {
            'ИдО': id,
            'ИмяМетода': 'Список'
         }, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {
            var record = new Record({
               strategy: self.getStrategy(),
               raw: res,
               keyField: self.getStrategy().getKey(res),
               isCreated: true
            });
            def.callback(record);
         }, function (error) {
            $ws.single.ioc.resolve('ILogger').log('SbisServiceSource', error);
            throw new Error('Не удалось выполнить метод read');
         });
         return def;
      },

      /**
       * Вызов обновления записи на БЛ методом, указанным в опции {@link updateMethodName}.
       * @param (SBIS3.CONTROLS.Record) record Изменённая запись.
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придёт Boolean - результат успешности выполнения операции.
       * @example
       * <pre>
       *     var dataSource = new SbisServiceSource({
       *         service: {
       *             name: 'Товар'
       *         }
       *     });
       *     dataSource.read(1).addCallback(function(record) {
       *         var raw = record.getRaw();
       *         record.set('Наименование', 'Тест ' + (new Date()).toString());
       *         dataSource.update(record).addCallback(function(success) {
       *             var raw = record.getRaw();
       *         });
       *     });
       * </pre>
       * @see updateMethodName
       */
      update: function (record) {
         var self = this,
            strategy = this.getStrategy(),
            def = new $ws.proto.Deferred(),
            rec = strategy.prepareRecordForUpdate(record);

         self._BL.call(self._options.updateMethodName, {'Запись': rec}, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {
            if (!record.isCreated()) {
               record.set(record.getKeyField(), res);
               record.setCreated(true);
            }
            record.setChanged(false);

            def.callback(true);
         }, function (error) {
            $ws.single.ioc.resolve('ILogger').log('SbisServiceSource', error);
            throw new Error('Не удалось выполнить метод update');
         });

         return def;
      },

      /**
       * Вызов удаления записи из БЛ методом, указанным в опции {@link destroyMethodName}.
       * @param {Array | Number} id Идентификатор записи или массив идентификаторов.
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придёт Boolean - результат успешности выполнения операции.
       * @see destroyMethodName
       */
      destroy: function (id) {
         var self = this,
            def = new $ws.proto.Deferred();

         self._BL.call(self._options.destroyMethodName, {'ИдО': id}, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {
            def.callback(true);
         }, function (error) {
            if (typeof(window) != 'undefined') {
               console['log'](error);
            }
            throw new Error('Не удалось выполнить метод destroy');
         });

         return def;
      },

      /**
       * Вызов списочного метода БЛ, указанногов опции {@link queryMethodName}.
       * @remark
       * Возможно применение фильтрации, сортировки и выбора определенного количества записей с заданной позиции.
       * @param {Object} filter Параметры фильтрации вида - {property1: value, property2: value}.
       * @param {Array} sorting Параметры сортировки вида - [{property1: 'ASC'}, {property2: 'DESC'}].
       * @param {Number} offset Смещение начала выборки.
       * @param {Number} limit Количество возвращаемых записей.
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет SBIS3.CONTROLS.DataSet - набор отобранных элементов.
       * @example
       * <pre>
       *     var dataSource = new SbisServiceSource({
       *         service: {
       *             name: 'Товар'
       *         }
       *     });
       *     dataSource.query({
       *         'Наименование': 'Процессор'
       *     }).addCallback(function(dataSet) {
       *         //Что-то делаем с dataSet
       *     });
       * </pre>
       * @see queryMethodName
       */
      query: function (filter, sorting, offset, limit) {
         filter = filter || {};
         var
            self = this,
            strategy = this.getStrategy(),
            def = new $ws.proto.Deferred(),
            filterParam = strategy.prepareFilterParam(filter),
            sortingParam = strategy.prepareSortingParam(sorting),
            pagingParam = strategy.preparePagingParam(offset, limit);

         self._BL.call(self._options.queryMethodName, {
            'ДопПоля': [],
            'Фильтр': filterParam,
            'Сортировка': sortingParam,
            'Навигация': pagingParam
         }, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {

            var DS = new DataSet({
               strategy: strategy,
               data: res
            });
            def.callback(DS);
         }, function (error) {
            $ws.single.ioc.resolve('ILogger').log('SbisServiceSource', error);
            throw new Error('Не удалось выполнить метод query');
         });

         return def;

      },
      /**
       * Метод перемещения записи к другому родителю и смены порядковых номеров
       * @param {SBIS3.CONTROLS.Record} record - запись, которую необходимо перенести
       * @param {String} hierField - имя колонки с иерархией
       * @param {Number} parentKey - ключ нового родителя для записи
       * @param {Object} orderDetails - детали смены порядковых номеров. Объект со свойствами after и before: после или перед какой записью нужно вставить перемещаемую.
       */
      move: function (record, hierField, parentKey, orderDetails) {
         if(orderDetails){
            return this._changeOrder(record, hierField, parentKey, orderDetails);
         } else if(parentKey){
            //сменить родителя
            record.set(hierField, parentKey);
            return this.update(record);
         } else {
            throw new Error('Не передано достаточно информации для перемещения');
         }
      },
      _changeOrder: function(record, hierField, parentKey, orderDetails){
         var self = this,
            strategy = this.getStrategy(),
            def = new $ws.proto.Deferred(),
            params = strategy.prepareOrderParams(this._object, record, hierField, orderDetails),
            suffix = orderDetails.after ? 'После' : 'До';
         if(!this._orderBL){
            this._orderBL = new $ws.proto.BLObject('ПорядковыйНомер');
         }
         self._orderBL.call('Вставить' + suffix, params, $ws.proto.BLObject.RETURN_TYPE_ASIS).addCallbacks(function (res) {
            def.callback(true);
         }, function (error) {
            if (typeof(window) != 'undefined') {
               console['log'](error);
            }
            throw new Error('Не удалось выполнить метод update');
         });
         return def;
      }

   });
});