define('Controls/Popup/Opener/Dialog',
   [
      'Controls/Popup/Opener/BaseOpener',
      'Controls/Popup/Opener/Dialog/DialogController'

   ],
   function (Base, Strategy) {
      /**
       * Действие открытия окна
       * @class Controls/Popup/Opener/Dialog
       * @control
       * @public
       * @category Popup
       * @extends Controls/Popup/Opener/Base
       */
      var Dialog = Base.extend({
         /**
          * Открыть диалоговое окно
          * @function Controls/Popup/Opener/Dialog#open
          * @param config конфигурация попапа
          */
         open: function(config){
            Base.prototype.open.call(this, config, Strategy);
         }
      });

      return Dialog;
   }
);