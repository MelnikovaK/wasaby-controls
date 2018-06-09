/**
 * Контрол "Выбор из предустановленных настроек настройщика экспорта"
 *
 * @public
 * @class SBIS3.CONTROLS/ExportCustomizer/_Presets/View
 * @extends SBIS3.CONTROLS/CompoundControl
 */
define('SBIS3.CONTROLS/ExportCustomizer/_Presets/View',
   [
      'Core/Deferred',
      'Core/helpers/Object/isEqual',
      'SBIS3.CONTROLS/CompoundControl',
      'SBIS3.CONTROLS/Utils/ItemNamer',
      'SBIS3.CONTROLS/Utils/ObjectChange',
      'WS.Data/Collection/RecordSet',
      'WS.Data/Di',
      'tmpl!SBIS3.CONTROLS/ExportCustomizer/_Presets/View',
      'tmpl!SBIS3.CONTROLS/ExportCustomizer/_Presets/tmpl/item',
      'tmpl!SBIS3.CONTROLS/ExportCustomizer/_Presets/tmpl/footer',
      'css!SBIS3.CONTROLS/ExportCustomizer/_Presets/View'
   ],

   function (Deferred, cObjectIsEqual, CompoundControl, ItemNamer, objectChange, RecordSet, Di, dotTplFn) {
      'use strict';

      /**
       * @typedef {object} ExportPreset Тип, содержащий информацию о предустановленных настройках экспорта
       * @property {string|number} id Идентификатор пресета
       * @property {string} title Отображаемое название пресета
       * @property {Array<string>} fieldIds Список привязки колонок в экспортируемом файле к полям данных
       * @property {string} fileUuid Uuid шаблона форматирования эксель-файла
       */

      /**
       * @typedef {object} ExportPresetsResult Тип, описывающий возвращаемые настраиваемые значения компонента
       * @property {Array<string>} fieldIds Список привязки колонок в экспортируемом файле к полям данных
       * @property {string} fileUuid Uuid шаблона форматирования эксель-файла
       */



      /**
       * Имя регистрации объекта, предоставляющего методы загрузки и сохранения пользовательских пресетов, в инжекторе зависимостей
       * @private
       * @type {string}
       */
      var _DI_STORAGE_NAME = 'ExportPresets.Loader';

      /**
       * Список доступных действий пользователя
       * @protected
       * @type {object[]}
       */
      var _ACTIONS = {
         edit: {title:rk('Редактировать', 'НастройщикЭкспорта'), icon:'sprite:icon-16 icon-Edit icon-primary action-hover'},
         clone: {title:rk('Дублировать', 'НастройщикЭкспорта'), icon:'sprite:icon-16 icon-Copy icon-primary action-hover'},
         'delete': {title:rk('Удалить', 'НастройщикЭкспорта'), icon:'sprite:icon-16 icon-Erase icon-error'}
      };

      /**
       * Сообщение об ошибке при редактировании названия пресета
       * @protected
       * @type {string}
       */
      var _TITLE_ERROR = rk('Название шаблона не может быть пустым и должно отличаться от названий других шаблонов', 'НастройщикЭкспорта');



      var View = CompoundControl.extend(/**@lends SBIS3.CONTROLS/ExportCustomizer/_Presets/View.prototype*/ {
         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               /**
                * @cfg {string} Заголовок компонента
                */
               title: null,//Определено в шаблоне
               /**
                * @cfg {string} Надпись на кнопке добавления нового пресета
                */
               addNewTitle: null,//Определено в шаблоне
               /**
                * @cfg {string} Название нового пресета
                */
               newPresetTitle: rk('Новый шаблон', 'НастройщикЭкспорта'),
               /**
                * @cfg {Array<ExportPreset>} Список неизменяемых пресетов
                */
               statics: null,
               /**
                * @cfg {string} Пространство имён для сохранения пользовательских пресетов
                */
               namespace: null,
               /**
                * @cfg {string|number} Идентификатор выбранного пресета. Если будет указан пустое значение (null или пустая строка), то это будет воспринято как указание создать новый пустой пресет и выбрать его. Если значение не будет указано вовсе (или будет указано значение undefined), то это будет воспринято как указание выбрать пресет, который был выбран в прошлый раз (опционально)
                */
               selectedId: undefined
            },
            // Объект, предоставляющий методы загрузки и сохранения пользовательских пресетов
            _storage: null,
            // Список пользовательских пресетов
            _customs: null,
            // Текущий список привязки колонок в экспортируемом файле к полям данных
            _fieldIds: null,
            // Текущий uuid шаблона форматирования эксель-файла
            _fileUuid: null,
            // Контрол выбора пресета
            _selector: null,
            // Контрол редактирования пресета
            _editor: null,
            // Идетификатор предыдущего выбранного пресета
            _previousId: null,
            // Компонент находится в моде редактирования
            _isEditMode: null,
            // Нужно добавить новый пресет после первичной загрузки
            _needNewPreset: null
         },

         _modifyOptions: function () {
            var options = View.superclass._modifyOptions.apply(this, arguments);
            options._items = this._makeItems(options);
            var selectedId = options.selectedId;
            if (selectedId === undefined) {
               options.selectedId = selectedId = this._getStoredSelectedId(options);
            }
            if (selectedId || selectedId === undefined) {
               if (!Di.isRegistered(_DI_STORAGE_NAME)) {
                  this._checkSelectedId(options);
               }
            }
            else {
               this._needNewPreset = true;
            }
            return options;
         },

         $constructor: function () {
            this.getLinkedContext().setValue('editedTitle', '');
         },

         init: function () {
            View.superclass.init.apply(this, arguments);
            if (Di.isRegistered(_DI_STORAGE_NAME)) {
               this._storage = Di.resolve(_DI_STORAGE_NAME);
            }
            this._selector = this.getChildControlByName('controls-ExportCustomizer-Presets-View__selector');
            if (this._storage) {
               this._editor = this.getChildControlByName('controls-ExportCustomizer-Presets-View__editor');

               this._updateSelectorListOptions('handlers', {
                  onChangeHoveredItem: this._onHoverItem.bind(this)
               });
               this._updateSelectorListOptions('footerTpl', 'tmpl!SBIS3.CONTROLS/ExportCustomizer/_Presets/tmpl/footer');
               this._updateSelectorListOptions('_footerHandler', this._onAdd.bind(this));
            }
            this._bindEvents();
            if (this._storage) {
               this._loadCustoms().addCallback(function () {
                  if (this._needNewPreset) {
                     this._addPreset();
                     this._startEditingMode();
                     this._needNewPreset = null;
                  }
                  this._updateSelector();
                  this.sendCommand('subviewChanged');
               }.bind(this));
            }
            else {
               this.sendCommand('subviewChanged');
            }
         },

         _bindEvents: function () {
            this.subscribeTo(this._selector, 'onSelectedItemsChange', function (evtName, ids, changes) {
               var selectedId = ids[0];
               var preset = this._findPresetById(selectedId);
               this._selectPreset(preset);
               this._updateSelectorListOptions('selectedKey', selectedId);
            }.bind(this));

            var editor = this._editor;
            if (editor) {
               var options = this._options;
               this.subscribeTo(editor, 'onApply', function (evtName) {
                  var preset = this._findPresetById(options.selectedId);
                  preset.title = editor.getText();
                  delete preset.isUnreal;
                  preset.isStorable = true;
                  this._previousId = null;
                  this._saveSelectedPreset().addCallback(function (/*isSuccess*/) {
                     /*if (isSuccess) {*/
                        this._endEditingMode();
                        this._updateSelector();
                     /*}*/
                  }.bind(this));
               }.bind(this));

               this.subscribeTo(editor, 'onCancel', function (evtName) {
                  var presetInfo = this._findPresetById(options.selectedId, true);
                  if (presetInfo) {
                     if (presetInfo.preset.isUnreal) {
                        this._customs.splice(presetInfo.index, 1);
                        var previousId = this._previousId;
                        var previous = previousId ? this._findPresetById(previousId) : null;
                        this._previousId = null;
                        this._selectPreset(previous || this._getFirstPreset(options));
                        if (!previous) {
                           this._updateSelector();
                        }
                     }
                     else {
                        this._selectPreset(presetInfo.preset);
                     }
                  }
                  this._endEditingMode();
               }.bind(this));
            }
         },

         /**
          * Приготовить список элементов для списочного контрола
          *
          * @protected
          * @param {object} options Опции компонента
          * @return {Array<object>}
          */
         _makeItems: function (options) {
            var list = [];
            var customs = this._customs;
            if (customs && customs.length) {
               for (var i = 0; i < customs.length; i++) {
                  var preset = customs[i];
                  if (!preset.isUnreal) {
                     list.push(preset);
                  }
               }
            }
            var statics = options.statics;
            if (statics && statics.length) {
               list.push.apply(list, statics);
            }
            return !list.length ? null : new RecordSet({
               rawData: list,
               idProperty: 'id'
            });
         },

         /**
          * Приготовить идентификатор выбранного элемента для списочного контрола
          *
          * @protected
          * @param {object} options Опции компонента
          * @return {string|number}
          */
         _checkSelectedId: function (options) {
            var selectedId = options.selectedId;
            var statics = options.statics;
            if (!selectedId || _findIndexById(statics, selectedId) === -1) {
               var customs = this._customs;
               var hasCustoms = !!(customs && customs.length);
               if (!selectedId || !hasCustoms || _findIndexById(customs, selectedId) === -1) {
                  var first = this._getFirstPreset(options);
                  options.selectedId = selectedId = first ? first.id : undefined;
               }
            }
            return selectedId;
         },

         /**
          * Получить первый по порядку отображения пресет
          *
          * @protected
          * @param {object} options Опции компонента
          * @return {ExportPreset}
          */
         _getFirstPreset: function (options) {
            var customs = this._customs;
            if (customs && customs.length) {
               return customs[0];
            }
            var statics = options.statics;
            if (statics && statics.length) {
               return statics[0];
            }
         },

         /**
          * Обработчик события - наведение курсора на элемент списочного контрола
          *
          * @protected
          * @param {Core/EventObject} evtName Дескриптор события
          * @param {object} item Объект, представляющий информацию об элемент списочного контрола
          */
         _onHoverItem: function (evtName, item) {
            var listView = evtName.getTarget();
            var model = item.record;
            if (model) {
               this._updateItemsActions(listView, this._makeItemsActions(listView, model.get('isStorable')));
            }
         },

         /**
          * Обновить список доступных действий пользователя у списочного контрола
          *
          * @protected
          * @param {object} listView Списочный контрол
          * @param {Array<object>} actions Список объектов, описывающих действия пользователя
          */
         _updateItemsActions: function (listView, actions) {
            var itemsActionsGroup = listView.getItemsActions();
            if (itemsActionsGroup) {
               itemsActionsGroup.setItems(actions);
            }
            else {
               listView.setItemsActions(actions);
            }
         },

         /**
          * Обработчик события - нажатие кнопки добавления нового элемента списочного контрола
          *
          * @protected
          * @param {Core/EventObject} evtName Дескриптор события
          */
         _onAdd: function (evtName) {
            var listView = evtName.getTarget().getParent();
            this._addPreset();
            this._startEditingMode(listView);
            this.sendCommand('subviewChanged', 'create');
         },

         /**
          * Обработчик события - нажатие на кнопку действия для элемента списочного контрола
          *
          * @protected
          * @param {object} listView Списочный контрол
          * @param {jQuery} itemContainer Контейнер элемента
          * @param {string} id Идентификатор пресета
          * @param {WS.Data/Entity/Model} model Модель пресета
          * @param {string} action Вид действия
          */
         _onItemAction: function (listView, itemContainer, id, model, action) {
            listView.setSelectedKey(this._options.selectedId);
            switch (action) {
               case 'clone':
                  this._clonePreset(id, listView);
                  this._startEditingMode(listView);
                  break;
               case 'edit':
                  this._editPreset(id, listView);
                  break;
               case 'delete':
                  this._deletePreset(id, listView)
                     .addCallback(_ifSuccess(this._updateListView.bind(this, listView)));
                  break;
            }
         },

         /**
          * Обновить списочный контрол после изменений
          *
          * @protected
          * @param {object} listView Списочный контрол
          */
         _updateListView: function (listView) {
            this._updateSelector();
            var options = this._options;
            listView.setItems(options._items);
            listView.setSelectedKey(options.selectedId);
         },

         /**
          * Приготовить список доступных действий пользователя
          *
          * @protected
          * @param {object} listView Списочный контрол
          * @param {boolena} useAllActions Использовать все действия
          * @return {object[]}
          */
         _makeItemsActions: function (listView, useAllActions) {
            return (useAllActions ? Object.keys(_ACTIONS) : ['clone']).map(function (name) {
               var action = _ACTIONS[name];
               return {
                  name: name,
                  icon: action.icon,
                  caption: action.title,
                  tooltip: action.title,
                  isMainAction: true,
                  onActivated: this._onItemAction.bind(this, listView)
               };
            }.bind(this));
         },

         /**
          * Добавить новый пресет
          *
          * @protected
          */
         _addPreset: function () {
            var preset = this._createPreset();
            this._customs.push(preset);
            this._selectPreset(preset, true);
         },

         /**
          * Клонировать пресет
          *
          * @protected
          * @param {string|number} id Идентификатор пресета
          */
         _clonePreset: function (id) {
            var presetInfo = this._findPresetById(id, true);
            if (presetInfo) {
               var pattern = presetInfo.preset;
               var preset = this._createPreset(pattern);
               this._customs.splice(presetInfo.isStatic ? 0 : presetInfo.index + 1, 0, preset);
               this._selectPreset(preset, true, ['clone', pattern.fileUuid]);
            }
         },

         /**
          * Редактировать пресет
          *
          * @protected
          * @param {string|number} id Идентификатор пресета
          * @param {object} listView Списочный контрол
          */
         _editPreset: function (id, listView) {
            var preset = this._findPresetById(id);
            if (preset) {
               var options = this._options;
               if (options.selectedId !== id) {
                  this._selectPreset(preset);
                  this._updateListView(listView);
               }
               this._startEditingMode(listView);
            }
         },

         /**
          * Удалить пресет
          *
          * @protected
          * @param {string|number} id Идентификатор пресета
          * @return {Core/Deferred}
          */
         _deletePreset: function (id) {
            var customs = this._customs;
            var index = _findIndexById(customs, id);
            if (index !== -1) {
               var prevPreset = customs[index];
               customs.splice(index, 1);
               return this._saveCustoms().addCallback(function (/*isSuccess*/) {
                  //if (isSuccess) {
                     var fileUuid = prevPreset.fileUuid;
                     if (fileUuid) {
                        this.sendCommand('subviewChanged', 'delete', fileUuid);
                     }
                     if (this._options.selectedId === id) {
                        var preset = customs.length ? customs[index < customs.length ? index : index - 1] : null;
                        this._selectPreset(preset);
                     }
                  //}
                  return true/*isSuccess*/;
               }.bind(this));
            }
            else {
               return Deferred.success(false);
            }
         },

         /**
          * Создать новый экземпляр пресета. Если укащан pattern - скопировать с него
          *
          * @protected
          * @param {ExportPreset} pattern Образец для создания
          * @return {ExportPreset}
          */
         _createPreset: function (pattern) {
            var options = this._options;
            return {
               id: _makeId(),
               title: ItemNamer.make(pattern ? pattern.title : options.newPresetTitle, [{list:options.statics, property:'title'}, {list:this._customs, property:'title'}]),
               fieldIds: pattern ? pattern.fieldIds.slice() : [],
               fileUuid: null,
               isStorable: false,
               isUnreal: true
            };
         },

         /**
          * Включить моду редактирования
          *
          * @protected
          * @param {object} [listView] Списочный контрол (опционально)
          */
         _startEditingMode: function (listView) {
            if (!this._isEditMode) {
               var options = this._options;
               var preset = this._findPresetById(options.selectedId);
               if (preset && (preset.isStorable || preset.isUnreal)) {
                  if (listView) {
                     listView.sendCommand('close');
                  }
                  this._isEditMode = true;
                  this._switchEditor();
                  var editor = this._editor;
                  this.getLinkedContext().setValue('editedTitle', preset.title);
                  editor._clickHandler();
                  var container = editor._cntrlPanel;
                  container.find('.controls-EditAtPlace__okButton').attr('title', rk('Сохранить шаблон', 'НастройщикЭкспорта'));
                  container.find('.controls-EditAtPlace__cancel').attr('title', rk('Отменить изменения', 'НастройщикЭкспорта'));
                  var titles = []; options._items.each(function (v) { if (v.getId() !== preset.id) { titles.push(v.get('title')); } });
                  editor.setValidators([{
                     option: 'text',
                     validator: function (list, value) {
                        // TODO: Возможно, лучше получать list непосредственно при вызове, а не заранее ???
                        if (value) {
                           var v = value.trim();
                           return !!v && list.indexOf(v) === -1;
                        }
                     }.bind(null, titles),
                     errorMessage: _TITLE_ERROR
                  }]);
               }
            }
         },

         /**
          * Выключить моду редактирования
          *
          * @protected
          */
         _endEditingMode: function () {
            this._isEditMode = false;
            this._switchEditor();
            this._editor.clearMark();
         },

         /**
          * Переключить видимость редактора
          *
          * @protected
          */
         _switchEditor: function () {
            var isEditing = this._isEditMode;
            this._selector.setVisible(!isEditing);
            this._editor.setVisible(isEditing);
         },

         /**
          * Установить пресет в качестве выбранного
          *
          * @protected
          * @param {ExportPreset} preset Новый выбранный пресет
          * @param {boolean} [setPrevious] Указывает на необходимость запомнить идентификатор предыдущего выбранного пресета (опционально)
          * @param {Array<*>} [eventArgs] Аргументы события (опционально)
          */
         _selectPreset: function (preset, needPrevious, eventArgs) {
            var options = this._options;
            if (needPrevious) {
               this._previousId = options.selectedId;
            }
            options.selectedId = preset ? preset.id : null;
            this._fieldIds = preset ? preset.fieldIds : null;
            this._fileUuid = preset ? preset.fileUuid : null;
            // Даже если fieldIds и fileUuid в предыдущем и текуущем пресетах не отличаются совсем - нужно бросить событие как указание сбросить все несохранённые изменения в других под-компонентах
            var args = ['subviewChanged'];
            if (eventArgs && eventArgs.length) {
               args.push.apply(args, eventArgs);
            }
            this.sendCommand.apply(this, args);
            this._storeSelectedId(options);
         },

         /**
          * Сохранить идентификатор выбранного пресета для дальнейшего использования
          *
          * @protected
          * @param {object} options Опции компонента
          */
         _storeSelectedId: function (options) {
            var selectedId = options.selectedId;
            var key = options.namespace + 'preset';
            if (selectedId) {
               localStorage.setItem(key, selectedId);
            }
            else {
               localStorage.removeItem(key);
            }
         },

         /**
          * Получитиь сохранённый идентификатор выбранного пресета
          *
          * @protected
          * @param {object} options Опции компонента
          * @return {string}
          */
         _getStoredSelectedId: function (options) {
            return localStorage.getItem(options.namespace + 'preset');
         },

         /**
          * Найти пресет по его идентификатору
          *
          * @protected
          * @param {string|number} id Идентификатор пресета
          * @param {boolean} extendedResult Вернуть результат в расширенном виде
          * @return {ExportPreset|object}
          */
         _findPresetById: function (id, extendedResult) {
            var statics = this._options.statics;
            var index = _findIndexById(statics, id);
            if (index !== -1) {
               return extendedResult ? {preset:statics[index], index:index, isStatic:true} : statics[index];
            }
            var customs = this._customs;
            index = _findIndexById(customs, id);
            if (index !== -1) {
               return extendedResult ? {preset:customs[index], index:index} : customs[index];
            }
         },

         /**
          * Обновить опцию списочного контрола внутри селектора
          *
          * @protected
          * @param {string} name Имя опции
          * @param {*} value Значение опции
          */
         _updateSelectorListOptions: function (name, value) {
            this._selector.getProperty('dictionaries')[0].componentOptions.scope[name] = value;
         },

         /**
          * Обновить данные селектора
          *
          * @protected
          */
         _updateSelector: function () {
            var options = this._options;
            var selector = this._selector;
            var items = options._items = this._makeItems(options);
            selector.setItems(items);
            this._updateSelectorListOptions('items', items);
            var selectedId = this._checkSelectedId(options);
            selector.setSelectedKeys([selectedId]);
            this._updateSelectorListOptions('selectedKey', selectedId);
         },

         /**
          * Загрузить пользовательские пресеты
          *
          * @protected
          * @return {Core/Deferred}
          */
         _loadCustoms: function () {
            return this._storage.load(this._options.namespace).addCallback(function (presets) {
               this._customs = presets;
            }.bind(this));
         },

         /**
          * Сохранить пользовательские пресеты
          *
          * @protected
          * @return {Core/Deferred}
          */
         _saveCustoms: function () {
            return this._storage.save(this._options.namespace, this._customs.filter(function (v) { return v.isStorable; }));
         },

         /**
          * Сохранить текущий пресет, если это возможно
          *
          * @protected
          * @return {Core/Deferred}
          */
         _saveSelectedPreset: function () {
            var preset = this._findPresetById(this._options.selectedId);
            if (preset && preset.isStorable) {
               var fieldIds = this._fieldIds || [];
               var fileUuid = this._fileUuid || null;
               if (!cObjectIsEqual(preset.fieldIds, fieldIds)) {
                  preset.fieldIds = fieldIds.slice();
               }
               if (preset.fileUuid !== fileUuid) {
                  preset.fileUuid = fileUuid;
               }
               return this._saveCustoms();
            }
            return Deferred.success(null);
         },

         /**
          * Сохранить данные компонента (вызывается перед закрытием после применения)
          *
          * @public
          * return {Core/Deferred}
          */
         save: function () {
            return /*this._storage && this._isEditMode ? this._saveSelectedPreset() :*/ Deferred.success(null);
         },

         /**
          * Установить указанные настраиваемые значения компонента
          *
          * @public
          * @param {object} values Набор из нескольких значений, которые необходимо изменить
          * @param {object} meta Дополнительная информация об изменении
          */
         setValues: function (values, meta) {
            if (!values || typeof values !== 'object') {
               throw new Error('Object required');
            }
            var changes = objectChange(this, values, {fieldIds:{target:'_fieldIds', asObject:true}, fileUuid:{target:'_fileUuid'}});
            if (!this._isEditMode) {
               var needStartEdit;
               if (meta.source === 'columnBinder') {
                  needStartEdit = changes && 'fieldIds' in changes;
               }
               else
               if (meta.source === 'formatter') {
                  needStartEdit = meta.reason === 'open';
               }
               if (needStartEdit) {
                  var result;
                  var selectedId = this._options.selectedId;
                  if (selectedId) {
                     var preset = this._findPresetById(selectedId);
                     if (preset && !preset.isStorable) {
                        this._clonePreset(preset.id);
                        result = {isComplete:true};
                     }
                  }
                  this._startEditingMode();
                  if (result) {
                     return result;
                  }
               }
            }
         },

         /**
          * Получить все настраиваемые значения компонента
          *
          * @public
          * @return {ExportPresetsResult}
          */
         getValues: function () {
            var selectedId = this._options.selectedId;
            if (selectedId) {
               var current = this._findPresetById(selectedId);
               return {
                  consumerId: selectedId,
                  fieldIds: current.fieldIds,
                  fileUuid: current.fileUuid
               };
            }
            return {};
         }
      });



      // Private methods:

      /**
       * Обернуть указанную функцию новой, которая будет вызывать исходную только при значении аргумента эквивалентном true
       *
       * @private
       * @param {function} func Оборачиваемая функция
       * @return {function}
       */
      var _ifSuccess = function (func) {
         return function (isSuccess) { if (isSuccess) { func.call(); } };
      };

      /**
       * Найти индекс элемента массива по его идентификатору
       *
       * @private
       * @param {Array<object>} list Массив объектов (имеющих свойство "id")
       * @param {string|number} id Идентификатор элемента
       * @return {number}
       */
      var _findIndexById = function (list, id) {
         if (list && list.length) {
            for (var i = 0; i < list.length; i++) {
               var o = list[i];
               if (o.id ==/*Не ===*/ id) {
                  return i;
               }
            }
         }
         return -1;
      };

      /**
       * Создать новый идентификатору
       *
       * @private
       * @return {string}
       */
      var _makeId = function () {
         return _uniqueHex(32);
      };

      /**
       * Сгенерировать случайную hex-строку указанной длины
       * @protected
       * @param {number} n Длина строки
       * @return {string}
       */
      var _uniqueHex = function(n){var l=[];for(var i=0;i<n;i++){l[i]=Math.round(15*Math.random()).toString(16)}return l.join('')};



      return View;
   }
);
