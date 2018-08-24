define('SBIS3.CONTROLS/Action/List/OpenEditDialog', [
      'SBIS3.CONTROLS/Action/OpenDialog',
      'Core/core-instance',
      'Core/core-merge',
      'Core/Indicator',
      'Core/Deferred',
      'WS.Data/Entity/Record',
      'WS.Data/Di',
      'SBIS3.CONTROLS/Action/Utils/OpenDialogUtil'
   ], function (OpenDialog, cInstance, cMerge, cIndicator, Deferred, Record, Di, OpenDialogUtil) {
   'use strict';

   /**
    * Класс, описывающий действие открытия окна с заданным шаблоном. Применяется для работы с <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/">диалогами редактирования списков</a>.
    * @class SBIS3.CONTROLS/Action/List/OpenEditDialog
    * @extends SBIS3.CONTROLS/Action/OpenDialog
    * @author Красильников А.С.
    *
    * @ignoreOptions validators independentContext contextRestriction extendedTooltip
    * @ignoreOptions visible tooltip tabindex enabled className alwaysShowExtendedTooltip allowChangeEnable
    *
    * @ignoreMethods activateFirstControl activateLastControl addPendingOperation applyEmptyState applyState clearMark
    * @ignoreMethods changeControlTabIndex destroyChild detectNextActiveChildControl disableActiveCtrl findParent
    * @ignoreMethods focusCatch getActiveChildControl getChildControlById getChildControlByName getChildControls
    * @ignoreMethods getClassName getContext getEventBusOf getEventHandlers getEvents getExtendedTooltip getOpener
    * @ignoreMethods getImmediateChildControls getLinkedContext getNearestChildControlByName getOwner getOwnerId
    * @ignoreMethods getReadyDeferred getStateKey getTabindex getUserData getValue hasActiveChildControl hasChildControlByName
    * @ignoreMethods hasEventHandlers isActive isAllReady isDestroyed isMarked isReady makeOwnerName setOwner setSize
    * @ignoreMethods markControl moveFocus moveToTop once registerChildControl registerDefaultButton saveToContext
    * @ignoreMethods sendCommand setActive setChildActive setClassName setExtendedTooltip setOpener setStateKey activate
    * @ignoreMethods setTabindex setTooltip setUserData setValidators setValue storeActiveChild subscribe unregisterChildControl
    * @ignoreMethods unregisterDefaultButton unsubscribe validate waitAllPendingOperations waitChildControlById waitChildControlByName
    * @ignoreMethods setVisible toggle show isVisible hide getTooltip isAllowChangeEnable isEnabled isVisibleWithParents
    * @ignoreMethods addOwnedContext canAcceptFocus describe getAlignment getContainer getEditRecordDeferred getId getMinHeight
    * @ignoreMethods getMinSize getMinWidth getName getParent getParentByClass getParentByName getParentWindow getProperty
    * @ignoreMethods getTopParent hasEvent init initializeProperty isCanExecute isInitialized isSubControl runInPropertiesUpdate
    * @ignoreMethods setAllowChangeEnable setEnabled setProperties setProperty subscribeOnceTo subscribeTo unbind unsubscribeFrom
    *
    * @ignoreEvents onActivate onAfterLoad onBeforeControlsLoad onBeforeLoad onChange onClick onPropertyChanged
    * @ignoreEvents onFocusIn onFocusOut onKeyPressed onReady onResize onStateChanged onTooltipContentRequest
    * @ignoreEvents onDragIn onDragMove onDragOut onDragStart onDragStop onCommandCatch onDestroy onPropertiesChanged
    *
    * @control
    * @public
    * @category Actions
    * @initial
    * <component data-component="SBIS3.CONTROLS/Action/List/OpenEditDialog">
    * </component>
    */
   var OpenEditDialog = OpenDialog.extend(/** @lends SBIS3.CONTROLS/Action/List/OpenEditDialog.prototype */{
      /**
       * @event onUpdateModel Происходит при сохранении записи в источнике данных диалога.
       * Событие происходит перед тем, как компонент выполняет синхронизацию изменений со связанным списком, если такой установлен в опции linkedObject.
       * Такая синхронизация выполняется каждый раз при удалении или редактировании записи.
       * В обработчике события onUpdateModel можно отметить базовую логику сохранения записи (см. {@link /doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/synchronization/ Синхронизация изменений со списком} )
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Экземпляр класса записи.
       * @param {Object} additionalData Метаданные. Служебная информация, необходимая для синхронизации Действия.
       * @param {String} additionalData.key Идентификатор сохранённой записи.
       * @param {String} additionalData.idProperty Имя поля записи, в котором хранится первичный ключ. Значение параметра извлекается из опции idProperty.
       * @param {Boolean} additionalData.isNewRecord Признак "Новая запись", который означает, что запись инициализирована в источнике данных, но не сохранена.
       * Когда параметр установлен в значение true, это значит что запись не существует в источнике данных. Значение false говорит об уже существующей в БД записи.
       * Параметр используется в прикладных целях при создании обработчиков на событие.
       */
      /**
       * @event onDestroyModel Происходит при удалении записи из источника данных диалога.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Экземпляр класса записи.
       */
      /**
       * @event onCreateModel Происходит при создании записи в источнике данных диалога.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Экземпляр класса записи.
       */
      /**
       * @event onReadModel Происходит при чтении записи из источника данных диалога.
       * @param {Core/EventObject} eventObject Дескриптор события.
       * @param {WS.Data/Entity/Record} record Экземпляр класса записи.
       */
      $protected: {
         _options: {
            /**
             * @cfg {*|SBIS3.CONTROLS/Mixins/DSMixin|WS.Data/Collection/IList} Устанавливает список, связанный с диалогом редактирования.
             * @remark
             * Для связанного списка автоматическиприменяется <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/synchronization/">синхронизация изменений</a>.
             * @see setLinkedObject
             * @see getLinkedObject
             */
            linkedObject: undefined,
            /**
             * @cfg {String} Устанавливает <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/initializing-way/">способ инициализации данных</a> диалога редактирования.
             * @variant local
             * @variant remote
             * @variant delayedRemote
             */
            initializingWay: 'remote',
            /**
             * @cfg {String} Устанавливает поле записи, в котором хранится url-страницы с диалогом редактирования. При вызове {@link execute}, когда нажата клавиша Ctrl, будет открыта новая вкладка веб-браузера с указанным адресом. Создание url - это задача прикладного разработчика.
             */
            urlProperty: '',

            //Закрытие работает на основе внутреннего алгоритма, а не системе фокусов
            closeByFocusOut: false
         },
         /**
          * Ключ модели из связного списка
          * Отдельно храним ключ для модели из связного списка, т.к. он может не совпадать с ключом редактируемой модели
          * К примеру в реестре задач ключ записи в реестре и ключ редактируемой записи различается, т.к. одна и та же задача может находиться в нескольких различных фазах
          */
         _linkedModelKey: undefined,
         _overlay: undefined,
         _setOpeningModeHandler: undefined,
         _showedLoading: false,
         _openInNewTab: false
      },
      $constructor: function() {
         this._publish('onUpdateModel', 'onDestroyModel', 'onCreateModel', 'onReadModel');
         this._clearVariables = this._clearVariables.bind(this);
      },
      init: function () {
         OpenEditDialog.superclass.init.apply(this, arguments);
         this._setOpeningModeHandler = this._setOpeningMode.bind(this);
         $(document).bind('keydown keyup', this._setOpeningModeHandler);
      },
      _needCloseDialog: function(target) {
         var linkedObjectContainer = this.getLinkedObject() && this.getLinkedObject().getContainer && this.getLinkedObject().getContainer();
         var isClickOnLinkedObject = $(target).closest(linkedObjectContainer).length;

         if (!isClickOnLinkedObject) {
            return OpenEditDialog.superclass._needCloseDialog.apply(this, arguments);
         }
         return false;
      },
      /**
       * Устанавливает список, связанный с диалогом редактирования.
       * @remark
       * Для связанного списка автоматическиприменяется <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/synchronization/">синхронизация изменений</a>.
       * @param {*|SBIS3.CONTROLS/Mixins/DSMixin|WS.Data/Collection/IList} linkedObject Экземпляр класса <a href="/doc/platform/developmentapl/interface-development/components/list/list-settings/">списка</a>.
       * @see linkedObject
       * @see getLinkedObject
       */
      setLinkedObject: function(linkedObject){
         this._options.linkedObject = linkedObject;
      },
       /**
        * Возвращает экземпляр класса списка, который связан с диалогом редактирования.
        * @remark
        * Для связанного списка автоматическиприменяется <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/synchronization/">синхронизация изменений</a>.
        * @returns {*|SBIS3.CONTROLS/Mixins/DSMixin|WS.Data/Collection/IList} linkedObject Экземпляр класса <a href="/doc/platform/developmentapl/interface-development/components/list/list-settings/">списка</a>.
        * @see linkedObject
        * @see setLinkedObject
        */
      getLinkedObject: function() {
         return this._options.linkedObject;
      },
      /**
       * Должен вернуть ключ записи, которую редактируем в диалоге
       */
      _getEditKey: function(item){
      },
      _setOpeningMode: function(event){
         this._openInNewTab = event.ctrlKey;
      },
      _needOpenInNewTab: function(){
         return this._openInNewTab;
      },

      _openComponent:function(meta, mode) {
         var openUrl = meta.item && meta.item.get(this._options.urlProperty);

         if (this._needOpenInNewTab() && openUrl) {
            window.open(openUrl);
         }
         else if (this._isNeedToRedrawDialog()) {
            this._saveRecord().addCallback(function () {
               OpenEditDialog.superclass._openComponent.call(this, meta, mode);
            }.bind(this));
         }
         else {
            OpenEditDialog.superclass._openComponent.call(this, meta, mode);
         }
      },

      _saveRecord: function(){
         var
             self = this,
             args = arguments,
             resultDeferred = new Deferred(),
             templateComponent,
             currentRecord;

         templateComponent = this._dialog._getTemplateComponent();
         currentRecord = templateComponent ? templateComponent.getRecord() : null;
         if (currentRecord && currentRecord.isChanged()){
            require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function(InformationPopupManager){
               InformationPopupManager.showConfirmDialog({
                     message: rk('Сохранить изменения?')
                  },
                  self._confirmDialogHandler.bind(self, true, resultDeferred, templateComponent, args),
                  self._confirmDialogHandler.bind(self, false, resultDeferred, templateComponent, args)
               );
            });
            return resultDeferred;
         }
         else{
            return resultDeferred.callback();
         }
      },

      _confirmDialogHandler: function(result, resultDeferred, templateComponent){
         if (result){
            templateComponent.update({hideQuestion: true}).addCallback(function(){
               resultDeferred.callback();
            });
         }
         else {
            resultDeferred.callback();
         }
      },

      _setModelId: function(meta){
         this._linkedModelKey = meta.id;
         //Производим корректировку идентификатора только в случае, когда идентификатор передан
         if (meta.hasOwnProperty('id')) {
            //Если передали ключ из getEditKey - значит FC будет работать с новой записью,
            //вычитанной по этому ключу
            meta.id = this._getEditKey(meta.item) || meta.id;
         }

      },

      _createComponent: function(config, meta){
         var initializingWay = config.componentOptions.initializingWay,
             dialogComponent = config.template,
             self = this;

         function wayRemote(templateComponent) {
            return self._remoteWayCallback(config, meta, templateComponent).addCallback(function () {
               OpenEditDialog.superclass._createComponent.call(self, config, meta);
            });
         }

         function wayDelayedRemove(templateComponent) {
            var def = self._delayedRemoteWayCallback(config, meta, templateComponent);
            OpenEditDialog.superclass._createComponent.call(self, config, meta);
            return def;
         }

         if(initializingWay == OpenEditDialog.INITIALIZING_WAY_REMOTE || initializingWay == OpenEditDialog.INITIALIZING_WAY_DELAYED_REMOTE) {
            this._showLoadingIndicator();
            require([dialogComponent], function(templateComponent) {
               var def;
               if(initializingWay == OpenEditDialog.INITIALIZING_WAY_REMOTE) {
                  def = wayRemote(templateComponent);
               } else {
                  def = wayDelayedRemove(templateComponent);
               }
               def.addErrback(function (error) {
                  self._hideLoadingIndicator();
                  self._finishExecuteDeferred(error);
                  return error;
               });
            });
         } else {
            OpenEditDialog.superclass._createComponent.call(this, config, meta)
         }
      },

      _delayedRemoteWayCallback: function(config, meta, templateComponent){
         var deferred = this._getRecordDeferred(config, templateComponent);
         if (deferred){
            config.componentOptions._receiptRecordDeferred = deferred;
         }
         return new Deferred().callback();
      },

      _getRecordDeferred: function(config, templateComponent) {
         var getRecordProtoMethod = templateComponent.prototype.getRecordFromSource;
         return getRecordProtoMethod.call(templateComponent.prototype, config.componentOptions);
      },

      _remoteWayCallback: function (config, meta, templateComponent) {
         var self = this,
            options,
            isNewRecord = (meta.isNewRecord !== undefined) ? meta.isNewRecord : !config.componentOptions.key,
            deferred;
         var getRecordProtoMethod = templateComponent.prototype.getRecordFromSource;
         if (getRecordProtoMethod) {
            deferred = this._getRecordDeferred(config, templateComponent);
            if (deferred) {
               return deferred.addCallback(function (record) {
                  config.componentOptions.record = record;
                  config.componentOptions.isNewRecord = isNewRecord;
                  if (isNewRecord) {
                     options = OpenDialogUtil.getOptionsFromProto(templateComponent, 'getComponentOptions', config.componentOptions);
                     config.componentOptions.key = self._getRecordId(record, options.idProperty);
                  }
                  return record;
               });
            }
            return new Deferred().callback();
         }
         else {
            return new Deferred().callback();
         }
      },
      /**
       *
       * @param meta
       * @returns {Deferred}
       */
      getEditRecordDeferred: function(meta) {
         var deferred = new Deferred(),
             config = this._getDialogConfig(meta),
             self = this;
         require([config.template], function(templateComponent) {
            var recordDef = self._getRecordDeferred(config, templateComponent);
            if (recordDef) {
               deferred.dependOn(recordDef);
            }
            else {
               deferred.errback(new Error('Для получения записи необходимо задать опцию dataSource'));
            }
         });
         return deferred;
      },

      _showLoadingIndicator: function() {
         this._toggleOverlay(true);
         //TODO VDOM
         this._isIndicatorShowed = true;
         cIndicator.setMessage(rk('Загрузка'), true);
     },

      _hideLoadingIndicator: function() {
         this._toggleOverlay(false);
         if (this._isIndicatorShowed) {
            //TODO VDOM
            cIndicator.hide();
            this._isIndicatorShowed = false;
         }
       },

      _handleError: function(error) {
         if (!error.processed) {
            //Не показываем ошибку, если было прервано соединение с интернетом
            if (!error._isOfflineMode) {
               OpenDialogUtil.errorProcess(error);
            }
         }
      },

      _toggleOverlay: function(show){
         //При вызове execute, во время начала асинхронных операций при выставленной опции initializingWay = 'remote' || 'delayedRemote',
         //закрываем оверлеем весь боди, чтобы пользователь не мог взаимодействовать с интерфейсом, пока не загрузится диалог редактирования,
         //иначе пока не загрузилась одна панель, мы можем позвать открытие другой, что приведет к ошибкам.
         if (!this._overlay) {
            this._overlay = $('<div class="controls-OpenDialogAction-overlay ws-hidden"></div>');
            this._overlay.css({
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               'z-index': 9999,
               opacity: 0
            });
            this._overlay.appendTo('body');
         }
         this._overlay.toggleClass('ws-hidden', !show);
      },

      _buildComponentConfig: function (meta) {
         this._setModelId(meta);
         //Если запись в meta-информации отсутствует, то передаем null. Это нужно для правильной работы DataBoundMixin с контекстом и привязкой значений по имени компонента
         var record = (cInstance.instanceOfModule(meta.item, 'WS.Data/Entity/Record') ? meta.item.clone() : meta.item) || null,
             baseConfig = OpenEditDialog.superclass._buildComponentConfig.apply(this, arguments),
             componentConfig = {
               isNewRecord: !!meta.isNewRecord,
               source: meta.source,
               record: record,
               handlers: this._getFormControllerHandlers(),
               initializingWay: meta.initializingWay || this._options.initializingWay
            };

         //Если этих опций нет в meta - не добавляем их, т.к. они могут быть объявлены на опциях FC. Иначе опции FC перетрутся пустыми значениями при получении записи с прототипного метода.
         if (meta.readMetaData){
            componentConfig.readMetaData = meta.readMetaData;
         }
         if (meta.id){
            componentConfig.key = meta.id;
         }
         if (meta.filter){
            componentConfig.initValues = meta.filter;
         }
         if (meta.dataSource){
            componentConfig.dataSource = meta.dataSource;
         }
         cMerge(componentConfig, baseConfig);
         //Мы передаем клон записи из списка. После того, как мы изменим ее поля и сохраним, запись из связного списка будет помечена измененной,
         //т.к. при синхронизации мы изменили ее поля. При повторном открытии этой записи на редактирование, она уже будет помечена как измененная =>
         //ненужный вопрос о сохранении, если пользователь сразу нажмет на крест.
         //Делам так, чтобы отслеживать изменения записи только в момент работы FC.
         if (record) {
            record.acceptChanges();
         }
         return componentConfig;
      },
      /**
       * Возвращает обработчики на события formController'a
       */
      _getFormControllerHandlers: function(){
         return {
            onReadModel: this._actionHandler.bind(this, 'onReadModel'),
            onUpdateModel: this._actionHandler.bind(this, 'onUpdateModel'),
            onDestroyModel: this._actionHandler.bind(this, 'onDestroyModel'),
            onCreateModel: this._actionHandler.bind(this, 'onCreateModel')
         }
      },

      /**
       * Переопределяемый метод
       * В случае, если все действия выполняются самостоятельноно, надо вернуть OpenEditDialog.ACTION_CUSTOM, чтобы
       * не выполнялась базовая логика
       * @param model Запись, с которой работаем
       * @returns {String|Deferred} Сообщаем, нужно ли выполнять базовую логику. Если не нужно, то возвращаем OpenEditDialog.ACTION_CUSTOM
       */
      _onUpdateModel: function(model){
      },
      /**
       * Базовая логика при событии ouUpdate. Обновляем рекорд в связном списке
       */
      _updateModel: function (model, additionalData) {
         if (additionalData.isNewRecord){
            this._createRecord(model, additionalData.at || 0, additionalData);
         }
         else{
            this._mergeRecords(model, null, additionalData);
         }
      },

      /**
       * Переопределяемый метод
       * В случае, если все действия выполняются самостоятельноно, надо вернуть OpenEditDialog.ACTION_CUSTOM, чтобы
       * не выполнялась базовая логика
       * @param model Запись, с которой работаем
       * @returns {String|Deferred} Сообщаем, нужно ли выполнять базовую логику. Если не нужно, то возвращаем OpenEditDialog.ACTION_CUSTOM
       */
      _onReadModel: function(model){
      },
      _readModel: function(model){
      },

      /**
       * Переопределяемый метод
       * В случае, если все действия выполняются самостоятельноно, надо вернуть OpenEditDialog.ACTION_CUSTOM, чтобы
       * не выполнялась базовая логика
       * @param model Запись, с которой работаем
       * @returns {String|Deferred} Сообщаем, нужно ли выполнять базовую логику. Если не нужно, то возвращаем OpenEditDialog.ACTION_CUSTOM
       */
      _onDestroyModel: function(model){
      },
      /**
       * Базовая логика при событии ouDestroy. Дестроим рекорд в связном списке
       */
      _destroyModel: function(model, additionalData) {
         var collectionRecord = this._getCollectionRecord(model, additionalData),
             collection = this.getLinkedObject();
         if (!collectionRecord){
            return;
         }
         //Уберём удаляемый элемент из массива выбранных у контрола, являющегося linkedObject.
         if (cInstance.instanceOfMixin(collection, 'SBIS3.CONTROLS/Mixins/MultiSelectable')) {
            collection.removeItemsSelection([this._getRecordId(collectionRecord, additionalData.idProperty)]);
         }
         if (cInstance.instanceOfModule(collection.getItems && collection.getItems(), 'WS.Data/Collection/RecordSet')) {
            collection = collection.getItems();
         }
         collection.remove(collectionRecord);
      },

      /**
       * Переопределяемый метод
       * В случае, если все действия выполняются самостоятельноно, надо вернуть OpenEditDialog.ACTION_CUSTOM, чтобы
       * не выполнялась базовая логика
       * @param model Запись, с которой работаем
       * @returns {String|Deferred} Сообщаем, нужно ли выполнять базовую логику. Если не нужно, то возвращаем OpenEditDialog.ACTION_CUSTOM
       */
      _onCreateModel: function(model){
      },
      /**
       * Обработка событий formController'a. Выполнение переопределяемых методов и notify событий.
       * Если из обработчиков событий и переопределяемых методов вернули не OpenEditDialog.ACTION_CUSTOM, то выполняем базовую логику.
       */
      _actionHandler: function(eventName, event, model, additionalData) {
         var args = Array.prototype.slice.call(arguments, 2), //Обрежем event аргументы, их не нужно прокидывать в события и переопределяемый метод
             eventResult = this._notify.apply(this, [eventName].concat(args)),
             actionResult = eventResult,
             methodResult;

         if (eventResult !== OpenEditDialog.ACTION_CUSTOM) {
            methodResult  = this['_' + eventName].apply(this, args);
            actionResult = methodResult || eventResult;
         }

         if (actionResult !== OpenEditDialog.ACTION_CUSTOM && this.getLinkedObject()) {
            if (actionResult instanceof Deferred){
               actionResult.addCallback(function(result){
                  this._processingResult(eventName, result, model, additionalData);
               }.bind(this))
            } else {
               this._processingResult(eventName, actionResult, model, additionalData);
            }
         }
      },

      _processingResult: function (eventName, result, editModel, additionalData) {
         var genericMethods = {
               onDestroyModel: '_destroyModel',
               onUpdateModel: '_updateModel',
               onReadModel: '_readModel'
            },
            self = this,
            genericMethod = genericMethods[eventName];

         if (cInstance.instanceOfModule(result, 'WS.Data/Collection/RecordSet')) {
            if (additionalData.isNewRecord) { //Создание
               additionalData.isNewRecord = false;
               additionalData.ignoreLinkedModelKey = true;
               result.each(function (record) {
                  self._createRecord(record, 0, additionalData);
               });
            }
            else { //Сохранение
               if (result.getCount()) {
                  additionalData.ignoreLinkedModelKey = true;
                  result.each(function (record) {
                     self._mergeRecords(record, null, additionalData);
                  });
               }
               else {
                  this._destroyModel(editModel);
               }
            }
         }
         else if (cInstance.instanceOfModule(result, 'WS.Data/Entity/Record')) {
            if (additionalData.isNewRecord) { //Создание
               self._createRecord(result, 0, additionalData);
            }
            else {
               self._mergeRecords(result, null, additionalData);
            }
         }
         else {
            genericMethod = result || genericMethod;
            if (this[genericMethod]) {
               this[genericMethod](editModel, additionalData);
            }
         }
      },

      _createRecord: function(model, at, additionalData){
         var collection = this.getLinkedObject(),
             rec;
         at = at || 0;
         if (cInstance.instanceOfModule(collection.getItems(), 'WS.Data/Collection/RecordSet')) {
            //Создаем новую модель, т.к. Record не знает, что такое первичный ключ - это добавляется на модели.
            rec = Di.resolve(collection.getItems().getModel(), {
               adapter: collection.getItems().getAdapter(),
               format: collection.getItems().getFormat(),
               idProperty: collection.getItems().getIdProperty()
            });
            this._mergeRecords(model, rec, additionalData);
         } else  {
            rec = model.clone();
         }
         if (cInstance.instanceOfMixin(collection, 'WS.Data/Collection/IList')) {
            collection.add(rec, at);
         }
         else {
            if (collection.getItems()){
               collection.getItems().add(rec, at);
            }
            else{
               if (collection.isLoading()){
                  collection.once('onItemsReady', function(){
                     this.getItems().add(rec, at);
                  });
               }
               else{
                  collection.setItems([rec]);
               }
            }
         }
      },

      _deepMergeRecords: function(model, additionalData) {
         additionalData.deepMerge = true;
         this._updateModel(model, additionalData);
      },

      /**
       * Мержим поля из редактируемой записи в существующие поля записи из связного списка.
       */
      _mergeRecords: function(editRecord, colRec, additionalData){
         var collectionRecord = colRec || this._getCollectionRecord(editRecord, additionalData);

         if (collectionRecord) {
            if (additionalData.isNewRecord) {
               collectionRecord.set(this._getCollectionData().getIdProperty(), additionalData.key);
            }
            this._mergeRecord(collectionRecord, editRecord, additionalData);
         }
      },

      _mergeRecord: function(collectionRecord, editRecord, additionalData) {
         var recValue,
             values = {},
             self = this;
         Record.prototype.each.call(collectionRecord, function (key, value) {
            if(editRecord.has(key)){
               recValue = editRecord.get(key);
               if (additionalData.deepMerge && cInstance.instanceOfModule(recValue, 'WS.Data/Entity/Record') && cInstance.instanceOfModule(value, 'WS.Data/Entity/Record')) {
                  self._mergeRecord(value, recValue, additionalData);
               }
               else if (recValue != value && key !== editRecord.getIdProperty()) {
                  //клонируем модели, флаги, итд потому что при сете они теряют связь с рекордом текущим рекордом, а редактирование может еще продолжаться.
                  if (recValue && (typeof recValue.clone == 'function')) {
                     recValue = recValue.clone();
                  }
                  values[key] = recValue;
               }
            }
         });
         //Нет возможности узнать отсюда, есть ли у свойства сеттер или нет
         try {
            collectionRecord.set(values);
         } catch (e) {
            if (!(e instanceof ReferenceError)) {
               throw e;
            }
         }
      },
      _collectionReload: function(){
         this.getLinkedObject().reload();
      },
      /**
       * Получаем запись из связного списка по ключу редактируемой записи
       */
      _getCollectionRecord: function(model, additionalData){
         var collectionData = this._getCollectionData(),
             id,
             index;

         if (additionalData.ignoreLinkedModelKey || !this._linkedModelKey) {
            id = this._getRecordId(model, additionalData.idProperty);
         }
         else {
            id = this._linkedModelKey;
         }

         if (collectionData && cInstance.instanceOfMixin(collectionData, 'WS.Data/Collection/IList') && cInstance.instanceOfMixin(collectionData, 'WS.Data/Collection/IIndexedCollection')) {
            index = collectionData.getIndexByValue(collectionData.getIdProperty(), id);
            return collectionData.at(index);
         }
         return undefined;
      },

      _getRecordId: function(record, idProperty){
         if (idProperty) {
            return record.get(idProperty);
         }
         return record.getId();
      },

      _getCollectionData:function(){
         var collection = this.getLinkedObject();
         if (cInstance.instanceOfMixin(collection, 'SBIS3.CONTROLS/Mixins/ItemsControlMixin')) {
            collection = collection.getItems();
         }
         return collection;
      },

      _getDialogConfig: function () {
         var config = OpenEditDialog.superclass._getDialogConfig.apply(this, arguments);
         config.isFormController = true;
         return config;
      },
   
      _getDialogHandlers: function() {
         var self = this;
         return {
            onAfterClose: function (e, meta) {
               self._notifyOnExecuted(meta);
               self._clearVariables();
            },
            onBeforeShow: function () {
               self._hideLoadingIndicator();
               self._notify('onBeforeShow', this);
            },
            onAfterShow: function() {
               self._isExecuting = false;
               self._notify('onAfterShow', this);
            },
            //При множественном клике панель может начать закрываться раньше, чем откроется, в этом случае
            //onAfterClose не будет, смотрим на destroy
            onDestroy: self._clearVariables
         };
      },

      _notifyOnExecuted: function(meta) {
         var record = this._dialog && this._dialog._record;
         OpenEditDialog.superclass._notifyOnExecuted.call(this, meta, record);
      },

      _clearVariables: function(event) {
         var isDestroy = event && event.name === 'onDestroy';
         this._isExecuting = false;
         this._finishExecuteDeferred();
         //Если метод быд вызван после onAfterClose, то не вызываем его после onDestroy.
         if (!isDestroy) {
            this._dialog && this._dialog.unsubscribe('onDestroy', this._clearVariables);
         }
         this._dialog = undefined;
      },

      destroy: function() {
         $(document).unbind('keydown keyup', this._setOpeningModeHandler);
         if (this._overlay) {
            this._overlay.remove();
         }
         OpenEditDialog.superclass.destroy.apply(this, arguments);
      }
   });

   OpenEditDialog.ACTION_CUSTOM = 'custom';
   OpenEditDialog.ACTION_MERGE = '_mergeRecords';
   OpenEditDialog.ACTION_DEEP_MERGE = '_deepMergeRecords';
   OpenEditDialog.ACTION_ADD = '_createRecord';
   OpenEditDialog.ACTION_RELOAD = '_collectionReload';
   OpenEditDialog.ACTION_DELETE = '_destroyModel';
   OpenEditDialog.INITIALIZING_WAY_LOCAL = 'local';
   OpenEditDialog.INITIALIZING_WAY_REMOTE = 'remote';
   OpenEditDialog.INITIALIZING_WAY_DELAYED_REMOTE = 'delayedRemote';
   return OpenEditDialog;
});