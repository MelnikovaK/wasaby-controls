/* global define  */
define('js!SBIS3.CONTROLS.SaveStrategy.Sbis', [
    'js!SBIS3.CONTROLS.SaveStrategy.Base',
    'Core/EventBus',
    'Core/core-merge',
    'Core/helpers/transport-helpers',
    'WS.Data/Source/SbisService',
    'WS.Data/Entity/Record',
    'Core/moduleStubs'
], function (SaveStrategyBase, EventBus, coreMerge, transHelpers, SbisService, Record, moduleStubs) {

    'use strict';

   /**
    * Класс стратегии для сохранения данных. Позволяет взамодействовать с бизнес-логикой.
    * @class SBIS3.CONTROLS.SaveStrategy.Sbis
    * @public
    * @extends SBIS3.CONTROLS.SaveStrategy.Base
    * @author Сухоручкин А.С.
    */

    var SaveStrategySbis = SaveStrategyBase.extend(/** @lends SBIS3.CONTROLS.SaveStrategy.Sbis.prototype */{

       /**
        * Сохраняет данные.
        * @remark
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные для сохранения.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        saveAs: function (meta) {
            if (meta.endpoint) {
                this.saveToFile(meta);
            } else {
                SaveStrategySbis.superclass.saveAs.apply(this, arguments);
            }
        },
       /**
        * Сохраняет данные в файл.
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        saveToFile: function(meta) {
            if (meta.recordSet) {
                if (meta.serverSideExport) {
                   this.exportRecordSet(meta);
                } else {
                   this.exportHTML(meta);
                }
            } else if (meta.query) {
                if (meta.query.getWhere().selection) {
                   this.exportMarked(meta);
                } else {
                   this.exportList(meta);
                }
            }
        },
       /**
        * Сохраняет данные в HTML.
        * @remark
        * Для сохранения применяется метод бизнес-логики <a href="https://wi.sbis.ru/docs/bl/Excel/Excel/methods/SaveHTML/">Excel.SaveHTM</a>.
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        exportHTML: function(meta) {
            var self = this;
            this._serializeData(meta.recordSet, meta.columns, meta.xsl).addCallback(function(html){
                self.exportFileTransfer('SaveHTML', {
                   html: html,
                   FileName: meta.fileName,
                   PageOrientation: meta.pageOrientation
                }, meta);
            });
        },
       /**
        * Сохраняет данные в RecordSet.
        * @remark
        * Для сохранения применяется метод бизнес-логики <a href="https://wi.sbis.ru/docs/bl/Excel/Excel/methods/SaveRecordSet/">Excel.SaveRecordSet</a>.
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        exportRecordSet: function(meta) {
            var
               cfg = {
                  Data: meta.recordSet,
                  FileName: meta.fileName,
                  PageOrientation: meta.pageOrientation,
                  HierarchyField: meta.parentProperty && meta.endpoint !== 'PDF' ? meta.parentProperty : undefined
               };
            coreMerge(cfg, this._parseColumns(meta.columns));

            this.exportFileTransfer('SaveRecordSet', cfg, meta);
        },
       /**
        * Сохраняет данные в списком.
        * @remark
        * Для сохранения применяется метод бизнес-логики <a href="https://wi.sbis.ru/docs/bl/Excel/Excel/methods/SaveList/">Excel.SaveList</a>.
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        exportList: function(meta) {
           var cfg = this._getFilterForList(meta);
           cfg.HierarchyField = meta.parentProperty && meta.endpoint !== 'PDF' ? meta.parentProperty : undefined;
           cfg.Pagination = this._prepareNavigation(meta.query.getOffset(), meta.query.getLimit(), meta.dataSource);
           coreMerge(cfg, this._parseColumns(meta.columns));

           this.exportFileTransfer('SaveList', cfg, meta);
        },
       /**
        * Сохраняет только отмеченные данные.
        * @remark
        * Для сохранения применяется метод бизнес-логики <a href="https://wi.sbis.ru/docs/bl/Excel/Excel/methods/SaveMarked/">Excel.SaveMarked</a>.
        * Выгрузка производится через сервис file-transfer.
        * @param {Object} meta Метаданные.
        * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
        * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
        * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
        * Если параметр не указан, данные выведутся на печать.
        * @param {String} [meta.fileName] Имя сохраняемого файла.
        * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
        * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
        * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
        * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
        */
        exportMarked: function(meta) {
           var cfg = this._getFilterForList(meta);
           cfg.HierarchyField = meta.parentProperty || null;
           cfg.Limit = 0;
           coreMerge(cfg, this._parseColumns(meta.columns));

           this.exportFileTransfer('SaveMarked', cfg, meta);
        },

        /**
         * Универсальная выгрузка данных через сервис file-transfer.
         * @param {String} methodName Имя метода бизнес-логики, который осуществляет выгрузку данных.
         * @param {Object} cfg Параметры, передаваемые для вызова метода бизнес-логики.
         * @param {Object} meta Метаданные.
         * @param {Array} [meta.columns] Колонки, которые будут сохраняться.
         * @param {String} [meta.xsl] Имя файла с xsl преобразованием.
         * @param {String} [meta.endpoint] Имя объекта бизнес-логики, который осуществляет сохранение данных.
         * Если параметр не указан, данные выведутся на печать. При использовании в Престо или Рознице выгрузку производят через объекты БЛ <a href="https://wi.sbis.ru/docs/bl/Excel/Excel/">Excel</a> или PDF.
         * @param {String} [meta.fileName] Имя сохраняемого файла.
         * @param {Boolean} [meta.isExcel] Файл сохраняется в формате EXCEL.
         * @param {Number} [meta.pageOrientation] Ориентация страниц при сохранении в PDF формат.
         * @param {WS.Data/Collection/RecordSet} [meta.recordSet] Набор данных, который будет сохранён.
         * @param {WS.Data/Query/Query} [meta.query] Запрос, по которому будут получены данные для сохранения.
         * @returns {Core/Deferred} В случае ошибки в пользовательском интерфейсе будет отображён диалог с ошибкой, созданный на основе класса {@link SBIS3.CONTROLS.SubmitPopup}.
         */
        exportFileTransfer: function(methodName, cfg, meta) {
            var self = this,
                source = new SbisService({ endpoint: meta.endpoint });

            return source.call(methodName, cfg).addCallback(function(result) {
               //В престо и  рознице отключены длительные операции и выгрузка должна производиться по-старому
               //Через длительные операции производилась только выгрузка в Excel, поэтому проверяем endpoint
                if (self._useLongOperations(meta, methodName)) {
                    EventBus.channel('LongOperations').notify('onOperationStarted');
                } else {
                    self._downloadFile(result.getScalar(), meta.endpoint === "Excel" || meta.isExcel);
                }
            }).addErrback(function(error) {
               //Не показываем ошибку, если было прервано соединение с интернетом
               if (!error._isOfflineMode) {
                  moduleStubs.require(['js!SBIS3.CONTROLS.Utils.InformationPopupManager']).addCallback(function(manager) {
                     manager[0].showMessageDialog({
                        message: error.message,
                        status: 'error'
                     });
                  });
               }
               return error;
            });
        },

        /**
         * Загрузить файл по готовому id
         * @param id - уникальный идентификатор файла на сервисе file-transfer
         * @param isExcel - файл выгружается в формате EXCEL
         */
        _downloadFile : function(id, isExcel){
            var params = { 'id': id };
            if (isExcel) {
                params['storage'] = 'excel';
            }
            window.open(transHelpers.prepareGetRPCInvocationURL(isExcel ? 'FileTransfer' : 'File', 'Download', params, undefined, '/file-transfer/service/'), '_self');
        },

        _parseColumns: function(columns) {
            var result = { Fields: [], Titles: [] };
            for (var i = 0; i < columns.length; i++) {
                result.Fields.push(columns[i].field);
                result.Titles.push(columns[i].title || columns[i].field);
            }
            return result;
        },

         _prepareNavigation: function(offset, limit, dataSource) {
            var result = null;
            if (limit) {
               result = Record.fromObject({
                  'Страница': limit > 0 ? Math.floor(offset / limit) : 0,
                  'РазмерСтраницы': limit,
                  'ЕстьЕще': false
               }, dataSource.getAdapter());
            }
            return result;
         },

         _useLongOperations: function(meta, methodName) {
            return requirejs.defined('js!SBIS3.Engine.LongOperationsInformer') && (meta.endpoint === 'Excel' || meta.endpoint === 'PDF' && methodName === 'SaveMarked');
         },

         _getFilterForList: function(meta) {
            return {
               FileName: meta.fileName,
               MethodName: meta.dataSource.getEndpoint().contract + '.' + meta.dataSource.getBinding().query,
               PageOrientation: meta.pageOrientation,
               Filter: Record.fromObject(meta.query.getWhere(), meta.dataSource.getAdapter()),
               Sorting: meta.query.getOrderBy() ? Record.fromObject(meta.query.getOrderBy(), meta.dataSource.getAdapter()) : null
            };
         }
    });

    return SaveStrategySbis;
});
