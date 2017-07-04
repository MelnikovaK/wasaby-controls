/**
 * Created by am.gerasimov on 08.06.2016.
 */
define('js!SBIS3.CONTROLS.SuggestTextBoxMixin', [
   "Core/constants",
   'js!SBIS3.CONTROLS.SearchController',
   'js!SBIS3.CONTROLS.HistoryList',
   'js!SBIS3.CONTROLS.ControlHierarchyManager',
   'js!WS.Data/Collection/RecordSet',
   'js!WS.Data/Di',
   "js!WS.Data/Query/Query",
   "Core/core-instance",
   "Core/CommandDispatcher",
   "Core/core-functions",
   "Core/IoC",
   "Core/helpers/Function/once"
], function (
   constants,
   SearchController,
   HistoryList,
   ControlHierarchyManager,
   RecordSet,
   Di,
   Query,
   cInstance,
   CommandDispatcher,
   cFunctions,
   IoC,
   once) {

   'use strict';

   var HISTORY_LENGTH = 12;
   
   function stopEvent(e) {
      e.stopPropagation();
      e.preventDefault();
   }

   /**
    * Миксин, задающий любому полю ввода работу с автодополнением.
    * @mixin SBIS3.CONTROLS.SuggestTextBoxMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */
   var SuggestTextBoxMixin = /**@lends SBIS3.CONTROLS.SuggestTextBoxMixin.prototype  */{
      $protected: {
         _changedByKeyboard: false,  /* {Boolean} Флаг, обозначающий, что изменения были вызваны действиями с клавиатуры */
         /* Т.к. при выборе из списка, фокус может находиться на нём, а не на поле ввода,
            то обрабатывать клавиатурные события надо на списке. Но надо учитывать,
            что список находится в body, а блокировать всплытие события надо на уровне поля ввода,
            поэтому запоминаем, что выбор был произвёден, когда фокус был на списке, чтобы потом заблокировать всплытие события. */
         _selectedFromList: false,
         _historyController: null,

         _options: {
            /**
             * @cfg {String} Имя параметра фильтрации для поиска
             */
            searchParam : '',
            /**
             * @cfg {Boolean} Использовать механизм смены неверной раскладки
             */
            keyboardLayoutRevert: true,
            /**
             * @cfg {Boolean} Использовать механизм смены неверной раскладки по новому стандарту
             */
            keyboardLayoutRevertNew: true
         }
      },
      $constructor: function () {
         var self = this;

         this._options.observableControls.unshift(this);
         
         /* Инициализация searchController'a происходит лениво,
            только при начале поиска (по событию onSearch). Поэтому, чтобы не было множественных подписок
            на onSearch (и лишних созданий контроллера), метод инициализации позволяем вызывать только один раз. */
         this._initializeSearchController = once.call(this._initializeSearchController);

         this.once('onListReady', function(e, list) {
            self.subscribeTo(list, 'onKeyPressed', function (event, jqEvent) {
               if(jqEvent.which === constants.key.enter) {
                  self._selectedFromList = true;
               }
            });
         });

         /* Если передали параметр поиска, то поиск производим через ComponentBinder */
         if(this._options.searchParam) {
            this._initializeSearchController();
         }
      },

      _showHistory: function () {
         if (this._historyController.getCount()) {
            this._getHistoryRecordSet().addCallback(function(rs) {
               if (rs.getCount()) {
                  this.getList().setItems(rs);
               }
               else {
                  this.getList().setItems(this._getHistoryRecordSetSync()); //В рамках совместимости оставляю старое поведение
               }
               this.showPicker();
            }.bind(this)).addErrback(function(err){
               //В рамках совместимости оставляю старое поведение
               if (!err.processed) {
                  IoC.resolve('ILogger').log(this._moduleName, 'Списочный метод не смог вычитать записи по массиву идентификаторов');
               }
               this.getList().setItems(this._getHistoryRecordSetSync());
               this.showPicker();
            }.bind(this));
         }
      },
      _getHistoryRecordSet: function () {
         var listSource = this.getList().getDataSource(),
             query = new Query(),
             filter = {},
             recordsId = [];
         for (var i = 0, l = this._historyController.getCount(); i < l; i++) {
            recordsId.push(this._getHistoryRecordId(this._historyController.at(i).get('data')));
         }
         filter[this._getListIdProperty()] = recordsId;
         query.where(filter).limit(12);
         return this.getList().getDataSource().query(query).addCallback(function(rs) {
            return new RecordSet({
               adapter: listSource.getAdapter(),
               rawData: rs.getRawData(),
               idProperty: this._list.getProperty('idProperty'),
               model: listSource.getModel()
            });
         }.bind(this));
      },
      _getHistoryRecord: function(item){
         var list = this.getList();
         return Di.resolve(list.getDataSource().getModel(), {
            adapter: list.getDataSource().getAdapter(),
            idProperty: list.getProperty('idProperty'),
            rawData: item.getRawData()
         });
      },
      _getHistoryRecordId: function(record) {
         return this._getHistoryRecord(record).get(this._getListIdProperty());
      },
      _getListIdProperty: function() {
         return this.getList().getDataSource().getIdProperty() || this.getList().getProperty('idProperty');
      },
      _needShowHistory: function(){
         return this._historyController && !this.getText().length && this._options.startChar; //Если startChar = 0, историю показывать не нужно
      },

      //TODO Выпилить _getHistoryRecordSetSync и _prepareHistoryData после выполнения задачи, когда будет поддержан списочный метод
      //https://online.sbis.ru/opendoc.html?guid=501e09cc-5d9f-4cc4-841f-1723aa8d8d40&des=
      _getHistoryRecordSetSync: function(){
         var listSource = this.getList().getDataSource(),
            historyRecordSet = new RecordSet({
               adapter: listSource.getAdapter(),
               rawData: [],
               idProperty: this._list.getProperty('idProperty'),
               model: listSource.getModel()
            });
         historyRecordSet.assign(this._prepareHistoryData());
         return historyRecordSet;
      },
      _prepareHistoryData: function(){
         var history = this._historyController,
            rawData = [];
         for (var i = 0, l = history.getCount(); i < l; i++){
            rawData.push(this._getHistoryRecord(history.at(i).get('data')));
         }
         return rawData;
      },

      /**
       * Изменяет параметр поиска
       * @param {String} paramName
       */
      setSearchParamName: function(paramName) {
         this._options.searchParam = paramName;
         if(this._searchController) {
            this._searchController.setSearchParamName(paramName);
         } else {
            this._initializeSearchController();
         }
      },

      _initializeSearchController: function() {
         this.subscribe('onSearch', function(e, text, force) {
            if(!force) {
               this._showLoadingIndicator();
            }
         });

         this.once('onSearch', function () {
            this._searchController = new SearchController({
               view: this.getList(),
               searchForm: this,
               keyboardLayoutRevert: this._options.keyboardLayoutRevert,
               searchParamName: this._options.searchParam,
               doNotRespondOnReset: true,
               searchFormWithSuggest: true,
               keyboardLayoutRevertNew: this._options.keyboardLayoutRevertNew
            });
            this._searchController.bindSearch();
         });

         this.subscribe('onReset', this._resetSearch.bind(this));
      },

      _getLoadingContainer : function() {
         return this.getContainer().find('.controls-TextBox__fieldWrapper');
      },

      before: {
         _setTextByKeyboard: function () {
            /* Этот флаг надо выставлять только когда текст изменён с клавиатуры,
               чтобы при изменнии текста из контекста не вызывался поиск в автодополнении */
            this._changedByKeyboard = true;
         },
         _observableControlFocusHandler: function(){
            if (this._options.historyId && !this._historyController){
               this._historyController = new HistoryList({
                  historyId: this._options.historyId,
                  maxLength: HISTORY_LENGTH
               });
            }
            if (this._needShowHistory()){
               this._showHistory();
            }
         },
         _onListItemSelectNotify: function(item){
            if (this._historyController) {
               //Определяем наличие записи в истории по ключу: стандартная логика контроллера не подходит,
               //т.к. проверка наличия добавляемой записи в истории производится по полному сравнению всех полей записи.
               //В записи поля могут задаваться динамически, либо просто измениться, к примеру значение полей может быть привязано к текущему времени
               //Это приводит к тому, что historyController не найдет текущую запись в истории и добавит ее заново. Получится дублирование записей в истории
               var idProp = this.getList().getItems().getIdProperty(),
                   itemId = item.get(idProp),
                   index = -1;

               this._historyController.each(function(model, i) {
                  var historyModelObject = model.get('data').toObject();
                  var historyModelId;
                  //Проблема в адаптерах historyRecordSet и сохраняемой записи, они могут быть разными
                  //в таком случае, когда дергается var dataRecord = model.get('data'), то dataRecord приводится к типу Record (по формату), но
                  //свойства модели не инициализируются, соответственно dataRecord.get('anyField') не вернет ничего.
                  //Пока не доработали механизм истории на запоминание только id, приходится искать добавляемую запись в рекордсете истории вручную по сырым данным.
                  if (historyModelObject.d instanceof Array && historyModelObject.s instanceof Array) {
                     var fieldIndex = -1;
                     for (var j = 0; j < historyModelObject.s.length; j++) {
                        if (historyModelObject.s[j].n === idProp) {
                           fieldIndex = j;
                           break;
                        }
                     }
                     if (fieldIndex > -1) {
                        historyModelId = historyModelObject.d[fieldIndex];
                     }
                  }
                  else {
                     historyModelId = historyModelObject[idProp];
                  }
                  if (itemId === historyModelId) {
                     index = i;
                  }
               });
               if(index !== -1) {
                  this._historyController.removeAt(index);
               }
               this._historyController.prepend(item.getRawData());
            }
         }
      },


      after: {
         _keyDownBind: function(e) {
            /* Запрещаем всплытие enter и esc по событию keyDown,
               т.к. Area тоже его слушает и закрывает floatArea */
            if((e.which === constants.key.enter || e.which === constants.key.esc) && this.isPickerVisible()) {
               stopEvent(e);
            }
         },

         // FIXME костыль до перехода на пикера по фокусную систему
         _inputFocusInHandler: function(event) {
            this._observableControlFocusHandler(event);
         },
         
         _inputClickHandler: function(e) {
            /* По стандарту клик по полю с автодополнением или получение фокуса при включённом автопоказе (опция autoShow),
               должен вызывать отображение автодополнения. Т.к. если в поле ввода уже стоит фокус, то клик не вызывает никаких
               связанных с фокусом событий, поэтому при клике по полю ввода надо тоже показать автодополнение. */
            if(this.isActive()) {
               this._observableControlFocusHandler(e);
            }
         },
         /**
          * Блочим события поднятия служебных клавиш,
          * нужно в основном при использовании в редактировании по месту
          * @param e
          * @private
          */
         _keyUpBind: function(e) {
            var isPickerVisible = this.isPickerVisible();

            switch (e.which) {
               /* Чтобы нормально работала навигация стрелками и не случалось ничего лишнего,
                то запретим всплытие события */
               case constants.key.down:
               case constants.key.up:
               case constants.key.enter:
                  if(isPickerVisible || this._selectedFromList) {
                     stopEvent(e);
                  }

                  this._selectedFromList = false;

                  if(isPickerVisible) {
                     var list = this.getList();
                     list._keyboardHover(e);
                  }
                  break;
               case constants.key.esc:
                  if(isPickerVisible) {
                     this.hidePicker();
                     stopEvent(e);
                  }
                  break;
            }
            this._changedByKeyboard = false;
         },

         _onListDataLoad: function(e, dataSet) {
            var self = this;

            if(this._options.searchParam) {
               var togglePicker = function() {
                     if(self._checkPickerState(!self._options.showEmptyList) && !self.getList().isLoading()) {
                        self.showPicker();
                     } else {
                        self.hidePicker();
                     }
                  },
                  list = this.getList(),
                  listItems = list.getItems();

               /* В событии onDataLoad момент нельзя показывать пикер т.к. :
                1) Могут возникнуть проблемы, когда после отрисовки пикер меняет своё положение.
                2) Данных в рекордсете ещё нет.
                3) В onDataLoad приклданые программисты могу менять загруженный рекордсет.
                Поэтому в этом событии просто одинарно подпишемся на событие отрисовки данных и покажем автодополнение (если требуется). */
               if( (dataSet && !dataSet.getCount()) && (listItems && !listItems.getCount()) ) {
                  /* Если был пустой список и после загрузки пустой, то события onDrawItems не стрельнёт,
                   т.к. ничего не рисовалось */
                  togglePicker();
               } else {
                  this.subscribeOnceTo(list, 'onDrawItems', togglePicker);
               }
            }
         },
         _resetSearch: function() {
            if (this._needShowHistory()){
               this._showHistory();
            }

            if(this._options.searchParam) {
               /* Т.к. при сбросе поиска в саггесте запрос отправлять не надо (саггест скрывается),
                то просто удалим параметр поиска из фильтра */
               var listFilter = cFunctions.clone(this.getList().getFilter()); /* Клонируем фильтр, т.к. он передаётся по ссылке */

               delete listFilter[this._options.searchParam];
               this.setListFilter(listFilter, true);
            }
         },
         destroy: function() {
            if (this._historyController) {
               this._historyController.destroy();
               this._historyController = null;
            }
         }
      },
      around: {
         /* Метод для проверки, куда ушёл фокус, т.к. попап до сих пор
          отслеживает клики, и, если фокус ушёл например по tab, то саггест не закроется +
          надо, чтобы правильно запускалась валидация */
         // FIXME костыль до перехода на пикера по фокусную систему
         _focusOutHandler: function(parentFunc, event, isDestroyed, focusedControl) {
            var isChildControl = false,
                list = this._list;

            /* focusedControl может не приходить при разрушении контрола */
            if(list && focusedControl) {
               isChildControl = ControlHierarchyManager.checkInclusion(list, focusedControl.getContainer());

               if(!isChildControl) {
                  isChildControl = list.getChildControls(false, true, function(ctrl) {
                     return focusedControl === ctrl;
                  }).length;
               }
            }

            if(!isChildControl) {
               this.hidePicker();
               parentFunc.call(this, event, isDestroyed, focusedControl);
            }
         },

         _setPickerConfig: function(parentFunc){
            var parentConfig = parentFunc.apply(this, arguments);
            parentConfig.tabindex = 0;
            parentConfig.targetPart = true;
            parentConfig.closeOnTargetMove = true;
            return parentConfig;
         },

         setListFilter: function(parentFunc, filter, silent) {
            parentFunc.call(this, filter, silent || !this._changedByKeyboard);
         }
      }
   };

   return SuggestTextBoxMixin;
});
