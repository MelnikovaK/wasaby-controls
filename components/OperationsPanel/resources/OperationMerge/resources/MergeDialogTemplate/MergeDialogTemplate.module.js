/**
 * Created by as.suhoruchkin on 02.04.2015.
 */
define('js!SBIS3.CONTROLS.MergeDialogTemplate', [
    'js!SBIS3.CORE.CompoundControl',
    'html!SBIS3.CONTROLS.MergeDialogTemplate',
    'js!SBIS3.CONTROLS.Data.Source.SbisService',
    'js!SBIS3.CONTROLS.Data.Source.Memory',
    'js!SBIS3.CONTROLS.Data.Adapter.Sbis',
    'i18n!SBIS3.CONTROLS.MergeDialogTemplate',
    'js!SBIS3.CONTROLS.Button',
    'js!SBIS3.CONTROLS.TreeDataGridView',
    'html!SBIS3.CONTROLS.MergeDialogTemplate/resources/cellNameTpl',
    'html!SBIS3.CONTROLS.MergeDialogTemplate/resources/cellCommentTpl'
], function(Control, dotTplFn, SbisServiceSource, MemorySource, SbisAdapter, rk) {

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
                 * @cfg {String} Заголовок диалог
                 */
                title: rk('Объединение наименований'),
                /**
                 * @cfg {String} Подсказка отображаемая в диалоге
                 */
                hint: rk('Выберите наименование, с которым объединятся остальные. Все основные сведения возьмутся с него.\
                       На выбранное наименование перенесутся все связанные записи (документы, отчеты). Остальные наименования будут удалены.'),
                /**
                 * @cfg {String} Сообщение с предупреждением
                 */
                warning: rk('Внимание! Операция необратима'),
                testMergeMethodName: undefined,
                queryMethodName: undefined,
                dataSource: undefined,
                hierField: undefined,
                displayField: undefined
            },
            _treeView: undefined,
            _treeViewKeys: [],
            _applyContainer: undefined,
            _loadingIndicator: undefined
        },
        $constructor: function() {
            this._container.removeClass('ws-area');
            this.subscribe('onReady', this._onReady);
        },
        addUserItemAttributes: function(row, record) {
            if (record.get(AVAILABLE_FIELD_NAME) === false) {
                row.addClass('controls-MergeDialogTemplate__notMergeAvailable');
            }
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
            this.getChildControlByName('MergeDialogTemplate-mergeButton')
                .subscribe('onActivated', this.onMergeButtonActivated.bind(this));
            this._treeView = this.getChildControlByName('MergeDialogTemplate__treeDataGridView');
            this._treeView.subscribe('onSelectedItemChange', this.onSelectedItemChange.bind(this));
            this._treeView.setGroupBy(this._treeView.getSearchGroupBy(), false);
            dataSource = new SbisServiceSource(this._options.dataSource._options);
            dataSource.setQueryMethodName(this._options.queryMethodName ? this._options.queryMethodName : this._options.dataSource.getQueryMethodName());
            this._treeView.setDataSource(dataSource, true);
            this._treeView.reload({
                'Разворот': 'С разворотом',
                'usePages': 'full',
                'mergeIds': this._options.items
            }).addCallback(function(ds) {
                //TODO: Данный костыль нужен для того, чтобы добавить в dataSet колонки, выпилить когда необходимое api появится у dataSet'а
                var rawData = ds.getRawData();
                rawData.s.push({n: COMMENT_FIELD_NAME, t: 'Строка'}, {n: AVAILABLE_FIELD_NAME, t: 'Логическое'});
                self._treeView.setFilter({});
                self._treeView.setDataSource(new MemorySource({
                    data: rawData,
                    adapter: new SbisAdapter()
                }));

                //Получим ключи всех записей которые хотим объединять.
                //Не берём папки, которые присутствуют в датасете для построения структуры.
                ds.each(function(rec) {
                    if (!rec.get(self._options.hierField + '@')) {
                        self._treeViewKeys.push(rec.getKey());
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
            this._showIndicator();
            this._options.dataSource.merge(mergeTo, mergeKeys).addBoth(function() {
                self.sendCommand('close', { mergeTo: mergeTo, mergeKeys: mergeKeys });
                self._hideIndicator();
            });
        },
        _getMergedKeys: function(withoutKey, onlyAvailable) {
            var keys = Array.clone(this._treeViewKeys);
            Array.remove(keys, keys.indexOf(withoutKey));
            if (onlyAvailable) {
                for (var i = keys.length - 1; i >= 0; i--) {
                    if (!this._treeView.getDataSet().getRecordByKey(keys[i]).get(AVAILABLE_FIELD_NAME)) {
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
                treeView = this._treeView,
                dataSet = treeView.getDataSet();
            this._showIndicator();
            this._options.dataSource.call(this._options.testMergeMethodName, {
                'target': key,
                'merged': this._getMergedKeys(key)
            }).addCallback(function (data) {
                //TODO: Данный костыль нужен для того, чтобы добавить в dataSet колонки, выпилить когда необходимое api появится у dataSet'а
                data.getAll().each(function(rec) {
                    record = dataSet.getRecordByKey(rec.getKey());
                    isAvailable = rec.get(AVAILABLE_FIELD_NAME);
                    showMergeButton = showMergeButton || isAvailable;
                    record.set(AVAILABLE_FIELD_NAME, isAvailable);
                    record.set(COMMENT_FIELD_NAME, rec.get(COMMENT_FIELD_NAME));
                }, self);
                treeView.reload();
                self._applyContainer.toggleClass('ws-hidden', !showMergeButton);
            }).addBoth(function() {
                self._hideIndicator();
            });
        },
        _showIndicator: function() {
            this._loadingIndicator = setTimeout(function () {
                $ws.helpers.toggleIndicator(true);
            }, 100);
        },
        _hideIndicator: function() {
            clearTimeout(this._loadingIndicator);
            $ws.helpers.toggleIndicator(false);
        }
    });

    return MergeDialogTemplate;
});