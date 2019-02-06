define('Controls/Popup/Opener/Notification',
   [
      'Controls/Popup/Opener/BaseOpener',
      'Core/helpers/isNewEnvironment'
   ],
   function(Base, isNewEnvironment) {
      /**
       * Component that opens a popup that is positioned in the lower right corner of the browser window. Multiple notification Windows can be opened at the same time. In this case, they are stacked vertically. {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/wasaby/components/openers/#_5 See more}.
       *
       * @class Controls/Popup/Opener/Notification
       * @control
       * @public
       * @author Красильников А.С.
       * @category Popup
       * @demo Controls-demo/Popup/Opener/NotificationPG
       */

      /**
       * @name Controls/Popup/Opener/Notification#className
       * @cfg {String} Class names of popup.
       */
      /**
       * @name Controls/Popup/Opener/Notification#template
       * @cfg {String|Function} Template inside popup.
       */

      /**
       * @name Controls/Popup/Opener/Notification#templateOptions
       * @cfg {String|Function} Template options inside popup.
       */


      var _private = {
         compatibleOpen: function(self, popupOptions) {
            var config = self._getConfig(popupOptions);
            require(['Controls/Popup/Compatible/BaseOpener',
               'SBIS3.CONTROLS/Utils/InformationPopupManager',
               'Controls/Popup/Compatible/OldNotification',
               config.template
            ], function(BaseOpenerCompat, InformationPopupManager) {
               InformationPopupManager.showNotification(BaseOpenerCompat.prepareNotificationConfig(config));
            });
         }
      };

      var Notification = Base.extend({

         /**
          * Open dialog popup.
          * @function Controls/Popup/Opener/Notification#open
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
            popupOptions = popupOptions || {};
            popupOptions.autofocus = false;
            // Notification windows must be above all popup windows
            // will be fixed by https://online.sbis.ru/opendoc.html?guid=e6a136fc-be49-46f3-84d5-be135fae4761
            popupOptions.zIndex = 100;

            if (isNewEnvironment()) {
               Base.prototype.open.call(this, popupOptions, 'Controls/Popup/Opener/Notification/NotificationController');
            } else {
               _private.compatibleOpen(this, popupOptions);
            }
         }
      });

      Notification.getDefaultOptions = function() {
         return {
            displayMode: 'multiple'
         };
      };

      return Notification;
   });

/**
 * @typedef {Object} PopupOptions
 * @description Sets the popup configuration.
 * @property {} autofocus Determines whether focus is set to the template when popup is opened.
 * @property {} className Class names of popup.
 * @property {} template Template inside popup.
 * @property {} templateOptions Template options inside popup.
 */

/**
 * @name Controls/Popup/Opener/Notification#close
 * @description Close popup.
 * @function
 */
/**
 * @name Controls/Popup/Opener/Notification#isOpened
 * @function
 * @description Popup opened status.
 */
