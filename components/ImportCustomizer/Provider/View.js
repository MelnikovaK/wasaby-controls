/**
 * Контрол "Выбор провайдера парсинга настройщика импорта"
 *
 * @public
 * @class SBIS3.CONTROLS/ImportCustomizer/Provider/View
 * @extends SBIS3.CONTROLS/CompoundControl
 */
define('SBIS3.CONTROLS/ImportCustomizer/Provider/View',
   [
      'SBIS3.CONTROLS/CompoundControl',
      'tmpl!SBIS3.CONTROLS/ImportCustomizer/Provider/View',
      'css!SBIS3.CONTROLS/ImportCustomizer/Provider/View',
      'SBIS3.CONTROLS/DropdownList'
   ],

   function (CompoundControl, dotTplFn) {
      'use strict';

      var View = CompoundControl.extend(/**@lends SBIS3.CONTROLS/ImportCustomizer/Provider/View.prototype*/ {

         /**
          * @typedef {object} ImportParser Тип, содержащий информацию о провайдере парсинга импортируемых данных
          * @property {string} name Имя(идентификатор) парсера
          * @property {string} title Отображаемое имя парсера
          * @property {string} [component] Класс компонента для настройки парсера (опционально)
          * @property {object} [args] Набор специфичных для данного парсера параметров (опционально)
          */

         /**
          * @event change Происходит при измении настраиваемые значения компонента
          * @param {Core/EventObject} evtName Дескриптор события
          * @param {object} values Настраиваемые значения компонента:
          * @param {string} values.parser Имя(идентификатор) выбранного провайдера парсинга импортируемых данных
          * @param {number} values.skippedRows Количество пропускаемых строк в начале
          * @param {string} values.separator Символы-разделители
          */

         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               /**
                * @cfg {object[]} Список всех доступных провайдеров парсинга импортируемых данных
                */
               parsers: [],
               /**
                * @cfg {string} Выбранный провайдер парсинга импортируемых данных
                */
               parser: null,
               /**
                * @cfg {number}  Количество пропускаемых строк в начале
                */
               skippedRows: 0,
               /**
                * @cfg {string} Символы-разделители
                */
               separator: '',
            },
            // Компонент выбора провайдера парсинга импортируемых данных
            _parserView: null
         },

         _modifyOptions: function () {
            var options = View.superclass._modifyOptions.apply(this, arguments);
            if (!options.parser) {
               options.parser = options.parsers[0].id;
            }
            return options;
         },

         $constructor: function () {
            var options = this._options;
            this.getLinkedContext().setValue({
               firstLine: 0 < options.skippedRows ? options.skippedRows + 1 : 1,
               separator: options.separator
            });
            this._publish('change');
         },

         init: function () {
            View.superclass.init.apply(this, arguments);
            this._parserView = this.getChildControlByName('controls-ImportCustomizer-Provider-View__parser');
            this._bindEvents();
         },

         _bindEvents: function () {
            this.subscribeTo(this._parserView, 'onSelectedItemsChange', function (evtName, selecteds, changes) {
               this._options.parser = selecteds[0];
               this._notify('change', this.getValues());
            }.bind(this));
            this.subscribeTo(this.getLinkedContext(), 'onFieldChange', function (evtName, name, value) {
               var isFirstLine = name === 'firstLine';
               var key = isFirstLine ? 'skippedRows' : name;
               var val = isFirstLine ? +value - 1 : value;
               var options = this._options;
               if (options[key] !== val) {
                  options[key] = val;
                  this._notify('change', this.getValues());
               }
            }.bind(this));
         },

         /**
          * Установить указанные настраиваемые значения компонента
          *
          * @public
          * @param {object} values Набор из нескольких значений, которые необходимо изменить
          * @param {number} [values.skippedRows] Количество пропускаемых строк в начале (опционально)
          * @param {string} [values.separator] Символы-разделители (опционально)
          */
         setValues: function (values) {
            if (!values || typeof values !== 'object') {
               throw new Error('Object required');
            }
            var names = ['parser', 'skippedRows', 'separator'];
            var has = {};
            var options = this._options;
            for (var name in values) {
               if (names.indexOf(name) !== -1) {
                  var value = values[name];
                  if (options[name] !== value) {
                     has[name] = true;
                     options[name] = value;
                  }
               }
            }
            if (has.parser) {
               this._parserView.setSelectedKeys([options.parser]);
            }
            if (has.skippedRows || has.separator) {
               var args = {};
               if (has.skippedRows) {
                  args.firstLine = 0 < options.skippedRows ? options.skippedRows + 1 : 1;
               }
               if (has.separator) {
                  args.separator = options.separator;
               }
               this.getLinkedContext().setValue(args);
            }
         },

         /**
          * Получить все настраиваемые значения компонента
          *
          * @public
          * @return {object}
          */
         getValues: function () {
            var options = this._options;
            return {
               parser: this._options.parser,
               skippedRows: options.skippedRows,
               separator: options.separator
            };
         }
      });

      return View;
   }
);
