define('Controls/Input/Date/Link', [
   'Core/Control',
   'Core/core-merge',
   'Controls/interface/ILinkView',
   'Controls/Date/interface/IRangeSelectable',
   'wml!Controls/Input/Date/Link/Link',
   'css!theme?Controls/Input/Date/Link/Link'
], function(
   BaseControl,
   coreMerge,
   ILinkView,
   IRangeSelectable,
   componentTmpl
) {

   'use strict';

   /**
    * Controls that allows user to select date value in calendar.
    *
    * @class Controls/Input/Date/Link
    * @extends Core/Control
    * @mixes Controls/interface/ILinkView
    * @mixes Controls/Input/Date/interface/ILink
    * @control
    * @private
    * @category Input
    * @author Водолазских А.А.
    * @demo Controls-demo/Input/Date/Link
    *
    */

   var Component = BaseControl.extend({
      _template: componentTmpl,

      _openDialog: function(event) {
         this._children.opener.open({
            opener: this,
            target: this._container,
            className: 'controls-PeriodDialog__picker',
            isCompoundTemplate: true,
            horizontalAlign: { side: 'right' },
            corner: { horizontal: 'left' },
            eventHandlers: {
               onResult: this._onResult.bind(this)
            },
            templateOptions: {
               startValue: this._options.value,
               endValue: this._options.value,
               headerType: 'link',
               closeButtonEnabled: true,
               rangeselect: false,
               quantum: null,
               handlers: {
                  onChoose: this._onResultWS3.bind(this)
               }
            }
         });
      },
      _onResultWS3: function(event, startValue) {
         this._onResult(startValue);
      },
      _onResult: function(value) {
         this._notify('valueChanged', [value]);
         this._children.opener.close();
         this._forceUpdate();
      },
      _rangeChangedHandler: function(event, value) {
         this._notify('valueChanged', [value]);
      }
   });

   Component.EMPTY_CAPTIONS = ILinkView.EMPTY_CAPTIONS;

   Component.getDefaultOptions = function() {
      return coreMerge(coreMerge({}, IRangeSelectable.getDefaultOptions()), ILinkView.getDefaultOptions());
   };

   Component.getOptionTypes = function() {
      return coreMerge(coreMerge({}, IRangeSelectable.getOptionTypes()), ILinkView.getOptionTypes());
   };

   return Component;
});
