define('js!SBIS3.CONTROLS.SubmitPopup', [
      'js!SBIS3.CONTROLS.InformationPopup',
      'html!SBIS3.CONTROLS.SubmitPopup/resources/template',
      'js!SBIS3.CONTROLS.Button',
      'js!SBIS3.CONTROLS.Link'
   ],

   /**
    * Информационное окно.
    * В зависимости от состояния, может быть диалогом подтверждения, с кнопками "Да", "Нет" и (опционально) "Отмена",
    * или диалогом с кнопкой "Ок".
    * @class SBIS3.CONTROLS.SubmitPopup
    * @extends SBIS3.CONTROLS.InformationPopup
    * @control
    * @public
    * @author Степин П.В.
    */
   function(InformationPopup, template){
      'use strict';

      var SubmitPopup = InformationPopup.extend(/** @lends SBIS3.CONTROLS.SubmitPopup.prototype */ {
         /**
          * @typedef {String} SubmitPopupStatus
          * @variant confirm  Диалог подтверждения. Имеет кнопки "Да", "Нет" и (опционально) "Отмена". Цвет диалога - синий.
          * @variant default  "По умолчанию". Имеет кнопку "ОК". Цвет диалога - синий.
          * @variant success  "Успешно". Имеет кнопку "ОК". Цвет диалога - зеленый.
          * @variant error    "Ошибка". Имеет кнопку "ОК". Цвет диалога - красный.
          */

         /**
          * @typedef {Boolean|undefined} ChosenStatus
          * @variant true Нажата кнопка "Да"
          * @variant false Нажата кнопка "Нет"
          * @variant undefined Нажата кнопка "ОК" или "Отмена"
          */
         /**
          * @event onChoose Событие нажатия на кнопку в окне.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {ChosenStatus} Вариант диалога, выбранный нажатием соответствующей кнопки
          * @variant
          */

         /**
          * @typedef {Object} ButtonConfig
          * @property {Boolean} isLink Показать кнопку ссылку вместо обычной кнопки
          * @property {String} caption Текст кнопки.
          */
         $protected: {
            _options: {

               /**
                * @cfg {SubmitPopupStatus} Состояние диалога. От состояния заивисит цвет линии в шапке и набор кнопок.
                */
               status: 'default',
               /**
                * @cfg {String} Отображаемое сообщение.
                */
               message: '',

               /**
                * @cfg {String} Детали сообщения, отображаются под основным сообщением.
                */
               details: '',
               
               /**
                * @cfg {ButtonConfig} Настройки кнопки подтверждения. Применяется для диалогов со статусом confirm.
                */
               positiveButton: {
                  caption: rk('Да'),
                  isLink: false
               },

               /**
                * @cfg {ButtonConfig} Настройки кнопки отрицания. Применяется для диалогов со статусом confirm.
                */
               negativeButton: {
                  caption: rk('Нет'),
                  isLink: false
               },

               /**
                * @cfg {ButtonConfig} Настройки кнопки отмены. Применяется для диалогов со статусом confirm.
                */
               cancelButton: {
                  caption: rk('Отмена'),
                  isLink: false
               },

               /**
                * @cfg {ButtonConfig} Настройки кнопки подтверждения. Применяется для диалогов со статусом default, success  и error.
                */
               submitButton: {
                  caption: rk('ОК'),
                  isLink: false
               },

               /**
                * @cfg {Boolean} Использовать ли кнопку Отмена. Опция актуальна только для окна подтверждения.
                */
               hasCancelButton: false,

               /**
                * @cfg {Function} Шаблон для сообщения
                */
               messageTemplate: null,

               /**
                * @cfg {Function} Шаблон для деталей, отображается под основным сообщением
                */
               detailsTemplate: null,

               /*
                * @noShow
                */
               template: template,

               isModal: true
            },

            _buttons: []
         },
         $constructor : function(){
            this._publish('onChoose');
         },

         init : function() {
            SubmitPopup.superclass.init.call(this);

            var self = this;

            if(this._options.status === 'confirm'){
               this._registerButton(this.getChildControlByName('positiveButton'), true);
               this._registerButton(this.getChildControlByName('negativeButton'), false);

               if(this._options.hasCancelButton){
                  this._registerButton(this.getChildControlByName('cancelButton'));
               }
            }
            else {
               this._registerButton(this.getChildControlByName('okButton'));
            }

            //По esc закрываем диалог. Кидаем событие со значением undefined.
            this.subscribe('onKeyPressed', function(e, event){
               if(event.which === $ws._const.key.esc){
                  self._choose();
               }
            });
         },

         /*
          * @private
          */
         _choose: function(value){
            this._notify('onChoose', value);
            this.close();
         },

         _switchButton: function(index, next){
            var newActiveButtonIndex = (index + (next ? 1 : -1) + this._buttons.length) % this._buttons.length;
            this._buttons[newActiveButtonIndex].setActive(true);
         },

         _registerButton: function(inst, eventValue){
            var self = this;
            var index = this._buttons.length;

            this._buttons.push(inst);

            this.subscribeTo(inst, 'onActivated', function(){
               self._choose(eventValue);
            });

            this.subscribeTo(inst, 'onKeyPressed', function(e, event){
               switch(event.which){
                  case $ws._const.key.left: self._switchButton(index, false); break;
                  case $ws._const.key.right: self._switchButton(index, true); break;
               }
            });
         }
      });
      return SubmitPopup;
   }
);