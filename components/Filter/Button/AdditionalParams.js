/**
 * Created by am.gerasimov on 01.07.2016.
 */
define('SBIS3.CONTROLS/Filter/Button/AdditionalParams',
    [
   "Core/CommandDispatcher",
   "Lib/Control/CompoundControl/CompoundControl",
   "tmpl!SBIS3.CONTROLS/Filter/Button/AdditionalParams/AdditionalFilterParams",
   "SBIS3.CONTROLS/Commands/CommandsSeparator"
],
    function( CommandDispatcher,CompoundControl, dotTpl) {

       'use strict';

       var MAX_TEMPLATE_HEIGHT = 120;

       /**
        * Контрол, отображающий блок с набираемыми фильтрами в кнопке фильтров
        * @class SBIS3.CONTROLS/Filter/Button/AdditionalParams
        * @extends Lib/Control/CompoundControl/CompoundControl
        */

       var FilterHistory = CompoundControl.extend([], /** @lends SBIS3.CONTROLS/Filter/Button/AdditionalParams.prototype */ {
          _dotTplFn : dotTpl,
          $protected: {
             _options: {
                template: null
             },
             _templateContainer: null,
             _toggleButton: null
          },

          $constructor: function() {
             
             this._templateContainer = this._container.find('.controls-filterButton__additionalFilterParams-content');
             CommandDispatcher.declareCommand(this, 'toggleAdditionalFilterParams', this.toggleAdditionalFiltersBlock);

             this.once('onInit', function() {
                this._toggleButton = this.getChildControlByName('toggleAdditionalFilterParams');
             });
             this.subscribeTo(this, 'onAfterVisibilityChange', function(event, visibility) {
                if (visibility) {
                   this._onResizeHandler();
                }
             });
          },

          toggleAdditionalFiltersBlock: function(event) {
             var wrapper = this._container.find('.controls-filterButton__footerAreas-wrapper'),
                 hasMaxHeight = wrapper.hasClass('controls-filterButton__footerAreas-maxHeight');

             wrapper.toggleClass('controls-filterButton__footerAreas-maxHeight');
             this._toggleButton.setChecked(hasMaxHeight);
          },

          _onResizeHandler: function() {
             if(this._toggleButton) {
                this._toggleButton.toggle(MAX_TEMPLATE_HEIGHT < this._templateContainer[0].offsetHeight);
             }
          }

       });

       return FilterHistory;

    });