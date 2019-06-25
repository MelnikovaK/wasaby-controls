/**
 * Created by as.krasilnikov on 26.04.2018.
 */

import cMerge = require('Core/core-merge');
import Context = require('Core/Context');
import Deferred = require('Core/Deferred');
import randomId = require('Core/helpers/Number/randomId');
import library = require('Core/library');
import OpenDialogUtil = require('SBIS3.CONTROLS/Action/Utils/OpenDialogUtil');
import isVDOMTemplate = require('Controls/Utils/isVDOMTemplate');

function loadTemplate(name: string) {
   const libraryInfo = library.parse(name);
   let template = require(libraryInfo.name);

   libraryInfo.path.forEach((property) => {
      template = template[property];
   });

   return template;
}

/**
 * Слой совместимости для базового опенера для открытия старых шаблонов
 * @class Controls/_compatiblePopup/BaseOpener
 * @public
 */
const BaseOpener = {
   _prepareConfigForOldTemplate(cfg, templateClass) {
      let
         templateOptions = this._getTemplateOptions(templateClass),
         parentContext;

      cfg.templateOptions = {
         templateOptions: cfg.templateOptions || cfg.componentOptions || {},
         componentOptions: cfg.templateOptions || cfg.componentOptions || {},
         template: cfg.template,
         type: cfg._type,
         popupComponent: cfg._popupComponent,
         handlers: cfg.handlers,
         _initCompoundArea: cfg._initCompoundArea,
         _mode: cfg._mode,

         // На каждое обновление конфига генерируем новый id, чтобы понять, что нужно перерисовать шаблон
         _compoundId: randomId('compound-')
      };

      if (cfg._type === 'dialog' || cfg._type === 'stack') {
         cfg.isDefaultOpener = true;
      }

      this._preparePopupCfgFromOldToNew(cfg);

      if (cfg.hoverTarget) {
         cfg.templateOptions.hoverTarget = cfg.hoverTarget;
      }

      if (cfg.closeButtonStyle || cfg.closeButtonViewMode) {
         cfg.templateOptions.closeButtonViewMode = cfg.closeButtonStyle || cfg.closeButtonViewMode;
      }
      if (cfg.hasOwnProperty('closeButtonTransparent')){
         cfg.templateOptions.closeButtonTransparent = cfg.closeButtonTransparent;
      }
      if (cfg.record) { // от RecordFloatArea
         cfg.templateOptions.record = cfg.record;
      }
      if (cfg.parent) {
         cfg.templateOptions.__parentFromCfg = cfg.parent;
         parentContext = cfg.parent.getLinkedContext && cfg.parent.getLinkedContext(); // получаем контекст родителя
      }
      if (cfg.opener) {
         cfg.templateOptions.__openerFromCfg = cfg.opener;
      }
      if (cfg.newRecord) { // от RecordFloatArea
         cfg.templateOptions.newRecord = cfg.newRecord;
      }

      if (cfg.context || parentContext) {
         this._prepareContext(cfg, parentContext);
      }

      if (cfg.linkedContext) {
         cfg.templateOptions.linkedContext = cfg.linkedContext;
      }

      if (cfg.maximize) {
         cfg.className += ' ws-window';
         cfg.templateOptions.maximize = cfg.maximize;
      }

      cfg.templateOptions.caption = this._getCaption(cfg, templateClass);

      if (cfg.hasOwnProperty('border')) {
         cfg.templateOptions.hideCross = !cfg.border;
      }

      if (cfg.hasOwnProperty('disableActions')) {
         cfg.templateOptions.hideCross = cfg.disableActions;
      }

      cfg.templateOptions.trackTarget = cfg.hasOwnProperty('trackTarget') ? cfg.trackTarget : true;
      cfg.templateOptions.closeOnTargetScroll = cfg.closeOnTargetScroll || false;
      cfg.templateOptions.closeOnTargetHide = cfg.closeOnTargetHide || false;

      if (cfg.hasOwnProperty('autoShow')) {
         cfg.templateOptions.autoShow = cfg.autoShow;
         cfg.templateOptions._isVisible = cfg.autoShow;
         if (!cfg.autoShow) {
            cfg.closeOnOutsideClick = false;
            cfg.className += ' ws-hidden';
         }
      }

      if (cfg.hasOwnProperty('autoCloseOnHide')) {
         cfg.templateOptions.autoCloseOnHide = cfg.autoCloseOnHide;
      }

      if (templateOptions.hasOwnProperty('enabled')) {
         cfg.templateOptions.enabled = templateOptions.enabled;
      }

      if (cfg.hasOwnProperty('enabled')) {
         cfg.templateOptions.enabled = cfg.enabled;
      }

      if (cfg.hasOwnProperty('fixed')) {
         cfg.templateOptions.fixed = cfg.fixed;
      }

      if (!cfg.hasOwnProperty('catchFocus')) {
         cfg.catchFocus = true;
      }

      if (cfg.width === 'auto') {
         cfg.width = undefined;
      }
      if (cfg.height === 'auto') {
         cfg.height = undefined;
      }

      cfg.autofocus = cfg.catchFocus;
      cfg.templateOptions.catchFocus = cfg.catchFocus;

      // задаю опцию ignoreTabCycles для окна, в FloatArea она тоже стояла. Так переходы по табу не будут выскакивать за пределы окна.
      cfg.templateOptions.ignoreTabCycles = false;

      cfg.template = 'Controls/compatiblePopup:CompoundArea';
      this._setSizes(cfg, templateClass);

      // поддерживаем такое поведение для старых панелей, на VDOM его убрали
      if (cfg.templateOptions.type === 'stack') {
         if (!cfg.width && !cfg.maxWidth && cfg.minWidth) {
            cfg.width = cfg.minWidth;
         } else {
            cfg.width = cfg.width || cfg.maxWidth;
         }
      }
      cfg.templateOptions.minWidth = cfg.minWidth;
      cfg.templateOptions.maxWidth = cfg.maxWidth;
      cfg.templateOptions.minHeight = cfg.minHeight;
      cfg.templateOptions.maxHeight = cfg.maxHeight;
      cfg.templateOptions.width = cfg.width;
      cfg.templateOptions.height = cfg.height;

      if (cfg.canMaximize && cfg.maxWidth && cfg.minWidth && cfg.maxWidth !== cfg.minWidth) {
         cfg.minimizedWidth = cfg.minWidth;
         cfg.minWidth += 100; // minWidth и minimizedWidth должны различаться.
         cfg.templateOptions.canMaximize = true;
         cfg.templateOptions.templateOptions.isPanelMaximized = cfg.maximized;
      }
   },

   prepareNotificationConfig(config) {
      const template = typeof config.template === 'string' ? loadTemplate(config.template) : config.template;
      config.opener = null;
      config.isVDOM = true;
      config.template = 'Controls/compatiblePopup:OldNotification';
      config.componentOptions = {
         template,
         templateOptions: config.templateOptions,
         className: config.className
      };
      config.className = 'controls-OldNotification';
      return config;
   },

   _prepareContext(cfg, parentContext) {
      let destroyDef = new Deferred(),
         destrFunc = function() {
            destroyDef.callback();
            destroyDef = null;

            // CompoundArea должна отписаться от этого обработчика после onDestroy, на случай
            // если кто-то кеширует конфигурацию панели, иначе этот обработчик будет добавлен дважды,
            // что приведет к ошибке при закрытии/уничтожении панели
            this.unsubscribe('onDestroy', destrFunc);
         };

      if (cfg.context) {
         if (cfg.context instanceof Context) {
            // Если явно передан контекст, создаем дочерний от него, и передаем в опции открываемого компонента
            cfg.templateOptions.context = Context.createContext(destroyDef, {}, cfg.context);
         } else {
            // Если передан простой объект, создаем пустой контекст и заполняем его полями и значениями
            // из переданного объекта
            cfg.templateOptions.context = Context.createContext(destroyDef, {}, null);
            cfg.templateOptions.context.setContextData(cfg.context);
         }
      } else if (parentContext) {
         // Если контекст не передан, но задан родитель, то берем контекст родителя, создаем дочерний от него
         // и передаем в опции открываемого компонента
         cfg.templateOptions.context = Context.createContext(destroyDef, {}, parentContext);
      }

      if (!cfg.templateOptions.handlers) {
         cfg.templateOptions.handlers = {};
      }

      if (!cfg.templateOptions.handlers.onDestroy) {
         cfg.templateOptions.handlers.onDestroy = destrFunc;
      } else if (cfg.templateOptions.handlers.onDestroy.push) {
         cfg.templateOptions.handlers.onDestroy.push(destrFunc);
      } else {
         cfg.templateOptions.handlers.onDestroy = [cfg.templateOptions.handlers.onDestroy, destrFunc];
      }
   },

   _prepareConfigFromOldToOldByNewEnvironment(cfg) {
      if (cfg.flipWindow === 'vertical') {
         cfg.fittingMode = 'overflow';
      }
      if (cfg.cssClassName) {
         cfg.className = cfg.cssClassName;
      }
      if (cfg.maxWidth) {
         if (cfg.maxWidthWithoutSideBar !== true) {
            const MINIMAL_PANEL_DISTANCE = 50;
            const stackContainer = document.querySelector('.controls-Popup__stack-target-container');
            const sideBar = document.querySelector('.online-Sidebar');
            if (stackContainer && sideBar) {
               const maxCompatibleWidth = stackContainer.clientWidth - sideBar.clientWidth - MINIMAL_PANEL_DISTANCE;
               cfg.maxWidth = Math.min(maxCompatibleWidth, cfg.maxWidth);
            }
         }
      }

      // Если вдомное окно открывается из PopupMixin, нужно вычислить zindex вручную
      if (cfg.opener && cfg.opener._container) {
         let sbis3FloatArea = cfg.opener._container.closest('.controls-FloatArea');

         // get DOM node, cause it can be jQuery
         sbis3FloatArea = sbis3FloatArea && sbis3FloatArea.length !== undefined ? sbis3FloatArea[0] : sbis3FloatArea;
         if (sbis3FloatArea) {
            const zIndex = sbis3FloatArea.style.zIndex;
            if (zIndex) {
               cfg.zIndex = parseInt(zIndex, 10) + 10;
            }
         }
      }
   },

   _preparePopupCfgFromOldToNew(cfg) {
      cfg.templateOptions = cfg.templateOptions || cfg.componentOptions || {};

      if (cfg.target) {
         // нужно для миникарточки, они хотят работать с CompoundArea - и ей надо дать target
         // причем работают с jquery объектом
         cfg.templateOptions.target = cfg.target;
         cfg.target = cfg.target[0] ? cfg.target[0] : cfg.target;
      }

      cfg.className = cfg.className || '';

      if (!cfg.hasOwnProperty('closeOnOutsideClick')) {
         cfg.closeOnOutsideClick = cfg.hasOwnProperty('autoHide') ? cfg.autoHide : true;
      }

      if (cfg._type === 'dialog' && !cfg.hasOwnProperty('modal')) {
         cfg.modal = true;
         cfg.closeOnOutsideClick = false;
      }

      if (cfg.horizontalAlign) {
         if (cfg.horizontalAlign.side === undefined) {
            delete cfg.horizontalAlign.side;
         }
         if (cfg.horizontalAlign.offset === undefined) {
            delete cfg.horizontalAlign.offset;
         }
      }

      if (!cfg.hasOwnProperty('corner') || typeof cfg.corner !== 'object') {
         cfg.corner = {};
         if (cfg.hasOwnProperty('side')) {
            cfg.corner.horizontal = cfg.side;
         }
      }

      if (cfg.hasOwnProperty('verticalAlign') && typeof cfg.verticalAlign !== 'object') {
         cfg.corner = cfg.corner || {};

         // Если object - значит api popupMixin'a, которое совпадает с новым api => ничего не меняем
         cfg.corner.vertical = cfg.verticalAlign;
         delete cfg.verticalAlign;
      }

      if (!cfg.hasOwnProperty('direction')) {
         // Значения по умолчанию. взято из floatArea.js
         const side = cfg.hasOwnProperty('side') ? cfg.side : 'left';
         if (side === 'left') {
            cfg.direction = 'right';
         } else if (side === 'right') {
            cfg.direction = 'left';
         }
      }

      if (cfg.hasOwnProperty('direction')) {
         if (cfg.direction === 'right' || cfg.direction === 'left') {
            if (typeof cfg.horizontalAlign !== 'object') {
               cfg.horizontalAlign = { side: cfg.direction };
            }
         } else if (typeof cfg.verticalAlign !== 'object') {
            cfg.verticalAlign = { side: cfg.direction };

            // magic of old floatarea
            if (typeof cfg.horizontalAlign !== 'object' && cfg.side !== 'center') {
               cfg.horizontalAlign = { side: cfg.side === 'right' ? 'left' : 'right' };
            }
         }
      }

      if (cfg.hasOwnProperty('offset')) {
         if (cfg.offset.x) {
            cfg.horizontalAlign = cfg.horizontalAlign || {};
            cfg.horizontalAlign.offset = parseInt(cfg.offset.x, 10);
         }
         if (cfg.offset.y) {
            cfg.verticalAlign = cfg.verticalAlign || {};
            cfg.verticalAlign.offset = parseInt(cfg.offset.y, 10);
         }
      }

      if (cfg.hasOwnProperty('modal')) {
         cfg.modal = cfg.modal;
      }

      if (cfg._popupComponent === 'dialog') { // у window всегда есть drag
         cfg.templateOptions.draggable = true;
      }

      if (cfg.hasOwnProperty('draggable')) {
         cfg.templateOptions.draggable = cfg.draggable;
      }

      cfg.eventHandlers = cfg.eventHandlers || {};
      if (cfg.hasOwnProperty('onResultHandler')) {
         cfg.eventHandlers.onResult = cfg.onResultHandler;
      }
      if (cfg.hasOwnProperty('onCloseHandler')) {
         cfg.eventHandlers.onClose = cfg.onCloseHandler;
      }
      if (cfg.hasOwnProperty('catchFocus')) {
         cfg.autofocus = cfg.catchFocus;
      }

      /**
       * Let's protect ourselves from the case when the template was not loaded. In theory, this should not be.
       */
      if (require.defined(library.parse(cfg.template).name)) {
         /**
          * Determine the 'compound' or 'VDOM' template build.
          */
         cfg.isCompoundTemplate = !isVDOMTemplate(loadTemplate(cfg.template));
      } else {
         cfg.isCompoundTemplate = true;
      }
   },
   _prepareConfigForNewTemplate(cfg, templateClass) {
      cfg.componentOptions = { templateOptions: cfg.templateOptions || cfg.componentOptions };

      cfg.componentOptions.template = cfg.template;
      cfg.template =  'Controls/compatiblePopup:CompoundAreaNewTpl';
      cfg.animation = 'off';
      cfg.border = false;

      if (cfg.onResultHandler) { // передаем onResult - колбэк, объявленный на opener'e, в compoundArea.
         cfg.componentOptions.onResultHandler = cfg.onResultHandler;
      }

      cfg.isCompoundTemplate = true;

      cfg.componentOptions.catchFocus = cfg.hasOwnProperty('catchFocus') ? cfg.catchFocus : true;

      if (cfg.onCloseHandler) {
         cfg.componentOptions.onCloseHandler = cfg.onCloseHandler;
      }

      if (cfg.onCloseHandlerEvent) {
         cfg.componentOptions.onCloseHandlerEvent = cfg.onCloseHandlerEvent;
      }

      if (cfg.onResultHandlerEvent) {
         cfg.componentOptions.onResultHandlerEvent = cfg.onResultHandlerEvent;
      }

      if (cfg.onOpenHandlerEvent) {
         cfg.componentOptions.onOpenHandlerEvent = cfg.onOpenHandlerEvent;
      }

      this._setSizes(cfg, templateClass);

      cfg.componentOptions.templateOptions.stackMinWidth = cfg.minWidth;
      cfg.componentOptions.templateOptions.stackMaxWidth = cfg.maxWidth;
      cfg.componentOptions.templateOptions.stackWidth = cfg.width;

      cfg.componentOptions._popupOptions = {
         minWidth: cfg.minWidth,
         maxWidth: cfg.maxWidth,
         width: cfg.width,
         minimizedWidth: cfg.minimizedWidth
      };

      // FloatArea opens with maxWidth, if maxWidth is set.
      if (cfg.width && cfg.componentName === 'floatArea') {
         cfg.maxWidth = cfg.width;
      }
   },
   _getConfigFromTemplate(cfg) {
      // get options from template.getDefaultOptions
      const templateClass = typeof cfg === 'string' ? loadTemplate(cfg) : cfg;
      return templateClass.getDefaultOptions ? templateClass.getDefaultOptions() : {};
   },
   _prepareConfigFromNewToOld(cfg, template) {
      const optFromTmpl = cfg.template ? this._getConfigFromTemplate(cfg.template) : {};
      const newCfg = cMerge(cfg, {
         templateOptions: cfg.templateOptions || {},
         componentOptions: cfg.templateOptions || {},
         template: cfg.template,
         _initCompoundArea: cfg._initCompoundArea,
         dialogOptions: {
            _isCompatibleArea: true,
            isStack: cfg._type === 'stack',
            target: cfg.target,
            modal: cfg.modal,
            handlers: cfg.handlers,
            border: !isVDOMTemplate(template) // Если шаблон вдомный - кнопка закрытия не нужна
         },
         mode: (cfg._type === 'stack' || cfg._type === 'sticky' || cfg.target) ? 'floatArea' : 'dialog'
      });

      const revertPosition = {
         top: 'bottom',
         bottom: 'top',
         left: 'right',
         right: 'left',
         middle: 'center',
         center: 'center'
      };

      if (cfg.hasOwnProperty('task_1174068748')) {
         newCfg.dialogOptions.task_1174068748 = cfg.task_1174068748;
      }

      if (cfg.hasOwnProperty('closeOnOutsideClick')) {
         newCfg.dialogOptions.autoHide = cfg.closeOnOutsideClick;
         newCfg.dialogOptions.closeOnOverlayClick = cfg.closeOnOutsideClick;
      } else {
         newCfg.dialogOptions.autoHide = false; // значение по умолчанию в вдом контроле
      }

      if (cfg.hasOwnProperty('closeChildWindows')) {
         newCfg.dialogOptions.closeChildWindows = cfg.closeChildWindows;
      }

      if (cfg.hasOwnProperty('nativeEvent')) {
         newCfg.dialogOptions.nativeEvent = cfg.nativeEvent;
      }

      // из новых преобразуем
      if (cfg.targetPoint) {
         cfg.corner = cfg.targetPoint;
      }
      if (cfg.direction && typeof cfg.direction === 'object') {
         cfg.horizontalAlign = { side: cfg.direction.horizontal };
         cfg.verticalAlign = { side: cfg.direction.vertical };
         cfg.direction = null;
      }
      if (cfg.offset && typeof cfg.offset === 'object') {
         if (cfg.horizontalAlign) {
            cfg.horizontalAlign.offset = cfg.offset.horizontal;
         } else {
            cfg.horizontalAlign = { offset: cfg.offset.horizontal };
         }
         if (cfg.verticalAlign) {
            cfg.verticalAlign.offset = cfg.offset.vertical;
         } else {
            cfg.verticalAlign = { offset: cfg.offset.vertical };
         }
         cfg.offset = null;
      }

      // Если задали direction, то берем его (для исключительных случаев, задавать его не должны, т.к. это старое api)
      if (cfg.direction) {
         newCfg.dialogOptions.direction = cfg.direction;
      } else {
         // Пытаемся совместить старое и новое api
         if (cfg.horizontalAlign && cfg.horizontalAlign.side) {
            newCfg.dialogOptions.direction = cfg.horizontalAlign.side;
            if (newCfg.dialogOptions.direction === 'center') {
               newCfg.dialogOptions.direction = '';
            }
         } else {
            // Для стека всегда значение left, иначе ломается анимация
            if (cfg._type === 'stack') {
               newCfg.dialogOptions.direction = 'left';
            } else {
               newCfg.dialogOptions.direction = 'right';
            }
         }
      }

      if (cfg.verticalAlign && cfg.verticalAlign.side) {
         newCfg.dialogOptions.verticalAlign = revertPosition[cfg.verticalAlign.side];
      }
      if (cfg.verticalAlign && cfg.verticalAlign.offset) {
         newCfg.dialogOptions.offset = newCfg.dialogOptions.offset || {};
         newCfg.dialogOptions.offset.y = cfg.verticalAlign.offset;
      }
      if (cfg.horizontalAlign && cfg.horizontalAlign.offset) {
         newCfg.dialogOptions.offset = newCfg.dialogOptions.offset || {};
         newCfg.dialogOptions.offset.x = cfg.horizontalAlign.offset;
      }

      if (cfg.corner && cfg.corner.vertical === 'bottom') {
         newCfg.dialogOptions.verticalAlign = 'bottom';
      }

      if (cfg.corner && cfg.corner.horizontal) {
         newCfg.dialogOptions.side = cfg.corner.horizontal;
      }

      newCfg.dialogOptions.title = cfg.title;

      if (cfg.offset) {
         newCfg.dialogOptions.offset = cfg.offset;
      }

      if (cfg.closeOnTargetScroll) {
         newCfg.dialogOptions.closeOnTargetScroll = true;
      }

      if (cfg.className) {
         newCfg.dialogOptions.className = cfg.className;
      }

      if (cfg.hasOwnProperty('showOnControlsReady')) {
         newCfg.dialogOptions.showOnControlsReady = cfg.showOnControlsReady;
      } else {
         newCfg.dialogOptions.showOnControlsReady = false;
      }

      if (cfg.hasOwnProperty('autoCloseOnHide')) {
         newCfg.dialogOptions.autoCloseOnHide = cfg.autoCloseOnHide;
      } else {
         newCfg.dialogOptions.autoCloseOnHide = true;
      }

      if (cfg.minWidth || optFromTmpl.minWidth) {
         newCfg.dialogOptions.minWidth = cfg.minWidth || optFromTmpl.minWidth;
      }
      if (cfg.width) {
         newCfg.dialogOptions.width = cfg.width;
      }

      if (cfg.maxWidth || optFromTmpl.maxWidth) {
         newCfg.dialogOptions.maxWidth = cfg.maxWidth || optFromTmpl.maxWidth;
      }
      if (cfg.minimizedWidth || optFromTmpl.minimizedWidth) {
         newCfg.dialogOptions.minimizedWidth = cfg.minimizedWidth || optFromTmpl.minimizedWidth;
      }

      if (newCfg.target) {
         this._prepareTarget(newCfg);
         if (cfg.mode === 'floatArea') {
            newCfg.dialogOptions.fitWindow = true;
         }
         if (cfg.locationStrategy === 'fixed' || cfg.fittingMode === 'fixed') {
            newCfg.dialogOptions.flipWindow = false;
         }
      }

      if (newCfg.hasOwnProperty('maximize')) {
         newCfg.dialogOptions.maximize = newCfg.maximize;
      }

      if (newCfg.eventHandlers && newCfg.eventHandlers.onResult) {
         newCfg.dialogOptions.onResultHandler = newCfg.eventHandlers.onResult;
      }

      if (newCfg.eventHandlers && newCfg.eventHandlers.onClose) {
         newCfg.dialogOptions.onCloseHandler = newCfg.eventHandlers.onClose;
      }

      if (newCfg._events && newCfg._events.onClose) {
         newCfg.dialogOptions.onCloseHandlerEvent = newCfg._events.onClose;
      }

      if (newCfg._events && newCfg._events.onResult) {
         newCfg.dialogOptions.onResultHandlerEvent = newCfg._events.onResult;
      }

      if (newCfg._events && newCfg._events.onOpen) {
         newCfg.dialogOptions.onOpenHandlerEvent = newCfg._events.onOpen;
      }

      if (newCfg.hasOwnProperty('maximized')) {
         newCfg.dialogOptions.maximized = newCfg.maximized;
         newCfg.componentOptions.maximized = newCfg.maximized;
      }

      return newCfg;
   },

   _prepareTarget(cfg) {
      cfg.dialogOptions.target = $(cfg.target);
   },

   // Берем размеры либо с опций, либо с дименшенов
   _setSizes(cfg, templateClass) {
      const dimensions = templateClass ? this._getDimensions(templateClass) : {};
      const templateOptions = templateClass ? this._getTemplateOptions(templateClass) : {};
      const minWidth = dimensions.minWidth || templateOptions.minWidth;
      const maxWidth = dimensions.maxWidth || templateOptions.maxWidth;
      const width = dimensions.width || templateOptions.width;
      const height = dimensions.height || templateOptions.height;
      const minHeight = dimensions.minHeight || templateOptions.minHeight;
      const maxHeight = dimensions.maxHeight || templateOptions.maxHeight;

      cfg.width = parseInt(cfg.width || width, 10) || null;
      cfg.minWidth = parseInt(cfg.minWidth || minWidth, 10) || null;
      cfg.maxWidth = parseInt(cfg.maxWidth || maxWidth, 10) || null;
      cfg.height = parseInt(cfg.height || height, 10) || null;
      cfg.minHeight = parseInt(cfg.minHeight || minHeight, 10) || null;
      cfg.maxHeight = parseInt(cfg.maxHeight || maxHeight, 10) || null;

      if (!cfg.minHeight && dimensions.height) {
         // дименшены задают высоту шаблона. если есть шапка, то нужно учесть и ее высоту
         cfg.minHeight = parseInt(dimensions.height, 10) + (cfg.templateOptions.caption ? 40 : 0);
      }

      if (!cfg.minHeight) { // нет размеров - строимся по контенту
         cfg.autoHeight = true;
      }
      if (!cfg.minWidth) { // нет размеров - строимся по контенту
         cfg.autoWidth = true;
      }
   },

   _getCaption(cfg, templateClass) {
      const dimensions = this._getDimensions(templateClass);
      const compoundAreaOptions = cfg.templateOptions;
      const templateOptions = this._getTemplateOptions(templateClass);
      return cfg.title || cfg.caption ||
         dimensions.title || dimensions.caption ||
         templateClass.caption || templateClass.title ||
         compoundAreaOptions.title || compoundAreaOptions.caption ||
         templateOptions.title || templateOptions.caption;
   },

   _getDimensions(templateClass) {
      return templateClass.dimensions || (templateClass.prototype && templateClass.prototype.dimensions) || {};
   },

   _getTemplateOptions(templateClass) {
      const initializer = (templateClass.prototype || templateClass)._initializer; // опции можно достать не везде
      return initializer ? OpenDialogUtil.getOptionsFromProto(templateClass) : {};
   }
};

export default BaseOpener;
