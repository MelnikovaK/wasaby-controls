define('js!SBIS3.CONTROLS.hierarchyMixin', [], function () {

   /**
    * только работа с иерархией + методы для отображения
    * @mixin SBIS3.CONTROLS.hierarchyMixin
    */
   var hierarchyMixin = /** @lends SBIS3.CONTROLS.hierarchyMixin.prototype */{
      $protected: {
         _curRoot: null,
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
            /**
             * folders/all
             * */
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
               childKeys = indexTree[root];
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
        	var self = this,
          	record = this._dataSet.getRecordByKey(key),
          	parentKey = record ? this._dataSet.getParentKey(record, this._options.hierField) : null,
          	hierarchy =[];
          	hierarchy.push(key);
        	while (parentKey !== null){
          	hierarchy.push(parentKey);
          	record = this._dataSet.getRecordByKey(parentKey);
          	parentKey = record ? this._dataSet.getParentKey(record, this._options.hierField) : null;
        	}
        	for (var i = hierarchy.length - 1; i >= 0; i--){
          	this._notify('onSetRoot', this._dataSet, hierarchy[i]);
        	}
         /*TODO проверка на что уже загружали*/
         var filter = this._filter || {};
         filter[this._options.hierField] = key;
         this._filter = filter;
         //узел грузим с 0-ой страницы
         this._offset = 0;
        	this._dataSource.query(filter, undefined, this._offset, this._limit).addCallback(function(dataSet) {
          	if (!self._dataSet){
            	self._dataSet = dataSet;
          	} else {
            	self._dataSet.setRawData(dataSet.getRawData());
          	}
          	self._dataLoadedCallback();
          	self._notify('onDataLoad', dataSet);
          	self._curRoot = key;
          	self._redraw();
         });
      },
      
      _dropPageSave: function(){
         var root = this._options.root;
         this._pageSaver = {};
         this._pageSaver[root] = 0;
      }

   };

   return hierarchyMixin;

});