/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.FormattableMixin', [
   'js!SBIS3.CONTROLS.Data.Format.Format',
   'js!SBIS3.CONTROLS.Data.Format.FormatsFactory',
   'js!SBIS3.CONTROLS.Data.Format.FieldsFactory',
   'js!SBIS3.CONTROLS.Data.Di',
   'js!SBIS3.CONTROLS.Data.Adapter.Json'
], function (Format, FormatsFactory, FieldsFactory, Di) {
   'use strict';

   /**
    * Миксин, предоставляющий поведение владения форматом полей
    * @mixin SBIS3.CONTROLS.Data.FormattableMixin
    * @public
    * @author Мальцев Алексей
    */

   var FormattableMixin = /**@lends SBIS3.CONTROLS.Data.FormattableMixin.prototype */{
      $protected: {
         _options: {
            /**
             * @cfg {Object} Данные в "сыром" виде
             * @see getRawData
             * @see setRawData
             * @example
             * <pre>
             *    var user = new Record({
             *       rawData: {
             *          id: 1,
             *          firstName: 'John',
             *          lastName: 'Smith'
             *       }
             *    });
             *    user.get('id');//5
             *    user.get('firstName');//John
             * </pre>
             */
            rawData: null,

            /**
             * @cfg {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} Адаптер для работы с данными, по умолчанию {@link SBIS3.CONTROLS.Data.Adapter.Json}
             * @see getAdapter
             * @see setAdapter
             * @see SBIS3.CONTROLS.Data.Adapter.Json
             * @see SBIS3.CONTROLS.Data.Di
             * @example
             * <pre>
             *    var user = new Record({
             *       adapter: 'adapter.sbis'
             *    });
             * </pre>
             * @example
             * <pre>
             *    var user = new Record({
             *       adapter: new SbisAdapter()
             *    });
             * </pre>
             */
            adapter: 'adapter.json',

            /**
             * @cfg {SBIS3.CONTROLS.Data.Format.Format|Array.<SBIS3.CONTROLS.Data.Format.FieldsFactory/FieldDeclaration.typedef>} Формат полей
             * @see getFormat
             * @example
             * <pre>
             *    define('js!My.Module', [
             *       'js!My.Format.User'
             *    ], function (UserFormat) {
             *       var user = new Record({
             *          format: new UserFormat
             *       });
             *    });
             * </pre>
             * @example
             * <pre>
             *    var users = new RecordSet({
             *       format: [{
             *          name: 'id'
             *          type: 'integer'
             *       }, {
             *          name: 'login'
             *          type: 'string'
             *       }]
             *    });
             * </pre>
             */
            format: null
         },

         /**
          * @member {SBIS3.CONTROLS.Data.Adapter.ITable|SBIS3.CONTROLS.Data.Adapter.IRecord} Адаптер для cырых данных
          */
         _rawDataAdapter: null,

         /**
         *@member {Boolean} Формат был задан пользователем явно
         */
         _directFormat: false
      },

      //region SBIS3.CONTROLS.Data.SerializableMixin

      after: {
         _getSerializableState: function(state) {
            //Prevent core reviver for rawData
            if (state._options && state._options.rawData && state._options.rawData._type) {
               state._options.rawData.$type = state._options.rawData._type;
               delete state._options.rawData._type;
            }

            return state;
         },

         _setSerializableState: function(state, initializer) {
            //Restore value hidden from core reviver
            return initializer.callNext(function() {
               if (this._options && this._options.rawData && this._options.rawData.$type) {
                  this._options.rawData._type = this._options.rawData.$type;
                  delete this._options.rawData.$type;
               }
            });
         }
      },

      //region Public methods

      $constructor: function (cfg) {
         if(cfg && cfg.format) {
            this._directFormat = true;

            this._getFormat().each(function(fieldFormat) {
               try {
                  this._getRawDataAdapter().addField(fieldFormat);
               } catch (e) {

               }
            }, this);
         }
      },

      /**
       * Возвращает данные в "сыром" виде
       * @returns {Object}
       * @see setRawData
       * @see rawData
       */
      getRawData: function() {
         return this._options.rawData;
      },

      /**
       * Устанавливает данные в "сыром" виде
       * @param data {Object} Данные в "сыром" виде
       * @see getRawData
       * @see rawData
       */
      setRawData: function(data) {
         this._options.rawData = data;
      },

      /**
       * Возвращает адаптер для работы с данными в "сыром" виде
       * @returns {SBIS3.CONTROLS.Data.Adapter.IAdapter}
       * @see adapter
       * @see setAdapter
       */
      getAdapter: function () {
         if (
            typeof this._options.adapter === 'string' &&
            FormattableMixin._getDefaultAdapter !== this._getDefaultAdapter
         ) {
            $ws.single.ioc.resolve('ILogger').info('SBIS3.CONTROLS.Data.FormattableMixin', 'Method _getDefaultAdapter() is deprecated and will be removed in 3.7.4. Use \'adapter\' option instead.');
            this._options.adapter = this._getDefaultAdapter();
         }
         if (typeof this._options.adapter === 'string') {
            this._options.adapter = Di.resolve(this._options.adapter);
         }
         return this._options.adapter;
      },

      /**
       * Устанавливает адаптер для работы с данными в "сыром" виде
       * @param {String|SBIS3.CONTROLS.Data.Adapter.IAdapter} adapter
       * @see adapter
       * @see getAdapter
       */
      setAdapter: function (adapter) {
         this._options.adapter = adapter;
      },

      /**
       * Возвращает формат полей (в режиме только для чтения)
       * @returns {SBIS3.CONTROLS.Data.Format.Format}
       * @see format
       */
      getFormat: function () {
         return this._getFormat().clone();
      },

      /**
       * Добавляет поле в формат.
       * Если позиция не указана (или указана как -1), поле добавляется в конец формата.
       * Если поле с таким форматом уже есть, генерирует исключение.
       * @param {SBIS3.CONTROLS.Data.Format.Field|SBIS3.CONTROLS.Data.Format.FieldsFactory/FieldDeclaration.typedef} format Формат поля
       * @param {Number} [at] Позиция поля
       * @see format
       * @see removeField
       * @example
       * <pre>
       *    var record = new Record();
       *    record.addField({name: 'login', type: 'string'});
       *    record.addField({name: 'amount', type: 'money'});
       * </pre>
       * @example
       * <pre>
       *    var recordset = new RecordSet();
       *    recordset.addField(new StringField({name: 'login'}));
       *    recordset.addField(new MoneyField({name: 'amount'}));
       * </pre>
       */
      addField: function(format, at) {
         format = this._buildField(format);
         this._getFormat().add(format, at);
      },

      /**
       * Удаляет поле из формата по имени.
       * Если поля с таким именем нет, генерирует исключение.
       * @param {String} name Имя поля
       * @see format
       * @see addField
       * @see removeFieldAt
       * @example
       * <pre>
       *    record.removeField('login');
       * </pre>
       */
      removeField: function(name) {
         this._getFormat().removeField(name);
      },

      /**
       * Удаляет поле из формата по позиции.
       * Если позиция выходит за рамки допустимого индекса, генерирует исключение.
       * @param {Number} at Позиция поля
       * @see format
       * @see addField
       * @see removeField
       * @example
       * <pre>
       *    record.removeFieldAt(0);
       * </pre>
       */
      removeFieldAt: function(at) {
         this._getFormat().removeAt(at);
      },

      //endregion Public methods

      //region Protected methods

      /**
       * Возвращает адаптер по-умолчанию
       * @protected
       * @deprecated Метод _getDefaultAdapter() не рекомендуется к использованию и будет удален в 3.7.4. Используйте опцию adapter.
       */
      _getDefaultAdapter: function() {
         return 'adapter.json';
      },

      /**
       * Возвращает адаптер для сырых данных
       * @returns {SBIS3.CONTROLS.Data.Adapter.ITable|SBIS3.CONTROLS.Data.Adapter.IRecord}
       * @protected
       */
      _getRawDataAdapter: function () {
         if (!this._rawDataAdapter) {
            this._rawDataAdapter = this._createRawDataAdapter();
            if (this._options.rawData !== this._rawDataAdapter.getData()) {
               this._options.rawData = this._rawDataAdapter.getData();
            }
         }

         return this._rawDataAdapter;
      },

      /**
       * Создает адаптер для сырых данных
       * @returns {SBIS3.CONTROLS.Data.Adapter.ITable|SBIS3.CONTROLS.Data.Adapter.IRecord}
       * @protected
       */
      _createRawDataAdapter: function () {
         throw new Error('Method must be implemented');
      },

      /**
       * Сбрасывает адаптер для сырых данных
       * @protected
       */
      _resetRawDataAdapter: function () {
         this._rawDataAdapter = null;
      },

      /**
       * Возвращает список полей записи, полученный из "сырых" данных
       * @returns {Array.<String>}
       * @protected
       */
      _getRawDataFields: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает формат поля из адаптера сырых данных
       * @param {String} name Имя поля
       * @returns {SBIS3.CONTROLS.Data.Format.Field}
       * @protected
       */
      _getRawDataFormat: function(name) {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает формат полей
       * @returns {SBIS3.CONTROLS.Data.Format.Format}
       * @protected
       */
      _getFormat: function () {
         if (
            !this._options.format ||
            !$ws.helpers.instanceOfModule(this._options.format, 'SBIS3.CONTROLS.Data.Format.Format')
         ) {
            this._options.format = this._buildFormat(this._options.format);
         }
         return this._options.format;
      },

      /**
       * Очищает формат полей. Это можно сделать только если формат не был установлен явно.
       * @protected
       */
      _clearFormat: function (){
         if (this._directFormat) {
            throw new Error(this._moduleName + ': format can\'t be cleared because it\'s defined directly.');
         }
         this._options.format = null;
      },

      /**
       * Возвращает признак, что формат полей был установлен явно
       * @returns {Boolean}
       * @protected
       */
      _isDirectFormat: function () {
         return this._directFormat;
      },

      /**
       * Строит формат полей по описанию
       * @param {SBIS3.CONTROLS.Data.Format.Format|Array.<SBIS3.CONTROLS.Data.Format.FieldsFactory/FieldDeclaration.typedef>} format Описание формата
       * @returns {SBIS3.CONTROLS.Data.Format.Format}
       * @protected
       */
      _buildFormat: function(format) {
         if (!format) {
            var fields = null;
            try {
               fields = this._getRawDataFields();
            } catch (e) {
            }
            if (fields) {
               var i;
               format = new Format();
               for (i = 0; i < fields.length; i++) {
                  format.add(this._getRawDataFormat(fields[i]));
               }
            }
         }

         if (format && Object.getPrototypeOf(format) === Array.prototype) {
            format = FormatsFactory.create(format);
         }

         if (!format || !$ws.helpers.instanceOfModule(format, 'SBIS3.CONTROLS.Data.Format.Format')) {
            format = new Format();
         }

         return format;
      },

      /**
       * Строит формат поля по описанию
       * @param {SBIS3.CONTROLS.Data.Format.Field|SBIS3.CONTROLS.Data.Format.FieldsFactory/FieldDeclaration.typedef} format Описание формата поля
       * @returns {SBIS3.CONTROLS.Data.Format.Field}
       * @protected
       */
      _buildField: function(format) {
         if (
            typeof format === 'string' ||
            (format && !format.$constructor)
         ) {
            format = FieldsFactory.create(format);
         }
         if (!format || !$ws.helpers.instanceOfModule(format, 'SBIS3.CONTROLS.Data.Format.Field')) {
            throw new TypeError(this._moduleName + ': format should be an instance of SBIS3.CONTROLS.Data.Format.Field');
         }
         return format;
      }

      //endregion Protected methods
   };

   return FormattableMixin;
});
