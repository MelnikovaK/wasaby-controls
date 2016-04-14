define('js!SBIS3.CONTROLS.SuggestMixin', [
   'js!SBIS3.CONTROLS.PickerMixin',
   'js!SBIS3.CONTROLS.SuggestShowAll'
], function (PickerMixin) {
   'use strict';


   var DEFAULT_SHOW_ALL_CONFIG = {
      template: 'js!SBIS3.CONTROLS.SuggestShowAll',
      componentOptions: {}
   };

   /**
    * Миксин автодополнения. Позволяет добавить функционал автодополнения любому контролу или набору контролов.
    * Управляет {@link list} контролом, который будет использоваться для отображения элементов коллекции.
    *
    * @remark
    * Автодополнение - это функционал отображения возможных результатов поиска по введенным символам.
    * Получает готовый экземпляр {@link list контрола}, который будет использоваться для отображения элементов коллекции, либо название компонента и опции.
    * Данный экземпляр контрола вставляется в контейнер, предоставляемый {@link SBIS3.CONTROLS.PickerMixin}.
    * Также предусмотрена возможность {@link usePicker не менять контейнер}, в этом случае поведение PickerMixin блокируется.
    *
    * Работает исключительно через контекст (т.е. все контролы, которые взаимодействовуют в автодополнением, должны быть заbindены на контекст):
    * - отслеживает изменения полей контекста, указанных в {@link listFilter}, формирует фильтр, и отправляет его в {@link list контрол списка сущностей}, вызывая SBIS3.CONTROLS.DSMixin::reload();
    * - отслеживает выбор элемента в {@link list контроле списка сущностей}, разбрасывает значения полей выбранного элемента, указанных в {@link resultBindings}, по полям контектста.
    *
    * Кнопку отображения всех элементов коллекции нужно самостоятельно положить в {@link list} и указать ей имя "showAllButton'
    *
    * Для показа автодополнения при получения контролом фокуса, используется {@link autoShow}.
    *
    * В контроле, к которому подмешивается, обязательно требует миксины:
    * @link SBIS3.CONTROLS.PickerMixin
    * @link SBIS3.CONTROLS.DataBindMixin
    * @link SBIS3.CONTROLS.ChooserMixin
    *
    * @mixin SBIS3.CONTROLS.SuggestMixin
    * @public
    * @author Алексей Мальцев
    */

   var SuggestMixin = /** @lends SBIS3.CONTROLS.SuggestMixin.prototype */{
      /**
       * @event onFilterBuild Происходит после построения фильтра.
       * Событие происходит после построения фильтра, который будет передан в контрол, отображающий список значений для автодополнения.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {Object} filter Собранный фильтр.
       * @param {Object} bindings Карта соответствия поле контекста -> поле фильтра.
       */

      /**
       * @event onListReady Происходит при готовности контрола списка сущностей.
       * Событие происходит после создания экземпляра класса контрола, отображающего список значений для автодополнения и
       * проведения настроек по его привязке.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {$ws.proto.Control} list Контрол списка сущностей.
       */

      /**
       * @event onListItemSelect Происходит перед применением выбранной записи к полям контекста.
       * Событие происходит просле выбора пользователем записи в контроле списка сущностей, перед моментом присваивания
       * значений из полей записи полями контекста.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {SBIS3.CONTROLS.Record} item Выбранная запись.
       * @param {Object} bindings Карта соответствия: поле контекста -> поле записи.
       */

      $protected: {
         _options: {
            /**
             * @cfg {Number} Устанавливает время задержки перед выполнением поиска. Значение задаётся в миллисекундах.
             * @remark
             * Временная пауза перед началом поиска дается на формирование пользователем корректного запроса к списку
             * значений для автодополнения. Это позволяет предотвратить выполнение лишних запросов к источнику данных.
             * Ввод или удаление символа вновь активирует режим задержки перед началом поиска.
             *
             * Чтобы настроить минимальное количество символов, с ввода которых начинается поиск результатов,
             * используйте опцию {@link startChar}.
             *
             * Подробнее о функционале автодополнения вы можете прочитать в описании к классу {@link SBIS3.CONTROLS.SuggestMixin}.
             * @example
             * <pre class="brush: xml">
             *     <!-- Установлена задержка в одну секунду -->
             *     <option name="delay">1000</option>
             * </pre>
             * @see startChar
             */
            delay: 500,

            /**
             * @cfg {Number} Устанавливает минимальное количество введенных символов, которые необходимы для начала поиска результатов автодополнения.
             * @remark
             * После ввода минимального количества символов происходит временная задержка перед началом поиска,
             * которая устанавливается через опцию {@link delay}.
             * Подробнее о функционале автодополнения вы можете прочитать в описании к классу {@link SBIS3.CONTROLS.SuggestMixin}.
             * @example
             * <pre class="brush: xml">
             *     <option name="startChar">1</option>
             * </pre>
             * @see delay
             */
            startChar: 3,
            /**
             * @cfg {Boolean} Устанавливает режим работы автодополнения, в котором выводится список всех возможных значений при переходе фокуса на контрол.
             * * true Режим включен.
             * * false Режим выключен.
             * @remark file SuggestMixin-autoShow.md
             * @example
             * <pre class="brush: xml">
             *     <option name="autoShow">true</option>
             * </pre>
             * @see list
             * @see listFilter
             * @see startChar
             * @see SBIS3.CONTROLS.ListView#showPaging
             * @see SBIS3.CONTROLS.DSMixin#pageSize
             * @see SBIS3.CONTROLS.DataGridView#showHead
             */
            autoShow: false,
            /**
             * @cfg {Boolean} Использовать выпадающий блок
             * * true если контрол списка сущностей находится внутри выпадающего блока.
             * * false если контрол списка сущностей находится вне выпадающего блока.
             */
            usePicker: true,
            /**
             * @typedef {Array} BindingsSuggest
             * @property {String} contextField Поле контекста.
             * @property {String} itemField Поле записи.
             */
            /**
             * @cfg {BindingsSuggest[]} Соответствие полей для подстановки в результат выбора
             * Соответствие полей выбранной записи и полей контекста.
             * @example
             * <pre>
             *    resultBindings: [{
             *       contextField: 'ФИО',
             *       itemField: 'РП.ФИО'
             *    }]
             * </pre>
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
             * @property {String} component Класс контрола, который будет использоваться для отображения списка сущностей.
             * По умолчанию используется {@link SBIS3.CONTROLS.ListView}. Однако можно указать любой другой контрол, который
             * наследует функционал {@link SBIS3.CONTROLS.DSMixin}, {@link SBIS3.CONTROLS.Selectable} и {@link SBIS3.CONTROLS.MultiSelectable}.
             * @property {Object} options Опции контрола, которые будут использованы при его построении.
             */
            /**
             * @cfg {ListControl} Устанавливает конфигурацию выпадающего блока, отображающего список значений для автодополнения.
             * @remark file SuggestMixin-list.md
             * @example
             * <pre class="brush:xml">
             *     <options name="list">
             *        <option name="component" value="js!SBIS3.CONTROLS.DataGridView"></option> <!-- Указываем класс контрола, на его основе строятся результаты автодополнения -->
             *        <options name="options">
             *           <option name="keyField" value="@Пользователь"></option> <!-- Указываем ключевое поле -->
             *           <options name="columns" type="array"> <!-- Производим настройку колонок -->
             *              <options>
             *                 <option name="title">№</option>
             *                 <option name="field">@Пользователь</option>
             *              </options>
             *              <options>
             *                 <option name="title">Фамилия</option>
             *                 <option name="field">Фамилия</option>
             *              </options>
             *           </options>
             *        </options>
             *     </options>
             * </pre>
             * @group Data
             * @see autoShow
             * @see listFilter
             * @see getList
             * @see startChar
             * @see SBIS3.CONTROLS.DSMixin#keyField
             * @see SBIS3.CORE.FieldLink/Columns.typedef
             * @see SBIS3.CONTROLS.DataGridView#showHead
             */
            list: {
               component: 'js!SBIS3.CONTROLS.ListView',
               options: {}
            },

            /**
             * @cfg {Object} Устанавливает параметры фильтрации для списка значений автодополнения.
             * @remark
             * Опция используется как дополнение опции {@link list} - настройки выпадающего блока.
             * С помощью опции определяют поле источника данных, по значениям которого будет произведена фильтрация.
             * Параметры фильтрации не делают статическими, их значения устанавливаются динамически с помощью привязки к полю контекста.
             * Значение в поле контекста изменяется со стороны какого-либо поля ввода.
             * Пример фильтрации списка значений:
             * ![](/SuggestMixin03.png)
             * Значение поля ввода привязывается к полю контекста опцией {@link SBIS3.CONTROLS.TextBoxBase#text}, с помощью атрибута bind.
             * Минимальное количество введенных символов, необходимое для начала поиска результатов автодополнения, определяется опцией {@link startChar}.
             * Установить фильтр для списка значений можно с помощью метода {@link setListFilter}
             * Подробнее о функционале автодополнения вы можете прочитать в описании к классу {@link SBIS3.CONTROLS.SuggestMixin}.
             * @example
             * <pre class="brush:xml">
             *     <option name="text" bind="myTextField" value=""></option> <!-- Привязываем значения поля связи к полю myTextField в контексте -->
             *     <options name="listFilter">
             *        <option name="ФИО" bind="myTextField" oneWay="true"></option> <!-- Односторонняя привязка к полю myTextField по значениям из поля "ФИО" -->
             *     </options>
             * </pre>
             * @see setListFilter
             * @see list
             * @see startChar
             * @see SBIS3.CONTROLS.TextBoxBase#text
             */
	        listFilter: {},
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
       * Устанавливает фильтр для списка значений автодополнения.
       * @param {Object} filter Новый фильтр.
       * @param {Boolean} silent "Тихая" установка, не вызывает запроса на БЛ и не изменяет состояние выпадающего блока.
       * @example
       * <pre>
       *     self.setListFilter({'Раздел': res});
       * </pre>
       * @see listFilter
       * @see list
       */
      setListFilter: function(filter, silent) {
         var self = this,
             changedFields = [],
             items = this._getListItems();

         $ws.helpers.forEach(filter, function(value, key) {
            if(value !== self._options.listFilter[key]) {
               changedFields.push(key);
            }
         });

         if(!changedFields.length) {
            return;
         }

         this._options.listFilter = filter;
         this._notifyOnPropertyChanged('listFilter');

         /* Если в контролах, которые мы отслеживаем, нет фокуса или изменение фильтра произошло после внуренних изменений
           то почистим датасет, т.к. фильтр сменился и больше ничего делать не будем */
         if(!this._isObservableControlFocused() || silent) {
            if(items && items.getCount()) {
               items.clear();
            }
            return;
         }

         for(var i = 0, len = changedFields.length; i < len; i++) {
            if(String(this._options.listFilter[changedFields[i]]).length >= this._options.startChar) {
               this._startSearch();
               return;
            }
         }
         /* Если введено меньше символов чем указано в startChar, то скроем автодополнение */
         this._resetSearch();
         this.hidePicker();
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
            this.subscribeTo(control, 'onFocusIn', self._observableControlFocusHandler.bind(self));

            /* Если фокус уходит на список - вернём его обратно в контрол, с которого фокус ушёл */
            this.subscribeTo(control, 'onFocusOut', function(e, destroyed, focusedControl) {
               if(self.getList() === focusedControl) {
                  focusedControl.setActive(false, false, false, this);
                  this.setActive(true);
               }
            });
         }, this);

      },

      /**
       * Обрабочик на приход фокуса в отслеживаемый компонент
       */
      _observableControlFocusHandler: function() {
         if(this._options.autoShow) {
            this._checkPickerState() ? this.showPicker() : this._startSearch();
         }
      },

      /**
       * Показывает индикатор загрузки
       * @private
       */
      _showLoadingIndicator: function () {
         if (this._loadingIndicator === undefined) {
            var holder = this._getLoadingContainer() || this.getContainer();
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
       * Метод должен возвращать контейнер для индикатора загрузки
       * @private
       */
      _getLoadingContainer : function() {
         /* Method must be implemented */
      },

      /**
       * Возвращает экземпляр класса контрола, отображающего список значений для автодополнения.
       * @returns {$ws.proto.Control}
       * @example
       * <pre>
       *     this.getList().setDataSource(new SbisSourse({
       *        resource: 'Сотрудник',
       *        queryMethodName: 'СписокПерсонала',
       *        formatMethodName: 'Сотрудник.FieldLinkFormat'
       *     }), true);
       * </pre>
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

               if(options.itemsDragNDrop === undefined) {
                  options.itemsDragNDrop = false;
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
               var showAllConfig;

               /* Если передали конфигурацию диалога, то используем его, иначе используем дефолтный */
               if(Object.keys(self._options.showAllConfig).length) {
                  showAllConfig = self._options.showAllConfig;
               } else {
                  showAllConfig = $ws.core.merge({
                     componentOptions: {
                        chooserMode: self._options.chooserMode
                     }
                  }, DEFAULT_SHOW_ALL_CONFIG);
               }

               //FIXME и ещё один костыль до перевода пикера на фокусную систему
               self.hidePicker();

               self._showChooser(showAllConfig.template, showAllConfig.componentOptions, null);
            });
         }

         this._notify('onListReady', this._list);
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
      _onListDataLoad: function(e, dataSet) {
         this._hideLoadingIndicator();

         if(this._showAllButton) {
            var list = this.getList();

            /* Изменяем видимость кнопки в зависимости от, того, есть ли ещё записи */
            this._showAllButton.getContainer()
                .toggleClass('ws-hidden', !list._hasNextPage(dataSet.getMetaData().more));
         }
      },

      /**
       * Возвращает dataSet списка, если список уже инициализирован
       * @returns {SBIS3.CONTROLS.Data.Collection.List|undefined}
       * @private
       */
      _getListItems: function() {
         return this._list ? this._list.getItems() : undefined;
      },

      /**
       * Вызывается после отрисовки данных контролом списка сущностей
       * @private
       */
      _onListDrawItems: function () {
         if (this._picker) {
            this._picker.getContainer().height('auto');
            this._picker.recalcPosition(true);
         }
      },

      /**
       * Вызывается после выбора записи в контроле списка сущностей
       * @private
       */
      _onListItemSelect: function (id, item) {
         var def = new $ws.proto.Deferred(),
             items = this._getListItems(),
             ctx = this._getBindingContext(),
             self = this,
             toSet = {};

         if (id === null || id === undefined) {
            return;
         }

         if(item) {
            def.callback(item);
         } else if (items) {
            def.callback(items.getRecordById(id));
         } else {
            this.getList().getDataSource().read(id).addCallback(function (item) {
               def.callback(item);
            });
         }

         def.addCallback(function (item) {
            self._notify('onListItemSelect', item, self._resultBindings);
            /* Соберём все изменения в пачку,
               чтобы контекст несколько раз не пересчитывался */
            for (var field in self._resultBindings) {
               if (self._resultBindings.hasOwnProperty(field)) {
                  toSet[field] = item.get(self._resultBindings[field]);
               }
            }
            ctx.setValue(toSet, false, self._list);
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
         var items = this._getListItems();
         return Boolean(
             this._options.usePicker &&
             items && items.getCount() &&
             this._isObservableControlFocused()
         );
      },

      _setPickerContent: function () {
         this._picker.getContainer().addClass('controls-Suggest__picker');
         /* Заглушка, picker автодополнения не должен вызывать расчёты авторазмеров, т.к. создаётся абсолютом в body */
         this._picker._notifyOnSizeChanged = $ws.helpers.nop;
      },

      showPicker: function () {
         if (this._options.usePicker) {
            PickerMixin.showPicker.apply(this, arguments);
         }
      }
   };

   return SuggestMixin;
});
