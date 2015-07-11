define('js!SBIS3.CONTROLS.SuggestMixin', [
   'js!SBIS3.CONTROLS.PickerMixin'
], function (PickerMixin) {
   'use strict';

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
    * Для показа автодополнения при получения контролом фокуса, используется {@link observableControls}.
    *
    * Обязательно требует миксины SBIS3.CONTROLS.PickerMixin и SBIS3.CONTROLS.DataBindMixin в контроле, к которому подмешивается.
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
             * @cfg {Boolean} Использовать выпадающий блок
             * <wiTag group="Данные">
             * true, если контрол списка сущностей находится внутри выпадающего блока.
             * false, если контрол списка сущностей находится вне выпадающего блока.
             */
            usePicker: true,

            /**
             * @typedef {Object} BindingsSuggest
             * @property {String} contextField Поле контекста
             * @property {String} itemField Поле записи
             */

            /**
             * @cfg {BindingsSuggest[]} Соответствие полей для подстановки в фильтр
             * <wiTag group="Данные">
             * Соответствие полей контекста и полей фильтра.
             * <pre>
             *    filterBindings: [{
                 *       contextField: 'ФИО',
                 *       itemField: 'РП.ФИО'
                 *    }, {
                 *       contextField: 'Должность',
                 *       itemField: 'Должность'
                 *    }]
             * </pre>
             * @group Data
             * @editor InternalOptions?
             */
            filterBindings: [],

            /**
             * @cfg {BindingsSuggest[]} Соответствие полей для подстановки в результат выбора
             * <wiTag group="Данные">
             * Соответствие полей выбранной записи и полей контекста.
             * Если не заполнено, то используется {@link filterBindings}.
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
             * @property {String} className Класс контрола, отображающего список сущностей
             * Должен иметь примеси {SBIS3.CONTROLS.DSMixin}{SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable}.
             * @property {Object} options Опции конструктора контрола
             */

            /**
             * @cfg {SBIS3.CORE.CompoundControl|ListControl} Конфигурация контрола списка сущностей
             * <wiTag group="Отображение">
             * SBIS3.CORE.CompoundControl: инстанс контрола, отображающего список сущностей.
             * Должен иметь примеси {SBIS3.CONTROLS.DSMixin}{SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable}.
             * ListControl: Настройки контрола, отображающего список сущностей
             * При передаче настроек инстанс создается лениво - при необходимости.
             * @group Data
             */
            list: {
               className: 'js!SBIS3.CONTROLS.SuggestList',
               options: {}
            },

            /**
             * @cfg {jQuery|Element|String} Контейнер, в который будет вставлен индикатор загрузки
             * <wiTag group="Отображение">
             * Если не указан, то будет вставлен в контейнер компонента.
             */
            loadingContainer: undefined
         },

         /**
          * @var {Object} Сформированный фильтр, передаваемый в контрол списка сущностей
          */
         _filter: {},

         /**
          * @var {Boolean} Признак изменения какого-либо значения в фильтре
          */
         _filterChanged: false,

         /**
          * @var {Object} Соответствие полей для подстановки в фильтр
          */
         _filterBindings: {},

         /**
          * @var {Object} Соответствие полей для подстановки в контекст
          */
         _resultBindings: {},

         /**
          * @var {Object|null} Таймер задержки загрузки picker-а
          */
         _delayTimer: null,

         /**
          * @var {Boolean} Реагировать на изменения в контексте
          */
         _checkContext: true,

         /**
          * @var {Object} Индикатор загрузки
          */
         _loadingIndicator: undefined,

         /**
          * @var {SBIS3.CONTROLS.DSMixin}{SBIS3.CONTROLS.Selectable|SBIS3.CONTROLS.MultiSelectable} Контрол списка сущностей
          */
         _list: undefined,

         /**
          * @var {jQuery} Контейнер для контрола списка сущностей
          */
         _listContainer: undefined,

         /**
          * @var {Function(String, String, String):Boolean|null|undefined} Фильтр данных для контрола списка сущностей
          */
         _dataSourceFilter: function (filterField, dataValue, filterValue) {
            //Выбираем все строки, содержащие введенную пользователем подстроку без учета регистра
            return new RegExp('^.*' + filterValue + '.*$', 'i').test(dataValue);
         }
      },

      $constructor: function () {
         if (!$ws.helpers.instanceOfMixin(this, 'SBIS3.CONTROLS.PickerMixin')) {
            throw new Error('Mixin SBIS3.CONTROLS.PickerMixin is required.');
         }
         if (!$ws.helpers.instanceOfMixin(this, 'SBIS3.CONTROLS.DataBindMixin')) {
            throw new Error('Mixin SBIS3.CONTROLS.DataBindMixin is required.');
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
            if (this._list) {
               this._list.destroy();
            }

            this._disconnectBindings();
         }
      },

      /**
       * Инициализирует правила проброса данных (контекст -> фильтр, запись -> контекст)
       * @private
       */
      _initBindingRules: function () {
         var convertToObject = function (bindings) {
            var result = {};
            for (var i = 0, len = bindings.length; i < len; i++) {
               var item = bindings[i];
               result[item.contextField] = item.itemField;
            }

            return result;
         };

         this._filterBindings = convertToObject(this._options.filterBindings);

         if (!this._options.resultBindings.length) {
            this._options.resultBindings = this._options.filterBindings;
         }
         this._resultBindings = convertToObject(this._options.resultBindings);
      },

      /**
       * Устанавливает связи между компонентами
       * @private
       */
      _connectBindings: function () {
         var self = this;

         //Подписываемся на события в отслеживаемых контролах
         var onFocusIn = function () {
            self._checkPickerState('', false);
         };
         var onFocusOut = function () {
            self.hidePicker();
         };
         $ws.helpers.forEach(this._options.observableControls, function (control) {
            this.subscribeTo(control, 'onFocusIn', onFocusIn);
            //this.subscribeTo(control, 'onFocusOut', onFocusOut);
         }, this);

         //Подписываемся на изменение полей контекста
         var context = this._getBindingContext();
         this.subscribeTo(context, 'onFieldChange', (function (eventObject, fieldName, fieldValue, initiator) {
            if (this._checkContext) {
               this._checkPickerState(fieldName, true);
            }
         }).bind(this));
      },

      /**
       * Разрывает связи между компонентами
       * @private
       */
      _disconnectBindings: function () {
      },

      /**
       * Заполняет значения фильтра
       * @private
       */
      _buildFilter: function () {
         var prevFilter = this._filter || {};
         this._filter = {};
         this._filterChanged = false;

         var context = this._getBindingContext();
         for (var field in this._filterBindings) {
            if (this._filterBindings.hasOwnProperty(field)) {
               var filterField = this._filterBindings[field],
                  filterValue = context.getValue(field);
               if (filterValue && String(filterValue).length >= this._options.startChar) {
                  this._filter[filterField] = filterValue;
               }

               if (prevFilter[filterField] !== this._filter[filterField]) {
                  this._filterChanged = true;
               }
            }
         }

         this._notify('onFilterBuild', this._filter, this._filterBindings);
      },

      /**
       * Устанавливает фильтр данных, прокидываемый в dataSource компонента списка сущностей
       * @param {Function(String, String, String):Boolean|null|undefined} filter Фильтр данных
       * <wiTag group="Отображение">
       * Function - определяемый пользователем фильтр.
       * null - фильтрация по полному совпадению значения поля.
       * undefined - дополнительный фильтр по-умолчанию (поиск по подстроке).
       * @example
       * <pre>
       *    function(filterField, dataValue, filterValue) {
         *       //Все, начинающиеся с filterValue
         *       return new RegExp('^' + filterValue + '.*$', 'i').test(dataValue);
         *    }
       * </pre>
       */
      setDataSourceFilter: function (filter) {
         this._dataSourceFilter = filter;

         //TODO: убрать обращение к protected-членам
         if (this._list && typeof this._list._dataSource.setDataFilterCallback == 'function') {
            this._list._dataSource.setDataFilterCallback(this._dataSourceFilter);
         }
      },

      /**
       * Показывает индикатор загрузки
       * @private
       */
      _showLoadingIndicator: function () {
         if (this._loadingIndicator === undefined) {
            var holder = this._options.loadingContainer ? $(this._options.loadingContainer) : this.getContainer();

            holder.addClass('controls-Suggest__loadingContainer');

            this._loadingIndicator = $('<div/>')
               .addClass('controls-Suggest__loadingIndicator')
               .appendTo(holder);
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
       * Возвращает контрол списка сущностей через callback
       * @returns {$ws.proto.Deferred}
       * @see list
       */
      getList: function () {
         var def = new $ws.proto.Deferred();

         if (this._list === undefined) {
            if (this._options.list instanceof $ws.proto.Control) {
               //Готовый инстанс
               this._list = this._options.list;
               this._initList();
               def.callback(this._list);
            } else {
               //Набор "Сделай сам"
               var self = this;
               require([this._options.list.className], function (ListControl) {
                  var options = $ws.core.merge({
                     parent: self._picker
                  }, self._options.list.options);
                  if (!options.element) {
                     options.element = self._getListContainer();
                  }
                  self._list = new ListControl(options);

                  self._initList();

                  def.callback(self._list);
               });
            }
         } else {
            def.callback(this._list);
         }

         return def;
      },

      /**
       * Инициализирует контрол списка сущностей
       * @private
       */
      _initList: function () {
         this.setDataSourceFilter(this._dataSourceFilter);

         this.subscribeTo(this._list, 'onDataLoad', this._onListDataLoad.bind(this));

         this.subscribeTo(this._list, 'onDrawItems', this._onListDrawItems.bind(this));

         this.subscribeTo(this._list, 'onSelectedItemChange', (function (eventObject, id) {
            this._onListItemSelect(id);
         }).bind(this));

         this.subscribeTo(this._list, 'onSelectedItemsChange', (function (eventObject, idArray) {
            this._onListItemSelect(idArray.length ? idArray[0] : null);
         }).bind(this));

         var self = this;
         this._list.setDataSource = this._list.setDataSource.callNext(function () {
            self.setDataSourceFilter(self._dataSourceFilter);
         });

         this._notify('onListReady', this._list);
      },

      /**
       * Перезагружает содержимое контрола списка сущностей, если есть изменения в фильтре
       * @private
       */
      _reloadList: function () {
         if (!this._filterChanged) {
            return;
         }

         this._showLoadingIndicator();

         var self = this;
         this.getList().addCallback(function (list) {
            list.reload(self._filter);
         });
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
      _onListDataLoad: function () {
         this._hideLoadingIndicator();
      },

      /**
       * Вызывается после отрисовки данных контролом списка сущностей
       * @private
       */
      _onListDrawItems: function () {
         if (this._picker) {
            this._picker.recalcPosition();
         }
      },

      /**
       * Вызывается после выбора записи в контроле списка сущностей
       * @private
       */
      _onListItemSelect: function (id) {
         if (id === null || id === undefined) {
            return;
         }

         //TODO: убрать обращение к protected-членам
         var def = new $ws.proto.Deferred();
         if (this._list._dataSet) {
            def.callback(this._list._dataSet.getRecordByKey(id));
         } else {
            this._list._dataSource.read(id).addCallback(function (item) {
               def.callback(item);
            });
         }

         var self = this;
         def.addCallback(function (item) {
            self._checkContext = !self._options.usePicker;
            self._notify('onListItemSelect', item, self._resultBindings);
            var context = self._getBindingContext();
            for (var field in self._resultBindings) {
               if (self._resultBindings.hasOwnProperty(field)) {
                  context.setValue(
                     field,
                     item.get(self._resultBindings[field]),
                     false,
                     self._list
                  );
               }
            }
            self._checkContext = true;
         });
      },

      /**
       * Проверяет необходимость изменения состояния пикера (скрыт/показан+загружен)
       * @param {String} fieldName Имя изменившегося поля в контексте
       * @param {Boolean} delayed Выполнить проверку с задержкой
       * @private
       */
      _checkPickerState: function (fieldName, delayed) {
         if (fieldName && !(fieldName in this._filterBindings)) {
            return;
         }

         if (this._delayTimer) {
            clearTimeout(this._delayTimer);
            this._delayTimer = null;
         }

         this._buildFilter();

         var filterEmpty = Object.isEmpty(this._filter);
         if (filterEmpty) {
            this.hidePicker();
            this._reloadList();
         } else {
            var self = this;
            this._delayTimer = setTimeout(function () {
               if (!filterEmpty) {
                  self.showPicker();
                  self._reloadList();
               }
            }, delayed ? this._options.delay : 0);
         }
      },

      _setPickerContent: function () {
         this._picker.getContainer().addClass('controls-Suggest__picker');
      },

      showPicker: function () {
         if (this._options.usePicker) {
            PickerMixin.showPicker.apply(this, arguments);
            this._setWidth();
         }
      },

      _setWidth: function () {
         if (this._picker._options.target) {
            this._picker.getContainer().css({
               'min-width': this._picker._options.target.outerWidth() - this._border
            });
         }
      }
   };

   return SuggestMixin;
});
