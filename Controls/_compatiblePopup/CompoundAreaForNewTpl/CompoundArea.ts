/**
 * Created by as.krasilnikov on 13.04.2018.
 */

import CompoundControl = require('Lib/Control/CompoundControl/CompoundControl');
import template = require('wml!Controls/_compatiblePopup/CompoundAreaForNewTpl/CompoundArea');
import ManagerWrapperController from 'Controls/Popup/Compatible/ManagerWrapper/Controller';
import ComponentWrapper from './ComponentWrapper';
import control = require('Core/Control');
import clone = require('Core/core-clone');
import Vdom = require('Vdom/Vdom');
import Deferred = require('Core/Deferred');
import {IoC, constants} from 'Env/Env';
import {StackStrategy} from 'Controls/popupTemplate';
import {load} from 'Core/library';
import 'css!theme?Controls/compatiblePopup';

/**
 * Слой совместимости для открытия новых шаблонов в старых попапах
 * */
var moduleClass = CompoundControl.extend({
   _dotTplFn: template,
   $protected: {
      _isVDomTemplateMounted: false,
      _closeTimerId: null
   },
   init: function() {
      moduleClass.superclass.init.apply(this, arguments);
      var self = this;
      this._listeners = [];
      this._onCloseHandler = this._onCloseHandler.bind(this);
      this._keydownHandler = this._keydownHandler.bind(this);
      this._onResultHandler = this._onResultHandler.bind(this);
      this._onResizeHandler = this._onResizeHandler.bind(this);
      this._beforeCloseHandler = this._beforeCloseHandler.bind(this);
      this._onRegisterHandler = this._onRegisterHandler.bind(this);
      this._onMaximizedHandler = this._onMaximizedHandler.bind(this);
      this._onCloseHandler.control = this._onResultHandler.control = this;

      this.getContainer().bind('keydown', this._keydownHandler);

      this._panel = this.getParent();
      this._panel.subscribe('onBeforeClose', this._beforeCloseHandler);
      this._panel.subscribe('onAfterClose', this._callCloseHandler.bind(this));
      this._maximized = !!this._options.templateOptions.maximized;

      // Если внутри нас сработал вдомный фокус (активация), нужно активироваться
      // самим с помощью setActive. Тогда и CompoundControl'ы-родители узнают
      // об активации.
      // Так как вдом зовет событие activated на каждом активированном контроле,
      // можно просто слушать это событие на себе и активироваться если оно
      // сработает.
      this._activatedHandler = this._activatedHandler.bind(this);
      this.subscribe('activated', this._activatedHandler);

      // То же самое с деактивацией, ее тоже нужно делать через setActive,
      // чтобы старый контрол-родитель мог об этом узнать.
      this._deactivatedHandler = this._deactivatedHandler.bind(this);
      this.subscribe('deactivated', this._deactivatedHandler);

      this._runInBatchUpdate('CompoundArea - init - ' + this._id, function() {
         var def = new Deferred();

         if (this._options.innerComponentOptions) {
            if (this._options.innerComponentOptions._template) {
               this._options.template = this._options.innerComponentOptions._template;
            }
            this._saveTemplateOptions(this._options.innerComponentOptions);
            IoC.resolve('ILogger').error('Шаблон CompoundArea задается через опцию template. Конфигурация шаблона через опцию templateOptions');
         }

         this._modifyInnerOptionsByHandlers();

         Promise.all([
             this._loadTemplate(this._options.template),
             import('Vdom/Vdom')
         ]).then(function() {
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

   _loadTemplate(tpl: string|Function): Promise<Function> {
      if (typeof tpl === 'string') {
         return load(tpl);
      }
      return Promise.resolve(tpl);
   },

   _keydownHandler: function(e) {
      if (!e.shiftKey && e.which === constants.key.esc) {
         e.stopPropagation();
         this._onCloseHandler();
      }
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
         if (this._vDomTemplate.hasRegisteredPendings()) {
            event.setResult(false);
            this._finishPendingOperations();
         }
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
      innerOptions._onMaximizedHandler = this._onMaximizedHandler;
   },
   _onResizeHandler: function() {
      this._notifyOnSizeChanged();
      ManagerWrapperController.startResizeEmitter();
   },
   _onCloseHandler(): void {
      // We need to delay reaction to close event, because it shouldn't
      // synchronously destroy all child controls of CompoundArea

      // protect against multi call
      if (this._closeTimerId) {
         return;
      }
      this._closeTimerId = setTimeout(() => {
         this._closeTimerId = null;
         this._finishPendingOperations();
      }, 0);
   },
   _finishPendingOperations(): void {
      this._vDomTemplate.finishPendingOperations().addCallback(() => {
         this.sendCommand('close', this._result);
         this._result = null;
      });
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
      // Пробрасываю событие о регистрации listener'ов до регистраторов, которые лежат в managerWrapper и физически
      // не могут отловить событие
      if (handler) {
         this._listeners.push({
            event: event,
            eventName: eventName,
            emitter: emitter
         });
         ManagerWrapperController.registerListener(event, eventName, emitter, handler);
      } else {
         ManagerWrapperController.unregisterListener(event, eventName, emitter);
      }
   },

   onBringToFront: function() {
      this._vDomTemplate && this._vDomTemplate.activate();
   },
   _onMaximizedHandler: function() {
      if (!this._panel._updateAreaWidth) {
         return;
      }

      this._maximized = !this._maximized;
      var coords = { top: 0, right: 0 };
      var item = {
         popupOptions: {
            maximized: this._maximized,
            minWidth: this._options._popupOptions.minWidth,
            maxWidth: this._options._popupOptions.maxWidth,
            minimizedWidth: this._options._popupOptions.minimizedWidth,
            containerWidth: this._container.width()
         }
      };

      // todo https://online.sbis.ru/opendoc.html?guid=256679aa-fac2-4d95-8915-d25f5d59b1ca
      item.popupOptions.width = this._maximized ? item.popupOptions.maxWidth : (item.popupOptions.minimizedWidth || item.popupOptions.minWidth);
      var width = StackStrategy.getPosition(coords, item).stackWidth;

      this._panel._options.maximized = this._maximized;
      this._panel._updateAreaWidth(width);
      this._panel.getContainer()[0].style.maxWidth = '';
      this._panel.getContainer()[0].style.minWidth = '';

      var newOptions = clone(this._options.templateOptions);
      newOptions.maximized = this._maximized;

      this._updateVDOMTemplate(newOptions);
      this._onResizeHandler();
   },

   _getRootContainer: function() {
      var container = this._vDomTemplate.getContainer();
      return container.get ? container.get(0) : container;
   },

   destroy: function() {
      this._container[0].eventProperties = null;
      this.unsubscribe('activated', this._activatedHandler);
      this.unsubscribe('deactivated', this._deactivatedHandler);
      if (this._closeTimerId) {
         clearTimeout(this._closeTimerId);
         this._closeTimerId = null;
      }

      // Очищаем список лисенеров в контроллерах.
      for (var i = 0; i < this._listeners.length; i++) {
         var listener = this._listeners[i];
         ManagerWrapperController.unregisterListener(listener.event, listener.eventName, listener.emitter);
      }
      moduleClass.superclass.destroy.apply(this, arguments);
      this._isVDomTemplateMounted = true;
      this.getContainer().unbind('keydown', this._keydownHandler);
      if (this._vDomTemplate) {
         var
            self = this,
            Sync = require('Vdom/Vdom').Synchronizer;

         Sync.unMountControlFromDOM(this._vDomTemplate, this._vDomTemplate._container);

         // Временное решение для очистки памяти. Вдомные контролы при вызове unMountControlFromDOM
         // уничтожаются (destroy) синхронно, но удаляются из DOM через инферно асинхронно.
         // При этом CompoundArea лежит внутри FloatArea на старой странице. Когда FloatArea
         // уничтожается, она уничтожает CompoundArea, и чистит свой контейнер через remove.
         // Соответственно инферно нечего удалять из DOM, так как удалены родители корневой
         // vdom-ноды. Из-за этого не чистятся различные вдомные свойства контейнеров: controlNodes,
         // eventProperties, ...
         //
         // У нас нет ссылок на эти элементы, но сборщик мусора хрома все равно не собирает их
         // (либо профилировщик показывает, что они не собраны). Для того, чтобы этот мусор собрался,
         // нужно почистить все добавленные vdom-ом свойства на элементах.
         //
         // Более правильное решение будет придумываться по ошибке:
         // https://online.sbis.ru/opendoc.html?guid=37e1cf9f-913d-4c96-b73a-effc3a5fba92
         setTimeout(function() {
            self._clearVdomProperties(self._vDomTemplate._container);
            self._vdomTemplate = null;
         }, 3000);
      }
   },
   _clearVdomProperties: function(container) {
      var children = (container[0] || container).getElementsByTagName('*');

      for (var i = 0; i < children.length; i++) {
         var c = children[i];

         delete c.controlNodes;
         delete c.eventProperties;
         delete c.eventPropertiesCnt;
         delete c.$EV;
         delete c.$V;
      }

      delete container.controlNodes;
      delete container.eventProperties;
      delete container.eventPropertiesCnt;
      delete container.$EV;
      delete container.$V;
   },

   _forceUpdate: function() {
      // Заглушка для ForceUpdate которого на compoundControl нет
   },

   setTemplateOptions: function(newOptions) {
      // Могут позвать перерисоку до того, как компонент создался
      // Если компонент еще не создался а его уже перерисовали, то создаться должент с новыми опциями
      this._saveTemplateOptions(newOptions);
      this._modifyInnerOptionsByHandlers();

      if (this._vDomTemplate) {
         this._isNewOptions = true;

         // Скроем окно перед установкой новых данных. покажем его после того, как новые данные отрисуются и окно перепозиционируется
         // Если панель стековая, то не скрываем, т.к. позиция окна не изменится.
         if (this._panel._moduleName !== 'Lib/Control/FloatArea/FloatArea' || this._panel._options.isStack !== true) {
            this._panel.getContainer().closest('.ws-float-area').addClass('ws-invisible');
         }
         this._updateVDOMTemplate(this._options.templateOptions);
      }
   },

   _saveTemplateOptions: function(newOptions) {
      this._options.templateOptions = newOptions;
      this._maximized = !!this._options.templateOptions.maximized;
   },

   _updateVDOMTemplate: function(templateOptions) {
      this._vDomTemplate.setTemplateOptions(templateOptions);
      this._vDomTemplate._forceUpdate();
   },

   _activatedHandler: function(event, args) {
      if (!this.isActive()) {
         var activationTarget = args[0];
         var curContainer = this._container.length
            ? this._container[0]
            : this._container;
         var toContainer = activationTarget._$to._container.length
            ? activationTarget._$to._container[0]
            : activationTarget._$to._container;

         // активируем только тот контрол CompoundArea, в который ушел фокус. Родительским панелям не зовем setActive,
         // потому что тогда FloatAreaManager решит, что фокус ушел туда и закроет текущую панель
         if (curContainer.contains(toContainer)) {
            this.setActive(true, activationTarget.isShiftKey, true, activationTarget._$to);
         }
      }
   },

   _deactivatedHandler: function(event, args) {
      if (this.isActive()) {
         var activationTarget = args[0];
         this.setActive(false, activationTarget.isShiftKey, true);
      }
   }
});

moduleClass.dimensions = {
   resizable: false
};

export default moduleClass;
