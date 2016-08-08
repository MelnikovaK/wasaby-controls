/**
 * Created by as.avramenko on 01.04.2015.
 */

define('js!SBIS3.CONTROLS.EditInPlace',
   [
      'js!SBIS3.CORE.CompoundControl',
      'html!SBIS3.CONTROLS.EditInPlace',
      'js!SBIS3.CORE.CompoundActiveFixMixin',
      'js!SBIS3.CONTROLS.CompoundFocusMixin',
      'js!WS.Data/Di'
   ],
   function(Control, dotTplFn, CompoundActiveFixMixin, CompoundFocusMixin, Di) {
      'use strict';

      /**
       * @class SBIS3.CONTROLS.EditInPlace
       * @extends SBIS3.CORE.CompoundControl
       * @control
       * @public
       */

      var
         CONTEXT_RECORD_FIELD = 'sbis3-controls-edit-in-place',
         EditInPlace = Control.extend([CompoundActiveFixMixin, CompoundFocusMixin], /** @lends SBIS3.CONTROLS.EditInPlace.prototype */ {
            _dotTplFn: dotTplFn,
            $protected: {
               _options: {
                  columns: [],
                  focusCatch: undefined,
                  editingTemplate: undefined,
                  applyOnFieldChange: true,
                  itemsContainer: undefined,
                  visible: false,
                  editingItem: undefined,
                  getEditorOffset: undefined
               },
               _record: undefined,
               _target: null,
               _editing: false,
               _editors: [],
               _trackerInterval: undefined,
               _lastHeight: 0,
               _editingRecord: undefined,
               _previousRecordState: undefined,
               _editingDeferred: undefined
            },
            init: function() {
               this._publish('onItemValueChanged', 'onChangeHeight', 'onBeginEdit', 'onEndEdit');
               EditInPlace.superclass.init.apply(this, arguments);
               this._container.bind('keypress keydown', this._onKeyDown);
               this.subscribe('onChildControlFocusOut', this._onChildControlFocusOut);
               this._editors = this.getContainer().find('.controls-editInPlace__editor');
               this._onRecordChangeHandler = this._onRecordChange.bind(this);
            },

            _onChildControlFocusOut: function() {
               var
                  result,
                  difference,
                  loadingIndicator;
               // Будем стрелять событие только если запущено редактирование по месту. Это обусловлено тем, что при
               // клике вне области редактирования стрельнет событие onChildFocusOut в контроллере и редактирование начнет
               // завершаться. Завершение редактирования приведет к вызову метода EditInPlace.hide, в котором происходит
               // расфокусировка поля ввода и нельзя допустить изменения рекорда и стрельбы событием onItemValueChanged.
               if (this.isEdit()) {
                  difference = this._getRecordsDifference(); // Получаем разницу
                  if (difference.length) { //Если есть разница, то нотифицируем об этом в событии
                     result = this._notify('onItemValueChanged', difference, this._editingRecord);
                     //Результат может быть деферредом (потребуется обработка на бизнес логике)
                     if (result instanceof $ws.proto.Deferred) {
                        loadingIndicator = setTimeout(function () { //Если обработка изменения значения поля длится более 100мс, то показываем индикатор
                           $ws.helpers.toggleIndicator(true);
                        }, 100);
                        this._editingDeferred = result.addBoth(function () {
                           clearTimeout(loadingIndicator);
                           this._previousRecordState = this._cloneWithFormat(this._editingRecord);
                           $ws.helpers.toggleIndicator(false);
                        }.bind(this));
                     } else {
                        this._previousRecordState = this._cloneWithFormat(this._editingRecord);
                     }
                  }
               }
            },
            /**
             * TODO Сухоручкин, Авраменко, Мальцев. Функция используется для определения изменившихся полей, скорее всего она тут не нужна (это метод рекорда)
             * @private
             */
            _getRecordsDifference: function() {
               var
                  raw1, raw2,
                  result = [];
               if ($ws.helpers.instanceOfModule(this._editingRecord, 'WS.Data/Entity/Model')) {
                  this._editingRecord.each(function(field, value) {
                     if (value != this._previousRecordState.get(field)) {
                        result.push(field);
                     }
                  }, this);
               } else {
                  raw1 = this._editingRecord.getRaw();
                  raw2 = this._previousRecordState.getRaw();
                  for (var field in raw1) {
                     if (raw1.hasOwnProperty(field)) {
                        if (raw1[field] != raw2[field]) {
                           result.push(field);
                        }
                     }
                  }
               }
               return result;
            },
            _getElementToFocus: function() {
              return this._container; //Переопределяю метод getElementToFocus для того, чтобы не создавался fake focus div
            },
            _onKeyDown: function(e) {
               e.stopPropagation();
            },
            /**
             * Заполняем значениями отображаемую editInPlace область
             * @param record Record, из которого будут браться значения полей
             */
            updateFields: function(record) {
               this._record = record;
               this._previousRecordState = this._cloneWithFormat(record);
               this._editingRecord = this._cloneWithFormat(record);
               this.getContext().setValue(CONTEXT_RECORD_FIELD, this._editingRecord);
            },
            _onRecordChange: function(event, fields) { //todo Удалить этот метод вообще в 3.7.4.100
               for (var fld in fields) {
                  if (fields.hasOwnProperty(fld)) {
                     this._editingRecord.set(fld, fields[fld]);
                  }
               }
            },
            _toggleOnRecordChangeHandler: function(toggle) {
               this._record[toggle ? 'subscribe' : 'unsubscribe']('onPropertyChange', this._onRecordChangeHandler);
            },
            canAcceptFocus: function () {
               return false;
            },
            /**
             * Сохранить значения полей области редактирования по месту
             */
            applyChanges: function() {
               this._deactivateActiveChildControl();
               this._toggleOnRecordChangeHandler(false);
               return (this._editingDeferred || $ws.proto.Deferred.success()).addCallback(function() {
                  this._record.merge(this._editingRecord);
               }.bind(this))
            },
            show: function(target, record, itemProj) {
               this.updateFields(record);
               this._toggleOnRecordChangeHandler(true);
               this.getContainer().attr('data-id', record.getId());
               if (itemProj) {
                  this.getContainer().attr('data-hash', itemProj.getHash());
               }
               this.setOffset(record);

               this.setTarget(target);
               //Строка с редакторами всегда должна быть первой в таблице, иначе если перед ней вставятся другие строки,
               //редакторы будут неверно позиционироваться, т.к. у строки с редакторами position absolute и top у неё
               //всегда равен 0, даже если она не первая. Просто перед показом, пододвинем строчку с редакторами на первое место.
               this._container.prependTo(this._options.itemsContainer);
               EditInPlace.superclass.show.apply(this, arguments);
            },
            _beginTrackHeight: function() {
               this._lastHeight = 0;
               this._trackerInterval = setInterval(this.recalculateHeight.bind(this), 50);
            },
            recalculateHeight: function() {
               var
                   newHeight = 0,
                   editorHeight;
               $.each(this._editors, function(id, editor) {
                  editorHeight = $(editor).outerHeight(true);
                  if (editorHeight > newHeight) {
                     newHeight = editorHeight;
                  }
               }.bind(this));
               if (this._lastHeight !== newHeight) {
                  this._lastHeight = newHeight;
                  this.getEditingItem().target.height(newHeight);
                  this._notify('onChangeHeight');
               }
            },
            _endTrackHeight: function() {
               clearInterval(this._trackerInterval);
               //Сбросим установленное ранее значение высоты строки
               this.getEditingItem().target.height('');
            },
            hide: function() {
               EditInPlace.superclass.hide.apply(this, arguments);
               this.getContainer().removeAttr('data-id');
               this._deactivateActiveChildControl();
               this.setActive(false);
            },
            edit: function(target, record, itemProj) {
               if (!this.isVisible()) {
                  this.show(target, record, itemProj);
               }
               this.setEditingItem(target, record);
               this._beginTrackHeight();
               this._editing = true;
               target.addClass('controls-editInPlace__editing');
               if (!this.hasActiveChildControl()) {
                  this.activateFirstControl();
               }
               this._notify('onBeginEdit');
            },
            isEdit: function() {
               return this._editing;
            },
            endEdit: function() {
               this.getContainer().removeAttr('data-id');
               this._endTrackHeight();
               this.getEditingItem().target.removeClass('controls-editInPlace__editing');
               this._editing = false;
               this.hide();
               //Возможен такой сценарий: начали добавление по месту, не заполнив данные, подтверждают добавление
               //и срабатывает валидация. Валидация помечает невалидные поля. После этого происходит отмена добавления,
               //и редакторы скрываются. При следующем начале добавления по месту редакторы будут показаны, как невалидные.
               //Так что сами принудительно очистим отметку валидации, при завершении редактирования/добавления.
               this.resetValidation();
               this._notify('onEndEdit');
            },
            setOffset: function(model) {
               var container = this.getContainer();
               if (this._options.getEditorOffset) {
                  if (!this._options.editingTemplate) {
                     container = container.children().get(this._options.ignoreFirstColumn ? 1 : 0);
                  }
                  $(container).find('.controls-editInPlace__editor').css('padding-left', this._options.getEditorOffset(model));
               }
            },
            setTarget: function(target) {
               var editorTop;
               this._target = target;
               //позиционируем редакторы
               editorTop = this._target.position().top - this._options.itemsContainer.position().top;
               $.each(this._editors, function(id, editor) {
                  $(editor).css('top', editorTop);
               });
            },
            getEditingRecord: function() {
               return this._editingRecord;
            },
            getOriginalRecord: function() {
               return this._record;
            },
            getTarget: function() {
               return this._target;
            },
            setEditingItem: function(target, model) {
               this._options.editingItem.target = target;
               this._options.editingItem.model = model;
            },
            getEditingItem: function() {
               return this._options.editingItem;
            },
            _deactivateActiveChildControl: function() {
               var activeChild = this.getActiveChildControl();
               activeChild && activeChild.setActive(false);
            },
            focusCatch: function(event) {
               if (typeof this._options.focusCatch === 'function') {
                  this._options.focusCatch(event);
               }
            },
            destroy: function() {
               this._container.unbind('keypress keydown');
               EditInPlace.superclass.destroy.call(this);
            },
            //TODO: метод нужен для того, чтобы подогнать формат рекорда под формат рекордсета.
            //Выписана задача Мальцеву, который должен убрать этот метод отсюда, и предаставить механизм выполняющий необходимую задачу.
            //https://inside.tensor.ru/opendoc.html?guid=85d18197-2094-4797-b823-5406424881e5&description=
            _cloneWithFormat: function(record, recordSet) {
               recordSet = recordSet || this.getParent()._options.dataSet;
               var
                  fieldName,
                  format,
                  clone = Di.resolve(recordSet.getModel(), {
                     'adapter': record.getAdapter(),
                     'idProperty': record.getIdProperty(),
                     'format': []
                  });
               if (recordSet && recordSet.getFormat().getCount()) {
                  format = recordSet.getFormat();
               } else {
                  format = record.getFormat();
               }
               format.each(function(field) {
                  fieldName = field.getName();
                  clone.addField(field, undefined, record.get(fieldName));
               });
               if (!record.isChanged()) {
                  clone.applyChanges();
               }
               clone.setState(record.getState());
               return clone;
            }
         });

      return EditInPlace;
   });
