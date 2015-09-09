define('js!SBIS3.CONTROLS.hierarchyMixin', [], function () {

   /**
    * только работа с иерархией + методы для отображения
    * @mixin SBIS3.CONTROLS.hierarchyMixin
    * @public
    */
   var hierarchyMixin = /** @lends SBIS3.CONTROLS.hierarchyMixin.prototype */{
      $protected: {
         //TODO FixMe этот флаг был введен для синхронизации иерархического представления и хлебных крошек
         //вместо того, чтобы рассылать событие о смене корня при проваливании в папку
         //нам приходиться ждать загрузки данных, потом понимать причину загрузки данных(этот флаг)
         //и после загрузки уже рассылать информацию о хлебных кношках, которые пришли в запросе с данными
         //по хорошему мы должны выносить запрос данных в некий контроллер, который разложит состояние
         //в представление данных и в хлебные кношки.
         //В таком случае этот флаг будет не нужен
         _rootChanged: false,
         _curRoot: null,
         _hier: [],
         _options: {
            /**
             * @cfg {String} Идентификатор узла, относительно которого надо отображать данные
             * @noShow
             */
            root: null,

            /**
             * @cfg {String} Поле иерархии
             */
            hierField: null,
            displayType : 'all'

         }
      },
      $constructor: function () {
         this._curRoot = this._options.root;
         this._filter = this._filter || {};
         this._filter[this._options.hierField] = this._options.root;
      },

      setHierField: function (hierField) {
         this._options.hierField = hierField;
      },
      /**
       * Получить название поля иерархии
       */
      getHierField : function(){
         return this._options.hierField;
      },

      // обход происходит в том порядке что и пришли
      hierIterate: function (DataSet, iterateCallback, status) {
         if (Object.isEmpty(DataSet._indexTree)) {
            DataSet._reindexTree(this._options.hierField);
         }
         var
            indexTree = DataSet._indexTree,
            self = this,
            curParentId = (typeof this._curRoot != 'undefined') ? this._curRoot : null,
            curLvl = 0;

         var hierIterate = function(root) {
            var
               childKeys = indexTree[root] || [];
            for (var i = 0; i < childKeys.length; i++) {
               var record = self._dataSet.getRecordByKey(childKeys[i]);
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
         if (!Object.isEmpty(this._options.groupBy)) {
            return this._dataSet._getRecords();
         }
         this._dataSet.each(function (record) {
            if (self._dataSet.getParentKey(record, self._options.hierField) == self._curRoot) {
               if (self._options.displayType == 'folders') {
                  if (record.get(self._options.hierField + '@')) {
                     records.push(record);
                  }
               }
               else {
                  records.push(record);
               }
            }
         });

         return records;
      },

      getParentKey: function (DataSet, record) {
         return this._dataSet.getParentKey(record, this._options.hierField);
      },

      /* отображение */

      /**
       * Установить корень выборки
       * @param {String} root Идентификатор корня
       */
      setRoot: function (root) {

      },
      /**
       * Получить текущий корень иерархии
       * @returns {*}
       */
      getCurrentRoot : function(){
         return this._curRoot;
      },

		/**
       * Раскрыть определенный узел
       * @param {String} key Идентификатор раскрываемого узла
       */
      setCurrentRoot: function(key) {
         var filter = this._filter || {};
         filter[this._options.hierField] = key;
         this._filter = filter;
         this._hier = this._getHierarchy(this._dataSet, key);
         //узел грузим с 0-ой страницы
         this._offset = 0;
         this._rootChanged = this._curRoot !== key;
         this._curRoot = key;
         this.setSelectedKey(null);
      },

      _dataLoadedCallback: function(){
         var path = this._dataSet.getMetaData().path,
            hierarchy = this._hier;
         if (!hierarchy.length && path){
            hierarchy = this._getHierarchy(path, this._curRoot);
         }
         if (this._rootChanged) {
            this._notify('onSetRoot', this._curRoot, hierarchy);
            this._rootChanged = false;
         }
      },

      _getHierarchy: function(dataSet, key){
         var record,
            parentKey = key || null,
            hierarchy = [];
         do {
            record = dataSet.getRecordByKey(parentKey);
            if (record) {
               hierarchy.push({
                  'id': parentKey,
                  'title' : record.get(this._options.displayField),
                  'color' : this._options.colorField ? record.get(this._options.colorField) : '',
                  'data' : record
               });
            }
            parentKey = record ? dataSet.getParentKey(record, this._options.hierField) : null;
         } while (parentKey);
         return hierarchy;
      },

      _dropPageSave: function(){
         var root = this._options.root;
         this._pageSaver = {};
         this._pageSaver[root] = 0;
      }

   };

   return hierarchyMixin;

});