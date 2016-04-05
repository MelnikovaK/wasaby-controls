/* global define */
define('js!SBIS3.CONTROLS.Data.Source.ISource', [
], function () {
   'use strict';

   /**
    * Интерфейс источника данных - объекта с CRUD архитектурой, предоставляющего доступ к типовым операциям, применяемым к объекту предметной области.
    * @mixin SBIS3.CONTROLS.Data.Source.ISource
    * @public
    * @author Мальцев Алексей
    */

   return /** @lends SBIS3.CONTROLS.Data.Source.ISource.prototype */{
      /**
       * @typedef {Object} Endpoint
       * @property {String} [address] Адрес - указывает место расположения сервиса, к которому будет осуществлено подключение
       * @property {String} contract Контракт - определяет доступные операции
       */

      /**
       * @typedef {Object} Binding
       * @property {String} create Операция создания записи через метод {@link create}
       * @property {String} read Операция чтения записи через метод {@link read}
       * @property {String} update Операция обновления записи через метод {@link update}
       * @property {String} destroy Операция удаления записи через метод {@link destroy}
       * @property {String} query Операция получения списка записей через метод {@link query}
       * @property {String} copy Операция копирования записей через метод {@link copy}
       * @property {String} merge Операция объединения записей через метод {@link merge}
       */

      $protected: {
         _options: {
            /**
             * @cfg {Endpoint|String} Конечная точка, обеспечивающая доступ клиента к функциональным возможностям источника данных
             * @see getEndPoint
             * @remark
             * Можно успользовать сокращенную запись, передав значение в виде строки - в этом случае оно будет
             * интерпретироваться как контракт (endpoint.contract)
             * @example
             * Подключаем пользователей через HTTP API:
             * <pre>
             *    var dataSource = new HttpSource({
             *       endpoint: {
             *          address: '/api/',
             *          contract: 'users/'
             *       }
             *    });
             * </pre>
             * Подключаем пользователей через HTTP API с использованием сокращенной нотации:
             * <pre>
             *    var dataSource = new HttpSource({
             *       endpoint: '/users/'
             *    });
             * </pre>
             * Подключаем пользователей через HTTP API с указанием адреса подключения:
             * <pre>
             *    var dataSource = new RpcSource({
             *       endpoint: {
             *          address: '//server.name/api/rpc/',
             *          contract: 'Users'
             *       }
             *    });
             * </pre>
             */
            endpoint: {},

            /**
             * @cfg {Binding} Соответствие методов CRUD+ контракту
             * @see getBinding
             * @see setBinding
             * @see create
             * @see read
             * @see destroy
             * @see query
             * @see copy
             * @see merge
             * @example
             * Подключаем пользователей через HTTP API:
             * <pre>
             *    var dataSource = new HttpSource({
             *       endpoint: {
             *          address: '//some.server/',
             *          contract: 'users/'
             *       },
             *       binding: {
             *          create: 'add/',//dataSource.create() calls //some.server/users/add/ via HTTP
             *          read: 'load/',//dataSource.read() calls //some.server/users/load/ via HTTP
             *          update: 'save/',//dataSource.update() calls //some.server/users/save/ via HTTP
             *          destroy: 'delete/',//dataSource.destroy() calls //some.server/users/delete/ via HTTP
             *          query: 'list/',//dataSource.query() calls //some.server/users/list/ via HTTP
             *       }
             *    });
             * </pre>
             * Подключаем пользователей через RPC:
             * <pre>
             *    var dataSource = new RpcSource({
             *       endpoint: {
             *          address: '//some.server/rpc-gate/',
             *          contract: 'Users'
             *       },
             *       binding: {
             *          create: 'Add',//dataSource.create() calls UsersAdd() via RPC
             *          read: 'Load',//dataSource.read() calls UsersLoad() via RPC
             *          update: 'Save',//dataSource.update() calls UsersSave() via RPC
             *          destroy: 'Delete',//dataSource.destroy() calls UsersDelete() via RPC
             *          query: 'List',//dataSource.query() calls UsersList() via RPC
             *       }
             *    });
             * </pre>
             */
            binding: {
               create: '',
               read: '',
               update: '',
               destroy: '',
               query: '',
               copy: '',
               merge: ''
            },

            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} Адаптер для работы с данными, по умолчанию {@link SBIS3.CONTROLS.Data.Adapter.Json}
             * @see getAdapter
             * @see setAdapter
             * @see SBIS3.CONTROLS.Data.Adapter.IAdapter
             * @see SBIS3.CONTROLS.Data.Di
             * @example
             * Адаптер формата БЛ СБИС, внедренный через модуль DI:
             * <pre>
             *    var dataSource = new MemorySource({
             *       adapter: 'adapter.sbis'
             *    });
             * </pre>
             * Адаптер формата БЛ СБИС, внедренный в виде готового экземпляра:
             * <pre>
             *    var dataSource = new MemorySource({
             *       adapter: new SbisAdapter()
             *    });
             * </pre>
             */
            adapter: 'adapter.json',

            /**
             * @cfg {String|Function} Конструктор модели, по умолчанию {@link SBIS3.CONTROLS.Data.Model}
             * @see getModel
             * @see setModel
             * @see SBIS3.CONTROLS.Data.Model
             * @see SBIS3.CONTROLS.Data.Di
             * @example
             * Модель пользователя, внедренная через модуль DI:
             * <pre>
             *    var User = Model.extend({
             *       identify: function(login, password) {
             *       }
             *    });
             *    Di.register('model.user', User);
             *    //...
             *    var dataSource = new Source({
             *       model: 'model.user'
             *    });
             * </pre>
             * Модель пользователя, внедренная в виде конструктора:
             * <pre>
             *    var User = Model.extend({
             *       identify: function(login, password) {
             *       }
             *    });
             *    //...
             *    var dataSource = new Source({
             *       model: User
             *    });
             * </pre>
             */
            model: 'model',

            /**
             * @cfg {String|Function} Конструктор списка моделей, по умолчанию {@link SBIS3.CONTROLS.Data.Collection.RecordSet}
             * @see getListModule
             * @see setListModule
             * @see SBIS3.CONTROLS.Data.Collection.RecordSet
             * @see SBIS3.CONTROLS.Data.Di
             * @example
             * Модель списка пользователей, внедренная через модуль DI:
             * <pre>
             *    var Users = RecordSet.extend({
             *       getAdministrators: function() {
             *       }
             *    });
             *    Di.register('collection.recordset.users', Users);
             *    //...
             *    var dataSource = new Source({
             *       listModule: 'collection.recordset.users'
             *    });
             * </pre>
             * Модель списка пользователей, внедренная в виде конструктора:
             * <pre>
             *    var Users = RecordSet.extend({
             *       getAdministrators: function() {
             *       }
             *    });
             *    //...
             *    var dataSource = new Source({
             *       listModule: Users
             *    });
             * </pre>
             */
            listModule: 'collection.recordset',

            /**
             * @cfg {String} Свойство модели, содержащее первичный ключ
             * @see getIdProperty
             * @see setIdProperty
             * @see SBIS3.CONTROLS.Data.Model#idProperty
             * @example
             * Установка свойства 'primaryId' в качестве первичного ключа:
             * <pre>
             *    var dataSource = new Source({
             *       idProperty: 'primaryId'
             *    });
             * </pre>
             */
            idProperty: ''
         }
      },

      /**
       * Возвращает конечную точку, обеспечивающую доступ клиента к функциональным возможностям источника данных
       * @returns {Endpoint}
       * @see endpoint
       */
      getEndpoint: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает соответствие методов CRUD+ контракту
       * @returns {Binding}
       * @see binding
       * @see setBinding
       */
      getBinding: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает соответствие методов CRUD+ контракту
       * @param {Binding} binding
       * @see binding
       * @see getBinding
       */
      setBinding: function (binding) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает адаптер для работы с данными
       * @returns {SBIS3.CONTROLS.Data.Adapter.IAdapter}
       * @see setAdapter
       * @see adapter
       * @see SBIS3.CONTROLS.Data.Adapter.IAdapter
       */
      getAdapter: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает адаптер для работы с данными
       * @param {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} adapter
       * @see getAdapter
       * @see adapter
       * @see SBIS3.CONTROLS.Data.Adapter.IAdapter
       * @see SBIS3.CONTROLS.Data.Di
       * @example
       * Адаптер формата БЛ СБИС, внедренный через модуль DI:
       * <pre>
       *    dataSource.setAdapter('adapter.sbis');
       * </pre>
       * Адаптер формата БЛ СБИС, внедренный в виде экземпляра:
       * <pre>
       *    dataSource.setAdapter(new SbisAdapter());
       * </pre>
       */
      setAdapter: function (adapter) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает конструктор модели
       * @returns {String|Function}
       * @see setModel
       * @see model
       * @see SBIS3.CONTROLS.Data.Model
       * @see SBIS3.CONTROLS.Data.Di
       */
      getModel: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает конструктор модели
       * @param {String|Function} model
       * @see getModel
       * @see model
       * @see SBIS3.CONTROLS.Data.Model
       * @see SBIS3.CONTROLS.Data.Di
       * @example
       * Модель, внедренная через модуль DI:
       * <pre>
       *    dataSource.setModel('app.my-module.my-model');
       * </pre>
       * Модель, внедренная в виде конструктора:
       * <pre>
       *    require(['js!MyModule.Data.MyModel'], function(MyModel) {
       *       dataSource.setModel(MyModel);
       *    });
       * </pre>
       */
      setModel: function (model) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает конструктор списка моделей
       * @returns {String|Function}
       * @see setListModule
       * @see listModule
       */
      getListModule: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает конструктор списка моделей
       * @param {String|Function} listModule
       * @see getListModule
       * @see listModule
       * @see SBIS3.CONTROLS.Data.Di
       */
      setListModule: function (listModule) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает свойство модели, содержащее первичный ключ
       * @returns {String}
       * @see setIdProperty
       * @see idProperty
       * @see SBIS3.CONTROLS.Data.Model#idProperty
       */
      getIdProperty: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает свойство модели, содержащее первичный ключ
       * @param {String} name
       * @see getIdProperty
       * @see idProperty
       * @see SBIS3.CONTROLS.Data.Model#idProperty
       * @example
       * <pre>
       *    dataSource.setIdProperty('userId');
       * </pre>
       */
      setIdProperty: function (name) {
         throw new Error('Method must be implemented');
      },

      /**
       * Создает пустую модель через источник данных
       * @param {Object} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Model}.
       * @see SBIS3.CONTROLS.Data.Model
       * @example
       * Создаем новую статью через источник данных:
       * <pre>
       *    var dataSource = new RestSource({
       *       endpoint: '/articles/'
       *    });
       *    dataSource.create().addCallback(function(model) {
       *       var id = model.get('Id'),//01c5151e-21fe-5316-d118-cb13216c9412
       *          title = model.get('Title');//Untitled
       *    }).addErrback(function() {
       *       $ws.helpers.alert('Can\'t create an article');
       *    });
       * </pre>
       */
      create: function (meta) {
         throw new Error('Method must be implemented');
      },

      /**
       * Читает модель из источника данных
       * @param {String} key Первичный ключ модели
       * @param {Object} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Model}.
       * @example
       * Читаем статью из источника данных:
       * <pre>
       *    var dataSource = new RestSource({
       *       endpoint: '/articles/'
       *    });
       *    dataSource.read('how-to-read-an-item').addCallback(function(model) {
       *       var id = model.get('Id'),//how-to-read-an-item
       *          title = model.get('Title');//How to read an item
       *    }).addErrback(function() {
       *       $ws.helpers.alert('Can\'t read the article');
       *    });
       * </pre>
       */
      read: function (key, meta) {
         throw new Error('Method must be implemented');
      },

      /**
       * Обновляет модель в источнике данных
       * @param {SBIS3.CONTROLS.Data.Model} model Обновляемая модель
       * @param {Object} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       * @example
       * Обновляем статью в источнике данных:
       * <pre>
       *    var dataSource = new RestSource({
       *       endpoint: '/articles/'
       *    }),
       *    article = new Model({
       *       rawData: {
       *          Id: 'how-to-update-an-item',
       *          Title: 'How to update an item'
       *       }
       *    });
       *    dataSource.update(article).addCallback(function() {
       *       $ws.helpers.alert('The article was updated successfully');
       *    }).addErrback(function() {
       *       $ws.helpers.alert('Can\'t update the article');
       *    });
       * </pre>
       */
      update: function (model, meta) {
         throw new Error('Method must be implemented');
      },

      /**
       * Удаляет модель из источника данных
       * @param {String|Array} keys Первичный ключ, или массив первичных ключей модели
       * @param {Object} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       * @example
       * Удаляем статью в источнике данных:
       * <pre>
       *    var dataSource = new RestSource({
       *       endpoint: '/articles/'
       *    });
       *    dataSource.destroy('article-id-to-destroy').addCallback(function() {
       *       $ws.helpers.alert('The article was deleted successfully');
       *    }).addErrback(function() {
       *       $ws.helpers.alert('Can\'t delete the article');
       *    });
       * </pre>
       */
      destroy: function (keys, meta) {
         throw new Error('Method must be implemented');
      },

      /**
       * Объединяет одну модель с другой
       * @param {String} from Первичный ключ модели-источника
       * @param {String} to Первичный ключ модели-приёмника
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       */
      merge: function (from, to) {
         throw new Error('Method must be implemented');
      },

      /**
       * Создает копию модели
       * @param {String} key Первичный ключ модели
       * @param {Object} [meta] Дополнительные мета данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения
       */
      copy: function (key, meta) {
         throw new Error('Method must be implemented');
      },

      /**
       * @typedef {Object} OrderDetails
       * @property {Boolean} [after=false] Вставить после модели, указанной в {@link to}
       * @property {String} [column] Название столбца, по которому осуществляется сортировка
       * @property {String} [hierColumn] Название столбца, по которому строится иерархия
       */

      /**
       * Выполняет запрос на выборку
       * @param {SBIS3.CONTROLS.Data.Query.Query} [query] Запрос
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Source.DataSet}.
       * @see SBIS3.CONTROLS.Data.Query.Query
       * @see SBIS3.CONTROLS.Data.Source.DataSet
       * @example
       * Ищем молодые таланты среди сотрудников:
       * <pre>
       *    var dataSource = new Source({
       *          endpoint: 'Employee'
       *       }),
       *       query = new Query();
       *    query.select([
       *          'Id',
       *          'Name',
       *          'Position'
       *       ])
       *       .where({
       *          'Position': 'TeamLead',
       *          'Age>=': 18,
       *          'Age<=': 20
       *       })
       *       .orderBy('Age');
       *    dataSource.query(query).addCallback(function(dataSet) {
       *       if (dataSet.getAll().getCount() > 0) {
       *          //Mark Zuckerberg detected
       *       }
       *    });
       * </pre>
       * Выбираем новые книги опредленного жанра:
       * <pre>
       *    var dataSource = new Source({
       *          endpoint: 'Books'
       *       }),
       *       query = new Query();
       *    query.select([
       *          'Id',
       *          'Name',
       *          'Author',
       *          'Genre'
       *       ])
       *       .where({
       *          'Genre': ['Thriller', 'Detective']
       *       })
       *       .orderBy('Date', false);
       *    dataSource.query(query).addCallback(function(dataSet) {
       *       var books = dataSet.getAll();
       *       //Do something
       *    });
       * </pre>
       */
      query: function (query) {
         throw new Error('Method must be implemented');
      },

      /**
       * Выполняет команду
       * @param {String} command Команда
       * @param {Object} [data] Данные
       * @returns {$ws.proto.Deferred} Асинхронный результат выполнения. В колбэке придет {@link SBIS3.CONTROLS.Data.Source.DataSet}.
       * @see SBIS3.CONTROLS.Data.Source.DataSet
       * @example
       * Раздаем подарки сотрудникам, у которых сегодня день рождения; считаем их количество:
       * <pre>
       *    var dataSource = new Source({
       *       endpoint: 'Employee'
       *    });
       *    dataSource.call('GiveAGift', {
       *       birthDate: new Date()
       *    }).addCallback(function(dataSet) {
       *       if (dataSet.getAll().getCount() > 0) {
       *          //Today's birthday gifts count
       *       }
       *    });
       * </pre>
       */
      call: function (command, data) {
         throw new Error('Method must be implemented');
      }
   };
});
