define('js!SBIS3.CONTROLS.FormController', ['js!SBIS3.CORE.CompoundControl', 'js!SBIS3.CORE.LoadingIndicator', 'js!WS.Data/Entity/Record', 'js!WS.Data/Entity/Model', 'js!WS.Data/Source/SbisService', 'i18n!SBIS3.CONTROLS.FormController'],
   function(CompoundControl, LoadingIndicator, Record, Model, SbisService) {
   /**
    * Компонент, на основе которого создают диалоги редактирования записей.
    * Подробнее о создании диалогов вы можете прочитать в разделе документации <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/editing-dialog/">Диалоги редактирования</a>.
    *
    * @class SBIS3.CONTROLS.FormController
    * @extends $ws.proto.CompoundControl
    * @public
    * @author Красильников Андрей Сергеевич
    */
   'use strict';

   //Открыли FormController в новой вкладке
   function isOpenedFromNewTab(){
      return !$ws.helpers.instanceOfModule(this, 'SBIS3.CORE.FloatArea') && !$ws.helpers.instanceOfModule(this, 'SBIS3.CORE.Dialog');
   }

   var FormController = CompoundControl.extend([], /** @lends SBIS3.CONTROLS.FormController.prototype */ {
      /**
       * @typedef {Object} dataSource
       * @property {WS.Data/Source/ISource/Binding/typedef[]} [Binding] Соответствие методов CRUD+ контракту
       * @property {WS.Data/Source/ISource/Endpoint/typedef[]} [endpoint] Конечная точка, обеспечивающая доступ клиента к функциональным возможностям источника данных
       * @property {String} [model=source.sbis-service] Название зависимости, или конструктор объекта или инстанс объекта
       */
      /**
       * @event onFail Происходит в случае ошибки при сохранении или чтении записи из источника данных.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {Object} error Объект с описанием ошибки. В свойстве message хранится текст ошибки, например для вывода в пользовательский интерфейс.
       * @see submit
       * @see update
       * @see read
       * @see onCreateModel
       * @see onUpdateModel
       * @see onDestroyModel
       */
      /**
       * @event onReadModel Происходит при чтении записи из источника данных диалога редактирования.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Запись, прочитанная из источника данных (см. {@link dataSource}).
       * @see read
       * @see dataSource
       * @see onCreateModel
       * @see onUpdateModel
       * @see onDestroyModel
       * @see onFail
       */
      /**
       * @event onAfterFormLoad Происходит при показе панели с построеной версткой по установленной записи
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @see read
       * @see dataSource
       * @see onCreateModel
       * @see onUpdateModel
       * @see onDestroyModel
       * @see onFail
       */
      /**
       * @event onUpdateModel Происходит при сохранении записи в источнике данных диалога редактирования.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Сохраняемая запись.
       * @param {String} key Первичный ключ сохраняемой записи.
       * @see submit
       * @see update
       * @see onCreateModel
       * @see onDestroyModel
       * @see onReadModel
       * @see onFail
       */
      /**
       * @event onDestroyModel Происходит при удалении записи из источника данных диалога редактирования.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Запись, которая была удалена из источника данных (см. {@link dataSource}).
       * @see destroy
       * @see dataSource
       * @see onCreateModel
       * @see onUpdateModel
       * @see onReadModel
       * @see onFail
       */
      /**
       * @event onCreateModel Происходит при создании записи в источнике данных диалога редактирования.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Запись, которая была создана в источнике данных.
       * При создании часть полей может быть предустановлена с помощью опции {@link initValues}.
       * @see create
       * @see onDestroyModel
       * @see onUpdateModel
       * @see onReadModel
       * @see onFail
       */
      $protected: {
         _saving: false,
         _loadingIndicator: undefined,
         _panel: undefined,
         _newRecord: false, //true - если запись создана, но еще не сохранена
         _activateChildControlDeferred: undefined,
         _previousDocumentTitle: undefined,
         _dataSource: null,
         _isConfirmDialogShowed: false,
         _syncOperationCallback: undefined,
         _panelReadyDeferred: undefined,
         _overlay: undefined,
         _options: {
            /**
             * @cfg {String} Устанавливает первичный ключ записи, редактируемой на диалоге.
             * @remark
             * По данному ключу будет подгружена запись из источника данных, установленного опцией {@link dataSource}.
             * Если ключ не передан (null), то этот сценарий означает создание новой записи. Для новой записи можно предустановить значения в опции {@link initValues}.
             * </pre>
             * @see record
             * @see dataSource
             */
            key: null,
            /**
             * @cfg {WS.Data/Entity/Record} Устанавливает в контекст диалога редактируемую на диалоге запись.
             * @remark
             * Опция используется в том случае, когда не установлен источник данных диалога в опции {@link dataSource}.
             * Чтобы установить запись, используют метод {@link setRecord}, а чтобы получить - метод {@link getRecord}.
             * @see setRecord
             * @see getRecord
             * @see dataSource
             * @see key
             */
            record: null,
            /**
             * @cfg {Boolean} Устанавливает сохранение только изменённых полей.
             */
            diffOnly: false,
            /**
             * @cfg {Object} Устанавливает ассоциативный массив, который используют только при создании новой записи для инициализации её начальными значениями.
             * @remark
             * При редактировании существующей записи (первичный ключ не задан) опция будет проигнорирована.
             * Данные для инициализации могут быть переданы со стороны {@link SBIS3.CONTROLS.DialogActionBase} при вызове диалога редактирования.
             * Подробнее об этом вы можете прочитать в разделе документации <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/editing-dialog/component-control/">Управление диалогом редактирования списка</a>.
             * @example
             * Дополним создаваемую карточку товаров информация, что это новинка:
             * <pre>
             * _options: {
             *    initValue: {
             *       'Новинка': true
             *    }
             * }
             * </pre>
             * Или через вёрстку
             * <pre>
             * <options name="columns" type="array">
             *    <option name="Новинка" type="boolean">true</option>
             * </options>
             * </pre>
             */
            initValues: null,
             /**
             * @cfg {String} Устанавливает текст, отображаемый рядом с индикатором при сохранении записи.
             * @remark
             * Опция актуальна для события {@link onUpdateModel}.
             * @translatable
             * @see update
             * @see submit
             * @see onUpdateModel
             */
            indicatorSavingMessage:  rk('Подождите, идёт сохранение'),
            /**
             * @cfg {dataSource} Соответствие методов CRUD+ методам БЛ.
             */
            dataSource: {
            }
         }
      },

      $constructor: function(cfg) {
         this._newRecord = cfg.isNewRecord || false;
         this._publish('onFail', 'onReadModel', 'onUpdateModel', 'onDestroyModel', 'onCreateModel', 'onAfterFormLoad');
         this._declareCommands();
         this.subscribeTo($ws.single.EventBus.channel('navigation'), 'onBeforeNavigate', $ws.helpers.forAliveOnly(this._onBeforeNavigate, this));

         this._updateDocumentTitle();
         this._setDefaultContextRecord();
         this._panel = this.getTopParent();
         //для совместимости со старыми формами создает источник данных только если в опциях на прототипе есть данные об источнике данных
         //в противном случае люди сами устанавливать источник
         this._dataSource = this._options.source;
         if(this._options.dataSource && this._options.dataSource.endpoint) {
            this._dataSource = this._dataSource || FormController.prototype.createDataSource(this._options);
            if (!this._options.record){
               this._getRecordFromSource({});
            }
         }
         this._panel.subscribe('onBeforeClose', this._onBeforeCloseHandler);
         this._panelReadyDeferred = new $ws.proto.Deferred();
         this._panel.subscribe('onAfterShow', this._onAfterShowHandler);
      },

      _declareCommands: function(){
         $ws.single.CommandDispatcher.declareCommand(this, 'submit', this.submit);
         $ws.single.CommandDispatcher.declareCommand(this, 'read', this._read);
         $ws.single.CommandDispatcher.declareCommand(this, 'update', this.update);
         $ws.single.CommandDispatcher.declareCommand(this, 'destroy', this._destroyModel);
         $ws.single.CommandDispatcher.declareCommand(this, 'create', this._create);
         $ws.single.CommandDispatcher.declareCommand(this, 'notify', this._actionNotify);
         $ws.single.CommandDispatcher.declareCommand(this, 'activateChildControl', this._createChildControlActivatedDeferred);
      },

      _onAfterShowHandler: function(){
         //Если мы в новой вкладке браузера, то ничего не делаем
         if (isOpenedFromNewTab.call(this)){
            this._notifyOnAfterFormLoadEvent(); //Если открылись в новой вкладке, событие onAfterShow стреляет непосредственно для FC
            return;
         }
         var self = this._getTemplateComponent();
         self._updateIndicatorZIndex();
         self._notifyOnAfterFormLoadEvent();
      },

      _notifyOnAfterFormLoadEvent: function(){
         //Если у нас показалась панель и есть рекорд, то в этом случае верстка по установленной записи уже построена и мы просто кидаем событие
         //Если же записи нет, дожидаемся, когда получим ее с БЛ.
         if (this.getRecord()){
            this._actionNotify('onAfterFormLoad');
         }
         else{
            this._panelReadyDeferred.callback();
         }
      },

      _onBeforeCloseHandler: function(event, result){
         //Обработчик _onBeforeCloseHandler универсален: при фактической операции закрытия панели мы можем попасть сюда несколько раз, т.к.
         //при определенных условиях прерываем логику закрытия панели и/или сами вызываем команду на закрытие.
         //Есть 2 типовых операции, когда мы попадаем сюда несколько раз, прежде чем закрыться:
         //1: Открыли существующую запись, изменили в ней поля, пытаемся закрыться по крестику. Сначала мы прервем логику закрытия, чтобы показать диалог о сохранении.
         //Когда пользователь даст ответ сохранять или нет - сами вызовем метод закрытия и вернемся сюда.
         //2: Открыли новую запись, далее так же как и в п.1. после вопроса о сохранении приходим сюда, если выполняются условия для дестроя - прерываем логику закрытия,
         //ждем когда задестроится запись и после этого сами вызываем закрытие панели.
         //TODO: Сейчас нет механизма, позволяющего работать с панелью не через события и влиять на ее работу. хорошо бы такой иметь

         //Если мы в новой вкладке браузера, то ничего не делаем
         if (isOpenedFromNewTab.call(this)){
            return;
         }
         var self = this._getTemplateComponent(),
             record = self._options.record;
         //Если нет записи или она была удалена, то закрываем панель
         if (!record || (record.getState() === Record.RecordState.DELETED)){
            return;
         }
         //Если попали сюда из метода _saveRecord, то this._saving = true и мы просто закрываем панель
         if (self._saving || !record.isChanged()){
            //Дестроим запись, когда выполнены три условия
            //1. если это было создание
            //2. если есть ключ (метод создать его вернул)
            //3. ничего не поменяли в рекорде, но закрывают либо поменяли, но нажали нет
            if (self._newRecord && record.getId() && (!self._saving && !record.isChanged() || result === false)){
               self._destroyModel().addBoth(function(){
                  self._closePanel(result);
               });
               event.setResult(false);
            }
            self._saving = false;
            self._resetTitle();
            return;
         }
         event.setResult(false);
         self._saveRecord({});
      },

      _onBeforeNavigate: function(event, activeElement, isIconClick){
         //Если показан диалог о сохранении, то не даем перейти в другой раздел аккордеона, пока его не закроют
         if (!isIconClick) {
            event.setResult(!this._isConfirmDialogShowed);
         }
      },

      _setDefaultContextRecord: function(){
         var ctx = new $ws.proto.Context({restriction: 'set'}).setPrevious(this.getLinkedContext());
         ctx.setValue('record', this._options.record || new Record());
         this._context = ctx;
      },

      _updateDocumentTitle: function () {
         var record = this._options.record,
             newTitle = record && record.get('title');
         if (newTitle) {
            if (!this._previousDocumentTitle){
               this._previousDocumentTitle = document.title;
            }
            document.title = newTitle;
         }
      },

      _resetTitle: function(){
         if (this._previousDocumentTitle){
            document.title = this._previousDocumentTitle;
         }
      },

      /**
       * Используйте команду update.
       * @command
       * @see update
       * @deprecated
       */
      submit: function(closePanelAfterSubmit){
        $ws.single.ioc.resolve('ILogger').info('FormController', 'Command "submit" is deprecated and will be removed in 3.7.4. Use sendCommand("update")');
        return this.update(closePanelAfterSubmit);
      },

      _getRecordForUpdate: function () {
         if (!this._options.diffOnly){
            return this._options.record;
         }

         var record = this._options.record,
            changedRec = new Model({
               idProperty: record.getIdProperty(),
               adapter: record.getAdapter()
            }),
            changedFields = record.getChanged();
         changedFields.push(record.getIdProperty());

         $.each(changedFields, function(i, key){
            var formatIndex = record.getFormat().getFieldIndex(key);
            if (formatIndex > -1) {
               changedRec.addField(record.getFormat().at(formatIndex), undefined, record.get(key));
               if ($ws.helpers.instanceOfModule(record.getAdapter(), 'WS.Data/Adapter/Sbis')) {
                  var newFormatIndex = changedRec.getFormat().getFieldIndex(key);
                  //todo сделать нормальную сериализацию формата, щас не сериализуется поле связь и при копировании уходит как строка
                  changedRec.getRawData().s[newFormatIndex] = $ws.core.clone(record.getRawData().s[formatIndex]);
               }
            }
         });

         record.acceptChanges();
         return changedRec;
      },

      _setContextRecord: function(record){
         this.getLinkedContext().setValue('record', record);
      },
      /**
       * Показывает индикатор загрузки
       */
      _showLoadingIndicator: $ws.helpers.forAliveOnly(function(message){
         var self = this;
         message = message !== undefined ? message : this._options.indicatorSavingMessage;
         this._showedLoading = true;
         setTimeout(function(){
            if (self._showedLoading) {
               if (self._loadingIndicator && !self._loadingIndicator.isDestroyed()) {
                  self._loadingIndicator.setMessage(message);
               } else {
                  self._loadingIndicator = new LoadingIndicator({
                     parent: self._panel,
                     showInWindow: true,
                     modal: true,
                     message: message,
                     name: self.getId() + '-LoadingIndicator'
                  });
               }
            }
         }, 750);
      }),
      /**
       * Скрывает индикатор загрузки
       */
      _hideLoadingIndicator: function(){
         this._showedLoading = false;
         if(!this.isDestroyed() && this._loadingIndicator) {
            this._loadingIndicator.hide();
         }
      },
      _updateIndicatorZIndex: function(){
         var indicatorWindow = this._loadingIndicator && this._loadingIndicator.getWindow();
         if (indicatorWindow && this._loadingIndicator.isVisible()){
            indicatorWindow._updateZIndex();
         }
      },
      _processError: function(e) {
         var
            eResult = this._notify('onFail', e),
            eMessage = e && e.message;
         if(eResult || eResult === undefined) { // string, undefined
            if(typeof eResult == 'string') {
               eMessage = eResult;
            }
            if(eMessage) {
               $ws.helpers.alert(eMessage).addCallback(function(result){
                  if (e.httpError == 403){
                     this._closePanel();
                  }
               }.bind(this));
            }
         }
         e.processed = true;
         return e;
      },

      /**
       * Закрываем панель, в которой лежит formController
       * @param {*} result "Результат" закрытия панели - передаётся в соответствующее событие (onBeforeClose, onAfterClose).
       * @private
       */
      _closePanel: function(result){
         //Если задача открыта в новом окне, то FormController лежит не во floatArea => нет панели, которую нужно закрывать
         if (this._panel.close){
            this._panel.close(result);
         }
      },
      /**
       * Возвращает источник данных диалога редактирования.
       * @remark
       * Чтобы установить источник данных, используют метод {@link setDataSource}.
       * Также для диалога редактирования может быть по умолчанию установлен источник данных. Это происходит при его вызове через {@link SBIS3.CONTROLS.DialogActionBase}.
       * @example
       * В примере продемонстрирована задача изменения списочного метода источника данных
       * <pre>
       * var dataSource = this.getDataSource(); // Получаем объект источника данных
       * dataSource.setBindings({ // Устанавливаем метод чтения записи
       *    read: 'ПрочитатьКарточкуСотрудника'
       * });
       * @see dataSource
       * @see getDataSource
       */
      getDataSource: function(){
         return this._dataSource;
      },
      /**
       * Устанавливает источник данных диалогу редактирования.
       * @remark
       * Для диалога редактирования может быть по умолчанию установлен источник данных. Это происходит при вызове диалога через {@link SBIS3.CONTROLS.DialogActionBase}.
       * Чтобы получить объект источника данных, используют метод {@link getDataSource}.
       * @param {DataSource} source Источник данных.
       * @param {Object} config
       *    Структура конфига:
       *    {
       *      hideErrorDialog: Boolean,            //Не показывать сообещние при ошибке
       *      hideIndicator: Boolean               //Не показывать индикатор
       *    }
       * @example
       * <pre>
       *    var dataSource = new SbisService({ // Инициализация источника данных
       *       endpoint: 'Товар' // Устанавливаем объект бизнес-логики
       *    });
       *    this.setDataSource(dataSource); // Устанавливаем источник данных диалогу редактирования
       * </pre>
       * @see dataSource
       * @see getDataSource
       */
      setDataSource: function(source, config){
         $ws.single.ioc.resolve('ILogger').log('FormController', 'Метод setDataSource в скором времени будет удален, задать источник данных необходимо через конфигурацию dataSource');
         this._dataSource = source;
         return this._getRecordFromSource(config)
      },
      _setDataSource: function(source){
         this._dataSource = source;
      },
      /**
       * Устанавливает запись диалогу редактирования.
       * @remark
       * Новая запись будет добавление в контекст диалога редактирования в свойство "record".
       * @param {WS.Data/Entity/Model} record Запись источника данных.
       * @param {Boolean} [updateKey=false] Признак, по которому устанавливают необходимость обновления значения опции {@link key}.
       * @see record
       * @see key
       * @see getRecord
       */
      setRecord: function(record, updateKey){
         var newKey;
         this._options.record = record;
         if (updateKey){
            newKey = record.getId();
            this._options.key = newKey;
         }
         this._updateDocumentTitle();
         this._setContextRecord(record);
         var self = this;
         this._panelReadyDeferred.addCallback(function(){
            self._actionNotify('onAfterFormLoad');
         });
      },
      /**
       * Возвращает запись, установленную в контекст диалога редактирования.
       * @see record
       * @see key
       * @see setRecord
       */
      getRecord: function(){
        return this._options.record;
      },

      _getRecordFromSource: function(config) {
         if (this._options.key) {
            return this._read(config);
         }
         return this._create(config);
      },
      /**
       * Создать новую запись в источнике данных диалога редактирования.
       * @param {Object} config
       *    Структура конфига:
       *    {
       *      hideErrorDialog: Boolean,            //Не показывать сообещние при ошибке
       *      hideIndicator: Boolean               //Не показывать индикатор
       *     }
       * @remark
       * В новой записи часть полей может быть предустановлена с помощью опции {@link initValues}.
       * <br/>
       * В случае успешного создания записи в источнике данных происходит событие {@link onCreateModel}. Созданная запись устанавливается в контекст диалога редактирования.
       * <br/>
       * После создания новой записи фокус будет установлен на первый дочерний контрол диалога редактирования.
       * <br/>
       * Источник данных для диалога редактирования устанавливают с помощью опции {@link dataSource}.
       * @returns {WS.Data/Entity/Record|$ws.proto.Deferred} Созданная запись либо результат выполнения команды.
       * @command
       * @see read
       * @see update
       * @see destroy
       * @see notify
       * @see onCreateModel
       * @see onFail
       * @see dataSource
       */
      _create: function(config){
         var createConfig = {
               indicatorText: rk('Загрузка'),
               needSetRecord: true,
               needUpdateKey: true,
               eventName: 'onCreateModel',
               newRecord: true,
               activateChildControlAfterLoad: true
            };

         return this._prepareSyncOperation(this._dataSource.create(this._options.initValues), config, createConfig);
      },
      /**
       * Удалить запись из источника данных диалога редактирования.
       * @remark
       * При удалении происходит событие {@link onDestroyModel}.
       * <br/>
       * Источник данных для диалога редактирования устанавливают с помощью опции {@link dataSource}.
       * @command destroy
       * @see update
       * @see read
       * @see create
       * @see notify
       * @see onDestroyModel
       * @see dataSource
       */
      _destroyModel: function(){
         var record = this._options.record,
            destroyConfig = {
               hideIndicator: true,
               eventName: 'onDestroyModel',
               hideErrorDialog: true,
               newRecord: false
            },
            def = this._dataSource.destroy(record.getId());

         return this._prepareSyncOperation(def, {}, destroyConfig).addBoth(function(){
            record.setState(Record.RecordState.DELETED);
         });
      },

      /**
       * Прочитать запись по первичному ключу из источника данных диалога редактирования.
       * @param {Object} config
       *    Структура конфига:
       *    {
       *      key: String,                         //Ключ записи
       *      hideErrorDialog: Boolean,            //Не показывать сообещние при ошибке
       *      hideIndicator: Boolean               //Не показывать индикатор
       *     }
       * @remark
       * В случае успешного чтения записи из источника происходит событие {@link onReadModel}, а в случае ошибки - {@link onFail}. Прочитанная запись устанавливается в контекст диалога редактирования.
       * <br/>
       * Вне зависимости от результата прочтения записи из источника, фокус будет установлен на первый дочерний контрол диалога редактирования.
       * <br/>
       * Источник данных для диалога редактирования устанавливают с помощью опции {@link dataSource}.
       * @returns {$ws.proto.Deferred} Объект deferred, который возвращает результат чтения записи из источника.
       * @command
       * @see update
       * @see destroy
       * @see create
       * @see notify
       * @see onReadModel
       * @see onFail
       * @see dataSource
       */
      _read: function (config) {
         var readConfig = {
               indicatorText: rk('Загрузка'),
               needSetRecord: true,
               eventName: 'onReadModel',
               activateChildControlAfterLoad: true
            },
            key;

         //TODO Выпилить в 200, все должны уже блыи перейти на объект
         if (typeof(config) !== 'object'){
            key = config;
            config = {};
            $ws.single.ioc.resolve('ILogger').log('FormController', 'команда read в качестве аргумента принимает объект');
         }
         else {
            key = config.key;
         }
         key = key || this._options.key;
         return this._prepareSyncOperation(this._dataSource.read(key), config, readConfig);
      },

      /**
       * Сохранить запись в источнике данных диалога редактирования.
       * @param {Object} config
       *    Структура конфига:
       *    {
       *      closePanelAfterSubmit: Boolean,      //Закрывать панель после сохранения
       *      hideErrorDialog: Boolean,            //Не показывать сообещние при ошибке
       *      hideIndicator: Boolean               //Не показывать индикатор
       *     }
       * @remark
       * При сохранении записи происходит проверка всех валидаторов диалога редактирования.
       * Если на одном из полей ввода валидация будет не пройдена, то сохранение записи отменяется, и пользователь увидит сообщение "Некорректно заполнены обязательные поля!".
       * Подробнее о настройке валидаторов для полей ввода диалога редактирования вы можете прочитать в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/validation/">Валидация вводимых данных</a>.
       * <br/>
       * Если процесс сохранения записи происходит длительное время, то в пользовательском интерфейсе будет выведено сообщение "Подождите, идёт сохранение". Текст сообщения можно конфигурировать с помощью опции {@link indicatorSavingMessage}.
       * <br/>
       * При успешном сохранении записи происходит событие {@link onUpdateModel}, а в случае ошибки - {@link onFail}.
       * <br/>
       * Источник данных для диалога редактирования устанавливают с помощью опции {@link dataSource}.
       * @returns {WS.Data/Entity/Record|$ws.proto.Deferred} Созданная запись либо результат выполнения команды.
       * @example
       * В следующем примере организовано сохранение редактируемой записи по нажатию на кнопку:
       * <pre>
       * this.getChildControlByName('Сохранить').subscribe('onActivated', function() { // Создаём обработчик нажатися на кнопку сохранения на кнопку
       *    this.sendCommand('update'); // Отправляем команду для сохранения диалога редактирования
       * });
       * </pre>
       * @command
       * @see read
       * @see destroy
       * @see create
       * @see notify
       * @see onUpdateModel
       * @see onFail
       * @see dataSource
       */
      update: function(config){
         if (typeof(config) !== 'object'){
            config = {
               closePanelAfterSubmit: config
            };
            $ws.single.ioc.resolve('ILogger').log('FormController', 'команда update в качестве аргумента принимает объект');
         }
         config.hideQuestion = true;
         return this._saveRecord(config);
      },

      _saveRecord: function(config){
         var self = this,
            dResult = new $ws.proto.Deferred(),
            questionConfig;

         questionConfig = {
            useCancelButton: true,
            invertDefaultButton: true,
            detail: rk('Чтобы продолжить редактирование, нажмите "Отмена".')
         };
         this._saving = true;

         //Если пришли из update
         if (config.hideQuestion){
            return this._updateRecord(dResult, config);
         }
         else{
            this._isConfirmDialogShowed = true;
            $ws.helpers.question(rk('Сохранить изменения?'), questionConfig, this).addCallback(function(result){
               self._isConfirmDialogShowed = false;
               if (typeof result === 'string'){
                  self._saving = false;
                  return;
               }
               if (result){
                  config.closePanelAfterSubmit = true;
                  self._updateRecord(dResult, config);
               }
               else{
                  dResult.callback();
                  self._closePanel(false);
               }
            });
         }
         return dResult;
      },

      _updateRecord: function(dResult, config){
         var errorMessage = rk('Некорректно заполнены обязательные поля!'),
            additionalData = {
               isNewRecord: this._newRecord
            },
            updateConfig = {
               indicatorText: this._options.indicatorSavingMessage,
               eventName: 'onUpdateModel',
               additionalData: additionalData,
               newRecord: false
            },
            self = this,
            def;
         if (this.validate()) {
            if (this._options.record.isChanged() || self._newRecord) {
               def = this._prepareSyncOperation(this._dataSource.update(this._getRecordForUpdate()), config, updateConfig);
               dResult.dependOn(def.addErrback(function (error) {
                  self._saving = false;
                  return error;
               }));
            } else {
               dResult.callback();
            }
            dResult.addCallback(function(result){
               if (config.closePanelAfterSubmit) {
                  self._closePanel(true);
               }
               else {
                  self._saving = false;
               }
               return result;
            });
         }
         else {
            if (!config.hideErrorDialog) {
               var error = new Error(errorMessage);
               this._processError(error);
            }
            dResult.errback(errorMessage);
            this._saving = false;
         }
         return dResult;
      },

      _prepareSyncOperation: function(operation, commonConfig, operationConfig){
         var self = this,
             config = $ws.core.clone(commonConfig || {});
         config = $ws.core.merge(commonConfig, operationConfig);

         if (!config.hideIndicator){
            this._showLoadingIndicator(config.indicatorText);
         }
         this._toggleOverlay(true);
         this._addSyncOperationPending();
         operation.addCallback(function(record){
            if (config.needSetRecord){
               self.setRecord(record, config.needUpdateKey);
            }
            self._notify(config.eventName, self._options.record, config.additionalData);
            if (config.hasOwnProperty('newRecord')){
               self._newRecord = config.newRecord;
            }
            return record;
         }).addErrback(function(err){
               if (!config.hideErrorDialog && (err instanceof Error)){
                  self._processError(err);
               }
               return err;
         }).addBoth(function(result){
               self._removeSyncOperationPending();
               self._hideLoadingIndicator();
               self._toggleOverlay(false);
               if (config.activateChildControlAfterLoad){
                  self._activateChildControlAfterLoad();
               }
               return result;
         });
         return operation;
      },

      _toggleOverlay: function(show){
         if (!this._overlay){
            this._overlay = $('<div class="controls-FormController-overlay ws-hidden"></div>').appendTo(this.getContainer());
         }
         this._overlay.toggleClass('ws-hidden', !show);
      },

      _addSyncOperationPending: function(){
         this._removeSyncOperationPending();
         this._syncOperationCallback = new $ws.proto.Deferred();
         this._panel.addPendingOperation(this._syncOperationCallback);
      },
      _removeSyncOperationPending: function(){
         if (this._syncOperationCallback && !this._syncOperationCallback.isReady()){
            this._syncOperationCallback.callback();
         }
      },
      /**
       * Инициировать событие без выполнения базовой логики диалога редактирования.
       * @remark
       * Команда применяется для того, чтобы логика обработки события производилась на стороне {@link SBIS3.CONTROLS.DialogActionBase}.
       * @param {String} eventName Имя события, о котором нужно оповестить {@link SBIS3.CONTROLS.DialogActionBase}.
       * @param {*} additionalData Данные, которые должны быть проброшены в событие {@link SBIS3.CONTROLS.DialogActionBase}.
       * @command notify
       * @see read
       * @see create
       * @see update
       * @see destroy
       */
      _actionNotify: function(eventName, additionalData){
         this._notify(eventName, this._options.record, additionalData);
      },
      /**
       * Выставить активность дочернего контрола после загрузки
       * @returns {$ws.proto.Deferred} Окончание чтения/создания модели
       * @remark
       * <br>
       * Для выставления активности нужному контролу вызываем команду activateChildControl, которая вернет deferred, на который надо подписаться, чтобы выполнить необходимую логику
       * @example
       * В следующем примере организован переход фокуса после загрузки диалога на компонент textBox:
       * <pre>
       *    component.sendCommand('activateChildControl').addCallback(function(){
       *       textBox.getContainer().focus();
       *    });
       * </pre>
       * @command activateChildControl
       */
      _createChildControlActivatedDeferred: function(){
         this._activateChildControlDeferred = (new $ws.proto.Deferred()).addCallback(function(){
            this.activateFirstControl();
         }.bind(this));
         return this._activateChildControlDeferred;
      },
      _activateChildControlAfterLoad: function(){
         if (this._activateChildControlDeferred instanceof $ws.proto.Deferred){
            this._activateChildControlDeferred.callback();
            this._activateChildControlDeferred = undefined;
         }
         else{
            this.activateFirstControl();
         }
      },

      destroy: function(){
         this._panel.unsubscribe('onAfterShow', this._onAfterShowHandler);
         this._panel.unsubscribe('onBeforeClose', this._onBeforeCloseHandler);
         FormController.superclass.destroy.apply(this, arguments);
      }
   });
      //todo Костыль, позволяющий с прототипа компонента вычитать запись до инициализации компонента и прокинуть ее в опции. Сделано в рамках ускорения
      FormController.prototype.getRecordFromSource = function (opt) {
         var prototypeProtectedData = {},
             result;
         this._initializer.call(prototypeProtectedData); //На прототипе опции не доступны, получаем их через initializer
         var options = prototypeProtectedData._options;
         $ws.core.merge(options, opt);
         if (!$ws.helpers.instanceOfModule(options.source, 'WS.Data/Source/Base')) {
            options.source = opt.source = this.createDataSource(options);
         }
         if (options.key){
            result = options.source.read(options.key);
         }
         else{
            result = options.source.create(options.initValues);
            result.isNewRecord = true;
         }
         return result;
      };

      FormController.prototype.createDataSource = function(options){
         if (!$ws.helpers.instanceOfModule(options.source, 'WS.Data/Source/Base')) {
            return new SbisService(options.dataSource);
         }
      };
   return FormController;

});