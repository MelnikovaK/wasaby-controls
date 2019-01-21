define('Controls/Input/Search/Suggest',
   [
      'Core/Control',
      'wml!Controls/Input/Search/Suggest',
      'Types/entity',
      'Controls/Input/Search'
   ],
   function(Control, template, entity) {
      
      'use strict';
   
      /**
       * Search input that suggests options as you are typing.
       *
       * @class Controls/Input/Suggest
       * @extends Controls/Input/Text
       * @mixes Controls/Input/interface/ISearch
       * @mixes Controls/interface/ISource
       * @mixes Controls/interface/IFilter
       * @mixes Controls/Input/interface/ISuggest
       * @mixes Controls/interface/INavigation
       * @demo Controls-demo/Input/Search/Suggest/SuggestPG
       * @control
       * @public
       * @category Input
       */
   
   
      var Suggest = Control.extend({
         
         _template: template,
         _suggestState: false,
         
         _changeValueHandler: function(event, value) {
            this._notify('valueChanged', [value]);
         },
         
         _choose: function(event, item) {
            this.activate();
            this._notify('choose', [item]);
            this._notify('valueChanged', [item.get(this._options.displayProperty) || '']);
         },
         
         _beforeUpdate: function(newOptions) {
            if (this._options.suggestState !== newOptions.suggestState) {
               this._suggestState = newOptions.suggestState;
            }
         },
   
         _suggestStateChanged: function(event, value) {
            /**
             * Всплытие будет удалено по задаче.
             * https://online.sbis.ru/opendoc.html?guid=2dbbc7f1-2e81-4a76-89ef-4a30af713fec
             */
            this._notify('suggestStateChanged', [value], {bubbling: true});
         },
   
         _deactivated: function() {
            /**
             * Всплытие будет удалено по задаче.
             * https://online.sbis.ru/opendoc.html?guid=2dbbc7f1-2e81-4a76-89ef-4a30af713fec
             */
            this._suggestState = false;
            this._notify('suggestStateChanged', [false], {bubbling: true});
         },
   
         _searchClick: function() {
            this._notify('searchClick');
         },
         
         _resetClick: function() {
            this._notify('resetClick');
         }
         
      });
   
      Suggest.getOptionTypes = function() {
         return {
            displayProperty: entity.descriptor(String).required(),
            suggestTemplate: entity.descriptor(Object).required(),
            searchParam: entity.descriptor(String).required()
         };
      };
   
      Suggest.getDefaultOptions = function() {
         return {
            minSearchLength: 3,
            suggestState: false
         };
      };
      
      return Suggest;
   }
);
