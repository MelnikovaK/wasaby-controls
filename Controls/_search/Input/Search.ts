import entity = require('Types/entity');
import Env = require('Env/Env');
import {Base, TextViewModel as ViewModel} from 'Controls/input';
import buttonsTemplate = require('wml!Controls/_search/Input/Buttons');

/**
 * Контрол, позволяющий пользователю вводить однострочный текст.
 * Функционал идентичен полю ввода, но контрол имеет другое оформление.
 *
 * О том, как настроить поиск в списке, ипользуя контрол "input:Search", можно прочитать <a href='/doc/platform/developmentapl/interface-development/controls/filter-search/'>здесь</a>.
 *
 * <a href="/materials/demo-ws4-search-container">Демо с контролами search:Input и List</a>.
 * <a href="/materials/demo-ws4-filter-search-new">Демо с контролами filter:Selector, search:Input и List</a>.
 *
 * @class Controls/_search/Input/Search
 * @mixes Controls/interface/IInputField
 * @mixes Controls/interface/IInputText
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IPaste
 * @mixes Controls/interface/IInputPlaceholder
 * @mixes Controls/_interface/ITooltip
 *
 * @ignoreOptions style
 *
 * @control
 * @public
 * @demo Controls-demo/Input/Search/SearchPG
 *
 * @category Input
 * @author Золотова Э.Е.
 */

/*
 * Controls that allows user to enter single-line text.
 * These are functionally identical to text inputs, but may be styled differently.
 *
 * Information on searching settings in the list using the "input:Search" control you can read <a href='/doc/platform/developmentapl/interface-development/controls/filter-search/'>here</a>.
 *
 * <a href="/materials/demo-ws4-search-container">Demo with Input/Search and List control</a>.
 * <a href="/materials/demo-ws4-filter-search-new">Demo with Filter/Button, Input/Search and List control</a>.
 *
 * @class Controls/_search/Input/Search
 * @mixes Controls/interface/IInputField
 * @mixes Controls/interface/IInputText
 * @mixes Controls/interface/IInputBase
 * @mixes Controls/interface/IPaste
 * @mixes Controls/interface/IInputPlaceholder
 * @mixes Controls/_interface/ITooltip
 *
 * @ignoreOptions style
 *
 * @control
 * @public
 * @demo Controls-demo/Input/Search/SearchPG
 *
 * @category Input
 * @author Золотова Э.Е.
 */

/**
 * @name Controls/_search/Input/Search#searchButtonVisible
 * @cfg {Boolean} Определяет, показывать ли значок поиска.
 * @default true
 * @remark
 * - true — показывать;
 * - false — скрывать.
 */

/*
 * @name Controls/_search/Input/Search#searchButtonVisible
 * @cfg {Boolean} Determines whether to show the search icon.
 */

/**
 * @event Controls/_search/Input/Search#searchClick Происходит при нажатии кнопки поиска.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 */
 
/**
 * @event Controls/Input/resetClick#resetClick Происходит при нажатии кнопки reset.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 */

/*
 * @event Controls/_search/Input/Search#searchClick Occurs when search button is clicked.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Event descriptor.
 */
/*
 * @event Controls/Input/resetClick#resetClick Occurs when reset button is clicked.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Event descriptor.
 */

var _private = {
   isVisibleResetButton: function() {
      return !!this._options.value && !this._options.readOnly;
   },

   calculateStateButton: function() {
      return this._options.readOnly ? '_readOnly' : '';
   }
};

var Search = Base.extend({
   _roundBorder: true,

   _wasActionUser: false,

   get _renderStyle() {
      return 'search-';
   },

   _getViewModelOptions: function(options) {
      return {
         maxLength: options.maxLength,
         constraint: options.constraint
      };
   },

   _getViewModelConstructor: function() {
      return ViewModel;
   },

   _initProperties: function() {
      Search.superclass._initProperties.apply(this, arguments);

      var CONTROL_NAME = 'Search';
      this._field.scope.controlName = CONTROL_NAME;
      this._readOnlyField.scope.controlName = CONTROL_NAME;

      this._afterFieldWrapper.template = buttonsTemplate;
      this._afterFieldWrapper.scope.isVisibleReset = _private.isVisibleResetButton.bind(this);
      this._afterFieldWrapper.scope.calculateState = _private.calculateStateButton.bind(this);
   },

   _changeHandler: function() {
      if (this._options.trim) {
         var trimmedValue = this._viewModel.displayValue.trim();

         if (trimmedValue !== this._viewModel.displayValue) {
            this._viewModel.displayValue = trimmedValue;
            this._notifyValueChanged();
         }
      }

      Search.superclass._changeHandler.apply(this, arguments);
   },

   _resetClick: function() {
      if (this._options.readOnly) {
         return;
      }

      this._notify('resetClick');

      this._viewModel.displayValue = '';
      this._notifyValueChanged();

      // move focus from clear button to input
      this.activate();
   },

   _searchClick: function() {
      if (this._options.readOnly) {
         return;
      }

      this._notify('searchClick');

      // move focus from search button to input
      this.activate();
   },

   _keyUpHandler: function(event) {
      if (event.nativeEvent.which === Env.constants.key.enter) {
         this._searchClick();
      }

      Search.superclass._keyUpHandler.apply(this, arguments);
   },

   _inputHandler: function() {
      Search.superclass._inputHandler.apply(this, arguments);

      this._wasActionUser = true;
   },

   _clickHandler: function() {
      Search.superclass._clickHandler.apply(this, arguments);

      this._wasActionUser = true;
   }
});

Search._theme = Base._theme.concat(['Controls/search']);

Search.getOptionTypes = function getOptionsTypes() {
   var optionTypes = Base.getOptionTypes();

   optionTypes.maxLength = entity.descriptor(Number, null);
   optionTypes.trim = entity.descriptor(Boolean);
   optionTypes.constraint = entity.descriptor(String);

   return optionTypes;
};

Search.getDefaultOptions = function getDefaultOptions() {
   var defaultOptions = Base.getDefaultOptions();

   defaultOptions.value = '';
   defaultOptions.trim = false;
   defaultOptions.placeholder = rk('Найти') + '...';
   defaultOptions.searchButtonVisible = true;

   return defaultOptions;
};

Search._private = _private;

export = Search;

