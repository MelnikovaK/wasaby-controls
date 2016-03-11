define('js!SBIS3.CONTROLS.DSMixin', [
   'js!SBIS3.CONTROLS.Data.Source.Memory',
   'js!SBIS3.CONTROLS.Data.Source.SbisService',
   'js!SBIS3.CONTROLS.Data.Collection.RecordSet',
   'js!SBIS3.CONTROLS.Data.Query.Query',
   'js!SBIS3.CORE.MarkupTransformer',
   'js!SBIS3.CONTROLS.Data.Collection.ObservableList',
   'js!SBIS3.CONTROLS.Data.Projection.Projection',
   'js!SBIS3.CONTROLS.Data.Bind.ICollection',
   'js!SBIS3.CONTROLS.Data.Projection.Collection',
   'js!SBIS3.CONTROLS.Utils.TemplateUtil'
], function (MemorySource, SbisService, RecordSet, Query, MarkupTransformer, ObservableList, Projection, IBindCollection, Collection, TemplateUtil) {

   /**
    * Миксин, задающий любому контролу поведение работы с набором однотипных элементов.
    * @mixin SBIS3.CONTROLS.DSMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   function propertyUpdateWrapper(func) {
      return function() {
         return this.runInPropertiesUpdate(func, arguments);
      };
   }

   var DSMixin = /**@lends SBIS3.CONTROLS.DSMixin.prototype  */{
       /**
        * @event onDrawItems После отрисовки всех элементов коллекции
        * @param {$ws.proto.EventObject} eventObject Дескриптор события.
        * @example
        * <pre>
        *     Menu.subscribe('onDrawItems', function(){
        *        if (Menu.getItemsInstance(2).getCaption() == 'Входящие'){
        *           Menu.getItemsInstance(2).destroy();
        *        }
        *     });
        * </pre>
        * @see items
        * @see displayField
        */
       /**
        * @event onDataLoad При загрузке данных
        * @param {$ws.proto.EventObject} eventObject Дескриптор события.
        * @param {SBIS3.CONTROLS.DataSet} dataSet Набор данных.
        * @example
        * <pre>
        *     myComboBox.subscribe('onDataLoad', function(eventObject) {
        *        TextBox.setText('Загрузка прошла успешно');
        *     });
        * </pre>
        * @see items
        * @see setDataSource
        * @see getDataSource
        */
      /**
       * @event onDataLoadError При ошибке загрузки данных
       * @remark
       * Событие сработает при получении ошибки от любого метода БЛ, вызванного стандартным способом.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {HTTPError} error Произошедшая ошибка.
       * @return {Boolean} Если вернуть:
       * <ol>
       * <li>true, то будет считаться, что ошибка обработана, и стандартное поведение отменяется.</li>
       * <li>Если не возвращать true, то выведется alert с описанием ошибки.</li>
       * </ol>
       * @example
       * <pre>
       *    myView.subscribe('onDataLoadError', function(event, error){
       *       event.setResult(true);
       *       TextBox.setText('Ошибка при загрузке данных');
       *    });
       * </pre>
       */
      /**
       * @event onBeforeDataLoad Перед загрузкой данных
       * @remark
       * Событие сработает перед запросом к источнику данных
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @example
       * <pre>
       *    myView.subscribe('onBeforeDataLoad', function(event, error){
       *       var filter = this.getFilter();
       *       filter['myParam'] = myValue;
       *       this.setFilter(filter, true)
       *    });
       * </pre>
       */
      /**
       * @event onItemsReady при готовности экземпляра коллекции iList
       * @remark
       * Например когда представлению задается Source и нужно подписаться на события List, который вернется в результате запроса
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @example
       * <pre>
       *    myView.subscribe('onItemsReady', function(event){
       *       var items = this.getItems();
       *       items.subscribe('onCollectionChange', function(){
       *          alert('Collection is changed')
       *       })
       *    });
       * </pre>
       */
      $protected: {
         _needToRedraw: false,
         _itemsProjection: null,
         _items : null,
         _itemsInstances: {},
         _offset: 0,
         _limit: undefined,
         _dataSource: undefined,
         _dataSet: null,
         _dotItemTpl: null,
         _options: {
            /**
             * @cfg {String} Поле элемента коллекции, которое является идентификатором записи
             * @remark
             * Выбранный элемент в коллекции задаётся указанием ключа элемента.
             * @example
             * <pre class="brush:xml">
             *     <option name="keyField">Идентификатор</option>
             * </pre>
             * @see items
             * @see displayField
             * @see setDataSource
             * @see SBIS3.CONTROLS.Selectable#selectedKey
             * @see SBIS3.CONTROLS.Selectable#setSelectedKey
             * @see SBIS3.CONTROLS.Selectable#getSelectedKey
             */
            keyField : null,
            /**
             * @cfg {String} Поле элемента коллекции, из которого отображать данные
             * @example
             * <pre class="brush:xml">
             *     <option name="displayField">Название</option>
             * </pre>
             * @remark
             * Данные задаются либо в опции {@link items}, либо методом {@link setDataSource}.
             * Источник данных может состоять из множества полей. В данной опции необходимо указать имя поля, данные
             * которого нужно отобразить в выпадающем списке.
             * @see keyField
             * @see items
             * @see setDataSource
             */
            displayField: null,
             /**
              * @cfg {Array.<Object.<String,String>>} Масив объектов. Набор исходных данных, по которому строится отображение
              * @name SBIS3.CONTROLS.ListControlMixin#items
              * @remark
              * !Важно: данные для коллекции элементов можно задать либо в этой опции,
              * либо через источник данных методом {@link setDataSource}.
              * @example
              * <pre class="brush:xml">
              *     <options name="items" type="array">
              *        <options>
              *            <option name="id">1</option>
              *            <option name="title">Пункт1</option>
              *         </options>
              *         <options>
              *            <option name="id">2</option>
              *            <option name="title">Пункт2</option>
              *         </options>
              *         <options>
              *            <option name="id">3</option>
              *            <option name="title">ПунктПодменю</option>
              *            <!--необходимо указать это полем иерархии для корректной работы-->
              *            <option name="parent">2</option>
              *            <option name="icon">sprite:icon-16 icon-Birthday icon-primary</option>
              *         </options>
              *      </options>
              *      <option name="hierField">parent</option>
              * </pre>
              * @see keyField
              * @see displayField
              * @see setDataSource
              * @see getDataSet
              * @see hierField
              */
            items: null,
            /**
             * @cfg {DataSource|SBIS3.CONTROLS.Data.Source.ISource|Function} Набор исходных данных, по которому строится отображение
             * @noShow
             * @see setDataSource
             */
            dataSource: undefined,
             /**
              * @cfg {Number} Количество записей, запрашиваемых с источника данных
              * @remark
              * Опция определяет количество запрашиваемых записей с источника даныых как при построении контрола, так и
              * при осуществлении подгрузки.
              * Для иерархических структур при пейджинге по скроллу опция также задаёт количество подгружаемых записей
              * кликом по кнопке "Ещё".
              * !Важно: в базе данных как листья, так и узлы являются записями. Поэтому необходимо учитывать, что в
              * количество записей считаются и узлы, и листья. Т.е. подсчёт идёт относительно полностью развёрнутого
              * представления данных. Например, узел с тремя листьями - это 4 записи.
              * </ul>
              * @example
              * <pre class="brush:xml">
              *     <option name="pageSize">10</option>
              * </pre>
              * @see setPageSize
              */
            pageSize: undefined,
            /**
             * @typedef {Object} GroupBy
             * @property {String} field Поле записи
             * @property {Function} method Метод группировки
             * @property {String} template Шаблон вёрстки
             * @property {Function} render Функция визуализации
             */
            /**
             * @cfg {GroupBy} Настройка группировки записей
             * @remark
             * Если задать только поле записи(field), то будет группировать по типу лесенки (Пример 1).
             * Т.е. перед каждым блоком с одинаковыми данными будет создавать блок, для которого можно указать шаблон
             * Внимание! Для правильной работы группировки данные уже должны прийти отсортированные!
             * @example
             * 1:
             * <pre class="brush:xml">
             *    <options name="groupBy">
             *        <option name="field">ДатаВремя</option>
             *    </options>
             * </pre>
             * Пример с указанием метода группировки:
             * <pre class="brush:xml">
             *    <options name="groupBy">
             *        <option name="field">ДатаВремя</option>
             *         <option name="method" type="function">js!SBIS3.CONTROLS.Demo.MyListView:prototype.myGroupBy</option>
             *    </options>
             * </pre>
             */
            groupBy : {},
            /**
             * @cfg {Function} Пользовательский метод добавления атрибутов на элементы коллекции
             */
            userItemAttributes : null,
            /**
             * @cfg {String|HTMLElement|jQuery} Отображаемый контент при отсутствии данных
             * @example
             * <pre class="brush:xml">
             *     <option name="emptyHTML">Нет данных</option>
             * </pre>
             * @remark
             * Опция задаёт текст, отображаемый как при абсолютном отсутствии данных, так и в результате {@link groupBy фильтрации}.
             * @see items
             * @see setDataSource
             * @see groupBy
             */
            emptyHTML: '',
            /**
             * @cfg {Object} Фильтр данных
             * @example
             * <pre class="brush:xml">
             *     <options name="filter">
             *        <option name="creatingDate" bind="selectedDocumentDate"></option>
             *        <option name="documentType" bind="selectedDocumentType"></option>
             *     </options>
             * </pre>
             */
            filter: {},
            /**
             * @cfg {Array} Сортировка данных. Задается массивом объектов, в котором ключ - это имя поля, а значение ASC - по возрастанию, DESC  - по убыванию
             * @example
             * <pre class="brush:xml">
             *     <options name="sorting" type="Array">
             *        <option name="date" value="ASC"></option>
             *        <option name="name" value="DESC"></option>
             *     </options>
             * </pre>
             */
            sorting: [],
            /**
             * @cfg {Object.<String,String>} соответствие опций шаблона полям в рекорде
             */
            templateBinding: {},
            /**
             * @cfg {Object.<String,String>} подключаемые внешние шаблоны, ключу соответствует поле it.included.<...> которое будет функцией в шаблоне
             */
            includedTemplates: {},
            /**
             * @cfg {String|function} Шаблон элементов, которые будт рисоваться под даннными.
             * @remark
             * Например для отрисовки кнопко +Документ, +Папка.
             * Если задан, то под всеми(!) элементами появится контейнер с содержимым этого шаблона
             */
            footerTpl: undefined,
            /**
             * @cfg {Boolean} Автоперерисовка при изменении данных
             */
            autoRedraw: true
         },
         _loader: null
      },

      $constructor: function () {
         this._publish('onDrawItems', 'onDataLoad', 'onDataLoadError', 'onBeforeDataLoad', 'onItemsReady');
         if (typeof this._options.pageSize === 'string') {
            this._options.pageSize = this._options.pageSize * 1;
         }
         this._bindHandlers();
         this._prepareConfig(this._options.dataSource, this._options.items);
      },

      _prepareConfig : function(sourceOpt, itemsOpt) {
         var
            keyField = this._options.keyField;
         if (!keyField) {
            $ws.single.ioc.resolve('ILogger').log('Option keyField is required');
         }
         if (sourceOpt) {
            this._dataSource = this._prepareSource(sourceOpt);
            this._items = null;
         }
         else if (itemsOpt) {
            if ($ws.helpers.instanceOfModule(itemsOpt, 'SBIS3.CONTROLS.Data.Projection.Projection')) {
               this._itemsProjection = itemsOpt;
               this._items = this._convertItems(this._itemsProjection.getCollection());
               this._setItemsEventHandlers();
               this._notify('onItemsReady');
               this._itemsReadyCallback();
            }
            else if (itemsOpt instanceof Array) {
               /*TODO уменьшаем количество ошибок с key*/
               if (!this._options.keyField) {
                  var itemFirst = itemsOpt[0];
                  if (itemFirst) {
                     this._options.keyField = Object.keys(itemFirst)[0];
                  }
               }

               /*TODO для совеместимости пока создадим сорс*/
               this._dataSource = new MemorySource({
                  data: itemsOpt,
                  idProperty: this._options.keyField
               });
            }
            else {
               this._items = itemsOpt;
               this._dataSource = null;
               this._createDefaultProjection(this._items);
               this._itemsReadyCallback();
               this._notify('onItemsReady');
            }
         }
      },
      after : {
         _modifyOptions: function (opts) {
            opts.footerTpl = TemplateUtil.prepareTemplate(opts.footerTpl);
            return opts;
         },
         destroy : function() {
            this._unsetItemsEventHandlers();
            this._clearItems();
         }
      },

      _createDefaultProjection: function(items) {
         this._itemsProjection = Projection.getDefaultProjection(items);
      },

      _convertItems: function (items) {
         items = items || [];
         if (items instanceof Array) {
            items = new ObservableList({
               items: items
            });
         }

         if (!$ws.helpers.instanceOfMixin(items, 'SBIS3.CONTROLS.Data.Collection.IEnumerable')) {
            throw new Error('Items should implement SBIS3.CONTROLS.Data.Collection.IEnumerable');
         }

         return items;
      },

      _prepareSource: function(sourceOpt) {
         var result;
         switch (typeof sourceOpt) {
            case 'function':
               result = sourceOpt.call(this);
               break;
            case 'object':
               if ($ws.helpers.instanceOfMixin(sourceOpt, 'SBIS3.CONTROLS.Data.Source.ISource')) {
                  result = sourceOpt;
               }
               if ('module' in sourceOpt) {
                  var DataSourceConstructor = require(sourceOpt.module);
                  result = new DataSourceConstructor(sourceOpt.options || {});
               }
               break;
         }
         return result;
      },

      /**
       * Возвращает отображаемую контролом коллекцию, сделанную на основе источника данных
       * @param {SBIS3.CONTROLS.Data.Source.ISource} source
       * @returns {SBIS3.CONTROLS.Data.Collection.IList}
       * @private
       */
      _convertDataSourceToItems: function (source) {
         return new ObservableList({
            source: source
         });
      },


      _bindHandlers: function () {
         /*this._onBeforeItemsLoad = onBeforeItemsLoad.bind(this);
         this._onAfterItemsLoad = onAfterItemsLoad.bind(this);
         this._dataLoadedCallback = this._dataLoadedCallback.bind(this);*/
         this._onCollectionChange = onCollectionChange.bind(this);
         this._onCollectionItemChange = onCollectionItemChange.bind(this);
         /*this._onCurrentChange = onCurrentChange.bind(this);*/
      },

      _setItemsEventHandlers: function() {
         this.subscribeTo(this._itemsProjection, 'onCollectionChange', this._onCollectionChange);
         this.subscribeTo(this._itemsProjection, 'onCollectionItemChange', this._onCollectionItemChange);
      },

      _unsetItemsEventHandlers: function () {
         this.unsubscribeFrom(this._itemsProjection, 'onCollectionChange', this._onCollectionChange);
         this.unsubscribeFrom(this._itemsProjection, 'onCollectionItemChange', this._onCollectionItemChange);
      },
       /**
        * Метод установки источника данных.
        * @remark
        * Данные могут быть заданы либо этим методом, либо опцией {@link items}.
        * @param source Новый источник данных.
        * @param noLoad Установить новый источник данных без запроса на БЛ.
        * @example
        * <pre>
        *     define(
        *     'SBIS3.MY.Demo',
        *     'js!SBIS3.CONTROLS.Data.Source.Memory',
        *     function(MemorySource){
        *        //коллекция элементов
        *        var arrayOfObj = [
        *           {'@Заметка': 1, 'Содержимое': 'Пункт 1', 'Завершена': false},
        *           {'@Заметка': 2, 'Содержимое': 'Пункт 2', 'Завершена': false},
        *           {'@Заметка': 3, 'Содержимое': 'Пункт 3', 'Завершена': true}
        *        ];
        *        //источник статических данных
        *        var ds1 = new MemorySource({
        *           data: arrayOfObj,
        *           idProperty: '@Заметка'
        *        });
        *        this.getChildControlByName("ComboBox 1").setDataSource(ds1);
        *     })
        * </pre>
        * @see dataSource
        * @see onDrawItems
        * @see onDataLoad
        */
      setDataSource: function (source, noLoad) {
          this._unsetItemsEventHandlers();
          this._prepareConfig(source);
          if (!noLoad) {
             return this.reload();
          }
      },
      /**
       * Метод получения набора данных, который в данный момент установлен в представлении.
       * @example
       * <pre>
       *     var dataSet = myComboBox.getDataSet(),
       *     count = dataSet.getCount();
       *     if (count > 1) {
	   *        title.setText('У вас есть выбор: это хорошо!');
       *     }
       * </pre>
       * @see dataSource
       * @see setDataSource
       * @see onDrawItems
       * @see onDataLoad
       */

      /*TODO поддержка старого API*/
      getDataSet: function(compatibilityMode) {
         if(!compatibilityMode) {
            $ws.single.ioc.resolve('ILogger').log('Получение DataSet явялется устаревшим функционалом используйте getItems()');
         }
         return this._dataSet;
      },
       /**
        * Метод перезагрузки данных.
        * Можно задать фильтрацию, сортировку.
        * @param {String} filter Параметры фильтрации.
        * @param {String} sorting Параметры сортировки.
        * @param offset Элемент, с которого перезагружать данные.
        * @param {Number} limit Ограничение количества перезагружаемых элементов.
        */
      reload: propertyUpdateWrapper(function (filter, sorting, offset, limit) {
         if (this._options.pageSize) {
            this._limit = this._options.pageSize;
         }

         var
            def,
            self = this,
            filterChanged = typeof(filter) !== 'undefined',
            sortingChanged = typeof(sorting) !== 'undefined',
            offsetChanged = typeof(offset) !== 'undefined',
            limitChanged = typeof(limit) !== 'undefined';

         this._cancelLoading();
         if (filterChanged) {
            this.setFilter(filter, true);
         }
          if (sortingChanged) {
             this.setSorting(sorting, true);
          }
          this._offset = offsetChanged ? offset : this._offset;
          this._limit = limitChanged ? limit : this._limit;

          if (this._dataSource) {
             this._toggleIndicator(true);
             this._notify('onBeforeDataLoad', this._options.filter, this.getSorting(), this._offset, this._limit);
             def = this._callQuery(this._options.filter, this.getSorting(), this._offset, this._limit)
                .addCallback($ws.helpers.forAliveOnly(function (list) {
                   self._toggleIndicator(false);
                   if (self._items) {
                      self._notify('onDataLoad', list);
                      self._dataSet.setMetaData(list.getMetaData());
                      self._items.assign(list);
                      if (self._items !== self._dataSet) {
                         self._dataSet.assign(list);
                      }
                      self._dataLoadedCallback();
                      if (!this._options.autoRedraw) {
                         this.redraw();
                      }
                   }
                   else {
                      self._notify('onDataLoad', list);
                      self._items = list;
                      self._dataSet = list;
                      self._createDefaultProjection(self._items);
                      self._setItemsEventHandlers();
                      this._notify('onItemsReady');
                      self._itemsReadyCallback();
                      self._dataLoadedCallback();
                      self.redraw();
                   }
                   //self._notify('onBeforeRedraw');
                   return list;
                }, self))
                .addErrback($ws.helpers.forAliveOnly(function (error) {
                   if (!error.canceled) {
                      self._toggleIndicator(false);
                      if (self._notify('onDataLoadError', error) !== true) {
                         $ws.helpers.message(error.message.toString().replace('Error: ', ''));
                      }
                   }
                   return error;
                }, self));
             this._loader = def;
          } else {
             this._redraw();
             def = new $ws.proto.Deferred();
             def.callback();
          }

         this._notifyOnPropertyChanged('filter');
         this._notifyOnPropertyChanged('sorting');
         this._notifyOnPropertyChanged('offset');
         this._notifyOnPropertyChanged('limit');

         return this._loader;
      }),

      _callQuery: function (filter, sorting, offset, limit) {
         if (!this._dataSource) {
            return;
         }
         var query = new Query();
         query.where(filter)
            .offset(offset)
            .limit(limit)
            .orderBy(sorting);

         return this._dataSource.query(query).addCallback((function(dataSet) {
            if (this._options.keyField && this._options.keyField !== dataSet.getIdProperty()) {
               dataSet.setIdProperty(this._options.keyField);
            }
            var recordSet = dataSet.getAll();
            recordSet.setMetaData({
               results: dataSet.getProperty('r'),
               more: dataSet.getTotal(),
               path: dataSet.getProperty('p')
            });
            return recordSet;
         }).bind(this));
      },

      _toggleIndicator:function(){
         /*Method must be implemented*/
      },
      _toggleEmptyData:function() {
         /*Method must be implemented*/
      },
       /**
        * Метод установки количества элементов на одной странице.
        * @param {Number} pageSize Количество записей.
        * @example
        * <pre>
        *     myListView.setPageSize(20);
        * </pre>
        * @remark
        * Метод задаёт/меняет количество записей при построении представления данных.
        * В случае дерева и иерархии:
        * <ul>
        *    <li>при пейджинге по скроллу опция также задаёт количество подгружаемых записей кликом по кнопке "Ещё";</li>
        *    <li>как листья, так и узлы являются записями, количество записей считается относительно полностью
        *    развёрнутого представления данных. Например, узел с тремя листьями - это 4 записи.</li>
        * </ul>
        * @see pageSize
        */
      setPageSize: function(pageSize){
         this._options.pageSize = pageSize;
         this._dropPageSave();
         this.reload(this._options.filter, this.getSorting(), 0, pageSize);
      },
      /**
       * Метод получения количества элементов на одной странице.
       * @see pageSize
       */
      getPageSize: function() {
         return this._options.pageSize
      },
      /**
       * Получить текущий фильтр в наборе данных
       * @returns {Object|*|DSMixin._filter}
       */
      getFilter: function() {
         return this._options.filter;
      },
      /**
       * Установить фильтр на набор данных
       * @param {Object} filter
       * @param {Boolean} noLoad установить фильтр без запроса на БЛ
       */
      setFilter: function(filter, noLoad){
         this._options.filter = filter;
         this._dropPageSave();
         if (this._dataSource && !noLoad) {
            this.reload(this._options.filter, this.getSorting(), 0, this.getPageSize());
         }
      },
      /**
       * Получает текущую сортировку
       * @returns {Array}
       */
      getSorting: function() {
         return this._options.sorting;
      },
      /**
       * Устанавливает текущую сортировку
       */
      setSorting: function(sorting, noLoad) {
         this._options.sorting = sorting;
         this._dropPageSave();
         if (this._dataSource && !noLoad) {
            this.reload(this._options.filter, this.getSorting(), 0, this.getPageSize());
         }
      },
      /**
       * Получить текущий сдвиг навигации
       * @returns {Integer}
       */
      getOffset: function() {
         return this._offset;
      },
      /**
       * Устанавливает текущий сдвиг навигации
       */
      setOffset: function(offset) {
         this._offset = offset;
      },
      //переопределяется в HierarchyMixin
      _setPageSave: function(pageNum){
      },
      //переопределяется в HierarchyMixin
      _dropPageSave: function () {
      },
      //TODO Сделать публичным? вроде так всем захочется делать
      _isLoading: function () {
         return this._loader && !this._loader.isReady();
      },
      //TODO Сделать публичным? вроде так всем захочется делать
      /**
       * После использования нужно присвоить null переданному loader самостоятельно!
       * @param loader
       * @private
       */
      _cancelLoading: function () {
         if (this._isLoading()) {
            this._loader.cancel();
         }
         this._loader = null;
      },
      //TODO поддержка старого - обратная совместимость
      getItems : function() {
         return this._items;
      },
       /**
        * Метод установки либо замены коллекции элементов, заданных опцией {@link items}.
        * @param {Object} items Набор новых данных, по которому строится отображение.
        * @example
        * <pre>
        *     setItems: [
        *        {
        *           id: 1,
        *           title: 'Сообщения'
        *        },{
        *           id: 2,
        *           title: 'Прочитанные',
        *           parent: 1
        *        },{
        *           id: 3,
        *           title: 'Непрочитанные',
        *           parent: 1
        *        }
        *     ]
        * </pre>
        * @see items
        * @see addItem
        * @see getItems
        * @see onDrawItems
        * @see onDataLoad
        */
       setItems: function (items) {
         this._unsetItemsEventHandlers();
         this._items = null;
         this._prepareConfig(undefined, items);
         this.reload();
      },

      _drawItemsCallback: function () {
         /*Method must be implemented*/
      },
      /**
       * Метод перерисвоки списка без повторного получения данных
       */
      redraw: function() {
         this._redraw();
      },
      _redraw: function () {
         var records;

         if (this._items) {
            this._clearItems();
            this._needToRedraw = false;
            records = this._getRecordsForRedraw();
            this._toggleEmptyData(!records.length && this._options.emptyHTML);
            this._drawItems(records);

         }
      },
      _destroySearchBreadCrumbs: function(){
      },
      _getRecordsForRedraw : function() {
         var records = [];
         this._itemsProjection.each(function(item){
            records.push(item.getContents());
         });
         return records;
      },

      _drawItems: function (records, at) {
         var
            curAt = at,
               targetContainer;
         if (records && records.length > 0) {
            for (var i = 0; i < records.length; i++) {
               this._drawAndAppendItem(records[i], curAt, i === records.length - 1);
               if (curAt && curAt.at) {
                  curAt.at++;
               }
            }
            this._reviveItems();
         } else {
            this._notifyOnDrawItems();
         }
      },

      _reviveItems : function() {
         this.reviveComponents().addCallback(this._notifyOnDrawItems.bind(this)).addErrback(function(e){
            throw e;
         });
      },

      /**
       * Сигналит о том, что отрисовка набора закончена
       */
      _notifyOnDrawItems: function() {
         this._notify('onDrawItems');
         this._drawItemsCallback();
      },

      _clearItems: function (container) {
         container = container || this._getItemsContainer();
         /*Удаляем компоненты-инстансы элементов*/
         if (!Object.isEmpty(this._itemsInstances)) {
            for (var i in this._itemsInstances) {
               if (this._itemsInstances.hasOwnProperty(i)) {
                  this._itemsInstances[i].destroy();
               }
            }
         }
         this._itemsInstances = {};
         if (container.length){
            var itemsContainers;
            //В случае, когда это полная перерисовка, надо дестроить контролы только в итемах и группировках
            if (container.get(0) == this._getItemsContainer().get(0)) {
               itemsContainers = $('.controls-ListView__item, .controls-GroupBy', container.get(0));
               /*Удаляем вложенные компоненты*/
               this._destroyControls(itemsContainers);

               /*Удаляем сами items*/
               itemsContainers.remove();
            }
            else {
               this._destroyControls(container);
            }

         }
      },

      _destroyControls: function(container){
         $('[data-component]', container).each(function (i, item) {
            var inst = item.wsControl;
            if (inst) {
               inst.destroy();
            }
         });
      },
      //метод определяющий в какой контейнер разместить определенный элемент
      _getTargetContainer: function (item) {
         //по стандарту все строки рисуются в itemsContainer
         return this._getItemsContainer();
      },

      //метод отдающий контейнер в котором надо отрисовывать элементы
      _getItemsContainer: function () {
         return this._container;
      },

      /**
       * Метод перерисовки определенной записи
       * @param {Object} item Запись, которую необходимо перерисовать
       */
      redrawItem: function(item) {
         var
            targetElement = this._getElementByModel(item),
            newElement = this._drawItem(item);
         targetElement.after(newElement).remove();
         this._reviveItems();
      },

      _getElementByModel: function(item) {
         return this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + item.getKey() + '"]');
      },

      _drawItem: function (item, at, last) {
         var
            itemInstance;
         //Запускаем группировку если она есть. Иногда результат попадает в группровку и тогда отрисовывать item не надо
         if (this._group(item, at, last) !== false) {
            itemInstance = this._createItemInstance(item, this._getTargetContainer(item), at);
            this._addItemAttributes(itemInstance, item);
         }
         return itemInstance;
      },

      _drawAndAppendItem: function(item, at, last) {
         var
            itemInstance = this._drawItem(item, at, last);
         if (itemInstance) {
            this._appendItemTemplate(item, this._getTargetContainer(item), itemInstance, at);
         }
      },

      /**
       *
       * Из метода группировки можно вернуть Boolean - рисовать ли группировку
       * или Объект - {
       *    drawItem - рисовать ли текущую запись
       *    drawGroup - рисовавть ли группировку перед текущей записью
       * }
       * @param item
       * @param at
       */
      _group: function(item, at, last){
         var groupBy = this._options.groupBy,
               resultGroup,
               drawGroup,
               drawItem = true;
         if (!Object.isEmpty(groupBy)){
            resultGroup = groupBy.method.apply(this, [item, at, last]);
            drawGroup = typeof resultGroup === 'boolean' ? resultGroup : (resultGroup instanceof Object && resultGroup.hasOwnProperty('drawGroup') ? !!resultGroup.drawGroup : false);
            drawItem = resultGroup instanceof Object && resultGroup.hasOwnProperty('drawItem') ? !!resultGroup.drawItem : true;
            if (drawGroup){
               this._drawGroup(item, at, last)
            }
         }
         return drawItem;
      },
      _drawGroup: function(item, at, last){
         var
               groupBy = this._options.groupBy,
               tplOptions = {
                  columns : $ws.core.clone(this._options.columns || []),
                  multiselect : this._options.multiselect,
                  hierField: this._options.hierField + '@'
               },
               targetContainer,
               itemInstance;
         targetContainer = this._getTargetContainer(item);
         tplOptions.item = item;
         tplOptions.colspan = tplOptions.columns.length + this._options.multiselect;
         itemInstance = this._buildTplItem(item, groupBy.template(tplOptions));
         this._appendItemTemplate(item, targetContainer, itemInstance, at);
         //Сначала положим в дом, потом будем звать рендеры, иначе контролы, которые могут создать в рендере неправмльно поймут свою ширину
         if (groupBy.render && typeof groupBy.render === 'function') {
            groupBy.render.apply(this, [item, itemInstance, last]);
         }
         //Навесим класс группировки и удалим лишний класс на item, если он вдруг добавился
         itemInstance.addClass('controls-GroupBy')
               .removeClass('controls-ListView__item');

      },
      /**
       * Установка группировки элементов. Если нужно, чтобы стандартаная группировка для этого элемента не вызывалась -
       * нужно обязательно переопределить(передать) все опции (field, method, template, render) иначе в группировку запишутся стандартные параметры.
       * @remark Всем элементам группы добавляется css-класс controls-GroupBy
       * @param group
       * @param redraw
       */
      setGroupBy : function(group, redraw){
         //TODO может перерисовку надо по-другому делать
         this._options.groupBy = group;
         // запросим данные из источника
         if (!Object.isEmpty(this._options.groupBy)){
            if (!this._options.groupBy.hasOwnProperty('method')){
               this._options.groupBy.method = this._groupByDefaultMethod;
            }
            if (!this._options.groupBy.hasOwnProperty('template')){
               this._options.groupBy.template = this._getGroupTpl();
            }
            if (!this._options.groupBy.hasOwnProperty('render')){
               this._options.groupBy.render = this._groupByDefaultRender;
            }

         }
         if (redraw){
            this._redraw();
         }
      },
      _groupByDefaultMethod: function(){
         throw new Error('Method _groupByDefaultMethod() must be implemented');
      },
      _getGroupTpl : function(){
         throw new Error('Method _getGroupTpl() must be implemented');
      },
      _groupByDefaultRender: function(){
         throw new Error('Method _groupByDefaultRender() must be implemented');
      },
      _getItemTemplate: function () {
         throw new Error('Method _getItemTemplate() must be implemented');
      },

      _addItemAttributes: function (container, item) {
         var strKey = item.getKey();
         if (strKey == null) {
            strKey += '';
         }
         container.attr('data-id', strKey).addClass('controls-ListView__item');
         if (this._options.userItemAttributes && this._options.userItemAttributes instanceof Function) {
            this._options.userItemAttributes(container, item);
         }
      },

      _createItemInstance: function (item, targetContainer, at) {
         return this._buildTplItem(item, this._getItemTemplate(item));
      },

      _buildTplItem: function(item, itemTpl){
         var dotTemplate = TemplateUtil.prepareTemplate(itemTpl);

         if (typeof dotTemplate == 'function') {
            return $(MarkupTransformer(dotTemplate(this._buildTplArgs(item))));
         } else {
            throw new Error('Ошибка в itemTemplate');
         }
      },
      _buildTplArgs: function(item) {
         var tplOptions = {
            templateBinding : this._options.templateBinding,
            item: item
         };
         if (this._options.includedTemplates) {
            var tpls = this._options.includedTemplates;
            tplOptions.included = {};
            for (var j in tpls) {
               if (tpls.hasOwnProperty(j)) {
                  tplOptions.included[j] = TemplateUtil.prepareTemplate(tpls[j]);
               }
            }
         }
         return tplOptions
      },
      _appendItemTemplate: function (item, targetContainer, itemBuildedTpl, at) {
         if (at && (typeof at.at !== 'undefined')) {
            var atContainer = at.at !== 0 && $('.controls-ListView__item', this._getItemsContainer().get(0)).eq(at.at-1);
            if (atContainer.length) {
               atContainer.after(itemBuildedTpl);
            }
            else {
               atContainer = $('.controls-ListView__item', this._getItemsContainer().get(0)).eq(at.at);
               if (atContainer.length) {
                  atContainer.before(itemBuildedTpl);
               } else {
                  targetContainer.append(itemBuildedTpl);
               }
            }
         }
         else {
            targetContainer.append(itemBuildedTpl);
         }
      },

      _fillItemInstances: function () {
         var childControls = this.getChildControls();
         for (var i = 0; i < childControls.length; i++) {
            if (childControls[i].getContainer().hasClass('controls-ListView__item')) {
               var id = childControls[i].getContainer().attr('data-id');
               this._itemsInstances[id] = childControls[i];
            }
         }

      },
       /**
        * Метод получения элементов коллекции.
        * @returns {*}
        * @example
        * <pre>
        *     var ItemsInstances = Menu.getItemsInstances();
        *     for (var i = 0; i < ItemsInstances.length; i++){
        *        ItemsInstances[i].setCaption('Это пункт меню №' + ItemsInstances[i].attr('data-id'));
        *     }
        * </pre>
        */
      getItemsInstances: function () {
         if (Object.isEmpty(this._itemsInstances)) {
            this._fillItemInstances();
         }
         return this._itemsInstances;
      },
       /**
        * Метод получения контрола по идентификатору элемента коллекции.
        * @param {String|Number|*} id Идентификатор элемента коллекции.
        * @returns {*} Возвращает:
        * <ul>
        *    <li>для группы радиокнопок - соответствующую радиокнопку;</li>
        *    <li>для группы флагов - соответствующий флаг;</li>
        *    <li>для меню - соответствующий элемент меню.</li>
        * </ul>
        * @example
        * <pre>
        *     Menu.getItemsInstance(3).setCaption('SomeNewCaption');
        * </pre>
        * @see getItems
        * @see setItems
        * @see items
        * @see getItemInstances
        */
      getItemInstance: function (id) {
         var instances = this.getItemsInstances();
         return instances[id];
      },
      //TODO Сделать публичным? И перенести в другое место
      _hasNextPage: function (hasMore, offset) {
         offset = offset === undefined ? this._offset : offset;
         //n - приходит true, false || общее количество записей в списочном методе
         //Если offset отрицательный, значит запрашивали последнюю страницу
         return offset < 0 ? false : (typeof (hasMore) !== 'boolean' ? hasMore > (offset + this._options.pageSize) : !!hasMore);
      },
      _scrollToItem: function(itemId) {
         var itemContainer  = $(".controls-ListView__item[data-id='" + itemId + "']", this._getItemsContainer());
         if (itemContainer.length) {
            itemContainer
               .attr('tabindex', -1)
               .focus();
         }
      },
      /**
       * Установить что отображается при отсутствии записей.
       * @param html Содержимое блока.
       * @example
       * <pre>
       *     DataGridView.setEmptyHTML('Нет записей');
       * </pre>
       * @see emptyHTML
       */
      setEmptyHTML: function (html) {
         this._options.emptyHTML = html;
      },

      /**
       * Возвращает источник данных.
       * @returns {*}
       */
      getDataSource: function(){
         return this._dataSource;
      },

      _dataLoadedCallback: function () {

      },
      _itemsReadyCallback: function() {

      },

      _addItem: function (item, at) {
         var ladderDecorator = this._decorators.getByName('ladder');
         ladderDecorator && ladderDecorator.setMarkLadderColumn(true);
         /*TODO отдельно обрабатываем случай с группировкой*/
         var flagAfter = false;
         if (this._options.groupBy) {
            var
               meth = this._options.groupBy.method,
               prev = this._itemsProjection.getPrevious(item),
               next = this._itemsProjection.getNext(item);
            meth.call(this, prev.getContents());
            meth.call(this, item.getContents());
            if (!meth.call(this, next.getContents())) {
               flagAfter = true;
            }
         };
         /**/
         item = item.getContents();
         var target = this._getTargetContainer(item),
            currentItemAt = at > 0 ? this._getItemContainerByIndex(target, at - 1) : null,
            template = this._getItemTemplate(item),
            newItemContainer = this._buildTplItem(item, template),
            rows;
         this._addItemAttributes(newItemContainer, item);
         if (flagAfter) {
            newItemContainer.insertBefore(this._getItemContainerByIndex(target, at));
            rows = [newItemContainer.prev().prev(), newItemContainer.prev(), newItemContainer, newItemContainer.next(), newItemContainer.next().next()];
         } else if (currentItemAt && currentItemAt.length) {
            newItemContainer.insertAfter(currentItemAt);
            rows = [newItemContainer.prev().prev(), newItemContainer.prev(), newItemContainer, newItemContainer.next(), newItemContainer.next().next()];
         } else if(at === 0) {
            newItemContainer.prependTo(target);
            rows = [newItemContainer, newItemContainer.next(), newItemContainer.next().next()];
         } else {
            newItemContainer.appendTo(target);
            rows = [newItemContainer.prev().prev(), newItemContainer.prev(), newItemContainer, newItemContainer.next()];
         }
         ladderDecorator && ladderDecorator.setMarkLadderColumn(false);
         this._ladderCompare(rows);
      },
      _ladderCompare: function(rows){
         //TODO придрот - метод нужен только для адекватной работы лесенки при перемещении элементов местами
         for (var i = 1; i < rows.length; i++){
            var upperRow = rows[i - 1].length ? $('.controls-ladder', rows[i - 1]) : undefined,
                lowerRow = rows[i].length ? $('.controls-ladder', rows[i]) : undefined,
               needHide;
            if (lowerRow) {
               for (var j = 0; j < lowerRow.length; j++) {
                  needHide = upperRow ? (upperRow.eq(j).html() == lowerRow.eq(j).html()) : false;
                  lowerRow.eq(j).toggleClass('ws-invisible', needHide);
               }
            }
         }
      },
      _isNeedToRedraw: function(){
      	return this._options.autoRedraw && this._needToRedraw && !!this._getItemsContainer();
      },

      _moveItem: function(item, to){
         item = item.getContents();
         var targetNode = this._getTargetContainer(item),
            fromContainer = this._getItemContainer(targetNode, item),
            toContainer = this._getItemContainerByIndex(targetNode, to);
         if (fromContainer.length && toContainer.length) {
            fromContainer.insertBefore(toContainer);
         }
      },

      _removeItem: function (item) {
         item = item.getContents();
         var container = this._getItemContainer(this._getTargetContainer(item), item);
         if (container.length) {
            this._clearItems(container);
            this._ladderCompare([container.prev(), container.next()]);
            container.remove();
         }
      },

      _updateItem: function(item) {
         item = item.getContents();
         var container = this._getItemContainer(this._getTargetContainer(item), item),
            template = this._getItemTemplate(item);

         if (container.length) {
            var newItemContainer = this._buildTplItem(item, template);
            this._addItemAttributes(newItemContainer, item);
            this._clearItems(container);
            container.replaceWith(newItemContainer);
            this._ladderCompare([container.prev(), container, container.next()]);
         }
      },

      _getItemContainerByIndex: function(parent, at) {
         return parent.find('> .controls-ListView__item:eq(' + at + ')');
      },

      _getItemContainer: function(parent, item) {
         return parent.find('>[data-id="' + item.getKey() + '"]');
      }
   };

   var
      onCollectionItemChange = function(eventObject, item, index, property){
         if (this._isNeedToRedraw()) {
            this._updateItem(item);
            this._reviveItems();
         }
      },
      /**
       * Обрабатывает событие об изменении коллекции
       * @param {$ws.proto.EventObject} event Дескриптор события.
       * @param {String} action Действие, приведшее к изменению.
       * @param {SBIS3.CONTROLS.Data.Projection.ICollectionItem[]} newItems Новые элементы коллеции.
       * @param {Integer} newItemsIndex Индекс, в котором появились новые элементы.
       * @param {SBIS3.CONTROLS.Data.Projection.ICollectionItem[]} oldItems Удаленные элементы коллекции.
       * @param {Integer} oldItemsIndex Индекс, в котором удалены элементы.
       * @private
       */
      onCollectionChange = function (event, action, newItems, newItemsIndex, oldItems) {
         var i;
         if (this._isNeedToRedraw()) {
	         switch (action) {
	            case IBindCollection.ACTION_ADD:
	            case IBindCollection.ACTION_REMOVE:
	               for (i = 0; i < oldItems.length; i++) {
	                  this._removeItem(
	                     oldItems[i]
	                  );
	               }
	               for (i = 0; i < newItems.length; i++) {
	                  this._addItem(
	                     newItems[i],
                        newItemsIndex + i
	                  );
	               }
                  this._toggleEmptyData(!this._itemsProjection.getCount());
	               //this._view.checkEmpty(); toggleEmtyData
	               this._reviveItems();
	               break;

	            case IBindCollection.ACTION_MOVE:
	               for (i = 0; i < newItems.length; i++) {
	                  this._moveItem(
	                     newItems[i],
	                     newItemsIndex + i
	                  );
	               }
	               this._reviveItems();
	               break;

	            case IBindCollection.ACTION_REPLACE:
	               for (i = 0; i < newItems.length; i++) {
	                  this._updateItem(
	                     newItems[i]
	                  );
	               }
	               this._reviveItems();
	               break;

	            case IBindCollection.ACTION_RESET:
	               this.redraw();
	               break;
	         }
      	}
      };
   return DSMixin;

});