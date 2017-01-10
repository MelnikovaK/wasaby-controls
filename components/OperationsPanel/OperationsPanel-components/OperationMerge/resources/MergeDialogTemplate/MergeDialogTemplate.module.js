/**
 * Created by as.suhoruchkin on 02.04.2015.
 */
define('js!SBIS3.CONTROLS.MergeDialogTemplate', [
   "Core/CommandDispatcher",
   "js!SBIS3.CORE.CompoundControl",
   "html!SBIS3.CONTROLS.MergeDialogTemplate",
   "js!WS.Data/Source/SbisService",
   "js!WS.Data/Source/Memory",
   "js!WS.Data/Adapter/Sbis",
   "js!WS.Data/Collection/RecordSet",
   "Core/helpers/fast-control-helpers",
   "i18n!SBIS3.CONTROLS.MergeDialogTemplate",
   "js!SBIS3.CONTROLS.Button",
   "js!SBIS3.CONTROLS.TreeDataGridView",
   "html!SBIS3.CONTROLS.MergeDialogTemplate/resources/cellRadioButtonTpl",
   "html!SBIS3.CONTROLS.MergeDialogTemplate/resources/cellCommentTpl",
   "html!SBIS3.CONTROLS.MergeDialogTemplate/resources/cellTitleTpl",
   "html!SBIS3.CONTROLS.MergeDialogTemplate/resources/rowTpl",
   "i18n!!SBIS3.CONTROLS.MergeDialogTemplate",
   'css!SBIS3.CONTROLS.MergeDialogTemplate'
], function( CommandDispatcher,Control, dotTplFn, SbisServiceSource, MemorySource, SbisAdapter, RecordSet, fcHelpers) {

    var COMMENT_FIELD_NAME = 'Comment',
        AVAILABLE_FIELD_NAME = 'Available';

    var MergeDialogTemplate = Control.extend({
        _dotTplFn: dotTplFn,

        $protected: {
            _options: {
                name: 'controls-MergeDialogTemplate',
                width: 760,
                resizable: false,
                /**
                 * @cfg {String} Подсказка отображаемая в диалоге
                 */
                hint: rk('Выберите наименование, с которым объединятся остальные. Все основные сведения возьмутся с него.\
                       На выбранное наименование перенесутся все связанные записи (документы, отчеты). Остальные наименования будут удалены.'),
                /**
                 * @cfg {String} Сообщение с предупреждением
                 */
                warning: rk('Внимание! Операция необратима'),
                errorMessage: rk('Итоги операции: "Объединения"'),
                testMergeMethodName: undefined,
                queryMethodName: undefined,
                dataSource: undefined,
                parentProperty: undefined,
                nodeProperty: undefined,
                displayProperty: undefined,
                titleCellTemplate: undefined
            },
            _treeView: undefined,
            _treeViewKeys: [],
            _applyContainer: undefined
        },
        $constructor: function() {
            this._container.removeClass('ws-area');
            this.subscribe('onReady', this._onReady);
            CommandDispatcher.declareCommand(this, 'beginMerge', this.onMergeButtonActivated);
        },
        onSearchPathClick: function(event) {
            //Откажемся от перехода по хлебным крошкам
            event.setResult(false);
        },
        _onReady: function() {
            var
                dataSource,
                self = this;
            this._applyContainer = this.getContainer().find('.controls-MergeDialogTemplate__applyBlock');
            this._treeView = this.getChildControlByName('MergeDialogTemplate__treeDataGridView');
            this._treeView.subscribe('onSelectedItemChange', this.onSelectedItemChange.bind(this));
            //this._treeView.setGroupBy(this._treeView.getSearchGroupBy(), false);
            dataSource = new SbisServiceSource(this._options.dataSource._options);
            dataSource.getBinding().query = this._options.queryMethodName ? this._options.queryMethodName : this._options.dataSource.getBinding().query;
            this._treeView.setDataSource(dataSource, true);
            this._treeView.reload({
                'Разворот': 'С разворотом',
                'usePages': 'full',
                'mergeIds': this._options.items
            }).addCallback(function(recordSet) {
                //Добавим колонки с полями доступности объединения и комментарием
                recordSet.addField({name: COMMENT_FIELD_NAME, type: 'string'});
                recordSet.addField({name: AVAILABLE_FIELD_NAME, type: 'boolean'});

                //Получим ключи всех записей которые хотим объединять.
                //Не берём папки, которые присутствуют в датасете для построения структуры.
                recordSet.each(function(rec) {
                    if (!rec.get(self._options.parentProperty + '@')) {
                        self._treeViewKeys.push(rec.getId());
                    }
                });
                //TODO: пока таким образом установит выбранное значение, иначе не стрельнёт onSelectedItemChange
                if (self._options.selectedKey) {
                    self._treeView.setSelectedKey(self._options.selectedKey);
                }
            });
        },
        onMergeButtonActivated: function() {
            var self = this,
                mergeTo = this._treeView.getSelectedKey(),
                mergeKeys = this._getMergedKeys(mergeTo, true);
            this._treeView._toggleIndicator(true);
            this._options.dataSource.merge(mergeTo, mergeKeys).addErrback(function(errors) {
                self._showErrorDialog(mergeKeys, errors);
            }).addBoth(function(result) {
                self.sendCommand('close', { mergeTo: mergeTo, mergeKeys: mergeKeys, mergeResult: result });
            });
        },
        _showErrorDialog: function(mergeKeys, error) {
            var
                errorsTexts = [],
                count = mergeKeys.length;
            if (error.addinfo) {
                new RecordSet({
                    rawData: error.addinfo,
                    adapter: 'adapter.sbis'
                }).each(function(item) {
                    errorsTexts.push(item.get('error'));
                });
            } else {
                errorsTexts = [error.message];
            }
            fcHelpers.openErrorsReportDialog({
                'numSelected': count,
                'numSuccess': count - errorsTexts.length,
                'errors': errorsTexts,
                'title': this._options.errorMessage
            });
        },
        _getMergedKeys: function(withoutKey, onlyAvailable) {
            var keys = Array.clone(this._treeViewKeys);
            Array.remove(keys, keys.indexOf(withoutKey));
            if (onlyAvailable) {
                for (var i = keys.length - 1; i >= 0; i--) {
                    if (!this._treeView.getDataSet().getRecordById(keys[i]).get(AVAILABLE_FIELD_NAME)) {
                        Array.remove(keys, i);
                    }
                }
            }
            return keys;
        },
        onSelectedItemChange: function(event, key) {
            var
                record,
                self = this,
                isAvailable,
                showMergeButton,
               idProperty = this._options.idProperty,
                items = this._treeView.getItems();
            this._treeView._toggleIndicator(true);
            this._options.dataSource.call(this._options.testMergeMethodName, {
                'target': key,
                'merged': this._getMergedKeys(key)
            }).addCallback(function (data) {
                data.getAll().each(function(rec) {
                    record = items.getRecordById(rec.get(idProperty));
                    if (rec.get(idProperty) == key) {
                        isAvailable = true;
                    } else {
                        isAvailable = rec.get(AVAILABLE_FIELD_NAME);
                        showMergeButton = showMergeButton || isAvailable;
                    }
                    record.set(AVAILABLE_FIELD_NAME, isAvailable);
                    record.set(COMMENT_FIELD_NAME, rec.get(COMMENT_FIELD_NAME));
                }, self);
                self._applyContainer.toggleClass('ws-hidden', !showMergeButton);
            }).addBoth(function() {
                self._treeView._toggleIndicator(false);
            });
        }
    });

    return MergeDialogTemplate;
});