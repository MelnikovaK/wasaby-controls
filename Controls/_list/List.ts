/**
 * Created by kraynovdo on 31.01.2018.
 */
import Control = require('Core/Control');
import ListControlTpl = require('wml!Controls/_list/List');
import ListViewModel = require('Controls/_list/ListViewModel');
import Deferred = require('Core/Deferred');
import tmplNotify = require('Controls/Utils/tmplNotify');
import viewName = require('Controls/_list/ListView');
import viewTemplate = require('Controls/_list/ListControl');

/**
 * Простой список с пользовательским шаблоном элемента. Может загружать данные из источника данных.
 * Подробное описание и инструкцию по настройке контрола вы можете прочитать <a href='https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list/'>здесь</a>.
 *
 * @class Controls/_list/List
 * @extends Core/Control
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IItemTemplate
 * @mixes Controls/interface/IPromisedSelectable
 * @mixes Controls/interface/INavigation
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/IHighlighter
 * @mixes Controls/_list/interface/IList
 * @mixes Controls/interface/IEditableList
 * @mixes Controls/interface/IDraggable
 * @mixes Controls/interface/IGroupedList
 *
 * @mixes Controls/_list/interface/IVirtualScroll
 * @mixes Controls/_list/BaseControlStyles
 * @mixes Controls/_list/ListStyles
 * @mixes Controls/_list/ItemActions/ItemActionsStyles
 * @mixes Controls/_list/Swipe/SwipeStyles
 *
 * @mixes Controls/MoveDialog/Styles
 * @mixes Controls/_paging/PagingStyles
 * @mixes Controls/_paging/DigitButtonsStyles
 *
 * @control
 * @author Авраменко А.С.
 * @public
 * @category List
 * @demo Controls-demo/List/List/BasePG
 */

/*
 * Plain list with custom item template. Can load data from data source.
 * The detailed description and instructions on how to configure the control you can read <a href='https://wi.sbis.ru/doc/platform/developmentapl/interface-development/controls/list/'>here</a>.
 *
 * @class Controls/_list/List
 * @extends Core/Control
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IItemTemplate
 * @mixes Controls/interface/IPromisedSelectable
 * @mixes Controls/interface/IGroupedList
 * @mixes Controls/interface/INavigation
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/IHighlighter
 * @mixes Controls/_list/interface/IList
 * @mixes Controls/_interface/ISorting
 * @mixes Controls/interface/IEditableList
 * @mixes Controls/interface/IDraggable
 * @mixes Controls/interface/IGroupedList
 *
 * @mixes Controls/_list/interface/IVirtualScroll
 * @mixes Controls/_list/BaseControlStyles
 * @mixes Controls/_list/ListStyles
 * @mixes Controls/_list/ItemActions/ItemActionsStyles
 * @mixes Controls/_list/Swipe/SwipeStyles
 *
 * @mixes Controls/MoveDialog/Styles
 * @mixes Controls/_paging/PagingStyles
 * @mixes Controls/_paging/DigitButtonsStyles
 *
 * @control
 * @author Авраменко А.С.
 * @public
 * @category List
 * @demo Controls-demo/List/List/BasePG
 */

var ListControl = Control.extend(/** @lends Controls/_list/List.prototype */{
    _template: ListControlTpl,
    _viewName: viewName,
    _viewTemplate: viewTemplate,
    _viewModelConstructor: null,

    _theme: ['Controls/list_multi'],

    _beforeMount: function(options) {
        this._viewModelConstructor = this._getModelConstructor(options.useNewModel);
        if (options.useNewModel) {
            return import('Controls/_list/Render').then((Render) => {
                this._viewName = Render.default;
            });
        }
    },

    _getModelConstructor: function(useNewModel: boolean) {
        return !useNewModel ? ListViewModel : null;
    },

    reload: function() {
        return this._children.listControl.reload();
    },

    reloadItem: function():Deferred {
        var listControl = this._children.listControl;
        return listControl.reloadItem.apply(listControl, arguments);
    },

    scrollToItem(key: string|number, toBottom: boolean): void {
        this._children.listControl.scrollToItem(key, toBottom);
    },

    beginEdit: function(options) {
        return this._options.readOnly ? Deferred.fail() : this._children.listControl.beginEdit(options);
    },

    beginAdd: function(options) {
        return this._options.readOnly ? Deferred.fail() : this._children.listControl.beginAdd(options);
    },

    cancelEdit: function() {
        return this._options.readOnly ? Deferred.fail() : this._children.listControl.cancelEdit();
    },

    commitEdit: function() {
        return this._options.readOnly ? Deferred.fail() : this._children.listControl.commitEdit();
    },

    _notifyHandler: tmplNotify
});

ListControl.getDefaultOptions = function() {
    return {
        multiSelectVisibility: 'hidden',
        style: 'default'
    };
};

export = ListControl;
