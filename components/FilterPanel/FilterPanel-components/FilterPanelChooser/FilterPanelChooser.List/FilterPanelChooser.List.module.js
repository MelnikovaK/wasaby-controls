define('js!SBIS3.CONTROLS.FilterPanelChooser.List', [
    'js!SBIS3.CONTROLS.FilterPanelChooser.BaseList',
    'Core/core-instance',
    'Core/core-functions',
    'Core/CommandDispatcher',
    'Core/helpers/collection-helpers',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser.List',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser.List/resources/ItemTpl',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser.List/resources/FilterPanelChooserList',
    'tmpl!SBIS3.CONTROLS.FilterPanelChooser.List/resources/FilterPanelChooserListFooter',
    'js!SBIS3.CONTROLS.Link',
    'js!SBIS3.CONTROLS.ListView'
], function(FilterPanelChooserBaseList, cInstance, cFunctions, CommandDispatcher, colHelpers, dotTplFn, itemTpl, chooserTpl, footerTpl) {
    var
        //TODO: выписана задача https://inside.tensor.ru/opendoc.html?guid=62947517-9859-4291-a899-42bacf350341 по которой
        //будет предоставлен функционал фильтрации на уровне проекции с учётом сортировки, и перебитие приватной опции
        //_getRecordsForRedraw у ListView можно будет удалить.
        getRecordsForRedraw = function(projection, cfg) {
            var records = cfg._getRecordsForRedrawSt.apply(this, arguments);
            if (cfg._showFullList === false) {
                records = records.slice(0, 3);
            }
            return records;
        },
        itemsSortMethod = function(first, second) {
            return second.collectionItem.get('count') - first.collectionItem.get('count');
        };
    'use strict';

    /**
     * Класс редактора "Список".
     * Применяется для панели фильтрации (см. {@link SBIS3.CONTROLS.OperationsPanel/FilterPanelItem.typedef FilterPanelItem}).
     * <br/>
     * Реализует выборку идентификаторов из списка {@link SBIS3.CONTROLS.ListView}.
     * <br/>
     * По умолчанию отображаются только 3 записи списка.
     * Чтобы подгрузить все записи, используют кнопку "Все", которая расположена под списком, или команду {@link showFullList}.
     * Шаблон кнопки "Все" устанавливают в опции {@link afterChooserWrapper}. При использовании шаблона по умолчанию, вы можете изменить подпись на кнопке через опцию {@link captionFullList}.
     * <br/>
     * @class SBIS3.CONTROLS.FilterPanelChooser.List
     * @extends SBIS3.CONTROLS.FilterPanelChooser.Base
     * @author Сухоручкин Андрей Сергеевич
     * @public
     *
     * @demo SBIS3.CONTROLS.Demo.MyFilterView
     */

    var FilterPanelChooserList = FilterPanelChooserBaseList.extend( /** @lends SBIS3.CONTROLS.FilterPanelChooser.List.prototype */ {
        _dotTplFn: dotTplFn,
        $protected: {
            _options: {
                _itemTpl: itemTpl,
                _chooserTemplate: chooserTpl,
                _afterChooserWrapper: footerTpl,
                /**
                 * @cfg {String} Устанавливает текст, отображаемый на кнопке под списком.
                 */
                captionFullList: 'Все',
                /**
                 * @cfg {String} Устанавливает поле, в котором лежит количественное значения наименования.
                 */
                countField: 'count'
            },
            _allButton: undefined
        },

        $constructor: function() {
            CommandDispatcher.declareCommand(this, 'showFullList', this._toggleFullState.bind(this));
        },

        _prepareProperties: function() {
            var opts = FilterPanelChooserList.superclass._prepareProperties.apply(this, arguments);
            return cFunctions.merge(opts, {
                itemsSortMethod: itemsSortMethod,
                _getRecordsForRedraw: getRecordsForRedraw,
                _showFullList: false
            });
        },

        _updateView: function() {
            FilterPanelChooserList.superclass._updateView.apply(this, arguments);
            this._toggleAllButton();
        },
        /**
         * Инициирует подгрузку всех записей списка.
         * @param {Boolean} toggle
         * @command showFullList
         */
        _toggleFullState: function(toggle) {
            this._getListView()._options._showFullList = toggle;
            this._getListView().redraw();
            this._toggleAllButton(toggle);
        },

        _toggleAllButton: function(toggle) {
            //Скрываем кнопку если показываются все записи (toggle = true) или показываем не все записи, но их меньше 4
            this._getAllButton().toggle(!(toggle || this._getListView().getItems().getCount() < 4));
        },

        _getAllButton: function() {
            if (!this._allButton) {
                this._allButton = this.getChildControlByName('controls-FilterPanelChooser__allButton');
            }
            return this._allButton;
        }
    });
    return FilterPanelChooserList;

});
