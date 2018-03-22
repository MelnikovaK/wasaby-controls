/**
 * Created by ad.chistyakova on 14.04.2015.
 */
define('SBIS3.CONTROLS/Utils/DataProcessor', [
   "Core/core-extend",
   "Core/core-clone",
   "Core/EventBus",
   "Core/Deferred",
   "WS.Data/Entity/Record",
   "browser!SBIS3.CONTROLS/Utils/DataSetToXmlSerializer",
   "SBIS3.CONTROLS/WaitIndicator",
   "WS.Data/Source/SbisService",
   "Transport/prepareGetRPCInvocationURL",
   "SBIS3.CONTROLS/Utils/PrintDialogHTMLView",
   "SBIS3.CONTROLS/Utils/InformationPopupManager",
   "Lib/File/UrlLoader",
   "i18n!SBIS3.CONTROLS/Utils/DataProcessor"
], function( cExtend, coreClone, EventBus, Deferred, Record, Serializer, WaitIndicator, SbisService, prepareGetRPCInvocationURL, PrintDialogHTMLView, InformationPopupManager, UrlLoader) {
   /**
    * Обработчик данных для печати и выгрузки(экспорта) в Excel, PDF. Печать осуществляется по готову XSL-шаблону через XSLT-преобразование.
    * Экспорт в Excel и PDF можно выполнить несколькими способами:
    * <ul>
    *    <li>подготовить данные на клиенте и через xslt преобразовать в HTML, а дальше отправить на сервер.</li>
    *    <li>Подготовить либо данные, либо просто фильтр для списочного метода и отправить на сервер, где будет происходить обработка данных и их преобразование в Excel или PDF. В данном случае будет использован сервис file-transfer.</li>
    * </ul>
    * @class SBIS3.CONTROLS/Utils/DataProcessor
    * @author Крайнов Д.О.
    * @public
    */
   return cExtend({},/** @lends SBIS3.CONTROLS/Utils/DataProcessor.prototype */ {

      $protected: {
         _options: {
            /**
             * @cfg DataSet - набор с данными
             */
            dataSet: undefined,
            /**
             * @noShow
             */
            report: undefined,
            /**
             * @cfg {String} Путь до файла xsl
             */
            xsl : 'default-list-transform.xsl', //что делать с item  ?
            /**
             * @cfg {Array} Набор колонок датасета
             */
            columns: [],
            /**
             * @cfg {String} Поле иерархии для обработки иерархических списков.
             * @see root
             */
            hierField: undefined,
            /**
             * @cfg {Object} Список раскрытых узлов дерева (если нужно выгружать )
             */
            openedPath : {},
            /**
             * @cfg {String} Корень иерархии
             * @see hierField
             */
            root : undefined,
            /**
             * Предустановленный фильтр для списочного метода
             * @cfg {Object} поле иерархии для обработки иерархических списков
             */
            filter: {},
            /**
             * Сдвиг навигации
             * @cfg {Number}
             */
            offset: 0,
            /**
             * @cfg (number) Минимальная ширина предварительного окна печати
             */
            minWidth : 0
         },
         _reportPrinter : null,
         _loadIndicator: undefined
      },

      $constructor: function() {
      },
      /**
       * Отправить на печать готовый dataSet
       */
      print: function () {
         var
            self = this,
            deferred = new Deferred();
         this._createLoadIndicator(rk('Печать записей...'), deferred);
         this._prepareSerializer().addCallback(function(reportText){
            return PrintDialogHTMLView({
               htmlText: reportText,
               minWidth: self._options.minWidth
            });
         }).addBoth(function() {
            deferred.callback();
         });
      },
      /**
       * Выгрузить данные с помощью готовой HTML-верстки
       * @param {String} fileName
       * @param {String} fileType PDF или Excel
       * @param {number} pageOrientation 1 - потртетная, 2 - альбомная
       * @param {Boolean} isExcel указывает что выгрузка будет производиться в EXCEL формате
       */
      exportHTML: function(fileName, fileType, pageOrientation, isExcel){
         var
            self = this,
            methodName = 'SaveHTML',
            newCfg,
            deferred = new Deferred();
         this._createLoadIndicator(rk('Подождите, идет выгрузка данных'), deferred);
         this._prepareSerializer().addCallback(function(reportText) {
            deferred.callback();
            //В престо и  рознице отключены длительные операции и выгрузка должна производиться по-старому
            //Через длительные операции производилась только выгрузка в Excel, поэтому проверяем fileType
            if (!self._isLongOperationsEnabled() && fileType === 'Excel') {
               methodName = 'СохранитьПоHTMLDWC';
               newCfg = {
                  'name': fileName,
                  'html': reportText
               };
            } else {
               newCfg = {
                  'FileName': fileName,
                  'html': reportText
               };
            }
            if (fileType === "PDF") {
               newCfg.PageOrientation = typeof pageOrientation === 'number' ? pageOrientation : 1;
            }
            self.exportFileTransfer(fileType, methodName, newCfg, isExcel);

         });
      },
      /**
       * Выгрузить данные в Excel или PDF по фильтру списочного метода
       * @param {String} fileName
       * @param {String} fileType PDF или Excel
       * @param {Object} cfg - параметры метода methodName
       * @param {number} pageOrientation 1 - потртетная, 2 - альбомная
       * @param {Boolean} isExcel указывает что выгрузка будет производиться в EXCEL формате
       */
      exportList: function(fileName, fileType, cfg, pageOrientation, methodName, isExcel){
         cfg = cfg || {};
         if (fileName) {
            cfg.FileName = fileName;
         }
         if (pageOrientation) {
            cfg.PageOrientation = pageOrientation;
         }
         //В престо и  рознице отключены длительные операции и выгрузка должна производиться по-старому
         //Через длительные операции производилась только выгрузка в Excel, поэтому проверяем fileType
         if (!this._isLongOperationsEnabled() && fileType === 'Excel') {
            methodName = 'СохранитьListDWC';
         }
         this.exportFileTransfer(fileType, methodName || 'SaveList', cfg, isExcel);
      },
      /**
       * Выгрузить данные в Excel или PDF по набору данных
       * @param fileName
       * @param {String} fileType PDF или Excel
       * @param {Object} cfg - параметры метода methodName
       * @param {number} pageOrientation 1 - потртетная, 2 - альбомная
       * @param {Boolean} isExcel указывает что выгрузка будет производиться в EXCEL формате
       */
      exportDataSet: function(fileName, fileType, cfg, pageOrientation, methodName, isExcel){
         var
            columns  = coreClone(this._options.columns),
            records,
            rawData  = {s : [], d : []},
            fields = [], titles = [];
         if (!cfg) {
            for (var i = 0; i < columns.length; i++) {
               fields.push(columns[i].field);
               titles.push(columns[i].title || columns[i].field);
            }

            //TODO после метода filter сейчас dataSet возвращает getRawData = null, ошибка выписана, после исправления просто передать рекордсет
            //и перевести на SbisService.call
            var raw;
            this._options.dataSet.each(function(item){
               raw = item.getRawData();
               rawData.d.push(raw.d);
            });
            rawData.s = raw.s;
            //--------------------------------

            cfg = {
               FileName : fileName,
               Fields : fields,
               Titles : titles,
               Data : rawData
            };
            if (pageOrientation) {
               cfg.PageOrientation = pageOrientation;
            }
         }
         //В престо и  рознице отключены длительные операции и выгрузка должна производиться по-старому
         //Через длительные операции производилась только выгрузка в Excel, поэтому проверяем fileType
         if (!this._isLongOperationsEnabled()  && fileType === 'Excel') {
            methodName = 'СохранитьRSDWC';
         }
         this.exportFileTransfer(fileType, methodName || 'SaveRecordSet', cfg, isExcel);
      },
       /**
       * Универсальная выгрузка данных через сервис file-transfer
       * @param object
       * @param methodName
       * @param cfg
       * @param {Boolean} isExcel указывает что выгрузка будет производиться в EXCEL формате
       * @returns {Core/Deferred}
       */
      exportFileTransfer: function(object, methodName, cfg, isExcel){
         var self = this,
             exportDeferred,
             source = new SbisService({
                endpoint: object
            });
         exportDeferred = source.call(methodName, cfg).addErrback(function(error) {
            //Не показываем ошибку, если было прервано соединение с интернетом
            if (!error._isOfflineMode) {
               InformationPopupManager.showMessageDialog({
                  message: error.message,
                  opener: self,
                  status: 'error'
               });
            }
            return error;
         });
          //В престо и  рознице отключены длительные операции и выгрузка должна производиться по-старому
          //Через длительные операции производилась только выгрузка в Excel, поэтому проверяем fileType
         if (object !== "Excel" || !this._isLongOperationsEnabled()) {
            this._createLoadIndicator(rk('Подождите, идет выгрузка данных'), exportDeferred);
            exportDeferred.addCallback(function(ds) {
               self.downloadFile(ds.getScalar(), object === "Excel" || isExcel);
            });
         }
         else {
            exportDeferred.addCallback(function(){
               //TODO Не совсем хорошо, что контролы знают о LongOperations. Но пока не понятно, как сделать иначе.
               EventBus.channel('LongOperations').notify('onOperationStarted');
            });
         }
         return exportDeferred;
      },
      /**
       * Загрузить файл по готовому id
       * @param id - уникальный идентификатор файла на сервисе file-transfer
       * @param {Boolean} isExcel указывает что выгрузка будет производиться в EXCEL формате
       */
      downloadFile : function(id, isExcel){
         var params = { 'id': id };
         if (isExcel) {
            params['storage'] = 'excel';
         }
        UrlLoader(prepareGetRPCInvocationURL( isExcel ? 'FileTransfer' : 'File', 'Download', params, undefined, '/file-transfer/service/'));
      },
      /**
       * Метод для формирования параметров фильтрации выгружаемого на сервере файла.
       * Чтобы сформировать свои параметры этот метод можно переопределить
       * @remark Обязательно должны быть заданы в опциях this._options и columns. Так же самостоятельно придется добавить имя файла
       * @example
       * <pre>
       *    //В своем прикладном модуле (myModule), отнаследованном от OperationUnload
       *    prepareGETOperationFilter: function(selectedNumRecords){
       *       var cfg = myModule.superclass.processSelectedPageSize.apply(this, arguments);
       *       //Сформируем свой набор колонок для выгрузки
       *       cfg['Поля'] = this.getUserFields();
       *       cfg['Заголовки'] = this.getUserTitles();
       *       return cfg;
       *    }
       * </pre>
       * @param selectedNumRecords сколько записей нужно выгружать
       * @param {boolean} eng - заполнять специальный фильтр для file-transfer (на английском)
       * @returns {{}}
       */
      getFullFilter : function(selectedNumRecords, eng){
         var dataSource = this._options.dataSource,
            columns = coreClone(this._options.columns),
            fields = [],
            titles = [],
            filter,
            navigation,
            queryParams,
            cfg = {},
            openedPath,
            hierField;

         for (var i = 0; i < columns.length; i++) {
            fields.push(columns[i].field);
            titles.push(columns[i].title || columns[i].field);
         }
         //openedPath[key] = true;
         filter = coreClone(this._options.filter || {});
         if (this._options.hierField !== undefined){
            hierField = this._options.hierField;
            cfg[eng ? 'HierarchyField' : 'Иерархия'] = hierField;
            openedPath = this._options.openedPath;
            // - getOpenedPath - 'это работает только у дерева!!
            if (openedPath && !Object.isEmpty(openedPath)) {

               filter[hierField] = filter[hierField] === undefined ? [this._options.root] : filter[hierField];
               filter[hierField] = filter[hierField] instanceof Array ? coreClone(filter[hierField]) : [filter[hierField]];
               for (i in openedPath) {
                  if (openedPath.hasOwnProperty(i) && Array.indexOf( filter[hierField], i) < 0) {
                     filter[hierField].push(i);
                  }
               }
            }
         }
         navigation = selectedNumRecords ? this._prepareNavigation(
            this._options.offset,
            selectedNumRecords,
            false
         ) : null;
         cfg[eng ? 'MethodName': 'ИмяМетода'] = dataSource.getEndpoint().contract + '.' + dataSource.getBinding().query;
         cfg[eng ? 'Filter' : 'Фильтр'] = filter ? Record.fromObject(filter, dataSource.getAdapter()) : null;
         cfg[eng ? 'Sorting' : 'Сортировка'] =  null;
         cfg[eng ? 'Pagination' : 'Навигация'] = navigation ? Record.fromObject(navigation, dataSource.getAdapter()) : null;
         cfg[eng ? 'Fields' : 'Поля'] = fields;
         cfg[eng ? 'Titles' : 'Заголовки'] = titles;
         if (!eng) {
            cfg['fileDownloadToken'] = ('' + Math.random()).substr(2)* 1;
         }
         return cfg;
      },

      _prepareNavigation: function(offset, limit, hasMore) {
         if (
            offset === 0 &&
            (limit === undefined || limit === null)
         ) {
            return null;
         }

         return {
            'Страница': limit > 0 ? Math.floor(offset / limit) : 0,
            'РазмерСтраницы': limit,
            'ЕстьЕще': hasMore
         };
      },

      _prepareSerializer: function(){
         var serializer = new Serializer({
                  columns: this._options.columns,
                  report: this._options.report
               });
         return serializer.prepareReport(this._options.xsl, this._options.dataSet);
      },
      _createLoadIndicator: function (message, deferred) {
         WaitIndicator.make({
            'message': message,
            overlay: 'dark',
            delay: 100
         }, deferred);
      },
      _isLongOperationsEnabled: function() {
         return requirejs.defined('js!SBIS3.Engine.LongOperationsInformer');
      }
   });
});

