/**
 * Created by kraynovdo on 31.01.2018.
 */
define('Controls/List', [
   'Core/Control',
   'wml!Controls/List/List',
   'Controls/List/ListViewModel',
   'Core/Deferred',
   'Controls/List/ListView',
   'Controls/List/ListControl'
], function(Control,
   ListControlTpl,
   ListViewModel,
   Deferred
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
    * @mixes Controls/interface/IGroupedView
    * @mixes Controls/interface/INavigation
    * @mixes Controls/interface/IFilter
    * @mixes Controls/interface/IHighlighter
    * @mixes Controls/List/interface/IListControl
    * @mixes Controls/interface/IEditInPlace
    * @control
    * @author Авраменко А.С.
    * @public
    * @category List
    */

   var ListControl = Control.extend(/** @lends Controls/List */{
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
         this._children.listControl.reload();
      },


      /**
       * Starts editing in place.
       * @param {ItemEditOptions} options Options of editing.
       * @returns {Core/Deferred}
       */
      editItem: function(options) {
         return this._options.readOnly ? Deferred.fail() : this._children.listControl.editItem(options);
      },

      /**
       * Starts adding.
       * @param {AddItemOptions} options Options of adding.
       * @returns {Core/Deferred}
       */
      addItem: function(options) {
         return this._options.readOnly ? Deferred.fail() : this._children.listControl.addItem(options);
      },

      /**
       * Ends editing in place without saving.
       * @returns {Core/Deferred}
       */
      cancelEdit: function() {
         return this._options.readOnly ? Deferred.fail() : this._children.listControl.cancelEdit();
      },

      /**
       * Ends editing in place with saving.
       * @returns {Core/Deferred}
       */
      commitEdit: function() {
         return this._options.readOnly ? Deferred.fail() : this._children.listControl.commitEdit();
      },

      _onBeforeItemAdd: function(e, options) {
         return this._notify('beforeItemAdd', [options]);
      },

      _onBeforeItemEdit: function(e, options) {
         return this._notify('beforeItemEdit', [options]);
      },

      _onAfterItemEdit: function(e, item, isAdd) {
         this._notify('afterItemEdit', [item, isAdd]);
      },

      _onBeforeItemEndEdit: function(e, item, commit, isAdd) {
         return this._notify('beforeItemEndEdit', [item, commit, isAdd]);
      },

      _onAfterItemEndEdit: function(e, item, isAdd) {
         this._notify('afterItemEndEdit', [item, isAdd]);
      },

      _dragStart: function(event, items) {
         return this._notify('dragStart', [items]);
      },

      _dragEnd: function(event, items, target, position) {
         return this._notify('dragEnd', [items, target, position]);
      },

      _markedKeyChangedHandler: function(event, key) {
         this._notify('markedKeyChanged', [key]);
      }
   });

   ListControl.getDefaultOptions = function() {
      return {
         multiSelectVisibility: 'hidden',
         style: 'default'
      };
   };

   return ListControl;
});
