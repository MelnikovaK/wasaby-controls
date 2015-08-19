define('js!SBIS3.CONTROLS.TreeMixinDS', ['js!SBIS3.CORE.Control'], function (Control) {
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
   /**
    * Позволяет контролу отображать данные имеющие иерархическую структуру и работать с ними.
    * @mixin SBIS3.CONTROLS.TreeMixinDS
    * @author Крайнов Дмитрий Олегович
    */
   var TreeMixinDS = /** @lends SBIS3.CONTROLS.TreeMixinDS.prototype */{
      $protected: {
         _folderOffsets : {},
         _treePagers : {},
         _treePager: null,
         _options: {
            /**
             * @cfg {Boolean} При открытия узла закрывать другие
             * @noShow
             */
            singleExpand: '',

            /**
             * Опция задаёт режим разворота.
             * @Boolean false Без разворота
             */
            expand: false,
            openedPath : {}
         }
      },

      $constructor : function() {
         this._filter = this._filter || {};
         delete (this._filter[this._options.hierField]);
         if (this._options.expand) {
            this._filter['Разворот'] = 'С разворотом';
            this._filter['ВидДерева'] = 'Узлы и листья';
         }
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
         var itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));
         $('.js-controls-TreeView__expand', itemCont).removeClass('controls-TreeView__expand__open');
         delete(this._options.openedPath[key]);
         this._nodeClosed(key);
      },

      /**
       * Закрыть или открыть определенный узел
       * @param {String} key Идентификатор раскрываемого узла
       */

      toggleNode: function (key) {
         var itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));
         if ($('.js-controls-TreeView__expand', itemCont).hasClass('controls-TreeView__expand__open')) {
            this.collapseNode(key);
         }
         else {
            this.expandNode(key);
         }
      },

      _createTreeFilter: function(key) {
         var filter = $ws.core.clone(this._filter) || {};
         if (this._options.expand) {
            this._filter = this._filter || {};
            filter['Разворот'] = 'С разворотом';
            filter['ВидДерева'] = 'Узлы и листья';
         }
         filter[this._options.hierField] = key;
         return filter;
      },

      expandNode: function (key) {
         var self = this;
         this._folderOffsets[key || 'null'] = 0;
         this._toggleIndicator(true);
         this._dataSource.query(this._createTreeFilter(key), this._sorting, 0, this._limit).addCallback(function (dataSet) {
            self._toggleIndicator(false);
            self._nodeDataLoaded(key, dataSet);
         });
      },

      _nodeDataLoaded : function(key, dataSet) {
         var
            self = this,
            itemCont = $('.controls-ListView__item[data-id="' + key + '"]', this.getContainer().get(0));

         $('.js-controls-TreeView__expand', itemCont).first().addClass('controls-TreeView__expand__open');
         this._options.openedPath[key] = true;
         this._dataSet.merge(dataSet, {remove: false});
         this._dataSet._reindexTree(this._options.hierField);


         dataSet.each(function (record) {
            var targetContainer = self._getTargetContainer(record);
            if (targetContainer) {
               if (self._options.displayType == 'folders') {
                  if (record.get(self._options.hierField + '@')) {
                     self._drawItem(record, targetContainer);
                  }
               }
               else {
                  self._drawItem(record, targetContainer);
               }

            }
         });


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
            filter;
         if (id) {
            filter = this._createTreeFilter(id);
         }
         else {
            filter = this._filter;
         }
         this._loader = this._dataSource.query(filter, this._sorting, (id ? this._folderOffsets[id] : this._folderOffsets['null']) + this._limit, this._limit).addCallback(function (dataSet) {
            //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
            //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
            self._loader = null;
            //нам до отрисовки для пейджинга уже нужно знать, остались еще записи или нет
            if (id) {
               self._folderOffsets[id] += self._limit;
            }
            else {
               self._folderOffsets['null'] += self._limit;
            }
            if (!self._hasNextPageInFolder(dataSet.getMetaData().more, id)) {
               if (typeof id != 'undefined') {
                  self._treePagers[id].setHasMore(false)
               }
               else {
                  self._treePager.setHasMore(false)
               }
               self._removeLoadingIndicator();
            }
            //Если данные пришли, нарисуем
            if (dataSet.getCount()) {
               var records = dataSet._getRecords();
               self._dataSet.merge(dataSet, {remove: false});
               self._drawItemsFolderLoad(records, id);
               self._dataLoadedCallback();
            }

         }).addErrback(function (error) {
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

         this._treePagers[key] = new TreePagingLoader({
            pageSize: this._options.pageSize,
            opener: this,
            hasMore: nextPage,
            element: container,
            id: key,
            handlers : {
               'onClick' : function(){
                  self._folderLoad(this._options.id);
               }
            }
         });
      },

      _hasNextPageInFolder: function(more, id) {
         if (!id) {
            return typeof (more) !== 'boolean' ? more > (this._folderOffsets['null'] + this._options.pageSize) : !!more;
         }
         else {
            return typeof (more) !== 'boolean' ? more > (this._folderOffsets[id] + this._options.pageSize) : !!more;
         }
      },


      before: {
         reload : function() {
            this._folderOffsets['null'] = 0;
         },
         _dataLoadedCallback: function () {
            this._options.openedPath = {};
            this._dataSet._reindexTree(this._options.hierField);
            if (this._options.expand) {
               var tree = this._dataSet._indexTree;
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
            for (var i in this._treePagers) {
               if (this._treePagers.hasOwnProperty(i)) {
                  this._treePagers[i].destroy();
               }
            }
            this.destroyFolderToolbar && this.destroyFolderToolbar();
         }
      },

      _elemClickHandlerInternal: function (data, id, target) {
         if ($(target).hasClass('js-controls-TreeView__expand') && $(target).hasClass('has-child')) {
            var nodeID = $(target).closest('.controls-ListView__item').data('id');
            this.toggleNode(nodeID);
         }
      }



   };

   return TreeMixinDS;

});