define('SBIS3.CONTROLS/LongOperations/Popup',
   [
      "Core/UserInfo",
      'Core/Deferred',
      'Core/EventBus',
      'Lib/TabMessage/TabMessage',
      "SBIS3.CONTROLS/NotificationPopup",
      'SBIS3.CONTROLS/LongOperations/Entry',
      "tmpl!SBIS3.CONTROLS/LongOperations/Popup/resources/headerTemplate",
      "tmpl!SBIS3.CONTROLS/LongOperations/Popup/resources/contentTemplate",
      "tmpl!SBIS3.CONTROLS/LongOperations/Popup/resources/footerTemplate",
      "Lib/Control/FloatArea/FloatArea",
      "css!SBIS3.CONTROLS/LongOperations/Popup/LongOperationsPopup"
   ],
   function (UserInfo, Deferred, EventBus, TabMessage, NotificationPopup, LongOperationEntry, headerTemplate, contentTpl, footerTpl, FloatArea) {
      'use strict';

      /**
       * Константа (как бы) фильтра для отбора только не приостановленных операций
       * @private
       * @type {string}
       */
      var FILTER_NOT_SUSPENDED = 'not-suspended';

      /**
       * Константа (как бы) текста по-умолчанию для индикатора ожидания
       * @private
       * @type {string}
       */
      var DEFAULT_WAITINDICATOR_TEXT = rk('Пожалуйста, подождите…');

      /**
       * Константа (как бы) набора заголовков по-умолчанию для кнопки показа результата (в шапке попапа)
       * @private
       * @type {object}
       */
      var RESULT_BUTTON_TITLES = {
         download: 'Скачать',
         open:     'Открыть',
         viewLog:  'Журнал'
      };

      /**
       * Класс всплывающего информационное окна длительных операций
       * @class SBIS3.CONTROLS/LongOperations/Popup
       * @extends SBIS3.CONTROLS/NotificationPopup
       *
       * @author Спирин В.А.
       */
      var LongOperationsPopup = NotificationPopup.extend(/** @lends SBIS3.CONTROLS/LongOperations/Popup.prototype */{
         $protected: {
            _options: {
               userId: UserInfo.get('Пользователь'),
               isHint: false,
               headerTemplate: headerTemplate,
               bodyTemplate: contentTpl,
               footerTemplate: footerTpl,
               caption: '',
               className: 'controls-LongOperations controls-LongOperationsPopup controls-LongOperationsPopup__hidden controls-LongOperationsPopup__hiddenContentMode',
               customConditions: null,
               withAnimation: null,
               waitIndicatorText: null
            },

            _activeOperation: null,
            _firstOperationMode: false,
            _floatAreaMode: false,

            _longOpList: null,

            _notificationContainer: null,
            _progressContainer: null,

            _tabChannel: null,

            _loadingIndicator: null,
            _isIntroduced: null,
            _isInStartAnimation: null
         },

         $constructor: function () {
            this._publish('onSizeChange');
         },

         init: function () {
            LongOperationsPopup.superclass.init.call(this);

            this._longOpList = this.getChildControlByName('operationList');
            var customConditions = this._options.customConditions;
            // В текущей реализации наличие непустой опции customConditions обязательно
            if (!customConditions || !Array.isArray(customConditions)) {
               throw new Error('customConditions required');
            }
            this._longOpList.setCustomConditions(customConditions);

            if (this._options.withAnimation) {
               this.animationAtStart();
            }

            var container = this.getContainer();
            this._notificationContainer = container.find('.controls-LongOperationsPopup__footer_notification');
            this._progressContainer = container.find('.controls-LongOperationsPopup__footer_progress_container');

            this._tabChannel = new TabMessage();

            this._bindEvents();
            this._longOpList.reload();
         },

         _bindEvents: function () {
            var self = this;

            this.subscribeTo(this, 'onShow', function () {
               self._tabChannel.notify('LongOperations:Popup:onOpen', self.getId());
            });

            /*Если пользователь закроет в одной вкладке, закрываем на всех вкладках*/
            this.subscribeTo(this, 'onClose', function () {
               if (self.isVisible()) {
                  self._tabChannel.notify('LongOperations:Popup:onClose', self.getId());
               }
            });
            this.subscribeTo(this._tabChannel, 'LongOperations:Popup:onClose', function () {
               if (!self._isDestroyed) {
                  self.close();
               }
            });

            ['onlongoperationstarted', 'onlongoperationchanged', 'onlongoperationended', 'onlongoperationdeleted', 'onproducerregistered', 'onproducerunregistered'].forEach(function (evtType) {
               self.subscribeTo(self._longOpList, evtType, function (evtName, evt) {
                  self._onOperation(evtType, evt);
               });
            });

            var view = this._longOpList.getView();//this._longOpList.getChildControlByName('operationListDataGrid')

            var container = this.getContainer();
            var actionsContainer = container.find('.controls-LongOperationsPopup__footer__actionsContainer');
            this.subscribeTo(view, 'onDrawItems'/*'onItemsReady'*/, function () {
               var items = self._longOpList.getItems();
               var count = items ? items.getCount() : 0;
               if (count) {
                  self._activeOperation = null;
                  if (count === 1) {
                     self._setFirstOperationMode(true);
                     self._activeOperation = items.getRecordById(items.at(0).getId());
                  }
                  else {
                     self._setFirstOperationMode(false);
                     items.each(function (item, id) {
                        if (!self._activeOperation && item.get('status') === LongOperationEntry.STATUSES.running) {
                           self._activeOperation = item;
                           return false;
                        }
                     });
                     if (!self._activeOperation) {
                        self._activeOperation = items.getRecordById(items.at(0).getId());
                     }
                  }
                  actionsContainer.removeClass('ws-hidden');
                  self._updateState();

                  if (!self._isIntroduced) {
                     self._introduce();
                  }

                  //При перерисовке размеры могут меняться
                  self._notify('onSizeChange');
               }
               else {
                  //Если операций нет, просто закрываем попап
                  self.close();
               }
            });

            //При клике по записи, открываем журнал операции или ссылку, если она есть
            this.subscribeTo(view, 'onItemActivate', function (e, meta) {
               self._longOpList.applyMainAction(meta.item);
            });

            this.subscribeTo(this.getChildControlByName('downloadButton'), 'onActivated', function () {
               if (self._activeOperation) {
                  self._longOpList.applyMainAction(self._activeOperation);
               }
            });

            //Открытие реестра операций
            this.subscribeTo(this.getChildControlByName('registryOperationButton'), 'onActivated', function () {
               self._showRegistry();
            });

            container.find('.controls-LongOperationsPopup__hideContentIcon').on('click', function () {
               //Показать / Скрыть контент
               self._toggleContent();
               //Возможно после раскрытия нужно известить о выполненых операциях
               self._longOpList[self._isContentHidden() ? 'animationClear' : 'animationStart']();
            });

            container.find('.controls-LongOperationsPopup__footer_pauseIcon').on('click', function () {
               //Остановить / Запустить операцию
               self._longOpList.applyUserAction($(this).hasClass('icon-Pause') ? 'suspend' : 'resume', self._activeOperation);
            });

            //Иконку запуска сделаем кликабельной, по ней будет запускать остановленная операция
            container.find('.controls-NotificationPopup__header').on('click', '.controls-LongOperationsPopup__runOperationIcon', function () {
               //Запустить операцию
               self._longOpList.applyUserAction('resume', self._activeOperation);
            });

            //Обработчик, который применяет фильтр "Скрыть приостановленные"
            var button = container.find('.controls-LongOperationsPopup__header_stoppedOperationsButton');
            button.on('click', function () {
               if (button.hasClass('controls-LongOperationsPopup__header_stoppedOperations-show')) {
                  self._longOpList.getLinkedContext().setValue('filter/status', FILTER_NOT_SUSPENDED);
               }
               else {
                  self._longOpList.getLinkedContext().setValue('filter', {});
               }
               button.toggleClass('controls-LongOperationsPopup__header_stoppedOperations-show');
            });

            this.subscribeTo(this._longOpList, 'ontimespentchanged', function () {
               if (self._activeOperation) {
                  self._setFooterTimeSpent(self._activeOperation.get('shortTimeSpent'));
               }
            });

            // Обновить попап после разблокировки девайса
            this.subscribeTo(EventBus.globalChannel(), 'onwakeup', function () {
               if(!self.isDestroyed() && self.isVisible()) {
                  self._longOpList.reload();
               }
            });
         },

         _introduce: function () {
            var cssClass = 'controls-LongOperationsPopup__hidden';
            var container = this.getContainer();
            if (container.hasClass(cssClass)) {
               container.css('opacity', 0);
               container.removeClass(cssClass);
               container.animate({opacity:1}, 800);
               this._isIntroduced = true;
            }
         },

         /**
          * Метод показывает floatArea.
          */
         _showRegistry: function () {
            var floatArea = new FloatArea({
               title: rk('Все операции'),
               template: 'SBIS3.CONTROLS/LongOperations/Registry',
               componentOptions: {
                  columns: {
                     userPic: false
                  },
                  userId: this._options.userId
               },
               opener: this,
               direction: 'left',
               animation: 'slide',
               isStack: true,
               autoCloseOnHide: true,
               maxWidth: 1000
            });

            //Скрываем нашу панель, во время работы с floatArea, она не нужна
            this._toggleFloatAreaMode(true);

            this._notify('onSizeChange');

            this.subscribeOnceTo(floatArea, 'onAfterClose', function () {
               this._toggleFloatAreaMode(false);
               this._notify('onSizeChange');
            }.bind(this));
         },

         /**
          * Переключить floatArea-моду
          */
         _toggleFloatAreaMode: function (toggle) {
            this._floatAreaMode = !!toggle;
            //Скрываем панель, во время работы с floatArea, она не нужна
            this.setVisible(!toggle);
         },

         /**
          * Метод перезагружает список и обновляет состояние
          * @return {Core/Deferred}
          */
         reload: function () {
            return this._longOpList.reload();
         },

         /**
          * Установливает заголовок нотификационного уведомления.
          * @param {String} caption Текст заголовка.
          */
         setCaption: function (caption) {
            LongOperationsPopup.superclass.setCaption.call(this, caption);
            if(typeof caption === 'string'){
               this.getContainer().find('.controls-NotificationPopup__header_caption').attr('title', caption);
            }
         },

         /**
          * Изменить заголовок, иконку и статус
          * @param {string} title Заголовок
          * @param {string} statusName Название статуса
          * @param {string} iconClass Классы иконки
          */
         _setHeader: function (title, statusName, iconClass) {
            this.setCaption(title);
            this.setStatus(statusName);
            this.setIcon(iconClass);

            var butCaption = this._getResultButtonCaption(this._activeOperation);
            var hasButton = !!butCaption;
            var button = this.getChildControlByName('downloadButton');
            button.setVisible(hasButton);
            if (hasButton) {
               button.setCaption(rk(butCaption));
            }
         },

         /**
          * Получить заголовок для кнопки результата операции
          * @protected
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @return {string}
          */
         _getResultButtonCaption: function (model) {
            if (model) {
               var action = this._longOpList.describeMainAction(model);
               if (action) {
                  switch (action.type) {
                     case 'result':
                        return model.get('resultWayOfUse') || RESULT_BUTTON_TITLES[model.get('resultHandler') ? 'open' : 'download'];
                     case 'history':
                        return /*model.get('resultWayOfUse') ||*/ RESULT_BUTTON_TITLES.viewLog;
                     case 'custom':
                        return action.title;
                  }
               }
            }
         },

         /**
          * Обновить состояние панели.
          */
         _updateState: function () {
            var model = this._activeOperation;
            if (model) {
               var STATUSES = LongOperationEntry.STATUSES;
               var title = model.get('title');

               //Кнопка остановки / запуска операции
               var pauseIcon = this.getContainer().find('.controls-LongOperationsPopup__footer_pauseIcon');

               var status = model.get('status');
               switch (status) {
                  case STATUSES.running:
                     this._setHeader(title, 'default', 'icon-size icon-24 controls-LongOperationsPopup__header_icon-customIcon');
                     if (model.get('canSuspend')) {
                        pauseIcon.removeClass('ws-hidden').addClass('icon-Pause').removeClass('icon-DayForward');
                     }
                     else {
                        pauseIcon.addClass('ws-hidden');
                     }
                     break;

                  case STATUSES.suspended:
                     this._setHeader(title, 'default', 'icon-size icon-24 icon-DayForward icon-primary controls-LongOperationsPopup__runOperationIcon');
                     if (model.get('canSuspend')) {
                        pauseIcon.removeClass('ws-hidden').removeClass('icon-Pause').addClass('icon-DayForward');
                     }
                     else {
                        pauseIcon.addClass('ws-hidden');
                     }
                     break;

                  case STATUSES.ended:
                     var isSuccess = !model.get('isFailed');
                     this._setHeader(title, isSuccess ? 'success' : 'error', isSuccess ? 'icon-size icon-24 icon-Yes icon-done' : 'icon-size icon-24 icon-Alert icon-error');
                     pauseIcon.addClass('ws-hidden');
                     break;
               }

               var notification = model.get('notification');
               if (notification) {
                  this._setNotification(notification);
               }
               else {
                  this._setProgress(model.get('progressCurrent'), model.get('progressTotal'), status === STATUSES.ended);
               }

               this._setFooterTimeSpent(model.get('shortTimeSpent'));
            }
         },

         /**
          * Проверить скрыт ли контент.
          */
         _isContentHidden: function () {
            return this.getContainer().hasClass('controls-LongOperationsPopup__hiddenContentMode');
         },

         /**
          * Изменить видимость контента.
          */
         _toggleContent: function (f) {
            this.getContainer().toggleClass('controls-LongOperationsPopup__hiddenContentMode', f === undefined ? undefined : !f);
            this._notify('onSizeChange');
         },

         /**
          * Изменить режим панели.
          * @param f Флаг - включить или отключить.
          */
         _setFirstOperationMode: function (f) {
            if (f !== this._isFirstOperationMode()) {
               if (f) {
                  //Скрываем контент
                  this._toggleContent(false);
               }
               this._toggleFirstOperationMode();
            }
         },

         /**
          * Проверить включен ли режим одной операции.
          */
         _isFirstOperationMode: function () {
            return this.getContainer().find('.controls-LongOperationsPopup__footer').hasClass('controls-LongOperationsPopup__footer_firstOperationMode');
         },

         /**
          * Изменить режим одной операции.
          */
         _toggleFirstOperationMode: function () {
            this.getContainer().find('.controls-LongOperationsPopup__footer').toggleClass('controls-LongOperationsPopup__footer_firstOperationMode');
         },

         _setProgress: function (current, total, isEnded) {
            this._notificationContainer.addClass('ws-hidden');
            this._progressContainer.removeClass('ws-hidden');
            if (!(0 < total)) {
               total = 1;
               current = isEnded ? 1 : (0 < current ? 1 : 0);
            }

            /*###var message;
            if (100 <= total) {
               message = current + ' / ' + total + ' ' + rk('операций');
            }
            else {
               message =
                  strHelpers.wordCaseByNumber(current, rk('Выполнено', 'ДлительныеОперации'), rk('Выполнена', 'ДлительныеОперации'), rk('Выполнено', 'ДлительныеОперации'))
                  + ' ' + current + ' ' +
                  strHelpers.wordCaseByNumber(current, rk('операций'), rk('операция'), rk('операции')) + ' ' + rk('из') + ' ' + total;
            }*/
            var needMsg = total !== 1;
            var $tasks = this.getContainer().find('.controls-LongOperationsPopup__footer_execTasks');
            $tasks[needMsg ? 'removeClass' : 'addClass']('ws-hidden');
            if (needMsg) {
               $tasks.text(
                  Math.floor(current) + ' ' + (100 <= total ? '/' : rk('из')) + ' ' + total + ' ' + rk('операций')
               );
            }
            this.getContainer().find('.controls-LongOperationsPopup__footer_progress').text(Math.floor(100*current/total) + '%');
         },

         _setNotification: function (message) {
            this._progressContainer.addClass('ws-hidden');
            this._notificationContainer.text(message).removeClass('ws-hidden');
         },

         _setFooterTimeSpent: function (timeSpent) {
            this.getContainer().find('.controls-LongOperationsPopup__footer_executeTime').text(timeSpent);
         },

         /**
          * Обработать событие
          * @protected
          * @param {string} eventType Тип события
          * @param {object} data данные события
          */
         _onOperation: function (eventType, data) {
            switch (eventType) {
               case 'onlongoperationstarted':
                  /*if (data.isCurrentTab) {
                     this.animationAtStart();
                  }*/
                  this._setProgress(0, data.progress ? data.progress.total : 1, false);
                  break;

               case 'onlongoperationchanged':
                  var active = this._activeOperation;
                  var longOpList = this._longOpList;
                  switch (data.changed) {
                     case 'status':
                        switch (data.status) {
                           case LongOperationEntry.STATUSES.running:
                              this._setProgress(data.progress ? data.progress.value : 0, data.progress ? data.progress.total : 1, false);
                           case LongOperationEntry.STATUSES.suspended:
                              break;
                        }
                        break;
                     case 'progress':
                        if (active && active === longOpList.lookupItem(data)) {
                           this._setProgress(data.progress.value, data.progress.total, false);
                        }
                        break;
                     case 'notification':
                        if (data.notification && active && active === longOpList.lookupItem(data)) {
                           this._setNotification(data.notification);
                        }
                        break;
                  }
                  break;

               case 'onlongoperationended':
                  this._setProgress(data.progress ? data.progress.value : 1, data.progress ? data.progress.total : 1, true);
                  var model = this._longOpList.lookupItem(data);
                  if (model) {
                     this._activeOperation = model;
                     this._updateState();
                  }
                  break;

               case 'onlongoperationdeleted':
               case 'onproducerregistered':
               case 'onproducerunregistered':
                  break;
            }
         },

         /**
          * Запустить анимацию старта длительной операции
          * @param {string} [waitIndicatorText] текст индикатора ожидания (опционально)
          */
         animationAtStart: function (waitIndicatorText) {
            /*Время экспозиции индикатора ожидания перед движением вниз*/
            var TIME_EXPOSITION = 600;//1000
            /*Время движения индикатора ожидания вниз*/
            var TIME_GLIDING = 800;//1500
            /*Время однократного мигания иконки в заголовке*/
            var TIME_BLINKING = 600;//600
            if (this._isInStartAnimation) {
               return;
            }
            this._isInStartAnimation = true;
            var self = this;
            var text = waitIndicatorText || this._options.waitIndicatorText || DEFAULT_WAITINDICATOR_TEXT;
            var promise = new Deferred();
            if (!this._loadingIndicator) {
               require(['Lib/Control/LoadingIndicator/LoadingIndicator'], function (LoadingIndicator) {
                  self._loadingIndicator = new LoadingIndicator({message:text});
                  self._loadingIndicator.show();
                  promise.callback();
               });
            }
            else {
               this._loadingIndicator.setMessage(text);
               this._loadingIndicator.show();
               promise.callback();
            }
            promise.addCallback(function () {
               setTimeout(function () {
                  if (!self.isDestroyed() && self.isVisible()
                        //Если активен режим с floatArea (открыт журнал), то просто скрываем ромашку. Анимация не нужна.
                        && !self._floatAreaMode) {
                     var _moveTo = function ($target, zIndex, $element) {
                        var offset = $target.offset();
                        $element
                           .clone()
                           .appendTo('body')
                           .css({
                              'position' : 'absolute',
                              'z-index' : zIndex,
                              'top' : $element.offset().top,
                              'left': $element.offset().left
                           })
                           .animate({
                              top: offset.top - 4,
                              left: offset.left - 4
                           }, TIME_GLIDING, function () {
                              $(this).remove();
                              self._isInStartAnimation = null;
                              $target.animate({
                                 opacity: 0
                              }, TIME_BLINKING/2, function () {
                                 $target.animate({
                                    opacity: 1
                                 }, TIME_BLINKING/2);
                              });
                           });
                     };
                     var $cnt = self.getContainer();
                     _moveTo($cnt.find('.controls-NotificationPopup__header_icon'), +$cnt.css('z-index') + 1, self._loadingIndicator.getWindow().getContainer().find('.ws-loadingimg'));
                  }
                  var zIndex = +self._loadingIndicator.getWindow().getContainer().closest('.ws-LoadingIndicator__window').css('z-index');
                  self._loadingIndicator.close();
                  self._loadingIndicator = null;
                  require('Core/WindowManager').releaseZIndex(zIndex);
                  self.moveToTop();
               }, TIME_EXPOSITION);
            });
         },

         destroy: function () {
            this._tabChannel.destroy();
            this._tabChannel = null;

            var container = this.getContainer();
            [
               '.controls-NotificationPopup__header_caption',
               '.controls-LongOperationsPopup__hideContentIcon',
               '.controls-LongOperationsPopup__footer_pauseIcon',
               '.controls-NotificationPopup__header',
               '.controls-LongOperationsPopup__header_stoppedOperationsButton'
            ].forEach(function (selector) {
               container.find(selector).off('click');
            });

            LongOperationsPopup.superclass.destroy.call(this);
         }
      });

      LongOperationsPopup.resizable = false;
      return LongOperationsPopup;
   }
);
