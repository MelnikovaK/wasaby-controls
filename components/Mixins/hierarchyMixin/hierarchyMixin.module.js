define('js!SBIS3.CONTROLS.hierarchyMixin', [], function () {

   /**
    * Миксин, добавляющий только работу с иерархией и методы для отображения.
    * @mixin SBIS3.CONTROLS.hierarchyMixin
    * @author Крайнов Дмитрий Олегович
    * @public
    */
   var hierarchyMixin = /** @lends SBIS3.CONTROLS.hierarchyMixin.prototype */{
      /**
       * @event onSetRoot Происходит при загрузке данных и перед установкой корня иерархии.
       * @remark
       * При каждой загрузке данных, например вызванной методом {@link SBIS3.CONTROLS.ListView#reload}, происходит событие onSetRoot.
       * В этом есть необходимость, потому что в переданных данных может быть установлен новый path - путь для хлебных крошек (см. {@link WS.Data.Collection.RecordSet#meta}).
       * Хлебные крошки не перерисовываются, так как корень не поменялся.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String|Number|Null} curRoot Идентификатор узла, который установлен в качестве текущего корня иерархии.
       * @param {Array.<object>} hierarchy Массив объектов, каждый из которых описывает узлы иерархии установленного пути.
       * Каждый объект содержит следующие свойства:
       * <ul>
       *    <li>id - идентификатор текущего узла иерархии;</li>
       *    <li>parent - идентификатор предыдущего узла иерархии;</li>
       *    <li>title - значение поля отображения (см. {@link SBIS3.CONTROLS.DSMixin#displayField});</li>
       *    <li>color - значение поля записи, хранящее данные об отметке цветом (см. {@link SBIS3.CONTROLS.DecorableMixin#colorField});</li>
       *    <li>data - запись узла иерархии, экземпляр класса {@link WS.Data.Entity.Record}.</li>
       * </ul>
       * @see onBeforeSetRoot
       */
      /**
       * @event onBeforeSetRoot Происходит при установке текущего корня иерархии.
       * @remark
       * Событие может быть инициировано при использовании метода {@link setCurrentRoot}.
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String|Number|Null} key Идентификатор узла иерархии, который нужно установить. Null - это вершина иерархии, в наборе данных отображены только те записи, которые являются родительскими для других.
       * @see onSetRoot
       */
      $protected: {
         _previousRoot: null,
         _curRoot: null,
         _hier: [],
         _options: {
            /**
             * @cfg {String} Идентификатор узла, относительно которого надо отображать данные
             * @noShow
             */
            root: undefined,
            /**
             * @cfg {String} Устанавливает поле иерархии.
             * @remark
             * Полем иерархии называют поле записи, по значениям которой устанавливаются иерархические отношения между записями набора данных.
             * Для таблиц БД, для которых установлен <a href="https://wi.sbis.ru/doc/platform/developmentapl/workdata/structure/vocabl/tabl/relations/#hierarchy">тип отношений Иерархия</a>, по умолчанию поле иерархии называется "Раздел".
             * @see setHierField
             * @see getHierField
             */
            hierField: null,
            /**
             * @cfg {String} Устанавливает режим отображения данных, имеющих иерархическую структуру.
             * @remark
             * Для набора данных, имеющих иерархическую структуру, опция определяет режим их отображения. Она позволяет пользователю отображать данные в виде развернутого или свернутого списка.
             * В режиме развернутого списка будут отображены узлы группировки данных (папки) и данные, сгруппированные по этим узлам.
             * В режиме свернутого списка будет отображен только список узлов (папок).
             * <br/>
             * Возможные значения опции:
             * <ul>
             *    <li>folders - будут отображаться только узлы (папки);</li>
             *    <li>all - будут отображаться узлы (папки) и их содержимое - элементы коллекции, сгруппированные по этим узлам.</li>
             * </ul>
             *
             * Подробное описание иерархической структуры приведено в документе {@link https://wi.sbis.ru/doc/platform/developmentapl/workdata/structure/vocabl/tabl/relations/#hierarchy Типы отношений в таблицах БД}.
             * @example
             * Устанавливаем режим полного отображения данных: будут отображены элементы коллекции и папки, по которым сгруппированы эти элементы.
             * <pre class="brush:xml">
             *     <option name="displayType">all</option>
             * </pre>
             */
            displayType : 'all'

         }
      },
      $constructor: function () {
         var
            filter = this.getFilter() || {};
         //Внимание! Событие очень нужно иерархическому поиску. Подписано в ComponentBinder
         this._publish('onSetRoot', 'onBeforeSetRoot');
         if (typeof this._options.root != 'undefined') {
            this._curRoot = this._options.root;
            filter[this._options.hierField] = this._options.root;
         }
         this._previousRoot = this._curRoot;
         this.setFilter(filter, true);
      },
      /**
       * Устанавливает поле иерархии для набора данных.
       * @param {String} hierField Имя поля иерархии.
       * @see hierField
       * @see getHierField
       */
      setHierField: function (hierField) {
         this._options.hierField = hierField;
      },
      /**
       * Возвращает поле иерархии набора данных.
       * @see hierField
       * @see setHierField
       */
      getHierField : function(){
         return this._options.hierField;
      },
      hierIterate: function (DataSet, iterateCallback, status) {
         var
            indexTree = DataSet.getTreeIndex(this._options.hierField, true),
            self = this,
            curParentId = (typeof this._curRoot != 'undefined') ? this._curRoot : null,
            curLvl = 0;

         var hierIterate = function(root) {
            var
               childKeys = indexTree[root] || [];
            for (var i = 0; i < childKeys.length; i++) {
               var record = self._items.getRecordByKey(childKeys[i]);
               iterateCallback.call(this, record, root, curLvl);
               if (indexTree[childKeys[i]]) {
                  curLvl++;
                  hierIterate(childKeys[i]);
                  curLvl--;
               }
            }
         };
         hierIterate(curParentId);
      },


      _getRecordsForRedraw: function() {
         return this._getRecordsForRedrawCurFolder();
      },

      _getRecordsForRedrawCurFolder: function() {
         /*Получаем только рекорды с parent = curRoot*/
         var
            records = [],
            self = this;
         //todo Проверка на "searchParamName" - костыль. Убрать, когда будет адекватная перерисовка записей (до 150 версии, апрель 2016)
         if (!Object.isEmpty(this._options.groupBy) && this._options.groupBy.field === this._searchParamName) {
            return this._items._getRecords();
         }
         var path = this._options.openedPath;
         this.hierIterate(this._items , function(record) {
            //Рисуем рекорд если он принадлежит текущей папке или если его родитель есть в openedPath
            var parentKey = self._items.getParentKey(record, self._options.hierField);
            if (parentKey == self._curRoot || path[parentKey]) {
               if (self._options.displayType == 'folders') {
                  if (record.get(self._options.hierField + '@')) {
                     records.push(record);
                  }
               } else {
                  records.push(record);
               }
            }
         });

         return records;
      },
      /**
       * Возвращает идентификатор родительской записи.
       * @param {WS.Data.Collection.RecordSet} DataSet Набор данных.
       * @param {WS.Data.Entity.Record} record Запись, для которой нужно определить идентификатор родителя.
       * @returns {*|{d: Array, s: Array}|String|Number}
       */
      getParentKey: function (DataSet, record) {
         return this._items.getParentKey(record, this._options.hierField);
      },
      /**
       * Установить корень выборки.
       * @param {String|Number} root Идентификатор корня
       */
      setRoot: function(root){
         this._options.root = root;
      },
      /**
       * Возвращает идентификатор корня иерархии.
       * @returns {String|Number|Null} Идентификатор текущего узла иерархии. Null - это вершина иерархии, в наборе данных отображены только те записи, которые являются родительскими для других.
       * @see setCurrentRoot
       */
      getCurrentRoot : function(){
         return this._curRoot;
      },
      /**
       * Устанавливает текущий корень иерархии.
       * @remark
       * Метод производит изменение набора данных: он будет соответствовать содержимому узла, идентификатор которого был установлен в качестве корня иерархии.
       * В иерархических списках существует три типа записей: лист, узел и скрытый узел. Подробнее о различиях между ними читайте в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/workdata/structure/vocabl/tabl/relations/#hierarchy">Типы отношений в БД</a>.
       * При выполнении метода происходит событие {@link onBeforeSetRoot}.
       * @param {String|Number|Null} key Идентификатор узла иерархии, который нужно установить. Null - это вершина иерархии, в наборе данных отображены только те записи, которые являются родительскими для других.
       * @see getCurrentRoot
       * @see onBeforeSetRoot
       */
      setCurrentRoot: function(key) {
         var
            filter = this.getFilter() || {};
         if (key) {
            filter[this._options.hierField] = key;
         }
         else {
            if (this._options.root){
               filter[this._options.hierField] = this._options.root;
            } else {
               delete(filter[this._options.hierField]);
            }
         }
         this.setFilter(filter, true);
         this._hier = this._getHierarchy(this._items, key);
         //узел грузим с 0-ой страницы
         this._offset = 0;
         //Если добавить проверку на rootChanged, то при переносе в ту же папку, из которой искали ничего не произойдет
         this._notify('onBeforeSetRoot', key);
         this._curRoot = key || this._options.root;
         if (this._itemsProjection) {
            this._itemsProjection.setRoot(this._curRoot || null);
         }
      },
      after : {
         _dataLoadedCallback: function () {
            var path = this._items.getMetaData().path,
               hierarchy = $ws.core.clone(this._hier),
               item;
            if (path) {
               hierarchy = this._getHierarchy(path, this._curRoot);
            }
            // При каждой загрузке данных стреляем onSetRoot, не совсем правильно
            // но есть случаи когда при reload присылают новый path,
            // а хлебные крошки не перерисовываются так как корень не поменялся
            this._notify('onSetRoot', this._curRoot, hierarchy);
            //TODO Совсем быстрое и временное решение. Нужно скроллиться к первому элементу при проваливании в папку.
            // Выпилить, когда это будет делать установка выделенного элемента
            if (this._previousRoot !== this._curRoot) {

               //TODO курсор
               /*Если в текущем списке есть предыдущий путь, значит это выход из папки*/
               if (this.getItems().getRecordById(this._previousRoot)) {
                  this.setSelectedKey(this._previousRoot);
                  this._scrollToItem(this._previousRoot);
               }
               else {
                  /*иначе вход в папку*/
                  item = this.getItems() && this.getItems().at(0);
                  if (item){
                     this.setSelectedKey(item.getId());
                     this._scrollToItem(item.getId());
                  }
               }

               this._previousRoot = this._curRoot;

            }
         }
      },
      _getHierarchy: function(dataSet, key){
         var record, parentKey,
            hierarchy = [];
         if (dataSet){
            do {
               record = dataSet.getRecordById(key);
               parentKey = record ? dataSet.getParentKey(record, this._options.hierField) : null;
               if (record) {
                  hierarchy.push({
                     'id': key || null,
                     'parent' : parentKey,
                     'title' : record.get(this._options.displayField),
                     'color' : this._options.colorField ? record.get(this._options.colorField) : '',
                     'data' : record
                  });
               }
               key = parentKey;
            } while (key);
         }
         return hierarchy;
      },

      _dropPageSave: function(){
         var root = this._options.root;
         this._pageSaver = {};
         this._pageSaver[root] = 0;
      },

      //Переопределяем метод, чтоб передать тип записи
      _activateItem : function(id) {
         var
            item = this._items.getRecordByKey(id),
            meta = {
               id: id,
               item: item,
               hierField : this._options.hierField
            };

         this._notify('onItemActivate', meta);
      }

   };

   return hierarchyMixin;

});