define('js!SBIS3.CONTROLS.Utils.InformationPopupManager',
   [
   "Core/core-merge",
   "js!SBIS3.CONTROLS.SubmitPopup",
   "js!SBIS3.CONTROLS.NotificationPopup",
   "browser!js!SBIS3.CONTROLS.Utils.NotificationStackManager"
],

   /**
    * Класс интерфейса для работы с нотификационными уведомлениями (см. {@link SBIS3.CONTROLS.NotificationPopup}) и окнами (см. {@link SBIS3.CONTROLS.SubmitPopup}).
    * С помощью класса возможно инициировать отображение уведомления и управление их расположением друг относительно друга в случае, если одновременно отображается больше одного уведомления.
    * Содержит функции для показа информационных окон и нотификационных уведомелений в области уведомлений.
    * Всплывающие уведомления отображаются в нижнем правом углу друг над другом и пропадают сами спустя 5 секунд.
    * <br/>
    * Для вызова уведомлений и окон используйте методы showConfirmDialog, showMessageDialog, showNotification и showCustomNotification.
    * <br/>
    * <b>Пример.</b> В компоненте подключен класс "SBIS3.CONTROLS.Utils.InformationPopupManager" и импортирован в переменную "InformationPopupManager".
    * Производится вызов диалога с кнопками "Да", "Нет" и "Отмена".
    * <pre>
    *    InformationPopupManager.showConfirmDialog({
    *       message: 'Сохранить изменения?',
    *       details: 'Чтобы продолжить редактирование нажмите, «Отмена».',
    *       opener: self
    *    });
    * </pre>
    * @class SBIS3.CONTROLS.Utils.InformationPopupManager
    * @author Степин Павел Владимирович
    * @public
    */
   function( cMerge,SubmitPopup, NotificationPopup, NotificationManager){
      'use strict';

      var showSubmitDialog = function(config, positiveHandler, negativeHandler, cancelHandler){
         if (config.message && config.status === 'error') {
            config.message = config.message.toString().replace('Error: ', '');
         }
         var popup = new SubmitPopup(cMerge(config, {
            element: $('<div></div>'),
            isModal: true
         }));

         popup.subscribeOnceTo(popup, 'onChoose', function(e, res){
            var handler;
            switch(res){
               case true: handler = positiveHandler; break;
               case false: handler = negativeHandler; break;
               default: handler = cancelHandler; break;
            }

            if(handler && typeof handler === 'function'){
               handler();
            }
         });

         popup.show();
         popup.setActive(true);
         return popup;
      };

      return /** @lends SBIS3.CONTROLS.Utils.InformationPopupManager.prototype */{
         /**
          * Открывает диалог с кнопками "Да", "Нет" и "Отмена" (опционально от опции {@link SBIS3.CONTROLS.SubmitPopup#status}).
          * @param {Object} Объект конфигурацией открываемого диалога - {@link SBIS3.CONTROLS.SubmitPopup}.
          * @param {Function} positiveHandler Обработчик нажатия на кнопку "Да".
          * @param {Function} negativeHandler Обработчик нажатия на кнопку "Нет".
          * @param {Function} [cancelHandler] Обработчик нажатия на кнопку "Отмена".
          * @returns {SBIS3.CONTROLS.SubmitPopup} Экземпляр класса диалога.
          * @example
          * <pre>
          * InformationPopupManager.showConfirmDialog(
          *    {
          *       message: 'Сохранить изменения?',
          *       details: 'Чтобы продолжить редактирование нажмите, «Отмена».',
          *       opener: self
          *    },
          *    myPositiveHandler, myNegativeHandler
          * );
          * </pre>
          * @see showMessageDialog
          * @see showNotification
          * @see showCustomNotification
          */
         showConfirmDialog: function(config, positiveHandler, negativeHandler, cancelHandler){
            return showSubmitDialog(cMerge(config, {
               status: 'confirm'
            }), positiveHandler, negativeHandler, cancelHandler);
         },

         /**
          * Открывает диалог с сообщением и одной кнопкой "Ок". Диалог может находиться в одном из трёх состояний: "Ошибка" , "Успешно" или "Предупреждение".
          * @param {Object} Объект конфигурацией открываемого диалога - {@link SBIS3.CONTROLS.SubmitPopup}.
          * @param {Function} handler Обработчик нажатия на кнопку "Ок".
          * @returns {SBIS3.CONTROLS.SubmitPopup} Экземпляр класса диалога.
          * @example
          * <pre>
          * InformationPopupManager.showMessageDialog(
          *    {
          *       message: 'Изменения были сохранены',
          *       opener: self
          *    },
          *    myOkHandler
          * );
          * </pre>
          * @see showConfirmDialog
          * @see showNotification
          * @see showCustomNotification
          */
         showMessageDialog: function(config, handler){
            return showSubmitDialog(config, null, null, handler);
         },

         /**
          * Открывает нотификационное сообщение.
          * @param {Object} Объект конфигурацией открываемого окна - {@link SBIS3.CONTROLS.NotificationPopup}.
          * @param {Boolean} notHide true - не скрывать окно по истичению времени жизни.
          * @returns {SBIS3.CONTROLS.NotificationPopup} Экземпляр класса окна нотификационного сообщения.
          * @example
          * <pre>
          * InformationPopupManager.showNotification(
          *    {
          *       icon: 'icon-24 icon-Chat icon-primary',
          *       caption: 'Новое уведомление',
          *       bodyTemplate: myTpl,
          *       opener: self
          *    },
          *    true
          * );
          * </pre>
          * @see showCustomNotification
          * @see showConfirmDialog
          * @see showMessageDialog
          */
         showNotification: function(config, notHide){
            var popup = new NotificationPopup(cMerge({
               element: $('<div></div>')
            }, config));

            NotificationManager.showNotification(popup, notHide);

            return popup;
         },

         /**
          * Открывает произвольное нотификационное сообщение.
          * @param {SBIS3.CONTROLS.PopupMixin|*} inst Экземпляр класса окна. Это может быть любое окно, созданное на основе указанного миксина.
          * @param {Boolean} notHide true - не скрывать окно по истичению времени жизни.
          * @see showNotification
          * @see showConfirmDialog
          * @see showMessageDialog
          */
         showCustomNotification: function(inst, notHide){
            NotificationManager.showNotification(inst, notHide);
            return inst;
         }
      };
   }
);