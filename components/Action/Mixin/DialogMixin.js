/*global define, $ws*/
define('SBIS3.CONTROLS/Action/Mixin/DialogMixin', [
   'Core/core-merge',
   'Core/Deferred',
   'WS.Data/Utils',
   'SBIS3.CONTROLS/ControlHierarchyManager',
   'Core/IoC'
], function(cMerge, Deferred, Utils, ControlHierarchyManager, IoC) {
   'use strict';

   /**
    * Миксин, который описывает Действие открытия окна, созданного по шаблону.
    * @mixin  SBIS3.CONTROLS/Action/Mixin/DialogMixin
    * @public
    * @author Крайнов Д.О.
    */
   var DialogMixin = /** @lends SBIS3.CONTROLS/Action/Mixin/DialogMixin.prototype */{
      /**
        * @event onAfterShow Происходит после отображения диалога.
        * @param {Core/EventObject} eventObject Дескриптор события.
        * @param {SBIS3.CONTROLS/Action/Mixin/DialogMixin} this Экземпляр класса Действия.
        * @see onBeforeShow
        */
      /**
        * @event onBeforeShow Происходит перед отображением диалога.
        * @param {Core/EventObject} eventObject Дескриптор события.
        * @param {SBIS3.CONTROLS/Action/Mixin/DialogMixin} this Экземпляр класса Действия.
        * @see onAfterShow
        */
      $protected: {
         _options: {

            /**
             * @deprecated Используйте опцию {@link template}.
             * @cfg {String} Устанавливает компонент, который будет использован в качестве диалога.
             * @see template
             * @see setDialogComponent
             */
            dialogComponent: '',

            /**
             * @cfg {String} Устанавливает шаблон диалога редактирования.
             * @remark
             * В качестве значения устанавливают имя компонента в виде "Examples/MyArea/MyName".
             * Подробнее о создании шаблона читайте в разделе <a href="/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/create/">Создание диалога редактирования</a>.
             * @see mode
             */
            template: '',

            /**
             * @cfg {String} Устанавливает режим отображения диалога.
             * @variant dialog Открытие диалога производится в новом модальном окне, которое создаётся на основе контрола {@link Lib/Control/Dialog/Dialog}.
             * @variant floatArea Открытие диалога производится на всплывающей панели, которая создаётся на основе контрола {@link Lib/Control/FloatArea/FloatArea}.
             * @remark
             * Для получения/изменения значения опции используйте методы {@link setMode} и {@link getMode}.
             * @see template
             * @see setMode
             * @see getMode
             */
            mode: 'dialog',

            /**
             * @cfg {Object} Объект с пользовательскими опциями, которые передаются в диалог в секцию _options.
             */
            componentOptions: null,

            /**
             * @cfg {Object} Объект с конфигурацией контрола, на основе которого создаётся диалог (см. {@link mode}). В числе опций также передают и {@link Lib/Control/Control#linkedContext}.
             */
            dialogOptions: null
         },
         _dialog: undefined,
         _openedPanelConfig: {},

         /**
          * Ключ модели из связного списка
          * Отдельно храним ключ для модели из связного списка, т.к. он может не совпадать с ключом редактируемой модели
          * К примеру в реестре задач ключ записи в реестре и ключ редактируемой записи различается, т.к. одна и та же задача может находиться в нескольких различных фазах
          */
         _linkedModelKey: undefined,
         _isExecuting: false, //Открывается ли сейчас панель
         _executeDeferred: undefined
      },
      $constructor: function() {
         if (this._options.dialogComponent && !this._options.template) {
            Utils.logger.stack(this._moduleName + '::$constructor(): option "dialogComponent" is deprecated and will be removed in 3.8.0', 1);
            this._options.template = this._options.dialogComponent;
         }
         this._documentClickHandler = this._documentClickHandler.bind(this);
         document.addEventListener('mousedown', this._documentClickHandler);
         document.addEventListener('touchstart', this._documentClickHandler);
         this._publish('onAfterShow', 'onBeforeShow');
      },
      _doExecute: function(meta) {
         if (!this._isExecuting) { //Если завершился предыдущий execute
            this._executeDeferred = new Deferred();
            this._openComponent(meta);
            return this._executeDeferred;
         }
         return (new Deferred()).callback();
      },

      /**
       * Закрывает открытый диалог
       */
      closeDialog: function() {
         if (this._dialog) {
            this._dialog.close();
         }
      },

      _openDialog: function(meta) {
         this._openComponent(meta, 'dialog');
      },

      _openFloatArea: function(meta) {
         this._openComponent(meta, 'floatArea');
      },

      _openComponent: function(meta, mode) {
         meta = meta || {};
         meta.mode = mode || meta.mode || this._options.mode; //todo в 3.17.300 убрать аргумент mode, его через execute проставить нельзя
         var config = this._getDialogConfig(meta);
         this._createComponent(config, meta);
      },

      _buildComponentConfig: function(meta) {
         var config = cMerge({}, this._options.componentOptions || {});
         return cMerge(config,  meta.componentOptions || {});
      },

      _createComponent: function(config, meta) {
         var componentName = this._getComponentName(meta),
            self = this,
            resetWidth;
         
         if (this._isNeedToRedrawDialog()) {
            this._resetComponentOptions();

            //Если поменялся шаблон панели, то надо обновить размеры.
            resetWidth = this._dialog._options.template !== config.template;
            cMerge(this._dialog._options, config);
            this._dialog.reload(true, resetWidth);
         } else {
            this._isExecuting = true;
            requirejs([componentName], function(Component) {
               try {
                  var deps = [];
                  if (isNewEnvironment()) {
                     deps = ['Controls/Popup/Opener/BaseOpener', 'Controls/Popup/Compatible/Layer'];
                     if (meta.mode === 'floatArea' && config.isStack === true) {
                        deps.push('Controls/Popup/Opener/Stack/StackController');
                        config._type = 'stack';
                        config.className = (config.className || '') + ' controls-Stack';
                     } else if (meta.mode === 'floatArea' && config.isStack === false) {
                        deps.push('Controls/Popup/Opener/Sticky/StickyController');
                        config._type = 'sticky';
                     } else {
                        deps.push('Controls/Popup/Opener/Dialog/DialogController');
                        config._type = 'dialog';
                     }
                     deps.push(config.template);
                     requirejs(deps, function(BaseOpener, CompatibleLayer, Strategy, cfgTemplate) {
                        CompatibleLayer.load().addCallback(function() {
                           config._initCompoundArea = function(compoundArea) {
                              self._dialog = compoundArea;
                           };
                           BaseOpener.showDialog(cfgTemplate, config, Strategy);
                        });
                     });
                  } else {
                     deps = ['Controls/Popup/Opener/BaseOpener', 'Controls/Popup/Compatible/BaseOpener', config.template];
                     requirejs(deps, function(BaseOpener, CompatibleOpener, cfgTemplate) {
                        if (BaseOpener.isVDOMTemplate(cfgTemplate)) {
                           CompatibleOpener._prepareConfigForNewTemplate(config, cfgTemplate);
                           config.className = 'ws-invisible'; //Пока не построился дочерний vdom  шаблон - скрываем панель, иначе будет прыжок
                           config.componentOptions._initCompoundArea = function(compoundArea) {
                              var dialog = self._dialog;
                              dialog._container.closest('.ws-float-area, .ws-window').removeClass('ws-invisible');
                           };
                        }
                        self._dialog = new Component(config);
                     });
                  }
               } catch (error) {
                  this._finishExecuteDeferred(error);
               }
            }.bind(this));

         }
      },

      _getComponentName: function(meta) {
         switch (meta.mode) {
            case 'floatArea':
               return 'Lib/Control/FloatArea/FloatArea';
            case 'recordFloatArea':
               //Для тех, кто переходит на vdom и на старой странице юзает recordFloatArea. Чтобы пользовались единой оберткой - action'ом.
               return 'Deprecated/Controls/RecordFloatArea/RecordFloatArea';
            default:
               return 'Lib/Control/Dialog/Dialog';
         }
      },
      
      _documentClickHandler: function(event) {
         //Клик по связному списку приводит к перерисовке записи в панели, а не открытию новой при autoHide = true
         if (this._dialog && this._openedPanelConfig.mode === 'floatArea' && this._dialog.isVisible() && this._openedPanelConfig.autoHide) {
            if (this._needCloseDialog(event.target) && !this._isClickToScroll(event)) {
               this._dialog.close();
            }
         }
      },
      _needCloseDialog: function(target) {
         if (!ControlHierarchyManager.checkInclusion(this._dialog, target) && !this._isLinkedPanel(target)) {
            return true;
         }
         return false;
      },

      //Если клик был по другой панели, проверяю, связана ли она с текущей
      _isLinkedPanel: function(target) {
         var floatArea = $(target).closest('.ws-float-area-stack-cut-wrapper').find('.ws-float-area'); //Клик может быть в стики шапку, она лежит выше .ws-float-area
         if (floatArea.length) {
            return ControlHierarchyManager.checkInclusion(this._dialog, floatArea.wsControl().getContainer());
         }

         //Если кликнули по инфобоксу или информационному окну - popup закрывать не нужно
         var infoBox = $(target).closest('.ws-info-box, .controls-InformationPopup, .ws-window-overlay, .js-controls-NotificationStackPopup');
         return !!infoBox.length;
      },

      //При клике по нативному скроллу на странице не закрываем панель
      _isClickToScroll: function(event) {
         var hasContainerScroll = event.target.scrollWidth - event.target.offsetWidth > 0;
         return hasContainerScroll && event.target.offsetHeight - event.clientY < 17;
      },
      _resetComponentOptions: function() {
         //FloatArea предоставляет возможность перерисовать текущий установленный шаблон. При перерисовке сохраняются все опции, которые были установлены как на FloatArea, так и на редактируемом компоненте.
         //Производим открытие новой записи по новой конфигурации, все что лежало в опциях до этого не актуально и при текущем конфиге может поломать требуемое поведение.
         //Поэтому требуется избавиться от старых опций, чтобы reload компонента, фактически, открывал "новую" floatArea с новой конфигурацией, только в текущем открытом контейнере.
         //Требуется только сохранить опции, которые отвечают за размер панели
         var dialogOptions = this._dialog._options;
         dialogOptions.componentOptions = {
            isPanelMaximized: dialogOptions.maximized
         };
      },

      /**
       * Возвращает конфигурацию диалога по умолчанию.
       * @param meta
       * @returns {*}
       * @private
       */
      _getDefaultDialogConfig: function(meta) {
         return cMerge({
            isStack: true,
            showOnControlsReady: false,
            autoCloseOnHide: true,
            needSetDocumentTitle: false,
            opener: meta.opener || this._getOpener(), //opener по умолчанию
            template: meta.template || this._options.template,
            target: undefined,
            block_by_task_1173286428: false // временнное решение проблемы описанной в надзадаче
         }, this._options.dialogOptions || {});
      },
      _getOpener: function() {
         //В 375 все прикладники не успеют указать у себя правильных opener'ов, пока нахожу opener за них.
         //В идеале они должны делать это сами и тогда этот код не нужен
         var popup = this.getContainer() && this.getContainer().closest('.controls-FloatArea'),
            topParent,
            floatArea,
            floatAreaContainer;

         //Указываем opener'ом всплывающую панель, в которой лежит action, это может быть либо controls.FloatArea, либо core.FloatArea
         //Нужно в ситуации, когда запись перерисовывается в уже открытой панели, чтобы по opener'aм добраться до панелей, которые открыты из той,
         //которую сейчас перерисовываем, и закрыть их.
         if (popup && popup.length) {
            return popup.wsControl();
         } else {
            topParent = this.getTopParent();
            if (topParent !== this) {
               floatAreaContainer = topParent.getContainer().closest('.ws-float-area');
               floatArea = floatAreaContainer.length ? floatAreaContainer[0].wsControl : false;
            }
         }
         return floatArea || null;
      },

      /**
       * Возвращает конфигурацию диалога - всплывающей панели или окна.
       * @param {Object} meta
       * @returns {Object}
       * @private
       */
      _getDialogConfig: function(meta) {
         var config = this._getDefaultDialogConfig(meta),
            self = this;

         cMerge(config, meta.dialogOptions);
         this._saveAutoHideState(meta, config);
         config.componentOptions = this._buildComponentConfig(meta);
         config.handlers = config.handlers || {};
         var handlers = this._getDialogHandlers(meta);
         
         for (var name in handlers) {
            if (handlers.hasOwnProperty(name)) {
               if (config.handlers.hasOwnProperty(name) && config.handlers[name] instanceof Array) {
                  config.handlers[name].push(handlers[name]);
               } else if (config.handlers.hasOwnProperty(name))  {
                  config.handlers[name] = [config.handlers[name], handlers[name]];
               } else {
                  config.handlers[name] = handlers[name];
               }
            }
         }

         return config;
      },
      
      _getDialogHandlers: function(meta) {
         var self = this;
         return {
            onAfterClose: function(e, result) {
               self._isExecuting = false;
               self._finishExecuteDeferred();
               self._notifyOnExecuted(meta, result);
               self._dialog = undefined;
            },
            onBeforeShow: function() {
               self._notify('onBeforeShow', this);
            },
            onAfterShow: function() {
               self._isExecuting = false;
               self._notify('onAfterShow', this);
            }
         };
      },
      
      _saveAutoHideState: function(meta, config) {
         this._openedPanelConfig = {
            autoHide: config.autoHide !== undefined ? config.autoHide : true,
            mode: meta.mode
         };
         config.autoHide = false;
      },

      _finishExecuteDeferred: function(error) {
         if (this._executeDeferred && !this._executeDeferred.isReady()) {
            if (!error) {
               //false - т.к. приходится нотифаить событие onExecuted самому, из-за того, что базовый action
               //не может обработать валидный результат false
               //Выписал задачу, чтобы мог https://online.sbis.ru/opendoc.html?guid=c7ff3ac1-5884-40ef-bf84-e544d8a41ffa
               this._executeDeferred.callback(false);
            } else {
               this._executeDeferred.errback(error);
            }
         }
      },

      /**
       * Устанавливает режим открытия диалога редактирования компонента.
       * @param {String} mode режим открытия диалога редактирования компонента {@link mode}.
       * @see mode
       * @see getMode
       */
      setMode: function(mode) {
         this._options.mode = mode;
      },

      /**
       * Получить режим открытия диалога редактирования компонента.
       * @param {String} mode режим открытия диалога редактирования компонента {@link mode}.
       * @see mode
       * @see setMode
       */
      getMode: function() {
         return this._options.mode;
      },

      /**
       * @deprecated Используйте опцию {@link template}.
       * @description
       * Устанавливает компонент, который будет использован в качестве диалога редактирования записи.
       */
      setDialogComponent: function(template) {
         //нужно для того чтобы работал метод setProperty(dialogComponent)
         Utils.logger.stack(this._moduleName + '::$constructor(): option "dialogComponent" is deprecated and will be removed in 3.8.0', 1);
         this._options.template = template;

      },

      _isNeedToRedrawDialog: function() {
         //Нужно перерисовать панель если она есть, не задестроена и не находится в процессе открытия/закрытия
         return this._dialog && !this._dialog.isDestroyed() && !this._isDialogClosing();
      },

      _isDialogClosing: function() {
         //Панель либо закрывается, либо дожидается, пока закроются дочерние панели, чтобы закрыться самой
         return this._dialog && (this._dialog._state === 'hide' || this._dialog._deferClose === true);
      },

      /**
       @deprecated
       **/
      _opendEditComponent: function(meta, dialogComponent, mode) {
         IoC.resolve('ILogger').error('SBIS3.CONTROLS.OpenEditDialog', 'Используйте публичный метод execute для работы с action\'ом открытия диалога редактирования');
         meta.template = dialogComponent;
         this._openComponent.call(this, meta, mode);
      },

      after: {
         destroy: function() {
            if (this._dialog) {
               this._dialog.destroy();
               this._dialog = undefined;
            }
            document.removeEventListener('mousedown', this._documentClickHandler);
            document.removeEventListener('touchstart', this._documentClickHandler);
         }
      }
   };


   //TODO start compatible block for VDOM
   function isNewEnvironment() {
      return !!document.getElementsByTagName('html')[0].controlNodes;
   }

   //TODO end compatible block for VDOM

   return DialogMixin;
});
