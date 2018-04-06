/// <amd-module name="File/Attach/Option/Getters/PhotoCam" />

import ResourceGetter = require("File/Attach/Option/ResourceGetter");

const GETTER_LINK = "File/ResourceGetter/PhotoCam";
const GETTER_TYPE = "PhotoCam";

/**
 * Класс конфигурации IResourceGetter для получения снимков с камеры, передаваемый в Attach
 * @class
 * @name File/Attach/Option/Getters/PhotoCam
 * @extends File/Attach/Option/ResourceGetter
 * @public
 * @author Заляев А.В.
 */
class PhotoCam extends ResourceGetter {
    /**
     * @param {*} [options] Параметры вызова конструктора
     * @constructor
     * @see File/IResourceGetter
     */
    constructor (options?: any) {
        super (GETTER_LINK, GETTER_TYPE, options || {});
    }
}
export = PhotoCam;
