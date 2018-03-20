/// <amd-module name="Controls/File/Attach/Lazy" />
import Base = require("Controls/File/Attach/Base");
import CoreExtend = require('Core/core-simpleExtend');
import GetterContainerLazy = require("Controls/File/Attach/Container/GetterLazy");
import SourceContainerLazy = require("Controls/File/Attach/Container/SourceLazy");

/**
 * Класс, наследник Attach/Base, позволяющий регестрировать динамично подгружаемые экземпляры {@link Controls/File/IResourceGetter} и {@link WS.Data/Source/ISource}
 * @public
 * @class Controls/File/Attach/Lazy
 * @extends Controls/File/Attach/Base
 * @author Заляев А.В.
 */
let Lazy  = CoreExtend.extend(Base, {
    constructor(){
        Lazy.superclass.constructor.apply(this, arguments);
        this._getterContainer = new GetterContainerLazy();
        this._sourceContainer = new SourceContainerLazy();
    },
    /**
     * Ленивая регестрация экземпляров IResourceGetter, для получения файлов
     * @param {String} name Имя модуля
     * @param {String} link Сылка на модуль
     * @param {*} [options] Параметры вызова конструктора
     * @void
     */
    registerLazyGetter(name: string, link: string, options?) {
        return this._getterContainer.register(name, link, options);
    },
    /**
     * Ленивая регестрация ISource
     * @param {Function} fileType Конструктор обёртки над ресурсом
     * @param {String} link Ссылка на источник данных
     * @param {*} [options] Параметры вызова конструктора обёртки
     * @void
     */
    registerLazySource(fileType: Function, link: string, options?: any) {
        return this._sourceContainer.register(fileType, link, options);
    }
});
export = Lazy;
