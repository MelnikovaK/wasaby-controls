/**
 * Created by as.krasilnikov on 13.04.2018.
 */
define('Controls/Popup/Compatible/CompoundAreaForNewTpl/CompoundArea',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'wml!Controls/Popup/Compatible/CompoundAreaForNewTpl/CompoundArea',
      'Controls/Popup/Opener/Stack/StackStrategy',
      'Controls/Popup/Compatible/CompoundAreaForNewTpl/ComponentWrapper',
      'Controls/Popup/Compatible/ManagerWrapper/Controller',
      'Vdom/Vdom',
      'Core/Control',
      'Core/IoC',
      'Core/core-clone',
      'Core/Deferred',
      'css!theme?Controls/Popup/Compatible/CompoundAreaForNewTpl/CompoundArea'
   ],
   function(CompoundControl,
      template,
      StackStrategy,
      ComponentWrapper,
      ManagerWrapperController,
      Vdom,
      control,
      IoC,
      clone,
      Deferred) {
      /**
       * Слой совместимости для открытия новых шаблонов в старых попапах
       * */
      var moduleClass = CompoundControl.extend({
         _dotTplFn: template,
         $protected: {
            _isVDomTemplateMounted: false
         },
         init: function() {
            moduleClass.superclass.init.apply(this, arguments);
            var self = this;
            this._onCloseHandler = this._onCloseHandler.bind(this);
            this._onResultHandler = this._onResultHandler.bind(this);
            this._onResizeHandler = this._onResizeHandler.bind(this);
            this._beforeCloseHandler = this._beforeCloseHandler.bind(this);
            this._onRegisterHandler = this._onRegisterHandler.bind(this);
            this._onMaximizedHandler = this._onMaximizedHandler.bind(this);
            this._onActivatedHandler = this._onActivatedHandler.bind(this);
            this._onDeactivatedHandler = this._onDeactivatedHandler.bind(this);
            this._onCloseHandler.control = this._onResultHandler.control = this;

            this._panel = this.getParent();
            this._panel.subscribe('onBeforeClose', this._beforeCloseHandler);
            this._panel.subscribe('onAfterClose', this._callCloseHandler.bind(this));

            this._runInBatchUpdate('CompoundArea - init - ' + this._id, function() {
               var def = new Deferred();

               if (this._options.innerComponentOptions) {
                  if (this._options.innerComponentOptions._template) {
                     this._options.template = this._options.innerComponentOptions._template;
                  }
                  this._options.templateOptions = this._options.innerComponentOptions;
                  IoC.resolve('ILogger').error('Шаблон CompoundArea задается через опцию template. Конфигурация шаблона через опцию templateOptions');
               }

               this._modifyInnerOptionsByHandlers();

               require([this._options.template, 'Vdom/Vdom'], function() {
                  // Пока грузили шаблон, компонент могли задестроить
                  if (self.isDestroyed()) {
                     return;
                  }
                  var wrapper = $('.vDomWrapper', self.getContainer());
                  if (wrapper.length) {
                     var wrapperOptions = {
                        template: self._options.template,
                        templateOptions: self._options.templateOptions,

                        // Нужно передать себя в качестве родителя, чтобы система фокусов
                        // могла понять, где находятся вложенные компоненты
                        parent: self
                     };
                     self._vDomTemplate = control.createControl(ComponentWrapper, wrapperOptions, wrapper);
                     self._afterMountHandler();
                     self._afterUpdateHandler();
                  } else {
                     self._isVDomTemplateMounted = true;
                     self.sendCommand('close');
                  }

                  def.callback();
               });

               return def;
            });
         },

         _createEventProperty: function(handler) {
            return {
               fn: this._createFnForEvents(handler),
               args: []
            };
         },

         // Создаем обработчик события, который положим в eventProperties узла
         _createFnForEvents: function(callback) {
            var fn = callback;

            // Нужно для событийного канала vdom'a.
            // У fn.control позовется forceUpdate. На compoundArea его нет, поэтому ставим заглушку
            fn.control = {
               _forceUpdate: this._forceUpdate
            };
            return fn;
         },

         _beforeCloseHandler: function(event) {
            // Если позвали закрытие панели до того, как построился VDOM компонент - дожидаемся когда он построится
            // Только после этого закрываем панель
            if (!this._isVDomTemplateMounted) {
               this._closeAfterMount = true;
               event.setResult(false);
            } else {
               this.popupBeforeDestroyed();
            }
         },

         popupBeforeDestroyed: function() {
            // Эмулируем событие вдомного попапа managerPopupBeforeDestroyed для floatArea
            var ManagerWrapper = ManagerWrapperController.getManagerWrapper();
            if (ManagerWrapper) {
               var container = this._container[0] ? this._container[0] : this._container;
               ManagerWrapper._beforePopupDestroyedHandler(null, {}, [], container);
            }
         },

         // Обсудили с Д.Зуевым, другого способа узнать что vdom компонент добавился в dom нет.
         _afterMountHandler: function() {
            var self = this;
            this._options.onOpenHandlerEvent && this._options.onOpenHandlerEvent('onOpen');
            self._baseAfterMount = self._vDomTemplate._afterMount;
            self._vDomTemplate._afterMount = function() {
               self._baseAfterMount.apply(this, arguments);
               if (self._options._initCompoundArea) {
                  self._notifyOnSizeChanged(self, self);
                  self._options._initCompoundArea(self);
               }
               self._isVDomTemplateMounted = true;
               if (self._closeAfterMount) {
                  self.sendCommand('close');
                  self.popupBeforeDestroyed();
               } else if (self._options.catchFocus) {
                  self._vDomTemplate.activate && self._vDomTemplate.activate();
               }
            };
         },

         // Обсудили с Д.Зуевым, другого способа узнать что vdom компонент обновился - нет.
         _afterUpdateHandler: function() {
            var self = this;
            self._baseAfterUpdate = self._vDomTemplate._afterUpdate;
            self._vDomTemplate._afterUpdate = function() {
               self._baseAfterUpdate.apply(this, arguments);
               if (self._isNewOptions) {
                  // костыль от дубровина не позволяет перерисовать окно, если prevHeight > текущей высоты.
                  // Логику в панели не меняю, решаю на стороне совместимости
                  self._panel._prevHeight = 0;
                  self._panel._recalcPosition && self._panel._recalcPosition();
                  self._panel.getContainer().closest('.ws-float-area').removeClass('ws-invisible');
                  self._isNewOptions = false;
               }
            };
         },
         _modifyInnerOptionsByHandlers: function() {
            var innerOptions = this._options.templateOptions;
            innerOptions._onCloseHandler = this._onCloseHandler;
            innerOptions._onResultHandler = this._onResultHandler;
            innerOptions._onResizeHandler = this._onResizeHandler;
            innerOptions._onRegisterHandler = this._onRegisterHandler;
            innerOptions._onActivatedHandler = this._onActivatedHandler;
            innerOptions._onMaximizedHandler = this._onMaximizedHandler;
            innerOptions._onDeactivatedHandler = this._onDeactivatedHandler;
         },
         _onResizeHandler: function() {
            this._notifyOnSizeChanged();
         },
         _onCloseHandler: function() {
            this._callCloseHandler();
            this.sendCommand('close', this._result);
            this._result = null;
         },
         _callCloseHandler: function() {
            this._options.onCloseHandler && this._options.onCloseHandler(this._result);
            this._options.onCloseHandlerEvent && this._options.onCloseHandlerEvent('onClose', [this._result]);
         },
         _onResultHandler: function() {
            this._result = Array.prototype.slice.call(arguments, 1); // first arg - event;

            this._options.onResultHandler && this._options.onResultHandler.apply(this, this._result);
            this._options.onResultHandlerEvent && this._options.onResultHandlerEvent('onResult', this._result);
         },
         _onRegisterHandler: function(event, eventName, emitter, handler) {
            if (['mousemove', 'touchmove', 'mouseup', 'touchend'].indexOf(eventName) !== -1) {
               if (handler) {
                  this._compoundHandlers = this._compoundHandlers || {};
                  this._compoundHandlers[eventName] = function(event) {
                     handler.apply(emitter, [new Vdom.SyntheticEvent(event)]);
                  };
                  document.body.addEventListener(eventName, this._compoundHandlers[eventName]);
               } else if (this._compoundHandlers && this._compoundHandlers[eventName]) {
                  document.body.removeEventListener(eventName, this._compoundHandlers[eventName]);
                  this._compoundHandlers[eventName] = null;
               }
            }
         },
         _onActivatedHandler: function(event, opts) {
            // если активность внутри CompoundArea - переопределяем onBringToFront чтобы он активировал правильный контрол (например при закрытии панели)
            this._$onBringToFront = this.onBringToFront;
            this.onBringToFront = function() {
               if (!opts._$to.isDestroyed || !opts._$to.isDestroyed()) {
                  opts._$to.activate();
               }
            };
         },
         _onMaximizedHandler: function(event, maximized) {
            if (!this._panel._updateAreaWidth) {
               return;
            }

            var coords = { top: 0, right: 0 };
            var item = {
               popupOptions: {
                  maximized: maximized,
                  minWidth: this._options._popupOptions.minWidth,
                  maxWidth: this._options._popupOptions.maxWidth,
                  minimizedWidth: this._options._popupOptions.minimizedWidth,
                  containerWidth: this._container.width()
               }
            };
            var width = StackStrategy.getPosition(coords, item).width;

            this._panel._updateAreaWidth(width);
            this._panel.getContainer()[0].style.maxWidth = '';
            this._panel.getContainer()[0].style.minWidth = '';

            var newOptions = clone(this._options.templateOptions);
            newOptions.maximized = maximized;

            this._updateVDOMTemplate(newOptions);
         },
         _onDeactivatedHandler: function() {
            // активность уходит - восстановим onBringToFront
            this.onBringToFront = this._$onBringToFront;
         },

         _getRootContainer: function() {
            var container = this._vDomTemplate.getContainer();
            return container.get ? container.get(0) : container;
         },

         destroy: function() {
            this._container[0].eventProperties = null;
            moduleClass.superclass.destroy.apply(this, arguments);
            this._isVDomTemplateMounted = true;
            if (this._vDomTemplate) {
               var Sync = require('Vdom/Vdom').Synchronizer;
               Sync.unMountControlFromDOM(this._vDomTemplate, this._vDomTemplate._container);
            }
         },
         _modifyOptions: function(cfg) {
            var cfg = moduleClass.superclass._modifyOptions.apply(this, arguments);
            require([cfg.template]);
            return cfg;
         },

         _forceUpdate: function() {
            // Заглушка для ForceUpdate которого на compoundControl нет
         },

         setTemplateOptions: function(newOptions) {
            // Могут позвать перерисоку до того, как компонент создался
            // Если компонент еще не создался а его уже перерисовали, то создаться должент с новыми опциями
            this._options.templateOptions = newOptions;
            this._modifyInnerOptionsByHandlers();

            if (this._vDomTemplate) {
               this._isNewOptions = true;

               // Скроем окно перед установкой новых данных. покажем его после того, как новые данные отрисуются и окно перепозиционируется
               this._panel.getContainer().closest('.ws-float-area').addClass('ws-invisible');
               this._updateVDOMTemplate(this._options.templateOptions);
            }
         },

         _updateVDOMTemplate: function(templateOptions) {
            this._vDomTemplate._options.templateOptions = templateOptions;
            this._vDomTemplate._forceUpdate();
         }
      });

      moduleClass.dimensions = {
         resizable: false
      };

      return moduleClass;
   });
