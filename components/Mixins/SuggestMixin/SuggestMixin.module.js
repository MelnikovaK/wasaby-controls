define('js!SBIS3.CONTROLS.SuggestMixin', [
   'js!SBIS3.CONTROLS.PickerMixin',
   'js!SBIS3.CONTROLS.SuggestList'
], function (PickerMixin) {
   'use strict';


   var DEFAULT_SHOW_ALL_CONFIG = {
      template: 'js!SBIS3.CONTROLS.SuggestShowAll',
      componentOptions: {}
   };

   /**
    * Миксин автодополнения. Позволяет навесить функционал автодополнения на любой контрол или набор контролов.
    * Управляет {@link list контролом списка сущностей}, реализующим определенный интерфейс.
    *
    * @remark
    * Получает готовый инстанс {@link list контрола списка сущностей}, либо название его конструктора и опции (в этом случае инстанс создается "лениво").
    * Данный инстанс вставляется в контейнер, предоставляемый SBIS3.CONTROLS.PickerMixin (также предусмотрена возможность и {@link usePicker не менять контейнер}, в этом случае поведение PickerMixin блокируется).
    *
    * Работает исключительно через контекст (т.е. все контролы, которые взаимодействовуют в автодополнением, должны быть заbindены на контекст):
    * - отслеживает изменения полей контекста, указанных в {@link filterBindings}, формирует фильтр, и отправляет его в {@link list контрол списка сущностей}, вызывая SBIS3.CONTROLS.DSMixin::reload();
    * - отслеживает выбор элемента в {@link list контроле списка сущностей}, разбрасывает значения полей выбранного элемента, указанных в {@link resultBindings}, по полям контектста.
    *
    * Кнопку отображения всех записей нужно самостоятельно положить в {@link list} и указать ей имя "showAllButton'
    *
    * Для показа автодополнения при получения контролом фокуса, используется {@link observableControls}.
    *
    * Обязательно требует миксины:
    * @link SBIS3.CONTROLS.PickerMixin
    * @link SBIS3.CONTROLS.DataBindMixin
    * @link SBIS3.CONTROLS.ChooserMixin
    * в контроле, к которому подмешивается.
    * @mixin SBIS3.CONTROLS.SuggestMixin
    * @public
    * @author Алексей Мальцев
    */

   var SuggestMixin = /** @lends SBIS3.CONTROLS.SuggestMixin.prototype */{
      /**
       * @event onFilterBuild При построении фильтра
       * Событие, наступает после построения фильтра, который будет передан в контрол списка сущностей.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {Object} filter Собранный фильтр.
       * @param {Object} bindings Карта соответствия поле контекста -> поле фильтра.
       */

      /**
       * @event onListReady При готовности контрола списка сущностей
       * Событие, наступает просле создания инстанса контрола списка сущностей и проведения настроек
       * по его привязке.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {$ws.proto.Control} list Контрол списка сущностей.
       */

      /**
       * @event onListItemSelect Перед применением выбранной записи к полям контекста
       * Событие, наступает просле выбора пользователем записи в контроле списка сущностей, перед моментом
       * "разбрасывания" значений из полей записи по полям контекста.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {SBIS3.CONTROLS.Record} item Выбранная запись.
       * @param {Object} bindings Карта соответствия поле контекста -> поле записи.
       */

      $protected: {
         _options: {
            /**
             * @cfg {Number} Задержка, мс
             * <wiTag group="Отображение">
             * Задержка перед началом поиска.
             */
            delay: 500,

            /**
             * @cfg {Number} Минимальная длина значения
             * <wiTag group="Данные">
             * Минимальная длина введённого значения, при которой следует начать поиск.
             */
            startChar: 3,
            /**
             * @cfg {Boolean} Автоматически показывать варианты при приходе фокуса
             */
            autoShow: false,

            /**
             * @cfg {Boolean} Оставлять фокус на контроле при выборе элемента
             * <wiTag group="Данные">
             */
            saveFocusOnSelect: false,

            /**
             * @cfg {Boolean} Использовать выпадающий блок
             * <wiTag group="Данные">
             * @variant true если контрол списка сущностей находится внутри выпадающего блока.
             * @variant false если контрол списка сущностей находится вне выпадающего блока.
             */
            usePicker: true,
            /**
             * @typedef {Array} BindingsSuggest
             * @property {String} contextField Поле контекста.
             * @property {String} itemField Поле записи.
             */
            /**
             * @cfg {BindingsSuggest[]} Соответствие полей для подстановки в результат выбора
             * <wiTag group="Данные">
             * Соответствие полей выбранной записи и полей контекста.
             * @example
             * <pre>
             *    resultBindings: [{
                 *       contextField: 'ФИО',
                 *       itemField: 'РП.ФИО'
                 *    }]
             * </pre>
             * @group Data
             * @editor InternalOptions?
             */
            resultBindings: [],

            /**
             * @cfg {$ws.proto.Control[]} Набор контролов, в которых отслеживается получение фокуса
             * @group Data
             */
            observableControls: [],

            /**
             * @typedef {Object} ListControl
             * @property {String} component Класс контрола, отображающего список сущностей
             * Должен иметь примеси {SBIS3.CONTROLS.DSMixin}{SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable}.
             * @property {Object} options Опции конструктора контрола
             */
            /**
             * @cfg {SBIS3.CONTROLS.DSMixin|ListControl} Конфигурация контрола списка сущностей
             * <wiTag group="Отображение">
             * @var {SBIS3.CONTROLS.DSMixin} инстанс контрола, отображающего список сущностей.
             * Должен также иметь примеси {SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable}.
             *
             * @var {ListControl} Настройки контрола, отображающего список сущностей
             * @remark
             * При передаче настроек инстанс создается лениво - при необходимости.
             * @example
             * <pre class="brush:xml">
             *     <options name="list">
             *        <option name="component" value="js!SBIS3.CONTROLS.DataGridView"></option>
             *        <options name="options">
             *           <option name="showHead" type="boolean" value="false">
             *           <options name="columns" type="array">
             *           <options>
             *              <option name="title">Ид</option>
             *              <option name="field">Ид</option>
             *           </options>
             *           <options>
             *              <option name="title">Название</option>
             *              <option name="field">Название</option>
             *           </options>
             *        </options>
             *     </options>
             * </pre>
             * @group Data
             */
            list: {
               component: 'js!SBIS3.CONTROLS.SuggestList',
               options: {}
            },

            /**
             * @cfg {Object} Фильтр данных
             * При изменении полей фильтра производится запрос к источнику данных.
             * @example
             * <pre class="brush:xml">
             *     <options name="listFilter">
             *        <option name="creatingDate" bind="selectedDocumentDate"></option>
             *        <option name="documentType" bind="selectedDocumentType"></option>
             *     </options>
             * </pre>
             */
	        listFilter: {},

            /**
             * @cfg {jQuery|Element|String} Контейнер, в который будет вставлен индикатор загрузки
             * <wiTag group="Отображение">
             * Если не указан, то будет вставлен в контейнер компонента.
             */
            loadingContainer: undefined,
            /**
             * @typedef {Object} showAll
             * @property {String} template Шаблон, который отобразится в диалоге всех записей
             * @property {Object} componentOptions Опции опции которые прокинутся в компонент, отображаемый на диалоге всех записей
             */
            /**
             * @cfg {showAll} Конфигурация диалога всех записей
             * @example
             * <pre>
             *    <options name="showAllConfig">
             *       <option name="template" value="js!SBIS3.CONTROLS.SuggestShowAll"></option>
             *       <options name="componentOptions">
             *          <option name="showSelectButton" type="Boolean" value="true"></option>
             *       </options>
             *    </options>
             * </pre>
             */
            showAllConfig: {}
         },
         _resultBindings: {},                   /* {Object} Соответствие полей для подстановки в контекст */
         _delayTimer: null,                     /* {Object|null} Таймер задержки загрузки picker-а */
         _loadingIndicator: undefined,          /* {Object} Индикатор загрузки */
         _list: undefined,                      /* {SBIS3.CONTROLS.DSMixin}{SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable} Контрол списка сущностей */
         _listContainer: undefined,             /* {jQuery} Контейнер для контрола списка сущностей */
         _loadDeferred: null,                   /* {$ws.proto.Deferred|null} Деферред загрузки данных для контрола списка сущностей */
         _showAllButton: undefined              /* {$ws.proto.Control} Кнопка открытия всех записей */
      },

      $constructor: function () {
         if (!$ws.helpers.instanceOfMixin(this, 'SBIS3.CONTROLS.PickerMixin')) {
            throw new Error('Mixin SBIS3.CONTROLS.PickerMixin is required.');
         }

         this._publish('onFilterBuild', 'onListReady', 'onListItemSelect');

         this.getContainer().addClass('controls-Suggest');

         this._initBindingRules();
      },

      after: {
         init: function () {
            this._connectBindings();
         },
         destroy: function () {
            this._clearDelayTimer();
            this._loadingIndicator = undefined;
            this._showAllButton = undefined;
            if (this._list) {
               this._list.destroy();
            }
         }
      },

      /**
       * Инициализирует правила проброса данных (контекст -> фильтр, запись -> контекст)
       * @private
       */
      _initBindingRules: function () {
         //TODO избавиться
         var convertToObject = function (bindings) {
            var result = {};
            for (var i = 0, len = bindings.length; i < len; i++) {
               var item = bindings[i];
               result[item.contextField] = item.itemField;
            }

            return result;
         };
         this._resultBindings = convertToObject(this._options.resultBindings);
      },

      /**
       * Устанавливает фильтр в список, при необходимости делает запрос на БЛ
       * @param {Object} filter
       */
      setListFilter: function(filter) {
         var self = this,
             changedFields = [],
             ds;

         /* Если в контролах, которые мы отслеживаем, нет фокуса,
            то почистим датасет, т.к. фильтр сменился и больше ничего делать не будем */
         if(!this._isObservableControlFocused()) {
            ds = this.getList().getDataSet();
            ds && ds.fill(); //TODO в 3.7.3.100 поменять на clear
            this._options.listFilter = filter;
            this._notifyOnPropertyChanged('listFilter');
            return;
         }

         $ws.helpers.forEach(filter, function(value, key) {
            if(value !== self._options.listFilter[key]) {
               changedFields.push(key);
            }
         });

         if(changedFields.length) {
            this._options.listFilter = filter;
            for(var i = 0, len = changedFields.length; i < len; i++) {
               if(String(this._options.listFilter[changedFields[i]]).length >= this._options.startChar) {
                  this._startSearch();
                  this._notifyOnPropertyChanged('listFilter');
                  return;
               }
            }
            /* Если введено меньше символов чем указано в startChar, то скроем автодополнение */
            this._resetSearch();
            this.hidePicker();
            this._notifyOnPropertyChanged('listFilter');
         }
      },

      // TODO использовать searchMixin 3.7.3.100
      _startSearch: function() {
         var self = this;

         this._clearDelayTimer();
         this._delayTimer = setTimeout(function() {
            self._showLoadingIndicator();
            self._loadDeferred = self.getList().reload(self._options.listFilter).addCallback(function () {
               self._checkPickerState() ? self.showPicker() : self.hidePicker();
            });
         }, this._options.delay);
      },

      _resetSearch: function() {
         if(this._loadDeferred) {

            /* Т.к. list может быть компонентом, который не наследован от DSmixin'a и метода _cancelLoading там может не быть,
             надо это проверить, но в любом случае, надо деферед отменить, чтобы не сработал показ пикера */
            if(this._list._cancelLoading) {
               this._list._cancelLoading();
            }

            this._loadDeferred.cancel();
            this._loadDeferred = null;
            this._hideLoadingIndicator();
         }
         this._clearDelayTimer();
      },

      /**
       * Устанавливает связи между компонентами
       * @private
       */
      _connectBindings: function () {
         var self = this;

         //Подписываемся на события в отслеживаемых контролах
         $ws.helpers.forEach(this._options.observableControls, function (control) {
            this.subscribeTo(control, 'onFocusIn', function() {
               if(self._options.autoShow) {
                  self._checkPickerState() ? self.showPicker() : self._startSearch();
               }
            });
         }, this);

      },

      /**
       * Показывает индикатор загрузки
       * @private
       */
      _showLoadingIndicator: function () {
         if (this._loadingIndicator === undefined) {
            var holder = this._options.loadingContainer ? $(this._options.loadingContainer) : this.getContainer();
            this._loadingIndicator = $('<div class="controls-Suggest__loadingIndicator">').appendTo(holder.addClass('controls-Suggest__loadingContainer'));
         }
         this._loadingIndicator.removeClass('ws-hidden');
      },

      /**
       * Прячет индикатор загрузки
       * @private
       */
      _hideLoadingIndicator: function () {
         if (this._loadingIndicator) {
            this._loadingIndicator.addClass('ws-hidden');
         }
      },

      /**
       * Возвращает контрол списка сущностей
       * @returns {$ws.proto.Control}
       * @see list
       */
      getList: function () {
         var options, component;

         if (!this._list) {
            if ($ws.helpers.instanceOfMixin(this._options.list, 'SBIS3.CONTROLS.DSMixin')) {
               /* Если передали в опции готовый инстанс, то ничего создавать не надо */
               this._list = this._options.list;
               this._initList();
               return this._list;
            } else {
               //Набор "Сделай сам"
               options = $ws.core.clone(this._options.list.options);
               component = require(this._options.list.component);
               if (!options.element) {
                  options.element = this._getListContainer();
               }
               options.parent = this._picker;
               this._list = new component(options);
               this._initList();

               return this._list;
            }
         } else {
            return this._list;
         }
      },

      /**
       * Инициализирует контрол списка сущностей
       * @private
       */
      _initList: function () {
         var self = this;

         this.subscribeTo(this._list, 'onDataLoad', this._onListDataLoad.bind(this))
             .subscribeTo(this._list, 'onDataLoadError', this._hideLoadingIndicator.bind(this))
             .subscribeTo(this._list, 'onDrawItems', this._onListDrawItems.bind(this))
             .subscribeTo(this._list, 'onItemActivate', (function (eventObject, itemObj) {
                self.hidePicker();
                self._onListItemSelect(itemObj.id, itemObj.item);
             }));

         /* Найдём и подпишемся на клик кнопки показа всех записей (если она есть) */
         if(this._list.hasChildControlByName('showAllButton')) {
            this._showAllButton = this._list.getChildControlByName('showAllButton');

            this.subscribeTo(this._showAllButton, 'onActivated', function() {

               /* Если передали конфигурацию диалога, то используем его, иначе используем дефолтный */
               var showAllConfig = Object.keys(self._options.showAllConfig) ?
                   self._options.showAllConfig :
                   DEFAULT_SHOW_ALL_CONFIG;

               self._showChooser(showAllConfig.template, showAllConfig.componentOptions, null);
            });
         }

         this._notify('onListReady', this._list);
      },

      _chooseCallback: function(result) {
         if(result && $ws.helpers.instanceOfModule(result[0], 'SBIS3.CONTROLS.Data.Model')) {
            var item = result[0];
            this._onListItemSelect(item.getId(), item);
         }
      },

      /**
       * Возвращает контейнер для контрола списка сущностей
       * @returns {jQuery}
       */
      _getListContainer: function () {
         if (this._listContainer === undefined) {
            if (!this._picker) {
               this._initializePicker();
            }

            this._listContainer = $('<div/>').appendTo(
               this._picker.getContainer()
            );
         }

         return this._listContainer;
      },

      /**
       * Вызывается после загрузки данных контролом списка сущностей
       * @private
       */
      _onListDataLoad: function() {
         this._hideLoadingIndicator();

         if(this._showAllButton) {
            var list = this.getList();

            /* Изменяем видимость кнопки в зависимости от, того, есть ли ещё записи */
            this._showAllButton.getContainer()
                .toggleClass('ws-hidden', !list._hasNextPage(list.getDataSet().getMetaData().more));
         }
      },

      /**
       * Вызывается после отрисовки данных контролом списка сущностей
       * @private
       */
      _onListDrawItems: function () {
         if (this._picker) {
            this._picker.recalcPosition(true);
         }
      },

      /**
       * Вызывается после выбора записи в контроле списка сущностей
       * @private
       */
      _onListItemSelect: function (id, item) {
         var def = new $ws.proto.Deferred(),
             dataSet = this._list.getDataSet(),
             ctx = this._getBindingContext(),
             self = this;

         if (id === null || id === undefined) {
            return;
         }

         if (!this._options.saveFocusOnSelect) {
            var activeFound = false;
            $ws.helpers.forEach(this._options.observableControls, function (control) {
               if (!activeFound && control.isActive()) {
                  control.setActive(false);
                  activeFound = true;
               }
            }, this);
         }

         if(item) {
            def.callback(item);
         } else if (dataSet) {
            def.callback(dataSet.getRecordByKey(id));
         } else {
            this._list._dataSource.read(id).addCallback(function (item) {
               def.callback(item);
            });
         }

         def.addCallback(function (item) {
            self._notify('onListItemSelect', item, self._resultBindings);
            for (var field in self._resultBindings) {
               if (self._resultBindings.hasOwnProperty(field)) {
                  ctx.setValue(
                     field,
                     item.get(self._resultBindings[field]),
                     false,
                     self._list
                  );
               }
            }
         });
      },

      /**
       * Очищает таймер задержки открытия списка
       * @private
       */
      _clearDelayTimer: function() {
         if (this._delayTimer) {
            clearTimeout(this._delayTimer);
            this._delayTimer = null;
         }
      },

      /**
       * Проверяет, если ли фокус в отслеживаемых контролах
       * @returns {*}
       * @private
       */
      _isObservableControlFocused: function() {
         return $ws.helpers.find(this._options.observableControls, function(ctrl) {
            return ctrl.isActive();
         }, this, false)
      },

      /**
       * Проверяет необходимость изменения состояния пикера
       * @private
       */
      _checkPickerState: function () {
         var dataSet = this._list && this._list.getDataSet();
         return Boolean(this._options.usePicker && dataSet && dataSet.getCount());
      },

      _setPickerContent: function () {
         this._picker.getContainer().addClass('controls-Suggest__picker');
      },

      showPicker: function () {
         if (this._options.usePicker) {
            PickerMixin.showPicker.apply(this, arguments);
         }
      }
   };

   return SuggestMixin;
});
