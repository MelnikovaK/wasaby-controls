/// <amd-module name="Controls/File/ResourceGetter/PhotoCam" />
define("Controls/File/ResourceGetter/PhotoCam", ["require", "exports", "tslib", "Controls/File/ResourceGetter/Base", "Core/Deferred", "Core/detection", "Core/core-merge", "SBIS3.CONTROLS/Action/OpenDialog"], function (require, exports, tslib_1, IResourceGetterBase, Deferred, detection, merge, OpenDialog) {
    "use strict";
    var DIALOG = "Controls/File/ResourceGetter/PhotoCam/Dialog";
    var DIALOG_PLUGIN = "Controls/File/ResourceGetter/PhotoCam/DialogPlugin";
    var DEFAULT = {
        openDialog: {
            mode: "dialog",
            dialogOptions: {
                autoHeight: true,
                resizeable: false,
                autoWidth: true,
                /**
                 * Проверить доступность камеры можно только попробовав к ней подключиться
                 * В случаях, если
                 * а) пльзователь уже запретил доступ к камере
                 * б) обращение к медиа-девайсам запрещено политиками безопасности
                 * в) камера отсуствует
                 * то получим эффект "моргания окошка" которое отрисовывает текст инициализации и тут же дестроится
                 *
                 * поэтому скрываем диалоговое окно по умолчанию
                 */
                visible: false
            },
            template: detection.isIE10 || detection.isIE11 ? // В IE нет поддержки userMedia в Edge всё норм
                DIALOG_PLUGIN :
                DIALOG
        }
    };
    /**
     * Класс, для получения фотографии с камеры, реализующий интерфейс IResourceGetter
     * @class
     * @name Controls/File/ResourceGetter/PhotoCam
     * @extends Controls/File/ResourceGetter/Base
     * @public
     * @author Заляев А.В.
     */
    var PhotoCam = /** @class */ (function (_super) {
        tslib_1.__extends(PhotoCam, _super);
        function PhotoCam(opt) {
            var _this = _super.call(this) || this;
            _this.name = "PhotoCam";
            _this._$options = merge(merge({}, DEFAULT), opt || {});
            _this._openDialog = new OpenDialog(_this._$options.openDialog);
            return _this;
        }
        /**
         * Осуществляет получение изображения с веб-камеры устройства
         * @return {Core/Deferred<Array<Controls/File/LocalFile | Controls/File/LocalFileLink>>}
         * @method
         * @name Controls/File/ResourceGetter/PhotoCam#getFiles
         * @see Controls/File/LocalFile
         * @see Controls/File/LocalFileLink
         */
        PhotoCam.prototype.getFiles = function () {
            var _this = this;
            if (this.isDestroy()) {
                return Deferred.fail("Resource getter is destroyed");
            }
            this._chooseDef = new Deferred().addBoth(function (result) {
                _this._chooseDef = null;
                return result;
            });
            this._openDialog.execute({
                componentOptions: {
                    resultDeferred: this._chooseDef
                }
            }).addErrback(function (err) {
                _this._chooseDef.errback(err);
            });
            return this._chooseDef;
        };
        ;
        /**
         * Возможен ли выбор файлов
         * @return {Core/Deferred<Boolean>}
         * @method
         * @name Controls/File/ResourceGetter/PhotoCam#canExec
         */
        PhotoCam.prototype.canExec = function () {
            return Deferred.success(!this._chooseDef);
        };
        return PhotoCam;
    }(IResourceGetterBase));
    return PhotoCam;
});
