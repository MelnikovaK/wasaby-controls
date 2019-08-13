import Control = require('Core/Control');
import Template = require('wml!Controls/_popup/Opener/BaseOpener');
import ManagerController = require('Controls/_popup/Manager/ManagerController');
import Vdom = require('Vdom/Vdom');
import CoreMerge = require('Core/core-merge');
import cInstance = require('Core/core-instance');
import Env = require('Env/Env');
import Deferred = require('Core/Deferred');
import Indicator = require('Core/Indicator');
import isNewEnvironment = require('Core/helpers/isNewEnvironment');
import {parse as parserLib, load} from 'Core/library';

var _private = {
    clearPopupIds: function (popupIds, opened, displayMode) {
        if (!opened && displayMode === 'single') {
            popupIds.length = 0;
        }
    },
    compatibleOpen: function (self, cfg, controller): Promise<string | undefined> {
        return new Promise((resolve) => {
            requirejs(['Lib/Control/LayerCompatible/LayerCompatible'], function (Layer) {
                Layer.load().addCallback(function () {
                    self._openPopup(cfg, controller).then(popupId => resolve(popupId));
                });
            });
        });
    }
};

/**
 * Base Popup opener
 * @category Popup
 * @class Controls/_popup/Opener/BaseOpener
 * @mixes Controls/interface/IOpener
 * @control
 * @private
 * @author Красильников А.С.
 */
var Base = Control.extend({
    _template: Template,
    _actionOnScroll: 'none',
    _showOldIndicator: false,

    _beforeMount: function (options) {
        this._popupIds = [];
        this._showOldIndicator = options.showOldIndicator;
        if (options.displayMode && options.displayMode !== 'single') {
            Env.IoC.resolve('ILogger').error(this._moduleName, 'Вместо опции displayMode используйте открытие окна через статический метод openPopup');
        }
    },

    _afterMount: function () {
        this._openerUpdateCallback = this._updatePopup.bind(this);
        this._notify('registerOpenerUpdateCallback', [this._openerUpdateCallback], {bubbling: true});
    },

    _beforeUnmount: function () {
        this._notify('unregisterOpenerUpdateCallback', [this._openerUpdateCallback], {bubbling: true});
        this._toggleIndicator(false);
        if (this._options.closePopupBeforeUnmount) {
            if (this._useVDOM()) {
                this._popupIds.forEach(function (popupId) {
                    ManagerController.remove(popupId);
                });
            } else if (this._action) { // todo Compatible
                this._action.destroy();
                this._action = null;
            }
        }
    },
    open: function (popupOptions, controller): Promise<string | undefined> {
        return new Promise((resolve => {
            var cfg = this._getConfig(popupOptions || {});
            this._toggleIndicator(true);
            if (cfg.isCompoundTemplate) { // TODO Compatible: Если Application не успел загрузить совместимость - грузим сами.
                _private.compatibleOpen(this, cfg, controller).then(popupId => resolve(popupId));
            } else {
                this._openPopup(cfg, controller).then(popupId => resolve(popupId));
            }
        }));
    },

    // Сейчас ядро не умеет обновлять контрол, если другой контрол находится в ожидании построения
    // (на beforeMount вернул Promise). Поэтому сделан этот костыль, который открывает старый индикатор по опции.
    // Иначе при долгом построении индикатора загрузики вообще не будет
    // После того как ядро полечит проблему, костыль нужно удалить
    // TODO: https://online.sbis.ru/opendoc.html?guid=13e4d473-5b91-485b-8d9d-fcd2f1f80f72
    _compatibleCreatingDef(config, isCreating: boolean): void {
        if (isCreating) {
            if (config.showOldIndicator) {
                config.creatingDef = new Deferred();
                config.creatingDef.addCallback(() => {
                    this._toggleIndicator(false);
                });
            }
        }
    },

    _openPopup: function (cfg, controller): Promise<string | undefined> {
        return new Promise((resolve => {
            this._requireModules(cfg, controller).addCallback((result) => {
                _private.clearPopupIds(this._popupIds, this.isOpened(), this._options.displayMode);
                const popupId = this._options.displayMode === 'single' ? this._getCurrentPopupId() : null;

                cfg._vdomOnOldPage = this._options._vdomOnOldPage;
                this._compatibleCreatingDef(cfg, !popupId);
                Base.showDialog(result.template, cfg, result.controller, popupId, this).addCallback((popupId) => {
                    if (!cfg.creatingDef) {
                        this._toggleIndicator(false);
                    }
                    if (this._useVDOM()) {
                        if (this._popupIds.indexOf(popupId) === -1) {
                            this._popupIds.push(popupId);
                        }
                        // Call redraw to create emitter on scroll after popup opening
                        this._forceUpdate();
                    } else {
                        this._action = popupId;
                    }
                    resolve(popupId);
                });
            }).addErrback(() => {
                this._toggleIndicator(false);
                resolve();
            });
        }));
    },

    _requireModules(cfg: string, controller: string) {
        return Base.requireModules(cfg, controller).then((results) => {
            // todo https://online.sbis.ru/opendoc.html?guid=b954dff3-9aa5-4415-a9b2-7d3430bb20a5
            // If Opener was destroyed while template loading, then don't open popup.
            if (!this._destroyed || this._options.closePopupBeforeUnmount === false) {
                return {
                    template: results[0],
                    controller: results[1]
                };
            }
            return new Error('Opener was destroyed');
        });
    },

    _getConfig(popupOptions: Object): Object {
        // TODO: Удалить 1 аргумент в getConfig
        let baseConfig = Base.getConfig({}, this._options, popupOptions);
        // if the .opener property is not set, then set the defaultOpener or the current control
        if (!baseConfig.hasOwnProperty('opener')) {
            baseConfig.opener = Vdom.DefaultOpenerFinder.find(this) || this;
        }
        if (baseConfig.actionOnScroll) {
            this._actionOnScroll = baseConfig.actionOnScroll;
        }
        this._prepareNotifyConfig(baseConfig);
        return baseConfig;
    },

    _prepareNotifyConfig: function (cfg) {
        this._notifyEvent = this._notifyEvent.bind(this);

        // Handlers for popup events
        cfg._events = {
            onOpen: this._notifyEvent,
            onResult: this._notifyEvent,
            onClose: this._notifyEvent
        };
    },

    _notifyEvent: function (eventName, args) {
        // Trim the prefix "on" in the event name
        var event = eventName.substr(2);
        this._notify(event, args);
    },

    _toggleIndicator: function (visible) {
        let message =  rk('Загрузка');
        if(!this._showOldIndicator) {
            if (visible) {
                var cfg = {
                    id: this._indicatorId,
                    message: message
                };
                this._indicatorId = this._notify('showIndicator', [cfg], {bubbling: true});
            } else if (this._indicatorId) {
                this._notify('hideIndicator', [this._indicatorId], {bubbling: true});
                this._indicatorId = null;
            }
        } else {
            if(visible){
                Indicator.setMessage(message,true)
            } else {
                Indicator.hide();
            }
        }
    },

    /**
     * Closes a popup
     * @function Controls/_popup/Opener/Base#close
     */
    close(id: string): void {
        const popupId: string = id || this._getCurrentPopupId();
        if (popupId) {
            Base.closeDialog(popupId).addCallback(() => {
                // todo: Перейти с массива на collection.list
                if (this._popupIds.indexOf(popupId) > -1) {
                    this._popupIds.splice(this._popupIds.indexOf(popupId), 1);
                }
            });
        } else if (!Base.isNewEnvironment() && this._action) {
            this._action.closeDialog();
        }
    },

    _scrollHandler: function (event) {
        if (this.isOpened() && event.type === 'scroll') {
            if (this._actionOnScroll === 'close') {
                this._closeOnTargetScroll();
            } else if (this._actionOnScroll === 'track') {
                this._updatePopup();
            }
        }
    },

    _updatePopup: function () {
        ManagerController.popupUpdated(this._getCurrentPopupId());
    },

    _closeOnTargetScroll: function () {
        this.close();
    },

    _getCurrentPopupId: function () {
        return this._popupIds[this._popupIds.length - 1];
    },

    /**
     * State of whether the popup is open
     * @function Controls/_popup/Opener/Base#isOpened
     * @returns {Boolean} Is popup opened
     */
    isOpened: function () {
        // todo Compatible: Для старого окружения не вызываем методы нового Manager'a
        if (this._useVDOM()) {
            return !!ManagerController.find(this._getCurrentPopupId());
        }
        if (this._action) {
            return !!this._action.getDialog();
        }
        return null;
    },
    _useVDOM: function () {
        return Base.isNewEnvironment() || this._options._vdomOnOldPage;
    }
});
Base.showDialog = function (rootTpl, cfg, controller, popupId, opener) {
    var def = new Deferred();

    if (Base.isNewEnvironment() || cfg._vdomOnOldPage) {
        if (!Base.isNewEnvironment()) {
            Base.getManager().addCallback(function () {
                Base.getZIndexUtil().addCallback(function (getZIndex) {
                    if (opener) {
                        cfg.zIndex = cfg.zIndex || getZIndex(opener);
                        cfg.theme = opener._options.theme;
                    }
                    Base._openPopup(popupId, cfg, controller, def);
                });
            });
        } else if (Base.isVDOMTemplate(rootTpl) && !(cfg.templateOptions && cfg.templateOptions._initCompoundArea)) {
            Base._openPopup(popupId, cfg, controller, def);
        } else {
            requirejs(['Controls/compatiblePopup'], function (compatiblePopup) {
                compatiblePopup.BaseOpener._prepareConfigForOldTemplate(cfg, rootTpl);
                Base._openPopup(popupId, cfg, controller, def);
            });
        }
    } else {
        var isFormController = false;
        var proto = rootTpl.prototype && rootTpl.prototype.__proto__;
        while (proto && !isFormController) {
            if (proto._moduleName === 'SBIS3.CONTROLS/FormController') {
                isFormController = true;
            }
            proto = proto.__proto__;
        }

        var deps = ['Controls/compatiblePopup'];

        if (isFormController) {
            deps.push('SBIS3.CONTROLS/Action/List/OpenEditDialog');
        } else {
            deps.push('SBIS3.CONTROLS/Action/OpenDialog');
        }

        if (typeof cfg.template === 'string') {
            var libInfo = parserLib(cfg.template);

            deps.push(libInfo.name);
        }

        // Нужно чтобы managerWrapper был построен до совместимости в панели, т.к. в нем
        // регистрируются Listener'ы, лежащие внутри шаблона. Не торможу построение ожиданием Deferred'a,
        // т.к. после выполняется еще несколько асинхронных операций, ожидающих в том числе этих же зависимостией.
        Base.getManager();

        requirejs(deps, (compatiblePopup, Action, Tpl) => {
            try {
                let templateFunction = Tpl;
                if (opener && opener._options.closeOnTargetScroll) {
                    cfg.closeOnTargetScroll = true;
                }

                // get module from library
                if (libInfo && libInfo.path.length !== 0) {
                    cfg.template = Tpl;
                    libInfo.path.forEach((key) => {
                        cfg.template = cfg.template[key];
                        templateFunction = cfg.template;
                    });
                }

                // get module from default export
                if (templateFunction && templateFunction.default) {
                    templateFunction = templateFunction.default;
                }

                var newCfg = compatiblePopup.BaseOpener._prepareConfigFromNewToOld(cfg, templateFunction || cfg.template);

                // Прокинем значение опции theme опенера, если другое не было передано в templateOptions.
                // Нужно для открытия окон на старых страницах'.
                if (opener && opener._options.theme) {
                    newCfg.templateOptions = newCfg.templateOptions || {};
                    newCfg.templateOptions.theme = newCfg.templateOptions.theme || opener._options.theme;
                }

                var action;
                if (!opener || !opener._action) {
                    action = new Action({
                        closeByFocusOut: true,
                    });
                } else {
                    action = opener._action;
                }

                var dialog = action.getDialog(),
                    compoundArea = dialog && dialog._getTemplateComponent();

                // Check, if opened VDOM template on oldPage (we have compatible layer), then try reload template.
                if (compoundArea && compoundArea._moduleName === 'Controls/compatiblePopup:CompoundArea' && !isFormController && compoundArea._options.template === newCfg.template) {
                    // Redraw template with new options
                    compatiblePopup.BaseOpener._prepareConfigForNewTemplate(newCfg);
                    compoundArea.setTemplateOptions(newCfg.componentOptions.templateOptions);
                    dialog.setTarget && dialog.setTarget($(newCfg.target));
                } else {
                    action.closeDialog();
                    action._isExecuting = false;
                    action.execute(newCfg);
                }
                def.callback(action);
            } catch (err) {
                Env.IoC.resolve('ILogger').error(Base.prototype._moduleName, 'Ошибка при открытии окна: ' + err.message);
            }

        });
    }
    return def;
};

Base.closeDialog = (popupId: any) => {
    // On old page all vdom popup opening by SBIS3 action
    if (cInstance.instanceOfMixin(popupId, 'SBIS3.CONTROLS/Action/Mixin/DialogMixin')) {
        //TODO: COMPATIBLE
        popupId.closeDialog();
    } else {
        return ManagerController.remove(popupId);
    }
};

// Lazy load template

/**
 *
 * @param config
 * @param controller
 * @return {Promise.<{template: Function; controller: Function}>}
 * @private
 */
Base.requireModules = (config, controller) => {
    return Promise.all([
        Base.requireModule(config.template),
        Base.requireModule(controller)
    ]).catch((error: Error) => {
        Env.IoC.resolve('ILogger').error(this._moduleName, error.message);
        return error;
    });
};

/**
 * @param {String | Function} module
 * @return {Promise.<Function>}
 * @private
 */
Base.requireModule = function (module) {
    if (typeof module === 'string') {
        const parsedModule = parserLib(module);
        if (!require.defined(parsedModule.name)) {
            return load(module);
        }
        let mod = require(parsedModule.name);
        if (parsedModule.path.length) {
            parsedModule.path.forEach((property) => {
                if (mod && typeof mod === 'object' && property in mod) {
                    mod = mod[property];
                }
            });
        }

        // It's not a library notation so mind the default export for ES6 modules
        if (mod && mod.__esModule && mod.default) {
            mod = mod.default;
        }
        return Promise.resolve(mod);
    }
    return Promise.resolve(module);
};

Base.getConfig = function(baseConfig, options, popupOptions) {
    // todo https://online.sbis.ru/opendoc.html?guid=770587ec-2016-4496-bc14-14787eb8e713
    // Возвращаю правки. usedOptions - набор опций, которые мы берем с opener'a (с opener._options) и передаем в окно.
    // Все опции опенера брать нельзя, т.к. ядро добавляет свои опции опенеру (в режиме совместимости), которые на окно
    // попасть не должны.
    const usedOptions = [
        'showOldIndicator',
        'closeByExternalClick',
        'isCompoundTemplate',
        'eventHandlers',
        'autoCloseOnHide',
        'autoClose',
        'type',
        'style',
        'message',
        'details',
        'yesCaption',
        'noCaption',
        'cancelCaption',
        'okCaption',
        'autofocus',
        'isModal',
        'modal',
        'closeOnOutsideClick',
        'closeOnTargetScroll',
        'className',
        'template',
        'templateOptions',
        'minWidth',
        'maxWidth',
        'maximize',
        'width',
        'resizable',
        'top',
        'autoHide',
        'left',
        'maxHeight',
        'minHeight',
        'draggable',
        'horizontalAlign',
        'verticalAlign',
        'offset',
        'direction',
        '_vdomOnOldPage',
        'corner',
        'targetPoint',
        'targetTracking',
        'locationStrategy',
        'actionOnScroll'
    ];

    // merge _options to popupOptions
    for (let i = 0; i < usedOptions.length; i++) {
        const option = usedOptions[i];
        if (options[option] !== undefined) {
            baseConfig[option] = options[option];
        }
    }

    delete baseConfig.theme; // todo fix?

    const templateOptions = {};
    CoreMerge(templateOptions, baseConfig.templateOptions || {});
    CoreMerge(templateOptions, popupOptions.templateOptions || {});
    const baseCfg = {...baseConfig, ...popupOptions, templateOptions};

    if (baseCfg.hasOwnProperty('closeOnTargetScroll')) {
        Env.IoC.resolve('ILogger').error(Base.prototype._moduleName, 'Use option "actionOnScroll" instead of "closeOnTargetScroll"');
        if (baseCfg.closeOnTargetScroll) {
            baseCfg.actionOnScroll = 'close';
        }
    }
    if (baseCfg.hasOwnProperty('targetTracking')) {
        Env.IoC.resolve('ILogger').error(Base.prototype._moduleName, 'Use option "actionOnScroll" instead of "targetTracking"');
        if (baseCfg.targetTracking) {
            baseCfg.actionOnScroll = 'track';
        }
    }

    if (baseCfg.hasOwnProperty('corner')) {
        Env.IoC.resolve('ILogger').error(Base.prototype._moduleName, 'Используется устаревшая опция corner, используйте опцию targetPoint');
    }
    if (baseCfg.hasOwnProperty('verticalAlign') || baseCfg.hasOwnProperty('horizontalAlign')) {
        Env.IoC.resolve('ILogger').warn(Base.prototype._moduleName, 'Используются устаревшие опции verticalAlign и horizontalAlign, используйте опции offset и direction');
    }

    return baseCfg;
};

Base.getZIndexUtil = function () {
    var deferred = new Deferred();
    var module = 'Controls/Utils/getZIndex';
    if (requirejs.defined(module)) {
        return deferred.callback(requirejs(module));
    }
    requirejs([module], function (getZIndex) {
        return deferred.callback(getZIndex);
    });
    return deferred;
};

Base._openPopup = function (popupId, cfg, controller, def) {
    if (popupId) {
        if (ManagerController.isPopupCreating(popupId)) {
            ManagerController.updateOptionsAfterInitializing(popupId, cfg);
        } else {
            popupId = ManagerController.update(popupId, cfg);
        }
        def.callback(popupId);
    } else {
        popupId = ManagerController.show(cfg, controller);
        def.callback(popupId);
    }
};

Base.getDefaultOptions = function () {
    return {
        closePopupBeforeUnmount: true,
        actionOnScroll: 'none',
        displayMode: 'single',
        _vdomOnOldPage: false // Always open vdom panel
    };
};

// TODO Compatible
Base.isVDOMTemplate = function (templateClass) {
    return !!(templateClass.prototype && templateClass.prototype._template) || !!templateClass.stable || !!(templateClass[0] && templateClass[0].func);
};

// TODO Compatible
Base.isNewEnvironment = function () {
    return isNewEnvironment();
};

// TODO Compatible
Base.getManager = function () {
    var managerContainer = document.body.querySelector('.controls-PopupContainer');
    var deferred = new Deferred();
    if (!managerContainer) {
        managerContainer = document.createElement('div');
        managerContainer.classList.add('controls-PopupContainer');
        document.body.insertBefore(managerContainer, document.body.firstChild);

        require(['Core/Control', 'Controls/compatiblePopup'], function (control, compatiblePopup) {
            var wrapper = control.createControl(compatiblePopup.ManagerWrapper, {}, managerContainer);

            // wait until the Manager is added to the DOM
            if (!wrapper._mounted) {
                var intervalId = setInterval(function () {
                    if (wrapper._mounted) {
                        clearInterval(intervalId);
                        deferred.callback();
                    }
                }, 20);
            } else {
                deferred.callback();
            }
        });
        return deferred;
    }
    return deferred.callback();
};

Base._private = _private;

export = Base;

