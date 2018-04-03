/// <amd-module name="File/Attach/Container/Source" />
import IContainer = require("File/Attach/Container/IContainer");
import ISource = require("WS.Data/Source/ISource");
import Deferred = require("Core/Deferred");
import {IFileDataConstructor} from "File/IFileDataConstructor";
import {IFileData} from "File/IFileData";

type SourceWrapper = {
    fileType: IFileDataConstructor;
    source: ISource;
}

let filterForType = (wrappers: Array<SourceWrapper>, fileData: IFileDataConstructor) => {
    return wrappers.filter((sourceObj) => {
        return fileData == sourceObj.fileType;
    });
};
/**
 * Класс для хранения экземпляров ISource по типам отправляеммых файлов
 * @class File/Attach/Container/Source
 * @author Заляев А.В.
 * @private
 */
class SourceContainer implements IContainer<ISource> {
    private _sourceWrappers: Array<SourceWrapper>;

    constructor() {
        this._sourceWrappers = [];
    }

    /**
     * Регистрация источников данных для загрузки определённого типа ресурса
     * @param {Core/Deferred<ISource>} source источник данных
     * @param {File/IFileDataConstructor} FileData конструктор обёртки над ресурсом
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    push(source: ISource, FileData: IFileDataConstructor) {
        if (!(FileData instanceof Function)) {
            throw new Error("Invalid type of the first argument, expected constructor");
        }
        // Если для данного типа файла ISource уже зарегестрирован - поменяем его. нет - добавим
        let registeredSource = filterForType(this._sourceWrappers, FileData)[0];
        if (registeredSource) {
            registeredSource.source = source || registeredSource.source;
            return;
        }
        this._sourceWrappers.push({
            source,
            fileType: FileData
        });
    }
    /**
     * Зарегестрирован ли для текущего ресурса источник данных
     * @param {IFileData} file
     * @return {boolean}
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    has(file: IFileData): boolean {
        return !!this._get(file);
    }
    /**
     * Возвращает источник данных для ресурса
     * @param {IFileData} file
     * @return {Core/Deferred<ISource>}
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    get(file: IFileData): Deferred<ISource> {
        let source = this._get(file);
        return Deferred.success(
            source ||
            new Error("Not registered source for this file type")
        );
    }
    /**
     * Возвращает список зарегестрированый обёрток
     * @return {Array<IFileDataConstructor>}
     * @see File/LocalFile
     * @see File/LocalFileLink
     * @see File/HttpFileLink
     */
    getRegisteredResource(): Array<IFileDataConstructor> {
        return this._sourceWrappers.map((wrapper) => {
            return wrapper.fileType;
        })
    }
    private _get(file: IFileData): ISource {
        let wrapper = this._sourceWrappers.filter((wrapper) => {
            return file instanceof wrapper.fileType;
        })[0];
        return wrapper && wrapper.source;
    }
    destroy() {
        this._sourceWrappers = [];
    }
}

export = SourceContainer
