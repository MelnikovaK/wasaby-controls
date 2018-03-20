/// <amd-module name="Controls/File/Attach/Option/Source" />
define("Controls/File/Attach/Option/Source", ["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * Класс конфигурации ISource, передаваемый в Attach
     * @class
     * @name Controls/File/Attach/Option/Source
     * @public
     * @see Controls/File/Attach
     * @author Заляев А.В.
     */
    var SourceOption = /** @class */ (function () {
        /**
         * @cfg {String} source Ссылка на модуль источника данных ISource
         * @see WS.Data/Source/ISource
         */
        /**
         * @cfg {FunctionConstructor} resourceType Конструктор обёртки над ресурсом
         * @see Controls/File/LocalFile
         * @see Controls/File/LocalFileLink
         * @see Controls/File/HttpFileLink
         */
        /**
         * @cfg {Object} options Объект параметров для конструктора ISource
         * @see WS.Data/Source/ISource
         */
        function SourceOption(source, resourceType, options) {
            this.source = source;
            this.resourceType = resourceType;
            this.options = options;
        }
        /**
         * Возвращает ссылку на модуль с регестрируемым источником данных
         * @return {string}
         * @name Controls/File/Attach/Option/Source#getSourceName
         */
        SourceOption.prototype.getSourceName = function () {
            return this.source;
        };
        /**
         * Параметры вызова конструктора
         * @return {*}
         * @name Controls/File/Attach/Option/Source#getOptions
         */
        SourceOption.prototype.getOptions = function () {
            return this.options;
        };
        /**
         * Возвращает конструктор ресурса, для которого будет зарегестрирован источник
         * @return {Controls/File/IFileDataConstructor}
         * @name Controls/File/Attach/Option/Source#getResourceType
         */
        SourceOption.prototype.getResourceType = function () {
            return this.resourceType;
        };
        return SourceOption;
    }());
    return SourceOption;
});
