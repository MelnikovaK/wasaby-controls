import Control = require('Core/Control');
import template = require('wml!Controls/_filterPopup/Panel/Lookup/Lookup');
import tmplNotify = require('Controls/Utils/tmplNotify');
import Env = require('Env/Env');
import 'Controls/lookup';
import 'css!theme?Controls/filterPopup';

/**
 * Метка с полем связи. Пока коллекция пуста - поле связи скрыто.
 * Смотрите так же <a href="/materials/demo-ws4-engine-selector-lookup">демо пример</a>.
 * @class Controls/_filterPopup/Panel/Lookup
 * @extends Core/Control
 * @mixes Controls/_interface/ILookup
 * @mixes Controls/interface/ISelectedCollection
 * @mixes Controls/interface/ISelectorDialog
 * @mixes Controls/interface/ISuggest
 * @mixes Controls/interface/ISearch
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/INavigation
 * @mixes Controls/_interface/IMultiSelectable
 * @mixes Controls/_interface/ISorting
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IInputText
 * @mixes Controls/_lookup/BaseLookupView/LookupStyles
 * @control
 * @public
 * @author Капустин И.А.
 */
/*
 * Label with a Lookup. While the collection is empty - the Lookup is hidden.
 * Here you can see <a href="/materials/demo-ws4-engine-selector-lookup">demo-example</a>.
 * @class Controls/_filterPopup/Panel/Lookup
 * @extends Core/Control
 * @mixes Controls/_interface/ILookup
 * @mixes Controls/interface/ISelectedCollection
 * @mixes Controls/interface/ISelectorDialog
 * @mixes Controls/interface/ISuggest
 * @mixes Controls/interface/ISearch
 * @mixes Controls/_interface/ISource
 * @mixes Controls/interface/IFilter
 * @mixes Controls/interface/INavigation
 * @mixes Controls/_interface/IMultiSelectable
 * @mixes Controls/_interface/ISorting
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IInputText
 * @mixes Controls/_lookup/BaseLookupView/LookupStyles
 * @control
 * @public
 * @author Kapustin I.A.
 */

/**
 * @name Controls/_filterPopup/Panel/Lookup#caption
 * @cfg {String} Caption
 */

/**
 * @name Controls/_filterPopup/Panel/Lookup#emptyText
 * @cfg {String} Текст ссылки, который отображается до первого выбора записи в контролле.
 */

/* !KONGO
 Текст ссылки, который отображается до первого выбора записи в контролле - ???
 */

/**
 * @name Controls/_filterPopup/Panel/Lookup#lookupTemplateName
 * @cfg {String} Name of the control with same interface as Lookup.
 * @default Controls/_lookup/Lookup
 * @example
 * <pre>
 *   <Controls._filterPopup.Panel.Lookup lookupTempalteName="namePace/Lookup"/>
 * </pre>
 */



var _private = {
   getLookup: function(self) {
      if (typeof self._options.lookupTemplateName === 'string') {
         return self._children.lookup;
      } else {
         Env.IoC.resolve('ILogger').error('Option "Controls/_filterPopup/Panel/Lookup:lookupTemplateName" only supports string type');
      }
   },

   getCaption: function(self, options) {
      var caption = options.caption;

      if (options.emptyText && !self._passed && !options.selectedKeys.length) {
         caption = options.emptyText;
      }

      return caption;
   }
};

var Lookup = Control.extend({
   _template: template,
   _notifyHandler: tmplNotify,
   _passed: false,
   _caption: '',

   _beforeMount: function(options) {
      this._caption = _private.getCaption(this, options);
   },

   _beforeUpdate: function(newOptions) {
      this._caption = _private.getCaption(this, newOptions);
   },

   _afterUpdate: function(oldOptions) {
      var lookup = _private.getLookup(this);

      // if the first items were selected, call resize for Lookup
      if (!oldOptions.selectedKeys.length && this._options.selectedKeys.length) {
         this._children.controlResize.start();
         lookup && lookup.activate();
      }
   },

   showSelector: function(popupOptions) {
      var lookup = _private.getLookup(this);

      return lookup && lookup.showSelector(popupOptions);
   },

   _selectedKeysChanged: function(event, keys) {
      this._passed = true;
      this._notify('selectedKeysChanged', [keys]);
   },

   // when using Utils/tmplNotify, bubbling event comes with incorrect arguments to the filter panel
   // https://online.sbis.ru/opendoc.html?guid=88fed89c-9f87-440e-8549-aa6f468f7477
   _textValueChanged: function(event, textValue) {
      this._notify('textValueChanged', [textValue]);
   }
});

Lookup._private = _private;
Lookup.getDefaultOptions = function() {
   return {
      lookupTemplateName: 'Controls/lookup:Input'
   };
};

export = Lookup;

