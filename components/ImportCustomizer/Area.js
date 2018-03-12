/**
 * Контрол "Область редактирования настройщика импорта"
 *
 * @public
 * @class SBIS3.CONTROLS/ImportCustomizer/Area
 * @extends SBIS3.CONTROLS/CompoundControl
 */
define('SBIS3.CONTROLS/ImportCustomizer/Area',
   [
      'Core/CommandDispatcher',
      'Core/core-merge',
      'SBIS3.CONTROLS/CompoundControl',
      'tmpl!SBIS3.CONTROLS/ImportCustomizer/Area',
      'css!SBIS3.CONTROLS/ImportCustomizer/Area',
      'SBIS3.CONTROLS/Button',
      'SBIS3.CONTROLS/ImportCustomizer/BaseParams/View',
      'SBIS3.CONTROLS/ImportCustomizer/ProviderArgs/View',
      'SBIS3.CONTROLS/ScrollContainer'
   ],

   function (CommandDispatcher, cMerge, CompoundControl, dotTplFn) {
      'use strict';

      var Area = CompoundControl.extend(/**@lends SBIS3.CONTROLS/ImportCustomizer/Area.prototype*/ {

         /**
          * @typedef {object} ImportFile Тип, содержащий информацию об импортируемом файле
          * @property {string} name Отображаемое имя файла
          * @property {string} url Урл для скачивания файла
          * @property {string} uuid Идентификатор файла в системе хранения
          */

         /**
          * @typedef {object} ImportParser Тип, содержащий информацию о провайдере парсинга импортируемых данных
          * @property {string} name Имя(идентификатор) парсера
          * @property {string} title Отображаемое имя парсера
          * @property {string} [component] Класс компонента для настройки парсера (опционально)
          * @property {object} [args] Набор специфичных для данного парсера параметров (опционально)
          */

         /**
          * @typedef {object} ImportSheet Тип, содержащий информацию об области импортируемых данных (например, лист excel)
          * @property {string} name Отображаемое наименование области данных
          * @property {any[][]} sampleRows Образец данных в области, массив массивов равной длины
          * @property {string} [parser] Провайдер парсинга импортируемых данных
          * @property {number} [skippedRows] Количество пропускаемых строк в начале
          * @property {string} [separator] Символы-разделители
          */

         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               /**
                * @cfg {string} Заголовок настройщика импорта (опционально)
                */
               title: null,//Определено в шаблоне
               /**
                * @cfg {string} Название кнопки применения результата редактирования (опционально)
                */
               applyButtonTitle: null,//Определено в шаблоне
               /**
                * @cfg {string} Тип импортируемых данных (excel и т.д.)
                */
               dataType: null,
               /**
                * @cfg {ImportFile} Информация об импортируемом файле (обязательно)
                */
               file: null,
               /**
                * @cfg {string} Класс компонента настройки параметоров импортирования (Опционально, если не указан - используется {@link SBIS3.CONTROLS/ImportCustomizer/BaseParams/View комполнент по умолчанию})
                */
               baseParamsComponent: 'SBIS3.CONTROLS/ImportCustomizer/BaseParams/View',
               /**
                * @cfg {object} Опции компонента настройки параметоров импортирования. Состав опций определяется {@link baseParamsComponent используемым компонентом} (опционально)
                */
               baseParams: {
                  //Заменять ли импортируемыми данными предыдущее содержимое базы данных полностью или нет (только обновлять и добавлять)
                  replaceAllData: false,
                  //Место назначения для импортирования (таблица в базе данных и т.п.)
                  destination: null
               },
               /**
                * @cfg {object<ImportParser>} Список всех доступных провайдеров парсинга импортируемых данных
                */
               parsers: {},
               /**
                * @cfg {object} ^^^
                */
               fields: null,
               /**
                * @cfg {ImportSheet[]} Список объектов, представляющих имеющиеся области данных
                */
               sheets: [],
               /**
                * @cfg {number} Индекс выбранной области данных
                */
               sheetIndex: null
            },
            // Список имён вложенных компонентов
            _childViewNames: {
               sheet: 'controls-ImportCustomizer-Area__sheet',
               baseParams: 'controls-ImportCustomizer-Area__baseParams',
               provider: 'controls-ImportCustomizer-Area__provider',
               providerArgs: 'controls-ImportCustomizer-Area__providerArgs',
               columnBinding: 'controls-ImportCustomizer-Area__columnBinding'
            },
            // Ссылки на вложенные компоненты
            _views: {
               sheet: null,
               baseParams: null,
               provider: null,
               providerArgs: null,
               columnBinding: null
            },
            // Набор результирующих значений (по обастям данных)
            _results: null
         },

         _modifyOptions: function () {
            var options = Area.superclass._modifyOptions.apply(this, arguments);
            var sheets = options.sheets;
            var hasSheets = sheets && sheets.length;
            options._sheetsTitles = hasSheets ? sheets.map(function (v) {return v.name; }) : [];
            var parsers = options.parsers;
            var parserNames = Object.keys(parsers);
            var parserItems = parserNames.map(function (v) { var o = parsers[v]; return {id:v, title:o.title, order:o.order}; });
            parserItems.sort(function (v1, v2) { return v1.order - v2.order; });
            options._parserItems = parserItems;
            options._defaultParserName = parserItems[0].id;
            var sheetIndex = options.sheetIndex;
            if (sheetIndex ==/*Не ===*/ null) {
               options.sheetIndex = sheetIndex = -1;
            }
            var sheet = sheets[0 < sheetIndex ? sheetIndex : 0];
            var parserName = sheet.parser;
            if (!parserName) {
               sheet.parser = parserName = options._defaultParserName;
            }
            options._parserName = parserName;
            options._skippedRows = 0 < sheet.skippedRows ? sheet.skippedRows : 0;
            options._parserSeparator = sheet.separator || '';
            options._providerArgsComponent = parsers[parserName].component || undefined;
            options._providerArgsOptions = this._getProviderArgsOptions(options, parserName, true);
            options._columnsBindingRows = hasSheets ? sheet.sampleRows : [];
            options._columnsBindingFields = options.fields;//^^^
            return options;
         },

         $constructor: function () {
            CommandDispatcher.declareCommand(this, 'complete', this._cmdComplete);
            this._publish('onComplete');
         },

         init: function () {
            Area.superclass.init.apply(this, arguments);
            for (var name in this._childViewNames) {
               this._views[name] = _getChildComponent(this, this._childViewNames[name]);
            }
            var options = this._options;
            var sheets = options.sheets;
            if (sheets && sheets.length) {
               var results = {};
               for (var i = 0; i < sheets.length; i++) {
                  var sheet = sheets[i];
                  var parserName = sheet.parser;
                  if (!parserName) {
                     sheet.parser = parserName = options._defaultParserName;
                  }
                  var skippedRows = 0 < sheet.skippedRows ? sheet.skippedRows : 0;
                  results[i + 1] = {
                     provider: {parser:parserName, skippedRows:skippedRows, separator:sheet.separator || ''},
                     providerArgs: this._getProviderArgsOptions(options, parserName, false),
                     columnBinding: {accordances:{}, skippedRows:skippedRows},
                  };
               }
               results[''] = cMerge({}, results[1]);
               this._results = results;
            }
            this._bindEvents();
         },

         _bindEvents: function () {
            this.subscribeTo(this._views.sheet, 'change', function (evtName, values) {
               // Изменилась область данных для импортирования
               var options = this._options;
               var views = this._views;
               var results = this._results;
               var sheetIndex = options.sheetIndex;
               var prevResult = results[0 <= sheetIndex ? sheetIndex + 1 : ''];
               prevResult.provider =  cMerge({}, views.provider.getValues());
               prevResult.providerArgs = cMerge({}, this._getProviderArgsValues());
               prevResult.columnBinding = cMerge({}, views.columnBinding.getValues());
               sheetIndex = values.sheetIndex;
               options.sheetIndex = sheetIndex;
               var nextResult = results[0 <= sheetIndex ? sheetIndex + 1 : ''];
               views.provider.setValues(nextResult.provider);
               this._updateProviderArgsView(nextResult.provider.parser);
               var sheets = options.sheets;
               views.columnBinding.setValues(cMerge({rows:sheets[0 < sheetIndex ? sheetIndex : 0].sampleRows}, nextResult.columnBinding));
            }.bind(this));
            /*this.subscribeTo(this._views.baseParams, 'change', function (evtName, values) {
               // Изменились параметры импортирования
            }.bind(this));*/
            this.subscribeTo(this._views.provider, 'change', function (evtName, values) {
               // Изменился выбор провайдера парсинга
               var sheetIndex = this._options.sheetIndex;
               var result = this._results[0 <= sheetIndex ? sheetIndex + 1 : ''];
               var parserName = values.parser;
               var skippedRows = values.skippedRows;
               if (parserName !== result.provider.parser) {
                  this._updateProviderArgsView(parserName);
               }
               result.provider = cMerge({}, values);
               result.columnBinding.skippedRows = skippedRows;
               this._views.columnBinding.setValues({skippedRows:skippedRows});
            }.bind(this));
            // Для компонента this._views.providerArgs подисываеися отдельно через обработчик в опциях
            this.subscribeTo(this._views.columnBinding, 'change', function (evtName, values) {
               // Изменилась привязка данных к полям базы
               var sheetIndex = this._options.sheetIndex;
               var result = this._results[0 <= sheetIndex ? sheetIndex + 1 : ''];
               var skippedRows = values.skippedRows;
               result.provider.skippedRows = skippedRows;
               result.columnBinding = cMerge({}, values);
               result.columnBinding123 = cMerge({}, values);
               this._views.provider.setValues({skippedRows:skippedRows});
            }.bind(this));
         },

         /*
          * Обработчик события "change" для компонента this._views.providerArgs
          *
          * @protected
          */
         _onChangeProviderArgs: function (evtName, values) {
            // Изменились параметры провайдера парсинга
            var sheetIndex = this._options.sheetIndex;
            this._results[0 <= sheetIndex ? sheetIndex + 1 : ''].providerArgs = cMerge({}, values);
         },

         /*
          * Реализация команды "complete"
          *
          * @protected
          */
         _cmdComplete: function () {
            var options = this._options;
            var file = options.file;
            var views = this._views;
            var results = this._results;
            var sheetIndex = options.sheetIndex;
            var useAllSheets = 0 <= sheetIndex;
            var sheets;
            if (useAllSheets) {
               sheets = options.sheets.reduce(function (r, v, i) { r.push(this._combineResultSheet(results[i + 1], v, i)); return r; }.bind(this), []);
            }
            else {
               sheets = [this._combineResultSheet(results[''])];
            }
            var data = {
               dataType: options.dataType,
               //TODO: хорошо бы выводить file объектом
               fileName: file.name,
               fileUrl: file.url,
               fileUuid: file.uuid,
               //sheetIndex: sheetIndex,
               sameSheetConfigs: !useAllSheets,
               sheets: sheets
            };
            var baseParams = this._views.baseParams.getValues();
            for (var name in baseParams) {
               data[name] = baseParams[name];
            }
            // Собрать данные и затем...
            if (data) {
               this._notify('onComplete', data);
            }
            else {
               this._notify('onClose');
            }
         },

         /*
          * Скомбинировать из аргументов элемент выходного массива sheets
          *
          * @protected
          * @param {object} result Резудльтирующие значения, относящиеся к этому элементу (опционально)
          * @param {object} [sheet] Опции, относящиеся к этому элементу (опционально)
          * @param {number} [index] Индекс этого элемента
          * @return {object}
          */
         _combineResultSheet: function (result, sheet, index) {
            var provider = result.provider;
            var providerArgs = result.providerArgs;
            var columnBindingAccordances = result.columnBinding.accordances;
            var item = {
               parser: provider.parser,
               skippedRows: provider.skippedRows,
               columns: Object.keys(columnBindingAccordances).map(function (v) { return {index:columnBindingAccordances[v], field:v}; }),
            };
            if (provider.separator) {
               item.separator = provider.separator;
            }
            if (providerArgs) {
               item.parserConfig = ['hierarchyField', 'columns'].reduce(function (r, v) { r[v] = providerArgs[v]; return r; }, {});
            }
            if (sheet) {
               item.name = sheet.name;
               item.sampleRows = sheet.sampleRows;

            }
            if (index !=/*Не !==*/ null && 0 <= index) {
               item.index = index;
            }
            return item;
         },

         /*
          * Обновить компонент провайдера парсинга
          *
          * @protected
          * @param {string} parser Имя выбранного парсера
          */
         _updateProviderArgsView: function (parserName) {
            var options = this._options;
            var component = options.parsers[parserName].component;
            var view = this._views.providerArgs;
            if (component) {
               view.setTemplate(component, this._getProviderArgsOptions(options, parserName, true));
            }
            else {
               view.clearTemplate();
            }
            view.setVisible(!!component);
         },

         /*
          * Получить получить набор опций для компонента провайдера парсинга
          *
          * @protected
          * @param {object} options Опции
          * @param {string} parser Имя выбранного парсера
          * @param {boolean} withHandler Вместе с обработчиками событий
          * @return {object}
          */
         _getProviderArgsOptions: function (options, parserName, withHandler) {
            var parser = options.parsers[parserName];
            if (parser && parser.component) {
               var sheets = options.sheets;
               var sheetIndex = options.sheetIndex;
               var values = {
                  columnCount:sheets && sheets.length ? sheets[0 < sheetIndex ? sheetIndex : 0].sampleRows[0].length : 0,
                  handlers: {change:this._onChangeProviderArgs.bind(this)}
               };
               var args = parser.args;
               return args ? cMerge(values, args) : values;
            }
         },

         /*
          * Получить значения из компонента настройки параметров провайдера парсинга
          *
          * @protected
          * @return {object}
          */
         _getProviderArgsValues: function () {
            var values;
            var view = this._views.providerArgs;
            if (view) {
               var current = view.getCurrentTemplateName();
               if (current) {
                  view.getChildControls().some(function (v) { if (v._moduleName === current) { values = v.getValues(); return true; }; });
               }
            }
            return values;
         }//,

         /*destroy: function () {
            Area.superclass.destroy.apply(this, arguments);
         }*/
      });



      // Private methods:

      var _getChildComponent = function (self, name) {
         if (self.hasChildControlByName(name)) {
            return self.getChildControlByName(name);
         }
      };



      return Area;
   }
);
