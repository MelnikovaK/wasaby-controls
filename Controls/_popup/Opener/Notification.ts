import Base = require('Controls/_popup/Opener/BaseOpener');
import isNewEnvironment = require('Core/helpers/isNewEnvironment');
import Env = require('Env/Env');
import {parse as load} from 'Core/library';

      /**
       * Component that opens a popup that is positioned in the lower right corner of the browser window. Multiple notification Windows can be opened at the same time. In this case, they are stacked vertically. {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/components/openers/#_5 See more}.
       *
       * <a href="/materials/demo-ws4-notification">Demo-example</a>.
       * @class Controls/_popup/Opener/Notification
       * @control
       * @public
       * @author Красильников А.С.
       * @category Popup
       * @demo Controls-demo/Popup/Opener/NotificationPG
       */

      /**
       * @name Controls/_popup/Opener/Notification#className
       * @cfg {String} Class names of popup.
       */
      /**
       * @name Controls/_popup/Opener/Notification#template
       * @cfg {String|Function} Template inside popup.
       */

      /**
       * @name Controls/_popup/Opener/Notification#templateOptions
       * @cfg {String|Function} Template options inside popup.
       */


      var _private = {
         compatibleOpen: function(self, popupOptions) {
            const config = self._getConfig(popupOptions);
            Promise.all([
                self._requireModule('Controls/Popup/Compatible/BaseOpener'),
                self._requireModule('SBIS3.CONTROLS/Utils/InformationPopupManager'),
                self._requireModule('Controls/Popup/Compatible/OldNotification'),
                self._requireModule(config.template)
            ]).then(function(results) {
                const BaseOpenerCompat = results[0], InformationPopupManager = results[1];
                config.template = results[3];
                const compatibleConfig = _private.getCompatibleConfig(BaseOpenerCompat, config);
                if (!self._popup) {
                    self._popup = [];
                }
                self._popup.push(InformationPopupManager.showNotification(compatibleConfig, compatibleConfig.notHide));
            });
         },

         _requireModule: function(module) {
            return typeof module === 'string' ? load(module) : Promise.resolve(module);
         },

         getCompatibleConfig: function(BaseOpenerCompat, config) {
            var cfg = BaseOpenerCompat.prepareNotificationConfig(config);
            cfg.notHide = !cfg.autoClose;
            return cfg;
         },

         compatibleClose: function(self) {
            // Close popup on old page
            if (!isNewEnvironment()) {
               if (self._popup) {
                  for (var i = 0; i < self._popup.length; i++) {
                     self._popup[i].close();
                  }
                  self._popup = [];
               }
            }
         }
      };

      var Notification = Base.extend({

         /**
          * Open dialog popup.
          * @function Controls/_popup/Opener/Notification#open
          * @param {PopupOptions[]} popupOptions Notification popup options.
          * @returns {Undefined}
          * @example
          * wml
          * <pre>
          *    <Controls.Popup.Opener.Notification name="notificationOpener">
          *       <ws:popupOptions template="wml!Controls/Template/NotificationTemplate">
          *       </ws:popupOptions>
          *    </Controls.Popup.Opener.Notification>
          *
          *    <Controls.Button name="openNotificationButton" caption="open notification" on:click="_open()"/>
          * </pre>
          * js
          * <pre>
          *   Control.extend({
          *      ...
          *       _open() {
          *          var popupOptions = {
          *              templateOptions: {
          *                 style: "done",
          *                 text: "Message was send",
          *                 icon: "Admin"
          *              }
          *          }
          *          this._children.notificationOpener.open(popupOptions)
          *      }
          *      ...
          *   });
          * </pre>
          * @see close
          */
         open: function(popupOptions) {
            return new Promise((resolve) => {
                if (isNewEnvironment()) {
                    Base.prototype.open.call(this, this._preparePopupOptions(popupOptions), 'Controls/popupTemplate:NotificationController')
                        .then(popupId => resolve(popupId));
                } else {
                    _private.compatibleOpen(this, popupOptions);
                    resolve();
                }
            });
         },
         close: function() {
            Notification.superclass.close.apply(this, arguments);
            _private.compatibleClose(this);
         },

         _preparePopupOptions: function(popupOptions) {
            if (popupOptions && popupOptions.templateOptions && popupOptions.templateOptions.hasOwnProperty('autoClose')) {
               Env.IoC.resolve('ILogger').warn(this._moduleName, 'The option "autoClose" must be specified on control options');
               popupOptions.autoClose = popupOptions.templateOptions.autoClose;
            }
            if (this._options.templateOptions && this._options.templateOptions.hasOwnProperty('autoClose')) {
               Env.IoC.resolve('ILogger').warn(this._moduleName, 'The option "autoClose" must be specified on control options');
               this._options.autoClose = this._options.templateOptions.autoClose;
            }
            return popupOptions;
         }
      });

      Notification.getDefaultOptions = function() {
         return {
            autofocus: false,
            displayMode: 'multiple',
            autoClose: true
         };
      };

      Notification._private = _private;

      export = Notification;


/**
 * @typedef {Object} PopupOptions
 * @description Sets the popup configuration.
 * @property {} autofocus Determines whether focus is set to the template when popup is opened.
 * @property {} className Class names of popup.
 * @property {} template Template inside popup.
 * @property {} templateOptions Template options inside popup.
 */

/**
 * @name Controls/_popup/Opener/Notification#close
 * @description Close popup.
 * @function
 */
/**
 * @name Controls/_popup/Opener/Notification#isOpened
 * @function
 * @description Popup opened status.
 */
