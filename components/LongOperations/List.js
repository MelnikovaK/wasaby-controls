define('SBIS3.CONTROLS/LongOperations/List',
   [
      'Core/core-merge',
      'Core/helpers/Object/isEqual',
      'Core/Deferred',
      'Lib/Control/CompoundControl/CompoundControl',
      'SBIS3.CONTROLS/LongOperations/Entry',
      'SBIS3.CONTROLS/LongOperations/Manager',
      'SBIS3.CONTROLS/LongOperations/List/resources/DataSource',
      'SBIS3.CONTROLS/Utils/InformationPopupManager',
      'Lib/Control/FloatArea/FloatArea',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/LongOperationsList',
      'css!SBIS3.CONTROLS/LongOperations/List/LongOperationsList',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/resources/LongOperationsListStateTemplate',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/resources/LongOperationsListStartTimeTemplate',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/resources/LongOperationsListExecuteTimeTemplate',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/resources/LongOperationsListUserPhotoTemplate',
      'tmpl!SBIS3.CONTROLS/LongOperations/List/resources/LongOperationsListNameTemplate',
      'SBIS3.CONTROLS/LongOperations/List/resources/model',
      'SBIS3.CONTROLS/DataGridView'
   ],

   function (cMerge, cObjectIsEqual, Deferred, CompoundControl, LongOperationEntry, longOperationsManager, LongOperationsListDataSource, InformationPopupManager, FloatArea, dotTplFn) {
      'use strict';

      /**
       * Интервал обновления времени выполнения операции
       * @type {number}
       */
      var TIMESPENT_DURATION = 5000;

      /**
       * Продолжительность одного мигания анимации завершённых операций
       * @type {number}
       */
      var ANIM_BLINK_DURATION = 400;//700

      /**
       * Количество миганий анимации завершённых операций
       * @type {number}
       */
      var ANIM_BLINK_COUNT = 3;

      /**
       * При открытии анимировать все операции, завершённые не ранее такого времени
       * @type {number}
       */
      var ANIM_NOTEARLY = 1000;



      /**
       * Класс для отображения списка длительных операций
       * @class SBIS3.CONTROLS/LongOperations/List
       * @extends Lib/Control/CompoundControl/CompoundControl
       *
       * @author Спирин В.А.
       *
       * @public
       *
       */
      var LongOperationsList = CompoundControl.extend( /** @lends SBIS3.CONTROLS/LongOperations/List.prototype */{
         _dotTplFn: dotTplFn,
         $protected: {
            _options: {
               columns: {
                  status: true,
                  startedAt: true,
                  title: true,
                  timeSpent: true,
                  userPic: true
               },
               pageSize: 50,
               infiniteScroll: 'down',
               hasSeparator: false,

               listName: 'browserView',
               userId: null,

               noLoad: false
            },

            _view: null,
            _spentTiming: null,
            _animQueue: [],
            _animating: null,
            _notFirst: null
         },

         $constructor: function () {
            var context = this.getLinkedContext();
            if (!context.getValue('filter')) {
               context.setValue('filter', {});
            }
            if (this._options.userId) {
               context.setValue('filter/UserId', this._options.userId);
            }
            if (this._options.columns.userPic) {
               context.setValue('filter/needUserInfo', true);
            }
            this._publish('onlongoperationstarted', 'onlongoperationchanged', 'onlongoperationended', 'onlongoperationdeleted', 'onproducerregistered', 'onproducerunregistered', 'ontimespentchanged');
         },

         init: function () {
            LongOperationsList.superclass.init.call(this);

            this._view = this.getChildControlByName(this._options.listName);

            //this._view.setItemsActions(this._makeItemsActions(null));

            this._bindEvents();

            this._view.setDataSource(new LongOperationsListDataSource(), true);
         },

         _bindEvents: function () {
            var self = this;
            var STATUSES = LongOperationEntry.STATUSES;

            ['onlongoperationstarted', 'onlongoperationchanged', 'onlongoperationended', 'onlongoperationdeleted', 'onproducerregistered', 'onproducerunregistered'].forEach(function (evtType) {
               self.subscribeTo(longOperationsManager, evtType, function (evtName, evt) {
                  var custom = evt ? evt.custom : null;
                  if (custom) {
                     var customConditions = self._view.getDataSource().getOptions().customConditions;
                     if (customConditions && customConditions.length) {
                        // Если событие об операции, перехваченой внешним просмотрщиком - игнорировать её
                        // 1174822763 https://online.sbis.ru/opendoc.html?guid=65e542a1-fb10-40a3-a677-f03214f871a1
                        var needIgnore = customConditions.some(function (cond) {
                           return Object.keys(cond).every(function (name) {
                              return cond[name] === custom[name];
                           });
                        });
                        if (needIgnore) {
                           return;
                        }
                     }
                  }
                  var dontReload;
                  if (['onlongoperationchanged', 'onlongoperationended', 'onlongoperationdeleted'].indexOf(evtName.name) !== -1) {
                     var model = self.lookupItem(evt);
                     dontReload = !model;
                     if (model) {
                        switch (evtName.name) {
                           case 'onlongoperationchanged':
                              if (evt.changed === 'progress') {
                                 model.set('progressCurrent', evt.progress.value);
                                 model.set('progressTotal', evt.progress.total);
                                 dontReload = true;
                              }
                              else {
                                 if (evt.changed === 'status') {
                                    if (evt.status === STATUSES.running && model.get('status') === STATUSES.suspended) {
                                       model.set('timeIdle', (new Date()).getTime() - model.get('startedAt').getTime() - model.get('timeSpent'));
                                    }
                                 }
                                 else
                                 if (evt.changed === 'notification' && evt.notification) {
                                    model.set('notification', evt.notification);
                                    dontReload = true;
                                 }
                                 model.set(evt.changed, evt[evt.changed]);
                              }
                              self._checkItems();
                              break;
                           case 'onlongoperationended':
                              self._animationAdd(model.getId(), !evt.error);
                              self._animationRun();
                              break;
                           /*case 'onlongoperationdeleted':
                              break;*/
                        }
                     }
                  }
                  /*if (evt) {
                     evt.isCurrentTab = evt.tabKey === longOperationsManager.getTabKey();
                  }*/
                  self._notify(evtName.name, evt);
                  if (!dontReload) {
                     self.reload();
                  }
               });
            });

            //У приостановленных операций нужно менять цвет текста, поэтому навешиваем класс
            this.subscribeTo(this._view, 'onDrawItems', function () {
               var items = self._view.getItems();
               if (items) {
                  var $cont = self._view.getContainer();
                  items.each(function (item, id) {
                     if (item.get('status') === STATUSES.suspended) {
                        $cont.find('.js-controls-ListView__item[data-id="' + item.getId() + '"]').addClass('LongOperationsList__view_stoppedOperation');
                     }
                  });
               }
            });

            //Нужно показывать разные действия в зависимости от состояния операции
            this.subscribeTo(this._view, 'onChangeHoveredItem', function (event, item) {
               var model = item.record;
               if (model) {
                  var actions = self._makeItemsActions(model);
                  var itemsActionsGroup = self._view.getItemsActions();
                  if (itemsActionsGroup) {
                     itemsActionsGroup.setItems(actions);
                  }
                  else
                  if(actions && actions.length) {
                     self._view.setItemsActions(actions);
                  }
               }
            });
         },

         /**
          * Приготовить список доступных действий для указаной модели
          * @protected
          * @return {object[]}
          */
         _makeItemsActions: function (model) {
            var actions = {};
            if (model) {
               var STATUSES = LongOperationEntry.STATUSES;
               var DEFAULT_ICO = 'Favourite';
               var status = model.get('status');
               var inf = this._getCustomActions(model);
               if (inf) {
                  for (var name in inf) {
                     var action = inf[name];
                     if (action && typeof action === 'object' && !action.main && this._isCustomActionAllowed(action, status)) {
                        actions[name] = {title:action.title || name, icon:'sprite:icon-16 icon-' + (action.ico || DEFAULT_ICO) + ' icon-done'};
                     }
                  }
               }
               // Заголовки могут зависесть от модели
               if (model.get('canSuspend') && status === STATUSES.running) {
                  actions['suspend'] = {title:rk(model.get('resumeAsRepeat') ? 'Отменить' : 'Приостановить', 'ДлительныеОперации'), icon:'sprite:icon-16 icon-Pause icon-primary action-hover'};
               }
               if (model.get('canSuspend') && status === STATUSES.suspended) {
                  actions['resume'] = {title:rk(model.get('resumeAsRepeat') ? 'Повторить' : 'Возобновить', 'ДлительныеОперации'), icon:'sprite:icon-16 icon-DayForward icon-primary action-hover'};
               }
               if (model.get('canDelete')) {
                  actions['delete'] = {title:rk('Удалить'), icon:'sprite:icon-16 icon-Erase icon-error'};
               }
            }
            return Object.keys(actions).map(function (name) {
               var action = actions[name];
               return {
                  name: name,
                  icon: action.icon,
                  caption: action.title,
                  tooltip: action.title,
                  isMainAction: true,
                  onActivated: this._onUserAction.bind(this, name)
               };
            }.bind(this));
         },

         _onUserAction: function (action, $item, id, itemModel) {
            this.applyUserAction(action, itemModel);
         },

         /**
          * Получить датагрид
          * @public
          * @return {SBIS3.CONTROLS/DataGridView}
          */
         getView: function () {
            return this._view;
         },

         /**
          * Получить текущие отображаемые элементы списка
          * @public
          * @return {DataSet}
          */
         getItems: function () {
            return this._view.getItems();
         },

         /**
          * Инициировать анимацию и процесс обновления времён выполнения если нужно
          * @public
          */
         _checkItems: function () {
            var hasRun;
            var items = this._view.getItems();
            if (items && items.getCount()) {
               var STATUSES = LongOperationEntry.STATUSES;
               var from = !this._notFirst ? (new Date()).getTime() - ANIM_NOTEARLY : null;
               items.each(function (model) {
                  var status = model.get('status');
                  if (!this._notFirst
                        && status === STATUSES.ended
                        && from < model.get('startedAt').getTime() + model.get('timeSpent') + model.get('timeIdle')) {
                     this._animationAdd(model.getId(), !model.get('isFailed'));
                  }
                  if (!hasRun && status === STATUSES.running) {
                     hasRun = true;
                  }
               }.bind(this));
            }
            this._notFirst = true;
            if (hasRun) {
               if (!this._spentTiming) {
                  this._spentTiming = setInterval(this._changeTimeSpent.bind(this), TIMESPENT_DURATION);
               }
            }
            else
            if (this._spentTiming) {
               clearInterval(this._spentTiming);
               this._spentTiming = null;
            }
            this._animationRun();
         },

         /**
          * Изенить отображаемое время выполнения операций
          * @protected
          */
         _changeTimeSpent: function () {
            var items = this._view.getItems();
            if (items && items.each) {
               var STATUSES = LongOperationEntry.STATUSES;
               var $cont = this._view.getContainer();
               var itemProjection = this._view._getItemsProjection();
               itemProjection.setEventRaising(false);
               var time = (new Date()).getTime();
               items.each(function (model) {
                  if (model.get('status') === STATUSES.running) {
                     model.set('timeSpent', time - model.get('startedAt').getTime() - model.get('timeIdle'));
                     $cont.find('.js-controls-ListView__item[data-id="' + model.getId() + '"]')
                        .find('.controls-LongOperationsList__executeTimeContainer').html(model.get('strTimeSpent'));
                  }
               });
               itemProjection.setEventRaising(true);
            }
            this._notify('ontimespentchanged');
         },

         /**
          * Запросить и отобразить (по получению) все элементы списка заново
          * @public
          * @return {Core/Deferred}
          */
         reload: function () {
            var promise = this._view.reload().addCallback(function () {
               this._checkItems();
            }.bind(this));
            // Индикатор загрузки здесь только приводит к мельканию списка, убрать его
            // Лучше бы конечно, если бы у SBIS3.CONTROLS/ListView была опция "Не показывать индикатор загрузки. Совсем. Никогда."
            this._view.getContainer().find('.controls-AjaxLoader').addClass('ws-hidden').removeClass('controls-AjaxLoader__showIndication');
            return promise;
         },

         /**
          * Установить предусловия для источника данных
          * @public
          * @param {object[]} customConditions Список предусловий
          */
         setCustomConditions: function (customConditions) {
            if (!(customConditions && Array.isArray(customConditions) && customConditions.every(function (v) { return !!v && typeof v === 'object' && !!Object.keys(v).length; }))) {
               throw new Error('Array of objects required');
            }
            var dataSource = this._view.getDataSource();
            var options = dataSource.getOptions();
            options.customConditions = customConditions;
            dataSource.setOptions(options);
         },

         /**
          * Проверить, может ли длительная операция иметь историю
          * @public
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @returns {boolean}
          */
         canHasHistory: function (model) {
            return !!model && longOperationsManager.canHasHistory(model.get('tabKey'), model.get('producer'));
         },

         /**
          * Выполнить действие над длительной операцией, инициированное пользователем
          * @public
          * @param {string} action Имя действия (resume, suspend, delete)
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @returns {Core/Deferred}
          */
         applyUserAction: function (action, model) {
            var isAllow;
            var customAction;
            switch (action) {
               case 'suspend':
               case 'resume':
                  isAllow = model.get('canSuspend');
                  break;
               case 'delete':
                  isAllow = model.get('canDelete');
                  break;
               default:
                  var inf = this._getCustomActions(model);
                  if (inf && inf[action] && typeof inf[action] === 'object') {
                     customAction = inf[action];
                     isAllow = true;
                  }
                  break;
            }
            if (!isAllow) {
               return Deferred.fail('Action not allowed');
            }
            var promise;
            if (customAction) {
               promise = this._execHandler(customAction.call, customAction.args);
            }
            else {
               promise = longOperationsManager.callAction(action, model.get('tabKey'), model.get('producer'), model.get('id'));
               // Удаление в LRS может занимать много времени, поэтому перезапросить список нужно сразу - удаляемая операция в него уже не войдёт. Для
               // остальных действий вызывать reload не нужно, это произойдёт по событию, пришедшему в результате выпонения действия
               if (action === 'delete') {
                  promise.addCallback(this.reload.bind(this));
               }
            }
            return promise;
         },

         /**
          * Получить описание основного (результирующего или кастомного основное) действия длительной операции
          * @public
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @return {object}
          */
         describeMainAction: function (model) {
            var mainAction = this._getMainAction(model);
            if (mainAction) {
               var descr = {type:mainAction.type};
               if (mainAction.type === 'custom') {
                  descr.title = mainAction.action.title;
               }
               return descr;
            }
         },

         /**
          * Выполнить основное (результирующее или кастомное основное) действие длительной операции
          * @public
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          */
         applyMainAction: function (model) {
            var mainAction = this._getMainAction(model);
            if (mainAction) {
               switch (mainAction.type) {
                  case 'result':
                     this._showResult(model);
                     break;
                  case 'history':
                     this._showHistory(model, mainAction.allowResultButton);
                     break;
                  case 'custom':
                     this._execHandler(mainAction.action.call, mainAction.action.args);
                     break;
               }
            }
         },

         /**
          * Определить основное (результирующее или кастомное основное) действие длительной операции
          * @protected
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @return {object}
          */
         _getMainAction: function (model) {
            if (model) {
               var STATUSES = LongOperationEntry.STATUSES;
               var status = model.get('status');
               if (status === STATUSES.ended || model.get('isFailed')) {
                  // Только если операция завершена или содержит ошибку
                  if (!model.get('isFailed') || model.get('useResult')) {
                     // Если операция завершена успешно или ей явно предписано использовать результат - выполнить действие, указанное в качестве результата
                     if (model.get('resultHandler') || model.get('resultUrl')) {
                        return {type:'result'};
                     }
                     else {
                        // Если нет, то если операция может иметь историю и является составной - открыть журнал операции (либо если было предписано
                        // показать результат, но его не оказалось)
                        if ((this.canHasHistory(model) && 1 < model.get('progressTotal')) || model.get('useResult')) {
                           return {type:'history'};
                        }
                     }
                  }
                  else {
                     // Иначе показать историю (с кнопкой частичного результата)
                     return {type:'history', allowResultButton:true};
                  }
               }
               else {
                  // Или если есть кастомное действие, продекларированное как основное
                  var inf = this._getCustomActions(model);
                  if (inf) {
                     for (var name in inf) {
                        var action = inf[name];
                        if (action.main && this._isCustomActionAllowed(action, status)) {
                           return {type:'custom', action:action};
                        }
                     }
                  }
               }
            }
         },

         /**
          * Найти кастомное действие
          * Набор кастомных действий задаётся в свойстве "custom.actions" длительной операции (соответствует полю "CustomData/actions" в сервисе LRS)
          * в виде имя действия - описание действия:
          * <pre>
          *    {
          *       actions: {
          *          "<Имя действия>": {
          *             when: [0,1],            // Когда применимо - список статусов длительной операции
          *             call: '<Модуль:метод>', // Обработчик действия в виде строки с именем модули и именем метода, разделёнными двоеточием
          *             args: '<Аргументы>',    // Аргументы обработчика в виде json-строки с массивом аргументов. Если аргумент один, то симолы "[" и "]"
          *                                     // в начале и в конце можно опустить. Если единственный аргумент - строка, то можно опустить и ковычки
          *             main: false,            // Указывает, что действие является основным. Основное действие происходит по клику на названии длительной
          *                                     // операции в списке. Не основнные действия имеют отдельные кнопки на тулбаре строки
          *             ico: 'Favourite',       // Имя значка действия (только для не основных)
          *             title: '<Название>'     // Отображаемое название действия
          *          },
          *          ...
          *       }
          *    }
          * </pre>
          * @protected
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @return {object}
          */
         _getCustomActions: function (model) {
            var custom = model.get('custom');
            if (custom) {
               var actions = custom.actions;
               return actions && typeof actions === 'object' ? actions : null;
            }
         },

         /**
          * Проверить, разрешено ли кастомное действие для указанного статуса длительной операции
          * @protected
          * @param {object} model Кастомное действие
          * @param {number} status Статус длительной операции
          * @return {boolean}
          */
         _isCustomActionAllowed: function (action, status) {
            var statuses = action.when;
            return Array.isArray(statuses) && statuses.indexOf(status) !== -1;
         },

         /**
          * Выполнить действие, указанное в качестве результата длительной операции. Возвращает true если дальнейшая обработка не нужна
          * @protected
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @return {boolean}
          */
         _showResult: function (model) {
            //Только если операция завершена или содержит ошибку
            if (model && (model.get('status') === LongOperationEntry.STATUSES.ended || model.get('isFailed'))) {
               var handler = model.get('resultHandler');
               var url = model.get('resultUrl');
               if (handler || url) {
                  // Если есть хоть какой-то результат для показа - проверить не истёк ли его срок годности
                  var until = model.get('resultValidUntil');
                  if (until && until < new Date()) {
                     this._obsoleteResult();
                     return true;
                  }
               }
               if (handler) {
                  var checker = model.get('resultChecker');
                  if (checker) {
                     this._execHandler(checker, model.get('resultCheckerArgs')).addCallbacks(
                        function (isValid) {
                           if (isValid) {
                              this._execHandler(handler, model.get('resultHandlerArgs'));
                           }
                           else {
                              this._obsoleteResult();
                           }
                        }.bind(this),
                        this._obsoleteResult.bind(this)
                     );
                  }
                  else {
                     this._execHandler(handler, model.get('resultHandlerArgs'));
                  }
                  return true;
               }
               if (url) {
                  /*Если файл нужно скачать, воспользуемся стандартным способом, созданием ссылку с аттрибутом и дернем триггер клик */
                  if (model.get('resultUrlAsDownload')) {
                     var a = document.createElement('a');
                     a.setAttribute('href', url);
                     a.setAttribute('download', '');
                     /*Для совместимости с IE ссылку нужно вставить в DOM, иначе работать не будет*/
                     a.style.display = 'none';
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                  }
                  else {
                     window.open(url, '_blank');
                  }
                  return true;
               }
            }
            return false;
         },

         /**
          * Показать сообщение о том, что результат устарел
          * @protected
          */
         _obsoleteResult: function () {
            InformationPopupManager.showMessageDialog({
               message:rk('Операция устарела.', 'ДлительныеОперации'),
               details:rk('Выполните повторно.', 'ДлительныеОперации')
            });
         },

         /**
          * Выполнить (асинхронно) обработчик, заданный строками методов и аргументов, и вернуть результат (если есть)
          * Строка методов представляет из себя разделённый одинарными двоеточиями список, начинающийся с имени модуля и следующей за ним цепочки имён
          * последовательно вызываемых методов. Строка аргументов представляет собой сериализованный массив массивов аргументов каждого метода.
          * Количество элементов массива верхнего уровня должно соответствовать количеству методов в цепочке в строке методов. Для случая, когда метод
          * только один, можно использовать простой массив аргументов, а не массив массивов.
          * @protected
          * @param {string} method Строка методов
          * @param {string} args Строка аргументов
          * @return {Core/Deferred<any>}
          */
         _execHandler: function (method, args) {
            var path = method.split(':');
            var promise = new Deferred();
            require([path.shift()], function (module) {
               var value;
               if (args) {
                  if (typeof args === 'string') {
                     // Это могут быть как сложные данные в виде json, так и просто одиночная строка
                     try {
                        args = JSON.parse(args);
                     }
                     catch (ex) {
                        // Значит просто строка
                     }
                  }
                  if (!Array.isArray(args)) {
                     args = [args];
                  }
               }
               else {
                  args = [];
               }
               if (1 < path.length && !(args.length === 0 || args.length === path.length)) {
                  throw new Error('Method and its arguments are not compatible');
               }
               if (path.length) {
                  var subject = module;
                  if (path.length === 1) {
                     // Если метод в path только один, то в args не массив массивов, а просто массив - обернуть в массив
                     args = [args];
                  }
                  for ( ; path.length; ) {
                     if (!subject || typeof subject !== 'object') {
                        throw new Error('Submethod is or not valid');
                     }
                     var submethod = path.shift();
                     if (typeof subject[submethod] !== 'function') {
                        throw new Error('Submethod is or not valid');
                     }
                     var arg = args.length ? args.shift() : [];
                     subject = subject[submethod].apply(subject, Array.isArray(arg) ? arg : [arg]);
                  }
                  value = subject;
               }
               else {
                  if (!module || typeof module !== 'function') {
                     throw new Error('Method is or not valid');
                  }
                  value = module.apply(null, args);
               }
               if (value !== undefined) {
                  if (value instanceof Deferred) {
                     promise.dependOn(value);
                  }
                  else {
                     promise.callback(value);
                  }
               }
               else {
                  promise.callback();
               }
            });
            return promise;
         },

         /**
          * Открыть историю указанной длительной операции
          * @protected
          * @param {SBIS3.CONTROLS/LongOperations/List/resources/model} model Модель длительной операции
          * @param {boolean} allowResultButton В истории можно использовать кнопку просмотра (частичного) результата операции
          */
         _showHistory: function (model, allowResultButton) {
            //Только если операция завершена или содержит ошибку
            if (model && (model.get('status') === LongOperationEntry.STATUSES.ended || model.get('isFailed'))) {
               var resultHandler = allowResultButton && (model.get('resultHandler') || model.get('resultUrl')) ? this._showResult.bind(this, model) : null;
               var componentModule = 'SBIS3.CONTROLS/LongOperations/History';
               var componentOptions = this.canHasHistory(model) ? {
                  tabKey: model.get('tabKey'),
                  producer: model.get('producer'),
                  operationId: model.get('id'),
                  isFailed: model.get('isFailed'),
                  resultHandler: resultHandler,
                  resultWayOfUse: resultHandler ? model.get('resultWayOfUse') : null
               } : {
                  failedOperation: model,
                  resultHandler: resultHandler
               };
               if (this._floatArea) {
                  var noUpdate;
                  var prevOptions = this._floatArea.getProperty('componentOptions');
                  if (prevOptions) {
                     prevOptions = cMerge({}, prevOptions);
                     delete prevOptions.resultHandler;
                     var nextOptions = cMerge({}, componentOptions);
                     delete nextOptions.resultHandler;
                     noUpdate = cObjectIsEqual(prevOptions, nextOptions);
                  }
                  if (!noUpdate) {
                     this._floatArea.setProperty('componentOptions', componentOptions);
                     this._floatArea.setTemplate(componentModule, componentOptions);
                  }
               }
               else {
                  this._floatArea = new FloatArea({
                     title: rk('Журнал выполнения операции', 'ДлительныеОперации'),
                     template: componentModule,
                     componentOptions: componentOptions,
                     opener: this,
                     direction: 'left',
                     animation: 'slide',
                     isStack: true,
                     autoCloseOnHide: true,
                     maxWidth: 680
                  });
                  this._floatArea.setProperty('componentOptions', componentOptions);
                  this.subscribeOnceTo(this._floatArea, 'onClose', function () {
                     this._floatArea = null;
                  }.bind(this));
               }
            }
         },

         /**
          * Найти модель среди имеющихся элементов данного списка по параметрам (Возвращается первое совпадение)
          * @public
          * @param {object} options Параметры модели
          * @param {string} options.producer Имя продюсера
          * @param {number|string} [options.operationId] Идентификатор длительной операции (опционально)
          * @param {number|string} [options.workflowId] Идентификатор исполняемого процесса длительной операции (опционально)
          * @return {WS.Data/Entity/Record}
          */
         lookupItem: function (options) {
            var items = this._view.getItems();
            if (items && items.getCount()) {
               var producer = options.producer;
               if (!producer) {
                  throw new Error('Property "producer" required');
               }
               var hasId = !!options.operationId;
               var id = hasId ? options.operationId : options.workflowId;
               if (!id) {
                  throw new Error('Property "operationId" or "workflowId" required');
               }
               for (var i = 0, len = items.getCount(); i < len; i++) {
                  var item = items.at(i);
                  if (item.get('producer') === producer && (hasId ? item.get('id') === id : item.get('extra') && item.get('extra').workflow === id)) {
                     return item;
                  }
               }
            }
         },

         /**
          * Начать анимацию согласно имеющейся очереди анимации завершённых операций
          * @public
          */
         animationStart: function () {
            this._animationRun();
         },

         /**
          * Прекратить анимацию и очистить очередь анимации завершённых операций
          * @public
          */
         animationClear: function () {
            if (this._animating) {
               clearTimeout(this._animating);
               this._animating = null;
            }
            if (this._animQueue.length) {
               for (var i = 0; i < this._animQueue.length; i++) {
                  this._animQueue[i].remain = 1;
               }
               this._animationStep();
            }
         },

         /**
          * Добавить в очередь анимации завершённых операций
          * @protected
          * @param {string} itemId Идентификатор
          * @param {boolean} isSuccess Указывает на успешность завершения операции
          */
         _animationAdd: function (itemId, isSuccess) {
            if (!this._animQueue.length || !this._animQueue.some(function (v) { return v.id === itemId; })) {
               this._animQueue.push({id:itemId, isSuccess:isSuccess, remain:2*ANIM_BLINK_COUNT});
            }
         },

         /**
          * Запустить выполнение очереди анимации завершённых операций
          * @protected
          * @param {boolean} dontUp Не повторять предыдущий шаг
          */
         _animationRun: function (dontUp) {
            var needUp = !dontUp && !!this._animating;
            if (this._animating) {
               clearTimeout(this._animating);
               this._animating = null;
            }
            if (this._view.getContainer().is(':visible')) {
               this._animationStep(needUp);
               if (this._animQueue.length) {
                  this._animating = setTimeout(this._animationRun.bind(this, true), ANIM_BLINK_DURATION);
               }
            }
         },

         /**
          * Выполнить очередной шаг по очереди анимации завершённых операций
          * @protected
          * @param {boolean} needUp Повторить предыдущий шаг
          */
         _animationStep: function (needUp) {
            if (this._animQueue.length) {
               var $cont = this.getContainer();
               for (var i = this._animQueue.length - 1; 0 <= i; i--) {
                  var item = this._animQueue[i];
                  var $line = $cont.find('.js-controls-ListView__item[data-id="' + item.id + '"]');
                  if (!$line.length) {
                     this._animQueue.splice(i, 1);
                  }
                  if (needUp) {
                     item.remain++;
                  }
                  $line.toggleClass(item.isSuccess ? 'controls-LongOperationsPopup__successCompletedOperation' : 'controls-LongOperationsPopup__errorCompletedOperation', item.remain%2 === 0);
                  item.remain--;
                  if (item.remain <= 0) {
                     this._animQueue.splice(i, 1);
                  }
               }
            }
         },

         /**
          * Разрушить объект
          * @public
          */
         destroy: function () {
            if (this._spentTiming) {
               clearInterval(this._spentTiming);
               this._spentTiming = null;
            }
            if (this._animating) {
               clearTimeout(this._animating);
               this._animating = null;
            }
            LongOperationsList.superclass.destroy.call(this);
         }
      });

      return LongOperationsList;
   }
);
