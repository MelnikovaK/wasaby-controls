/**
 * Created by kraynovdo on 31.01.2018.
 */
define('Controls/List', [
   'Core/Control',
   'wml!Controls/List/List',
   'Controls/List/ListViewModel',
   'Core/Deferred',
   'Controls/Utils/tmplNotify',
   'Controls/List/ListView',
   'Controls/List/ListControl'
], function(
   Control,
   ListControlTpl,
   ListViewModel,
   Deferred,
   tmplNotify
) {
   'use strict';

   /**
    * Plain list with custom item template. Can load data from data source.
    *
    * @class Controls/List
    * @extends Core/Control
    * @mixes Controls/interface/ISource
    * @mixes Controls/interface/IItemTemplate
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IGrouped
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/List/interface/IList
    * @mixes Controls/interface/IEditableList
    *
    * @mixes Controls/List/BaseControlStyles
    * @mixes Controls/List/ListStyles
    *
    * @mixes Controls/List/Mover/MoveDialog/Styles
    * @mixes Controls/List/PagingStyles
    * @mixes Controls/List/DigitButtonsStyles
    *
    * @control
    * @author Авраменко А.С.
    * @public
    * @category List
    * @demo Controls-demo/List/List/BasePG
    */

   var ListControl = Control.extend(/** @lends Controls/List.prototype */{
      _template: ListControlTpl,
      _viewName: 'Controls/List/ListView',
      _viewTemplate: 'Controls/List/ListControl',
      _viewModelConstructor: null,

      _beforeMount: function() {
         this._viewModelConstructor = this._getModelConstructor();
      },

      _getModelConstructor: function() {
         return ListViewModel;
      },

      reload: function() {
         return this._children.listControl.reload();
      },

      reloadItem: function(key, readMeta) {
         return this._children.listControl.reloadItem(key, readMeta);
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

   return ListControl;
});
