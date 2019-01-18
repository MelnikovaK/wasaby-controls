define('Controls/Popup/Templates/Stack/StackTemplate',
   [
      'Core/Control',
      'wml!Controls/Popup/Templates/Stack/StackTemplate',
      'Core/IoC',
      'css!theme?Controls/Popup/Templates/Stack/StackTemplate'
   ],
   function(Control, template, IoC) {
      'use strict';

      var DialogTemplate = Control.extend({

         /**
          * Base template of stack panel. {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/components/openers/#template-standart See more}.
          * @class Controls/Popup/Templates/Stack/StackTemplate
          * @extends Core/Control
          * @control
          * @public
          * @category Popup
          * @author Красильников А.С.
          * @mixes Controls/Popup/Templates/Stack/StackTemplateStyles
          * @demo Controls-demo/Popup/Templates/StackTemplatePG
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#headingCaption
          * @cfg {String} Header title.
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#headingStyle
          * @cfg {String} Caption display style.
          * @variant secondary
          * @variant primary
          * @variant info
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#headerContentTemplate
          * @cfg {function|String} The content between the header and the cross closure.
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#bodyContentTemplate
          * @cfg {function|String} Main content.
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#footerContentTemplate
          * @cfg {function|String} Content at the bottom of the stack panel.
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#closeButtonVisibility
          * @cfg {Boolean} Determines whether display of the close button.
          */


         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#maximizeButtonVisibility
          * @cfg {Boolean} Determines the display maximize button.
          */

         /**
          * @name Controls/Popup/Templates/Stack/StackTemplate#closeButtonViewMode
          * @cfg {String} Close button display style.
          * @variant default
          * @variant light
          * @variant primary
          */

         _template: template,
         _beforeMount: function(options) {
            if (options.contentArea) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция contentArea, используйте bodyContentTemplate');
            }
            if (options.caption) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция caption, используйте headingCaption');
            }
            if (options.captionStyle) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция captionStyle, используйте headingStyle');
            }
            if (options.showMaximizeButton) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция showMaximizeButton, используйте maximizeButtonVisibility');
            }
            if (options.topArea) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция topArea, используйте headerContentTemplate');
            }

            if (options.bottomArea) {
               IoC.resolve('ILogger').warn('StackTemplate', 'Используется устаревшая опция bottomArea, используйте footerContentTemplate');
            }
            this._updateMaximizeButtonTitle(options.maximized);
         },

         _beforeUpdate: function(newOptions) {
            if (this._options.maximized !== newOptions.maximized) {
               this._notify('controlResize', [], { bubbling: true });
               this._updateMaximizeButtonTitle(newOptions.maximized);
            }
         },

         _updateMaximizeButtonTitle: function(maximized) {
            this._maximizeButtonTitle = maximized ? rk('Свернуть') : rk('Развернуть');
         },

         /**
          * Закрыть всплывающее окно
          * @function Controls/Popup/Templates/Stack/StackTemplate#close
          */
         close: function() {
            this._notify('close', [], { bubbling: true });
         },
         changeMaximizedState: function() {
            /**
             * @event maximized
             * Occurs when you click the expand / collapse button of the panels.
             */
            this._notify('maximized', [!this._options.maximized], { bubbling: true });
         }
      });

      DialogTemplate.getDefaultOptions = function() {
         return {
            headingStyle: 'secondary',
            closeButtonVisibility: true
         };
      };

      return DialogTemplate;
   });

/**
 * @name Controls/Popup/Templates/Stack/StackTemplate#close
 * Close popup.
 */
