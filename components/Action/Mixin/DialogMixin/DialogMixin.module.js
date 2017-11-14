/*global define, $ws*/
define('js!SBIS3.CONTROLS.Action.DialogMixin', [
   "Core/core-merge",
   'Core/Deferred',
   "WS.Data/Utils",
   'Core/IoC'
], function( cMerge, Deferred, Utils, IoC){
   'use strict';

   /**
    * Действие открытия окна с заданным шаблоном
    * @mixin  SBIS3.CONTROLS.Action.DialogMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */
   var DialogMixin = /** @lends SBIS3.CONTROLS.Action.DialogMixin.prototype */{
       /**
        * @event onAfterShow Происходит после отображения диалога.
        * @see onBeforeShow
        */
       /**
        * @event onBeforeShow Происходит перед отображением диалога.
        * @see onAfterShow
        */
      $protected : {
         _options : {
            /**
             * @deprecated Используйте опцию {@link template}.
             * @cfg {String} Устанавливает компонент, который будет использован в качестве диалога редактирования записи.
             * @see template
             * @see setDialogComponent
             */
            dialogComponent: '',
            /**
             * @cfg {String} Устанавливает шаблон диалога редактирования.
             * @remark
             * В качестве значения устанавливают имя компонента в виде "js!SBIS3.MyArea.MyName".
             * Подробнее о создании шаблона читайте в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/create/">Создание диалога редактирования</a>.
             * @see mode
             */
            template : '',
            /**
             * @cfg {String} Устанавливает режим отображения диалога.
             * @variant dialog Открытие диалога производится в новом модальном окне, которое создаётся на основе контрола {@link SBIS3.CORE.Dialog}.
             * @variant floatArea Открытие диалога производится на всплывающей панели, которая создаётся на основе контрола {@link SBIS3.CORE.FloatArea}.
             * @remark
             * Для получения/изменения значения опции используйте методы {@link setMode} и {@link getMode}.
             * @see template
             * @see setMode
             * @see getMode
             */
            mode: 'dialog',
            /**
             * @cfg {Object} Объект с пользовательскими опциями, которые передаются в диалог редактирования в <a href="https://wi.sbis.ru/doc/platform/developmentapl/interface-development/core/oop/#configuration-class-parameters">секцию _options</a>.
             */
            componentOptions: null,
            /**
             * @cfg {Object} Объект с конфигурацией контрола, на основе которого создаётся диалог редактирования (см. {@link mode}). В числе опций также передают и {@link SBIS3.CORE.Control#linkedContext}.
             */
            dialogOptions: null
         },
         _dialog: undefined,
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
         this._publish('onAfterShow', 'onBeforeShow');
      },
      _doExecute: function(meta) {
         if (!this._isExecuting) { //Если завершился предыдущий execute
            this._executeDeferred = new Deferred();
            this._openComponent(meta);
            return this._executeDeferred;
         }
         return (new Deferred).callback();
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
         var componentName = (meta.mode == 'floatArea') ? 'js!SBIS3.CORE.FloatArea' : 'js!SBIS3.CORE.Dialog';
         if (this._isNeedToRedrawDialog()){
            this._resetComponentOptions();
            cMerge(this._dialog._options, config);
            this._dialog.reload(true);
         }
         else {
            this._isExecuting = true;
            requirejs([componentName], function(Component) {
               try {
                  this._dialog = new Component(config);
               }
               catch (error) {
                  this._finishExecuteDeferred(error);
               }
            }.bind(this));

         }
      },
      _resetComponentOptions: function() {
         //FloatArea предоставляет возможность перерисовать текущий установленный шаблон. При перерисовке сохраняются все опции, которые были установлены как на FloatArea, так и на редактируемом компоненте.
         //Производим открытие новой записи по новой конфигурации, все что лежало в опциях до этого не актуально и при текущем конфиге может поломать требуемое поведение.
         //Поэтому требуется избавиться от старых опций, чтобы reload компонента, фактически, открывал "новую" floatArea с новой конфигурацией, только в текущем открытом контейнере.
         //Требуется только сохранить опции, которые отвечают за размер панели
         var dialogOptions = this._dialog._options;
         dialogOptions.componentOptions = {
            isPanelMaximized: dialogOptions.maximized
         }
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
      _getOpener: function(){
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
         }
         else {
            topParent = this.getTopParent();
            if (topParent !== this) {
               floatAreaContainer = topParent.getContainer().closest('.ws-float-area');
               floatArea = floatAreaContainer.length ? floatAreaContainer[0].wsControl : false;
            }
         }
         return floatArea || this;
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
         config.componentOptions = this._buildComponentConfig(meta);
         config.handlers = config.handlers || {};
         var handlers = {
            onAfterClose: function (e, result) {
               self._isExecuting = false;
               self._finishExecuteDeferred();
               self._notifyOnExecuted(meta, result);
               self._dialog = undefined;
            },
            onBeforeShow: function () {
               self._notify('onBeforeShow', this);
            },
            onAfterShow: function () {
               self._isExecuting = false;
               self._notify('onAfterShow', this);
            }
         };
         for (var name in handlers) {
            if (handlers.hasOwnProperty(name)) {
               if (config.handlers.hasOwnProperty(name) && config.handlers[name] instanceof Array) {
                  config.handlers[name].push(handlers[name]);
               } else if(config.handlers.hasOwnProperty(name))  {
                  config.handlers[name] = [config.handlers[name], handlers[name]]
               } else {
                  config.handlers[name] = handlers[name];
               }
            }
         }

         return config;
      },

      _finishExecuteDeferred: function(error) {
         if (this._executeDeferred && !this._executeDeferred.isReady()) {
            if (!error) {
               //false - т.к. приходится нотифаить событие onExecuted самому, из-за того, что базовый action
               //не может обработать валидный результат false
               //Выписал задачу, чтобы мог https://online.sbis.ru/opendoc.html?guid=c7ff3ac1-5884-40ef-bf84-e544d8a41ffa
               this._executeDeferred.callback(false);
            }
            else {
               this._executeDeferred.errback(error);
            }
         }
      },

      /**
       * Устана режим открытия диалога редактирования компонента.
       * @param {String} mode режим открытия диалога редактирования компонента {@link mode}.
       */
      setMode: function(mode) {
         this._options.mode = mode;
      },
      /**
       * Получить режим открытия диалога редактирования компонента.
       * @param {String} mode режим открытия диалога редактирования компонента {@link mode}.
       */
      getMode: function() {
         return this._options.mode;
      },
      /**
       * Устанавливает название шаблона
       * @param {String} template Название модуля шаблона.
       * @deprecated
       */
      setDialogComponent: function (template) {
         //нужно для того чтобы работал метод setProperty(dialogComponent)
         Utils.logger.stack(this._moduleName + '::$constructor(): option "dialogComponent" is deprecated and will be removed in 3.8.0', 1);
         this._options.template = template;

      },

      _isNeedToRedrawDialog: function(){
         return this._dialog && !this._dialog.isDestroyed() && (this._dialog.isAutoHide && !this._dialog.isAutoHide());
      },

      /**
       @deprecated
       **/
      _opendEditComponent: function(meta, dialogComponent, mode){
         IoC.resolve('ILogger').error('SBIS3.CONTROLS.OpenEditDialog', 'Используйте публичный метод execute для работы с action\'ом открытия диалога редактирования');
         meta.template = dialogComponent;
         this._openComponent.call(this, meta, mode);
      },

      after : {
         destroy: function () {
            if (this._dialog) {
               this._dialog.destroy();
               this._dialog = undefined;
            }
         }
      }
   };

   return DialogMixin;
});