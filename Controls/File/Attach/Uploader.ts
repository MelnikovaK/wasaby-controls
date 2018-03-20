/// <amd-module name="Controls/File/Attach/Uploader" />
// dependency for types
import Model = require('WS.Data/Entity/Model');
import ISource = require("WS.Data/Source/ISource");
import SourceContainer = require("Controls/File/Attach/Container/Source");
import EventObject = require("Core/EventObject");
// real dependency
import Deferred = require("Core/Deferred");
import ParallelDeferred = require("Core/ParallelDeferred");

type CreateHandler = (data: any, file: IFileData) => void;
type EventNames = "onLoaded" | "onProgress" | "onWarning" | "onLoadedFolder"
    | "onLoadResourceError" | "onLoadResource" | "onLoaded" | "onLoadError";
type CreateHandlers = {
    [propName in EventNames]?: CreateHandler;
}

/**
 * Класс для агрегации загрузки через нескольких источников данных
 * @class
 * @name Controls/File/Attach/Uploader
 * @author Заляев А.В.
 */
class Uploader {
    /**
     * @cfg {Controls/File/Attach/Container/Source} container
     */
    /**
     * @cfg {String} fileProperty Имя параметра, содержащее отправляемый файл
     */
    private _container: SourceContainer;
    /**
     * @cfg {Function} notify Обработчик событий источников данных
     */
    private _notify: (eventName: string, ...args) => void;
    /**
     * Список событий, необходимых к пробрасыванию от ISource
     * @type {Array<String>}
     * @private
     */
    private _events: Array<string> = ["onProgress", "onWarning", "onLoadedFolder"];
    /**
     *
     * @param {Controls/File/Attach/Container/Source} container
     * @param {String} fileProperty
     * @param {Function} notify
     * @constructor
     * @name Controls/File/Attach/Uploader
     */
    constructor(container: SourceContainer, private fileProperty: string = "File", notify) {
        if (!container || !(container instanceof SourceContainer)) {
            throw new Error("Invalid arguments");
        }
        this._container = container;
        this._notify = notify;
    }

    /**
     *
     * @param {Array<Controls/File/IFileData>} files Загружаемые файлы
     * @param {Object} [meta] Дополнительные мета-данные для отправки
     * @param {Object<Function>} [handlers]
     * @return {Core/Deferred<Array<WS.Data/Entity/Model | Error>>}
     * @name Controls/File/Attach/Uploader#upload
     * @method
     */
    upload(files: Array<IFileData>, meta?: {}, handlers?: CreateHandlers): Deferred<Array<Model | Error>> {
        let uploadDefArray: Array<Deferred<Model | Error>>;

        uploadDefArray = files.map((file: IFileData) => {
            return this._uploadFile(file, meta);
        });
        let len = uploadDefArray.length;
        return new ParallelDeferred({
            steps:            uploadDefArray,
            stopOnFirstError: false
        }).done().getResult().addCallbacks((results) => {
            let array = results;
            if (!(results instanceof Array)) {
                array.length = len;
                array = Array.prototype.slice.call(array);
            }
            this._notify("onLoaded", array);
            return array;
        }, (error) => {
            this._notify("onLoadError", error);
            return error;
        });
    }

    /**
     * загрузка одного файла через ISource полученный из SourceContainer
     * @param {Controls/File/IFileData} file Загружаемый файл
     * @param {Object} [meta] Дополнительные мета-данные для отправки
     * @return {Core/Deferred<WS.Data/Entity/Model | Error>}
     * @private
     * @name Controls/File/Attach/Uploader#_uploadFile
     * @method
     */
    private _uploadFile(file: IFileData, meta?: {}): Deferred<Model | Error> {
        return this._container.get(file).addCallback((source: ISource) => {
            this._subscribeToSource(source);
            return source.create(meta || {}, file);
        }).addCallbacks((result: Model) => {
            this._notify("onLoadedResource", file, result);
            return result;
        }, (error: Error) => {
            this._notify("onLoadResourceError", file, error);
            return error;
        });
    }

    /**
     * Подписка на события ISource для их дальнейшего проброса
     * @param {WS.Data/Source/ISource} source
     * @private
     */
    private _subscribeToSource (source: ISource) {
        if (source.__attachSubscribed) {
            return;
        }
        this._events.forEach((eventName) => {
            source.subscribe(eventName, (event: EventObject, ...args) => {
                this._notify(eventName, ...args);
            })
        });
        source.__attachSubscribed = true;
    }
}

export = Uploader;
