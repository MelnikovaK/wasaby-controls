define('js!SBIS3.CONTROLS.TreeMixinDS', ['js!SBIS3.CORE.Control',
   'js!SBIS3.CONTROLS.BreadCrumbs',
   'browser!html!SBIS3.CONTROLS.DataGridView/resources/DataGridViewGroupBy', 'js!SBIS3.CONTROLS.Data.Projection.Tree'], function (Control, BreadCrumbs, groupByTpl, TreeProjection) {
   /**
    * Позволяет контролу отображать данные имеющие иерархическую структуру и работать с ними.
    * @mixin SBIS3.CONTROLS.TreeMixinDS
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   var TreeMixinDS = /** @lends SBIS3.CONTROLS.TreeMixinDS.prototype */{
      /**
       * @event onSearchPathClick При клике по хлебным крошкам в режиме поиска.
       * Событие, происходящее после клика по хлебным крошкам, отображающим результаты поиска
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {number} id ключ узла, по которму кликнули
       * @return Если вернуть false - загрузка узла не произойдет
       * @example
       * <pre>
       *    DataGridView.subscribe('onSearchPathClick', function(event){
       *      searchForm.clearSearch();
       *    });
       * </pre>
       */
      /**
       * @event onNodeExpand После разворачивания ветки
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String} key ключ разворачиваемой ветки
       * @example
       * <pre>
       *    onNodeExpand: function(event){
       *       $ws.helpers.question('Продолжить?');
       *    }
       * </pre>
       *
       * @event onNodeCollapse После сворачивания ветки
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String} key ключ разворачиваемой ветки
       * @example
       * <pre>
       *    onNodeCollapse: function(event){
       *       $ws.helpers.question('Продолжить?');
       *    }
       * </pre>
       */
      /**
       * @event onSearchPathClick При клике по хлебным крошкам в режиме поиска.
       * Событие, происходящее после клика по хлебным крошкам, отображающим результаты поиска
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {number} id ключ узла, по которму кликнули
       * @return Если вернуть false - загрузка узла не произойдет
       * @example
       * <pre>
       *    DataGridView.subscribe('onSearchPathClick', function(event){
       *      searchForm.clearSearch();
       *    });
       * </pre>
       */
      $protected: {
         _folderOffsets : {},
         _folderHasMore : {},
         _treePagers : {},
         _treePager: null,
         _options: {
            /**
             * @cfg {Boolean} При открытия узла закрывать другие
             */
            singleExpand: false,

            /**
             * @cfg {Boolean} Опция задаёт режим разворота. false Без разворота
             */
            expand: false,
            openedPath : {},
            folderFooterTpl: undefined,
            /**
             * @cfg {Boolean}
             * Разрешить проваливаться в папки
             * Если выключено, то папки можно открывать только в виде дерева, проваливаться в них нельзя
             */
            allowEnterToFolder: true
         },
         _foldersFooters: {},
         _breadCrumbs : [],
         _lastParent : undefined,
         _lastDrawn : undefined,
         _lastPath : []
      },

      $constructor : function() {
         var filter = this.getFilter() || {};
         this._publish('onSearchPathClick', 'onNodeExpand');

         if (this._options.expand) {
            filter['Разворот'] = 'С разворотом';
            filter['ВидДерева'] = 'Узлы и листья';
         }
         this.setFilter(filter, true);
      },

      _createDefaultProjection : function(items) {
         this._itemsProjection = new TreeProjection({
            collection: items,
            idProperty: this._options.keyField || (this._options.dataSource ? this._options.dataSource.getIdProperty() : ''),
            parentProperty: this._options.hierField,
            nodeProperty: this._options.hierField + '@',
            root: (typeof this._options.root != 'undefined') ? this._options.root : null
         });
      },

      _getRecordsForRedraw: function() {
         /*Получаем только рекорды с parent = curRoot*/
         var
            self = this,
            records = [];
         if (this._options.expand) {
            this.hierIterate(this._dataSet, function (record) {
               if (self._options.displayType == 'folders') {
                  if (record.get(self._options.hierField + '@')) {
                     records.push(record);
                  }
               }
               else {
                  records.push(record);
               }
            });
         }
         else {
            return this._getRecordsForRedrawCurFolder();
         }

         return records;
      },

      /**
       * Закрыть определенный узел
       * @param {String} key Идентификатор раскрываемого узла
       */
      collapseNode: function (key) {
         /* Закроем узел, только если он раскрыт */
         if(!this.getOpenedPath()[key]) {
            return;
         }

         this._drawExpandArrow(key, false);
         this._collapseChilds(key);
         delete(this._options.openedPath[key]);
         this._nodeClosed(key);
         this._notify('onNodeCollapse', key);
      },

      //Рекурсивно удаляем из индекса открытых узлов все дочерние узлы закрываемого узла
      _collapseChilds: function(key){
         var tree = this._dataSet._indexTree;
         if (tree[key]){
            for (var i = 0; i < tree[key].length; i++){
               this._collapseChilds(tree[key][i]);
               delete(this._options.openedPath[tree[key][i]]);
            }
         }
      },

      /**
       * Закрыть или открыть определенный узел
       * @param {String} key Идентификатор раскрываемого узла
       */

      toggleNode: function (key) {
         this[this.getOpenedPath()[key] ? 'collapseNode' : 'expandNode'](key);
      },

      _findExpandByElement: function(elem){
         if (elem.hasClass('js-controls-TreeView__expand')) {
            return elem;
         }
         else {
            var closest = elem.closest('.js-controls-TreeView__expand');
            if (elem.closest('.js-controls-TreeView__expand').length){
               return closest
            }
            else {
               return elem;
            }
         }
      },
      _createTreeFilter: function(key) {
         var
            filter = $ws.core.clone(this.getFilter()) || {};
         if (this._options.expand) {
            filter['Разворот'] = 'С разворотом';
            filter['ВидДерева'] = 'Узлы и листья';
         }
         this.setFilter($ws.core.clone(filter), true);
         filter[this._options.hierField] = key;
         return filter;
      },

      expandNode: function (key) {
         /* Если узел уже открыт, то ничего делать не надо*/
         if(this.getOpenedPath()[key]) {
            return;
         }

         var self = this,
             tree = this._dataSet.getTreeIndex(this._options.hierField, true);

         this._folderOffsets[key || 'null'] = 0;
         if (this._options.singleExpand){
            $.each(this._options.openedPath, function(openedKey, _value){
               if (key != openedKey){
                  self.collapseNode(openedKey);
               }
            });
         }
         if (!tree[key]){
            this._toggleIndicator(true);
            return this._callQuery(this._createTreeFilter(key), this.getSorting(), 0, this._limit).addCallback(function (dataSet) {
               // TODO: Отдельное событие при загрузке данных узла. Сделано так как тут нельзя нотифаить onDataLoad,
               // так как на него много всего завязано. (пользуется Янис)
               self._folderHasMore[key] = dataSet.getMetaData().more;
               self._notify('onDataMerge', dataSet);
               self._toggleIndicator(false);
               self._nodeDataLoaded(key, dataSet);
               self._notify('onNodeExpand', key);
            });
         } else {
            var child = tree[key];
            var records = [];
            if (child){
               for (var i = 0; i < child.length; i++){
                  records.push(this._dataSet.getRecordById(child[i]));
               }
               this._options.openedPath[key] = true;
               this._drawLoadedNode(key, records, this._folderHasMore[key]);
               this._notify('onNodeExpand', key);
            }
         }
      },
      /**
       * Получить текущий набор открытых элементов иерархии
       */
      getOpenedPath: function(){
         return this._options.openedPath;
      },

      _drawLoadedNode: function(key, records){
         this._drawExpandArrow(key);
         for (var i = 0; i < records.length; i++) {
            var record = records[i];
            var targetContainer = this._getTargetContainer(record);
            if (targetContainer) {
               if (this._options.displayType == 'folders') {
                  if (record.get(this._options.hierField + '@')) {
                     this._drawAndAppendItem(record, targetContainer);
                  }
               }
               else {
                  this._drawAndAppendItem(record, targetContainer);
               }
            }
         }
      },

      _drawExpandArrow: function(key, flag){
         var itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));
         $('.js-controls-TreeView__expand', itemCont).first().toggleClass('controls-TreeView__expand__open', flag);
      },

      _nodeDataLoaded : function(key, dataSet) {
         var self = this;
         this._dataSet.merge(dataSet, {remove: false});
         this._dataSet.getTreeIndex(this._options.hierField, true);
         var records = [];
         dataSet.each(function (record) {
            records.push(record);
         });
         this._options.openedPath[key] = true;
         self._drawLoadedNode(key, records, self._folderHasMore[key]);
      },

      around : {
         _addItem: function (parentFnc, item, at) {
            //TODO придрот, чтоб не отрисовывались данные в дереве при первом открытии узла
            var parent = item.getContents().get(this._options.hierField);
            if (this._options.openedPath[parent] || (parent == this._curRoot)) {
               parentFnc.call(this, item, at);
            }
         }
      },

      _nodeClosed : function(key) {

      },

      /* здесь добавляется запись "Еще 50" в корень таблицы, но сейчас мы включаем подгрузку по скроллу в папках, значит этот код не нужен
      _processPaging: function() {
         var more, nextPage;
         if (!this._treePager) {
            more = this._dataSet.getMetaData().more;
            //Убираем текст "Еще n", если включена бесконечная подгрузка
            nextPage = this.isInfiniteScroll() ? false : this._hasNextPage(more);
            var
               container = this.getContainer().find('.controls-TreePager-container'),
               self = this;
            this._treePager = new TreePagingLoader({
               pageSize: this._options.pageSize,
               opener: this,
               hasMore: nextPage,
               element: container,
               handlers : {
                  'onClick' : function(){
                     self._folderLoad();
                  }
               }
            });
         }
         more = this._dataSet.getMetaData().more;
         nextPage = this._hasNextPage(more);
         this._treePager.setHasMore(nextPage);
      },
       */
      _folderLoad: function(id) {
         var
            self = this,
            filter = id ? this._createTreeFilter(id) : this.getFilter();
         this._loader = this._callQuery(filter, this.getSorting(), (id ? this._folderOffsets[id] : this._folderOffsets['null']) + this._limit, this._limit).addCallback($ws.helpers.forAliveOnly(function (dataSet) {
            //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
            //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
            self._notify('onDataMerge', dataSet);
            self._loader = null;
            //нам до отрисовки для пейджинга уже нужно знать, остались еще записи или нет
            if (id) {
               self._folderOffsets[id] += self._limit;
            }
            else {
               self._folderOffsets['null'] += self._limit;
            }
            self._folderHasMore[id] = dataSet.getMetaData().more;
            if (!self._hasNextPageInFolder(dataSet.getMetaData().more, id)) {
               if (typeof id != 'undefined') {
                  self._treePagers[id].setHasMore(false)
               }
               else {
                  self._treePager.setHasMore(false)
               }
               self._hideLoadingIndicator();
            }
            //Если данные пришли, нарисуем
            if (dataSet.getCount()) {
               var records = dataSet._getRecords();
               self._dataSet.merge(dataSet, {remove: false});
               self._dataSet.getTreeIndex(self._options.hierField, true);
               self._drawItemsFolderLoad(records, id);
               self._dataLoadedCallback();
            }

         }, self)).addErrback(function (error) {
            //Здесь при .cancel приходит ошибка вида DeferredCanceledError
            return error;
         });
      },

      _drawItemsFolderLoad: function(records) {
         this._drawItems(records);
      },

      _createFolderPager: function(key, container, more) {
         var
            self = this,
            nextPage = this._hasNextPageInFolder(more, key);

         if (this._options.pageSize) {
            this._treePagers[key] = new TreePagingLoader({
               pageSize: this._options.pageSize,
               opener: this,
               hasMore: nextPage,
               element: container,
               id: key,
               handlers: {
                  'onClick': function () {
                     self._folderLoad(this._options.id);
                  }
               }
            });
         }
      },

      _hasNextPageInFolder: function(more, id) {
         if (!id) {
            return typeof (more) !== 'boolean' ? more > (this._folderOffsets['null'] + this._options.pageSize) : !!more;
         }
         else {
            return typeof (more) !== 'boolean' ? more > (this._folderOffsets[id] + this._options.pageSize) : !!more;
         }
      },
      _createFolderFooter: function(key) {
         var
             footerTpl = this._options.folderFooterTpl,
             options = this._getFolderFooterOptions(key),
             container = $('<div class="controls-TreeView__folderFooterContainer">' + (footerTpl ? footerTpl(options) : '') + '</div>');
         this._destroyFolderFooter([key]);
         this._createFolderPager(key, $('<div class="controls-TreePager-container">').appendTo(container), options.more);
         this._foldersFooters[key] = container;
      },
      _getFolderFooterOptions: function(key) {
         return {
            keys: key,
            more: this._folderHasMore[key]
         };
      },
      _destroyFolderFooter: function(items) {
         var
             controls,
             self = this;
         $ws.helpers.forEach(items, function(item) {
            if (self._foldersFooters[item]) {
               controls = self._foldersFooters[item].find('.ws-component');
               for (var i = 0; i < controls.length; i++) {
                  controls[i].wsControl.destroy();
               }
               self._foldersFooters[item].remove();
               delete self._foldersFooters[item];
            }
         });
      },

      before: {
         reload : function() {
            this._folderOffsets['null'] = 0;
            this._lastParent = undefined;
            this._lastDrawn = undefined;
            this._lastPath = [];
         },
         _keyboardHover: function(e) {
            switch(e.which) {
               case $ws._const.key.m:
                  e.ctrlKey && this.moveRecordsWithDialog();
                  break;
            }
         },
         _dataLoadedCallback: function () {
            //this._options.openedPath = {};
            if (this._options.expand) {
               var tree = this._dataSet.getTreeIndex(this._options.hierField);
               for (var i in tree) {
                  if (tree.hasOwnProperty(i) && i != 'null' && i != this._curRoot) {
                     this._options.openedPath[i] = true;
                  }
               }
            }
         },
         destroy : function() {
            if (this._treePager) {
               this._treePager.destroy();
            }
         },
         _clearItems: function() {
            var self = this;
            this._lastParent = this._curRoot;
            this._lastDrawn = undefined;
            this._lastPath = [];
            this._destroySearchBreadCrumbs();
            $ws.helpers.forEach(this._foldersFooters, function(val, key) {
               self._destroyFolderFooter([key]);
            });
         }
      },
      around: {
         _isViewElement: function(parentFunc, elem) {
            return  parentFunc.call(this, elem) && !elem.hasClass('controls-HierarchyDataGridView__path') && !(elem.wsControl() instanceof BreadCrumbs);
         }

      },
      after : {
         _modifyOptions: function (opts) {
            var tpl = opts.folderFooterTpl;
            //Если нам передали шаблон как строку вида !html, то нужно из нее сделать функцию
            if (tpl && typeof tpl === 'string' && tpl.match(/^html!/)) {
               opts.folderFooterTpl = require(tpl);
            }
            return opts;
         }
      },

      _elemClickHandlerInternal: function (data, id, target) {
         var
            nodeID = $(target).closest('.controls-ListView__item').data('id'),
            closestExpand = this._findExpandByElement($(target));

         if (closestExpand.hasClass('js-controls-TreeView__expand')) {
            this.toggleNode(nodeID);
         }
         else {
            if ((this._options.allowEnterToFolder) && ((data.get(this._options.hierField + '@')))){
               this.setCurrentRoot(nodeID);
               this.reload();
            }
            else {
               this._activateItem(id);
            }
         }
      },
      /*----------------HierarchySearchGroupBy-----------------*/
      getSearchGroupBy: function(field){
         return {
            field: field,
            template : groupByTpl,
            method : this._searchMethod.bind(this),
            render : this._searchRender.bind(this)
         }
      },
      //----------------- defaultSearch group
      /**
       * Метод поиска по умолчанию
       * @param record
       * @param at
       * @returns {{drawItem: boolean, drawGroup: boolean}}
       */
      _searchMethod: function(record, at, last){
         //TODO lastParent - curRoot - правильно?. 2. Данные всегда приходят в правильном порядке?
         var key,
               curRecRoot,
               drawItem = false,
               kInd = -1;
         if (this._lastParent === undefined) {
            this._lastParent = this._curRoot;
         }
         key = record.getKey();
         curRecRoot = record.get(this._options.hierField);
         //TODO для SBISServiceSource в ключе находится массив, а теперь он еще и к строке приводится...
         curRecRoot = curRecRoot instanceof Array ? curRecRoot[0] : curRecRoot;
         if (curRecRoot == this._lastParent){
            //Лист
            if (record.get(this._options.hierField + '@') !== true){
               //Нарисуем путь до листа, если пришли из папки
               if (this._lastDrawn !== 'leaf' && this._lastPath.length) {
                  this._drawGroup(record, at);
               }
               this._lastDrawn = 'leaf';
               drawItem = true;
            } else { //папка
               this._lastDrawn = undefined;
               this._lastPath.push(record);
               this._lastParent = key;
               //Если мы уже в последней записи в иерархии, то нужно отрисовать крошки и сбросить сохраненный путь
               if (last) {
                  this._drawGroup(record, at);
                  this._lastPath = [];
                  this._lastParent = this._curRoot;
               }
            }
         } else {//другой кусок иерархии
            //Если текущий раздел у записи есть в lastPath, то возьмем все элементы до этого ключа
            kInd = -1;
            for (var k = 0; k < this._lastPath.length; k++) {
               if (this._lastPath[k].getKey() == curRecRoot){
                  kInd = k;
                  break;
               }
            }
            //Если текущий раздел есть в this._lastPath его надо нарисовать
            if (  this._lastDrawn !== 'leaf' && this._lastPath.length) {
               this._drawGroup(record, at);
            }
            this._lastDrawn = undefined;
            this._lastPath = kInd >= 0 ? this._lastPath.slice(0, kInd + 1) : [];
            //Лист
            if (record.get(this._options.hierField + '@') !== true){
               if ( this._lastPath.length) {
                  this._drawGroup(record, at);
               }
               drawItem = true;
               this._lastDrawn = 'leaf';
               this._lastParent = curRecRoot;
            } else {//папка
               this._lastDrawn = undefined;
               this._lastPath.push(record);
               this._lastParent = key;
               //Если мы уже в последней записи в иерархии, то нужно отрисовать крошки и сбросить сохраненный путь
               if (last) {
                  this._drawGroup(record, at);
                  this._lastPath = [];
                  this._lastParent = this._curRoot;
               }
            }
         }
         return {
            drawItem : drawItem,
            drawGroup: false
         };
      },
      _searchRender: function(item, container){
         this._drawBreadCrumbs(this._lastPath, item, container);
         return container;
      },
      _drawBreadCrumbs:function(path, record, container){
         if (path.length) {
            var self = this,
                  elem,
                  groupBy = this._options.groupBy,
                  cfg,
                  td = container.find('td');
            td.append(elem = $('<div style="width:'+ td.width() +'px"></div>'));
            cfg = {
               element : elem,
               items: this._createPathItemsDS(path),
               parent: this.getTopParent(),
               highlightEnabled: this._options.highlightEnabled,
               highlightText: this._options.highlightText,
               colorMarkEnabled: this._options.colorMarkEnabled,
               colorField: this._options.colorField,
               className : 'controls-BreadCrumbs__smallItems',
               enable: this._options.allowEnterToFolder
            };
            if (groupBy.hasOwnProperty('breadCrumbsTpl')){
               cfg.itemTemplate = groupBy.breadCrumbsTpl
            }
            var ps = new BreadCrumbs(cfg);
            ps.once('onItemClick', function(event, id){
               //Таблицу нужно связывать только с тем PS, в который кликнули. Хорошо, что сначала идет _notify('onBreadCrumbClick'), а вотом выполняется setCurrentRoot
               event.setResult(false);
               //TODO Выпилить в .100 проверку на задизабленность, ибо событие вообще не должно стрелять и мы сюда не попадем, если крошки задизаблены
               if (this.isEnabled() && self._notify('onSearchPathClick', id) !== false ) {
                  //TODO в будущем нужно отдать уже dataSet крошек, ведь здесь уже все построено
                  /*TODO для Алены. Временный фикс, потому что так удалось починить*/
                  var filter = $ws.core.merge(self.getFilter(), {
                     'Разворот' : 'Без разворота'
                  });
                  if (self._options.groupBy.field) {
                     filter[self._options.groupBy.field] = undefined;
                  }
                  //Если бесконечный скролл был установлен в опции - вернем его
                  self.setInfiniteScroll(self._options.infiniteScroll, true);
                  self.setGroupBy({});
                  self.setHighlightText('', false);
                  self.setFilter(filter, true);
                  self.setCurrentRoot(id);
                  self.reload();
               }
            });
            this._breadCrumbs.push(ps);
         } else{
            //если пути нет, то группировку надо бы убить...
            container.remove();
         }

      },
      _createPathItemsDS: function(pathRecords){
         var dsItems = [],
               parentID;
         for (var i = 0; i < pathRecords.length; i++){
            //TODO для SBISServiceSource в ключе находится массив
            parentID = pathRecords[i].get(this._options.hierField);
            dsItems.push({
               id: pathRecords[i].getKey(),
               title: pathRecords[i].get(this._options.displayField),
               parentId: parentID instanceof Array ? parentID[0] : parentID,
               data: pathRecords[i]
            });
         }
         return dsItems;
      },
      _destroySearchBreadCrumbs: function(){
         for (var i =0; i < this._breadCrumbs.length; i++){
            this._breadCrumbs[i].destroy();
         }
         this._breadCrumbs = [];
      }
   };

   var TreePagingLoader = Control.Control.extend({
      $protected :{
         _options : {
            id: null,
            pageSize : 20,
            hasMore : false
         }
      },
      $constructor : function(){
         this._container.addClass('controls-TreePager');
         this.setHasMore(this._options.hasMore);
      },
      setHasMore: function(more) {
         this._options.hasMore = more;
         if (this._options.hasMore) {
            this._container.html('Еще ' + this._options.pageSize);
         }
         else {
            this._container.empty();
         }
      }
   });

   return TreeMixinDS;

});

